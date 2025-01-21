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
  baseAccessoryName: string;
  tvAccessory: boolean;
  tvAccessoryConfiguredName: string;
  tvAccessoryType: TvAccessoryType;
  tvAccessoryLightbulb: boolean;
  modeTvAccessory: boolean;
  modeTvAccessoryConfiguredName: string;
  modeTvAccessoryType: TvAccessoryType;
  modeTvAccessoryLightbulb: boolean;
  intensityTvAccessory: boolean;
  intensityTvAccessoryConfiguredName: string;
  intensityTvAccessoryType: TvAccessoryType;
  intensityTvAccessoryLightbulb: boolean;
  entertainmentTvAccessory: boolean;
  entertainmentTvAccessoryConfiguredName: string;
  entertainmentTvAccessoryType: TvAccessoryType;
  entertainmentTvAccessoryLightbulb: boolean;
  updateIntervalInSeconds: number;
  uuidSeed?: string;
  apiServerPort: number;
  apiServerToken: string;
  apiServerEnabled: boolean;
}
