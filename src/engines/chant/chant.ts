// ---------------------------------------------------------------------------
// engines/chant/chant — corpus query
// ---------------------------------------------------------------------------
import type {
  Chant, CantusQuery, OfficeCode, ChantSource, Corpus, GenusCount, ModeCount, SharedCount,
} from "./types.js";
import { OFFICE_LABELS, MODE_LABELS } from "./types.js";
import { CORPUS_OVERLAP } from "../../data/corpus-overlap.js";
import { GR_DATA, GR_SOURCE, type ChantData } from "../../data/gr.js";
import { LU_DATA, LU_SOURCE } from "../../data/lu.js";
import { LA_DATA, LA_SOURCE } from "../../data/la.js";
import { LH_DATA, LH_SOURCE } from "../../data/lh.js";
import { AM_DATA, AM_SOURCE } from "../../data/am.js";

function modusOf(mode: string | null): string | null {
  return mode != null ? (MODE_LABELS[mode] ?? null) : null;
}

const HEADER_FIELD_REGEX = /([A-Za-z0-9_-]+)\s*:\s*([^;]*);/g;

function chantFromGABC(query: CantusQuery): Chant[] {
  const raw = query.gabc ?? "";
  const markerIndex = raw.indexOf("%%");

  let body: string;
  let name: string | null = null;
  let headerMode: string | null = null;
  let officePart: string | null = null;

  if (markerIndex >= 0) {
    const headerBlock = raw.slice(0, markerIndex);
    body = raw.slice(markerIndex + 2).trim();

    HEADER_FIELD_REGEX.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = HEADER_FIELD_REGEX.exec(headerBlock)) !== null) {
      const key = match[1].trim().toLowerCase();
      const value = match[2].trim();
      if (key === "name") name = value;
      else if (key === "mode") headerMode = value;
      else if (key === "office-part") officePart = value;
    }
  } else {
    body = raw.trim();
  }

  const incipit = query.incipit ?? name ?? "";
  const mode = query.mode != null ? String(query.mode) : headerMode;
  const office = (
    query.office
      ? (Array.isArray(query.office) ? query.office[0] : query.office)
      : (officePart as OfficeCode | null) ?? "or"
  ) as OfficeCode;

  return [{
    id: `gabc:${incipit.toLowerCase().replace(/\s+/g, "_") || "untitled"}`,
    incipit,
    gabc: body,
    office,
    genus: OFFICE_LABELS[office] ?? office,
    mode: mode ?? null,
    modus: modusOf(mode ?? null),
    pages: [],
    source: { book: "User", year: null, editor: null, code: "user" },
  }];
}

function withLabels(c: ChantData, source: Chant["source"]): Chant {
  return {
    ...c,
    source,
    genus: OFFICE_LABELS[c.office as OfficeCode] ?? c.office,
    modus: modusOf(c.mode),
  };
}

const CORPUS: Chant[] = [
  ...GR_DATA.map((c) => withLabels(c, GR_SOURCE)),
  ...LU_DATA.map((c) => withLabels(c, LU_SOURCE)),
  ...LA_DATA.map((c) => withLabels(c, LA_SOURCE)),
  ...LH_DATA.map((c) => withLabels(c, LH_SOURCE)),
  ...AM_DATA.map((c) => withLabels(c, AM_SOURCE)),
];

let _byId: Map<string, Chant> | null = null;
function byId(): Map<string, Chant> {
  if (!_byId) _byId = new Map(CORPUS.map((c) => [c.id, c]));
  return _byId;
}

const SOURCES: Record<ChantSource, Chant["source"]> = {
  gr: GR_SOURCE, lu: LU_SOURCE, la: LA_SOURCE, lh: LH_SOURCE, am: AM_SOURCE,
};

// Tally a book's genre and mode distribution — computed once per code, cached.
const _corpusCache = new Map<ChantSource, Corpus>();

/**
 * Metadata and content breakdown for one corpus book (`tonus.corpus`). Pass a
 * source code; get the book's bibliographic identity plus its genre and mode
 * distributions. Computed on first access from the loaded corpus, then cached.
 */
export function getCorpus(code: ChantSource): Corpus {
  const cached = _corpusCache.get(code);
  if (cached) return cached;

  const src = SOURCES[code];
  if (!src) throw new Error(`Unknown corpus code: "${code}" (expected gr, lu, la, lh, or am)`);

  const chants = CORPUS.filter((c) => c.source.code === code);

  // Genre distribution — count by office code, descending by count.
  const officeCounts = new Map<OfficeCode, number>();
  // Mode distribution — count by mode 1–8; everything else (p/d/e, null) into one bucket.
  const modeCounts = new Map<string, number>();
  let otherModes = 0;
  for (const c of chants) {
    officeCounts.set(c.office, (officeCounts.get(c.office) ?? 0) + 1);
    if (c.mode != null && MODE_LABELS[c.mode]) {
      modeCounts.set(c.mode, (modeCounts.get(c.mode) ?? 0) + 1);
    } else {
      otherModes++;
    }
  }

  const genera: GenusCount[] = [...officeCounts.entries()]
    .map(([office, count]) => ({ office, genus: OFFICE_LABELS[office] ?? office, count }))
    .sort((a, b) => b.count - a.count);

  const modes: ModeCount[] = [];
  for (const m of ["1", "2", "3", "4", "5", "6", "7", "8"]) {
    const count = modeCounts.get(m);
    if (count) modes.push({ mode: m, modus: MODE_LABELS[m], count });
  }
  if (otherModes > 0) modes.push({ mode: null, modus: null, count: otherModes });

  // Pre-dedup relationships (precomputed in tonus-corpus — tonus can't derive
  // them, since it stores only one copy of each shared chant).
  const ov = CORPUS_OVERLAP[code];
  const shared: SharedCount[] = Object.entries(ov?.shared ?? {})
    .map(([c, count]) => ({ code: c as ChantSource, count }))
    .sort((a, b) => b.count - a.count);

  const result: Corpus = {
    code,
    book: src.book,
    fullTitle: src.fullTitle ?? null,
    edition: src.edition ?? null,
    year: src.year,
    editor: src.editor,
    scanSource: src.scanSource ?? null,
    count: chants.length,
    total: ov?.total ?? chants.length,
    unique: ov?.unique ?? chants.length,
    shared,
    genera,
    modes,
  };
  _corpusCache.set(code, result);
  return result;
}

function toArray<T>(v: T | T[] | undefined): T[] | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v : [v];
}

export function resolveChant(id: string | null): Chant | null {
  if (!id) return null;
  return byId().get(id) ?? null;
}

export function resolveChants(ids: string[]): Chant[] {
  return ids.map(resolveChant).filter((c): c is Chant => c !== null);
}

/**
 * Cross-corpus chant retrieval (`tonus.cantus`) over GR, LA, LH, and LU.
 * A `gabc` field bypasses the corpus and returns a single user
 * chant parsed from raw GABC (body or full file with headers).
 */
export function getChants(query?: CantusQuery): Chant[] {
  if (!query || Object.keys(query).length === 0) return [];

  if (query.gabc) return chantFromGABC(query);

  const ids = toArray(query.id);
  if (ids) {
    const map = byId();
    const found = ids.map((id) => map.get(id)).filter((c): c is Chant => !!c);
    return found;
  }

  let out = CORPUS;

  const sources = toArray(query.source);
  if (sources) {
    const set = new Set<string>(sources);
    out = out.filter((c) => c.source.code != null && set.has(c.source.code));
  }

  const offices = toArray(query.office);
  if (offices) {
    const set = new Set<string>(offices);
    out = out.filter((c) => set.has(c.office));
  }

  const modes = toArray(query.mode);
  if (modes) {
    const set = new Set(modes.map(String));
    out = out.filter((c) => c.mode != null && set.has(c.mode));
  }

  if (query.incipit) {
    const needle = query.incipit.toLowerCase();
    out = out.filter((c) => c.incipit.toLowerCase().includes(needle));
  }

  const sort = query.sort ?? "incipit";
  const sorted = [...out].sort((a, b) => {
    if (sort === "id") return a.id.localeCompare(b.id);
    if (sort === "mode")
      return (
        String(a.mode ?? "").localeCompare(String(b.mode ?? "")) ||
        a.incipit.localeCompare(b.incipit)
      );
    return a.incipit.localeCompare(b.incipit);
  });

  const offset = Math.max(0, query.offset ?? 0);
  const limit =
    query.limit == null ? sorted.length : Math.max(0, query.limit);
  return sorted.slice(offset, offset + limit);
}
