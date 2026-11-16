import { describe, it, expect, vi } from 'vitest';
import { ApiServer } from '../../src/api-server.js';
import type { HueSyncBoxPlatform } from '../../src/platform.js';
import type { State } from '../../src/state.js';
import type { ServerResponse } from 'node:http';

const VALID_TOKEN = 'a'.repeat(32);

function makePlatform(config: Record<string, unknown>): HueSyncBoxPlatform {
  return {
    config,
    log: {
      error: vi.fn(),
      info: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn(),
    },
    client: {
      getState: vi.fn(),
      updateExecution: vi.fn().mockResolvedValue(undefined),
      updateHue: vi.fn().mockResolvedValue(undefined),
    },
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

/** Exercises POST validation without opening a listening socket. */
async function postState(platform: HueSyncBoxPlatform, body: unknown) {
  const response = { statusCode: 0, end: vi.fn() };
  const server = new ApiServer(platform) as unknown as {
    handlePost(payload: Buffer[], response: ServerResponse): Promise<void>;
  };
  await server.handlePost(
    [Buffer.from(JSON.stringify(body))],
    response as unknown as ServerResponse
  );
  return response;
}

/** Models only fields consulted by state-aware request validation. */
function makeCurrentState(inputs: number[]): State {
  return {
    hdmi: Object.fromEntries(
      inputs.map(i => [`input${i}`, { name: `Input ${i}` }])
    ),
    hue: { groups: { living: { name: 'Living Room' } } },
  } as unknown as State;
}

describe('ApiServer POST HDMI validation', () => {
  it('rejects absent HDMI inputs before forwarding any update', async () => {
    const platform = makePlatform({});
    vi.mocked(platform.client.getState).mockResolvedValue(
      makeCurrentState([1])
    );
    const response = await postState(platform, {
      execution: { hdmiSource: 'input3' },
      hue: { groupId: 'living' },
    });
    expect(response.statusCode).toBe(400);
    expect(platform.client.updateExecution).not.toHaveBeenCalled();
    expect(platform.client.updateHue).not.toHaveBeenCalled();
  });

  it.each([
    { inputs: [1], source: 'input1' },
    { inputs: [1, 2, 3, 4], source: 'input4' },
    { inputs: [1, 3], source: 'input3' },
  ])(
    'accepts reported input $source on $inputs',
    async ({ inputs, source }) => {
      const platform = makePlatform({});
      vi.mocked(platform.client.getState).mockResolvedValue(
        makeCurrentState(inputs)
      );
      const response = await postState(platform, {
        execution: { hdmiSource: source },
      });
      expect(response.statusCode).toBe(200);
      expect(platform.client.updateExecution).toHaveBeenCalledWith({
        hdmiSource: source,
      });
    }
  );

  it('fails closed when state is unavailable', async () => {
    const platform = makePlatform({});
    vi.mocked(platform.client.getState).mockResolvedValue(null);
    const response = await postState(platform, {
      execution: { hdmiSource: 'input1' },
    });
    expect(response.statusCode).toBe(400);
    expect(platform.client.updateExecution).not.toHaveBeenCalled();
  });

  it('shares one validation snapshot for execution and hue', async () => {
    const platform = makePlatform({});
    vi.mocked(platform.client.getState).mockResolvedValue(
      makeCurrentState([1])
    );
    const response = await postState(platform, {
      execution: { hdmiSource: 'input1' },
      hue: { groupId: 'living' },
    });
    expect(response.statusCode).toBe(200);
    expect(platform.client.getState).toHaveBeenCalledTimes(2);
    expect(platform.client.updateExecution).toHaveBeenCalledWith({
      hdmiSource: 'input1',
    });
    expect(platform.client.updateHue).toHaveBeenCalledWith({
      groupId: 'living',
    });
  });

  it('keeps brightness-only writes independent of input discovery', async () => {
    const platform = makePlatform({});
    vi.mocked(platform.client.getState).mockResolvedValue(null);
    const response = await postState(platform, {
      execution: { brightness: 100 },
    });
    expect(response.statusCode).toBe(200);
    expect(platform.client.getState).toHaveBeenCalledTimes(1);
    expect(platform.client.updateExecution).toHaveBeenCalledWith({
      brightness: 100,
    });
  });
});
