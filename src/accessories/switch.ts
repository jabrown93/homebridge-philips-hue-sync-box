import type { PlatformAccessory } from 'homebridge';

import type { HueSyncBoxPlatform } from '../platform.js';
import type { State } from '../state.js';
import { SyncBoxDevice } from './base.js';

export class SwitchDevice extends SyncBoxDevice {
  constructor(
    protected readonly platform: HueSyncBoxPlatform,
    public readonly accessory: PlatformAccessory,
    protected state: State
  ) {
    super(platform, accessory, state);
  }

  protected getPowerCharacteristic() {
    return this.platform.api.hap.Characteristic.On;
  }

  protected getServiceType() {
    return this.platform.api.hap.Service.Switch;
  }
}
