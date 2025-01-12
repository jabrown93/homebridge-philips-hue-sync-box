import type {
  API,
  Characteristic,
  DynamicPlatformPlugin,
  Logging,
  PlatformAccessory,
  Service,
  HAP,
  PlatformConfig,
} from 'homebridge';

import { HueSyncBoxPlatformConfig } from './config';
import { SyncBoxClient } from './lib/client';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { State } from './state';
import { SyncBoxDevice } from './accessories/base';
import {
  ENTERTAINMENT_TV_ACCESSORY,
  INTENSITY_TV_ACCESSORY,
  LIGHTBULB_ACCESSORY,
  MODE_TV_ACCESSORY,
  SWITCH_ACCESSORY,
  TV_ACCESSORY,
  TV_ACCESSORY_TYPES_TO_CATEGORY,
} from './lib/constants';
import { SwitchDevice } from './accessories/switch';
import { LightbulbDevice } from './accessories/lightbulb';
import { TvDevice } from './accessories/tv';
import { ModeTvDevice } from './accessories/modeTv';
import { IntensityTvDevice } from './accessories/intensityTv';
import { EntertainmentTvDevice } from './accessories/entertainmentTv';
import { ApiServer } from './api-server';

export class HueSyncBoxPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;
  public readonly config: HueSyncBoxPlatformConfig;
  public readonly HAP: HAP;
  public readonly accessories: Map<string, PlatformAccessory> = new Map();
  public readonly devices: Array<SyncBoxDevice> = [];
  public readonly externalAccessories: Array<PlatformAccessory> = [];
  public readonly log: Logging | Console;
  public readonly client: SyncBoxClient;
  public readonly api: API;

  constructor(
    public readonly logger: Logging,
    public readonly platformConfig: PlatformConfig,
    public readonly apiInput: API
  ) {
    if (!apiInput) {
      throw new Error('API is not defined');
    }
    this.config = platformConfig as HueSyncBoxPlatformConfig;
    this.api = apiInput;
    this.log = logger ?? console;
    this.log.info('Initializing platform:', this.config.name);

    if (!this.config.syncBoxIpAddress || !this.config.syncBoxApiAccessToken) {
      this.log.error('Missing required configuration parameters');
      throw new Error('Missing required configuration parameters');
    }

    this.Service = this.api.hap.Service;
    this.Characteristic = this.api.hap.Characteristic;
    this.HAP = this.api.hap;
    this.client = new SyncBoxClient(this.log, this.config);

    this.log.info('Finished initializing platform:', this.config.name);

    this.api.on('didFinishLaunching', async () => {
      this.log.debug('Executed didFinishLaunching callback');
      await this.discoverDevices();
    });

    if (this.config.apiServerEnabled) {
      const apiServer = new ApiServer(this);
      apiServer.start();
    }
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.accessories.set(accessory.UUID, accessory);
  }

  async discoverDevices() {
    const state = await this.client.getState();
    const accessories = this.discoverAccessories(state);
    // loop over the discovered devices and register each one if it has not already been registered
    const uuids = accessories.map(accessory => {
      // generate a unique id for the accessory this should be generated from
      // something globally unique, but constant, for example, the device serial
      // number or MAC address
      const uuid = accessory.UUID;
      this.log.debug('UUID:', uuid);
      this.log.debug('accessories contains:', this.accessories.has(uuid));
      // see if an accessory with the same uuid has already been registered and restored from
      // the cached devices we stored in the `configureAccessory` method above
      const existingAccessory = this.accessories.get(uuid);
      if (existingAccessory) {
        this.log.debug(
          'Restoring existing accessory from cache: ',
          existingAccessory.displayName
        );
        const device = this.createDevice(existingAccessory, state);
        this.devices.push(device);
        this.api.updatePlatformAccessories([existingAccessory]);
      } else {
        this.log.info('Registering new accessory:', accessory.context.kind);
        const device = this.createDevice(accessory, state);
        this.devices.push(device);
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
          accessory,
        ]);
      }
      return uuid;
    });

    this.accessories.forEach(existingAccessory => {
      if (!uuids.includes(existingAccessory.UUID)) {
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
          existingAccessory,
        ]);
        this.log.info(
          'Removing existing accessory from cache:',
          existingAccessory.displayName
        );
      }
    });

    this.externalAccessories.forEach(externalAccessory => {
      const uuid = externalAccessory.UUID;
      const existingAccessory = this.accessories.get(uuid);
      if (!existingAccessory) {
        this.api.publishExternalAccessories(PLUGIN_NAME, [externalAccessory]);
      }
    });

    await this.update(state);
    setInterval(async () => {
      const state = await this.client.getState();
      await this.update(state);
    }, this.config.updateIntervalInSeconds * 1000);
  }

  async update(state: State) {
    this.log.debug('Updating state called');
    for (const device of this.devices) {
      this.log.debug('Updating device:', device.accessory.displayName);
      device.update(state);
    }
  }

  private discoverAccessories(state: State): PlatformAccessory[] {
    this.log.debug('Discovering devices');
    const accessories: PlatformAccessory[] = [];
    if (this.config.baseAccessory !== 'none') {
      const mainAccessory = this.createPlatformAccessory(
        state,
        this.config.baseAccessory === 'lightbulb'
          ? LIGHTBULB_ACCESSORY
          : SWITCH_ACCESSORY
      );
      accessories.push(mainAccessory);
    }
    if (this.config.tvAccessory) {
      const tvAccessory = this.createTvAccessory(
        state,
        TV_ACCESSORY,
        this.config.tvAccessoryType
      );
      accessories.push(tvAccessory);
    }

    if (this.config.modeTvAccessory) {
      const accessory = this.createTvAccessory(
        state,
        MODE_TV_ACCESSORY,
        this.config.modeTvAccessoryType
      );
      accessories.push(accessory);
    }

    if (this.config.intensityTvAccessory) {
      const accessory = this.createTvAccessory(
        state,
        INTENSITY_TV_ACCESSORY,
        this.config.intensityTvAccessoryType
      );
      accessories.push(accessory);
    }

    if (this.config.entertainmentTvAccessory) {
      const accessory = this.createTvAccessory(
        state,
        ENTERTAINMENT_TV_ACCESSORY,
        this.config.entertainmentTvAccessoryType
      );
      accessories.push(accessory);
    }
    return accessories;
  }

  private createPlatformAccessory(state: State, kind: string) {
    this.log.debug('Creating new accessory with kind ' + kind + '.');
    const accessory = new this.api.platformAccessory(
      state.device.name,
      this.api.hap.uuid.generate(kind)
    );
    if (kind === LIGHTBULB_ACCESSORY) {
      accessory.category = this.api.hap.Categories.LIGHTBULB;
    } else if (kind === SWITCH_ACCESSORY) {
      accessory.category = this.api.hap.Categories.SWITCH;
    }
    accessory.context.kind = kind;
    return accessory;
  }

  private createTvAccessory(
    state: State,
    accessoryName: string,
    accessoryType: string
  ) {
    const accessory = this.createPlatformAccessory(state, accessoryName);
    accessory.category = TV_ACCESSORY_TYPES_TO_CATEGORY[accessoryType];
    this.externalAccessories.push(accessory);
    return accessory;
  }

  private createDevice(
    accessory: PlatformAccessory,
    state: State
  ): SyncBoxDevice {
    const type = accessory.context.kind;
    switch (type) {
      case SWITCH_ACCESSORY:
        return new SwitchDevice(this, accessory, state);
      case LIGHTBULB_ACCESSORY:
        return new LightbulbDevice(this, accessory, state);
      case TV_ACCESSORY:
        return new TvDevice(this, accessory, state);
      case MODE_TV_ACCESSORY:
        return new ModeTvDevice(this, accessory, state);
      case INTENSITY_TV_ACCESSORY:
        return new IntensityTvDevice(this, accessory, state);
      case ENTERTAINMENT_TV_ACCESSORY:
        return new EntertainmentTvDevice(this, accessory, state);
      default:
        throw new Error('Unknown accessory type: ' + type);
    }
  }
}
