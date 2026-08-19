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
  /** "glyph" → a notehead-preceding accidental; "cents" → a label floating above the staff. */
  kind: "glyph" | "cents";
  /** Glyph codepoint (kind "glyph") — a standard or HEJI accidental. */
  glyph?: string;
  /** Text label (kind "cents") — e.g. "−3.9". */
  label?: string;
  /** The DEGREE THE SIGN ALTERS (kind "glyph", standard mode), as the two
   *  emitters address a line: `degree` is quadrata's staffPosition, `degreeSpn`
   *  is moderna's written pitch. A flat is printed on the line of the pitch it
   *  inflects — a B-flat sign sits on the B line — while its horizontal place
   *  is before the figure where it takes effect. Those are two facts, and the
   *  carrying row supplies only the second. Both absent when the sign alters
   *  nothing found ahead. */
  degree?: number;
  degreeSpn?: string;
}

// The Pythagorean chain's ET-cents deviation per pitch class, derived from the
// SAME E♭–G♯ chain the engine tunes with (temper/scale.ts) so baseline and
// engine can never disagree — a hardcoded copy once drifted and broke the
// heji channel for every flatted chant under the default tuning.
const PYTH_BASELINE: number[] = pythagoreanCentsByPc();

// Accidental glyph sets (Bravura, already baked). The modern set is the
// transcription's ♭ ♮ ♯; the medieval set is what square notation itself
// wrote: the round soft b (b rotundum) for the flat, the square hard b
// (b quadratum) for the natural, and the croix for the rare sharp
// [SMuFL medieval & Renaissance accidentals, U+E9E0–].
export type AccidentalGlyphSet = "modern" | "medieval";
const GLYPHS_BY_SET: Record<AccidentalGlyphSet, Record<number, string>> = {
  modern: { [-1]: "E260", 0: "E261", 1: "E262" },
  medieval: { [-1]: "E9E0", 0: "E9E1", 1: "E9E3" },
};

// How far ahead a written sign is read for the degree it alters. A flat is
// written before the figure it governs, not always before the note: on
// gregobase:1180 one sign precedes its B-flat by four notes within the
// syllable. Bounded so a sign whose alteration never arrives does not reach
// across the chant and borrow an unrelated note's line.
const SCOPE = 12;

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
 * Repeat-suppression (standard mode) and per-phrase pitch-class suppression
 * (cents mode) keep the staff from being carpeted.
 * @throws Error when `heji` is asked of a non-just (meantone) tuning.
 */
export function computeAccidentals(
  rows: ChantTabulaRow[],
  mode: AccidentalMode,
  centsBaseline: CentsBaseline = "pythagorean",
  glyphSet: AccidentalGlyphSet = "modern",
): (AccidentalMark | null)[] {
  if (mode === "standard") {
    // WHERE a sign is printed and WHICH DEGREE it alters are different facts,
    // and the row carrying the sign supplies only the first. In
    // `fe(jx)cit(ih)` the flat is written before the I while it governs the J:
    // horizontally it precedes the figure (so the singer reads it in time),
    // vertically it belongs to the pitch it inflects. Solesmes prints a flat
    // on the LINE OF THE PITCH IT ALTERS — a B-flat sign sits on the B line
    // [biblio: liber-usualis, Rules for Interpretation; the plate for
    // gregobase:1180 at p. 1637 shows both of that chant's flats on the B
    // line, over an A and a G]. Reading `row.accidental` here drew nothing at
    // all in the `fe(jx)` case (the I is unaltered); reading the carrying
    // row's staffPosition drew the flat on whatever line happened to precede
    // — corpus-wide, 80% of signs sat on a degree they do not alter.
    const alteredOf = (from: number): ChantTabulaRow | undefined => {
      // The sign governs the next note in its scope that CARRIES THE STATE it
      // sets. A flat looks for the note it lowers; a natural looks for the note
      // it restores, which is unaltered by definition (`accidental === 0`) and
      // is marked "state" because the sign, not the clef, put it there.
      // Reading only `accidental !== 0` found the flats and missed every
      // natural's B.
      const sign = rows[from]!.accidentalSign ?? rows[from]!.accidental;
      for (let j = from; j < rows.length && j < from + SCOPE; j++) {
        const r = rows[j]!;
        if (sign === 0 ? r.accidentalSource === "state" : r.accidental === sign) return r;
      }
      return undefined;
    };
    // Restate a sign once another pitch has intervened since that DEGREE was
    // last marked. Comparing the carrying row against the row before it was
    // wrong twice over: it measured the wrong pitch (the sign's neighbour,
    // not the degree it alters), and "the immediately-preceding row" is a
    // weaker rule than the books', which restate after an intervening pitch.
    // On gregobase:1180 the third flat was dropped because the note before it
    // was another A — though it opens a new phrase and governs a new B-flat.
    const lastMarked = new Map<number, number>();
    return rows.map((row, i) => {
      if (row.accidentalSource !== "explicit") return null;
      const sign = row.accidentalSign ?? row.accidental;
      const altered = alteredOf(i);
      const degree = altered?.staffPosition;
      const key = degree ?? row.staffPosition;
      const since = lastMarked.get(key);
      lastMarked.set(key, i);
      // Suppress only a restatement with nothing between it and the last mark
      // of the same degree.
      if (since !== undefined && !rows.slice(since + 1, i).some((r) => r.staffPosition !== key)) {
        return null;
      }
      return {
        kind: "glyph", glyph: GLYPHS_BY_SET[glyphSet][sign],
        degree, degreeSpn: altered?.spn,
      };
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

  // cents — signed deviation label, stated once per pitch class PER PHRASE.
  // A deviating pitch is labelled at its first appearance in each phrase and
  // rides silently through the phrase's repeats; the next phrase restates it
  // (the reader's memory is the phrase, and chant has no measures to carry it).
  const seen = new Set<string>();
  return rows.map((row) => {
    const value = centsBaseline === "et" ? row.offset : fromPythagorean(row);
    if (Math.abs(value) < 0.5) return null;              // effectively in tune
    const key = `${row.phraseIndex}:${row.pc}`;
    if (seen.has(key)) return null;             // already labelled in this phrase
    seen.add(key);
    const sign = value < 0 ? "−" : "+";            // real minus sign
    return { kind: "cents", label: `${sign}${Math.abs(value).toFixed(1)}` };
  });
}
