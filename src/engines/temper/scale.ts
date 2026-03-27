// ---------------------------------------------------------------------------
// engines/temper/scale — tuning ratio builder
// ---------------------------------------------------------------------------

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

// Parse a single step value — ratio string ("3/2") or cent number
function parseStep(v: number | string): number {
  if (typeof v === "number") return 2 ** (v / 1200); // cents → ratio
  const s = v.trim();
  const slash = s.indexOf("/");
  if (slash !== -1) {
    const num = parseFloat(s.slice(0, slash));
    const den = parseFloat(s.slice(slash + 1));
    if (!Number.isFinite(num) || !Number.isFinite(den) || den === 0)
      throw new RangeError(`Invalid step ratio: "${s}"`);
    return num / den;
  }
  const n = parseFloat(s);
  if (!Number.isFinite(n)) throw new RangeError(`Invalid step value: "${s}"`);
  return 2 ** (n / 1200); // treat bare number string as cents
}

const PURE_FIFTH = 3 / 2;
const SYNTONIC_COMMA = 81 / 80;
const FIFTH_TO_CHROM = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];

function buildPythagoreanRatios(commaN: number): number[] {
  const tf = commaN === 0
    ? PURE_FIFTH
    : PURE_FIFTH * Math.pow(1 / SYNTONIC_COMMA, Math.min(1, Math.max(0, commaN)));
  const out = new Array<number>(12);
  for (let k = 0; k < 12; k++) {
    const pc = FIFTH_TO_CHROM[k]!;
    out[pc] = foldOct(tf ** k);
  }
  const root = out[0] ?? 1;
  for (let i = 0; i < 12; i++) out[i] = (out[i] ?? 1) / root;
  return out;
}

// Expand 7 diatonic step ratios to 12 by filling chromatic gaps with pythagorean
function expandDiatonicSteps(diatonic: number[], scalePcs: number[]): number[] {
  const base = buildPythagoreanRatios(0);
  const out = base.slice();
  // scalePcs are the 7 diatonic pitch classes for the mode, starting from finalis
  for (let i = 0; i < 7 && i < diatonic.length; i++) {
    const pc = scalePcs[i]!;
    out[pc] = foldOct(diatonic[i]!);
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
  const scalePcs = modeData?.scalePcs ?? [0, 2, 4, 5, 7, 9, 11];

  let ratios: number[];

  if (opts.steps != null) {
    const parsed = opts.steps.map(parseStep);
    if (parsed.length === 7) {
      ratios = expandDiatonicSteps(parsed, scalePcs);
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
  // cents[] is normalized to root; cents[pc] - cents[9] gives the tuned interval from A.
  const centsFromA = (scala.cents[pc] ?? 0) - (scala.cents[9] ?? 0);
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
