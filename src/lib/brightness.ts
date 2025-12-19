import { BRIGHTNESS_MAX_HOMEKIT, BRIGHTNESS_MAX_SYNCBOX } from './constants.js';

/**
 * Converts a HomeKit brightness value (0-100) to a Sync Box brightness value (0-200)
 * @param homekitValue - The HomeKit brightness value (0-100)
 * @returns The Sync Box brightness value (0-200)
 */
export function convertHomekitToSyncBox(homekitValue: number): number {
  return Math.round(
    (homekitValue / BRIGHTNESS_MAX_HOMEKIT) * BRIGHTNESS_MAX_SYNCBOX
  );
}

/**
 * Converts a Sync Box brightness value (0-200) to a HomeKit brightness value (0-100)
 * @param syncBoxValue - The Sync Box brightness value (0-200)
 * @returns The HomeKit brightness value (0-100)
 */
export function convertSyncBoxToHomekit(syncBoxValue: number): number {
  return Math.round(
    (syncBoxValue / BRIGHTNESS_MAX_SYNCBOX) * BRIGHTNESS_MAX_HOMEKIT
  );
}
