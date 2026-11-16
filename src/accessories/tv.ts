import { PlatformAccessory, Service } from 'homebridge';
import type { HueSyncBoxPlatform } from '../platform.js';
import type { HdmiSource, State } from '../state.js';
import { BaseTvDevice } from './baseTv.js';
import { getHdmiSources } from '../lib/hdmi.js';

export class TvDevice extends BaseTvDevice {
  constructor(
    protected readonly platform: HueSyncBoxPlatform,
    public readonly accessory: PlatformAccessory,
    protected state: State,
    protected mainAccessory?: PlatformAccessory
  ) {
    super(platform, accessory, state, mainAccessory);
    this.service
      .getCharacteristic(this.platform.api.hap.Characteristic.ActiveIdentifier)
      .onSet(value => {
        const identifier = value as number;
        const hdmiSource = `input${identifier}` as HdmiSource;
        if (
          !Number.isInteger(identifier) ||
          !getHdmiSources(this.state.hdmi).includes(hdmiSource)
        ) {
          this.platform.log.warn(
            'Ignoring unavailable HDMI input identifier: ' + identifier
          );
          return;
        }
        return this.updateExecution({
          hdmiSource,
        });
      });
  }

  updateTv(): void {
    this.platform.log.debug(
      'Updated HDMI input to ' + this.state.execution.hdmiSource
    );
    this.service.updateCharacteristic(
      this.platform.api.hap.Characteristic.ActiveIdentifier,
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

  protected getConfiguredNamePropertyName(): string {
    return 'tvAccessoryConfiguredName';
  }

  protected isLightbulbEnabled(): boolean {
    return this.platform.config.tvAccessoryLightbulb;
  }

  protected createInputServices(): void {
    const services: Service[] = [];
    for (const source of getHdmiSources(this.state.hdmi)) {
      const hdmiState = this.state.hdmi[source];
      const hdmiPosition = 'HDMI ' + source.replace('input', '');

      const hdmiName = hdmiState?.name ?? hdmiPosition;
      const hdmiInputService = this.getInputService(hdmiName, hdmiPosition);
      // Adds the input as a linked service, which is important so that the input is properly displayed in the Home app
      this.service.addLinkedService(hdmiInputService);
      services.push(hdmiInputService);
    }
    this.inputServices = services;
    this.updateSources(services);
  }
}
