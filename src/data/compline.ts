// data/compline — the Ordo of Compline (completorium)
//
// Compline in the traditional Roman rite is nearly invariable: the same spine
// every night, varying only by liturgical season (the hymn Te lucis and the
// short responsory In manus tuas) and by the seasonal Marian antiphon at the
// end. This is an editorial ordo — it references chants already in the corpus
// by their gregobase: id, it does not carry any GABC of its own (cf. masses.ts,
// which is likewise a hand-authored profile table, not corpus-extracted).
//
// Ordo structure after the traditional Roman Compline; seasonal assignment and
// the Marian rotation follow standard practice, cross-checked against
// bbloomf/compline (public domain). See docs/chant.md and BIBLIOGRAPHY.md.

import type { Season } from "../engines/cal/types.js";

/** The four fixed psalms of Compline (Vulgate numbering). */
export const COMPLINE_PSALMS: readonly number[] = [4, 30, 90, 133];

/** The invariable spine — chants sung the same every night. */
export const COMPLINE_ORDINARY = {
  /** Deus in adjutorium — the opening versicle. */
  opening: "gregobase:501",
  /** Nunc dimittis — the gospel canticle. */
  canticle: "gregobase:1346",
} as const;

/**
 * Season → the seasonal Te lucis ante terminum (hymn) and In manus tuas
 * (short responsory) chant ids. Feast-specific tones (Ascension, Sacred Heart,
 * BVM octaves, …) are refinements deferred to a later pass; this maps the seven
 * calendar seasons to their plain seasonal setting.
 */
export const COMPLINE_SEASONAL: Readonly<
  Record<Season, { teLucis: string; inManusTuas: string }>
> = Object.freeze({
  adv:   { teLucis: "gregobase:12752", inManusTuas: "gregobase:12702" }, // Advent
  nat:   { teLucis: "gregobase:12379", inManusTuas: "gregobase:13059" }, // Christmastide
  epi:   { teLucis: "gregobase:12897", inManusTuas: "gregobase:13059" }, // after Epiphany
  quadp: { teLucis: "gregobase:12379", inManusTuas: "gregobase:13059" }, // Septuagesima
  quad:  { teLucis: "gregobase:12673", inManusTuas: "gregobase:13059" }, // Lent
  pasc:  { teLucis: "gregobase:12092", inManusTuas: "gregobase:12649" }, // Paschaltide
  pent:  { teLucis: "gregobase:12379", inManusTuas: "gregobase:13059" }, // after Pentecost
});

/** The four seasonal Marian antiphons (simple tone). */
export const MARIAN_ANTIPHONS = {
  alma: "gregobase:1851",   // Alma Redemptoris Mater — Advent to Candlemas
  ave: "gregobase:2153",    // Ave Regina caelorum — Candlemas to Holy Week
  reginaCaeli: "gregobase:2290", // Regina caeli — Eastertide
  salve: "gregobase:2435",  // Salve Regina — Trinity to Advent
} as const;

/**
 * The seasonal Marian antiphon, chosen by the traditional four-way rotation.
 * The boundaries do not align with the calendar seasons — the Alma → Ave switch
 * falls on Candlemas (2 February), mid-season — so this uses the feast's season
 * for the broad divisions and its date for the Candlemas cut.
 *
 *   Advent 1 → 1 Feb        Alma Redemptoris Mater
 *   2 Feb → Holy Wednesday  Ave Regina caelorum
 *   Eastertide              Regina caeli
 *   Pentecost → Advent      Salve Regina
 */
export function marianAntiphonFor(season: Season, date: Date): string {
  if (season === "pasc") return MARIAN_ANTIPHONS.reginaCaeli;
  if (season === "adv") return MARIAN_ANTIPHONS.alma;
  if (season === "pent") return MARIAN_ANTIPHONS.salve;
  // nat / epi / quadp / quad straddle Candlemas (2 February). Alma runs from
  // Advent through 1 February — so Christmastide and any date before Candlemas
  // (December or January) is still Alma; 2 February onward is Ave, on through
  // Holy Week (the tail of `quad`, before Paschaltide takes over).
  const month = date.getUTCMonth(); // 0 = Jan, 11 = Dec
  const beforeCandlemas = month === 11 || month === 0 ||
    (month === 1 && date.getUTCDate() < 2);
  return beforeCandlemas ? MARIAN_ANTIPHONS.alma : MARIAN_ANTIPHONS.ave;
}
