// ---------------------------------------------------------------------------
// engines/chant/psalm — psalm and canticle retrieval as intoned Chant[]
// ---------------------------------------------------------------------------
import { PSALMS, type PsalmVerse } from "../../data/psalms.js";
import {
  OFFICE_PSALMS,
  type OfficePsalmEntry,
  type OfficePsalmPortion,
} from "../../data/office-psalms.js";
import { OFFICE_PSALMS_MONASTIC } from "../../data/office-psalms-monastic.js";
import { intone } from "./intone.js";
import { MODE_LABELS, type Chant, type PsalmusQuery, type Rite } from "./types.js";

const CANTICLE_NAMES: Record<string, number> = {
  benedictus: 231,
  magnificat: 234,
  "nunc dimittis": 227,
  "te deum": 240,
  benedicite: 210,
};

function lookupVerses(psalm: number | string, verse?: string): PsalmVerse[] {
  if (typeof psalm === "string") {
    const named = CANTICLE_NAMES[psalm.toLowerCase()];
    if (named) return lookupVerses(named, verse);
    const n = parseInt(psalm);
    if (!isNaN(n)) return lookupVerses(n, verse);
    return [];
  }

  let results = PSALMS.filter((v) => v.psalm === psalm);
  if (verse) results = results.filter((v) => v.verse === verse);
  return results;
}

function verseToChant(
  v: PsalmVerse,
  mode: number,
  differentia?: string,
  intonation?: boolean,
  inDirectum?: boolean,
  solemn?: boolean,
): Chant {
  const gabc = intone(v, { mode, differentia, intonation, inDirectum, solemn });
  return {
    id: `psalm:${v.psalm}:${v.verse}`,
    incipit: v.half1.slice(0, 40),
    gabc,
    office: "ps",
    genus: "Psalmus",
    mode: String(mode),
    modus: mode === 0 ? "Tonus Peregrinus" : (MODE_LABELS[String(mode)] ?? `Modus ${mode}`),
    pages: [],
    source: {
      book: "Psalterium",
      year: new Date().getUTCFullYear(),
      editor: "tonus",
    },
  };
}

/**
 * Psalm and canticle retrieval (`tonus.psalmus`) from the Psalterium,
 * intoned to the psalm tones (modes 1-8 plus tonus peregrinus) as GABC.
 */
export function getPsalm(query?: PsalmusQuery): Chant[] {
  if (!query || Object.keys(query).length === 0) return [];

  const verses = lookupVerses(query.psalm ?? 0, query.verse);
  if (!verses.length) return [];

  const mode = query.mode ?? 8;
  return verses.map((v) =>
    verseToChant(v, mode, query.differentia, query.intonatio, query.inDirectum, query.solemn),
  );
}

/**
 * A contiguous verse range of one psalm, intoned — e.g. `getPsalmRange(30, 2, 6)`
 * for Ps 30, verses 2–6. Used by the fixed office ordos (Prime, Compline), whose
 * psalmody takes only a portion of a psalm (Ps 30:2-6; Ps 118 in sections).
 * `lo`/`hi` are inclusive verse numbers; split verses (3a/3b) are both included.
 */
export function getPsalmRange(
  psalm: number, lo: number, hi: number, mode = 8,
): Chant[] {
  return PSALMS
    .filter((v) => {
      if (v.psalm !== psalm) return false;
      const n = parseInt(v.verse, 10);
      return !isNaN(n) && n >= lo && n <= hi;
    })
    .map((v) => verseToChant(v, mode));
}

/** A psalm portion — whole psalm or an inclusive verse range — intoned. */
export function intonePortion(p: OfficePsalmPortion, mode = 8): Chant[] {
  return p.from != null && p.to != null
    ? getPsalmRange(p.psalm, p.from, p.to, mode)
    : getPsalm({ psalm: p.psalm, mode });
}

/**
 * The little-hours psalmody for one hour on a given weekday (0 = Sunday), from
 * the extracted DO Tridentine scheme (`office-psalms.ts`). Prefers the
 * weekday-specific entry, then the ferial default (weekday null), then the
 * feast set; returns the psalm portions (not yet intoned).
 */
export function officePsalmPortions(
  hour: OfficePsalmEntry["hour"], weekday: number, rite: Rite = "romanum",
): OfficePsalmPortion[] {
  const scheme = rite === "monasticum" ? OFFICE_PSALMS_MONASTIC : OFFICE_PSALMS;
  const forHour = scheme.filter((e) => e.hour === hour);
  const exact = forHour.find((e) => e.weekday === weekday && !e.festis);
  const ferial = forHour.find((e) => e.weekday === null && !e.festis);
  const festis = forHour.find((e) => e.festis);
  return (exact ?? ferial ?? festis)?.psalms ?? [];
}
