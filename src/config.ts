import { PlatformConfig } from 'homebridge';

export type TvAccessoryType = 'tv' | 'settopbox' | 'tvstick' | 'audioreceiver';
export type OnMode = 'video' | 'music' | 'game' | 'lastSyncMode';
export type OffMode = 'powersave' | 'passthrough';

export interface HueSyncBoxPlatformConfig extends PlatformConfig {
  syncBoxIpAddress: string;
  syncBoxApiAccessToken: string;
  defaultOnMode: OnMode;
  defaultOffMode: OffMode;
  baseAccessory: 'lightbulb' | 'switch' | 'none';
  tvAccessory: boolean;
  tvAccessoryType: TvAccessoryType;
  tvAccessoryLightbulb: boolean;
  modeTvAccessory: boolean;
  modeTvAccessoryType: TvAccessoryType;
  modeTvAccessoryLightbulb: boolean;
  intensityTvAccessory: boolean;
  intensityTvAccessoryType: TvAccessoryType;
  intensityTvAccessoryLightbulb: boolean;
  entertainmentTvAccessory: boolean;
  entertainmentTvAccessoryType: TvAccessoryType;
  entertainmentTvAccessoryLightbulb: boolean;
  publishExternalAccessories: boolean;
  updateIntervalInSeconds: number;
  apiServerPort: number;
  apiServerToken: string;
  apiServerEnabled: boolean;
}
