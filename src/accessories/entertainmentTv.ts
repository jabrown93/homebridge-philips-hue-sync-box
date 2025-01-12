import type { PlatformAccessory } from 'homebridge';
import { HueSyncBoxPlatform } from '../platform';
import { State } from '../state';
import { BaseTvDevice } from './baseTv';

export class EntertainmentTvDevice extends BaseTvDevice {
  constructor(
    protected readonly platform: HueSyncBoxPlatform,
    public readonly accessory: PlatformAccessory,
    protected state: State
  ) {
    super(platform, accessory, state);
    this.service
      .getCharacteristic(this.platform.Characteristic.ActiveIdentifier)
      .onSet(async value => {
        // Gets the ID of the group based on the index
        let groupId: string | null = null;
        let i = 1;
        for (const currentGroupId in this.state.hue.groups) {
          if (i === value) {
            groupId = currentGroupId;
            break;
          }
          i++;
        }

        // @ts-expect-error need to use self as a key
        const group = this.state.hue.groups[groupId];
        if (!group || !groupId) {
          return;
        }
        // Saves the changes
        this.platform.log.debug('Switch entertainment area to ' + group.name);
        try {
          await this.platform.client.updateHue({
            groupId: groupId,
          });
        } catch (e) {
          this.platform.log.debug(
            'Failed to switch entertainment area to ' + group.name,
            e
          );
        }
      });
  }

  updateTv(): void {
    // Gets the ID of the group based on the index
    let index = 1;
    for (const currentGroupId in this.state.hue.groups) {
      if (currentGroupId === this.state.hue.groupId) {
        break;
      }
      index++;
    }

    // Updates the input characteristic
    this.service.updateCharacteristic(
      this.platform.Characteristic.ActiveIdentifier,
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

  protected isLightbulbEnabled(): boolean {
    return this.platform.config.intensityTvAccessoryLightbulb;
  }

  protected createInputServices(): void {
    let i = 1;
    for (const groupId in this.state.hue.groups) {
      const group = this.state.hue.groups[groupId];
      const name = group.name;
      const position = 'AREA ' + i;

      const entertainmentInputService = this.getInputService(name, position);

      // Adds the input as a linked service, which is important so that the input is properly displayed in the Home app
      this.service.addLinkedService(entertainmentInputService);
      this.inputServices.push(entertainmentInputService);

      i++;
    }
  }
}
