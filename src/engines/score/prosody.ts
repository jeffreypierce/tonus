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

export interface Prosody {
  noteCount: number;
  syllableCount: number;
  phraseCount: number;
  noteRange: NoteRange | null;
  ambitus: number | null;
  melismaRatio: number;
  melismaByPhrase: number[];
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

    for (const syl of phrase.syllables) {
      if (syl.notes.length === 0) continue;
      phraseSyllables++;
      syllableCount++;

      for (const note of syl.notes) {
        noteCount++;
        phraseNotes++;
        if (note.pitch.midi < minMidi) minMidi = note.pitch.midi;
        if (note.pitch.midi > maxMidi) maxMidi = note.pitch.midi;
        if (note.context.ictus) ictusCount++;
        if (note.performance.rhythmicShape === "arsic") arsicCount++;
        else theticCount++;

        if (note.performance.rhythmicIndex === 1) {
          closeGroup();
          currentGroupSize = 1;
        } else {
          currentGroupSize++;
        }
      }
    }

    if (phrase.divisio) {
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

  return {
    phraseCount,
    noteCount,
    syllableCount,
    noteRange,
    ambitus: noteRange?.span ?? null,
    melismaRatio: syllableCount > 0 ? noteCount / syllableCount : 0,
    melismaByPhrase,
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
