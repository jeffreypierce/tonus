// ---------------------------------------------------------------------------
// engines/temper/scale — tuning ratio builder
// ---------------------------------------------------------------------------
// Builds the 12 pitch-class ratios for a temperament. The default is pure
// Pythagorean — all intervals from the 3/2 fifth and the octave — because that
// is the tuning of medieval theory from Boethius through the Guidonian gamut
// [biblio: boethius-institutione, guidonian-gamut], and it is correct for
// unaccompanied chant: melodic fifths/fourths are perfect, the narrow limma
// (256/243) gives half-steps a keen leading quality, and the wide Pythagorean
// third (81/64) never has to serve as a consonance.
//
// `comma` tempers the fifth toward meantone by narrowing it by a fraction of
// the syntonic comma (81/80, the gap between the Pythagorean and pure 5/4
// third): comma "1/4" stacks four fifths to a pure major third — quarter-comma
// meantone, the 16th-century sound.
//
// The `steps` presets supply just-intonation genera in place of the tempered
// fifth: the three Ptolemaic diatonics (intense/soft/equable, his χρόαι
// "shades") come straight from Ptolemy's tetrachord divisions [biblio:
// ptolemy-harmonics, Harmonics I.15–16]. See expandDiatonicSteps for how a
// 7-ratio genus is laid onto the fixed gamut, and why.

import { MODES } from "./modes.js";

export interface Scale {
  ratios: number[];    // 12 frequency ratios normalized to root pc
  cents: number[];     // same values in cents
  mode: number;        // 1–8, default 1
  a4: number;          // reference Hz, default 440
  comma: number;       // tempering fraction (0 = pure fifths / pythagorean)
  root: number;        // pc of tone center (default: modal finalis)
  transpose: number;   // semitone shift applied to all output pitches
}

export interface ScaleOpts {
  mode?: number;                 // 1–8, default 1
  a4?: number;                   // Hz, default 440
  comma?: number | string;       // e.g. 0.25 or "1/4"; default 0 (pure pythagorean)
  steps?: (number | string)[];   // 7 or 12 values — cent numbers or ratio strings ("3/2")
  root?: number;                 // pc — re-anchor tone center (overrides modal finalis)
  transpose?: number;            // semitones — shift all output pitches
}

// ── Internal helpers ──

export interface RatioResult {
  ratio: number;
  cents: number;
  display: string;
}

// Stern-Brocot rational approximation — finds nearest simple fraction
function approximate(value: number, maxDen = 1000): [number, number] {
  if (value === Math.round(value)) return [Math.round(value), 1];

  let [a, b, c, d] = [0, 1, 1, 0];
  let bestNum = 1, bestDen = 1, bestErr = Infinity;

  for (let i = 0; i < 100; i++) {
    const medNum = a + c;
    const medDen = b + d;
    if (medDen > maxDen) break;

    const med = medNum / medDen;
    const err = Math.abs(value - med);
    if (err < bestErr) {
      bestErr = err;
      bestNum = medNum;
      bestDen = medDen;
    }
    if (err < 1e-9) break;

    if (value > med) {
      a = medNum;
      b = medDen;
    } else {
      c = medNum;
      d = medDen;
    }
  }

  return [bestNum, bestDen];
}

export function toRatio(input: string): RatioResult {
  const r = parseStep(input);
  const cents = 1200 * Math.log2(r);
  const [num, den] = approximate(r);
  const display = den === 1 ? `${num}:1` : `${num}:${den}`;
  return { ratio: r, cents, display };
}

function foldOct(r: number): number {
  let x = r;
  while (x >= 2) x *= 0.5;
  while (x < 1) x *= 2;
  return x;
}

function parseComma(comma: number | string): number {
  if (typeof comma === "number") return comma;
  const s = comma.trim();
  const slash = s.indexOf("/");
  if (slash !== -1) {
    const num = parseFloat(s.slice(0, slash));
    const den = parseFloat(s.slice(slash + 1));
    if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0)
      throw new RangeError(`Invalid comma fraction: "${s}"`);
    return num / den;
  }
  const n = parseFloat(s);
  if (!Number.isFinite(n)) throw new RangeError(`Invalid comma value: "${s}"`);
  return n;
}

// Parse a single pitch value using Scala convention:
// period present → cents, slash or colon → ratio, bare integer → ratio over 1
export function parseStep(v: number | string): number {
  if (typeof v === "number") return 2 ** (v / 1200);
  const s = v.trim().split(/\s/)[0]!; // first token only (Scala allows trailing text)
  const ratioMatch = s.match(/^(\d+)[/:](\d+)$/);
  if (ratioMatch) {
    const num = Number(ratioMatch[1]);
    const den = Number(ratioMatch[2]);
    if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0)
      throw new RangeError(`Invalid ratio: "${s}"`);
    return num / den;
  }
  const n = parseFloat(s);
  if (!Number.isFinite(n)) throw new RangeError(`Invalid step value: "${s}"`);
  if (s.includes(".")) return 2 ** (n / 1200); // cents
  return n; // bare integer → ratio (e.g. 2 = 2/1)
}

export interface ScalaFile {
  name: string;
  steps: string[];
}

export function parseScala(input: string): ScalaFile {
  const lines = input.split(/\r?\n/);
  const nonComment: string[] = [];
  for (const line of lines) {
    if (line.trimStart().startsWith("!")) continue;
    nonComment.push(line);
  }

  const name = (nonComment[0] ?? "").trim();
  const count = parseInt(nonComment[1] ?? "0", 10);
  if (!Number.isFinite(count) || count < 0)
    throw new RangeError(`Invalid note count in Scala file: "${nonComment[1]}"`);

  const steps: string[] = [];
  for (let i = 2; i < nonComment.length && steps.length < count; i++) {
    const trimmed = nonComment[i].trim();
    if (trimmed) steps.push(trimmed);
  }

  if (steps.length !== count)
    throw new RangeError(`Scala file declares ${count} pitches but only ${steps.length} found`);

  return { name, steps };
}

const PURE_FIFTH = 3 / 2;
const SYNTONIC_COMMA = 81 / 80;
// The chain of fifths as chromatic pitch classes, running E♭–G♯:
//   E♭ B♭ F C G D A E B F♯ C♯ G♯
// The naturals sit F–B (ut–fa is a pure 4/3 — b molle exists precisely to make
// that fourth over F), b molle and E♭ take the flat side, the ficta sharps
// (F♯ C♯ G♯) the sharp side. This is the received medieval dodecachord; an
// ascending-only chain from C would spell F as E♯ (a wolf ut–fa of 521.5¢)
// and b molle as A♯. buildPythagoreanRatios walks this and octave-folds each.
// The heji/cents baseline in score/emitters/accidentals.ts derives from this
// same chain via pythagoreanCentsByPc() — keep them coupled.
const FIFTH_TO_CHROM = [3, 10, 5, 0, 7, 2, 9, 4, 11, 6, 1, 8];

// Ptolemy's three diatonic genera [biblio: ptolemy-harmonics, Harmonics I.15–16],
// each a tetrachord (1/1 … 4/3) doubled up a 3/2 to fill the octave:
//   intense (syntonon)  — classical just intonation: pure 5/4 major, 6/5 minor.
//   soft (malakon)      — septimal: the 7th harmonic gives a large 8/7 whole tone.
//   equable (homalon)   — undecimal: near-equal ~150–182¢ steps.
const PTOLEMAIC: Record<string, string[]> = {
  "ptolemy-intense": ["1/1", "9/8", "5/4", "4/3", "3/2", "5/3", "15/8"],
  "ptolemy-soft":    ["1/1", "8/7", "80/63", "4/3", "3/2", "12/7", "40/21"],
  "ptolemy-equable": ["1/1", "12/11", "6/5", "4/3", "3/2", "18/11", "9/5"],
};

export function getPtolemaicRatios(tuning: string): string[] | undefined {
  return PTOLEMAIC[tuning];
}

/**
 * The pure-fifth chain's ET-cents deviation per pitch class, anchored A = 0
 * (the a4-reference anchor `offset` carries under the default tuning). The
 * heji/cents accidental baseline reads THIS, so the emitters and the engine
 * can never disagree about the chain's spelling.
 */
export function pythagoreanCentsByPc(): number[] {
  const ratios = buildPythagoreanRatios(0); // C-anchored, folded to [1, 2)
  const cents = ratios.map((r, pc) => 1200 * Math.log2(r) - 100 * pc);
  const anchor = cents[9]!;
  return cents.map((c) => Math.round((c - anchor) * 100) / 100);
}

function buildPythagoreanRatios(commaN: number): number[] {
  const tf = commaN === 0
    ? PURE_FIFTH
    : PURE_FIFTH * Math.pow(1 / SYNTONIC_COMMA, Math.min(1, Math.max(0, commaN)));
  const out = new Array<number>(12);
  for (let k = 0; k < 12; k++) {
    const pc = FIFTH_TO_CHROM[k]!;
    out[pc] = foldOct(tf ** k);
  }
  // Anchor on C and fold each pitch class into the C-register [1, 2): the
  // table's contract is "ascending within the C octave, then normalized to
  // root". The E♭–G♯ chain reaches some pcs below C, so without this fold the
  // table comes out octave-scrambled (A at 27/32, a broken ratio() matcher).
  const root = out[0] ?? 1;
  for (let i = 0; i < 12; i++) out[i] = foldOct((out[i] ?? 1) / root);
  return out;
}

// The natural (white-key) pitch classes in ascending pitch order: C D E F G A B.
// A diatonic-genus preset (Ptolemy's tetrachord divisions) describes the tuning
// of THIS fixed gamut, not a per-mode arrangement.
const NATURAL_PCS = [0, 2, 4, 5, 7, 9, 11];

// Expand 7 diatonic step ratios to 12 by filling chromatic gaps with pythagorean.
//
// The seven ratios are laid onto the fixed natural gamut (C D E F G A B) in
// pitch order — NOT onto the mode's scalePcs. A church mode is an octave
// species of this one gamut, so its interval qualities emerge from *where the
// final sits within the fixed tuning*, handled downstream by normalizeToRoot.
// This yields the authentic per-mode qualities (a Dorian minor third, a
// Mixolydian ♭7) and the honest syntonic wolf (D–A = 40/27 under
// ptolemy-intense).
//
// Mapping the genus degree-per-mode onto scalePcs instead would force
// major-scale qualities — a 5/4 major third above *every* final — onto every
// mode. Re-deriving a per-mode just intonation would attribute a modern just
// tuning to Ptolemy, who described tetrachord divisions, not modal scales.
function expandDiatonicSteps(diatonic: number[]): number[] {
  const base = buildPythagoreanRatios(0);
  const out = base.slice();
  for (let i = 0; i < 7 && i < diatonic.length; i++) {
    out[NATURAL_PCS[i]!] = foldOct(diatonic[i]!);
  }
  return out;
}

function normalizeToRoot(ratios: number[], rootPc: number): number[] {
  const pivot = ratios[rootPc] ?? 1;
  return ratios.map((r) => r / pivot);
}

function ratiosToCents(ratios: number[]): number[] {
  return ratios.map((r) => 1200 * Math.log2(r));
}

// ── Public ──

export function buildRatios(opts: ScaleOpts = {}): Scale {
  const mode = opts.mode ?? 1;
  const a4 = opts.a4 ?? 440;
  const transpose = opts.transpose ?? 0;
  const commaN = opts.comma != null ? parseComma(opts.comma) : 0;

  const modeData = MODES.get(mode);
  const finalisPc = modeData?.final ?? 0;
  const rootPc = opts.root ?? finalisPc;

  let ratios: number[];

  if (opts.steps != null) {
    const parsed = opts.steps.map(parseStep);
    if (parsed.length === 7) {
      ratios = expandDiatonicSteps(parsed);
    } else if (parsed.length === 12) {
      ratios = parsed;
    } else {
      throw new RangeError(`steps must be 7 or 12 values, got ${parsed.length}`);
    }
  } else {
    ratios = buildPythagoreanRatios(commaN);
  }

  ratios = normalizeToRoot(ratios, rootPc);
  const cents = ratiosToCents(ratios);

  return { ratios, cents, mode, a4, comma: commaN, root: rootPc, transpose };
}

export function midiToHz(
  midi: number,
  scala: Scale,
): { hz: number; offset: number; bend: number } {
  const m = Math.min(127, Math.max(0, Math.round(midi + scala.transpose)));
  const pc = m % 12;
  const oct = Math.floor(m / 12) - 1;
  // Interval from A (pc=9) to target pc in cents, within the tuning.
  // cents[] is root-normalized, and its octave folding differs by build path
  // (the Pythagorean builder leaves below-root pcs negative; the diatonic-
  // steps builder folds everything to [0,1200)). Place every pc in the
  // C-register first — its height above pitch-class C within one octave —
  // so the A→pc displacement is correct regardless of root or tuning.
  const posC = (p: number): number => {
    const rel = (scala.cents[p] ?? 0) - (scala.cents[0] ?? 0);
    return ((rel % 1200) + 1200) % 1200;
  };
  const centsFromA = posC(pc) - posC(9);
  // A4 = midi 69, so A in this octave is midi (oct+1)*12 + 9 = m's octave A.
  const octaveShift = oct - 4; // octaves above/below A4
  const hz = scala.a4 * 2 ** (octaveShift + centsFromA / 1200);
  const equalHz = scala.a4 * 2 ** ((m - 69) / 12);
  const offset = 1200 * Math.log2(hz / equalHz);
  const center = 8192;
  const semis = offset / 100;
  const bend = Math.max(0, Math.min(16383, Math.round(center + center * (semis / 2))));
  return { hz, offset, bend };
}
