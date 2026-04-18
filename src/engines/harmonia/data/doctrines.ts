// ---------------------------------------------------------------------------
// engines/harmonia/data/doctrines — planetary harmonic systems
// ---------------------------------------------------------------------------
//
// Each doctrina defines a mapping from celestial bodies to Pythagorean ratios
// relative to the mese (structural center, the Sun). All ratios are expressed
// as [numerator, denominator] pairs.
//
// All v1 doctrinae are geocentric — Earth is the silent listener at the
// center, not a voiced body (except Pliny, where Earth is a boundary tone).
// The Sun holds the mese position in all four systems.
//
// Source: Joscelyn Godwin, "Harmonies of Heaven and Earth" (1987), Part Three;
//
// Taxonomy follows Godwin's classification:
//   Type A — intervals represent distances between spheres
//   Type B — intervals represent speeds/symbolic scale degrees
//   Type C — intervals map to fixed tones of the Greater Perfect System
// ---------------------------------------------------------------------------

export type Author = "pythagoras" | "boethius" | "pliny" | "ptolemy";

export interface Voice {
  body: string; // "Saturn", "Moon", etc.
  ratio: [number, number]; // [num, den] relative to mese; <1 = below, >1 = above
  greekName: string; // position in the Greek tonal system
}

export interface Doctrina {
  name: string; // full name
  work: string; // primary source text
  date: string; // approximate date of the source
  type: "A" | "B" | "C"; // Godwin's taxonomy
  span: number; // total range in cents
  voices: Voice[]; // sphere order, outermost first
}

// ── Pythagoras ──
//
// Disjunct diatonic tetrachords spanning one octave. Attributed to the
// Pythagorean school via Plato (Republic X, Myth of Er) and later writers.
// Eight tones: seven planets plus the Fixed Stars.
//
// Structure (ascending from Saturn):
//   [S, T, T] — tetrachord meson
//   T          — tone of disjunction
//   [S, T, T] — tetrachord diezeugmenon
//
// The critical difference from Boethius: Venus sits on B natural (paramese),
// a whole tone above the mese, producing the disjunct system. This is
// B durum — "hard B" — the brighter, more open voicing.

const PYTHAGORAS: Doctrina = {
  name: "Pythagoras of Samos",
  work: "attributed via Plato, Republic X; Nicomachus, Manual of Harmonics",
  date: "c. 530 BC / c. 100 AD",
  type: "B",
  span: 1200,
  voices: [
    { body: "FixedStars", ratio: [3, 2], greekName: "nete diezeugmenon" },
    { body: "Saturn", ratio: [3, 4], greekName: "hypate meson" },
    { body: "Jupiter", ratio: [64, 81], greekName: "parhypate meson" },
    { body: "Mars", ratio: [8, 9], greekName: "lichanos meson" },
    { body: "Sun", ratio: [1, 1], greekName: "mese" },
    { body: "Venus", ratio: [9, 8], greekName: "paramese" },
    { body: "Mercury", ratio: [32, 27], greekName: "trite diezeugmenon" },
    { body: "Moon", ratio: [4, 3], greekName: "paranete diezeugmenon" },
  ],
};

// ── Boethius ──
//
// Conjunct diatonic tetrachords spanning a seventh. Transmitted by Boethius
// (De Institutione Musica I.27) from Nicomachus of Gerasa. The medieval
// default — the system that defined musica mundana for a millennium.
//
// Structure (ascending from Saturn):
//   [S, T, T] — tetrachord meson
//   [S, T, T] — tetrachord synemmenon (conjunct at mese)
//
// Venus sits on Bb (trite synemmenon), a semitone above the mese.
// This is B molle — "soft B" — the darker, more introspective voicing.
// The conjunct tetrachords share the mese; no tone of disjunction.
//
// Seven planets only — Earth is silent (no motion, no sound).

const BOETHIUS: Doctrina = {
  name: "Anicius Manlius Severinus Boethius",
  work: "De Institutione Musica",
  date: "c. 524",
  type: "B",
  span: 996,
  voices: [
    { body: "Saturn", ratio: [3, 4], greekName: "hypate meson" },
    { body: "Jupiter", ratio: [64, 81], greekName: "parhypate meson" },
    { body: "Mars", ratio: [8, 9], greekName: "lichanos meson" },
    { body: "Sun", ratio: [1, 1], greekName: "mese" },
    { body: "Venus", ratio: [256, 243], greekName: "trite synemmenon" },
    { body: "Mercury", ratio: [32, 27], greekName: "paranete synemmenon" },
    { body: "Moon", ratio: [4, 3], greekName: "nete synemmenon" },
  ],
};

// ── Pliny ──
//
// Chromatic Dorian, Type A (distance-based). From Pliny the Elder,
// Naturalis Historia II.xx. The only chromatic-genus system in v1.
//
// Structure (ascending from Earth):
//   T — proslambanomenos to first tetrachord
//   [S, S, incomposite] — chromatic tetrachord hypaton
//   [S, S, incomposite] — chromatic tetrachord meson (conjunct)
//
// The incomposite interval (19683/16384, ~318 cents) completes each
// chromatic tetrachord to a perfect fourth. Uses the corrected form
// from Censorinus / Theon of Smyrna for proper octave closure.
//
// Earth acts as a boundary tone (proslambanomenos), not a planetary voice.
// The chromatic genus produces tight semitone clusters where Boethius has
// open fourths. The sound is darker, more tense, more exotic.

const PLINY: Doctrina = {
  name: "Gaius Plinius Secundus (Pliny the Elder)",
  work: "Naturalis Historia",
  date: "c. 77",
  type: "A",
  span: 1200,
  voices: [
    { body: "Saturn", ratio: [4, 3], greekName: "mese" },
    { body: "Jupiter", ratio: [65536, 59049], greekName: "lichanos meson" },
    { body: "Mars", ratio: [256, 243], greekName: "parhypate meson" },
    { body: "Sun", ratio: [1, 1], greekName: "hypate meson" },
    { body: "Venus", ratio: [16384, 19683], greekName: "lichanos hypaton" },
    { body: "Mercury", ratio: [64, 81], greekName: "parhypate hypaton" },
    { body: "Moon", ratio: [3, 4], greekName: "hypate hypaton" },
    { body: "Earth", ratio: [2, 3], greekName: "proslambanomenos" },
  ],
};

// ── Ptolemy ──
//
// Fixed tones of the Greater Perfect System, Type C. From the fragmentary
// final chapter of Ptolemy's Harmonics and the Canobus inscription.
//
// The widest span of any v1 doctrina: two full octaves. Unlike Types A
// and B, no single mode or genus is preferred — the fixed tones are the
// immovable skeleton upon which any mode can be built.
//
// The unique feature: intervals between planets carry astrological meaning.
//   Saturn to Sun = octave (P8)  → consonant = compatible influence
//   Jupiter to Sun = fifth (P5)  → consonant = compatible influence
//   Mars to Sun = tone (M2)      → dissonant = inimical influence
//   Venus to Sun = fourth (P4)   → consonant
//   Mercury to Sun = seventh     → dissonant

const PTOLEMY: Doctrina = {
  name: "Claudius Ptolemaeus (Ptolemy)",
  work: "Harmonics III; Canobus inscription",
  date: "c. 150",
  type: "C",
  span: 2400,
  voices: [
    { body: "Saturn", ratio: [2, 1], greekName: "nete hyperbolaion" },
    { body: "Jupiter", ratio: [3, 2], greekName: "nete diezeugmenon" },
    { body: "Mars", ratio: [9, 8], greekName: "paramese" },
    { body: "Sun", ratio: [1, 1], greekName: "mese" },
    { body: "Venus", ratio: [3, 4], greekName: "hypate meson" },
    { body: "Mercury", ratio: [9, 16], greekName: "hypate hypaton" },
    { body: "Moon", ratio: [1, 2], greekName: "proslambanomenos" },
  ],
};

// ── Export ──

export const DOCTRINAE = new Map<Author, Doctrina>([
  ["pythagoras", PYTHAGORAS],
  ["boethius", BOETHIUS],
  ["pliny", PLINY],
  ["ptolemy", PTOLEMY],
]);
