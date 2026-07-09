// ---------------------------------------------------------------------------
// data/gabc-glyphs — GABC/neume → SMuFL codepoint selection for SVG rendering
// ---------------------------------------------------------------------------
// Codepoints and pitch positions mirror the gabc-smufl project's
// data/gabc-map.json (SMuFL 1.5 / Bravura 1.392). Outlines for these codepoints
// are baked into smufl-glyphs.json by scripts/extract-smufl-glyphs.py.
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
  // single notes
  punctum: "E990",
  punctumInclinatum: "E991",
  virga: "E996",
  virgaReversa: "E997",
  cavum: "E998",
  linea: "E999",
  quilisma: "E99B",
  oriscusAsc: "E99C",
  oriscusDesc: "E99D",
  strophicus: "E99F",
  punctumDeminutum: "E9A1",
  // note components
  podatusLower: "E9B0",
  podatusUpper: "E9B1",
  // rhythmic signs
  ictusAbove: "E9D0",
  ictusBelow: "E9D1",
  episema: "E9D8",
  mora: "E9D9",
  // accidentals (medieval soft-b flat / natural; standard sharp fallback)
  flat: "E9E0",
  natural: "E9E2",
  sharp: "E262",
} as const;

/** Written note shape → notehead glyph codepoint. */
export const SHAPE_GLYPH: Readonly<Record<string, string>> = Object.freeze({
  punctum: GLYPH.punctum,
  inclinatum: GLYPH.punctumInclinatum,
  virga: GLYPH.virga,
  virgaReversa: GLYPH.virgaReversa,
  quilisma: GLYPH.quilisma,
  oriscus: GLYPH.oriscusAsc,
  strophicus: GLYPH.strophicus,
  cavum: GLYPH.cavum,
  linea: GLYPH.linea,
});

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
