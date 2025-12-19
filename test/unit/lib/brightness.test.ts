import { describe, it, expect } from '@jest/globals';
import {
  BRIGHTNESS_MAX_SYNCBOX,
  BRIGHTNESS_MIN,
  BRIGHTNESS_STEP_SYNCBOX,
  BRIGHTNESS_STEP_PERCENT,
} from '../../../src/lib/constants.js';
import {
  convertHomekitToSyncBox,
  convertSyncBoxToHomekit,
} from '../../../src/lib/brightness.js';

describe('Brightness Conversion', () => {
  describe('HomeKit to Sync Box conversion', () => {
    it('should convert 0% to 0', () => {
      const homekitValue = 0;
      const syncBoxValue = convertHomekitToSyncBox(homekitValue);
      expect(syncBoxValue).toBe(0);
    });

    it('should convert 50% to 100', () => {
      const homekitValue = 50;
      const syncBoxValue = convertHomekitToSyncBox(homekitValue);
      expect(syncBoxValue).toBe(100);
    });

    it('should convert 100% to 200', () => {
      const homekitValue = 100;
      const syncBoxValue = convertHomekitToSyncBox(homekitValue);
      expect(syncBoxValue).toBe(200);
    });

    it('should convert 25% to 50', () => {
      const homekitValue = 25;
      const syncBoxValue = convertHomekitToSyncBox(homekitValue);
      expect(syncBoxValue).toBe(50);
    });

    it('should convert 75% to 150', () => {
      const homekitValue = 75;
      const syncBoxValue = convertHomekitToSyncBox(homekitValue);
      expect(syncBoxValue).toBe(150);
    });
  });

  describe('Sync Box to HomeKit conversion', () => {
    it('should convert 0 to 0%', () => {
      const syncBoxValue = 0;
      const homekitValue = convertSyncBoxToHomekit(syncBoxValue);
      expect(homekitValue).toBe(0);
    });

    it('should convert 100 to 50%', () => {
      const syncBoxValue = 100;
      const homekitValue = convertSyncBoxToHomekit(syncBoxValue);
      expect(homekitValue).toBe(50);
    });

    it('should convert 200 to 100%', () => {
      const syncBoxValue = 200;
      const homekitValue = convertSyncBoxToHomekit(syncBoxValue);
      expect(homekitValue).toBe(100);
    });

    it('should convert 50 to 25%', () => {
      const syncBoxValue = 50;
      const homekitValue = convertSyncBoxToHomekit(syncBoxValue);
      expect(homekitValue).toBe(25);
    });

    it('should convert 150 to 75%', () => {
      const syncBoxValue = 150;
      const homekitValue = convertSyncBoxToHomekit(syncBoxValue);
      expect(homekitValue).toBe(75);
    });
  });

  describe('Brightness step calculations', () => {
    it('should correctly represent 25% step', () => {
      expect(BRIGHTNESS_STEP_PERCENT).toBe(25);
      expect(BRIGHTNESS_STEP_SYNCBOX).toBe(50);
      expect(BRIGHTNESS_STEP_SYNCBOX).toBe(
        (BRIGHTNESS_STEP_PERCENT / 100) * BRIGHTNESS_MAX_SYNCBOX
      );
    });

    it('should clamp brightness increase at maximum', () => {
      const currentBrightness = 180;
      const newBrightness = Math.min(
        BRIGHTNESS_MAX_SYNCBOX,
        currentBrightness + BRIGHTNESS_STEP_SYNCBOX
      );
      expect(newBrightness).toBe(200);
    });

    it('should clamp brightness decrease at minimum', () => {
      const currentBrightness = 30;
      const newBrightness = Math.max(
        BRIGHTNESS_MIN,
        currentBrightness - BRIGHTNESS_STEP_SYNCBOX
      );
      expect(newBrightness).toBe(0);
    });

    it('should increase brightness by 50 (25%) normally', () => {
      const currentBrightness = 100;
      const newBrightness = Math.min(
        BRIGHTNESS_MAX_SYNCBOX,
        currentBrightness + BRIGHTNESS_STEP_SYNCBOX
      );
      expect(newBrightness).toBe(150);
    });

    it('should decrease brightness by 50 (25%) normally', () => {
      const currentBrightness = 100;
      const newBrightness = Math.max(
        BRIGHTNESS_MIN,
        currentBrightness - BRIGHTNESS_STEP_SYNCBOX
      );
      expect(newBrightness).toBe(50);
    });
  });

  describe('Round-trip conversion', () => {
    it('should maintain value through round-trip conversion', () => {
      const originalHomeKit = 50;
      const syncBox = convertHomekitToSyncBox(originalHomeKit);
      const backToHomeKit = convertSyncBoxToHomekit(syncBox);
      expect(backToHomeKit).toBe(originalHomeKit);
    });

    it('should handle edge case at maximum', () => {
      const originalHomeKit = 100;
      const syncBox = convertHomekitToSyncBox(originalHomeKit);
      const backToHomeKit = convertSyncBoxToHomekit(syncBox);
      expect(backToHomeKit).toBe(originalHomeKit);
    });

    it('should handle edge case at minimum', () => {
      const originalHomeKit = 0;
      const syncBox = convertHomekitToSyncBox(originalHomeKit);
      const backToHomeKit = convertSyncBoxToHomekit(syncBox);
      expect(backToHomeKit).toBe(originalHomeKit);
    });
  });
});
