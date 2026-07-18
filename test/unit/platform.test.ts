import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HueSyncBoxPlatform } from '../../src/platform.js';
import type { API, Logging, PlatformConfig } from 'homebridge';

function makeApi(): API {
  return {
    hap: {
      Categories: {
        TV_SET_TOP_BOX: 1,
        TV_STREAMING_STICK: 2,
        AUDIO_RECEIVER: 3,
        TELEVISION: 4,
      },
      uuid: { generate: vi.fn(() => 'uuid') },
    },
    on: vi.fn(),
  } as unknown as API;
}

function makeLog(): Logging {
  return {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  } as unknown as Logging;
}

function makeConfig(): PlatformConfig {
  return {
    platform: 'HueSyncBox',
    name: 'Test',
    syncBoxIpAddress: '10.0.0.5',
    syncBoxApiAccessToken: 'test-token',
    apiServerEnabled: false,
    updateIntervalInSeconds: 1,
  } as PlatformConfig;
}

type PollingPlatform = HueSyncBoxPlatform & { schedulePolling(): void };

describe('HueSyncBoxPlatform polling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('skips a poll tick while the previous one is still in flight', async () => {
    const platform = new HueSyncBoxPlatform(makeLog(), makeConfig(), makeApi());
    let resolveFirst: (value: null) => void = () => {
      throw new Error('resolveFirst called before assignment');
    };
    const getState = vi
      .spyOn(platform.client, 'getState')
      .mockImplementationOnce(
        () =>
          new Promise(resolve => {
            resolveFirst = resolve;
          })
      )
      .mockResolvedValue(null);
    const update = vi.spyOn(platform, 'update').mockResolvedValue(undefined);

    (platform as PollingPlatform).schedulePolling();

    // Tick 1: starts a getState() call that never resolves on its own.
    await vi.advanceTimersByTimeAsync(1000);
    expect(getState).toHaveBeenCalledTimes(1);

    // Tick 2: fires while tick 1 is still pending - must be skipped, not queued.
    await vi.advanceTimersByTimeAsync(1000);
    expect(getState).toHaveBeenCalledTimes(1);
    expect(platform.log.debug).toHaveBeenCalledWith(
      'Skipping poll tick, previous update still in progress'
    );

    // Let tick 1 finish, then confirm polling resumes on the next tick.
    resolveFirst(null);
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(1000);

    expect(getState).toHaveBeenCalledTimes(2);
    expect(update).toHaveBeenCalledTimes(2);
  });
});
