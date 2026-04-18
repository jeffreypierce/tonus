// ---------------------------------------------------------------------------
// engines/summa/metrics — aggregate score metrics
// ---------------------------------------------------------------------------
import type { Phrase } from "../score/types.js";
import type { ModeData } from "../temper/modes.js";
import { MODES } from "../temper/modes.js";

export interface NoteRange {
  min: number;
  max: number;
  span: number;
}

export interface ArsisProfile {
  mean: number;
  variance: number;
}

export interface CadenceDistribution {
  comma: number;
  tick: number;
  semicolon: number;
  colon: number;
  doubleBar: number;
}

export interface MetricsResult {
  phraseCount: number;
  noteCount: number;
  syllableCount: number;
  noteRange: NoteRange | null;
  ambitus: number | null;
  melismaRatio: number;
  melismaByPhrase: number[];
  ictusRate: number;
  arsisProfile: ArsisProfile | null;
  cadenceWeight: number;
  cadenceDistribution: CadenceDistribution;
  modalConformance: number | null;
  pcDistribution: Record<number, number>;
  pcCounts: number[]; // internal — used for attractor computation
}

export interface MetricsInput {
  phrases: Phrase[];
  mode?: number;
}

export function computeMetrics(inputs: MetricsInput | MetricsInput[]): MetricsResult {
  const sources = Array.isArray(inputs) ? inputs : [inputs];

  let phraseCount = 0;
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

  for (const src of sources) {
    for (const phrase of src.phrases) {
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
          pcCounts[note.pitch.pc]++;
          if (note.context.ictus) ictusCount++;
          arsisValues.push(note.performance.arsis);
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
  }

  const melismaRatio = syllableCount > 0 ? noteCount / syllableCount : 0;

  const noteRange: NoteRange | null = noteCount > 0
    ? { min: minMidi, max: maxMidi, span: maxMidi - minMidi }
    : null;

  let arsisProfile: ArsisProfile | null = null;
  if (arsisValues.length > 0) {
    const mean = arsisValues.reduce((s, v) => s + v, 0) / arsisValues.length;
    const variance = arsisValues.reduce((s, v) => s + (v - mean) ** 2, 0) / arsisValues.length;
    arsisProfile = { mean, variance };
  }

  const pcDistribution: Record<number, number> = {};
  for (let pc = 0; pc < 12; pc++) {
    pcDistribution[pc] = noteCount > 0 ? pcCounts[pc] / noteCount : 0;
  }

  // Modal conformance (use first source's mode if consistent across all)
  const modes = sources.map((s) => s.mode).filter((m): m is number => m !== undefined);
  const allSame = modes.length === sources.length && modes.every((m) => m === modes[0]);
  const modeNum = allSame ? modes[0] : undefined;
  const modeData: ModeData | undefined = modeNum !== undefined ? MODES.get(modeNum) : undefined;

  let modalConformance: number | null = null;
  if (modeData && noteCount > 0) {
    const structural = new Set<number>([
      modeData.final,
      modeData.tenor,
      ...modeData.modulations.regular,
    ]);
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
    pcCounts,
  };
}
