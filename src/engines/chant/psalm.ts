// ---------------------------------------------------------------------------
// engines/chant/psalm — psalm and canticle retrieval as intoned Chant[]
// ---------------------------------------------------------------------------
import { PSALMS, type PsalmVerse } from "../../data/psalms.js";
import { intone } from "./intone.js";
import type { Chant, PsalmusQuery } from "./types.js";

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
): Chant {
  const gabc = intone(v, { mode, differentia, intonation });
  return {
    id: `psalm:${v.psalm}:${v.verse}`,
    incipit: v.half1.slice(0, 40),
    gabc,
    office: "ps",
    officeLabel: "Psalmus",
    mode: String(mode),
    modeLabel: `Mode ${mode === 0 ? "P" : mode}`,
    pages: [],
    source: {
      book: "Psalterium",
      year: new Date().getUTCFullYear(),
      editor: "tonus",
    },
  };
}

export function getPsalm(query?: PsalmusQuery): Chant[] {
  if (!query || Object.keys(query).length === 0) return [];

  const verses = lookupVerses(query.psalm ?? 0, query.verse);
  if (!verses.length) return [];

  const mode = query.mode ?? 8;
  return verses.map((v) =>
    verseToChant(v, mode, query.differentia, query.intonation),
  );
}
