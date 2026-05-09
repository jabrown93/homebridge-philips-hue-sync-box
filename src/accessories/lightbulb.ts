import { SyncBoxDevice } from './base.js';
import type { PlatformAccessory } from 'homebridge';
import type { State } from '../state.js';
import type { HueSyncBoxPlatform } from '../platform.js';

export class LightbulbDevice extends SyncBoxDevice {
  constructor(
    protected readonly platform: HueSyncBoxPlatform,
    public readonly accessory: PlatformAccessory,
    protected state: State
  ) {
    super(platform, accessory, state);
    this.service
      .getCharacteristic(this.platform.api.hap.Characteristic.Brightness)
      .onSet(this.setBrightness.bind(this));
  }

  protected getPowerCharacteristic() {
    return this.platform.api.hap.Characteristic.On;
  }

  protected getServiceType() {
    return this.platform.api.hap.Service.Lightbulb;
  }
}
