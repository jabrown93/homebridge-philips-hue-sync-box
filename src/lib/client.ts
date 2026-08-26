import fetch, { RequestInit } from 'node-fetch';

import { Execution, Hue, State } from '../state.js';
import * as https from 'node:https';
import { Logger } from 'homebridge';
import { HueSyncBoxPlatformConfig } from '../config.js';
import AsyncLock, { AsyncLockOptions } from 'async-lock';
import {
  HTTP_RETRY_COUNT,
  HTTP_RETRY_BASE_DELAY_MS,
  MAX_SYNC_BOX_RESPONSE_BYTES,
  SYNC_BOX_REQUEST_TIMEOUT_MS,
  SYNC_BOX_REQUEST_BUDGET_MS,
  SYNC_BOX_LOCK_QUEUE_TIMEOUT_MS,
  SYNC_BOX_LOCK_MAX_EXECUTION_TIME_MS,
} from './constants.js';
import { isValidState } from './validation.js';
import { HSB_CA_CERT } from './hsb-ca-cert.js';

// Trusts only certs signed by Philips's Sync Box CA, but skips hostname
// verification: each box's leaf cert has its uniqueId as the CN, not its IP,
// and this plugin has no discovery step to learn that id ahead of connecting.
// This still rejects arbitrary/self-signed certs from an untrusted LAN host -
// it just can't distinguish this Sync Box's cert from another genuine one.
export function createSyncBoxAgent(): https.Agent {
  return new https.Agent({
    ca: HSB_CA_CERT,
    rejectUnauthorized: true,
    checkServerIdentity: () => undefined,
    keepAlive: true,
  });
}

// The Sync Box answered, it just answered badly - a bad status or a payload
// that isn't a state. Retrying only repeats the same answer, so these skip
// the retry loop while transport failures don't.
class SyncBoxResponseError extends Error {}

// Homebridge prints a full stack when handed an Error. These failures all
// unwind through node-fetch internals, so the stack costs a screen of log
// and says nothing the message doesn't.
function describeError(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export class SyncBoxClient {
  private readonly LOCK_KEY = 'sync-box';
  private readonly LOCK_OPTIONS: AsyncLockOptions = {
    timeout: SYNC_BOX_LOCK_QUEUE_TIMEOUT_MS,
    maxExecutionTime: SYNC_BOX_LOCK_MAX_EXECUTION_TIME_MS,
  };

  private readonly lock: AsyncLock;
  private readonly agent = createSyncBoxAgent();

  constructor(
    private readonly log: Logger | Console,
    private readonly config: HueSyncBoxPlatformConfig
  ) {
    this.lock = new AsyncLock();
  }

  // Serializes all Sync Box requests behind the shared lock.
  private withLock<T>(task: () => Promise<T>): Promise<T> {
    return this.lock.acquire(this.LOCK_KEY, task, this.LOCK_OPTIONS);
  }

  public async getState(): Promise<State | null> {
    try {
      return await this.withLock(() => this.sendRequest<State>('GET', ''));
    } catch (e) {
      // Polling retries on its own schedule, so a failed read is recoverable
      // on the next tick rather than an error the user has to act on.
      this.log.warn('Failed to get state from Sync Box:', describeError(e));
      return null;
    }
  }

  public async updateExecution(execution: Partial<Execution>): Promise<void> {
    try {
      await this.withLock(() =>
        this.sendRequest<void>('PUT', 'execution', execution)
      );
    } catch (e) {
      this.log.error('Error updating execution:', describeError(e));
    }
  }

  public async updateHue(hue: Partial<Hue>): Promise<void> {
    try {
      await this.withLock(() => this.sendRequest<void>('PUT', 'hue', hue));
    } catch (e) {
      this.log.error('Error updating hue:', describeError(e));
    }
  }

  /**
   * Runs one attempt end to end - headers, status, body, validation - under a
   * single AbortSignal, so a Sync Box that sends headers and then stalls
   * mid-body aborts inside the retry loop rather than after it.
   */
  private async attemptRequest<T>(
    url: string,
    options: RequestInit,
    method: string,
    deadline: number
  ): Promise<T> {
    const remaining = Math.max(deadline - Date.now(), 1);
    const res = await fetch(url, {
      ...options,
      signal: AbortSignal.timeout(
        Math.min(SYNC_BOX_REQUEST_TIMEOUT_MS, remaining)
      ),
    });
    if (!res.ok) {
      // A stalled error body must not mask the status that explains it.
      const detail = await res.text().catch(() => '<unreadable body>');
      this.log.error(
        `Error: ${res.status} - ${res.statusText}. ${detail.slice(0, 500)}`
      );
      throw new SyncBoxResponseError(
        `Error: ${res.status} - ${res.statusText}`
      );
    }
    if (method !== 'GET') {
      return null as T;
    }
    const json = await res.json();
    // Any host with a cert signed by Philips's Sync Box CA is accepted
    // regardless of hostname (see createSyncBoxAgent), so a LAN-adjacent
    // attacker with a genuine Sync Box's cert must not be able to hand every
    // accessory's update() a shape it dereferences unconditionally - that
    // already crashed the entire Homebridge process, not just this plugin's
    // accessories.
    if (!isValidState(json)) {
      throw new SyncBoxResponseError(
        'Sync Box returned a malformed state response.'
      );
    }
    return json as T;
  }

  /**
   * Retries transport-level failures - this client's own request timeout
   * included - under a single wall-clock budget.
   *
   * Every attempt gets a fresh AbortSignal. A shared signal stays aborted
   * once it fires, so a Sync Box that answered a hair too slowly used to
   * surface as an unretried AbortError even though the next poll succeeded.
   */
  private async sendRequest<T>(
    method: string,
    path: string,
    body?: Partial<Execution> | Partial<Hue> | null
  ): Promise<T> {
    const url = `https://${this.config.syncBoxIpAddress}/api/v1/${path}`;
    const options: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.syncBoxApiAccessToken}`,
      },
      method,
      body: body ? JSON.stringify(body) : null,
      agent: this.agent,
      // Aborts the response stream once it exceeds this many bytes, so a
      // spoofed oversized response can't be fully buffered by res.json()
      // before isValidState() gets a chance to reject it.
      size: MAX_SYNC_BOX_RESPONSE_BYTES,
    };

    this.log.debug(
      'Request to Sync Box:',
      url,
      JSON.stringify({
        ...options,
        headers: { ...options.headers, Authorization: '[REDACTED]' },
      })
    );

    const deadline = Date.now() + SYNC_BOX_REQUEST_BUDGET_MS;
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.attemptRequest<T>(url, options, method, deadline);
      } catch (e) {
        const backoff = Math.pow(2, attempt) * HTTP_RETRY_BASE_DELAY_MS;
        if (
          e instanceof SyncBoxResponseError ||
          attempt >= HTTP_RETRY_COUNT ||
          Date.now() + backoff >= deadline
        ) {
          throw e;
        }
        this.log.debug(
          `Sync Box request attempt ${attempt + 1} failed, retrying in ${backoff}ms:`,
          e
        );
        await new Promise(resolve => setTimeout(resolve, backoff));
      }
    }
  }
}
