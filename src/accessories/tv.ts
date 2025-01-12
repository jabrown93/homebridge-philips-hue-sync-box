import { PlatformAccessory, Service } from 'homebridge';
import { HueSyncBoxPlatform } from '../platform';
import { HdmiInput, State } from '../state';
import { BaseTvDevice } from './baseTv';

export class TvDevice extends BaseTvDevice {
  constructor(
    protected readonly platform: HueSyncBoxPlatform,
    public readonly accessory: PlatformAccessory,
    protected state: State
  ) {
    super(platform, accessory, state);
    this.service
      .getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
      .onSet(async value => {
        return await this.updateExecution({
          hdmiSource: 'input' + value,
        });
      });
  }

  updateTv(): void {
    this.platform.log.debug(
      'Updated HDMI input to ' + this.state.execution.hdmiSource
    );
    this.service.updateCharacteristic(
      this.platform.Characteristic.ActiveIdentifier,
      parseInt(this.state.execution.hdmiSource.replace('input', ''))
    );
  }

  protected getSuffix(): string {
    return '-T';
  }

  protected getServiceSubType(): string | undefined {
    return 'TV';
  }

  protected getServiceName(): string | undefined {
    return 'TV';
  }

  protected isLightbulbEnabled(): boolean {
    return this.platform.config.tvAccessoryLightbulb;
  }

  protected createInputServices(): void {
    const services: Service[] = [];
    for (let i = 1; i <= 4; i++) {
      // Sets the TV name
      const hdmiState: HdmiInput = this.state.hdmi[`input${i}`];
      const hdmiName = hdmiState.name || 'HDMI ' + i;
      const hdmiInputService = this.getInputService(hdmiName, hdmiName);
      hdmiInputService
        .getCharacteristic(this.platform.Characteristic.TargetVisibilityState)
        .onSet(this.setVisibility(hdmiInputService));
      // Adds the input as a linked service, which is important so that the input is properly displayed in the Home app
      this.service.addLinkedService(hdmiInputService);
      services.push(hdmiInputService);
    }
    this.inputServices = services;
    this.updateSources(services);
  }
}
