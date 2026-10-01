// ---------------------------------------------------------------------------
// data/gabc-glyphs — GABC/neume → SMuFL codepoint selection for SVG rendering
// ---------------------------------------------------------------------------
// Codepoints and pitch positions mirror the gabc-smufl project's
// data/gabc-map.json (SMuFL 1.5 / Bravura 1.392). Outlines for these codepoints
// are baked into smufl-glyphs.json by scripts/extract-smufl-glyphs.mjs.
//
// pitch_positions: the raw GABC pitch letter a–m IS the staff slot, in
// half-staff-spaces from the bottom line, independent of clef. (a=-2 … c=0
// space-below-bottom-line … g=4 reference … j=7 top line … m=10.)

/** Staff position (half-spaces from bottom line) for each GABC pitch letter. */
export const PITCH_POSITIONS: Readonly<Record<string, number>> = Object.freeze({
  a: -2, b: -1, c: 0, d: 1, e: 2, f: 3, g: 4,
  h: 5, i: 6, j: 7, k: 8, l: 9, m: 10,
});

/** Half-staff-space position for a raw GABC letter; null if out of range. */
export function staffPositionForLetter(letter: string): number | null {
  const pos = PITCH_POSITIONS[letter.toLowerCase()];
  return pos ?? null;
}

// ── Codepoints (hex, matching smufl-glyphs.json keys) ──

export const GLYPH = {
  // staff + divisiones
  staff: "E8F0",
  divisioMinima: "E8F3",   // ,
  divisioMinor: "E8F4",    // ;
  divisioMaior: "E8F5",    // :
  divisioFinalis: "E8F6",  // ::
  virgula: "E8F7",         // `
  // clefs
  fClef: "E902",
  cClef: "E906",
  // single notes (SMuFL plainchant, E990–E9A1)
  punctum: "E990",
  punctumInclinatum: "E991",
  punctumInclinatumAuctum: "E992",
  punctumInclinatumDeminutum: "E993",
  auctumAsc: "E994",
  auctumDesc: "E995",
  virga: "E996",
  virgaReversa: "E997",
  cavum: "E998",
  // chantPunctumLinea: a punctum BETWEEN two vertical lines, gabc R (and, hollow,
  // r0). Not the linea — gabc's `=` bar-shaped note, which SMuFL does not carry.
  // gabc-smufl's map labels it "bar note, no notehead"; the outline says otherwise.
  lineaPunctum: "E999",
  lineaPunctumCavum: "E99A",
  quilisma: "E99B",
  oriscusAsc: "E99C",
  oriscusDesc: "E99D",
  oriscusLiquescens: "E99E",
  strophicus: "E99F",
  strophicusAuctus: "E9A0",
  punctumDeminutum: "E9A1",
  // THE CUSTOS, added to the bake 2026-08-12. Bravura carries it at EA00-EA09
  // and the subset did not, so the emitter drew a plain punctum at a line's
  // end — a note where a guide belongs, with none of the tail that tells a
  // singer it points at the next line rather than sounding.
  //
  // The tail RISES AWAY FROM THE STAFF, so the direction follows the note:
  // stem-up for a degree in the staff's lower half, stem-down for the upper.
  // (An earlier attempt mapped E8F4/E8F5 as custosUp/custosDown on
  // 2026-08-04, read off a SMuFL name list without checking them against the
  // divisio map ten lines above — so every custos drew a `;` or a `:`, and
  // beside a real barline it read as a doubled bar. Hence the bbox check in
  // the extractor, and hence these names carry their SMuFL ones.)
  //
  // THE CUSTOS, six cuts: a small head ON THE BASELINE with a stem running
  // AWAY from the staff. The stem's length is how far the pitch sits from the
  // staff's middle, which is what Lowest/Low/Middle name, and the sign is
  // narrow (60 units) because the stem IS the sign.
  //
  // Three wrong guesses came before this, each from reading a SMuFL name and
  // trusting it: EA02 is a liquescent zigzag, EA00 the ornate Solesmes
  // curl-and-dots (authentic, unreadable at score size), EA0A a lozenge with a
  // rising stroke that draws three and a half times a notehead's width. This
  // block was dismissed as "bare ledger stems" on the strength of its 60-unit
  // width — the narrowness is the point. Render an outline against a baseline
  // before trusting any of it.
  custosUp: ["EA04", "EA05", "EA06"] as const,     // lowest, low, middle
  custosDown: ["EA07", "EA08", "EA09"] as const,   // middle, high, highest
  // note components
  podatusLower: "E9B0",
  podatusUpper: "E9B1",
  // rhythmic signs
  ictusAbove: "E9D0",
  ictusBelow: "E9D1",
  circulus: "E9D2",
  semicirculus: "E9D4",
  accentus: "E9D6",
  episema: "E9D8",
  mora: "E9D9",
  // accidentals (medieval soft-b flat / natural; standard sharp fallback).
  // The natural is E9E1, the b quadratum — the square hard b that pairs with
  // E9E0's round soft b, and the glyph the emitter actually draws (see
  // GLYPHS_BY_SET in emitters/accidentals.ts). E9E2 was a different mark.
  flat: "E9E0",
  natural: "E9E1",
  sharp: "E262",
} as const;

/** Written note shape → notehead glyph codepoint, before liquescence and the hollow. */
export const SHAPE_GLYPH: Readonly<Record<string, string>> = Object.freeze({
  punctum: GLYPH.punctum,
  inclinatum: GLYPH.punctumInclinatum,
  virga: GLYPH.virga,
  virgaReversa: GLYPH.virgaReversa,
  quilisma: GLYPH.quilisma,
  oriscus: GLYPH.oriscusAsc,
  strophicus: GLYPH.strophicus,
  lineaPunctum: GLYPH.lineaPunctum,
});

/** The fields of a note that choose its head. */
export interface HeadSpec {
  shape: string;
  liquescence: "deminutive" | "ascending" | "descending" | null;
  oriscusDirection: "ascending" | "descending" | null;
  hollow: boolean;
}

/**
 * The notehead for a note, or null when Bravura draws no head for that
 * combination (a liquescent virga or quilisma) and the caller keeps its
 * fallback. Gregorio's rules: an oriscus takes only the deminutive
 * liquescence; a strophicus either augmentation as its auctus. A hollow
 * inclinatum returns the full diamond: Bravura has no cavum of it, so the
 * emitter traces that outline instead (see `tracedHollow`).
 */
export function headGlyph(n: HeadSpec): string | null {
  const liq = n.liquescence;
  switch (n.shape) {
    case "punctum":
      if (liq === "deminutive") return GLYPH.punctumDeminutum;
      if (liq === "ascending") return GLYPH.auctumAsc;
      if (liq === "descending") return GLYPH.auctumDesc;
      return n.hollow ? GLYPH.cavum : GLYPH.punctum;
    case "inclinatum":
      if (liq === "deminutive") return GLYPH.punctumInclinatumDeminutum;
      if (liq) return GLYPH.punctumInclinatumAuctum;
      return GLYPH.punctumInclinatum;
    case "oriscus":
      if (liq === "deminutive") return GLYPH.oriscusLiquescens;
      return n.oriscusDirection === "descending" ? GLYPH.oriscusDesc : GLYPH.oriscusAsc;
    case "strophicus":
      return liq ? GLYPH.strophicusAuctus : GLYPH.strophicus;
    case "lineaPunctum":
      return n.hollow ? GLYPH.lineaPunctumCavum : GLYPH.lineaPunctum;
    default:
      return liq ? null : SHAPE_GLYPH[n.shape] ?? null;
  }
}

/**
 * A hollow head Bravura does not carry, drawn as its full glyph's outline:
 * the inclinatum (gabc Gr, G<r). The score app hollows its diamond the same
 * way, so the two agree.
 */
export function tracedHollow(n: HeadSpec): boolean {
  return n.hollow && n.shape === "inclinatum";
}

/** Divisio mark → glyph codepoint. */
export const DIVISIO_GLYPH: Readonly<Record<string, string>> = Object.freeze({
  ",": GLYPH.divisioMinima,
  ";": GLYPH.divisioMinor,
  ":": GLYPH.divisioMaior,
  "::": GLYPH.divisioFinalis,
  "`": GLYPH.virgula,
});

// EntryLineAsc (pes rising stroke) and LigaturaDesc (clivis falling stroke),
// indexed by ascending-interval size (2nd..6th / 2nd..5th). Clamped to range.
const ENTRY_LINE_ASC = ["E9B4", "E9B5", "E9B6", "E9B7", "E9B8"]; // 2nd..6th
const LIGATURA_DESC = ["E9B9", "E9BA", "E9BB", "E9BC"];          // 2nd..5th

/** EntryLineAsc component for a rising interval of `steps` diatonic degrees. */
export function entryLineAsc(steps: number): string {
  const i = Math.min(Math.max(steps, 2), 6) - 2;
  return ENTRY_LINE_ASC[i]!;
}

/** LigaturaDesc component for a falling interval of `steps` diatonic degrees. */
export function ligaturaDesc(steps: number): string {
  const i = Math.min(Math.max(steps, 2), 5) - 2;
  return LIGATURA_DESC[i]!;
}
