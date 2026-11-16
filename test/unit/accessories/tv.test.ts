import { describe, it, expect, vi } from 'vitest';
import type { PlatformAccessory } from 'homebridge';
import type { HueSyncBoxPlatform } from '../../../src/platform.js';
import type { State } from '../../../src/state.js';
import { TvDevice } from '../../../src/accessories/tv.js';

/** Creates only the HomeKit surface needed to exercise real TV handlers. */
function makeTv(inputs: number[], active = inputs[0]) {
  const handlers = new Map<unknown, (value: number) => void>();
  const makeService = () => ({
    setCharacteristic: vi.fn().mockReturnThis(),
    updateCharacteristic: vi.fn().mockReturnThis(),
    addLinkedService: vi.fn(),
    getCharacteristic: vi.fn((key: unknown) => ({
      onSet: (handler: (value: number) => void) => handlers.set(key, handler),
    })),
  });
  const service = makeService();
  const accessory = {
    displayName: 'Sync Box',
    getService: vi.fn(() => service),
    getServiceById: vi.fn((_type: unknown, subType: string) =>
      subType === 'TV' ? service : undefined
    ),
    addService: vi.fn(makeService),
  };
  const Characteristic = {
    ActiveIdentifier: 'ActiveIdentifier',
    RemoteKey: { INFORMATION: 15 },
    SleepDiscoveryMode: { ALWAYS_DISCOVERABLE: 1 },
    IsConfigured: { CONFIGURED: 1 },
    CurrentVisibilityState: { SHOWN: 0 },
    TargetVisibilityState: { SHOWN: 0 },
    InputSourceType: { HDMI: 3 },
    Identifier: 'Identifier',
  };
  const platform = {
    api: { hap: { Characteristic, Service: {} } },
    config: {},
    log: { debug: vi.fn(), warn: vi.fn() },
    client: { updateExecution: vi.fn().mockResolvedValue(undefined) },
  };
  const state = {
    device: { name: 'Sync Box', firmwareVersion: '3.5.2', uniqueId: 'test' },
    execution: { mode: 'video', hdmiSource: `input${active}` },
    hdmi: Object.fromEntries(
      inputs.map(i => [`input${i}`, { name: `Input ${i}` }])
    ),
  } as unknown as State;
  new TvDevice(
    platform as unknown as HueSyncBoxPlatform,
    accessory as unknown as PlatformAccessory,
    state
  );
  return {
    platform,
    accessory,
    service,
    select: (value: number) =>
      handlers.get(Characteristic.ActiveIdentifier)!(value),
    cycle: () =>
      handlers.get(Characteristic.RemoteKey)!(
        Characteristic.RemoteKey.INFORMATION
      ),
  };
}

describe('TV HDMI inputs', () => {
  it.each([{ inputs: [1] }, { inputs: [1, 2, 3, 4] }, { inputs: [1, 3] }])(
    'exposes only reported inputs, preserving HDMI identifiers: $inputs',
    ({ inputs }) => {
      const { accessory, service } = makeTv(inputs);
      expect(service.addLinkedService).toHaveBeenCalledTimes(inputs.length);
      inputs.forEach((input, index) => {
        expect(accessory.addService.mock.calls[index].slice(1)).toEqual([
          `hdmi${input}`,
          `HDMI ${input}`,
        ]);
        expect(
          service.addLinkedService.mock.calls[index][0].setCharacteristic
        ).toHaveBeenCalledWith('Identifier', String(input));
      });
    }
  );

  it('does not send requests for inputs absent from a single-input box', () => {
    const { select, platform } = makeTv([1]);
    for (const identifier of [2, 3, 4, 0, 5, 1.5, NaN]) {
      select(identifier);
    }
    expect(platform.client.updateExecution).not.toHaveBeenCalled();
    select(1);
    expect(platform.client.updateExecution).toHaveBeenCalledWith({
      hdmiSource: 'input1',
    });
  });

  it('still selects input4 on four-input boxes', () => {
    const { select, platform } = makeTv([1, 2, 3, 4]);
    select(4);
    expect(platform.client.updateExecution).toHaveBeenCalledWith({
      hdmiSource: 'input4',
    });
  });

  it.each([
    [[1], 1, 'input1'],
    [[1, 2, 3, 4], 1, 'input2'],
    [[1, 2, 3, 4], 4, 'input1'],
    [[1, 3], 1, 'input3'],
    [[1, 3], 3, 'input1'],
  ])(
    'cycles only reported HDMI inputs: %j, active %i',
    (inputs, active, next) => {
      const { cycle, platform } = makeTv(inputs as number[], active as number);
      cycle();
      expect(platform.client.updateExecution).toHaveBeenCalledWith({
        hdmiSource: next,
      });
    }
  );
});
