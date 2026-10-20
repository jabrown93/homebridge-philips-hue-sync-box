import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HueSyncBoxPlatformConfig } from '../../../src/config.js';
import type { State } from '../../../src/state.js';
import { HSB_CA_CERT } from '../../../src/lib/hsb-ca-cert.js';

// vi.mock is hoisted above these imports, so the mock fetch fn must come from
// vi.hoisted to avoid a temporal-dead-zone reference inside the factory.
const { mockFetch } = vi.hoisted(() => ({ mockFetch: vi.fn() }));

// SyncBoxClient imports node-fetch as its default export at module load
// time, so the mock has to be installed before src/lib/client.js (and
// transitively node-fetch) is ever imported.
vi.mock('node-fetch', () => ({
  default: mockFetch,
}));

const { SyncBoxClient, createSyncBoxAgent } =
  await import('../../../src/lib/client.js');
const {
  HTTP_RETRY_BASE_DELAY_MS,
  MAX_SYNC_BOX_RESPONSE_BYTES,
  SYNC_BOX_REQUEST_TIMEOUT_MS,
} = await import('../../../src/lib/constants.js');

function makeLog() {
  return {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

function makeConfig(): HueSyncBoxPlatformConfig {
  return {
    syncBoxIpAddress: '10.0.0.5',
    syncBoxApiAccessToken: 'test-token',
  } as HueSyncBoxPlatformConfig;
}

function makeValidState(): State {
  return {
    device: {
      name: 'Sync Box',
      firmwareVersion: '1.0.0',
      uniqueId: 'abc123',
    },
    execution: {
      mode: 'video',
      hdmiSource: 'input1',
      brightness: 100,
    },
    hue: {
      groups: {},
    },
    hdmi: {
      input1: { name: 'Input 1' },
      input2: { name: 'Input 2' },
      input3: { name: 'Input 3' },
      input4: { name: 'Input 4' },
    },
  } as unknown as State;
}

function okResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => body,
  };
}

function errorResponse(status: number, statusText: string, body: unknown) {
  return {
    ok: false,
    status,
    statusText,
    text: async () => JSON.stringify(body),
  };
}

function abortError() {
  const e = new Error('The operation was aborted.');
  e.name = 'AbortError';
  return e;
}

describe('SyncBoxClient', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('bounds each request with an AbortSignal and reuses a single https.Agent across calls', async () => {
    mockFetch.mockResolvedValue(okResponse(makeValidState()));
    const client = new SyncBoxClient(makeLog(), makeConfig());

    await client.getState();
    await client.getState();

    expect(mockFetch).toHaveBeenCalledTimes(2);
    const [, firstOptions] = mockFetch.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    const [, secondOptions] = mockFetch.mock.calls[1] as [
      string,
      Record<string, unknown>,
    ];

    expect(firstOptions.signal).toBeInstanceOf(AbortSignal);
    expect(firstOptions.size).toBe(MAX_SYNC_BOX_RESPONSE_BYTES);
    expect(firstOptions.agent).toBeDefined();
    // A fresh https.Agent per request was the original bug - the fix reuses
    // one instance across the client's lifetime.
    expect(secondOptions.agent).toBe(firstOptions.agent);
    expect(secondOptions.signal).not.toBe(firstOptions.signal);
  });

  // Regression test for #458: a Sync Box that answers a hair too slowly used
  // to abort with no retry, because fetch-retry reused one already-aborted
  // signal across every attempt.
  it('retries after its own request timeout aborts an attempt', async () => {
    vi.useFakeTimers();
    try {
      const validState = makeValidState();
      mockFetch
        .mockRejectedValueOnce(abortError())
        .mockResolvedValueOnce(okResponse(validState));
      const log = makeLog();
      const client = new SyncBoxClient(log, makeConfig());

      const resultPromise = client.getState();
      await vi.advanceTimersByTimeAsync(HTTP_RETRY_BASE_DELAY_MS);
      const result = await resultPromise;

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual(validState);
      expect(log.warn).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('gives every attempt a fresh, un-aborted signal', async () => {
    vi.useFakeTimers();
    try {
      mockFetch
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValueOnce(okResponse(makeValidState()));
      const client = new SyncBoxClient(makeLog(), makeConfig());

      const resultPromise = client.getState();
      await vi.advanceTimersByTimeAsync(HTTP_RETRY_BASE_DELAY_MS);
      await resultPromise;

      const signals = mockFetch.mock.calls.map(
        ([, options]) => (options as { signal: AbortSignal }).signal
      );
      expect(signals[1]).not.toBe(signals[0]);
      expect(signals[1].aborted).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  // The retry loop used to return as soon as headers arrived, leaving
  // res.json() to reject outside it. A Sync Box that sent headers and then
  // stalled mid-body still failed the poll outright.
  it('retries when the response body stalls after headers arrive', async () => {
    vi.useFakeTimers();
    try {
      const validState = makeValidState();
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => {
            throw abortError();
          },
        })
        .mockResolvedValueOnce(okResponse(validState));
      const log = makeLog();
      const client = new SyncBoxClient(log, makeConfig());

      const resultPromise = client.getState();
      await vi.advanceTimersByTimeAsync(HTTP_RETRY_BASE_DELAY_MS);
      const result = await resultPromise;

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual(validState);
      expect(log.warn).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('stops retrying once the wall-clock request budget is spent', async () => {
    vi.useFakeTimers();
    try {
      // AbortSignal.timeout isn't driven by fake timers, so each attempt
      // simulates burning its full timeout by pushing the clock forward -
      // that's what the deadline is measured against. The budget, not
      // HTTP_RETRY_COUNT, is then what ends the loop.
      mockFetch.mockImplementation(async () => {
        vi.setSystemTime(Date.now() + SYNC_BOX_REQUEST_TIMEOUT_MS);
        throw abortError();
      });
      const log = makeLog();
      const client = new SyncBoxClient(log, makeConfig());

      const rejects = expect(client.getState()).rejects.toThrow(
        'The operation was aborted.'
      );
      await vi.advanceTimersByTimeAsync(HTTP_RETRY_BASE_DELAY_MS * 4);
      await rejects;

      expect(mockFetch.mock.calls.length).toBeLessThan(4);
    } finally {
      vi.useRealTimers();
    }
  });

  it('retries a real network error and succeeds once the retry resolves', async () => {
    vi.useFakeTimers();
    try {
      const validState = makeValidState();
      mockFetch
        .mockRejectedValueOnce(new Error('ECONNRESET'))
        .mockResolvedValueOnce(okResponse(validState));
      const log = makeLog();
      const client = new SyncBoxClient(log, makeConfig());

      const resultPromise = client.getState();
      // First backoff is 2^0 * HTTP_RETRY_BASE_DELAY_MS.
      await vi.advanceTimersByTimeAsync(HTTP_RETRY_BASE_DELAY_MS);
      const result = await resultPromise;

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).not.toBeNull();
      expect(log.warn).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('bounds retries to HTTP_RETRY_COUNT even for a persistent network error', async () => {
    vi.useFakeTimers();
    try {
      mockFetch.mockRejectedValue(new Error('ECONNREFUSED'));
      const log = makeLog();
      const client = new SyncBoxClient(log, makeConfig());

      const rejects = expect(client.getState()).rejects.toThrow('ECONNREFUSED');
      // Cumulative backoff for HTTP_RETRY_COUNT retries: 1000+2000+4000=7000ms.
      await vi.advanceTimersByTimeAsync(7000);
      await rejects;

      expect(mockFetch).toHaveBeenCalledTimes(4);
    } finally {
      vi.useRealTimers();
    }
  }, 3000);

  it('does not retry an HTTP error status - the box answered, it just answered badly', async () => {
    mockFetch.mockResolvedValue(
      errorResponse(500, 'Internal Server Error', { error: 'boom' })
    );
    const log = makeLog();
    const client = new SyncBoxClient(log, makeConfig());

    await expect(client.getState()).rejects.toThrow(
      'Error: 500 - Internal Server Error'
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('rejects a malformed state response without retrying it', async () => {
    mockFetch.mockResolvedValue(okResponse({ not: 'a valid state' }));
    const log = makeLog();
    const client = new SyncBoxClient(log, makeConfig());

    await expect(client.getState()).rejects.toThrow(
      'Sync Box returned a malformed state response.'
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('returns the parsed state on success', async () => {
    const validState = makeValidState();
    mockFetch.mockResolvedValue(okResponse(validState));
    const client = new SyncBoxClient(makeLog(), makeConfig());

    const result = await client.getState();

    expect(result).toEqual(validState);
  });
});

describe('createSyncBoxAgent', () => {
  it('pins to the Sync Box CA and requires the chain to validate', () => {
    const agent = createSyncBoxAgent();
    expect(agent.options.ca).toBe(HSB_CA_CERT);
    expect(agent.options.rejectUnauthorized).toBe(true);
  });

  it('skips hostname verification since leaf certs are keyed by device id, not IP', () => {
    const agent = createSyncBoxAgent();
    const checkServerIdentity = agent.options
      .checkServerIdentity as unknown as (
      hostname: string,
      cert: unknown
    ) => Error | undefined;
    expect(checkServerIdentity('192.168.1.50', {} as never)).toBeUndefined();
  });
});
