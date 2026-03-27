import type { Score } from "../types.js";
import type { ModeData } from "../../temper/modes.js";
import { MODES } from "../../temper/modes.js";
import { inferMode } from "../infer.js";

// ChantMetrics — computed analysis of a chant IR
export interface NoteRange {
  /** Lowest MIDI pitch in the piece. */
  min: number;
  /** Highest MIDI pitch in the piece. */
  max: number;
  /** Span in semitones (max − min). */
  span: number;
}

export interface ArsisProfile {
  /** Mean arsis value across all notes (0–1 scale). */
  mean: number;
  /** Variance of arsis values — higher = more rhythmically shaped. */
  variance: number;
}

export interface CadenceDistribution {
  /** Comma — minor breath mark. */
  comma: number;
  /** Tick — minimal pause. */
  tick: number;
  /** Semicolon — medium pause. */
  semicolon: number;
  /** Colon — major pause. */
  colon: number;
  /** Double bar — full stop / end of piece. */
  doubleBar: number;
}

export interface ChantMetrics {
  // Counts
  phraseCount: number;
  noteCount: number;
  syllableCount: number;

  // Pitch
  /** Raw MIDI range (min, max, span). Null if no notes. */
  noteRange: NoteRange | null;
  /** Pitch range in semitones — convenience alias for noteRange.span. Null if no notes. */
  ambitus: number | null;

  // Texture
  /** Average notes per syllable. 1.0 = fully syllabic; higher = more melismatic. */
  melismaRatio: number;
  /** Notes per syllable for each phrase — shows how texture varies across phrases. */
  melismaByPhrase: number[];

  // Rhythm
  /** Fraction of notes that carry an ictus mark (0–1). */
  ictusRate: number;
  /** Arsis mean and variance across all notes. Null if no notes. */
  arsisProfile: ArsisProfile | null;

  // Cadence
  /**
   * Weighted sum of cadence strengths across all phrase endings.
   * Weights: tick=0.25, comma=0.5, semicolon=0.75, colon=1.0, doubleBar=1.5.
   * Higher = more strongly punctuated piece.
   */
  cadenceWeight: number;
  /** Raw count of each divisio type. */
  cadenceDistribution: CadenceDistribution;

  // Modal
  /**
   * Fraction of notes whose pitch class falls on a structurally significant
   * modal degree (final, tenor, or modulation). Null if no mode resolved.
   */
  modalConformance: number | null;

  // Pitch-class distribution
  /**
   * Fraction of total notes on each pitch class (0–11, C=0).
   * Values sum to 1.0 (or 0 if no notes).
   */
  pcDistribution: Record<number, number>;
}

// computeMetrics
export interface ChantMetricsOptions {
  /** Gregorian mode 1–8. Inferred from header/finalis if not set. */
  mode?: number;
}

/**
 * Compute analytical metrics for a chant IR.
 *
 * All values are derived directly from the parsed note events — no tuning
 * or phrasing computation is needed. Pass `mode` to enable modal metrics;
 * otherwise `modalConformance` will be null.
 */
export function computeMetrics(ir: Score, options: ChantMetricsOptions = {}): ChantMetrics {
  const modeNum = options.mode ?? inferMode(ir);
  const modeData: ModeData | undefined = modeNum !== undefined ? MODES.get(modeNum) : undefined;

  // Collect all notes with phrase context
  let noteCount = 0;
  let syllableCount = 0;
  let ictusCount = 0;

  let minMidi = Infinity;
  let maxMidi = -Infinity;

  const arsisValues: number[] = [];
  const pcCounts = new Array<number>(12).fill(0);

  const cadDist: CadenceDistribution = { comma: 0, tick: 0, semicolon: 0, colon: 0, doubleBar: 0 };
  let cadenceWeight = 0;

  const melismaByPhrase: number[] = [];

  for (const phrase of ir.phrases) {
    let phraseNotes = 0;
    let phraseSyllables = 0;

    for (const syl of phrase.syllables) {
      if (syl.notes.length === 0) continue;
      phraseSyllables++;
      syllableCount++;

      for (const note of syl.notes) {
        noteCount++;
        phraseNotes++;

        if (note.midi < minMidi) minMidi = note.midi;
        if (note.midi > maxMidi) maxMidi = note.midi;

        pcCounts[note.pc]++;

        if (note.ictus) ictusCount++;
        arsisValues.push(note.arsis ?? 0);
      }
    }

    if (phrase.divisio) {
      const d = phrase.divisio.divisio;
      if      (d === "::")  { cadDist.doubleBar++;  cadenceWeight += 1.5; }
      else if (d === ":")   { cadDist.colon++;       cadenceWeight += 1.0; }
      else if (d === ";")   { cadDist.semicolon++;   cadenceWeight += 0.75; }
      else if (d === ",")   { cadDist.comma++;       cadenceWeight += 0.5; }
      else if (d === "`")   { cadDist.tick++;        cadenceWeight += 0.25; }
    }

    if (phraseSyllables > 0) {
      melismaByPhrase.push(phraseNotes / phraseSyllables);
    }
  }

  const phraseCount = ir.phrases.length;
  const melismaRatio = syllableCount > 0 ? noteCount / syllableCount : 0;

  // Pitch range
  const noteRange: NoteRange | null = noteCount > 0
    ? { min: minMidi, max: maxMidi, span: maxMidi - minMidi }
    : null;

  // Arsis profile
  let arsisProfile: ArsisProfile | null = null;
  if (arsisValues.length > 0) {
    const mean = arsisValues.reduce((s, v) => s + v, 0) / arsisValues.length;
    const variance = arsisValues.reduce((s, v) => s + (v - mean) ** 2, 0) / arsisValues.length;
    arsisProfile = { mean, variance };
  }

  // PC distribution (fractional)
  const pcDistribution: Record<number, number> = {};
  for (let pc = 0; pc < 12; pc++) {
    pcDistribution[pc] = noteCount > 0 ? pcCounts[pc] / noteCount : 0;
  }

  // Modal conformance
  let modalConformance: number | null = null;
  if (modeData && noteCount > 0) {
    const structural = new Set<number>([modeData.final, modeData.tenor, ...modeData.modulations.regular]);
    let conforming = 0;
    for (let pc = 0; pc < 12; pc++) {
      if (structural.has(pc)) conforming += pcCounts[pc];
    }
    modalConformance = conforming / noteCount;
  }

  return {
    phraseCount,
    noteCount,
    syllableCount,
    noteRange,
    ambitus: noteRange?.span ?? null,
    melismaRatio,
    melismaByPhrase,
    ictusRate: noteCount > 0 ? ictusCount / noteCount : 0,
    arsisProfile,
    cadenceWeight,
    cadenceDistribution: cadDist,
    modalConformance,
    pcDistribution,
  };
}
