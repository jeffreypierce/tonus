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
//
// Two catalogues serve two claims. ModeData.cadences (tradita — the treatises'
// per-mode figures) names the `formula`; CADENTIAE (inventa — the corpus tally)
// names the `familia`/`adventus` pair: the tail's interval shape (the gesture)
// and where it lands relative to the chant final (the function). The corpus key
// is computed exactly as the mining did — last <=4 notes, semitone intervals,
// arrival octave-reduced to [-5..+6] — so every classification joins the table.
import type { Phrase } from "./types.js";
import type { ModeData, CadenceFigure } from "../temper/data/modes.js";
import { CADENTIAE, type CadentiaFamilia } from "../../data/cadentiae.js";

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
  /**
   * The corpus-catalogue key, "shape @arrival" (e.g. "2,0,-2 @0" — see
   * CADENTIAE), or null when the phrase ends on a single note (no intervals).
   */
  signature: string | null;
  /** Draft Latin binomial of the matched CADENTIAE family, or null. */
  familia: string | null;
  /**
   * The arrival case, Latin: "in finalem", "in tenorem" (when the arrival
   * degree is the mode's tenor), "in tertiam", "in subfinalem", …
   */
  adventus: string;
  /** Interval signature of the closing tail (<=4 notes), in semitones. */
  shape: number[];
  /** Closing note minus the chant final, semitones, octave-reduced [-5..+6]. */
  arrival: number;
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

// ── The corpus catalogue (CADENTIAE) ────────────────────────────────────────

// The mining keyed tails by their last <=4 notes; the classifier reads the same
// span out of the (longer) formula window.
const TAIL = 4;

let familiaIndex: Map<string, CadentiaFamilia> | null = null;
/** CADENTIAE keyed by "shape @arrival", built once on first use. */
function familiaByKey(): Map<string, CadentiaFamilia> {
  if (!familiaIndex) {
    familiaIndex = new Map(CADENTIAE.map((f) => [f.key, f]));
  }
  return familiaIndex;
}

/** Octave-reduce a semitone offset to [-5..+6], exactly as the mining did. */
function reduceArrival(semitones: number): number {
  let a = semitones % 12;
  if (a > 6) a -= 12;
  if (a < -5) a += 12;
  return a;
}

/**
 * The arrival case, mode-independent: the interval class of the closing note
 * above (or below) the chant final. The mode-aware "in tenorem" upgrade happens
 * at detection time, where the mode is known.
 */
function adventusCase(arrival: number): string {
  if (arrival === 0) return "in finalem";
  if (arrival === 1 || arrival === 2) return "in secundam";
  if (arrival === 3 || arrival === 4) return "in tertiam";
  if (arrival === 5 || arrival === 6) return "in quartam";
  if (arrival === -1 || arrival === -2) return "in subfinalem";
  if (arrival === -3 || arrival === -4) return "in subtertiam";
  return "in subquartam"; // -5
}

/** The chant's closing note — the reference every arrival is measured from. */
function chantFinalMidi(phrases: Phrase[]): number | undefined {
  for (let pi = phrases.length - 1; pi >= 0; pi--) {
    const w = phraseFinalWindow(phrases[pi]!);
    if (w.length > 0) return w[w.length - 1]!.midi;
  }
  return undefined;
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
  const finalMidi = chantFinalMidi(phrases);
  // The mode's tenor as an arrival degree — pc difference, same reduction as
  // the arrival itself, so a tenor landing reads "in tenorem" even transposed.
  const tenorArrival = modeData
    ? reduceArrival(((modeData.tenor - modeData.final) % 12 + 12) % 12)
    : undefined;

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

    // The corpus classification: the tail's interval shape and its arrival,
    // computed exactly as the mining did so the key joins CADENTIAE.
    const tail = window.slice(-TAIL);
    const shape = tail.slice(1).map((w, k) => w.midi - tail[k]!.midi);
    const arrival =
      finalMidi != null
        ? reduceArrival(tail[tail.length - 1]!.midi - finalMidi)
        : 0;
    const signature =
      shape.length > 0 ? `${shape.join(",")} @${arrival}` : null;
    const familia =
      signature != null ? (familiaByKey().get(signature)?.familia ?? null) : null;
    const adventus =
      arrival !== 0 && arrival === tenorArrival
        ? "in tenorem"
        : adventusCase(arrival);

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
      signature,
      familia,
      adventus,
      shape,
      arrival,
    });
  }

  return cadences;
}
