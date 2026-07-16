import http from 'http';
import crypto from 'node:crypto';
import { HueSyncBoxPlatform } from './platform.js';
import {
  HTTP_STATUS_OK,
  HTTP_STATUS_UNAUTHORIZED,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_PAYLOAD_TOO_LARGE,
  HTTP_STATUS_METHOD_NOT_ALLOWED,
  HTTP_STATUS_INTERNAL_ERROR,
  MIN_API_TOKEN_LENGTH,
  MAX_API_BODY_BYTES,
  API_REQUEST_TIMEOUT_MS,
} from './lib/constants.js';
import {
  isPlainObject,
  validateExecution,
  validateHue,
} from './lib/validation.js';

export class ApiServer {
  private readonly platform: HueSyncBoxPlatform;
  private server?: http.Server;

  constructor(platform: HueSyncBoxPlatform) {
    this.platform = platform;
  }

  public start() {
    const { apiServerPort, apiServerToken } = this.platform.config;
    if (!apiServerPort) {
      this.platform.log.error(
        'API server cannot start due to missing configuration.'
      );
      return;
    }
    if (
      typeof apiServerToken !== 'string' ||
      apiServerToken.length < MIN_API_TOKEN_LENGTH
    ) {
      this.platform.log.error(
        `API server cannot start: apiServerToken must be a string at least ${MIN_API_TOKEN_LENGTH} characters long.`
      );
      return;
    }

    try {
      this.server = http.createServer((request, response) => {
        request.on('error', e =>
          this.platform.log.error('API - Error received.', e)
        );
        response.on('error', () =>
          this.platform.log.error('API - Error sending the response.')
        );

        // Authorization is checked before any body bytes are read, so an
        // unauthenticated caller can never force the server to buffer data.
        if (!this.isAuthorized(request, apiServerToken)) {
          this.platform.log.debug('Authorization header missing or invalid.');
          // No 'data' listener is attached, so the request stream never
          // resumes: any body the caller keeps sending is bounded by the
          // OS socket receive buffer (via normal TCP flow control), not by
          // application memory. That's what actually stops the DoS -
          // destroying the socket here would race the response write and
          // reset the connection before the client reads it.
          this.sendError(response, HTTP_STATUS_UNAUTHORIZED, 'Unauthorized');
          return;
        }

        const payload: Buffer[] = [];
        let receivedBytes = 0;
        let rejected = false;

        request
          .on('data', (chunk: Buffer) => {
            if (rejected) {
              return;
            }
            receivedBytes += chunk.length;
            if (receivedBytes > MAX_API_BODY_BYTES) {
              rejected = true;
              // Remaining chunks are still drained (and discarded) by this
              // same 'data' handler rather than buffered, bounding memory;
              // the server's requestTimeout bounds how long that continues.
              this.sendError(
                response,
                HTTP_STATUS_PAYLOAD_TOO_LARGE,
                'Payload too large.'
              );
              return;
            }
            payload.push(chunk);
          })
          .on('end', async () => {
            if (rejected) {
              return;
            }
            switch (request.method) {
              case 'GET':
                await this.handleGet(response);
                break;
              case 'POST':
                await this.handlePost(payload, response);
                break;
              default:
                this.platform.log.debug('No action matched.');
                response.statusCode = HTTP_STATUS_METHOD_NOT_ALLOWED;
                response.end();
            }
          });
      });
      // Without this listener, an async server error (e.g. EADDRINUSE from a
      // second Sync Box instance defaulting to the same port) is rethrown by
      // Node as an uncaught exception, which Homebridge treats as fatal to
      // the entire process rather than just this plugin.
      this.server.on('error', e => {
        this.platform.log.error('API server encountered an error.', e);
      });
      this.server.listen(apiServerPort, '0.0.0.0');
      this.server.requestTimeout = API_REQUEST_TIMEOUT_MS;
    } catch (e) {
      this.platform.log.error('API could not be started:', e);
    }
    this.platform.log.info('API server started.');
  }

  private isAuthorized(
    request: http.IncomingMessage,
    apiServerToken: string
  ): boolean {
    const provided = request.headers['authorization'];
    if (typeof provided !== 'string') {
      return false;
    }
    const providedBuffer = Buffer.from(provided);
    const tokenBuffer = Buffer.from(apiServerToken);
    if (providedBuffer.length !== tokenBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(providedBuffer, tokenBuffer);
  }

  private sendJson(
    response: http.ServerResponse,
    statusCode: number,
    body: unknown
  ) {
    response.statusCode = statusCode;
    response.end(JSON.stringify(body));
  }

  private sendError(
    response: http.ServerResponse,
    statusCode: number,
    message: string
  ) {
    this.sendJson(response, statusCode, { error: message });
  }

  private async handleGet(response: http.ServerResponse) {
    try {
      this.platform.log.debug('GET request received.');
      const state = await this.platform.client.getState();
      response.setHeader('Content-Type', 'application/json');
      this.sendJson(response, HTTP_STATUS_OK, state);
    } catch (e) {
      this.platform.log.error('Error while getting the state.', e);
      this.sendError(
        response,
        HTTP_STATUS_INTERNAL_ERROR,
        'An error occurred while processing your request.'
      );
    }
  }

  private async handlePost(payload: Buffer[], response: http.ServerResponse) {
    if (!payload.length) {
      this.sendError(response, HTTP_STATUS_BAD_REQUEST, 'Body missing.');
      return;
    }

    let body: unknown;
    try {
      body = JSON.parse(Buffer.concat(payload).toString());
    } catch (e) {
      this.platform.log.error('Body malformed.', e);
      this.sendError(response, HTTP_STATUS_BAD_REQUEST, 'Body malformed.');
      return;
    }

    if (!isPlainObject(body)) {
      this.sendError(
        response,
        HTTP_STATUS_BAD_REQUEST,
        'Body must be a JSON object.'
      );
      return;
    }

    let execution;
    if (Object.hasOwn(body, 'execution')) {
      const result = validateExecution(body.execution);
      if (!result.ok) {
        this.sendError(response, HTTP_STATUS_BAD_REQUEST, result.error);
        return;
      }
      execution = result.value;
    }

    let hue;
    if (Object.hasOwn(body, 'hue')) {
      // Validated against live device state so only a groupId that actually
      // exists can be forwarded.
      const currentState = await this.platform.client.getState();
      const result = validateHue(body.hue, currentState);
      if (!result.ok) {
        this.sendError(response, HTTP_STATUS_BAD_REQUEST, result.error);
        return;
      }
      hue = result.value;
    }

    try {
      if (execution) {
        await this.platform.client.updateExecution(execution);
      }
      if (hue) {
        await this.platform.client.updateHue(hue);
      }

      const newState = await this.platform.client.getState();
      this.sendJson(response, HTTP_STATUS_OK, newState);
    } catch (e) {
      this.platform.log.error('Error while updating the state.', e);
      this.sendError(
        response,
        HTTP_STATUS_INTERNAL_ERROR,
        'An error occurred while processing your request.'
      );
    }
  }
}
