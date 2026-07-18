import { SyncBoxDevice } from './base.js';
import {
  type CharacteristicValue,
  HAPStatus,
  PlatformAccessory,
  Service,
} from 'homebridge';
import type { HueSyncBoxPlatform } from '../platform.js';
import type { State } from '../state.js';
import {
  PASSTHROUGH,
  POWER_SAVE,
  MODE_VIDEO,
  MODE_MUSIC,
  MODE_GAME,
  BRIGHTNESS_MAX_SYNCBOX,
  BRIGHTNESS_STEP_SYNCBOX,
  BRIGHTNESS_MIN,
} from '../lib/constants.js';
import { convertSyncBoxToHomekit } from '../lib/brightness.js';

export abstract class BaseTvDevice extends SyncBoxDevice {
  protected lightbulbService?: Service;
  protected inputServices: Service[] = [];

  // The numbers double as HomeKit input identifiers, so the order is part of
  // the accessory's UI. The reverse maps are derived to keep them in sync.
  protected readonly intensityToNumber: Map<string, number> = new Map([
    ['subtle', 1],
    ['moderate', 2],
    ['high', 3],
    ['intense', 4],
  ]);

  protected readonly numberToIntensity: Map<number, string> = new Map(
    [...this.intensityToNumber].map(([intensity, number]) => [
      number,
      intensity,
    ])
  );

  protected readonly modeToNumber: Map<string, number> = new Map([
    [MODE_VIDEO, 1],
    [MODE_MUSIC, 2],
    [MODE_GAME, 3],
    [PASSTHROUGH, 4],
    [POWER_SAVE, 5],
  ]);

  protected readonly numberToMode: Map<number, string> = new Map(
    [...this.modeToNumber].map(([mode, number]) => [number, mode])
  );

  protected constructor(
    protected readonly platform: HueSyncBoxPlatform,
    public readonly accessory: PlatformAccessory,
    protected state: State,
    protected mainAccessory?: PlatformAccessory
  ) {
    super(platform, accessory, state);

    this.createInputServices();
    this.createLightbulbService();
    this.service.setCharacteristic(
      this.platform.api.hap.Characteristic.SleepDiscoveryMode,
      this.platform.api.hap.Characteristic.SleepDiscoveryMode
        .ALWAYS_DISCOVERABLE
    );
    this.service
      .getCharacteristic(this.platform.api.hap.Characteristic.RemoteKey)
      .onSet(this.handleRemoteButton.bind(this));

    const nameProperty = this.getConfiguredNamePropertyName();
    const name =
      this.platform.config[nameProperty] ||
      this.mainAccessory?.context[nameProperty] ||
      this.state.device.name;
    this.service
      .getCharacteristic(this.platform.api.hap.Characteristic.ConfiguredName)
      .onSet(this.handleConfiguredNameChange.bind(this));
    this.service.updateCharacteristic(
      this.platform.api.hap.Characteristic.ConfiguredName,
      name
    );
  }

  protected handleConfiguredNameChange(value: CharacteristicValue) {
    const nameProperty = this.getConfiguredNamePropertyName();
    if (this.platform.config[nameProperty]) {
      this.platform.log.warn(
        nameProperty +
          ' is set in the config, therefore it cannot be changed by HomeKit.' +
          ' Please change it in the Homebridge config. Alternatively remove the' +
          ' config and manually configure in HomeKit (not recommended).'
      );
      return;
    }
    this.platform.log.debug(nameProperty + ' name changed to ' + value);
    if (this.mainAccessory) {
      this.mainAccessory.context[nameProperty] = value;
    }
  }

  protected shouldBeOn(): boolean {
    if (
      this.platform.config.treatPassthroughAsOffForTv &&
      this.state.execution.mode === PASSTHROUGH
    ) {
      return false;
    }

    return this.state.execution.mode !== POWER_SAVE;
  }

  protected abstract createInputServices(): void;

  protected abstract isLightbulbEnabled(): boolean;

  protected createLightbulbService(): void {
    if (!this.isLightbulbEnabled()) {
      return;
    }
    this.lightbulbService =
      this.accessory.getService(this.platform.api.hap.Service.Lightbulb) ||
      this.accessory.addService(this.platform.api.hap.Service.Lightbulb);

    // Stores the light bulb service

    // Subscribes for changes of the on characteristic
    this.lightbulbService
      .getCharacteristic(this.platform.api.hap.Characteristic.On)
      .onSet(this.setOnLightbulb.bind(this));

    // Subscribes for changes of the brightness characteristic
    this.lightbulbService
      .getCharacteristic(this.platform.api.hap.Characteristic.Brightness)
      .onSet(this.setBrightness.bind(this));
  }

  setOnLightbulb(value: CharacteristicValue) {
    if (!this.lightbulbService) {
      return;
    }
    this.platform.log.debug('Set On ->', value);
    const currentVal = this.lightbulbService.getCharacteristic(
      this.platform.api.hap.Characteristic.On
    ).value;
    return this.updateMode(currentVal, value);
  }

  protected getServiceType() {
    return this.platform.api.hap.Service.Television;
  }

  protected handleRemoteButton(value: CharacteristicValue) {
    this.platform.log.debug('Remote key pressed: ' + value);

    switch (value) {
      case this.platform.api.hap.Characteristic.RemoteKey.ARROW_UP:
        this.platform.log.debug('Increase brightness by 25%');
        this.updateExecution({
          brightness: Math.min(
            BRIGHTNESS_MAX_SYNCBOX,
            this.state.execution.brightness + BRIGHTNESS_STEP_SYNCBOX
          ),
        });
        break;

      case this.platform.api.hap.Characteristic.RemoteKey.ARROW_DOWN:
        this.platform.log.debug('Decrease brightness by 25%');
        this.updateExecution({
          brightness: Math.max(
            BRIGHTNESS_MIN,
            this.state.execution.brightness - BRIGHTNESS_STEP_SYNCBOX
          ),
        });
        break;

      case this.platform.api.hap.Characteristic.RemoteKey.ARROW_LEFT:
        this.stepIntensity(-1);
        break;

      case this.platform.api.hap.Characteristic.RemoteKey.ARROW_RIGHT:
        this.stepIntensity(1);
        break;

      case this.platform.api.hap.Characteristic.RemoteKey.SELECT: {
        this.platform.log.debug('Toggle mode');
        const currentMode = this.state.execution.mode;
        const nextMode = ((this.modeToNumber.get(currentMode) ?? 4) % 4) + 1;
        this.updateExecution({
          mode: this.numberToMode.get(nextMode),
        });
        break;
      }

      case this.platform.api.hap.Characteristic.RemoteKey.PLAY_PAUSE:
        this.platform.log.debug('Toggle switch state');
        if (this.isSyncActive()) {
          this.updateExecution({
            mode: this.platform.config.defaultOffMode,
          });
        } else {
          this.updateExecution({
            mode: this.getOnMode(),
          });
        }
        break;

      case this.platform.api.hap.Characteristic.RemoteKey.INFORMATION: {
        this.platform.log.debug('Toggle hdmi source');
        const hdmiSource = this.state.execution.hdmiSource;
        const currentSourcePosition = parseInt(hdmiSource.replace('input', ''));
        const nextSourcePosition = (currentSourcePosition % 4) + 1;
        this.updateExecution({
          hdmiSource: 'input' + nextSourcePosition,
        });
        break;
      }
    }
  }

  // An unknown current intensity falls back so the step still lands on a
  // valid value: stepping down assumes 'intense' (4), stepping up 'subtle' (1).
  private stepIntensity(direction: -1 | 1): void {
    // Gets the current mode or the last sync mode to set the intensity
    const mode = this.getMode();

    this.platform.log.debug('Toggle intensity');
    if (!this.state.execution[mode]) {
      this.platform.log.debug(
        'Current mode ' + mode + ' does not have an intensity to update'
      );
      return;
    }
    const currentIntensity = this.state.execution[mode].intensity;
    const fallback = direction === -1 ? 4 : 1;
    const nextIntensity = this.numberToIntensity.get(
      (this.intensityToNumber.get(currentIntensity) ?? fallback) + direction
    );
    if (!nextIntensity) {
      return;
    }
    this.updateExecution({ [mode]: { intensity: nextIntensity } });
  }

  protected updateSources(services: Service[]) {
    // Handles showing/hiding of sources
    for (const service of services) {
      service
        .getCharacteristic(
          this.platform.api.hap.Characteristic.TargetVisibilityState
        )
        .onSet(this.setVisibility(service));
    }
  }

  public update(state: State): void {
    super.update(state);
    if (!state) {
      this.setLightbulbUnresponsive();
      return;
    }
    this.updateTv();
    this.updateLightbulb();
  }

  protected abstract updateTv(): void;

  private updateLightbulb(): void {
    if (!this.lightbulbService) {
      return;
    }
    this.platform.log.debug('Updated state to ' + this.state.execution.mode);
    this.lightbulbService.updateCharacteristic(
      this.platform.api.hap.Characteristic.On,
      this.isSyncActive()
    );
    this.platform.log.debug(
      'Updated brightness to ' + this.state.execution.brightness
    );
    this.lightbulbService.updateCharacteristic(
      this.platform.api.hap.Characteristic.Brightness,
      convertSyncBoxToHomekit(this.state.execution.brightness)
    );
  }

  private setLightbulbUnresponsive(): void {
    if (!this.lightbulbService) {
      return;
    }
    this.platform.log.debug('Updated state to ' + this.state.execution.mode);
    this.lightbulbService.updateCharacteristic(
      this.platform.api.hap.Characteristic.On,
      new this.platform.api.hap.HapStatusError(
        HAPStatus.SERVICE_COMMUNICATION_FAILURE
      )
    );
  }

  protected getInputService(
    name: string | undefined,
    position: string
  ): Service {
    if (!name) {
      throw new Error('Name is required');
    }
    const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
    this.platform.log.debug('Creating input service for ' + capitalizedName);
    const inputService =
      this.accessory.getServiceById(
        this.platform.api.hap.Service.InputSource,
        position
      ) ||
      this.accessory.addService(
        this.platform.api.hap.Service.InputSource,
        position.toLowerCase().replace(' ', ''),
        position
      );

    // Sets the TV name
    inputService
      .setCharacteristic(
        this.platform.api.hap.Characteristic.ConfiguredName,
        capitalizedName
      )
      .setCharacteristic(
        this.platform.api.hap.Characteristic.IsConfigured,
        this.platform.api.hap.Characteristic.IsConfigured.CONFIGURED
      )
      .setCharacteristic(
        this.platform.api.hap.Characteristic.CurrentVisibilityState,
        this.platform.api.hap.Characteristic.CurrentVisibilityState.SHOWN
      )
      .setCharacteristic(
        this.platform.api.hap.Characteristic.TargetVisibilityState,
        this.platform.api.hap.Characteristic.TargetVisibilityState.SHOWN
      );
    inputService
      .setCharacteristic(
        this.platform.api.hap.Characteristic.Identifier,
        position[position.length - 1]
      )
      .setCharacteristic(
        this.platform.api.hap.Characteristic.InputSourceType,
        this.platform.api.hap.Characteristic.InputSourceType.HDMI
      );

    return inputService;
  }

  protected setVisibility(service: Service) {
    return (value: CharacteristicValue) => {
      service.setCharacteristic(
        this.platform.api.hap.Characteristic.CurrentVisibilityState,
        value
      );
    };
  }

  protected getMode() {
    if (this.isSyncActive()) {
      return this.state.execution.mode;
    }
    return this.state.execution.lastSyncMode || MODE_VIDEO;
  }

  protected abstract getConfiguredNamePropertyName(): string;
}
