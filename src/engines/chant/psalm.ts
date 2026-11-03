// ---------------------------------------------------------------------------
// engines/chant/psalm — psalm and canticle retrieval as intoned Chant[]
// ---------------------------------------------------------------------------
import { PSALMS, type PsalmVerse } from "../../data/psalms.js";
import {
  OFFICE_PSALMS_MONASTIC,
  type OfficePsalmEntry,
  type OfficePsalmPortion,
} from "../../data/office-psalms-monastic.js";
import { intone } from "./intone.js";
import { TONES } from "../temper/data/tones.js";
import { MODI, type Chant, type PsalmusQuery } from "./types.js";
import { assertQueryShape } from "./query.js";

// Canticle numbers follow the generated psalms.json numbering (verified against
// the incipits: 231 "Benedíctus Dóminus", 232 "Magníficat", 233 "Nunc dimíttis",
// 210 "Benedícite, ómnia ópera"). The Te Deum is not psalmody — it carries its
// own melody, has no rows in the psalter data, and is not addressable here.
const CANTICLE_NAMES: Record<string, number> = {
  benedictus: 231,
  magnificat: 232,
  "nunc dimittis": 233,
  benedicite: 210,
};

// The two Gospel canticles take the intonation on EVERY verse; every other
// psalm and canticle on its first verse only [biblio: liber-usualis]. The
// Nunc dimittis, the third Gospel canticle, is sung like a psalm.
const INTONED_THROUGHOUT: ReadonlySet<number> = new Set([231, 232]);

/**
 * Which verses of a run take the intonation. `intonatio: false` silences it,
 * `true` asks for it on every verse, and the default is the rubric: the first
 * verse of the run, or every verse of the Benedictus and Magnificat.
 */
function intonedAt(psalm: number, index: number, asked: boolean | undefined): boolean {
  if (asked != null) return asked;
  return index === 0 || INTONED_THROUGHOUT.has(psalm);
}

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
    // Empty, and meaningfully so: a verse pointed to a tone at request time is
    // not a printing of any book on the shelf, which is exactly why no
    // `cantus({ source })` can ever return one.
    books: [],
    office: "ps",
    genus: "Psalmus",
    mode: String(mode),
    modus: mode === 0 ? "Tonus Peregrinus" : (MODI[String(mode)] ?? `Modus ${mode}`),
    // A verse pointed at request time has no Cantus entry of its own.
    cantusId: null,
    pages: [],
    source: {
      book: "Psalterium",
      // Deterministic: intoned psalmody is computed, not dated — the library's
      // determinism doctrine forbids a wall-clock stamp here.
      year: null,
      editor: "tonus",
    },
  };
}

const PSALMUS_QUERY_KEYS = new Set([
  "psalm", "verse", "mode", "differentia", "intonatio", "inDirectum", "solemn",
]);
// The keys that name WHAT to sing; the rest say how.
const PSALMUS_FILTER_KEYS = new Set(["psalm", "verse"]);

/**
 * The tone a query names, as a number — or a throw. A mode the tone table does
 * not carry is a malformed query: there is no psalm it failed to find. A
 * numeric string ("8") is read as its number, the spelling cantus accepts.
 */
function toneMode(mode: number | string | undefined): number {
  if (mode == null) return 8;
  const n = typeof mode === "string" && /^\d+$/.test(mode.trim()) ? Number(mode) : mode;
  if (typeof n !== "number" || !TONES.some((t) => t.mode === n)) {
    throw new Error(
      `psalmus: unknown mode ${JSON.stringify(mode)} (expected ${TONES.map((t) => t.mode).sort().join(", ")}; 0 is the tonus peregrinus).`,
    );
  }
  return n;
}

/** An unknown differentia throws, naming the codes the tone does carry. */
function assertDifferentia(mode: number, code: string | undefined): void {
  if (code == null) return;
  const tone = TONES.find((t) => t.mode === mode)!;
  if (!tone.differentiae.some((d) => d.code === code)) {
    throw new Error(
      `psalmus: tone ${mode} has no differentia "${code}" ` +
      `(expected ${tone.differentiae.map((d) => d.code).join(", ")}).`,
    );
  }
}

/**
 * Psalm and canticle retrieval (`tonus.psalmus`) from the Psalterium,
 * intoned to the psalm tones (modes 1-8 plus tonus peregrinus) as GABC.
 */
export function getPsalm(query?: PsalmusQuery): Chant[] {
  assertQueryShape(query, PSALMUS_QUERY_KEYS, PSALMUS_FILTER_KEYS, "psalmus");
  const mode = toneMode(query.mode);
  assertDifferentia(mode, query.differentia);

  const verses = lookupVerses(query.psalm ?? 0, query.verse);
  if (!verses.length) return [];

  return verses.map((v, i) =>
    verseToChant(
      v, mode, query.differentia,
      intonedAt(v.psalm, i, query.intonatio),
      query.inDirectum, query.solemn,
    ),
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
    .map((v, i) => verseToChant(v, mode, undefined, intonedAt(psalm, i, undefined)));
}

/** A psalm portion — whole psalm or an inclusive verse range — intoned. */
export function intonePortion(p: OfficePsalmPortion, mode = 8): Chant[] {
  return p.from != null && p.to != null
    ? getPsalmRange(p.psalm, p.from, p.to, mode)
    : getPsalm({ psalm: p.psalm, mode });
}

/**
 * The little-hours psalmody for one hour on a given weekday (0 = Sunday), from
 * the extracted DO monastic scheme (`office-psalms-monastic.ts`). Prefers the
 * weekday-specific entry, then the ferial default (weekday null), then the
 * feast set; returns the psalm portions (not yet intoned).
 */
export function officePsalmPortions(
  hour: OfficePsalmEntry["hour"], weekday: number,
): OfficePsalmPortion[] {
  const scheme = OFFICE_PSALMS_MONASTIC;
  const forHour = scheme.filter((e) => e.hour === hour);
  const exact = forHour.find((e) => e.weekday === weekday && !e.festis);
  const ferial = forHour.find((e) => e.weekday === null && !e.festis);
  const festis = forHour.find((e) => e.festis);
  return (exact ?? ferial ?? festis)?.psalms ?? [];
}
