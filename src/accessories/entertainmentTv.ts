import type { PlatformAccessory } from 'homebridge';
import type { HueSyncBoxPlatform } from '../platform.js';
import type { State } from '../state.js';
import { BaseTvDevice } from './baseTv.js';

export class EntertainmentTvDevice extends BaseTvDevice {
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
        // The identifier is the group's 1-based position in the groups object
        const groupId =
          Object.keys(this.state.hue.groups)[(value as number) - 1];
        const group = groupId ? this.state.hue.groups[groupId] : undefined;
        if (!group) {
          return;
        }
        // Saves the changes
        this.platform.log.debug('Switch entertainment area to ' + group.name);
        this.platform.client
          .updateHue({
            groupId: groupId,
          })
          .catch(e => {
            this.platform.log.error(
              'Failed to switch entertainment area to ' + group.name,
              e
            );
          });
      });
  }

  updateTv(): void {
    // Gets the 1-based position of the active group; an unknown groupId
    // falls past the last input, matching no source
    const groupIds = Object.keys(this.state.hue.groups);
    const position = groupIds.indexOf(this.state.hue.groupId);
    const index = position === -1 ? groupIds.length + 1 : position + 1;

    // Updates the input characteristic
    this.service.updateCharacteristic(
      this.platform.api.hap.Characteristic.ActiveIdentifier,
      index
    );
  }

  protected getSuffix(): string {
    return '-E';
  }

  protected getServiceSubType(): string | undefined {
    return 'EntertainmentTVAccessory';
  }

  protected getServiceName(): string | undefined {
    return 'Entertainment Area';
  }

  protected getConfiguredNamePropertyName(): string {
    return 'entertainmentTvAccessoryConfiguredName';
  }

  protected isLightbulbEnabled(): boolean {
    return this.platform.config.entertainmentTvAccessoryLightbulb;
  }

  protected createInputServices(): void {
    Object.values(this.state.hue.groups).forEach((group, index) => {
      const entertainmentInputService = this.getInputService(
        group.name,
        'AREA ' + (index + 1)
      );

      // Adds the input as a linked service, which is important so that the input is properly displayed in the Home app
      this.service.addLinkedService(entertainmentInputService);
      this.inputServices.push(entertainmentInputService);
    });
  }
}
