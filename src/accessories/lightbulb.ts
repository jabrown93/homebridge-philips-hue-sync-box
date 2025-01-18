import { SyncBoxDevice } from './base.js';
import type { PlatformAccessory } from 'homebridge';
import { State } from '../state';
import { HueSyncBoxPlatform } from '../platform';

export class LightbulbDevice extends SyncBoxDevice {
  constructor(
    protected readonly platform: HueSyncBoxPlatform,
    public readonly accessory: PlatformAccessory,
    protected state: State
  ) {
    super(platform, accessory, state);
    this.service
      .getCharacteristic(this.platform.Characteristic.Brightness)
      .onSet(this.setBrightness.bind(this));
  }

  protected getPowerCharacteristic() {
    return this.platform.Characteristic.On;
  }

  protected getServiceType() {
    return this.platform.Service.Lightbulb;
  }
}
