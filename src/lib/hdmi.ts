import type { Hdmi, HdmiSource } from '../state.js';
import { HDMI_INPUT_MIN, HDMI_INPUT_MAX } from './constants.js';

/** Returns reported HDMI sources in physical port order, preserving identifiers. */
export function getHdmiSources(hdmi: Hdmi): HdmiSource[] {
  const sources: HdmiSource[] = [];
  for (let i = HDMI_INPUT_MIN; i <= HDMI_INPUT_MAX; i++) {
    const source = `input${i}` as HdmiSource;
    if (hdmi[source] !== undefined) {
      sources.push(source);
    }
  }
  return sources;
}
