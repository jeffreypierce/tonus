// ---------------------------------------------------------------------------
// engines/harmonia/data/zodiac — what the twelve signs MEAN
// ---------------------------------------------------------------------------
//
// `caelum` answers WHERE: a body's ecliptic longitude becomes `zodiac` (the
// index), `sign` and `signum`. This table answers WHAT IT MEANS — the doctrine
// a medieval reader brought to that position.
//
// DELIBERATELY NO DATES. When the Sun enters a sign is the ephemeris's
// business and changes with precession; a table that carried "March 21" would
// be wrong for most of the period this library models, and wrong differently
// every century. The index is the join, and `caelum` computes it.
//
// The join: `SIGNS[i]`, `SIGNA[i]` (engines/planet/planet.ts) and `ZODIACA[i]`
// are one list three ways, so `ZODIACA[body.zodiac]` is always that body's
// doctrine. The two name arrays live with the ephemeris because drawing the
// wheel needs them without any of this; the meanings live here because nothing
// in computing a position depends on them.
//
// Sources, per field:
//   domicile    Ptolemy, Tetrabiblos I.17 [biblio: ptolemy-tetrabiblos],
//               transmitted whole through the medieval Latin tradition and
//               uncontested across sources.
//   exaltation  Tetrabiblos I.19 and the standard medieval list, THE SEVEN
//               PLANETS ONLY. The lunar nodes' exaltations (Caput Draconis in
//               Gemini, Cauda in Sagittarius) are omitted because the nodes are
//               not tonus bodies. The exaltation DEGREES (Sun at 19° Arietis
//               and the rest) are omitted as more precision than any consumer
//               here reads — five signs simply have no exaltation, and that
//               absence is the tradition's, not an omission.
//   element,    the Ptolemaic triplicities and quadruplicities. The Latin
//   quality     quality terms are the scholastic mobile/fixum/commune, where
//               Ptolemy writes tropic/solid/bicorporeal.
//   humor       the Galenic element→humor square — fire/cholera, earth/
//               melancholia, air/sanguis, water/phlegma — ubiquitous in
//               medieval medicine.
//   melothesia  the homo signorum of medieval calendars and medical
//               manuscripts, Aries at the head down to Pisces at the feet (the
//               Très Riches Heures anatomical man is the familiar picture).
//               Practice, not decoration: phlebotomy was timed against it.
//
// Where the tradition wobbles, the entry says so in `variant` rather than
// picking a winner quietly. Uncertainty is data.

import type { BodyName } from "../../planet/types.js";

/** The four Aristotelian elements, as the triplicities assign them. */
export type Element = "fire" | "earth" | "air" | "water";

/** Ptolemy's quadruplicities, in the scholastic naming. */
export type Quality = "cardinal" | "fixed" | "mutable";

/** The Galenic humor the sign's element carries. */
export type Humor = "cholera" | "melancholia" | "sanguis" | "phlegma";

/** The part of the body a sign governs, in the zodiac man. */
export interface Melothesia {
  /** The member as the manuscripts name it: caput, collum, pectus… */
  latin: string;
  /** What that covers, in English — several signs govern more than one part. */
  english: string;
}

/** A sign's doctrine. English keys carry machine codes; the Latin fields carry
 *  the authentic terms a reader meets on the page. */
export interface ZodiacSign {
  /** 0 = Aries … 11 = Pisces, matching `Body.zodiac`. */
  index: number;
  /** Matches `Body.sign` verbatim. */
  sign: string;
  /** Matches `Body.signum` verbatim — Scorpius, Capricornus. */
  signum: string;
  /** The astronomical symbol, U+2648–U+2653. */
  symbol: string;
  element: Element;
  elementum: string;
  quality: Quality;
  qualitas: string;
  /** The sign's nature as the two Aristotelian pairs, in Latin. */
  nature: { heat: string; moisture: string };
  genus: "masculinum" | "femininum";
  humor: Humor;
  temperament: string;
  /** The planet that rules the sign. */
  domicile: BodyName;
  /** The planet exalted in it — null for the five that have none. */
  exaltation: BodyName | null;
  melothesia: Melothesia;
  /** Where the sources disagree, said plainly rather than resolved. */
  variant?: string;
}

export const ZODIACA: readonly ZodiacSign[] = [
  {
    index: 0, sign: "Aries", signum: "Aries", symbol: "♈",
    element: "fire", elementum: "ignis",
    quality: "cardinal", qualitas: "mobile",
    nature: { heat: "calidum", moisture: "siccum" },
    genus: "masculinum", humor: "cholera", temperament: "cholericum",
    domicile: "Mars", exaltation: "Sun",
    melothesia: { latin: "caput", english: "the head and face" },
  },
  {
    index: 1, sign: "Taurus", signum: "Taurus", symbol: "♉",
    element: "earth", elementum: "terra",
    quality: "fixed", qualitas: "fixum",
    nature: { heat: "frigidum", moisture: "siccum" },
    genus: "femininum", humor: "melancholia", temperament: "melancholicum",
    domicile: "Venus", exaltation: "Moon",
    melothesia: { latin: "collum", english: "the neck and throat" },
  },
  {
    index: 2, sign: "Gemini", signum: "Gemini", symbol: "♊",
    element: "air", elementum: "aer",
    quality: "mutable", qualitas: "commune",
    nature: { heat: "calidum", moisture: "humidum" },
    genus: "masculinum", humor: "sanguis", temperament: "sanguineum",
    domicile: "Mercury", exaltation: null,
    melothesia: { latin: "umeri", english: "the shoulders, arms and hands" },
  },
  {
    index: 3, sign: "Cancer", signum: "Cancer", symbol: "♋",
    element: "water", elementum: "aqua",
    quality: "cardinal", qualitas: "mobile",
    nature: { heat: "frigidum", moisture: "humidum" },
    genus: "femininum", humor: "phlegma", temperament: "phlegmaticum",
    domicile: "Moon", exaltation: "Jupiter",
    melothesia: { latin: "pectus", english: "the breast and chest" },
    variant: "the melothesia wobbles here more than anywhere: some manuscripts "
      + "extend Cancer to the lungs and stomach",
  },
  {
    index: 4, sign: "Leo", signum: "Leo", symbol: "♌",
    element: "fire", elementum: "ignis",
    quality: "fixed", qualitas: "fixum",
    nature: { heat: "calidum", moisture: "siccum" },
    genus: "masculinum", humor: "cholera", temperament: "cholericum",
    domicile: "Sun", exaltation: null,
    melothesia: { latin: "cor", english: "the heart, back and sides" },
  },
  {
    index: 5, sign: "Virgo", signum: "Virgo", symbol: "♍",
    element: "earth", elementum: "terra",
    quality: "mutable", qualitas: "commune",
    nature: { heat: "frigidum", moisture: "siccum" },
    genus: "femininum", humor: "melancholia", temperament: "melancholicum",
    domicile: "Mercury", exaltation: "Mercury",
    melothesia: { latin: "venter", english: "the belly and bowels" },
  },
  {
    index: 6, sign: "Libra", signum: "Libra", symbol: "♎",
    element: "air", elementum: "aer",
    quality: "cardinal", qualitas: "mobile",
    nature: { heat: "calidum", moisture: "humidum" },
    genus: "masculinum", humor: "sanguis", temperament: "sanguineum",
    domicile: "Venus", exaltation: "Saturn",
    melothesia: { latin: "renes", english: "the kidneys and loins" },
  },
  {
    index: 7, sign: "Scorpio", signum: "Scorpius", symbol: "♏",
    element: "water", elementum: "aqua",
    quality: "fixed", qualitas: "fixum",
    nature: { heat: "frigidum", moisture: "humidum" },
    genus: "femininum", humor: "phlegma", temperament: "phlegmaticum",
    domicile: "Mars", exaltation: null,
    melothesia: { latin: "genitalia", english: "the genitals" },
  },
  {
    index: 8, sign: "Sagittarius", signum: "Sagittarius", symbol: "♐",
    element: "fire", elementum: "ignis",
    quality: "mutable", qualitas: "commune",
    nature: { heat: "calidum", moisture: "siccum" },
    genus: "masculinum", humor: "cholera", temperament: "cholericum",
    domicile: "Jupiter", exaltation: null,
    melothesia: { latin: "femora", english: "the thighs" },
  },
  {
    index: 9, sign: "Capricorn", signum: "Capricornus", symbol: "♑",
    element: "earth", elementum: "terra",
    quality: "cardinal", qualitas: "mobile",
    nature: { heat: "frigidum", moisture: "siccum" },
    genus: "femininum", humor: "melancholia", temperament: "melancholicum",
    domicile: "Saturn", exaltation: "Mars",
    melothesia: { latin: "genua", english: "the knees" },
  },
  {
    index: 10, sign: "Aquarius", signum: "Aquarius", symbol: "♒",
    element: "air", elementum: "aer",
    quality: "fixed", qualitas: "fixum",
    nature: { heat: "calidum", moisture: "humidum" },
    genus: "masculinum", humor: "sanguis", temperament: "sanguineum",
    domicile: "Saturn", exaltation: null,
    melothesia: { latin: "crura", english: "the shins and ankles" },
  },
  {
    index: 11, sign: "Pisces", signum: "Pisces", symbol: "♓",
    element: "water", elementum: "aqua",
    quality: "mutable", qualitas: "commune",
    nature: { heat: "frigidum", moisture: "humidum" },
    genus: "femininum", humor: "phlegma", temperament: "phlegmaticum",
    domicile: "Jupiter", exaltation: "Venus",
    melothesia: { latin: "pedes", english: "the feet" },
  },
];

// THE LUNAR PROHIBITION, recorded here rather than exported: while the Moon
// stands in a sign, that sign's member is not to be touched. It is the reason
// the zodiac man is in a physician's calendar at all — it was "dangerous, if
// not fatal, to treat that member if the Moon was in the sign at the time" —
// and it is one line of doctrine that any consumer can state for itself from
// `ZODIACA[moon.zodiac].melothesia`. A constant holding a sentence of English
// would be prose pretending to be data.
