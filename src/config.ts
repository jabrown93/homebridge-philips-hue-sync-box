import { PlatformConfig } from 'homebridge';

export type tvAccessoryType = 'tv' | 'settopbox' | 'tvstick' | 'audioreceiver';

export interface HueSyncBoxPlatformConfig extends PlatformConfig {
  syncBoxIpAddress: string;
  syncBoxApiAccessToken: string;
  defaultOnMode: string;
  defaultOffMode: string;
  baseAccessory: 'lightbulb' | 'switch' | 'none';
  tvAccessory: boolean;
  tvAccessoryType: tvAccessoryType;
  tvAccessoryLightbulb: boolean;
  modeTvAccessory: boolean;
  modeTvAccessoryType: tvAccessoryType;
  modeTvAccessoryLightbulb: boolean;
  intensityTvAccessory: boolean;
  intensityTvAccessoryType: tvAccessoryType;
  intensityTvAccessoryLightbulb: boolean;
  entertainmentTvAccessory: boolean;
  entertainmentTvAccessoryType: tvAccessoryType;
  entertainmentTvAccessoryLightbulb: boolean;
  updateIntervalInSeconds: number;
  apiServerPort: number;
  apiServerToken: string;
  apiServerEnabled: boolean;
}
