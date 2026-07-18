import { Execution, State } from '../state.js';
import {
  Characteristic,
  type CharacteristicValue,
  HAPStatus,
  PlatformAccessory,
  Service,
  WithUUID,
} from 'homebridge';
import { HueSyncBoxPlatform } from '../platform.js';
import {
  PASSTHROUGH,
  POWER_SAVE,
  MODE_LAST_SYNC,
  MODE_VIDEO,
} from '../lib/constants.js';
import { convertHomekitToSyncBox } from '../lib/brightness.js';

export abstract class SyncBoxDevice {
  protected readonly platform: HueSyncBoxPlatform;
  public readonly accessory: PlatformAccessory;
  protected state: State;
  protected service: Service;

  protected constructor(
    platform: HueSyncBoxPlatform,
    accessory: PlatformAccessory,
    state: State
  ) {
    this.platform = platform;
    this.accessory = accessory;
    this.state = state;

    const existingService =
      this.getServiceSubType() === undefined
        ? this.accessory.getService(this.getServiceType())
        : this.accessory.getServiceById(
            this.getServiceType(),
            this.getServiceSubType() as string
          );
    this.service =
      existingService ||
      this.accessory.addService(
        this.getServiceType(),
        this.getServiceName(),
        this.getServiceSubType()
      );

    this.service.setCharacteristic(
      this.platform.api.hap.Characteristic.Name,
      accessory.displayName
    );

    this.service
      .getCharacteristic(this.getPowerCharacteristic())
      .onSet(this.handlePowerCharacteristicSet.bind(this)); // SET - bind to the `setOn` method below

    const accessoryInformationService =
      this.accessory.getService(
        this.platform.api.hap.Service.AccessoryInformation
      ) ||
      this.accessory.addService(
        this.platform.api.hap.Service.AccessoryInformation
      );

    accessoryInformationService
      .setCharacteristic(
        this.platform.api.hap.Characteristic.Manufacturer,
        'Philips'
      )
      .setCharacteristic(this.platform.api.hap.Characteristic.Model, 'Sync Box')
      .setCharacteristic(
        this.platform.api.hap.Characteristic.FirmwareRevision,
        this.state.device.firmwareVersion
      )
      .setCharacteristic(
        this.platform.api.hap.Characteristic.SerialNumber,
        this.state.device.uniqueId + this.getSuffix()
      );
  }

  protected abstract getServiceType();

  protected getServiceSubType(): string | undefined {
    return undefined;
  }

  protected getServiceName(): string | undefined {
    return undefined;
  }

  protected updateMode(
    currentVal: CharacteristicValue | null,
    newValue: CharacteristicValue
  ) {
    this.platform.log.debug('Switch state to ' + newValue);
    // Ignores changes if the new value equals the old value
    if (currentVal === newValue) {
      return;
    }
    let mode: string;
    // Saves the changes
    if (newValue) {
      this.platform.log.debug('Switch state to ON');
      mode = this.getOnMode();
    } else {
      this.platform.log.debug('Switch state to OFF');
      mode = this.platform.config.defaultOffMode;
    }
    return this.updateExecution({
      mode,
    });
  }

  // Resolves the configured default on-mode, falling back to video when
  // 'lastSyncMode' is configured but the box has not synced yet.
  protected getOnMode(): string {
    const mode = this.platform.config.defaultOnMode;
    if (mode !== MODE_LAST_SYNC) {
      return mode;
    }
    return this.state.execution.lastSyncMode || MODE_VIDEO;
  }

  protected updateExecution(execution: Partial<Execution>) {
    this.platform.client.updateExecution(execution).catch(e => {
      this.platform.log.error('Failed to update execution', e);
    });
  }

  protected setBrightness(value: CharacteristicValue) {
    this.platform.log.debug('Switch brightness to ' + value);
    this.updateExecution({
      brightness: convertHomekitToSyncBox(value as number),
    });
  }

  public update(state: State | null): void {
    // Updates the on characteristic
    if (!state) {
      this.service.updateCharacteristic(
        this.getPowerCharacteristic(),
        new this.platform.api.hap.HapStatusError(
          HAPStatus.SERVICE_COMMUNICATION_FAILURE
        )
      );
      return;
    }
    this.state = state;
    this.platform.log.debug('Updated state to ' + this.state.execution.mode);
    this.service.updateCharacteristic(
      this.getPowerCharacteristic(),
      this.shouldBeOn()
    );
  }

  // True when the box is actively syncing (video/music/game), as opposed to
  // sitting in passthrough or powersave.
  protected isSyncActive(): boolean {
    return (
      this.state.execution.mode !== POWER_SAVE &&
      this.state.execution.mode !== PASSTHROUGH
    );
  }

  protected shouldBeOn(): boolean {
    return this.isSyncActive();
  }

  protected getSuffix(): string {
    return '';
  }

  protected getPowerCharacteristic(): WithUUID<new () => Characteristic> {
    return this.platform.api.hap.Characteristic.Active;
  }

  protected handlePowerCharacteristicSet(value: CharacteristicValue) {
    this.platform.log.debug(
      'Set ' + this.getPowerCharacteristic() + ' ->',
      value
    );
    const currentVal = this.service.getCharacteristic(
      this.getPowerCharacteristic()
    ).value;
    this.platform.log.debug(
      'Current value of ' + this.getPowerCharacteristic() + ': ' + currentVal
    );
    return this.updateMode(currentVal, value);
  }
}
