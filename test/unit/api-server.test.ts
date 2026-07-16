import { describe, it, expect, jest } from '@jest/globals';
import { ApiServer } from '../../src/api-server.js';
import type { HueSyncBoxPlatform } from '../../src/platform.js';

const VALID_TOKEN = 'a'.repeat(32);

function makePlatform(config: Record<string, unknown>): HueSyncBoxPlatform {
  return {
    config,
    log: {
      error: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
    },
    client: { getState: jest.fn() },
  } as unknown as HueSyncBoxPlatform;
}

function getServer(apiServer: ApiServer) {
  return (apiServer as unknown as { server?: { close: () => void } }).server;
}

describe('ApiServer.start', () => {
  it('refuses to start and logs an error when apiServerToken is not a string', () => {
    const platform = makePlatform({
      apiServerPort: 40299,
      apiServerToken: 12345,
    });
    const apiServer = new ApiServer(platform);

    apiServer.start();

    expect(platform.log.error).toHaveBeenCalledWith(
      expect.stringContaining('must be a string')
    );
    expect(getServer(apiServer)).toBeUndefined();
  });

  it('refuses to start and logs an error when apiServerToken is too short', () => {
    const platform = makePlatform({
      apiServerPort: 40299,
      apiServerToken: 'short',
    });
    const apiServer = new ApiServer(platform);

    apiServer.start();

    expect(platform.log.error).toHaveBeenCalledWith(
      expect.stringContaining('must be a string')
    );
    expect(getServer(apiServer)).toBeUndefined();
  });

  it('does not crash the process when two instances share a port (EADDRINUSE)', async () => {
    const port = 40298;
    const platformA = makePlatform({
      apiServerPort: port,
      apiServerToken: VALID_TOKEN,
    });
    const platformB = makePlatform({
      apiServerPort: port,
      apiServerToken: VALID_TOKEN,
    });
    const serverA = new ApiServer(platformA);
    const serverB = new ApiServer(platformB);

    try {
      serverA.start();
      // Give the OS time to actually bind the first server before the
      // second attempts the same port; only then is EADDRINUSE guaranteed.
      await new Promise(resolve => setTimeout(resolve, 100));

      serverB.start();
      await new Promise(resolve => setTimeout(resolve, 100));

      // Prior to the fix, this EADDRINUSE was rethrown by Node as an
      // uncaught exception instead of being logged - this test would crash
      // the whole test process rather than fail an assertion.
      expect(platformB.log.error).toHaveBeenCalledWith(
        expect.stringContaining('API server encountered an error'),
        expect.anything()
      );
    } finally {
      getServer(serverA)?.close();
      getServer(serverB)?.close();
    }
  }, 10000);
});
