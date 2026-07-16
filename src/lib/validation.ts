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

export function isPlainObject(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Confirms the shape every accessory unconditionally dereferences
 * (device.name/firmwareVersion/uniqueId, execution.mode, hue, hdmi) is
 * actually present, so a malformed or spoofed Sync Box response fails here
 * instead of throwing a TypeError deep inside an accessory's update().
 */
export function isValidState(value: unknown): value is State {
  if (!isPlainObject(value)) {
    return false;
  }
  const { device, execution, hue, hdmi } = value;
  return (
    isPlainObject(device) &&
    typeof device.name === 'string' &&
    typeof device.firmwareVersion === 'string' &&
    typeof device.uniqueId === 'string' &&
    isPlainObject(execution) &&
    typeof execution.mode === 'string' &&
    isPlainObject(hue) &&
    isPlainObject(hdmi)
  );
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

function validateModeField(value: unknown): ValidationResult<Execution> {
  if (typeof value !== 'string' || !VALID_EXECUTION_MODES.includes(value)) {
    return {
      ok: false,
      error: `execution.mode must be one of: ${VALID_EXECUTION_MODES.join(', ')}.`,
    };
  }
  return { ok: true, value: { mode: value } };
}

function validateBrightnessField(value: unknown): ValidationResult<Execution> {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < BRIGHTNESS_MIN ||
    value > BRIGHTNESS_MAX_SYNCBOX
  ) {
    return {
      ok: false,
      error: `execution.brightness must be a number between ${BRIGHTNESS_MIN} and ${BRIGHTNESS_MAX_SYNCBOX}.`,
    };
  }
  return { ok: true, value: { brightness: value } };
}

function validateHdmiSourceField(value: unknown): ValidationResult<Execution> {
  if (typeof value !== 'string' || !HDMI_SOURCE_PATTERN.test(value)) {
    return {
      ok: false,
      error: `execution.hdmiSource must match input${HDMI_INPUT_MIN} through input${HDMI_INPUT_MAX}.`,
    };
  }
  return { ok: true, value: { hdmiSource: value } };
}

function validateExecutionField(
  key: string,
  value: unknown
): ValidationResult<Execution> {
  switch (key) {
    case 'mode':
      return validateModeField(value);
    case 'brightness':
      return validateBrightnessField(value);
    case 'hdmiSource':
      return validateHdmiSourceField(value);
    case 'video':
    case 'game':
    case 'music': {
      const result = validateIntensityPayload(value, `execution.${key}`);
      return result.ok ? { ok: true, value: { [key]: result.value } } : result;
    }
    default:
      return {
        ok: false,
        error: `execution.${key} is not a recognized or settable field.`,
      };
  }
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
    const result = validateExecutionField(key, input[key]);
    if (!result.ok) {
      return result;
    }
    Object.assign(value, result.value);
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

  if (!state?.hue?.groups || !Object.hasOwn(state.hue.groups, groupId)) {
    return {
      ok: false,
      error: 'hue.groupId does not match a known entertainment area.',
    };
  }

  return { ok: true, value: { groupId } };
}
