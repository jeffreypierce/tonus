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

// RhythmicType — Le Guennant's taxonomy of how compound beats chain into an
// incise, as presented by Carroll [biblio: carroll-chironomy, pp. 22–26]. One
// level above the per-note arsis/thesis: where ArsisThesis says "this beat is
// arsic," the type says "this whole incise makes an A–A–T shape." Only the
// observable types are modeled (IV–VIII); I–III use non-ictic sub-beat cells
// that never surface in isolation (Carroll p. 24). `null` when no type fits.
//   IV   — developed simple rhythm: A–T (one arsis, one thesis)
//   V    — compound rhythm: A(–A…)–T (two or more arses to one thesis)
//   VI   — compound rhythm: A–T(–T…) (one arsis to two or more theses)
//   VII  — compound rhythm: A–T–A–T… (regular alternation)
//   VIII — contraction: two complete rhythms overlapping at a shared ictus (a
//          thetic beat immediately followed by an arsic one, mid-incise) — so
//          the incise still resolves, ending thetic. Suñol's "composite rhythm
//          by contraction" [biblio: sunol-textbook], the local reading of
//          Carroll's "overlapping" Type VIII. A seam that leaves the incise
//          hanging arsic is unresolved and stays null — never a forced VIII
//          (A–T–A), and never a forced VII either (A–T–A–T–A: the
//          alternation opens a rhythm it never closes).
export type RhythmicType = "IV" | "V" | "VI" | "VII" | "VIII" | null;

// One compound beat, reduced to what incise-level analysis needs: its shape and
// its span in note indices (into the phrase's flat note list). This is the
// intermediate structure that classifyCompoundBeats computes and otherwise
// discards; recovering it feeds both the rhythmic-type classifier and (later)
// the chironomy renderer's arc chaining.
export interface CompoundBeat {
  shape: ArsisThesis;
  noteCount: number;
}

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
  mora: 0 | 1 | 2; // mora vocis: 0 none, 1 dot, 2 double dot
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
  mora: 0 | 1 | 2; // mora vocis: 0 none, 1 dot, 2 double dot
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
  /** The phrase's compound beats in order — the A/T sequence of the incise. */
  beats: CompoundBeat[];
  /** Le Guennant/Carroll rhythmic type of the incise; null if none fits. */
  rhythmicType: RhythmicType;
}

export interface Score {
  chant: { incipit: string; mode: string | null; office: string };
  phrases: Phrase[];
  errors: ParseError[];
}
