// ---------------------------------------------------------------------------
// engines/score/cadence — mode-specific cadence detection
// ---------------------------------------------------------------------------
// A pure detection pass, modelled on the arsis/thesis classifier in ir.ts:
// walk the phrase tree, inspect the notes that approach each phrase-final
// divisio, and classify the cadence as data. Detection only — no interpretation.
//
// "Cadence" here is the melodic close of a phrase (Solesmes incise), distinct
// from prosody's cadenceWeight/cadenceDistribution, which merely count the
// divisio bars. Cadence figures are mode-specific, so this consumes the
// per-mode ModeData.cadences catalog.
import type { Phrase } from "./types.js";
import type { ModeData, CadenceFigure } from "../temper/data/modes.js";

export type CadenceTarget = "finalis" | "tenor" | "other";
export type CadenceApproach = "descending" | "ascending" | "unison";

export interface Cadence {
  /** Index of the phrase this cadence closes. */
  phraseIndex: number;
  /** The divisio bar that ends the phrase: "," "`" ";" ":" "::". */
  divisio: string;
  /**
   * Where the phrase came to rest, from the final note's modal role. Medial
   * cadences often rest on the tenor or elsewhere
   */
  target: CadenceTarget;
  /** Melodic contour into the resolution, across the observed window. */
  approach: CadenceApproach;
  /** Matched finalis-cadence figure id (e.g. "mi-re"), or null. */
  formula: string | null;
  /** The observed final pitch-class run — the evidence, resolution note last. */
  pcs: number[];
  /**
   * The window as diatonic steps relative to the resolution target (0 = target,
   * -1 = the note below), resolution last — the surface the catalog matches on.
   * Empty when there is no mode/target; null entries are notes off the scale.
   */
  steps: Array<number | null>;
  /** 0–1: how cleanly the ending lands, raised by a catalog match. */
  confidence: number;
  /** Note positions forming this cadence: [phraseIndex, syllableIndex, noteIndex]. */
  notes: Array<[number, number, number]>;
}

// Cadence formulae run four to ten notes [biblio: homan-cadence, p. xiii]. Take
// a window at the upper end so the longest figures fit, with room for the
// approach; tail-matching ignores the extra leading notes.
const WINDOW = 8;

interface WindowNote {
  pc: number;
  midi: number;
  role: "finalis" | "tenor" | "other" | null;
  syllableIndex: number;
  noteIndex: number;
}

/** Last up-to-WINDOW notes of a phrase, resolution note last. */
function phraseFinalWindow(phrase: Phrase): WindowNote[] {
  const window: WindowNote[] = [];
  outer: for (let si = phrase.syllables.length - 1; si >= 0; si--) {
    const notes = phrase.syllables[si]!.notes;
    for (let ni = notes.length - 1; ni >= 0; ni--) {
      const note = notes[ni]!;
      window.push({
        pc: note.step.pc,
        midi: note.pitch.midi,
        role: note.step.role,
        syllableIndex: si,
        noteIndex: ni,
      });
      if (window.length >= WINDOW) break outer;
    }
  }
  window.reverse();
  return window;
}

function classifyTarget(final: WindowNote | undefined): CadenceTarget {
  if (!final) return "other";
  if (final.role === "finalis") return "finalis";
  if (final.role === "tenor") return "tenor";
  return "other";
}

function classifyApproach(window: WindowNote[]): CadenceApproach {
  if (window.length < 2) return "unison";
  const slope = window[window.length - 1]!.midi - window[0]!.midi;
  if (slope < 0) return "descending";
  if (slope > 0) return "ascending";
  return "unison";
}

/**
 * Signed diatonic step of pitch class `pc` relative to target pc `on`, within
 * the mode's 7-note scale: 0 = the target, +1 = one scale step above, -1 = the
 * note below, wrapping by octave so it stays in a small signed range. Returns
 * null for a pc outside the mode's scale (e.g. a chromatic inflection).
 */
function diatonicStep(
  pc: number,
  on: number,
  scalePcs: number[],
): number | null {
  const iPc = scalePcs.indexOf(((pc % 12) + 12) % 12);
  const iOn = scalePcs.indexOf(((on % 12) + 12) % 12);
  if (iPc === -1 || iOn === -1) return null;
  const n = scalePcs.length;
  let d = iPc - iOn;
  // Fold to the nearest octave so a cadence's small leaps read as small steps.
  while (d > n / 2) d -= n;
  while (d < -n / 2) d += n;
  return d;
}

/**
 * Collapse consecutive equal steps to one. A chant that lands on the final and
 * repeats it (a final distropha, say) should still match the plain figure the
 * treatises write with one note per pitch. Figures have no adjacent repeats, so
 * collapsing is a no-op on them.
 */
function collapseRepeats(steps: Array<number | null>): Array<number | null> {
  const out: Array<number | null> = [];
  for (const s of steps) {
    if (out.length === 0 || out[out.length - 1] !== s) out.push(s);
  }
  return out;
}

/**
 * Match a collapsed step-run against a catalog figure. Both end on the
 * resolution (0), so compare from the tail backward. Returns a fraction in
 * 0..1: how much of the figure the ending realises (0 = no tail match).
 */
function figureMatch(observed: Array<number | null>, figure: number[]): number {
  if (figure.length === 0 || observed.length === 0) return 0;
  let matched = 0;
  for (let k = 1; k <= figure.length && k <= observed.length; k++) {
    if (observed[observed.length - k] === figure[figure.length - k]) matched++;
    else break;
  }
  return matched / figure.length;
}

/**
 * The best catalog figure for an ending. A figure the ending realises in full
 * (frac === 1) is preferred, and among those the longest — the most specific
 * description — wins, so e.g. sol-fa-mi beats its own fa-mi suffix. Failing a
 * full match, the highest partial fraction is kept (a weaker signal).
 */
function bestFigure(
  observed: Array<number | null>,
  figures: CadenceFigure[],
): { figure: CadenceFigure; frac: number } | null {
  const collapsed = collapseRepeats(observed);
  let best: { figure: CadenceFigure; frac: number } | null = null;
  for (const figure of figures) {
    const frac = figureMatch(collapsed, figure.steps);
    if (frac === 0) continue;
    if (!best) {
      best = { figure, frac };
      continue;
    }
    // Rank: a full match outranks any partial; among full matches the longer
    // figure wins; otherwise the higher fraction.
    const bestFull = best.frac === 1;
    const thisFull = frac === 1;
    if (thisFull && !bestFull) best = { figure, frac };
    else if (
      thisFull &&
      bestFull &&
      figure.steps.length > best.figure.steps.length
    )
      best = { figure, frac };
    else if (!thisFull && !bestFull && frac > best.frac)
      best = { figure, frac };
  }
  return best;
}

/**
 * Detect the cadence closing each phrase. One Cadence per phrase that carries a
 * divisio. With no mode, targets/approach are still classified but no figure is
 * named (formula: null), matching the score's graceful-degradation convention.
 */
export function detectCadences(
  phrases: Phrase[],
  modeData: ModeData | undefined,
): Cadence[] {
  const cadences: Cadence[] = [];

  for (let pi = 0; pi < phrases.length; pi++) {
    const phrase = phrases[pi]!;
    if (!phrase.divisio) continue;

    const window = phraseFinalWindow(phrase);
    if (window.length === 0) continue;

    const divisio = phrase.divisio.divisio;
    const finalNote = window[window.length - 1];
    const target = classifyTarget(finalNote);
    const approach = classifyApproach(window);
    const pcs = window.map((w) => w.pc);

    // A clean landing on finalis/tenor is confident on its own; a catalog match
    // raises it further. No modal role → a weak baseline.
    let confidence = target === "other" ? 0.3 : 0.6;
    let formula: string | null = null;
    let steps: Array<number | null> = [];

    if (modeData && (target === "finalis" || target === "tenor")) {
      // Express the window as diatonic steps relative to the note it resolved
      // onto. The catalogue holds final cadences, so only match on the finalis.
      const onPc = target === "finalis" ? modeData.final : modeData.tenor;
      steps = window.map((w) => diatonicStep(w.pc, onPc, modeData.scalePcs));
      if (target === "finalis") {
        const match = bestFigure(steps, modeData.cadences);
        if (match) {
          formula = match.figure.id;
          confidence = Math.min(1, confidence + 0.4 * match.frac);
        }
      }
    }

    cadences.push({
      phraseIndex: pi,
      divisio,
      target,
      approach,
      formula,
      pcs,
      steps,
      confidence: Math.round(confidence * 100) / 100,
      notes: window.map((w) => [pi, w.syllableIndex, w.noteIndex]),
    });
  }

  return cadences;
}
