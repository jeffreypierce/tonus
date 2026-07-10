// ---------------------------------------------------------------------------
// engines/score/emitters/accidentals — the intonation channel
// ---------------------------------------------------------------------------
// Three ways to show a note's accidental / microtuning, chosen by the caller:
//
//   standard  — plain performance accidentals (♭ ♮ ♯) from the GABC, with
//               repeat-suppression: a restated same pitch does not re-mark.
//   heji      — Extended Helmholtz–Ellis comma accidentals for JUST-expressible
//               tunings. HEJI's BASELINE is the Pythagorean chain of pure fifths
//               — so under tonus's default (Pythagorean) tuning nothing blooms;
//               a syntonic-comma arrow appears only where the tuning departs
//               from the pure-fifth chain (e.g. a just preset, ±21.5¢). Meantone
//               is irrational tempering, not just — heji throws under it.
//   cents     — signed cent deviations for ANY tuning (meantone included). The
//               baseline is the chant's home intonation (Pythagorean) by default,
//               so changing the tuning shows what each temperament DOES to the
//               chant; "et" gives the modern-reader instinct (deviation from
//               equal temperament) instead.
//
// A note's tabula `offset` is its deviation from EQUAL TEMPERAMENT, in cents.
// The Pythagorean baseline below is the fixed ET-deviation of the pure-fifth
// chain per pitch class — subtracting it yields the deviation FROM Pythagorean,
// which is what heji and cents-pythagorean render.
import type { ChantTabulaRow } from "../tabula.js";
import { pythagoreanCentsByPc } from "../../temper/scale.js";

export type AccidentalMode = "standard" | "heji" | "cents";
export type CentsBaseline = "pythagorean" | "et";

/** One note's intonation mark, for the emitter to place before/above the head. */
export interface AccidentalMark {
  /** "glyph" → a notehead-preceding accidental; "cents" → a superscript label. */
  kind: "glyph" | "cents";
  /** Glyph codepoint (kind "glyph") — a standard or HEJI accidental. */
  glyph?: string;
  /** Text label (kind "cents") — e.g. "−3.9". */
  label?: string;
}

// The Pythagorean chain's ET-cents deviation per pitch class, derived from the
// SAME E♭–G♯ chain the engine tunes with (temper/scale.ts) so baseline and
// engine can never disagree — a hardcoded copy once drifted and broke the
// heji channel for every flatted chant under the default tuning.
const PYTH_BASELINE: number[] = pythagoreanCentsByPc();

// Standard accidental glyphs (Bravura, already baked).
const STD_GLYPH: Record<number, string> = { [-1]: "E260", 0: "E261", 1: "E262" };

// HEJI comma glyphs (Extended Helmholtz–Ellis, U+E2C0–). The syntonic-comma
// arrows: one comma down / up. Higher-order commas are out of scope for 0.2.
const HEJI_COMMA_DOWN = "E2C2"; // one syntonic comma lower
const HEJI_COMMA_UP = "E2C7";   // one syntonic comma higher

/** Deviation of a note from the Pythagorean chain, in cents. */
function fromPythagorean(row: ChantTabulaRow): number {
  return row.offset - (PYTH_BASELINE[row.pc] ?? 0);
}

/**
 * Compute the intonation mark for each tabula row, or null where none applies.
 * Repeat-suppression (standard mode) and per-system pitch-class suppression
 * (cents mode) keep the staff from being carpeted.
 * @throws Error when `heji` is asked of a non-just (meantone) tuning.
 */
export function computeAccidentals(
  rows: ChantTabulaRow[],
  mode: AccidentalMode,
  centsBaseline: CentsBaseline = "pythagorean",
): (AccidentalMark | null)[] {
  if (mode === "standard") {
    // A glyph before any note whose pitch is explicitly inflected — but not on
    // an immediately-repeated same pitch (restate only after another pitch).
    let prevPc: number | null = null;
    return rows.map((row) => {
      const repeat = row.pc === prevPc;
      prevPc = row.pc;
      if (row.accidentalSource !== "explicit" || repeat) return null;
      return { kind: "glyph", glyph: STD_GLYPH[row.accidental] };
    });
  }

  if (mode === "heji") {
    // A tuning is just-expressible when its departures from Pythagorean are
    // whole syntonic commas (±21.5¢). An irrational tempering (meantone) leaves
    // fractional deviations everywhere — heji cannot notate it. Detect that.
    const devs = rows.map(fromPythagorean);
    const SYNTONIC = 21.506;
    const tempered = devs.some((d) => {
      if (Math.abs(d) < 0.5) return false; // on the pure-fifth chain
      const commas = d / SYNTONIC;
      return Math.abs(commas - Math.round(commas)) > 0.1; // not a whole comma
    });
    if (tempered) {
      throw new Error(
        "inscriptio: accidentals \"heji\" needs a just-expressible tuning; the " +
        "current temperament tempers by fractional commas (e.g. meantone). Use " +
        "accidentals: \"cents\" for tempered tunings.",
      );
    }
    return rows.map((row) => {
      const d = fromPythagorean(row);
      if (Math.abs(d) < 0.5) return null; // Pythagorean baseline — no arrow
      const commas = Math.round(d / SYNTONIC);
      if (commas === 0) return null;
      return { kind: "glyph", glyph: commas < 0 ? HEJI_COMMA_DOWN : HEJI_COMMA_UP };
    });
  }

  // cents — signed deviation label, repeat-suppressed per pitch class.
  const seen = new Set<number>();
  return rows.map((row) => {
    const value = centsBaseline === "et" ? row.offset : fromPythagorean(row);
    if (Math.abs(value) < 0.5) return null;              // effectively in tune
    if (seen.has(row.pc)) return null;                  // already labelled this pc
    seen.add(row.pc);
    const sign = value < 0 ? "−" : "+";            // real minus sign
    return { kind: "cents", label: `${sign}${Math.abs(value).toFixed(1)}` };
  });
}
