import { Categories } from 'homebridge';

export const PASSTHROUGH: string = 'passthrough';
export const POWER_SAVE: string = 'powersave';
export const LIGHTBULB_ACCESSORY: string = 'LightBulbAccessory';
export const SWITCH_ACCESSORY: string = 'SwitchAccessory';
export const TV_ACCESSORY: string = 'TVAccessory';
export const MODE_TV_ACCESSORY: string = 'ModeTVAccessory';
export const INTENSITY_TV_ACCESSORY: string = 'IntensityTVAccessory';
export const ENTERTAINMENT_TV_ACCESSORY: string = 'EntertainmentTVAccessory';
export const TV_ACCESSORY_TYPES_TO_CATEGORY: Record<string, number> = {
  settopbox: Categories.TV_SET_TOP_BOX,
  tvstick: Categories.TV_STREAMING_STICK,
  audioreceiver: Categories.AUDIO_RECEIVER,
  tv: Categories.TELEVISION,
};
