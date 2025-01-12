import { SyncBoxDevice } from './base';
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
    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(
      this.platform.Characteristic.Name,
      accessory.displayName
    );
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
