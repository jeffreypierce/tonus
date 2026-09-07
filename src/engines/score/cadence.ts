// ---------------------------------------------------------------------------
// engines/score/cadence — cadence detection on the one corpus key
// ---------------------------------------------------------------------------
// A pure detection pass, modelled on the arsis/thesis classifier in ir.ts:
// walk the phrase tree, inspect the notes that approach each phrase-final
// divisio, and classify the cadence as data. Detection only — no interpretation,
// and no corpus table: the catalogue join (finality, confidence from evidence)
// is the score builder's, so a baked artifact never enters the detection path.
//
// "Cadence" here is the melodic close of a phrase (Solesmes incise), distinct
// from the metrics' cadenceWeight/cadenceDistribution, which merely count the
// divisio bars.
//
// ONE KEY. A phrase-end is its tail in DIATONIC steps — letter steps — relative
// to the chant's SOUNDED final (its closing note, not the labelled mode's
// final, which disagrees on a transposed or mislabelled chant), resolution
// last, signed, not octave-reduced. Two levels read off one tail:
//
//   species  the whole collapsed tail, at most TAIL notes: "2,1,0" — the
//            cadence, what the melody did;
//   genus    the last motion and the landing: "cadens @0" — the landing,
//            the level at which corpus counts hold per mode.
//
// Letter steps, not semitones, because the same gesture on a different final
// is the same gesture: F E in mode 3 and E D in mode 1 are both "step down
// onto the final"; the third above F and the third above D are both "the
// third". And letter steps, not the mode's scale, so B-flat and B-natural are
// one degree and a mode-less chant keys like any other — every phrase-end in
// the corpus keys, where a scale-relative reading covered 59%.
//
// Repeats. Interior repeats collapse (G G A G is G A G), so a note reiterated
// on the way in does not multiply spellings. The LANDING's own repeat is kept,
// once: A G G stays "insistens @0". Collapsing that too would fold the
// reiterated close — 18% of all phrase-ends — into the motion before it.
//
// The received figures (Niedermeyer & d'Ortigue, Bragers) are no longer data
// here; they are a reference note beside the mined table, and every one of
// them is a species of this key.
import type { Phrase } from "./types.js";
import type { ModeData } from "../temper/data/modes.js";

export type CadenceTarget = "finalis" | "tenor" | "alia";
export type CadenceApproach = "descending" | "ascending" | "unison";
/**
 * The last motion of a close, in letter steps, named the way a neume is: one
 * descriptive word, the direction in the sense of the verb and the size in
 * its root (ruled 2026-09-06). A step is the bare verb, rising or falling;
 * a third crosses one note, climbing over or sliding over; a leap springs.
 *
 *   insistens     standing on it — the repeated landing
 *   surgens       rising a step          cadens        falling a step
 *   transcendens  climbing over a third  translabens   sliding over a third
 *   exsiliens     springing up a leap    desiliens     leaping down
 *   sola          a landing alone — a one-note phrase, no gesture
 */
export type CadenceMotion =
  | "sola"
  | "insistens"
  | "surgens"
  | "cadens"
  | "transcendens"
  | "translabens"
  | "exsiliens"
  | "desiliens";

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
  /** The observed final pitch-class run — the evidence, resolution note last. */
  pcs: number[];
  /**
   * The window as diatonic steps relative to the resolution TARGET (0 = the
   * target, -1 = the note below), resolution last — the mode's reading of the
   * approach. Empty when there is no mode/target; null entries are notes off
   * the scale.
   */
  steps: Array<number | null>;
  /** 0–1: how cleanly the ending lands; the builder raises it by corpus evidence. */
  confidence: number;
  /** Note positions forming this cadence: [phraseIndex, syllableIndex, noteIndex]. */
  notes: Array<[number, number, number]>;
  /**
   * The species key: the collapsed tail as letter steps from the chant's
   * sounded final, resolution last, at most TAIL long — "2,1,0". A one-note
   * phrase keys as its landing alone ("0"): a landing with no gesture is
   * still a cadence.
   */
  species: string;
  /** The species as numbers — what `species` joins. */
  tail: number[];
  /** The genus key: `"<motion> @<degree>"`, e.g. "cadens @0". */
  genus: string;
  /** The last motion into the landing. */
  motion: CadenceMotion;
  /** The landing minus the chant's sounded final, in signed letter steps —
   *  0 the final, -1 the note below, +2 the third, +4 the fifth. Not
   *  octave-reduced: the fifth above and the fourth below are different. */
  degree: number;
  /** The two-word name, "cadens finalis": the motion and the landing's word
   *  in the chant's mode. The printed form; `genus` stays the key. */
  nomen: string;
  /**
   * The catalogued finality: the share of THIS SPECIES' corpus occurrences
   * that fall at a final close, or the genus' where the species is below the
   * catalogue's floor, or null where the genus is too. Null on a cadence taken
   * straight from `detectCadences` — the join happens in the score builder,
   * not the detector.
   */
  finality: number | null;
}

// Cadence formulae run four to ten notes [biblio: homan-cadence, p. xiii]. Take
// a window at the upper end so the longest figures fit, with room for the
// approach; the key reads the tail out of it.
const WINDOW = 8;

/** The species tail length, in collapsed notes. Ruled at three (plan-cadentiae
 *  §8.1, 2026-09-04): it matches the longest received figures, and measured
 *  in-mode it leaves 11–38% of a mode's ends in species under the floor where
 *  four left 24–58%. */
export const TAIL = 3;

const LETTER: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

/**
 * Absolute diatonic (letter) position of a scientific pitch name: seven per
 * octave, C4 = 28. Accidentals do not move it — B-flat and B-natural are one
 * degree. null for anything that is not a pitch name.
 */
export function letterPosition(spn: string): number | null {
  const m = /^([A-G])[b#x]*(-?\d+)$/.exec(spn);
  if (!m) return null;
  return Number(m[2]) * 7 + LETTER[m[1]!]!;
}

/** Collapse interior repeats; keep the landing's repeat once. */
export function collapseTail(positions: number[]): number[] {
  const out: number[] = [];
  for (const p of positions) {
    if (out.length === 0 || out[out.length - 1] !== p) out.push(p);
  }
  const n = positions.length;
  if (n >= 2 && positions[n - 1] === positions[n - 2]) out.push(positions[n - 1]!);
  return out;
}

/**
 * The key of a phrase-end from its window as final-relative LETTER STEPS
 * (0 the final, resolution last) — the pure core shared by every keyer, so a
 * consumer that already has letter steps (the census blocks, the day's
 * selection) keys exactly as `cadenceKeys` does, no second parser. Interior
 * repeats collapse, the landing's own repeat is kept once, the tail is the
 * last TAIL of that.
 */
export function genusFromSteps(steps: readonly number[]): {
  species: string; tail: number[]; genus: string; motion: CadenceMotion; degree: number;
} {
  const tail = collapseTail(steps.slice()).slice(-TAIL);
  return {
    species: tail.join(","),
    tail,
    genus: genusKey(tail),
    motion: motionOf(tail),
    degree: tail[tail.length - 1] ?? 0,
  };
}

/** The motion of the last interval of a tail, in letter steps. */
export function motionOf(tail: readonly number[]): CadenceMotion {
  if (tail.length < 2) return "sola";
  const d = tail[tail.length - 1]! - tail[tail.length - 2]!;
  if (d === 0) return "insistens";
  const up = d > 0;
  const m = Math.abs(d);
  if (m === 1) return up ? "surgens" : "cadens";
  if (m === 2) return up ? "transcendens" : "translabens";
  return up ? "exsiliens" : "desiliens";
}

/** The landing's names by degree above the final; below, "sub-" is prefixed
 *  (subfinalis, the note below the final, is the received word; subtertia
 *  and subquarta follow it). */
const ORDINALES = ["finalis", "secunda", "tertia", "quarta", "quinta", "sexta",
  "septima", "octava", "nona", "decima"];

/**
 * The landing's word: the mode's reading where it has one (finalis, tenor),
 * else the degree itself. With the motion it makes the two-word name of a
 * genus — "cadens finalis", "insistens tenor", "desiliens quinta" — the
 * printed form, while `genus` stays the key.
 */
export function landingWord(degree: number, role: CadenceTarget): string {
  if (role === "finalis") return "finalis";
  if (role === "tenor") return "tenor";
  const m = Math.abs(degree);
  const ord = ORDINALES[m] ?? `${m + 1}a`;
  if (degree < 0) return m === 1 ? "subfinalis" : `sub${ord}`;
  return ord;
}

/** The two-word name of a close: its motion and its landing's word. */
export function nomenOf(motion: CadenceMotion, degree: number, role: CadenceTarget): string {
  return `${motion} ${landingWord(degree, role)}`;
}

/**
 * The English of every word a `nomen` can contain: the eight motions, the
 * mode's two readings, and the degrees above and below the final. The Latin
 * is the name; this is its gloss, for a page that has to explain "cadens
 * finalis" to a reader. A motion's gloss ends on its preposition and a
 * landing's begins with its article, so the two words of a name join into
 * one phrase — `glossOf` does the joining.
 */
export const CADENTIA_LABEL: Readonly<Record<string, string>> = Object.freeze({
  sola: "a landing alone on",
  insistens: "standing on",
  surgens: "rising a step onto",
  cadens: "falling a step onto",
  transcendens: "climbing over a third onto",
  translabens: "sliding down a third onto",
  exsiliens: "springing up a leap onto",
  desiliens: "leaping down onto",
  finalis: "the final",
  tenor: "the tenor",
  subfinalis: "the note below the final",
  secunda: "the second",
  tertia: "the third",
  quarta: "the fourth",
  quinta: "the fifth",
  sexta: "the sixth",
  septima: "the seventh",
  octava: "the octave",
  nona: "the ninth",
  decima: "the tenth",
  subsecunda: "the second below",
  subtertia: "the third below",
  subquarta: "the fourth below",
  subquinta: "the fifth below",
  subsexta: "the sixth below",
  subseptima: "the seventh below",
  suboctava: "the octave below",
  subnona: "the ninth below",
  subdecima: "the tenth below",
});

/** A `nomen` in English: "cadens finalis" → "falling a step onto the final".
 *  A word the table does not know (a landing past the tenth) passes through. */
export function glossOf(nomen: string): string {
  return nomen.split(" ").map((w) => CADENTIA_LABEL[w] ?? w).join(" ");
}

/** The genus key for a tail: its motion and its landing. */
export function genusKey(tail: readonly number[]): string {
  return `${motionOf(tail)} @${tail[tail.length - 1] ?? 0}`;
}

interface WindowNote {
  pc: number;
  midi: number;
  spn: string;
  role: "finalis" | "tenor" | "alia" | null;
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
        spn: note.pitch.spn,
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
  if (!final) return "alia";
  if (final.role === "finalis") return "finalis";
  if (final.role === "tenor") return "tenor";
  return "alia";
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

// ── The corpus key ──────────────────────────────────────────────────────────

/** One phrase-end event: both levels of the key, and whether it closes the chant. */
export interface CadenceKeyEvent {
  /** The species key, "2,1,0". */
  species: string;
  /** The species as numbers. */
  tail: number[];
  /** The genus key, "cadens @0". */
  genus: string;
  motion: CadenceMotion;
  /** Signed letter steps of the landing from the chant's sounded final. */
  degree: number;
  /** A chant end, or a full-bar "::" — as opposed to an interior phrase end. */
  isFinal: boolean;
  /** Index of the phrase this closes. */
  phraseIndex: number;
}

/**
 * THE cadence key — one implementation, shared by every consumer: the detector
 * below, the CADENTIAE miner, and the tonus-corpus census, which once each
 * carried a copy. Agreement by luck across copies is what "no second parser,
 * no drift" forbids; hence this one function.
 *
 * Takes the FLAT shape, because that is what the census and the miner have; the
 * detector projects its window into it. A phrase end is a `phraseIndex`
 * transition or the last row. A ONE-NOTE PHRASE IS A CADENCE — it has a landing
 * but no gesture, so it keys as its landing alone rather than being skipped.
 *
 * `finalSpn` is the chant's closing note; it defaults to the last row's, which
 * is right when `rows` is the whole tabula and wrong when it is one phrase.
 */
export function cadenceKeys(
  rows: readonly { phraseIndex: number; spn: string; divisio: string | null }[],
  finalSpn?: string,
): CadenceKeyEvent[] {
  if (!rows.length) return [];
  const final = letterPosition(finalSpn ?? rows[rows.length - 1]!.spn);
  if (final == null) return [];
  const events: CadenceKeyEvent[] = [];
  for (let i = 0; i < rows.length; i++) {
    const next = rows[i + 1];
    if (next && next.phraseIndex === rows[i]!.phraseIndex) continue; // not a phrase end
    // The last <=WINDOW rows of this phrase, ending at row i.
    const seg: number[] = [];
    let broken = false;
    for (let j = i; j >= 0 && seg.length < WINDOW && rows[j]!.phraseIndex === rows[i]!.phraseIndex; j--) {
      const p = letterPosition(rows[j]!.spn);
      if (p == null) { broken = true; break; }
      seg.unshift(p - final);
    }
    if (broken) continue;
    const g = genusFromSteps(seg);
    events.push({
      ...g,
      degree: g.tail[g.tail.length - 1]!,
      isFinal: rows[i]!.divisio === "::" || !next,
      phraseIndex: rows[i]!.phraseIndex,
    });
  }
  return events;
}

/** The chant's closing note — the reference every landing is measured from. */
function chantFinalSpn(phrases: Phrase[]): string | undefined {
  for (let pi = phrases.length - 1; pi >= 0; pi--) {
    const w = phraseFinalWindow(phrases[pi]!);
    if (w.length > 0) return w[w.length - 1]!.spn;
  }
  return undefined;
}

/**
 * Detect the cadence closing each phrase. One Cadence per phrase that carries a
 * divisio. With no mode, targets/approach are still classified and the key is
 * still computed — it needs no mode — but `steps` stays empty.
 */
export function detectCadences(
  phrases: Phrase[],
  modeData: ModeData | undefined,
): Cadence[] {
  const cadences: Cadence[] = [];
  const finalSpn = chantFinalSpn(phrases);

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

    // A clean landing on finalis/tenor is confident on its own; no modal role
    // is a weak baseline. The builder raises this by what the corpus knows.
    const confidence = target === "alia" ? 0.3 : 0.6;
    let steps: Array<number | null> = [];

    if (modeData && (target === "finalis" || target === "tenor")) {
      // Express the window as diatonic steps relative to the note it resolved
      // onto — the mode's reading of the approach.
      const onPc = target === "finalis" ? modeData.final : modeData.tenor;
      steps = window.map((w) => diatonicStep(w.pc, onPc, modeData.scalePcs));
    }

    // The key, from THE shared function — the detector does not compute it
    // itself. `cadenceKeys` takes flat rows, so the window is projected into
    // that shape; one phrase in, one event out.
    const ev = cadenceKeys(
      window.map((w) => ({ phraseIndex: 0, spn: w.spn, divisio: null })),
      finalSpn,
    )[0];
    const tail = ev?.tail ?? [0];

    cadences.push({
      phraseIndex: pi,
      divisio,
      target,
      approach,
      pcs,
      steps,
      confidence,
      notes: window.map((w) => [pi, w.syllableIndex, w.noteIndex]),
      species: ev?.species ?? "0",
      tail,
      genus: ev?.genus ?? genusKey(tail),
      motion: ev?.motion ?? "sola",
      degree: ev?.degree ?? 0,
      nomen: nomenOf(ev?.motion ?? "sola", ev?.degree ?? 0, target),
      // Left null here on purpose. Detection is a pure pass over the phrase
      // tree; the corpus catalogue is generated data, and reaching for it from
      // inside the detector would put a baked artifact in the detection path.
      // buildScore joins it, where MODES is already joined.
      finality: null,
    });
  }

  return cadences;
}
