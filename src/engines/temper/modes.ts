// ---------------------------------------------------------------------------
// engines/temper/modes — Gregorian modal system
// ---------------------------------------------------------------------------

import { MODES } from "./data/modes.js";
import type { ModeData } from "./data/modes.js";

export type { ModeProfile, ModeData, CadenceFigure } from "./data/modes.js";
export { MODES } from "./data/modes.js";

/** Return ModeData for mode 1–8. Throws on unknown mode. */
export function getMode(mode: number): ModeData {
  const found = MODES.get(mode);
  if (!found) throw new Error(`Unknown mode: ${mode}. Supported: 1–8.`);
  return found;
}
