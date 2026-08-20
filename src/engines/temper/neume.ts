// ---------------------------------------------------------------------------
// engines/temper/neume — neume shape classification
// ---------------------------------------------------------------------------
import { classifyInterval } from "./interval.js";
import type { Interval } from "./interval.js";
import { toPitch } from "./pitch.js";
import type { Pitch, PitchInput } from "./pitch.js";
import type { Scale } from "./scale.js";

export type { Interval };

export type NeumeShape =
  | "punctum"
  | "pes"
  | "clivis"
  | "torculus"
  | "porrectus"
  | "scandicus"
  | "salicus"
  | "climacus"
  | "torculus resupinus"
  | "porrectus flexus"
  | "scandicus flexus"
  | "climacus resupinus"
  | "pes subpunctis"
  // The repercussive figures — a pitch restated rather than left. The
  // classifier had no case for the unison beyond a two-note group, so every one
  // of these fell to "compound".
  //
  // They are named by CONTOUR, the strophic family included. Both emitters
  // already read a repeated pitch as a stropha — quadrata breathes them apart
  // on the staff position alone (svg.ts, "strophae breathe"), moderna merges
  // the run into one slur — so the notation and the drawing already commit to
  // the reading. Only the classifier withheld it.
  //
  // This does not reopen the salicus ruling below. That one turns on an
  // ORNAMENT the printed edition may have resolved away, so reading it from
  // the ictus would invent what the source withheld. A restated pitch is a
  // CONTOUR the source states outright. `hasStrophicus` still reports the GABC
  // marker, which is the narrower fact and is not back-filled from this.
  | "distropha"          // two on one pitch
  | "tristropha"         // three on one pitch
  | "tristropha flexa"   // three, then falling
  | "pressus"            // a restated pitch, then falling
  | "pressus maior"      // falling into the restatement, then falling again
  // Only "pes subpunctis" (up, then all down) was named past three intervals.
  // Its mirror belongs beside it. The praepunctis family is NOT here: measured
  // over the corpus, the long figures turning that way are genuine compound
  // melismas rather than textbook praepunctis forms, and a name that matches
  // nothing is worse than the gap.
  | "scandicus subpunctis"  // two rising, then all falling
  | "compound";

export interface Neume {
  pitches: Pitch[];
  intervals: Interval[];
  shape: NeumeShape;
}

export type Direction = "up" | "down" | "unison";

export function classifyShape(dirs: Direction[]): NeumeShape {
  const n = dirs.length;
  if (n === 0) return "punctum";

  const up = (d: Direction) => d === "up";
  const dn = (d: Direction) => d === "down";
  const un = (d: Direction) => d === "unison";

  switch (n) {
    case 1:
      // A unison here is two notes on one pitch — a distropha, not a punctum.
      // Reporting "punctum" said a two-note figure was one note.
      return up(dirs[0]!) ? "pes" : dn(dirs[0]!) ? "clivis" : "distropha";
    case 2: {
      const [d0, d1] = dirs;
      if (up(d0!) && dn(d1!)) return "torculus";
      if (dn(d0!) && up(d1!)) return "porrectus";
      if (up(d0!) && up(d1!)) return "scandicus";
      if (dn(d0!) && dn(d1!)) return "climacus";
      if (un(d0!) && un(d1!)) return "tristropha";
      if (un(d0!) && dn(d1!)) return "pressus";
      return "compound";
    }
    case 3: {
      const [d0, d1, d2] = dirs;
      if (up(d0!) && dn(d1!) && up(d2!)) return "torculus resupinus";
      if (dn(d0!) && up(d1!) && dn(d2!)) return "porrectus flexus";
      if (up(d0!) && up(d1!) && dn(d2!)) return "scandicus flexus";
      if (dn(d0!) && dn(d1!) && up(d2!)) return "climacus resupinus";
      if (up(d0!) && dn(d1!) && dn(d2!)) return "pes subpunctis";
      if (un(d0!) && un(d1!) && dn(d2!)) return "tristropha flexa";
      if (dn(d0!) && un(d1!) && dn(d2!)) return "pressus maior";
      return "compound";
    }
    default: {
      // The long forms: a head, then an unbroken descent. Only the head
      // distinguishes them, and the descent must be total — a figure that
      // turns again is a compound melisma, which at this length most are.
      if (up(dirs[0]!) && dirs.slice(1).every(dn)) return "pes subpunctis";
      if (up(dirs[0]!) && up(dirs[1]!) && dirs.slice(2).every(dn)) {
        return "scandicus subpunctis";
      }
      if (dirs.slice(0, -1).every(un) && dn(dirs[dirs.length - 1]!)) {
        return "tristropha flexa";
      }
      return "compound";
    }
  }
}

export function buildNeume(inputs: PitchInput[], scala: Scale): Neume {
  const pitches: Pitch[] = inputs.map((n) => toPitch(n, scala));

  const intervals: Interval[] = [];
  for (let i = 0; i < pitches.length - 1; i++) {
    intervals.push(classifyInterval(pitches[i]!.midi, pitches[i + 1]!.midi));
  }

  return {
    pitches,
    intervals,
    shape: classifyShape(intervals.map((iv) => iv.direction)),
  };
}
