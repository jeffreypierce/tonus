// ---------------------------------------------------------------------------
// engines/summa/api — top-level analysis function
// ---------------------------------------------------------------------------
import type { Score } from "../score/api.js";
import type { Chant } from "../chant/types.js";
import type { Scale } from "../temper/scale.js";
import { buildRatios } from "../temper/scale.js";
import { computeMetrics, type NoteRange, type ArsisThesisBalance, type CadenceDistribution } from "./metrics.js";
import { computeAttractors, type Attractor } from "./attractors.js";
import { computeVowelAttractors, type VowelAttractor } from "./vowels.js";

export interface SummaOpts {
  mode?: number;
}

export interface Residue {
  scoreCount: number;
  chants: Chant[];
  phraseCount: number;
  noteCount: number;
  syllableCount: number;
  noteRange: NoteRange | null;
  ambitus: number | null;
  melismaRatio: number;
  melismaByPhrase: number[];
  ictusRate: number;
  arsisThesisBalance: ArsisThesisBalance;
  cadenceWeight: number;
  cadenceDistribution: CadenceDistribution;
  mode: number | null;
  modalConformance: number | null;
  pcDistribution: Record<number, number>;
  attractors: Attractor[];
  vowelAttractors: VowelAttractor[];
}

export type { Attractor, VowelAttractor, NoteRange, ArsisThesisBalance, CadenceDistribution };

function inferModeFromChant(chant: Chant): number | undefined {
  const m = parseInt(chant.mode ?? "", 10);
  return m >= 1 && m <= 8 ? m : undefined;
}

export function buildSumma(input: Score | Score[], opts: SummaOpts = {}): Residue {
  const scores = Array.isArray(input) ? input : [input];

  // Resolve mode: explicit opts > consistent across scores > null
  const scoreModes = scores.map((s) => inferModeFromChant(s.chant));
  const allSame = scoreModes.length > 0 && scoreModes.every((m) => m === scoreModes[0] && m !== undefined);
  const modeNum = opts.mode ?? (allSame ? scoreModes[0] : undefined);

  const metrics = computeMetrics(
    scores.map((s) => ({ phrases: s.phrases, mode: modeNum })),
  );

  // Tuning context for attractor Notes: use mode if resolved, else default (mode 1)
  const scale: Scale = buildRatios({ mode: modeNum ?? 1 });
  const attractors = computeAttractors(metrics.pcDistribution, scale);

  const vowelAttractors = computeVowelAttractors(scores.map((s) => s.phrases));

  return {
    scoreCount: scores.length,
    chants: scores.map((s) => s.chant),
    phraseCount: metrics.phraseCount,
    noteCount: metrics.noteCount,
    syllableCount: metrics.syllableCount,
    noteRange: metrics.noteRange,
    ambitus: metrics.ambitus,
    melismaRatio: metrics.melismaRatio,
    melismaByPhrase: metrics.melismaByPhrase,
    ictusRate: metrics.ictusRate,
    arsisThesisBalance: metrics.arsisThesisBalance,
    cadenceWeight: metrics.cadenceWeight,
    cadenceDistribution: metrics.cadenceDistribution,
    mode: modeNum ?? null,
    modalConformance: metrics.modalConformance,
    pcDistribution: metrics.pcDistribution,
    attractors,
    vowelAttractors,
  };
}
