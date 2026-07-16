// ===== Sync Box Modes =====
export const PASSTHROUGH: string = 'passthrough';
export const POWER_SAVE: string = 'powersave';
export const MODE_VIDEO: string = 'video';
export const MODE_MUSIC: string = 'music';
export const MODE_GAME: string = 'game';
export const MODE_LAST_SYNC: string = 'lastSyncMode';

// ===== Accessory Types =====
export const LIGHTBULB = 'lightbulb';
export const SWITCH = 'switch';
export const POWER_SWITCH = 'powerSwitch';
export const LIGHTBULB_ACCESSORY: string = 'LightBulbAccessory';
export const SWITCH_ACCESSORY: string = 'SwitchAccessory';
export const POWER_SWITCH_ACCESSORY: string = 'PowerSwitchAccessory';
export const TV_ACCESSORY: string = 'TVAccessory';
export const MODE_TV_ACCESSORY: string = 'ModeTVAccessory';
export const INTENSITY_TV_ACCESSORY: string = 'IntensityTVAccessory';
export const ENTERTAINMENT_TV_ACCESSORY: string = 'EntertainmentTVAccessory';

// ===== TV Accessory Types =====
export const TV_TYPE_TV: string = 'tv';
export const TV_TYPE_SET_TOP_BOX: string = 'settopbox';
export const TV_TYPE_STREAMING_STICK: string = 'tvstick';
export const TV_TYPE_AUDIO_RECEIVER: string = 'audioreceiver';

// ===== Brightness Constants =====
export const BRIGHTNESS_MIN = 0;
export const BRIGHTNESS_MAX_HOMEKIT = 100; // HomeKit brightness scale (0-100%)
export const BRIGHTNESS_MAX_SYNCBOX = 200; // Sync Box brightness scale (0-200)
export const BRIGHTNESS_STEP_PERCENT = 25; // Percentage step for remote up/down
export const BRIGHTNESS_STEP_SYNCBOX = 50; // Actual value to add/subtract (25% of 200)

// ===== HDMI Constants =====
export const HDMI_INPUT_MAX = 4;
export const HDMI_INPUT_MIN = 1;

// ===== Default Configuration Values =====
export const DEFAULT_ON_MODE = MODE_VIDEO;
export const DEFAULT_OFF_MODE = PASSTHROUGH;
export const DEFAULT_UPDATE_INTERVAL_SECONDS = 5;
export const DEFAULT_API_SERVER_PORT = 40220;
export const DEFAULT_BASE_ACCESSORY = LIGHTBULB;
export const DEFAULT_TV_ACCESSORY_TYPE = TV_TYPE_TV;

// ===== HTTP Client Constants =====
export const HTTP_RETRY_COUNT = 3;
export const HTTP_RETRY_BASE_DELAY_MS = 1000;
export const HTTP_STATUS_OK = 200;
export const HTTP_STATUS_UNAUTHORIZED = 401;
export const HTTP_STATUS_BAD_REQUEST = 400;
export const HTTP_STATUS_PAYLOAD_TOO_LARGE = 413;
export const HTTP_STATUS_METHOD_NOT_ALLOWED = 405;
export const HTTP_STATUS_INTERNAL_ERROR = 500;

// ===== Intensity Constants =====
export const VALID_INTENSITIES: string[] = [
  'subtle',
  'moderate',
  'high',
  'intense',
];

// ===== API Server Security Constants =====
// Minimum length required for apiServerToken before the API server will start.
export const MIN_API_TOKEN_LENGTH = 32;
// Legitimate execution/hue payloads are a few hundred bytes; this caps request
// bodies well above that while still bounding memory use per connection.
export const MAX_API_BODY_BYTES = 100_000;
// No legitimate request to this API should take anywhere near this long.
export const API_REQUEST_TIMEOUT_MS = 10_000;
