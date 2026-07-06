// ---------------------------------------------------------------------------
// engines/score/types — score engine types
// ---------------------------------------------------------------------------
import type { Pitch } from "../temper/pitch.js";
import type { Step } from "../temper/step.js";
import type { NeumeShape } from "../temper/neume.js";
import type { OfficeCode, OrdinaryCode } from "../chant/types.js";

// ArsisThesis — Solesmes rhythmic quality of a compound beat.
// Arsic = rising, active, impulse toward apex. Thetic = resting, retractive, falling from apex.
// Carroll, Technique of Gregorian Chironomy (1955), Chapters 2–4.
export type ArsisThesis = "arsic" | "thetic";

// Performance — per-event interpretation layer.
// Used by harmonia voicing and by the score engine.
export interface Performance {
  velocity: number;
  duration: number;
  rhythmicShape: ArsisThesis;   // quality of this note's compound beat (shared across group)
  rhythmicIndex: number;         // 1-based position within the compound beat
}

// Context — position, lyric, and ornamentation within a score.
export interface Context {
  lyric: string;
  vowel: string;
  syllableIndex: number;
  /** 0-based index of the neume figure within the syllable (GABC break markers). */
  neumeGroup: number;
  ictus: boolean;
  accidentalSource: "none" | "state" | "explicit";
  quilisma: boolean;
  liquescent: boolean;
  strophicus: boolean;
  oriscus: boolean;
  doubleEpisema: boolean;
  weight: number;
}

// Note — the unified score-level note, four sub-objects composed.
export interface Note {
  pitch: Pitch;
  step: Step;
  performance: Performance;
  context: Context;
}

export type { Pitch, Step, NeumeShape, OfficeCode, OrdinaryCode };

export type Clef = "c1" | "c2" | "c3" | "c4" | "f1" | "f2" | "f3" | "f4" | `cb${1 | 2 | 3 | 4}` | `fb${1 | 2 | 3 | 4}`;

export type PhrasingType = "recitative" | "lyrical" | "hymnic" | "solemn";

export type ArticulationType = "restrained" | "balanced" | "expressive" | "strict";

export interface ArticulationWeights {
  ictusWeight: number;
  ictusDuration: number;
  episemaWeight: number;
  episemaDuration: number;
  episemaDoubleDuration: number;
  strophicusWeight: number;
  strophicusDuration: number;
  strophicusTripleDuration: number;
  quilismaPrevWeight: number;
  quilismaWeight: number;
  liquescentWeight: number;
  liquescentDuration: number;
  initioWeight: number;
  initioMelismaWeight: number;
  initioMelismaDuration: number;
  accentWeight: number;
  uppercaseWeight: number;
  uppercaseDuration: number;
  repercussionPrevWeight: number;
  repercussionPrevDuration: number;
  repercussionOriscusWeight: number;
  oriscusWeight: number;
  oriscusDuration: number;
  oriscusPrevWeight: number;
  breakWeight: number;
  dashWeight: number;
  dashDuration: number;
}

export interface ArticulationProfile {
  weights: ArticulationWeights;
  weightBase: number;
  weightGain: number;
  weightSaturation: number;
  durationBase: number;
  durationGain: number;
  durationMin: number;
  durationMax: number;
  neumeArch?: number;
  durArch?: number;
  ictusBoost?: number;
  ruleGain?: number;
  contourScale?: number;
}

export interface PhrasingProfile {
  curve: number;
  accent: number;
  cadence: number;
  tenor: number;
  baseVelocity: number;
  contourVel: number;
  contourDur: number;
  velSpread: number;
  ictusBoost: number;
  neumeArch: number;
  durArch: number;
}

export interface InterpretationOptions {
  articulation?: ArticulationType;
  articulationOverrides?: Partial<ArticulationProfile>;
  phrasing?: PhrasingType;
  phrasingOverrides?: Partial<PhrasingProfile>;
  modalInfluence?: number;
}

export interface ParseOptions {
  oct?: number;
  useVowelAccent?: boolean;
  interpretation?: InterpretationOptions;
}

export interface ParseError {
  message: string;
  index?: number;
}

export interface ParsedNote {
  type: "note";
  step: number;
  lyric: string;
  syllableIndex: number;
  /** 0-based index of the neume figure within the syllable (GABC break markers). */
  neumeGroup: number;
  ictus: boolean;
  weight: number;
  duration: number;
  accidental: -1 | 0 | 1;
  accidentalSource: "none" | "state" | "explicit";
  quilisma: boolean;
  liquescent: boolean;
  strophicus: boolean;
  oriscus: boolean;
  doubleEpisema: boolean;
}

export interface RestEvent {
  type: "rest";
  divisio: "," | "`" | ";" | ":" | "::";
  duration: number;
}

export type ChantEvent = ParsedNote | RestEvent;

export interface ParseResult {
  events: ChantEvent[];
  errors: ParseError[];
}


export type ChantType = OrdinaryCode | OfficeCode;

export interface Neume {
  type: NeumeShape;
  intervals: number[];
  hasQuilisma: boolean;
  hasLiquescent: boolean;
  hasStrophicus: boolean;
}

export interface Syllable {
  lyric: string;
  notes: Note[];
  neume: Neume;
}

export interface Phrase {
  syllables: Syllable[];
  divisio?: RestEvent;
}

export interface Score {
  chant: { incipit: string; mode: string | null; office: string };
  phrases: Phrase[];
  errors: ParseError[];
}
