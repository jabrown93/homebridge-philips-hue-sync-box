import { Execution, State } from '../state';
import {
  Characteristic,
  type CharacteristicValue,
  PlatformAccessory,
  Service,
  WithUUID,
} from 'homebridge';
import { HueSyncBoxPlatform } from '../platform';
import { PASSTHROUGH, POWER_SAVE } from '../lib/constants';

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
      this.getServiceSubType() !== undefined
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
      this.platform.Characteristic.Name,
      accessory.displayName
    );

    this.service
      .getCharacteristic(this.getPowerCharacteristic())
      .onSet(this.handlePowerCharacteristicSet.bind(this)); // SET - bind to the `setOn` method below

    const accessoryInformationService =
      this.accessory.getService(this.platform.Service.AccessoryInformation) ||
      this.accessory.addService(this.platform.Service.AccessoryInformation);

    accessoryInformationService
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Philips')
      .setCharacteristic(this.platform.Characteristic.Model, 'Sync Box')
      .setCharacteristic(
        this.platform.Characteristic.FirmwareRevision,
        this.state.device.firmwareVersion
      )
      .setCharacteristic(
        this.platform.Characteristic.SerialNumber,
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
      mode = this.platform.config.defaultOnMode;
      if (mode === 'lastSyncMode') {
        mode = this?.state?.execution?.lastSyncMode || 'video';
      }
    } else {
      this.platform.log.debug('Switch state to OFF');
      mode = this.platform.config.defaultOffMode;
    }
    return this.updateExecution({
      mode,
    });
  }

  protected async updateExecution(execution: Partial<Execution>) {
    try {
      return await this.platform.client.updateExecution(execution);
    } catch (e) {
      this.platform.log.debug('Failed to update execution', e);
    }
  }

  protected async setBrightness(value: CharacteristicValue) {
    this.platform.log.debug('Switch brightness to ' + value);
    await this.updateExecution({
      brightness: Math.round(((value as number) / 100.0) * 200),
    });
  }

  public update(state: State): void {
    // Updates the on characteristic
    this.state = state;
    this.platform.log.debug('Updated state to ' + this.state.execution.mode);
    this.service.updateCharacteristic(
      this.platform.Characteristic.On,
      this.state.execution.mode !== POWER_SAVE &&
        this.state.execution.mode !== PASSTHROUGH
    );
  }

  protected getSuffix(): string {
    return '';
  }

  protected getPowerCharacteristic(): WithUUID<new () => Characteristic> {
    return this.platform.Characteristic.Active;
  }

  protected handlePowerCharacteristicSet(value: CharacteristicValue) {
    this.platform.log.debug('Set On ->', value);
    const currentVal = this.service.getCharacteristic(
      this.getPowerCharacteristic()
    ).value;
    return this.updateMode(currentVal, value);
  }
}
