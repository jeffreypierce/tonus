// ---------------------------------------------------------------------------
// engines/score/formula — Apel melodic-formula detection
// ---------------------------------------------------------------------------
// A pure detection pass over the phrase tree, the melodic-analysis sibling of
// cadence.ts and modulation.ts. Where a cadence is the figure at a phrase's tail
// and a modulation is a tonal-centre shift, a FORMULA is a whole standard phrase
// from Apel's centonization catalogue [biblio: apel-chant]: an intonation, a
// mediant, a termination the chant is assembled from.
//
// Only the Tier-1 tabulatable genres carry a catalogue (Graduals, Tracts, Great
// Responsories); everything else — and any chant with no mode — returns an empty
// result, the score's graceful-degradation convention.
//
// The matcher expresses each phrase as octave-aware diatonic steps relative to
// the final's register (0 = final, +4 = the fifth, +7 = the octave — Apel's own
// degree count, NOT cadence.ts's folded local contour), reduces it to its
// structural skeleton, and aligns it against the catalogue with tolerance: a formula is a skeleton,
// and a real phrase varies it with melismatic filling (Apel's +/underline/small-
// caps notation), so the match is a contour-subsequence, not an exact run.
import type { Phrase } from "./types.js";
import type { ModeData } from "../temper/data/modes.js";
import { type Formula, type FormulaSlot, formulaeFor } from "./data/formulas.js";

export interface FormulaMatch {
  /** Index of the phrase this formula realises. */
  phraseIndex: number;
  /** The matched formula's Apel id (e.g. "F1"), or null when none fits. */
  formula: string | null;
  /** The matched formula's psalmodic slot, or null. */
  slot: FormulaSlot | null;
  /** 0–1: how completely the phrase realises the formula skeleton. */
  confidence: number;
  /** The phrase's structural step-skeleton (relative to the final) — the evidence. */
  steps: Array<number | null>;
}

// The minimum skeleton length worth matching: shorter phrases are cadential
// fragments cadence.ts already covers, not standard phrases.
const MIN_SKELETON = 3;
// A match must realise at least this fraction of a formula's skeleton to count —
// below it the alignment is noise rather than a recognised standard phrase.
const MIN_CONFIDENCE = 0.6;

/**
 * Signed diatonic step of a note relative to the final's REGISTER, octave-aware
 * (0 = the final itself, +4 = the fifth above, +7 = the octave; negative below).
 * Unlike cadence.ts's diatonicStep — a deliberately folded local-contour
 * heuristic for figures that never exceed a fifth — a formula is a whole
 * standard phrase that routinely recites on the tenor, so its skeleton must
 * count Apel's actual scale degrees: a fold to ±half-octave would read the
 * mode-5 tenor (+4) as −3 and mangle every climbing verse formula.
 * Null for a pitch class outside the mode's scale (chromatic inflection).
 */
function diatonicStep(midi: number, finalMidi: number, scalePcs: number[]): number | null {
  const pc = ((midi % 12) + 12) % 12;
  const d = scalePcs.indexOf(pc); // scalePcs is ordered from the final: index = degree
  if (d === -1) return null;
  const finalPc = ((finalMidi % 12) + 12) % 12;
  const within = (pc - finalPc + 12) % 12;
  return d + (7 * (midi - finalMidi - within)) / 12;
}

/** Every note of a phrase as a diatonic step relative to the final, in order. */
function phraseSteps(phrase: Phrase, finalMidi: number, scalePcs: number[]): Array<number | null> {
  const steps: Array<number | null> = [];
  for (const syl of phrase.syllables) {
    for (const note of syl.notes) {
      steps.push(diatonicStep(note.pitch.midi, finalMidi, scalePcs));
    }
  }
  return steps;
}

/**
 * The final's sounding register for this chant. The chant's own last note is
 * the strongest witness when it IS the final (the normal case); otherwise the
 * final's octave is placed so the mode's ambitus (± a tone of licence) covers
 * as many of the chant's notes as possible.
 */
function finalReference(phrases: Phrase[], modeData: ModeData): number | null {
  const midis: number[] = [];
  for (const ph of phrases) {
    for (const syl of ph.syllables) for (const note of syl.notes) midis.push(note.pitch.midi);
  }
  if (midis.length === 0) return null;
  const finalPc = ((modeData.final % 12) + 12) % 12;
  const last = midis[midis.length - 1]!;
  if (((last % 12) + 12) % 12 === finalPc) return last;
  const lo = Math.min(...midis);
  const hi = Math.max(...midis);
  const relLow = modeData.ambitus.lowest - modeData.final - 2;
  const relHigh = modeData.ambitus.highest - modeData.final + 2;
  let best: number | null = null;
  let bestCover = -1;
  for (let m = lo - 12; m <= hi + 12; m++) {
    if (((m % 12) + 12) % 12 !== finalPc) continue;
    const cover = midis.filter((x) => x >= m + relLow && x <= m + relHigh).length;
    if (cover > bestCover) {
      bestCover = cover;
      best = m;
    }
  }
  return best;
}

/**
 * Reduce a step-run to its structural skeleton: drop consecutive repeats (a held
 * or reiterated note is one skeletal position) so the melismatic filling that
 * varies a formula to fit its text collapses onto the formula's shape.
 */
function skeleton(steps: Array<number | null>): Array<number | null> {
  const out: Array<number | null> = [];
  for (const s of steps) {
    if (out.length === 0 || out[out.length - 1] !== s) out.push(s);
  }
  return out;
}

/**
 * How well an observed skeleton realises a formula, as a subsequence contour
 * match: walk the formula, advancing through the observed skeleton to find each
 * formula step in order (extra observed steps between are the melismatic filling
 * a formula tolerates). Returns the fraction of the formula matched in order.
 */
function formulaMatch(observed: Array<number | null>, formula: Array<number | null>): number {
  if (formula.length === 0) return 0;
  let oi = 0;
  let matched = 0;
  for (const f of formula) {
    while (oi < observed.length && observed[oi] !== f) oi++;
    if (oi < observed.length) { matched++; oi++; }
    else break;
  }
  return matched / formula.length;
}

/** The best-fitting formula for a phrase skeleton — highest fraction, longest on ties. */
function bestFormula(
  observed: Array<number | null>,
  formulae: Formula[],
): { formula: Formula; frac: number } | null {
  let best: { formula: Formula; frac: number } | null = null;
  for (const formula of formulae) {
    const frac = formulaMatch(observed, formula.steps);
    if (frac < MIN_CONFIDENCE) continue;
    if (
      !best ||
      frac > best.frac ||
      (frac === best.frac && formula.steps.length > best.formula.steps.length)
    ) {
      best = { formula, frac };
    }
  }
  return best;
}

/**
 * Detect the Apel melodic formula each phrase realises. One FormulaMatch per
 * phrase. With no mode, no catalogue for the chant's genre × mode, or a phrase
 * too short to be a standard phrase, `formula` is null (graceful degradation).
 */
export function detectFormulas(
  phrases: Phrase[],
  modeData: ModeData | undefined,
  office: string,
): FormulaMatch[] {
  const matches: FormulaMatch[] = [];
  const formulae = modeData ? formulaeFor(office, modeData.mode) : [];
  const finalMidi = modeData ? finalReference(phrases, modeData) : null;

  for (let pi = 0; pi < phrases.length; pi++) {
    const phrase = phrases[pi]!;

    let steps: Array<number | null> = [];
    let formula: string | null = null;
    let slot: FormulaSlot | null = null;
    let confidence = 0;

    if (modeData && finalMidi !== null) {
      steps = skeleton(phraseSteps(phrase, finalMidi, modeData.scalePcs));
      if (formulae.length > 0 && steps.length >= MIN_SKELETON) {
        const best = bestFormula(steps, formulae);
        if (best) {
          formula = best.formula.id;
          slot = best.formula.slot;
          confidence = Math.round(best.frac * 100) / 100;
        }
      }
    }

    matches.push({ phraseIndex: pi, formula, slot, confidence, steps });
  }

  return matches;
}
