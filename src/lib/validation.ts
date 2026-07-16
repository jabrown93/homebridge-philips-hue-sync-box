import { Execution, Hue, State } from '../state.js';
import {
  MODE_VIDEO,
  MODE_MUSIC,
  MODE_GAME,
  PASSTHROUGH,
  POWER_SAVE,
  BRIGHTNESS_MIN,
  BRIGHTNESS_MAX_SYNCBOX,
  HDMI_INPUT_MIN,
  HDMI_INPUT_MAX,
  VALID_INTENSITIES,
} from './constants.js';

export type ValidationResult<T> =
  | { ok: true; value: Partial<T> }
  | { ok: false; error: string };

const VALID_EXECUTION_MODES: string[] = [
  MODE_VIDEO,
  MODE_MUSIC,
  MODE_GAME,
  PASSTHROUGH,
  POWER_SAVE,
];
const HDMI_SOURCE_PATTERN = new RegExp(
  `^input[${HDMI_INPUT_MIN}-${HDMI_INPUT_MAX}]$`
);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateIntensityPayload(
  value: unknown,
  field: string
): ValidationResult<{ intensity: string }> {
  if (!isPlainObject(value)) {
    return { ok: false, error: `${field} must be an object.` };
  }
  const keys = Object.keys(value);
  if (keys.length !== 1 || keys[0] !== 'intensity') {
    return {
      ok: false,
      error: `${field} may only contain an 'intensity' field.`,
    };
  }
  if (
    typeof value.intensity !== 'string' ||
    !VALID_INTENSITIES.includes(value.intensity)
  ) {
    return {
      ok: false,
      error: `${field}.intensity must be one of: ${VALID_INTENSITIES.join(', ')}.`,
    };
  }
  return { ok: true, value: { intensity: value.intensity } };
}

/**
 * Applies the same bounds/allowlist checks the HomeKit-driven accessory code applies
 * before calling SyncBoxClient.updateExecution, so the API server can't be used to send
 * values no legitimate code path would ever produce.
 */
export function validateExecution(input: unknown): ValidationResult<Execution> {
  if (!isPlainObject(input)) {
    return { ok: false, error: 'execution must be an object.' };
  }

  const value: Record<string, unknown> = {};

  for (const key of Object.keys(input)) {
    switch (key) {
      case 'mode': {
        const mode = input.mode;
        if (typeof mode !== 'string' || !VALID_EXECUTION_MODES.includes(mode)) {
          return {
            ok: false,
            error: `execution.mode must be one of: ${VALID_EXECUTION_MODES.join(', ')}.`,
          };
        }
        value.mode = mode;
        break;
      }
      case 'brightness': {
        const brightness = input.brightness;
        if (
          typeof brightness !== 'number' ||
          !Number.isFinite(brightness) ||
          brightness < BRIGHTNESS_MIN ||
          brightness > BRIGHTNESS_MAX_SYNCBOX
        ) {
          return {
            ok: false,
            error: `execution.brightness must be a number between ${BRIGHTNESS_MIN} and ${BRIGHTNESS_MAX_SYNCBOX}.`,
          };
        }
        value.brightness = brightness;
        break;
      }
      case 'hdmiSource': {
        const hdmiSource = input.hdmiSource;
        if (
          typeof hdmiSource !== 'string' ||
          !HDMI_SOURCE_PATTERN.test(hdmiSource)
        ) {
          return {
            ok: false,
            error: `execution.hdmiSource must match input${HDMI_INPUT_MIN} through input${HDMI_INPUT_MAX}.`,
          };
        }
        value.hdmiSource = hdmiSource;
        break;
      }
      case 'video':
      case 'game':
      case 'music': {
        const result = validateIntensityPayload(input[key], `execution.${key}`);
        if (!result.ok) {
          return result;
        }
        value[key] = result.value;
        break;
      }
      default:
        return {
          ok: false,
          error: `execution.${key} is not a recognized or settable field.`,
        };
    }
  }

  if (Object.keys(value).length === 0) {
    return {
      ok: false,
      error: 'execution must contain at least one recognized field.',
    };
  }

  return { ok: true, value: value as Partial<Execution> };
}

/**
 * Mirrors EntertainmentTvDevice's group-existence check: only a groupId that exists in
 * the device's current state may be forwarded to SyncBoxClient.updateHue.
 */
export function validateHue(
  input: unknown,
  state: State | null
): ValidationResult<Hue> {
  if (!isPlainObject(input)) {
    return { ok: false, error: 'hue must be an object.' };
  }

  const keys = Object.keys(input);
  if (keys.length !== 1 || keys[0] !== 'groupId') {
    return { ok: false, error: 'hue may only contain a groupId field.' };
  }

  const groupId = input.groupId;
  if (typeof groupId !== 'string' || !groupId) {
    return { ok: false, error: 'hue.groupId must be a non-empty string.' };
  }

  if (
    !state?.hue?.groups ||
    !Object.prototype.hasOwnProperty.call(state.hue.groups, groupId)
  ) {
    return {
      ok: false,
      error: 'hue.groupId does not match a known entertainment area.',
    };
  }

  return { ok: true, value: { groupId } };
}
