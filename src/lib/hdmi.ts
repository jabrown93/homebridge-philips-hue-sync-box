import type { Hdmi, HdmiSource } from '../state.js';
import { HDMI_SOURCES } from './constants.js';

/** Returns reported HDMI sources in physical port order, preserving identifiers. */
export function getHdmiSources(hdmi: Hdmi): HdmiSource[] {
  return HDMI_SOURCES.filter(source => hdmi[source] !== undefined);
}
