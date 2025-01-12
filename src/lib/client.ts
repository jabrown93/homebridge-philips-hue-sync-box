import fetch from 'node-fetch';
import { Execution, Hue, State } from '../state';
import * as https from 'node:https';
import { Logger } from 'homebridge';
import { HueSyncBoxPlatformConfig } from '../config';

export class SyncBoxClient {
  constructor(
    private readonly log: Logger | Console,
    private readonly config: HueSyncBoxPlatformConfig
  ) {}

  public getState(): Promise<State> {
    return this.sendRequest<State>('GET', '');
  }

  public updateExecution(execution: Partial<Execution>): Promise<void> {
    return this.sendRequest<void>('PUT', 'execution', execution);
  }

  public updateHue(hue: Partial<Hue>): Promise<void> {
    return this.sendRequest<void>('PUT', 'hue', hue);
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
      agent: new https.Agent({ rejectUnauthorized: false }),
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
