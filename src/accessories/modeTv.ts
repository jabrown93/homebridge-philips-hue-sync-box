import type {
  CharacteristicValue,
  PlatformAccessory,
  Service,
} from 'homebridge';
import { HueSyncBoxPlatform } from '../platform';
import { State } from '../state';
import { BaseTvDevice } from './baseTv.js';

export class ModeTvDevice extends BaseTvDevice {
  constructor(
    protected readonly platform: HueSyncBoxPlatform,
    public readonly accessory: PlatformAccessory,
    protected state: State,
    protected mainAccessory?: PlatformAccessory
  ) {
    super(platform, accessory, state, mainAccessory);
    this.service
      .getCharacteristic(this.platform.api.hap.Characteristic.ActiveIdentifier)
      .onSet((value: CharacteristicValue) => {
        const mode = this.numberToMode.get(value as number);
        this.platform.log.debug('Switch mode to ' + mode);
        this.updateExecution({
          mode,
        });
      });
  }

  protected createInputServices() {
    const modeInputServices: Service[] = [];
    for (const [num, name] of this.numberToMode.entries()) {
      const position = 'MODE ' + num;
      const modeInputService = this.getInputService(name, position);
      // Adds the input as a linked service, which is important so that the input is properly displayed in the Home app
      this.service.addLinkedService(modeInputService);
      modeInputServices.push(modeInputService);
    }
    this.updateSources(modeInputServices);
  }

  protected getSuffix(): string {
    return '-M';
  }

  protected getServiceSubType(): string | undefined {
    return 'ModeAccessory';
  }

  protected getServiceName(): string | undefined {
    return 'Mode';
  }

  protected getConfiguredNamePropertyName(): string {
    return 'modeTvAccessoryConfiguredName';
  }

  protected isLightbulbEnabled(): boolean {
    return this.platform.config.modeTvAccessoryLightbulb;
  }

  updateTv(): void {
    // Updates the mode characteristic
    const mode = this.getMode();
    this.platform.log.debug('Updated mode to ' + mode);
    const number = this.modeToNumber.get(mode);
    if (!number) {
      this.platform.log.error('Unknown mode for Mode TV: ' + mode);
      return;
    }
    this.service.updateCharacteristic(
      this.platform.api.hap.Characteristic.ActiveIdentifier,
      number
    );
  }
}
