// ---------------------------------------------------------------------------
// engines/temper/data/tones — psalm tones (the Toni Communes)
// ---------------------------------------------------------------------------
// The eight psalm tones and the tonus peregrinus as the Liber Usualis prints
// them [biblio: liber-usualis, graduale-toni-communes]. Pitches are MIDI in
// the frame the modes use (C3 = 48, middle c = 60): D = 50, a = 57, c = 60,
// d = 62. Under the c4 clef the staff runs a (A2, 45) to m (F4, 65), so every
// tone fits it, tone II's C3 = c included.
//
// Each formula is the FLAT PITCH SEQUENCE of the cadence, low-level enough
// that `temperamentum.tonus()` can tune it note by note: a neume on one
// syllable (tone I's accented g-a) appears as its two notes in order. The
// pointing (which syllable takes which note, the accents, the added notes for
// a dactyl) is not carried here.
//
// PROVENANCE, by field. The tenors are the modes' (MODES[n].tenor, placed in
// the mode's range). Where the shipped corpus prints a pointed verse, the
// formula is read off it:
//   - tones I, II, VII, VIII (intonation, mediant, flex) and IV A* from the LU
//     psalms in the corpus: Dixit Dominus 1g and 1f (gregobase:8130, 18175,
//     LU p. 128), Confitebor 2D (8131, p. 134), Beatus vir 7a (8132, p. 146),
//     Credidi 8c (8133, p. 165), De profundis 4A* (8134, p. 178), and the
//     Magnificat 8 G, G*, c (8149, p. 212);
//   - every termination from the Euouae of the LU antiphons (an office "an",
//     lu.ts), its differentia code confirmed by the Nocturnale's labelled
//     antiphons [biblio: nocturnale-romanum], which print the same melodies
//     under the same codes (lowercase there: "1d", "2d", "8g").
// Tones III, IV E, V and VI have no pointed verse in the corpus. Their
// intonations and mediants are the LU table's, transcribed without a
// cross-check here; tone IV's mediant is IV A*'s attested one a fourth lower.
//
// The flex drops a whole tone from the tenor, or a minor third where a
// semitone lies below it (c → a, F → D), as the corpus's flexes do.
//
// The differentia code names the termination's LAST NOTE: 1g ends on g, 8c on
// c. A capital is the LU's spelling of an ending on the mode's final (1D, 2D,
// 4E, 6F, 8G) or on the final of the transposed fourth mode (4A); a digit
// marks a variant on the same note, and a `*` one that closes on it and then
// rises a step (8G* g a, 4A* a b). ../../../../tests/tones.test.mjs holds every code
// to its last note.

export interface Differentia {
  code: string;
  termination: number[];
  // An ending that brings its own psalm-tone body. Tone IV's A endings are
  // sung on the transposed tone (tenor d, not a), with their own intonation,
  // flex and mediant; when a field is present it replaces the tone's.
  tenor?: number;
  intonation?: number[];
  flex?: number[];
  mediant?: number[];
}

export interface PsalmTone {
  mode: number; // 1–8; 0 = Tonus Peregrinus
  nomen: string;
  tenor: number;
  /** The tonus peregrinus' second-half reciting note (g); absent elsewhere. */
  secondTenor?: number;
  intonation: number[];
  flex: number[]; // the tenor, then the note the flex drops to
  mediant: number[];
  /** Not transcribed: no tone carries one yet, so a solemn request has nothing to read. */
  solemnMediant?: number[];
  defaultDiff: string;
  differentiae: Differentia[];
}

// Pitch names in the gamut's own letters (C3 = 48).
const C = 48, D = 50, E = 52, F = 53, G = 55, a = 57, bb = 58, b = 59, c = 60, d = 62, e = 64, f = 65;

export const TONES: PsalmTone[] = [
  {
    mode: 1,
    nomen: "Tonus I",
    tenor: a,
    intonation: [F, G, a],          // f g-a (Di-xit)
    flex: [a, G],
    mediant: [bb, a, G, a],         // b♭ a | g a: two accents
    defaultDiff: "1g",
    differentiae: [
      { code: "1D",  termination: [G, F, G, a, G, F, E, D] },
      { code: "1D2", termination: [G, F, G, F, D] },
      { code: "1f",  termination: [G, F, G, a, G, F] },
      { code: "1g",  termination: [G, F, G, a, G] },
      { code: "1g2", termination: [G, F, G, G, a, G] },
      { code: "1a",  termination: [G, F, G, a] },
      { code: "1a2", termination: [G, F, G, G, a] },
      { code: "1a3", termination: [G, F, G, a, G, a] },
    ],
  },

  {
    mode: 2,
    nomen: "Tonus II",
    tenor: F,
    intonation: [C, D, F],
    flex: [F, D],
    mediant: [G, F],                // one accent
    defaultDiff: "2D",
    differentiae: [
      { code: "2D",  termination: [E, C, D] },
    ],
  },

  {
    mode: 3,
    nomen: "Tonus III",
    tenor: c,
    intonation: [G, a, c],          // g a-c
    flex: [c, a],
    mediant: [d, c],
    defaultDiff: "3a",
    differentiae: [
      { code: "3a",  termination: [a, c, b, a] },
      { code: "3a2", termination: [c, b, a, b, a, G, a] },
      { code: "3b",  termination: [a, c, b] },
      { code: "3g",  termination: [c, b, a, b, a, G] },
    ],
  },

  {
    mode: 4,
    nomen: "Tonus IV",
    tenor: a,
    intonation: [a, G, a],          // a g-a
    flex: [a, G],
    mediant: [G, a, b, a],          // two preparatory notes, accent b
    defaultDiff: "4E",
    differentiae: [
      { code: "4E",  termination: [G, a, b, a, G, F, E] },
      { code: "4g",  termination: [a, G] },
      // The transposed fourth tone, a fourth higher: tenor d, ending on a.
      { code: "4A",  termination: [c, d, e, c, a],
        tenor: d, intonation: [d, c, d], flex: [d, c], mediant: [c, d, e, d] },
      { code: "4A*", termination: [c, d, e, c, a, b],
        tenor: d, intonation: [d, c, d], flex: [d, c], mediant: [c, d, e, d] },
    ],
  },

  {
    mode: 5,
    nomen: "Tonus V",
    tenor: c,
    intonation: [F, a, c],
    flex: [c, a],
    mediant: [d, c],
    defaultDiff: "5a",
    differentiae: [
      { code: "5a",  termination: [d, b, c, a] },     // two accents: d b | c a
    ],
  },

  {
    mode: 6,
    nomen: "Tonus VI",
    tenor: a,
    intonation: [F, G, a],          // f g-a
    flex: [a, G],
    mediant: [G, a, a],             // preparatory g, accent a
    defaultDiff: "6F",
    differentiae: [
      { code: "6F",  termination: [F, G, a, G, F] },
    ],
  },

  {
    mode: 7,
    nomen: "Tonus VII",
    tenor: d,
    intonation: [c, b, c, d],       // c-b c-d
    flex: [d, c],
    mediant: [f, e, d, e],          // f e | d e: two accents
    defaultDiff: "7a",
    differentiae: [
      { code: "7a",  termination: [e, d, c, b, a] },
      { code: "7b",  termination: [e, d, c, b] },
      { code: "7c",  termination: [e, d, c, b, c] },
      { code: "7c2", termination: [e, d, c, d, c] },
      { code: "7d",  termination: [e, d, c, b, d] },
    ],
  },

  {
    mode: 8,
    nomen: "Tonus VIII",
    tenor: c,
    intonation: [G, a, c],
    flex: [c, a],
    mediant: [d, c],                // one accent
    defaultDiff: "8G",
    differentiae: [
      { code: "8G",  termination: [b, c, a, G] },
      { code: "8G*", termination: [b, c, a, G, a] },
      { code: "8c",  termination: [a, c, d, c] },
    ],
  },

  // ── Tonus Peregrinus ── two reciting notes: a in the first half, g in the
  // second (the Euouae of "Nos qui vivimus", am gregobase:10440 and LU, recites
  // on g and closes on D). Its intonation and mediant are not in the corpus and
  // are not transcribed here: both are empty, so the first half recites on a.
  {
    mode: 0,
    nomen: "Tonus Peregrinus",
    tenor: a,
    secondTenor: G,
    intonation: [],
    flex: [a, G],
    mediant: [],
    defaultDiff: "per",
    differentiae: [
      { code: "per", termination: [D, F, E, D] },
    ],
  },
];

/** Look up a PsalmTone by mode number (1–8, or 0 for Peregrinus) */
export function getTone(mode: number): PsalmTone {
  const tone = TONES.find(t => t.mode === mode);
  // A bad mode throws rather than silently singing Tonus VIII: a
  // plausible-looking wrong psalm tone is worse than no answer, and getMode
  // (temper/modes.ts) already holds this line for the modes themselves.
  if (!tone) {
    throw new Error(`getTone: no psalm tone for mode ${mode} (expected 1–8, or 0 for the tonus peregrinus).`);
  }
  return tone;
}

/**
 * A differentia by code, or the tone's default when no code is given. The
 * match ignores case ("4e" is 4E; the Nocturnale writes every code in
 * lowercase), and no two codes of a tone differ by case alone. An unknown code
 * throws with the tone's codes: falling back to the default would sing a
 * plausible ending the caller did not ask for.
 */
export function getDifferentia(tone: PsalmTone, code?: string): Differentia {
  if (code == null) {
    return tone.differentiae.find(d => d.code === tone.defaultDiff) ?? tone.differentiae[0]!;
  }
  const want = code.trim().toLowerCase();
  const d = tone.differentiae.find(d => d.code.toLowerCase() === want);
  if (!d) {
    throw new RangeError(
      `Unknown differentia "${code}" for ${tone.nomen}. ` +
        `Valid: ${tone.differentiae.map(d => d.code).join(", ")}.`,
    );
  }
  return d;
}
