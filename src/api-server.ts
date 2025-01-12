import http from 'http';
import { HueSyncBoxPlatform } from './platform';
import { State } from './state';

export class ApiServer {
  private readonly platform: HueSyncBoxPlatform;
  private server?: http.Server;

  constructor(platform: HueSyncBoxPlatform) {
    this.platform = platform;
  }

  public start() {
    const { apiServerPort, apiServerToken } = this.platform.config;
    if (!apiServerPort || !apiServerToken) {
      this.platform.log.error(
        'API server cannot start due to missing configuration.'
      );
      return;
    }

    try {
      this.server = http
        .createServer((request, response) => {
          const payload: unknown[] = [];

          request
            .on('error', e =>
              this.platform.log.error(
                'API - Error received.',
                JSON.stringify(e)
              )
            )
            .on('data', chunk => payload.push(chunk))
            .on('end', async () => {
              response.on('error', () =>
                this.platform.log.error('API - Error sending the response.')
              );

              if (request.headers['authorization'] !== apiServerToken) {
                this.platform.log.debug(
                  'Authorization header missing or invalid.'
                );
                response.statusCode = 401;
                response.write(JSON.stringify({ error: 'Unauthorized' }));
                response.end();
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
                  response.statusCode = 405;
                  response.end();
              }
            });
        })
        .listen(apiServerPort, '0.0.0.0');
    } catch (e) {
      this.platform.log.error('API could not be started: ' + JSON.stringify(e));
    }
    this.platform.log.info('API server started.');
  }

  private async handleGet(response: http.ServerResponse) {
    try {
      this.platform.log.debug('GET request received.');
      const state = await this.platform.client.getState();
      response.setHeader('Content-Type', 'application/json');
      response.write(JSON.stringify(state));
      response.statusCode = 200;
    } catch (e) {
      this.platform.log.error('Error while getting the state.', e);
      response.statusCode = 500;
      response.write(
        JSON.stringify({
          error: 'An error occurred while processing your request.',
        })
      );
    } finally {
      response.end();
    }
  }

  private async handlePost(payload: unknown[], response: http.ServerResponse) {
    if (!payload.length) {
      response.statusCode = 400;
      response.write(JSON.stringify({ error: 'Body missing.' }));
      response.end();
      return;
    }

    let body: State | null = null;
    try {
      body = JSON.parse(Buffer.concat(payload as Uint8Array[]).toString());
      if (!body) {
        // noinspection ExceptionCaughtLocallyJS
        throw new Error('Body missing.');
      }
    } catch (e) {
      this.platform.log.error('Body malformed.', e);
      response.statusCode = 400;
      response.write(JSON.stringify({ error: 'Body malformed.' }));
      response.end();
      return;
    }

    try {
      if (body.execution) {
        await this.platform.client.updateExecution(body.execution);
      }
      if (body.hue) {
        await this.platform.client.updateHue(body.hue);
      }

      const newState = await this.platform.client.getState();
      response.statusCode = 200;
      response.write(JSON.stringify(newState));
    } catch (e) {
      this.platform.log.error('Error while updating the state.', e);
      response.statusCode = 500;
      response.write(
        JSON.stringify({
          error: 'An error occurred while processing your request.',
        })
      );
    } finally {
      response.end();
    }
  }
}
