import {
  API,
  Characteristic,
  DynamicPlatformPlugin,
  Logging,
  PlatformAccessory,
  Service,
  HAP,
  PlatformConfig,
  Categories,
} from 'homebridge';

import { HueSyncBoxPlatformConfig } from './config';
import { SyncBoxClient } from './lib/client.js';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';
import { State } from './state.js';
import { SyncBoxDevice } from './accessories/base.js';
import {
  ENTERTAINMENT_TV_ACCESSORY,
  INTENSITY_TV_ACCESSORY,
  LIGHTBULB_ACCESSORY,
  MODE_TV_ACCESSORY,
  SWITCH_ACCESSORY,
  TV_ACCESSORY,
  TV_ACCESSORY_TYPES_TO_CATEGORY,
} from './lib/constants.js';
import { SwitchDevice } from './accessories/switch.js';
import { LightbulbDevice } from './accessories/lightbulb.js';
import { TvDevice } from './accessories/tv.js';
import { ModeTvDevice } from './accessories/modeTv.js';
import { IntensityTvDevice } from './accessories/intensityTv.js';
import { EntertainmentTvDevice } from './accessories/entertainmentTv.js';
import { ApiServer } from './api-server.js';

export class HueSyncBoxPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;
  public readonly config: HueSyncBoxPlatformConfig;
  public readonly HAP: HAP;
  public readonly existingAccessories: Map<string, PlatformAccessory> =
    new Map();
  public readonly accessories: Map<string, PlatformAccessory> = new Map();
  public readonly devices: Array<SyncBoxDevice> = [];
  public readonly externalAccessories: Map<string, PlatformAccessory> =
    new Map();
  public readonly log: Logging | Console;
  public readonly client: SyncBoxClient;
  public readonly api: API;
  private mainAccessory?: PlatformAccessory;

  constructor(
    public readonly logger: Logging,
    public readonly platformConfig: PlatformConfig,
    public readonly apiInput: API
  ) {
    if (!apiInput) {
      throw new Error('API is not defined');
    }
    this.config = platformConfig as HueSyncBoxPlatformConfig;
    this.handleConfigDefaults();
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

  handleConfigDefaults() {
    this.config.updateIntervalInSeconds =
      this.config.updateIntervalInSeconds ?? 5;
    this.config.apiServerEnabled = this.config.apiServerEnabled ?? false;
    this.config.apiServerPort = this.config.apiServerPort ?? 40220;
    this.config.defaultOnMode = this.config.defaultOnMode ?? 'video';
    this.config.defaultOffMode = this.config.defaultOffMode ?? 'passthrough';
    this.config.baseAccessory = this.config.baseAccessory ?? 'lightbulb';
    this.config.tvAccessory = this.config.tvAccessory ?? false;
    this.config.tvAccessoryType = this.config.tvAccessoryType ?? 'tv';
    this.config.tvAccessoryLightbulb =
      this.config.tvAccessoryLightbulb ?? false;
    this.config.modeTvAccessory = this.config.modeTvAccessory ?? false;
    this.config.modeTvAccessoryType = this.config.modeTvAccessoryType ?? 'tv';
    this.config.modeTvAccessoryLightbulb =
      this.config.modeTvAccessoryLightbulb ?? false;
    this.config.intensityTvAccessory =
      this.config.intensityTvAccessory ?? false;
    this.config.intensityTvAccessoryType =
      this.config.intensityTvAccessoryType ?? 'tv';
    this.config.intensityTvAccessoryLightbulb =
      this.config.intensityTvAccessoryLightbulb ?? false;
    this.config.entertainmentTvAccessory =
      this.config.entertainmentTvAccessory ?? false;
    this.config.entertainmentTvAccessoryType =
      this.config.entertainmentTvAccessoryType ?? 'tv';
    this.config.entertainmentTvAccessoryLightbulb =
      this.config.entertainmentTvAccessoryLightbulb ?? false;
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.context.kind);
    this.existingAccessories.set(accessory.UUID, accessory);
  }

  async discoverDevices() {
    const state = await this.client.getState();
    const accessories = this.discoverAccessories(state);
    const uuids = accessories.map(accessory => {
      const uuid = accessory.UUID; // see if an accessory with the same uuid has already been registered and restored from
      const existingAccessory = this.existingAccessories.get(uuid);
      const isMainAccessory = accessory.UUID === this.mainAccessory?.UUID;
      if (existingAccessory) {
        this.log.debug(
          'Restoring existing accessory from cache: ',
          existingAccessory.context.kind,
          existingAccessory
        );
        const device = this.createDevice(existingAccessory, state);
        this.accessories.set(accessory.UUID, existingAccessory);
        this.devices.push(device);
        if (isMainAccessory) {
          this.api.updatePlatformAccessories([existingAccessory]);
        }
      } else {
        this.log.info('Registering new accessory:', accessory.context.kind);
        const device = this.createDevice(accessory, state);
        this.devices.push(device);
        this.accessories.set(accessory.UUID, accessory);
        if (isMainAccessory) {
          this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
            accessory,
          ]);
        }
      }
      return uuid;
    });

    this.existingAccessories.forEach(existingAccessory => {
      if (!uuids.includes(existingAccessory.UUID)) {
        this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [
          existingAccessory,
        ]);
        this.log.info(
          'Removing existing accessory from cache:',
          existingAccessory.context.kind
        );
      }
    });

    this.log.debug(
      `Publishing external ${Array.from(this.externalAccessories.values()).length} accessories`
    );
    this.api.publishExternalAccessories(
      PLUGIN_NAME,
      Array.from(this.externalAccessories.values())
    );

    this.log.debug(`Discovered ${this.devices.length} devices`);

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
    this.log.debug(
      'Loaded existing accessories:',
      this.existingAccessories.size
    );
    this.log.debug('Discovering accessories');
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
    this.log.debug(`Discovered ${accessories.length} accessories`);
    return accessories;
  }

  private createPlatformAccessory(state: State, kind: string) {
    this.log.debug('Creating new accessory with kind ' + kind + '.');
    const accessory = new this.api.platformAccessory(
      state.device.name,
      this.api.hap.uuid.generate(kind)
    );
    if (kind === LIGHTBULB_ACCESSORY) {
      this.mainAccessory = accessory;
      accessory.category = this.api.hap.Categories.LIGHTBULB;
    } else if (kind === SWITCH_ACCESSORY) {
      this.mainAccessory = accessory;
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
    accessory.category =
      TV_ACCESSORY_TYPES_TO_CATEGORY[accessoryType.toLowerCase()] ??
      Categories.TELEVISION;
    this.externalAccessories.set(accessory.UUID, accessory);
    this.log.debug(
      'Created TV named ' +
        accessoryName +
        ' with type ' +
        accessoryType +
        ' and category ' +
        accessory.category
    );
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
        return new TvDevice(this, accessory, state, this.mainAccessory);
      case MODE_TV_ACCESSORY:
        return new ModeTvDevice(this, accessory, state, this.mainAccessory);
      case INTENSITY_TV_ACCESSORY:
        return new IntensityTvDevice(
          this,
          accessory,
          state,
          this.mainAccessory
        );
      case ENTERTAINMENT_TV_ACCESSORY:
        return new EntertainmentTvDevice(
          this,
          accessory,
          state,
          this.mainAccessory
        );
      default:
        throw new Error('Unknown accessory type: ' + type);
    }
  }
}
