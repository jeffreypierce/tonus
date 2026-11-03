// ---------------------------------------------------------------------------
// engines/temper/gamut — modal pitch collection
// ---------------------------------------------------------------------------

import { getMode } from "./modes.js";
import { toPitch } from "./pitch.js";
import type { Pitch } from "./pitch.js";
import type { Scale } from "./scale.js";

export type { Pitch };

export interface GamutOptions {
  span?: [number, number]; // [lowest, highest] MIDI
  chromatic?: boolean;     // include chromatic pitches (default: false)
}

export function buildGamut(scala: Scale, opts: GamutOptions = {}): Pitch[] {
  // temperamentum has already refused any mode outside 1–8.
  const modeData = getMode(scala.mode);

  const low = opts.span?.[0] ?? modeData.ambitus.lowest + 48;
  const high = opts.span?.[1] ?? modeData.ambitus.highest + 48;

  const pcs: Set<number> = opts.chromatic
    ? new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
    : new Set(modeData.scalePcs);

  const pitches: Pitch[] = [];
  for (let midi = low; midi <= high; midi++) {
    const pc = ((midi % 12) + 12) % 12;
    if (!pcs.has(pc)) continue;
    pitches.push(toPitch(midi, scala));
  }

  return pitches;
}
