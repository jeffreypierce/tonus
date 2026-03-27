// ---------------------------------------------------------------------------
// engines/temper/neume — neume shape classification
// ---------------------------------------------------------------------------
import { classifyInterval } from "./interval.js";
import type { Interval } from "./interval.js";
import type { PitchInput } from "./pitch.js";
import { toNote } from "./note.js";
import type { Note } from "./note.js";
import type { Scale } from "./scale.js";

export type { Interval };

export type NeumeShape =
  | "punctum"
  | "pes"
  | "clivis"
  | "torculus"
  | "porrectus"
  | "scandicus"
  | "climacus"
  | "torculus resupinus"
  | "porrectus flexus"
  | "scandicus flexus"
  | "climacus resupinus"
  | "pes subpunctis"
  | "compound";

export interface Neume {
  notes: Note[];
  intervals: Interval[];
  shape: NeumeShape;
}

function classifyShape(intervals: Interval[]): NeumeShape {
  if (intervals.length === 0) return "punctum";
  const dirs = intervals.map((iv) => iv.direction);
  const up = (d: string) => d === "up";
  const dn = (d: string) => d === "down";

  switch (dirs.length) {
    case 1:
      return up(dirs[0]!) ? "pes" : dn(dirs[0]!) ? "clivis" : "punctum";
    case 2: {
      const [d0, d1] = dirs;
      if (up(d0!) && dn(d1!)) return "torculus";
      if (dn(d0!) && up(d1!)) return "porrectus";
      if (up(d0!) && up(d1!)) return "scandicus";
      if (dn(d0!) && dn(d1!)) return "climacus";
      return "compound";
    }
    case 3: {
      const [d0, d1, d2] = dirs;
      if (up(d0!) && dn(d1!) && up(d2!)) return "torculus resupinus";
      if (dn(d0!) && up(d1!) && dn(d2!)) return "porrectus flexus";
      if (up(d0!) && up(d1!) && dn(d2!)) return "scandicus flexus";
      if (dn(d0!) && dn(d1!) && up(d2!)) return "climacus resupinus";
      if (up(d0!) && dn(d1!) && dn(d2!)) return "pes subpunctis";
      return "compound";
    }
    default:
      if (up(dirs[0]!) && dirs.slice(1).every((d) => dn(d))) return "pes subpunctis";
      return "compound";
  }
}

export function buildNeume(inputs: PitchInput[], scala: Scale): Neume {
  const notes: Note[] = inputs.map((n) => toNote(n, scala));

  const intervals: Interval[] = [];
  for (let i = 0; i < notes.length - 1; i++) {
    intervals.push(classifyInterval(notes[i]!.midi, notes[i + 1]!.midi));
  }

  return {
    notes,
    intervals,
    shape: classifyShape(intervals),
  };
}
