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
    protected state: State
  ) {
    super(platform, accessory, state);
    this.service
      .getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
      .onSet(async (value: CharacteristicValue) => {
        const mode = this.numberToMode.get(value as number);
        this.platform.log.debug('Switch mode to ' + mode);
        return await this.updateExecution({
          mode,
        });
      });
  }

  protected createInputServices() {
    const modeInputServices: Service[] = [];
    for (let i = 1; i <= 4; i++) {
      const position = 'MODE ' + i;
      const name = this.numberToMode.get(i);
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
      this.platform.Characteristic.ActiveIdentifier,
      number
    );
  }
}
