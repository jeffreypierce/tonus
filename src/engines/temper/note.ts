// ---------------------------------------------------------------------------
// engines/temper/note — Note type (Pitch + Step)
// ---------------------------------------------------------------------------

import { parsePitch, toPitch } from "./pitch.js";
import type { Pitch, PitchInput } from "./pitch.js";
import { toStep } from "./step.js";
import type { Step } from "./step.js";
import { midiToHz } from "./scale.js";
import type { Scale } from "./scale.js";

export interface Note extends Pitch {
  step: Step;
  velocity: number | null;
  duration: number | null;
  arsis: number | null;
  thesis: number | null;
}

export function toNote(input: PitchInput, scala: Scale): Note {
  const rawMidi = parsePitch(input, { mode: scala.mode, a4: scala.a4 });
  const { hz, offset, bend } = midiToHz(rawMidi, scala);
  const midi = Math.min(127, Math.max(0, Math.round(rawMidi + scala.transpose)));
  const pitch = toPitch(midi, hz, offset, bend);
  const step = toStep(rawMidi, scala);
  return { ...pitch, step, velocity: null, duration: null, arsis: null, thesis: null };
}
