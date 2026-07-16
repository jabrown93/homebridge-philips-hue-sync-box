import {
  API,
  DynamicPlatformPlugin,
  Logging,
  PlatformAccessory,
  PlatformConfig,
} from 'homebridge';

import type { HueSyncBoxPlatformConfig } from './config.js';
import { SyncBoxClient } from './lib/client.js';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';
import { State } from './state.js';
import { SyncBoxDevice } from './accessories/base.js';
import {
  ENTERTAINMENT_TV_ACCESSORY,
  INTENSITY_TV_ACCESSORY,
  LIGHTBULB,
  LIGHTBULB_ACCESSORY,
  MODE_TV_ACCESSORY,
  POWER_SWITCH_ACCESSORY,
  SWITCH,
  SWITCH_ACCESSORY,
  TV_ACCESSORY,
  DEFAULT_ON_MODE,
  DEFAULT_OFF_MODE,
  DEFAULT_UPDATE_INTERVAL_SECONDS,
  DEFAULT_API_SERVER_PORT,
  DEFAULT_BASE_ACCESSORY,
  DEFAULT_TV_ACCESSORY_TYPE,
  TV_TYPE_SET_TOP_BOX,
  TV_TYPE_STREAMING_STICK,
  TV_TYPE_AUDIO_RECEIVER,
  TV_TYPE_TV,
} from './lib/constants.js';
import { SwitchDevice } from './accessories/switch.js';
import { LightbulbDevice } from './accessories/lightbulb.js';
import { PowerSwitchDevice } from './accessories/powerSwitch.js';
import { TvDevice } from './accessories/tv.js';
import { ModeTvDevice } from './accessories/modeTv.js';
import { IntensityTvDevice } from './accessories/intensityTv.js';
import { EntertainmentTvDevice } from './accessories/entertainmentTv.js';
import { ApiServer } from './api-server.js';

export class HueSyncBoxPlatform implements DynamicPlatformPlugin {
  public readonly config: HueSyncBoxPlatformConfig;
  public readonly log: Logging | Console;
  public readonly client: SyncBoxClient;
  public readonly api: API;

  private readonly devices: Array<SyncBoxDevice> = [];
  private readonly accessories: Map<string, PlatformAccessory> = new Map();
  private readonly existingAccessories: Map<string, PlatformAccessory> =
    new Map();

  private readonly externalAccessories: Map<string, PlatformAccessory> =
    new Map();

  private mainAccessory?: PlatformAccessory;

  private readonly TV_ACCESSORY_TYPES_TO_CATEGORY: Record<string, number>;

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

    this.TV_ACCESSORY_TYPES_TO_CATEGORY = {
      [TV_TYPE_SET_TOP_BOX]: this.api.hap.Categories.TV_SET_TOP_BOX,
      [TV_TYPE_STREAMING_STICK]: this.api.hap.Categories.TV_STREAMING_STICK,
      [TV_TYPE_AUDIO_RECEIVER]: this.api.hap.Categories.AUDIO_RECEIVER,
      [TV_TYPE_TV]: this.api.hap.Categories.TELEVISION,
    };

    if (!this.config.syncBoxIpAddress || !this.config.syncBoxApiAccessToken) {
      this.log.error('Missing required configuration parameters');
      throw new Error('Missing required configuration parameters');
    }

    this.client = new SyncBoxClient(this.log, this.config);

    this.log.info('Finished initializing platform:', this.config.name);

    this.api.on('didFinishLaunching', async () => {
      this.log.debug('Executed didFinishLaunching callback');
      // A rejection here would otherwise escape this async event listener as
      // an unhandled rejection, which Homebridge treats as fatal to the
      // entire process rather than just this plugin - the exact failure mode
      // this class of fix is meant to close off.
      try {
        await this.discoverDevices();
      } catch (e) {
        this.log.error('Failed to discover devices on startup.', e);
      }
    });

    if (this.config.apiServerEnabled) {
      const apiServer = new ApiServer(this);
      apiServer.start();
    }
  }

  handleConfigDefaults() {
    this.config.updateIntervalInSeconds =
      this.config.updateIntervalInSeconds ?? DEFAULT_UPDATE_INTERVAL_SECONDS;
    this.config.apiServerEnabled = this.config.apiServerEnabled ?? false;
    this.config.apiServerPort =
      this.config.apiServerPort ?? DEFAULT_API_SERVER_PORT;
    this.config.defaultOnMode = this.config.defaultOnMode ?? DEFAULT_ON_MODE;
    this.config.defaultOffMode = this.config.defaultOffMode ?? DEFAULT_OFF_MODE;
    this.config.baseAccessory =
      this.config.baseAccessory ?? DEFAULT_BASE_ACCESSORY;
    this.config.powerSwitchAccessory =
      this.config.powerSwitchAccessory ?? false;
    this.config.tvAccessory = this.config.tvAccessory ?? false;
    this.config.tvAccessoryType =
      this.config.tvAccessoryType ?? DEFAULT_TV_ACCESSORY_TYPE;
    this.config.tvAccessoryLightbulb =
      this.config.tvAccessoryLightbulb ?? false;
    this.config.modeTvAccessory = this.config.modeTvAccessory ?? false;
    this.config.modeTvAccessoryType =
      this.config.modeTvAccessoryType ?? DEFAULT_TV_ACCESSORY_TYPE;
    this.config.modeTvAccessoryLightbulb =
      this.config.modeTvAccessoryLightbulb ?? false;
    this.config.intensityTvAccessory =
      this.config.intensityTvAccessory ?? false;
    this.config.intensityTvAccessoryType =
      this.config.intensityTvAccessoryType ?? DEFAULT_TV_ACCESSORY_TYPE;
    this.config.intensityTvAccessoryLightbulb =
      this.config.intensityTvAccessoryLightbulb ?? false;
    this.config.entertainmentTvAccessory =
      this.config.entertainmentTvAccessory ?? false;
    this.config.entertainmentTvAccessoryType =
      this.config.entertainmentTvAccessoryType ?? DEFAULT_TV_ACCESSORY_TYPE;
    this.config.entertainmentTvAccessoryLightbulb =
      this.config.entertainmentTvAccessoryLightbulb ?? false;
  }

  // Omits WiFi SSID and LAN IP addresses from debug output, since debug logs are
  // routinely pasted into public support requests/issues.
  private redactStateForLogging(state: State): unknown {
    return {
      ...state,
      device: {
        ...state.device,
        ipAddress: '[REDACTED]',
        wifi: { ...state.device.wifi, ssid: '[REDACTED]' },
      },
      hue: {
        ...state.hue,
        bridgeIpAddress: '[REDACTED]',
      },
    };
  }

  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.context.kind);
    this.existingAccessories.set(accessory.UUID, accessory);
  }

  async discoverDevices() {
    const state = await this.client.getState();
    if (!state) {
      throw new Error(
        'Could not get state from sync box on initialization. This error is not recoverable, ' +
          'ensure the sync box is online and the API token is correct and restart the plugin.'
      );
    }
    this.log.debug('Discovered state:', this.redactStateForLogging(state));
    const accessories = this.discoverAccessories(state);
    const uuids = accessories.map(accessory => {
      const uuid = accessory.UUID; // see if an accessory with the same uuid has already been registered and restored from
      const existingAccessory = this.existingAccessories.get(uuid);
      const isMainAccessory = accessory.UUID === this.mainAccessory?.UUID;
      const isPowerSwitch = accessory.context.kind === POWER_SWITCH_ACCESSORY;
      if (existingAccessory) {
        this.log.debug(
          'Restoring existing accessory from cache: ',
          existingAccessory.context.kind
        );
        const device = this.createDevice(existingAccessory, state);
        this.accessories.set(accessory.UUID, existingAccessory);
        this.devices.push(device);
        if (isMainAccessory || isPowerSwitch) {
          this.api.updatePlatformAccessories([existingAccessory]);
        }
      } else {
        this.log.info('Registering new accessory:', accessory.context.kind);
        const device = this.createDevice(accessory, state);
        this.devices.push(device);
        this.accessories.set(accessory.UUID, accessory);
        if (isMainAccessory || isPowerSwitch) {
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

  async update(state: State | null) {
    this.log.debug('Updating state called');
    if (!state) {
      this.log.warn('Could not get state from sync box. Skipping update.');
      return;
    }
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
    if (
      this.config.baseAccessory === LIGHTBULB ||
      this.config.baseAccessory === SWITCH
    ) {
      this.mainAccessory = this.createPlatformAccessory(
        state,
        this.config.baseAccessory === LIGHTBULB
          ? LIGHTBULB_ACCESSORY
          : SWITCH_ACCESSORY
      );
      accessories.push(this.mainAccessory);
    }

    if (this.config.powerSwitchAccessory) {
      const powerSwitchAccessory = this.createPlatformAccessory(
        state,
        POWER_SWITCH_ACCESSORY
      );
      accessories.push(powerSwitchAccessory);
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
    const uuidSeed = this.config.uuidSeed ?? '';
    const accessory = new this.api.platformAccessory(
      kind === POWER_SWITCH_ACCESSORY
        ? state.device.name + ' Power'
        : state.device.name,
      this.api.hap.uuid.generate(kind + uuidSeed)
    );
    if (kind === LIGHTBULB_ACCESSORY) {
      this.mainAccessory = accessory;
      accessory.category = this.api.hap.Categories.LIGHTBULB;
    } else if (kind === SWITCH_ACCESSORY) {
      this.mainAccessory = accessory;
      accessory.category = this.api.hap.Categories.SWITCH;
    } else if (kind === POWER_SWITCH_ACCESSORY) {
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
      this.TV_ACCESSORY_TYPES_TO_CATEGORY[accessoryType.toLowerCase()] ??
      this.api.hap.Categories.TELEVISION;
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
      case POWER_SWITCH_ACCESSORY:
        return new PowerSwitchDevice(this, accessory, state);
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
