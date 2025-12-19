import { PASSTHROUGH, POWER_SAVE } from '../lib/constants.js';
import { SwitchDevice } from './switch.js';
import { CharacteristicValue } from 'homebridge';

/**
 * PowerSwitchDevice controls the power state of the Sync Box (powersave vs. passthrough/sync)
 * - ON: Sets to passthrough mode (HDMI active, sync off)
 * - OFF: Sets to powersave mode (power off)
 */
export class PowerSwitchDevice extends SwitchDevice {
  protected getSuffix(): string {
    return '-power';
  }

  /**
   * Override updateMode to control hdmiActive instead of syncActive
   */
  protected updateMode(
    currentVal: CharacteristicValue | null,
    newValue: CharacteristicValue
  ) {
    this.platform.log.debug('Power switch state to ' + newValue);

    // Ignore changes if the new value equals the old value
    if (currentVal === newValue) {
      return;
    }

    let mode: string;
    if (newValue) {
      // Turn power ON: set to passthrough mode (HDMI active, sync off)
      this.platform.log.debug('Power switch state to ON (passthrough)');
      mode = PASSTHROUGH;
    } else {
      // Turn power OFF: set to powersave mode
      this.platform.log.debug('Power switch state to OFF (powersave)');
      mode = POWER_SAVE;
    }

    return this.updateExecution({
      mode,
    });
  }

  /**
   * Override shouldBeOn to return true for any mode except powersave
   */
  protected shouldBeOn(): boolean {
    return this.state.execution.mode !== POWER_SAVE;
  }
}
