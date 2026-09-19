import { describe, it, expect, vi, afterEach, afterAll } from 'vitest';
import http from 'node:http';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ApiServer } from '../../src/api-server.js';
import type { HueSyncBoxPlatform } from '../../src/platform.js';

// A real TLS handshake would need a checked-in private key, which secret
// scanners flag. Delegating to a plain http server keeps the listen/log path
// real while letting the test assert on what was handed to https.
const httpsCreateServer = vi.hoisted(() => vi.fn());
vi.mock('node:https', () => ({
  default: { createServer: httpsCreateServer },
}));

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
    client: { getState: vi.fn() },
  } as unknown as HueSyncBoxPlatform;
}

function getServer(apiServer: ApiServer) {
  return (
    apiServer as unknown as {
      server?: import('http').Server;
    }
  ).server;
}

function apiServerInternals(apiServer: ApiServer) {
  return apiServer as unknown as Record<string, unknown>;
}

function makeResponse() {
  return {
    statusCode: 200,
    body: '',
    setHeader: vi.fn(),
    end(body?: string) {
      this.body = body ?? '';
    },
  };
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

  it('refuses to start when only one of the TLS cert/key paths is set', () => {
    const platform = makePlatform({
      apiServerPort: 40295,
      apiServerToken: VALID_TOKEN,
      apiServerTlsCertPath: '/tmp/cert.pem',
    });
    const apiServer = new ApiServer(platform);

    apiServer.start();

    expect(platform.log.error).toHaveBeenCalledWith(
      expect.stringContaining('apiServerTlsCertPath and apiServerTlsKeyPath')
    );
    expect(getServer(apiServer)).toBeUndefined();
  });

  it('binds to the configured host so the token is not exposed on every interface', async () => {
    const platform = makePlatform({
      apiServerPort: 40297,
      apiServerHost: '127.0.0.1',
      apiServerToken: VALID_TOKEN,
    });
    const apiServer = new ApiServer(platform);

    try {
      apiServer.start();
      const server = getServer(apiServer);
      await new Promise(resolve => server?.on('listening', resolve));

      expect(server?.address()).toMatchObject({ address: '127.0.0.1' });
    } finally {
      getServer(apiServer)?.close();
    }
  }, 10000);

  describe('with TLS configured', () => {
    const dir = mkdtempSync(join(tmpdir(), 'hue-sync-box-tls-'));
    const certPath = join(dir, 'cert.pem');
    const keyPath = join(dir, 'key.pem');
    writeFileSync(certPath, 'CERT');
    writeFileSync(keyPath, 'KEY');

    afterEach(() => {
      httpsCreateServer.mockReset();
    });

    afterAll(() => {
      rmSync(dir, { recursive: true, force: true });
    });

    it('serves HTTPS from the configured cert/key and reports it on startup', async () => {
      httpsCreateServer.mockImplementation(
        (_options: unknown, handler: http.RequestListener) =>
          http.createServer(handler)
      );
      const platform = makePlatform({
        apiServerPort: 40294,
        apiServerHost: '127.0.0.1',
        apiServerToken: VALID_TOKEN,
        apiServerTlsCertPath: certPath,
        apiServerTlsKeyPath: keyPath,
      });
      const apiServer = new ApiServer(platform);

      try {
        apiServer.start();
        const server = getServer(apiServer);
        await new Promise(resolve => server?.on('listening', resolve));

        expect(httpsCreateServer).toHaveBeenCalledWith(
          { cert: Buffer.from('CERT'), key: Buffer.from('KEY') },
          expect.any(Function)
        );
        expect(platform.log.info).toHaveBeenCalledWith(
          'API server started (https).'
        );
        expect(platform.log.error).not.toHaveBeenCalled();
      } finally {
        getServer(apiServer)?.close();
      }
    }, 10000);

    it('refuses to start when the cert/key files cannot be read', () => {
      const platform = makePlatform({
        apiServerPort: 40293,
        apiServerToken: VALID_TOKEN,
        apiServerTlsCertPath: join(dir, 'missing-cert.pem'),
        apiServerTlsKeyPath: keyPath,
      });
      const apiServer = new ApiServer(platform);

      apiServer.start();

      expect(httpsCreateServer).not.toHaveBeenCalled();
      expect(platform.log.error).toHaveBeenCalledWith(
        expect.stringContaining('failed to read TLS cert/key'),
        expect.anything()
      );
      expect(getServer(apiServer)).toBeUndefined();
    });
  });
});

describe('ApiServer request handling', () => {
  it('answers with an error status when the Sync Box read fails', async () => {
    const platform = makePlatform({
      apiServerPort: 40296,
      apiServerToken: VALID_TOKEN,
    });
    platform.client.getState = vi
      .fn()
      .mockRejectedValue(new Error('ECONNREFUSED'));
    const response = makeResponse();

    await (
      apiServerInternals(new ApiServer(platform)) as {
        handleGet(response: unknown): Promise<void>;
      }
    ).handleGet(response);

    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      error: 'An error occurred while processing your request.',
    });
  });
});
