import { describe, it, expect } from 'vitest';
import {
  MODE_VIDEO,
  MODE_MUSIC,
  MODE_GAME,
  MODE_LAST_SYNC,
  PASSTHROUGH,
  POWER_SAVE,
  BRIGHTNESS_MAX_HOMEKIT,
  BRIGHTNESS_MAX_SYNCBOX,
  BRIGHTNESS_STEP_PERCENT,
  BRIGHTNESS_STEP_SYNCBOX,
  BRIGHTNESS_MIN,
  HDMI_INPUT_MAX,
  HDMI_INPUT_MIN,
  DEFAULT_ON_MODE,
  DEFAULT_OFF_MODE,
  DEFAULT_UPDATE_INTERVAL_SECONDS,
  DEFAULT_API_SERVER_PORT,
  DEFAULT_BASE_ACCESSORY,
  DEFAULT_TV_ACCESSORY_TYPE,
  LIGHTBULB,
  TV_TYPE_TV,
  HTTP_RETRY_COUNT,
  HTTP_RETRY_BASE_DELAY_MS,
  HTTP_STATUS_OK,
  HTTP_STATUS_UNAUTHORIZED,
  SYNC_BOX_REQUEST_TIMEOUT_MS,
  SYNC_BOX_REQUEST_BUDGET_MS,
  SYNC_BOX_LOCK_MAX_EXECUTION_TIME_MS,
} from '../../../src/lib/constants.js';

describe('Constants', () => {
  describe('Sync Box Modes', () => {
    it('should have correct mode values', () => {
      expect(MODE_VIDEO).toBe('video');
      expect(MODE_MUSIC).toBe('music');
      expect(MODE_GAME).toBe('game');
      expect(MODE_LAST_SYNC).toBe('lastSyncMode');
      expect(PASSTHROUGH).toBe('passthrough');
      expect(POWER_SAVE).toBe('powersave');
    });

    it('should have unique mode values', () => {
      const modes = [
        MODE_VIDEO,
        MODE_MUSIC,
        MODE_GAME,
        MODE_LAST_SYNC,
        PASSTHROUGH,
        POWER_SAVE,
      ];
      const uniqueModes = new Set(modes);
      expect(uniqueModes.size).toBe(modes.length);
    });
  });

  describe('Brightness Constants', () => {
    it('should have correct brightness ranges', () => {
      expect(BRIGHTNESS_MIN).toBe(0);
      expect(BRIGHTNESS_MAX_HOMEKIT).toBe(100);
      expect(BRIGHTNESS_MAX_SYNCBOX).toBe(200);
    });

    it('should have correct brightness step values', () => {
      expect(BRIGHTNESS_STEP_PERCENT).toBe(25);
      expect(BRIGHTNESS_STEP_SYNCBOX).toBe(50);
    });

    it('should have brightness step equal to 25% of max', () => {
      expect(BRIGHTNESS_STEP_SYNCBOX).toBe(
        (BRIGHTNESS_STEP_PERCENT / 100) * BRIGHTNESS_MAX_SYNCBOX
      );
    });

    it('should have brightness max values in 2:1 ratio', () => {
      expect(BRIGHTNESS_MAX_SYNCBOX).toBe(BRIGHTNESS_MAX_HOMEKIT * 2);
    });
  });

  describe('HDMI Constants', () => {
    it('should have correct HDMI input range', () => {
      expect(HDMI_INPUT_MIN).toBe(1);
      expect(HDMI_INPUT_MAX).toBe(4);
    });

    it('should allow iteration from min to max', () => {
      const inputs: number[] = [];
      for (let i = HDMI_INPUT_MIN; i <= HDMI_INPUT_MAX; i++) {
        inputs.push(i);
      }
      expect(inputs).toEqual([1, 2, 3, 4]);
    });
  });

  describe('Default Configuration Values', () => {
    it('should have sensible default values', () => {
      expect(DEFAULT_ON_MODE).toBe(MODE_VIDEO);
      expect(DEFAULT_OFF_MODE).toBe(PASSTHROUGH);
      expect(DEFAULT_UPDATE_INTERVAL_SECONDS).toBe(5);
      expect(DEFAULT_API_SERVER_PORT).toBe(40220);
      expect(DEFAULT_BASE_ACCESSORY).toBe(LIGHTBULB);
      expect(DEFAULT_TV_ACCESSORY_TYPE).toBe(TV_TYPE_TV);
    });

    it('should have default on mode be a valid sync mode', () => {
      const validModes = [MODE_VIDEO, MODE_MUSIC, MODE_GAME];
      expect(validModes).toContain(DEFAULT_ON_MODE);
    });

    it('should have default off mode be a valid off mode', () => {
      const validOffModes = [PASSTHROUGH, POWER_SAVE];
      expect(validOffModes).toContain(DEFAULT_OFF_MODE);
    });
  });

  describe('HTTP Client Constants', () => {
    it('should have correct HTTP status codes', () => {
      expect(HTTP_STATUS_OK).toBe(200);
      expect(HTTP_STATUS_UNAUTHORIZED).toBe(401);
    });

    it('should have correct retry configuration', () => {
      expect(HTTP_RETRY_COUNT).toBe(3);
      expect(HTTP_RETRY_BASE_DELAY_MS).toBe(1000);
    });

    it('should have positive retry values', () => {
      expect(HTTP_RETRY_COUNT).toBeGreaterThan(0);
      expect(HTTP_RETRY_BASE_DELAY_MS).toBeGreaterThan(0);
    });
  });

  describe('Sync Box Client Timing Constants', () => {
    it('should keep the lock max execution time above the request budget', () => {
      // fetchWithRetry() caps one sendRequest() call at the budget, so this
      // is the whole worst case. If it ever regresses, async-lock can hand a
      // request's slot to the next queued caller while the original is still
      // running, letting two requests execute concurrently.
      expect(SYNC_BOX_LOCK_MAX_EXECUTION_TIME_MS).toBeGreaterThan(
        SYNC_BOX_REQUEST_BUDGET_MS
      );
    });

    it('should leave the budget room for at least one retry after a timeout', () => {
      // A budget at or below a single attempt's timeout would make every
      // timeout terminal again - the #458 regression.
      expect(SYNC_BOX_REQUEST_BUDGET_MS).toBeGreaterThan(
        SYNC_BOX_REQUEST_TIMEOUT_MS + HTTP_RETRY_BASE_DELAY_MS
      );
    });
  });
});
