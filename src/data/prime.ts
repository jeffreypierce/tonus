// data/prime — the Ordo of Prime (prima)
//
// Prime, the "first hour," is like Compline mostly fixed and seasonal rather
// than per-feast. This ordo covers Prime's SUNG parts: the opening, the hymn
// Iam lucis orto sidere, the fixed psalmody, and the seasonal short responsory
// Christe Fili Dei vivi. Prime's recited/monotoned parts — the Athanasian Creed
// (Quicumque vult), the martyrology, the chapter, and the collect — are not
// Solesmes chant and are not in the corpus, so they are out of scope; this is a
// chant ordo, not a full Breviary Prime.
//
// Like data/compline.ts and data/masses.ts this is a hand-authored table that
// references chants already in the corpus by id; it carries no GABC of its own.
// See docs/chant.md and BIBLIOGRAPHY.md.

import type { Season } from "../engines/cal/types.js";

// Prime's psalmody (Ps 53 + a weekday-proper psalm + Ps 118 in two sections,
// varying by weekday per DO's Tridentine scheme) is not hand-listed here — it
// comes from the extracted scheme via `officePsalmPortions("Prima", weekday)`.
// Only the ordo structure and the seasonal responsory rule are editorial.

/** The invariable spine. */
export const PRIME_ORDINARY = {
  /** Deus in adjutorium — the opening versicle. */
  opening: "gregobase:501",
  /**
   * Iam lucis orto sidere — Prime's hymn. Its variants are keyed by feast rank
   * (ferial / Sunday / major feast) rather than by season; the ferial-and-
   * simple-feast tone is the everyday default.
   */
  hymn: "gregobase:11944",
} as const;

/**
 * Season → the seasonal short responsory Christe Fili Dei vivi. Only Advent and
 * Paschaltide have their own setting; the rest of the year uses "per Annum."
 */
export const PRIME_SEASONAL: Readonly<Record<Season, { responsory: string }>> =
  Object.freeze({
    adv:   { responsory: "gregobase:13127" }, // Tempore Adventus
    nat:   { responsory: "gregobase:11818" }, // per Annum
    epi:   { responsory: "gregobase:11818" },
    quadp: { responsory: "gregobase:11818" },
    quad:  { responsory: "gregobase:11818" },
    pasc:  { responsory: "gregobase:12439" }, // Tempore Paschali
    pent:  { responsory: "gregobase:11818" },
  });
