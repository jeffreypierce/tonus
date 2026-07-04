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

  const entry = abs === 0 ? UNISONUS : (simple === 0 ? INTERVAL[0]! : INTERVAL[simple]!);

  return {
    nomen: entry.latin,
    alias: entry.alias,
    quality: entry.quality as IntervalQuality,
    class: entry.class,
    direction,
    semitones,
    cents: semitones * 100,
    consonance: classifyConsonance(entry.class),
  };
}
