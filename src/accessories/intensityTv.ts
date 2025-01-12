import type { CharacteristicValue, PlatformAccessory } from 'homebridge';
import { HueSyncBoxPlatform } from '../platform';
import { State } from '../state';
import { BaseTvDevice } from './baseTv';

export class IntensityTvDevice extends BaseTvDevice {
  constructor(
    protected readonly platform: HueSyncBoxPlatform,
    public readonly accessory: PlatformAccessory,
    protected state: State
  ) {
    super(platform, accessory, state);

    this.service
      .getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
      .onSet(async (value: CharacteristicValue) => {
        const mode = this.getMode();
        const intensity = this.numberToIntensity[value as number] || '';
        this.platform.log.debug('Switch intensity to ' + intensity);
        const body = {};
        body[mode] = {
          intensity,
        };
        return await this.updateExecution(body);
      });
  }

  protected createInputServices() {
    for (let i = 1; i < this.numberToIntensity.size; i++) {
      const position = 'INTENSITY ' + i;
      const intensityInputService = this.getInputService(
        this.numberToIntensity[i],
        position
      );

      // Adds the input as a linked service, which is important so that the input is properly displayed in the Home app
      this.service.addLinkedService(intensityInputService);
      this.inputServices.push(intensityInputService);
    }
    this.service.setCharacteristic(
      this.platform.Characteristic.SleepDiscoveryMode,
      this.platform.Characteristic.SleepDiscoveryMode.ALWAYS_DISCOVERABLE
    );

    this.updateSources(this.inputServices);
  }

  updateTv(): void {
    // Gets the current mode or the last sync mode to set the intensity
    const mode = this.getMode();

    // Updates the intensity input characteristic
    this.platform.log.debug(
      'Updated intensity to ' + this.state.execution[mode].intensity
    );
    const brightness =
      this.intensityToNumber[this.state.execution[mode].intensity];
    if (brightness) {
      this.service.updateCharacteristic(
        this.platform.Characteristic.ActiveIdentifier,
        brightness
      );
    }
  }

  protected getSuffix(): string {
    return '-I';
  }

  protected getServiceSubType(): string | undefined {
    return 'IntensityTVAccessory';
  }

  protected getServiceName(): string | undefined {
    return 'Intensity';
  }

  protected isLightbulbEnabled(): boolean {
    return this.platform.config.intensityTvAccessoryLightbulb;
  }
}
