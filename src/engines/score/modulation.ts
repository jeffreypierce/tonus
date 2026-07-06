// ---------------------------------------------------------------------------
// engines/score/modulation — tonal-centre shifts within a chant
// ---------------------------------------------------------------------------
// A pure detection pass, sibling to cadence.ts. Where cadence detection reads a
// phrase's ending, this reads each phrase's whole pitch content: it scores the
// phrase against every mode (reusing the imprint's modal-affinity math) and
// flags runs of phrases that lean on a foreign mode — a modulation. Detection
// only; distribution-based, no functional/harmonic analysis.
import type { Phrase } from "./types.js";
import { computeModalAffinity } from "../temper/modality.js";

export interface Modulation {
  /** Phrase index where the modulation begins (inclusive). */
  startPhrase: number;
  /** Phrase index where it ends (inclusive). */
  endPhrase: number;
  /** The mode the passage leans toward (1–8). */
  toMode: number;
  /** 0–1: how strongly the foreign mode outscored the home mode, averaged. */
  confidence: number;
}

// How much a foreign mode must outscore the home mode (in normalised affinity)
// before a phrase counts as leaning away. Calibrated against Suñol's worked
// examples: at 0.25 the modulations he names in Christus resurgens (to mode 3)
// register, while incidental modal colouring below that does not.
const MARGIN = 0.25;

/** The pitch-class distribution of one phrase's notes (fractions summing to 1). */
function phrasePcDistribution(phrase: Phrase): Record<number, number> {
  const counts = new Array<number>(12).fill(0);
  let total = 0;
  for (const syl of phrase.syllables) {
    for (const note of syl.notes) {
      counts[note.pitch.pc]++;
      total++;
    }
  }
  const dist: Record<number, number> = {};
  for (let pc = 0; pc < 12; pc++) dist[pc] = total > 0 ? counts[pc]! / total : 0;
  return dist;
}

/**
 * Detect tonal-centre shifts. For each phrase, score it against every mode; a
 * phrase whose top mode is not the home mode, and beats the home mode by MARGIN,
 * "leans" toward that foreign mode. Consecutive phrases leaning to the same mode
 * merge into one modulation span. `homeMode` is the chant's own mode (1–8); with
 * no mode, nothing is detected.
 */
export function detectModulations(
  phrases: Phrase[],
  homeMode: number | undefined,
): Modulation[] {
  if (homeMode == null) return [];

  // Per-phrase lean: the foreign mode a phrase favours, with its margin over
  // the home mode — or null if the phrase stays home.
  const leans: Array<{ mode: number; margin: number } | null> = phrases.map(
    (phrase) => {
      if (phrase.syllables.every((s) => s.notes.length === 0)) return null;
      const affinity = computeModalAffinity(phrasePcDistribution(phrase));
      const top = affinity[0];
      if (!top || top.mode === homeMode) return null;
      const home = affinity.find((a) => a.mode === homeMode);
      const margin = top.score - (home?.score ?? 0);
      return margin >= MARGIN ? { mode: top.mode, margin } : null;
    },
  );

  // Merge consecutive phrases leaning to the same foreign mode into spans.
  const modulations: Modulation[] = [];
  let run: { mode: number; start: number; margins: number[] } | null = null;

  const flush = () => {
    if (!run) return;
    const avg = run.margins.reduce((s, m) => s + m, 0) / run.margins.length;
    modulations.push({
      startPhrase: run.start,
      endPhrase: run.start + run.margins.length - 1,
      toMode: run.mode,
      confidence: Math.min(1, Math.round(avg * 100) / 100),
    });
    run = null;
  };

  for (let i = 0; i < leans.length; i++) {
    const lean = leans[i]!;
    if (lean && run && lean.mode === run.mode) {
      run.margins.push(lean.margin);
    } else {
      flush();
      if (lean) run = { mode: lean.mode, start: i, margins: [lean.margin] };
    }
  }
  flush();

  return modulations;
}
