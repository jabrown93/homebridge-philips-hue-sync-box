import type { CharacteristicValue, PlatformAccessory } from 'homebridge';

import { HueSyncBoxPlatform } from '../platform';
import { State } from '../state';
import { SyncBoxDevice } from './base.js';
import { PASSTHROUGH, POWER_SAVE } from '../lib/constants.js';

/**
 * PowerSwitchDevice controls the power state of the Sync Box (powersave vs. passthrough/sync)
 * - ON: Sets to passthrough mode (HDMI active, sync off)
 * - OFF: Sets to powersave mode (power off)
 */
export class PowerSwitchDevice extends SyncBoxDevice {
  constructor(
    protected readonly platform: HueSyncBoxPlatform,
    public readonly accessory: PlatformAccessory,
    protected state: State
  ) {
    super(platform, accessory, state);

    // Set up ConfiguredName characteristic
    let name;
    if (this.platform.config.powerSwitchAccessoryConfiguredName) {
      name = this.platform.config.powerSwitchAccessoryConfiguredName;
    } else if (this.accessory.context.powerSwitchAccessoryConfiguredName) {
      name = this.accessory.context.powerSwitchAccessoryConfiguredName;
    } else {
      name = this.state.device.name + ' Power';
    }
    this.service
      .getCharacteristic(this.platform.api.hap.Characteristic.ConfiguredName)
      .onSet(this.handleConfiguredNameChange.bind(this));
    this.service.updateCharacteristic(
      this.platform.api.hap.Characteristic.ConfiguredName,
      name
    );
  }

  protected handleConfiguredNameChange(value: CharacteristicValue) {
    if (this.platform.config.powerSwitchAccessoryConfiguredName) {
      this.platform.log.warn(
        'powerSwitchAccessoryConfiguredName is set in the config, therefore it cannot be changed by HomeKit.' +
          ' Please change it in the Homebridge config. Alternatively remove the' +
          ' config and manually configure in HomeKit (not recommended).'
      );
      return;
    }
    this.platform.log.debug(
      'powerSwitchAccessoryConfiguredName changed to ' + value
    );
    this.accessory.context.powerSwitchAccessoryConfiguredName = value;
  }

  protected getPowerCharacteristic() {
    return this.platform.api.hap.Characteristic.On;
  }

  protected getServiceType() {
    return this.platform.api.hap.Service.Switch;
  }

  protected getSuffix(): string {
    return '-power';
  }

  /**
   * Override updateMode to control hdmiActive instead of syncActive
   */
  protected updateMode(
    currentVal: CharacteristicValue | null,
    newValue: CharacteristicValue
  ) {
    this.platform.log.debug('Power switch state to ' + newValue);

    // Ignore changes if the new value equals the old value
    if (currentVal === newValue) {
      return;
    }

    let mode: string;
    if (newValue) {
      // Turn power ON: set to passthrough mode (HDMI active, sync off)
      this.platform.log.debug('Power switch state to ON (passthrough)');
      mode = PASSTHROUGH;
    } else {
      // Turn power OFF: set to powersave mode
      this.platform.log.debug('Power switch state to OFF (powersave)');
      mode = POWER_SAVE;
    }

    return this.updateExecution({
      mode,
    });
  }

  /**
   * Override shouldBeOn to return true for any mode except powersave
   */
  protected shouldBeOn(): boolean {
    return this.state.execution.mode !== POWER_SAVE;
  }
}
