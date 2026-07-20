// ---------------------------------------------------------------------------
// engines/score/modulation — tonal-centre shifts within a chant
// ---------------------------------------------------------------------------
// A pure detection pass, sibling to cadence.ts. Where cadence detection reads a
// phrase's ending, this reads each phrase's whole pitch content: it scores the
// phrase against every mode (reusing the imprint's modal-affinity math) and
// flags runs of phrases that lean on a foreign mode — a modulation. Detection
// only; distribution-based, no functional/harmonic analysis.
//
// A NOTE ON THE PHRASE-CLOSING NOTE (considered and rejected, 2026-07-17):
// passing each phrase's last pc into the affinity (the final-note bonus that
// serves whole-chant mode detection so well) was measured over the labeled
// corpus (n=7,573): spans rose 22,489 → 24,552 with no reduction in
// wall-to-wall readings. At phrase level the signal conflates a medial REST
// (tenor-resting and other non-final medial degrees, which the cadence
// tradition expects) with modal allegiance — so phrase scoring stays
// distribution-only.
import type { Phrase } from "./types.js";
import { computeModalAffinity } from "../temper/modality.js";
import { MODES } from "../temper/data/modes.js";

export interface Modulation {
  /** Phrase index where the modulation begins (inclusive). */
  startPhrase: number;
  /** Phrase index where it ends (inclusive). */
  endPhrase: number;
  /** The mode the passage leans toward (1–8). */
  toMode: number;
  /** 0–1: how strongly the foreign mode outscored the home mode, averaged. */
  confidence: number;
  /**
   * What the span is evidence of. "modulation" — an internal excursion that
   * returns; "transposition" — the whole chant sits in a foreign mode's frame
   * (it does not close on its labeled final, and one foreign mode dominates
   * most of its phrases), i.e. the melody is notated at a transposed position
   * (the affinal) or the label disagrees with the notation. A transposed chant
   * is not modulating: the displacement is global, and callers displaying
   * "modulations" should treat these spans as a re-reading of the whole chant.
   */
  kind: "modulation" | "transposition";
}

// How much a foreign mode must outscore the home mode (in normalised affinity)
// before a phrase counts as leaning away. Calibrated against Suñol's worked
// examples [biblio: sunol-textbook]: at 0.25 the modulations he names in Christus
// resurgens (to mode 3) register, while incidental colouring below that does not.
const MARGIN = 0.25;

// A chant is read as TRANSPOSED (not modulating) when it does not close on its
// labeled mode's final AND a single foreign mode's spans cover most of its
// phrases. Corpus context: 81.6% of labeled chants close on their mode's final
// (night report 2026-07-07); of the remainder, the wall-to-wall foreign
// readings this rule reclassifies were 30% of ALL labeled chants before it.
const TRANSPOSITION_SHARE = 0.6;

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
      kind: "modulation",
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

  // Transposition, not modulation: the chant does not close on its labeled
  // final, and one foreign mode's spans dominate its phrases — the displacement
  // is global (affinal notation, or a label at odds with the notation).
  const homeFinal = MODES.get(homeMode)?.final;
  let closingPc: number | undefined;
  for (let pi = phrases.length - 1; pi >= 0 && closingPc == null; pi--) {
    for (let si = phrases[pi]!.syllables.length - 1; si >= 0; si--) {
      const notes = phrases[pi]!.syllables[si]!.notes;
      if (notes.length > 0) {
        closingPc = notes[notes.length - 1]!.pitch.pc;
        break;
      }
    }
  }
  if (homeFinal != null && closingPc != null && closingPc !== homeFinal % 12) {
    const coverage = new Map<number, number>();
    for (const m of modulations) {
      coverage.set(
        m.toMode,
        (coverage.get(m.toMode) ?? 0) + (m.endPhrase - m.startPhrase + 1),
      );
    }
    for (const [toMode, phraseCount] of coverage) {
      if (phraseCount / phrases.length >= TRANSPOSITION_SHARE) {
        for (const m of modulations) {
          if (m.toMode === toMode) m.kind = "transposition";
        }
      }
    }
  }

  return modulations;
}
