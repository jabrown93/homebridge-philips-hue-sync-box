import { Categories } from 'homebridge';

export const PASSTHROUGH: string = 'passthrough';
export const POWER_SAVE: string = 'powersave';
export const LIGHTBULB_ACCESSORY: string = 'LightbulbAccessory';
export const SWITCH_ACCESSORY: string = 'SwitchAccessory';
export const TV_ACCESSORY: string = 'TvAccessory';
export const MODE_TV_ACCESSORY: string = 'ModeTvAccessory';
export const INTENSITY_TV_ACCESSORY: string = 'IntensityTvAccessory';
export const ENTERTAINMENT_TV_ACCESSORY: string = 'EntertainmentTvAccessory';
export const TV_ACCESSORY_TYPES_TO_CATEGORY: Record<string, number> = {
  settopbox: Categories.TV_SET_TOP_BOX,
  tvstick: Categories.TV_STREAMING_STICK,
  audioreceiver: Categories.AUDIO_RECEIVER,
  television: Categories.TELEVISION,
};
