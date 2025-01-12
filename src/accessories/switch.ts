import type { PlatformAccessory } from 'homebridge';

import { HueSyncBoxPlatform } from '../platform';
import { State } from '../state';
import { SyncBoxDevice } from './base';

export class SwitchDevice extends SyncBoxDevice {
  constructor(
    protected readonly platform: HueSyncBoxPlatform,
    public readonly accessory: PlatformAccessory,
    protected state: State
  ) {
    super(platform, accessory, state);
  }

  protected getPowerCharacteristic() {
    return this.platform.Characteristic.On;
  }

  protected getServiceType() {
    return this.platform.Service.Switch;
  }
}
