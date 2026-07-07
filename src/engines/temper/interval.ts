// ---------------------------------------------------------------------------
// engines/temper/interval — interval classification between pitches
// ---------------------------------------------------------------------------
import { INTERVAL, UNISONUS } from "./data/constants.js";

export type IntervalDirection = "up" | "down" | "unison";
export type IntervalQuality = "perfect" | "major" | "minor" | "augmented";
export type Consonance = "perfect" | "imperfect" | "dissonant";

export interface Interval {
  nomen: string;
  alias?: string;
  quality: IntervalQuality;
  class: string;
  direction: IntervalDirection;
  semitones: number;
  cents: number;
  consonance: Consonance;
}

// The three-tier consonance taxonomy [biblio: schulter-harmony] (the same table
// stated at docs/heavens.md and docs/tuning.md). Note that the perfect fourth is
// deliberately NOT perfect here: in medieval counterpoint the P4 above the bass
// is treated as a dissonance, unlike the melodic P4. So P1/P5/P8 are perfect,
// the thirds and sixths imperfect, and everything else — including P4 and the
// tritone — dissonant.
const PERFECT_CLASSES = new Set(["P1", "P5", "P8"]);
const IMPERFECT_CLASSES = new Set(["m3", "M3", "m6", "M6"]);

function classifyConsonance(intervalClass: string): Consonance {
  if (PERFECT_CLASSES.has(intervalClass)) return "perfect";
  if (IMPERFECT_CLASSES.has(intervalClass)) return "imperfect";
  return "dissonant";
}

export function classifyInterval(a: number, b?: number): Interval {
  const semitones = b !== undefined ? b - a : a;
  const abs = Math.abs(semitones);
  const simple = abs % 12;

  const direction: IntervalDirection =
    semitones > 0 ? "up" : semitones < 0 ? "down" : "unison";

  // A true zero-distance unison (abs === 0) is UNISONUS; a compound octave
  // (simple === 0 but abs a nonzero multiple of 12) folds to INTERVAL[0], the
  // octave entry. The two share simple === 0 but name different intervals.
  const entry = abs === 0 ? UNISONUS : (simple === 0 ? INTERVAL[0]! : INTERVAL[simple]!);

  return {
    nomen: entry.latin,
    alias: entry.alias,
    quality: entry.quality as IntervalQuality,
    class: entry.class,
    direction,
    semitones,
    // Nominal equal-tempered cents (100 per semitone), NOT the tuned distance —
    // the actual sounding interval depends on the temperament (see the ratio a
    // temperamentum reports for a nota, and docs/tuning.md on nominal vs tuned).
    cents: semitones * 100,
    consonance: classifyConsonance(entry.class),
  };
}
