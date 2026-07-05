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

// Prime's psalmody varies by weekday, per DO's Tridentine Psalterium (the
// traditional pre-1911 Roman scheme). Every day opens with Ps 53, then a
// day-proper psalm (117 on Sunday; the 21–25 rotation on ferias; none on
// Saturday and feasts), then the first two sections of Ps 118 — vv. 1–16 and
// 17–32, not the whole 176-verse psalm.
//
// A "psalm portion" is a psalm with an optional inclusive verse range.
export interface PsalmPortion {
  psalm: number;
  from?: number;
  to?: number;
}

const P118_1 = { psalm: 118, from: 1, to: 16 };
const P118_2 = { psalm: 118, from: 17, to: 32 };

/**
 * Weekday (0 = Sunday … 6 = Saturday) → the Prime psalm portions, after the
 * DO Tridentine scheme. `festis` is the set used on feasts, regardless of day.
 */
export const PRIME_PSALMS_BY_WEEKDAY: Readonly<Record<number, PsalmPortion[]>> =
  Object.freeze({
    0: [{ psalm: 53 }, { psalm: 117 }, P118_1, P118_2], // Dominica
    1: [{ psalm: 53 }, { psalm: 23 }, P118_1, P118_2],  // Feria II
    2: [{ psalm: 53 }, { psalm: 24 }, P118_1, P118_2],  // Feria III
    3: [{ psalm: 53 }, { psalm: 25 }, P118_1, P118_2],  // Feria IV
    4: [{ psalm: 53 }, { psalm: 22 }, P118_1, P118_2],  // Feria V
    5: [{ psalm: 53 }, { psalm: 21 }, P118_1, P118_2],  // Feria VI
    6: [{ psalm: 53 }, P118_1, P118_2],                 // Sabbato
  });

/** On feasts, Prime uses the Sunday-like set without the ferial day-psalm. */
export const PRIME_PSALMS_FESTIS: readonly PsalmPortion[] = [
  { psalm: 53 }, P118_1, P118_2,
];

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
