import { POWER_SAVE } from '../lib/constants.js';
import { SwitchDevice } from './switch.js';

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
   * Override shouldBeOn to return true for any mode except powersave
   */
  protected shouldBeOn(): boolean {
    return this.state.execution.mode !== POWER_SAVE;
  }
}
