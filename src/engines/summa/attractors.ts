// ---------------------------------------------------------------------------
// engines/summa/attractors — top pitch classes as tuned Pitches
// ---------------------------------------------------------------------------
import type { Pitch } from "../temper/pitch.js";
import type { Scale } from "../temper/scale.js";
import { toPitch } from "../temper/pitch.js";

export interface Attractor {
  pc: number;      // pitch class 0–11
  weight: number;  // normalized 0–1 (within top-N)
  pitch: Pitch;    // tuned through the scores' temper
}

const DEFAULT_TOP = 5;
const DEFAULT_MIDI_OCTAVE = 4;

export function computeAttractors(
  pcDistribution: Record<number, number>,
  scale: Scale,
  topN = DEFAULT_TOP,
): Attractor[] {
  const entries: [number, number][] = [];
  for (let pc = 0; pc < 12; pc++) {
    const w = pcDistribution[pc] ?? 0;
    if (w > 0) entries.push([pc, w]);
  }
  entries.sort((a, b) => b[1] - a[1]);
  const top = entries.slice(0, topN);

  const total = top.reduce((s, [, w]) => s + w, 0) || 1;
  return top.map(([pc, w]) => ({
    pc,
    weight: w / total,
    pitch: toPitch(12 * (DEFAULT_MIDI_OCTAVE + 1) + pc, scale),
  }));
}
