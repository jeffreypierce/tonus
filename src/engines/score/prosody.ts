// ---------------------------------------------------------------------------
// engines/score/prosody — chant-specific measurements
// ---------------------------------------------------------------------------
// Counts, ranges, melisma density, cadence weight, and compound-beat profile.
// Shape-only: no modal or harmonic analysis — that lives in the shared Imprint.
import type { Phrase } from "./types.js";

export interface NoteRange {
  min: number;
  max: number;
  span: number;
}

export interface CadenceDistribution {
  comma: number;
  tick: number;
  semicolon: number;
  colon: number;
  doubleBar: number;
}

/** Aggregate of compound-beat qualities and sizes across the score. */
export interface RhythmicProfile {
  arsic: number;
  thetic: number;
  avgGroupSize: number;
  maxGroupSize: number;
}

/** Melodic-motion statistics over adjacent notes (within a phrase). */
export interface IntervalStats {
  /** Signed semitone interval → count. Movement across a divisio is excluded. */
  histogram: Record<number, number>;
  /** Largest absolute interval, in semitones. */
  maxLeap: number;
  /** Fraction of motions that are leaps (≥ a fourth, 5+ semitones). */
  leapRate: number;
  /** Motion by class: step (1–2 st), skip (a third, 3–4), leap (a fourth+, 5+). */
  motus: { step: number; skip: number; leap: number };
}

/** The melodic arch of the piece: where it begins, peaks, and ends, and its shape. */
export interface Arcus {
  /** First note's MIDI. */
  initial: number;
  /** Highest note's MIDI. */
  peak: number;
  /** Last note's MIDI. */
  final: number;
  /**
   * Signed arch index: how much the melody rises to its peak versus where it
   * settles. +1 a full arch (rises high, returns low), 0 flat/monotonic,
   * negative when it ends above where it began relative to the climb.
   */
  archIndex: number;
}

export interface Prosody {
  noteCount: number;
  syllableCount: number;
  phraseCount: number;
  noteRange: NoteRange | null;
  ambitus: number | null;
  melismaRatio: number;
  melismaByPhrase: number[];
  /** Mean notes-per-syllable of each phrase's FINAL syllable — the cadential melisma. */
  melismaCadential: number;
  /** Mean pitch minus the final note, in semitones — how high the melody sits above its rest. */
  tessitura: number | null;
  /** Melodic-interval statistics over adjacent within-phrase notes. */
  intervals: IntervalStats;
  /** The melodic arch: initial/peak/final and a signed arch index. */
  arcus: Arcus | null;
  ictusRate: number;
  rhythmicProfile: RhythmicProfile;
  cadenceWeight: number;
  cadenceDistribution: CadenceDistribution;
}

export function computeProsody(phrases: Phrase[]): Prosody {
  let phraseCount = 0;
  let noteCount = 0;
  let syllableCount = 0;
  let ictusCount = 0;
  let minMidi = Infinity;
  let maxMidi = -Infinity;
  let arsicCount = 0;
  let theticCount = 0;

  // Group-size tracking: a new group starts at every rhythmicIndex === 1.
  let groupSizes: number[] = [];
  let currentGroupSize = 0;
  let maxGroupSize = 0;

  const cadDist: CadenceDistribution = {
    comma: 0, tick: 0, semicolon: 0, colon: 0, doubleBar: 0,
  };
  let cadenceWeight = 0;
  const melismaByPhrase: number[] = [];

  // Interval statistics — adjacent notes WITHIN a phrase; prevMidi resets to null
  // at each phrase so a breath across a divisio is not counted as a leap.
  const histogram: Record<number, number> = {};
  let motions = 0, stepCount = 0, skipCount = 0, leapCount = 0, maxLeap = 0;
  let prevMidi: number | null = null;

  // Tessitura + arch: running MIDI sum, the first note, the peak, the last note.
  let midiSum = 0;
  let firstMidi: number | null = null;
  let lastMidi = 0;
  let peakMidi = -Infinity;

  // Cadential melisma — the note count of each phrase's final sung syllable.
  const cadentialMelismas: number[] = [];

  const closeGroup = () => {
    if (currentGroupSize > 0) {
      groupSizes.push(currentGroupSize);
      if (currentGroupSize > maxGroupSize) maxGroupSize = currentGroupSize;
    }
  };

  for (const phrase of phrases) {
    phraseCount++;
    let phraseNotes = 0;
    let phraseSyllables = 0;
    let lastSylNotes = 0; // notes on this phrase's most recent sung syllable
    prevMidi = null;      // intervals never cross a phrase boundary (a breath)

    for (const syl of phrase.syllables) {
      if (syl.notes.length === 0) continue;
      phraseSyllables++;
      syllableCount++;
      lastSylNotes = syl.notes.length;

      for (const note of syl.notes) {
        const midi = note.pitch.midi;
        noteCount++;
        phraseNotes++;
        if (midi < minMidi) minMidi = midi;
        if (midi > maxMidi) maxMidi = midi;
        if (note.context.ictus) ictusCount++;
        if (note.performance.rhythmicShape === "arsic") arsicCount++;
        else theticCount++;

        // Tessitura + arch running values.
        midiSum += midi;
        if (firstMidi === null) firstMidi = midi;
        if (midi > peakMidi) peakMidi = midi;
        lastMidi = midi;

        // Adjacent-note interval, within the phrase only.
        if (prevMidi !== null) {
          const iv = midi - prevMidi;
          histogram[iv] = (histogram[iv] ?? 0) + 1;
          const abs = Math.abs(iv);
          motions++;
          if (abs > maxLeap) maxLeap = abs;
          if (abs <= 2) stepCount++;
          else if (abs <= 4) skipCount++;
          else leapCount++;
        }
        prevMidi = midi;

        if (note.performance.rhythmicIndex === 1) {
          closeGroup();
          currentGroupSize = 1;
        } else {
          currentGroupSize++;
        }
      }
    }

    if (phraseSyllables > 0) cadentialMelismas.push(lastSylNotes);

    if (phrase.divisio) {
      // Analytic bar-importance weights, one rung per divisio in the bar-line
      // hierarchy (the canonical table is in docs/score.md). These are a
      // MEASUREMENT — every divisio counts, including the virgula (`) — distinct
      // from phrasing.ts's DIVISIO_STRENGTH, which zeroes the virgula because it
      // is a shaping factor, not a count.
      const d = phrase.divisio.divisio;
      if      (d === "::") { cadDist.doubleBar++; cadenceWeight += 1.5; }
      else if (d === ":")  { cadDist.colon++;     cadenceWeight += 1.0; }
      else if (d === ";")  { cadDist.semicolon++; cadenceWeight += 0.75; }
      else if (d === ",")  { cadDist.comma++;     cadenceWeight += 0.5; }
      else if (d === "`")  { cadDist.tick++;      cadenceWeight += 0.25; }
    }

    if (phraseSyllables > 0) melismaByPhrase.push(phraseNotes / phraseSyllables);
  }

  closeGroup();

  const noteRange: NoteRange | null = noteCount > 0
    ? { min: minMidi, max: maxMidi, span: maxMidi - minMidi }
    : null;

  const avgGroupSize = groupSizes.length > 0
    ? groupSizes.reduce((s, n) => s + n, 0) / groupSizes.length
    : 0;

  // Tessitura: mean height above the resting (final) note, in semitones.
  const tessitura = noteCount > 0 ? midiSum / noteCount - lastMidi : null;

  // Arch: the climb to the peak vs. the descent to the close, normalized by the
  // total climb so a full rise-and-return reads ~+1 and a monotone rise reads ~0.
  let arcus: Arcus | null = null;
  if (firstMidi !== null) {
    const climb = peakMidi - firstMidi;
    const archIndex = climb > 0 ? (peakMidi - lastMidi) / climb : 0;
    arcus = { initial: firstMidi, peak: peakMidi, final: lastMidi, archIndex };
  }

  const intervals: IntervalStats = {
    histogram,
    maxLeap,
    leapRate: motions > 0 ? leapCount / motions : 0,
    motus: { step: stepCount, skip: skipCount, leap: leapCount },
  };

  const melismaCadential = cadentialMelismas.length > 0
    ? cadentialMelismas.reduce((s, n) => s + n, 0) / cadentialMelismas.length
    : 0;

  return {
    phraseCount,
    noteCount,
    syllableCount,
    noteRange,
    ambitus: noteRange?.span ?? null,
    melismaRatio: syllableCount > 0 ? noteCount / syllableCount : 0,
    melismaByPhrase,
    melismaCadential,
    tessitura,
    intervals,
    arcus,
    ictusRate: noteCount > 0 ? ictusCount / noteCount : 0,
    rhythmicProfile: {
      arsic: arsicCount,
      thetic: theticCount,
      avgGroupSize,
      maxGroupSize,
    },
    cadenceWeight,
    cadenceDistribution: cadDist,
  };
}
