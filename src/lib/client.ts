import originalFetch from 'node-fetch';
import fetch_retry from 'fetch-retry';

import { Execution, Hue, State } from '../state.js';
import * as https from 'node:https';
import { Logger } from 'homebridge';
import { HueSyncBoxPlatformConfig } from '../config.js';

const fetch = fetch_retry(originalFetch, {
  retries: 3,
  retryDelay: attempt => {
    return Math.pow(2, attempt) * 1000; // 1000, 2000, 4000
  },
});

export class SyncBoxClient {
  constructor(
    private readonly log: Logger | Console,
    private readonly config: HueSyncBoxPlatformConfig
  ) {}

  public getState(): Promise<State> {
    return this.sendRequest<State>('GET', '');
  }

  public async updateExecution(execution: Partial<Execution>): Promise<void> {
    try {
      return await this.sendRequest<void>('PUT', 'execution', execution);
    } catch (e) {
      this.log.error('Error updating execution:', e);
    }
  }

  public async updateHue(hue: Partial<Hue>): Promise<void> {
    try {
      return await this.sendRequest<void>('PUT', 'hue', hue);
    } catch (e) {
      this.log.error('Error updating hue:', e);
    }
  }

  private async sendRequest<T>(
    method: string,
    path: string,
    body?: Partial<Execution> | Partial<Hue> | null
  ): Promise<T> {
    const url = `https://${this.config.syncBoxIpAddress}/api/v1/${path}`;
    const options = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.syncBoxApiAccessToken}`,
      },
      method,
      body: body ? JSON.stringify(body) : null,
      agent: new https.Agent({ rejectUnauthorized: false, keepAlive: true }),
    };

    this.log.debug('Request to Sync Box:', url, JSON.stringify(options));

    const res = await fetch(url, options);
    if (!res.ok) {
      this.log.error(
        `Error: ${res.status} - ${res.statusText}. ${JSON.stringify(await res.json())}`
      );
      throw new Error(`Error: ${res.status} - ${res.statusText}`);
    }
    return method === 'GET' ? ((await res.json()) as T) : (null as T);
  }
}
