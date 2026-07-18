import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HueSyncBoxPlatformConfig } from '../../../src/config.js';
import type { State } from '../../../src/state.js';

// vi.mock is hoisted above these imports, so the mock fetch fn must come from
// vi.hoisted to avoid a temporal-dead-zone reference inside the factory.
const { mockFetch } = vi.hoisted(() => ({ mockFetch: vi.fn() }));

// SyncBoxClient imports node-fetch as its default export and wraps it with
// fetch-retry at module load time, so the mock has to be installed before
// src/lib/client.js (and transitively node-fetch) is ever imported.
vi.mock('node-fetch', () => ({
  default: mockFetch,
}));

const { SyncBoxClient } = await import('../../../src/lib/client.js');
const { HTTP_RETRY_BASE_DELAY_MS, MAX_SYNC_BOX_RESPONSE_BYTES } =
  await import('../../../src/lib/constants.js');

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
    json: async () => body,
  };
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

  it('does not retry once its own request timeout aborts the request', async () => {
    const abortError = new Error('The operation was aborted.');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValue(abortError);
    const log = makeLog();
    const client = new SyncBoxClient(log, makeConfig());

    const result = await client.getState();

    expect(result).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenCalledWith(
      'Failed to get state from Sync Box:',
      abortError
    );
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
      // fetch-retry's first backoff delay is 2^0 * HTTP_RETRY_BASE_DELAY_MS.
      await vi.advanceTimersByTimeAsync(HTTP_RETRY_BASE_DELAY_MS);
      const result = await resultPromise;

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result).not.toBeNull();
      expect(log.error).not.toHaveBeenCalled();
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

      const resultPromise = client.getState();
      // Cumulative backoff for HTTP_RETRY_COUNT retries: 1000+2000+4000=7000ms.
      await vi.advanceTimersByTimeAsync(7000);
      const result = await resultPromise;

      expect(result).toBeNull();
      expect(mockFetch).toHaveBeenCalledTimes(4);
    } finally {
      vi.useRealTimers();
    }
  }, 3000);

  it('does not retry an HTTP error status and logs then returns null', async () => {
    mockFetch.mockResolvedValue(
      errorResponse(500, 'Internal Server Error', { error: 'boom' })
    );
    const log = makeLog();
    const client = new SyncBoxClient(log, makeConfig());

    const result = await client.getState();

    expect(result).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenCalledWith(
      'Failed to get state from Sync Box:',
      expect.any(Error)
    );
  });

  it('rejects a malformed state response instead of forwarding it', async () => {
    mockFetch.mockResolvedValue(okResponse({ not: 'a valid state' }));
    const log = makeLog();
    const client = new SyncBoxClient(log, makeConfig());

    const result = await client.getState();

    expect(result).toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(log.error).toHaveBeenCalledWith(
      'Failed to get state from Sync Box:',
      expect.objectContaining({
        message: 'Sync Box returned a malformed state response.',
      })
    );
  });

  it('returns the parsed state on success', async () => {
    const validState = makeValidState();
    mockFetch.mockResolvedValue(okResponse(validState));
    const client = new SyncBoxClient(makeLog(), makeConfig());

    const result = await client.getState();

    expect(result).toEqual(validState);
  });
});
