// ---------------------------------------------------------------------------
// engines/chant/chant — corpus query
// ---------------------------------------------------------------------------
import type {
  Chant, CantusQuery, OfficeCode, ChantSource, Corpus, GenusCount, ModeCount, SharedCount,
  CorpusFullCount, CorpusLedger, CorpusQuery,
} from "./types.js";
import { OFFICIA, MODI, CANTUS_QUERY_KEYS } from "./types.js";
import { CORPUS_OVERLAP, CORPUS_FULL } from "../../data/corpus-overlap.js";
import { attestationCutoff, chantAdmissible } from "./attest.js";
import { GR_DATA, GR_SOURCE, type ChantData } from "../../data/gr.js";
import { LU_DATA, LU_SOURCE } from "../../data/lu.js";
import { LA_DATA, LA_SOURCE } from "../../data/la.js";
import { LH_DATA, LH_SOURCE } from "../../data/lh.js";
import { AM_DATA, AM_SOURCE } from "../../data/am.js";
import { NR_DATA, NR_SOURCE } from "../../data/nocturnale-romanum.js";
// Office books — the antiphons and short responsories that fill weekday
// office slots; see ChantSource in types.ts for why.
import { AMS_DATA, AMS_SOURCE } from "../../data/ams.js";
import { PSM_DATA, PSM_SOURCE } from "../../data/psm.js";
// Further marked Solesmes books — see ChantSource in types.ts.
import { CSE_DATA, CSE_SOURCE } from "../../data/cse.js";
import { COT_DATA, COT_SOURCE } from "../../data/cot.js";
import { KYRIALE } from "../../data/kyriale.js";
import { KY_SOURCE } from "./types.js";
import { entryToOrdinaryChant } from "./ordinary.js";

function modusOf(mode: string | null): string | null {
  return mode != null ? (MODI[mode] ?? null) : null;
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
  // The office-part header carries either a code ("in") or a Latin genre name
  // ("Introitus", any casing) — normalize to the OfficeCode vocabulary so user
  // chants honour the same contract as corpus chants; unrecognized values fall
  // to "or" like an absent header.
  const officeFromHeader = ((): OfficeCode | null => {
    if (!officePart) return null;
    const v = officePart.trim().toLowerCase();
    for (const [code, label] of Object.entries(OFFICIA)) {
      if (v === code || v === label.toLowerCase()) return code as OfficeCode;
    }
    return null;
  })();
  const office = (
    query.office
      ? (Array.isArray(query.office) ? query.office[0] : query.office)
      : officeFromHeader ?? "or"
  ) as OfficeCode;

  return [{
    id: `gabc:${incipit.toLowerCase().replace(/\s+/g, "_") || "untitled"}`,
    incipit,
    gabc: body,
    office,
    genus: OFFICIA[office] ?? office,
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
    genus: OFFICIA[c.office as OfficeCode] ?? c.office,
    modus: modusOf(c.mode),
  };
}

const CORPUS: Chant[] = [
  ...GR_DATA.map((c) => withLabels(c, GR_SOURCE)),
  ...LU_DATA.map((c) => withLabels(c, LU_SOURCE)),
  ...LA_DATA.map((c) => withLabels(c, LA_SOURCE)),
  ...LH_DATA.map((c) => withLabels(c, LH_SOURCE)),
  ...AM_DATA.map((c) => withLabels(c, AM_SOURCE)),
  ...NR_DATA.map((c) => withLabels(c, NR_SOURCE)),
  ...AMS_DATA.map((c) => withLabels(c, AMS_SOURCE)),
  ...PSM_DATA.map((c) => withLabels(c, PSM_SOURCE)),
  ...CSE_DATA.map((c) => withLabels(c, CSE_SOURCE)),
  ...COT_DATA.map((c) => withLabels(c, COT_SOURCE)),
  // The Kyriale as a corpus book (source "ky"): the ordinary IS repertoire —
  // office stays "or" and the per-ordinary identity rides `ordinary`/
  // `ordinarium`/`mass`, the same records `ordinarium()` serves (one shaping,
  // ordinary.ts). Registered as a book so corpus-scale analysis can count
  // the ordinary; a few aspersion chants legitimately also appear in other books
  // (shared content, the CORPUS_OVERLAP situation).
  ...KYRIALE.map(entryToOrdinaryChant),
];

let _byId: Map<string, Chant> | null = null;
function byId(): Map<string, Chant> {
  if (!_byId) _byId = new Map(CORPUS.map((c) => [c.id, c]));
  return _byId;
}

export const SOURCES: Record<ChantSource, Chant["source"]> = {
  gr: GR_SOURCE, lu: LU_SOURCE, la: LA_SOURCE, lh: LH_SOURCE, am: AM_SOURCE, nr: NR_SOURCE,
  ky: KY_SOURCE,
  // office books — provenance, not acquisition
  ams: AMS_SOURCE, psm: PSM_SOURCE,
  cse: CSE_SOURCE, cot: COT_SOURCE,
};

// Tally a book's genre and mode distribution — computed once per code, cached.
const _corpusCache = new Map<ChantSource, Corpus>();

/**
 * Metadata and content breakdown for one corpus book (`tonus.corpus`). Pass a
 * source code; get the book's bibliographic identity plus its genre and mode
 * distributions. Computed on first access from the loaded corpus, then cached.
 */
/**
 * One book's ledger, or the whole shelf's.
 *
 * `corpus("am")` and `corpus({ book: "am" })` are the same question — the bare
 * code came first and keeps working, the object form matches every other verb.
 * `corpus()` with no argument returns the rollup, which used to throw.
 */
export function getCorpus(): CorpusLedger;
export function getCorpus(code: ChantSource): Corpus;
export function getCorpus(query: CorpusQuery): Corpus;
export function getCorpus(arg?: ChantSource | CorpusQuery): Corpus | CorpusLedger {
  if (arg == null) return corpusLedger();
  if (typeof arg === "object") {
    const unknown = Object.keys(arg).filter((k) => k !== "book");
    if (unknown.length) {
      throw new Error(
        `corpus: unknown query key(s) ${unknown.map((k) => `"${k}"`).join(", ")} (expected book).`,
      );
    }
    if (arg.book == null) return corpusLedger();
    return oneCorpus(arg.book);
  }
  return oneCorpus(arg);
}

/** Sort a raw office tally into the GenusCount rows corpus() reports. */
function generaRows(tally: Record<string, number>): GenusCount[] {
  return Object.entries(tally)
    .map(([office, count]) => ({
      office: office as OfficeCode,
      genus: OFFICIA[office as OfficeCode] ?? office,
      count,
    }))
    .sort((a, b) => b.count - a.count || (a.office < b.office ? -1 : 1));
}

/** Sort a raw mode tally into ModeCount rows: 1–8 in order, then the rest. */
function modesRows(tally: Record<string, number>): ModeCount[] {
  const rows: ModeCount[] = [];
  for (const m of ["1", "2", "3", "4", "5", "6", "7", "8"]) {
    const count = tally[m];
    if (count) rows.push({ mode: m, modus: MODI[m]!, count });
  }
  // The extractor buckets differentia forms, tonus peregrinus and unlabelled
  // chants together under "other" — the same bucket the shipped counts report
  // as `mode: null`, so the two tallies stay comparable row for row.
  if (tally.other) rows.push({ mode: null, modus: null, count: tally.other });
  return rows;
}

/**
 * A book's pre-cut tally, or null where it cannot be measured. Only the
 * extractor sees the un-cut book — by the time tonus loads, the keep set has
 * already run — so this is read from the artifact, never derived here.
 */
function fullCount(code: ChantSource): CorpusFullCount | null {
  const f = CORPUS_FULL[code];
  if (!f) return null;
  return { total: f.total, genera: generaRows(f.genera), modes: modesRows(f.modes) };
}

/**
 * The whole shelf: every book, plus the corpus-wide rollup. `corpus()` with no
 * argument used to throw ("Unknown corpus code: undefined"), which made the
 * commonest question — what IS this corpus — the one thing the verb could not
 * answer.
 *
 * `count` is rows and `distinct` is addressable chants; they differ because a
 * melody printed in two books is stored once but listed under both. Both are
 * reported because both are true and each answers a different question.
 */
let _ledger: CorpusLedger | null = null;
function corpusLedger(): CorpusLedger {
  if (_ledger) return _ledger;
  // SOURCES is the registry — a book added there joins the ledger without an
  // edit here, which is the failure mode every mirrored book list in this
  // project has hit at least once.
  const codes = Object.keys(SOURCES) as ChantSource[];
  const books = codes.map((code) => oneCorpus(code));

  const genera: Record<string, number> = {};
  const modes: Record<string, number> = {};
  for (const c of CORPUS) {
    genera[c.office] = (genera[c.office] ?? 0) + 1;
    const m = c.mode != null && MODI[c.mode] ? c.mode : "other";
    modes[m] = (modes[m] ?? 0) + 1;
  }

  _ledger = {
    count: CORPUS.length,
    distinct: byId().size,
    // Sum only what was measured: a book outside GregoBase reports null rather
    // than a false zero, and adding null in as 0 would understate the shelf
    // while looking like a total.
    total: codes.reduce((n: number, code) => n + (CORPUS_FULL[code]?.total ?? 0), 0),
    genera: generaRows(genera),
    modes: modesRows(modes),
    books,
  };
  return _ledger;
}

function oneCorpus(code: ChantSource): Corpus {
  const cached = _corpusCache.get(code);
  if (cached) return cached;

  const src = SOURCES[code];
  if (!src) throw new Error(`Unknown corpus code: "${code}" (expected ${Object.keys(SOURCES).join(", ")})`);

  const chants = CORPUS.filter((c) => c.source.code === code);

  // Genre distribution — count by office code, descending by count.
  const officeCounts = new Map<OfficeCode, number>();
  // Mode distribution — count by mode 1–8; everything else (p/d/e, null) into one bucket.
  const modeCounts = new Map<string, number>();
  let otherModes = 0;
  for (const c of chants) {
    officeCounts.set(c.office, (officeCounts.get(c.office) ?? 0) + 1);
    if (c.mode != null && MODI[c.mode]) {
      modeCounts.set(c.mode, (modeCounts.get(c.mode) ?? 0) + 1);
    } else {
      otherModes++;
    }
  }

  const genera: GenusCount[] = [...officeCounts.entries()]
    .map(([office, count]) => ({ office, genus: OFFICIA[office] ?? office, count }))
    .sort((a, b) => b.count - a.count);

  const modes: ModeCount[] = [];
  for (const m of ["1", "2", "3", "4", "5", "6", "7", "8"]) {
    const count = modeCounts.get(m);
    if (count) modes.push({ mode: m, modus: MODI[m], count });
  }
  if (otherModes > 0) modes.push({ mode: null, modus: null, count: otherModes });

  // Pre-dedup relationships (precomputed in tonus-corpus — tonus can't derive
  // them, since it stores only one copy of each shared chant). Measured only for
  // the GregoBase-sourced books; a book outside GregoBase (e.g. `nr`) has no
  // entry, so overlap is reported as *unmeasured* (null) rather than a false zero.
  const ov = CORPUS_OVERLAP[code];
  const shared: SharedCount[] | null = ov
    ? Object.entries(ov.shared)
        .map(([c, count]) => ({ code: c as ChantSource, count }))
        .sort((a, b) => b.count - a.count)
    : null;

  const result: Corpus = {
    code,
    book: src.book,
    fullTitle: src.fullTitle ?? null,
    edition: src.edition ?? null,
    year: src.year,
    editor: src.editor,
    scanSource: src.scanSource ?? null,
    count: chants.length,
    total: ov?.total ?? null,
    unique: ov?.unique ?? null,
    shared,
    genera,
    modes,
    full: fullCount(code),
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

// The key set lives in types.ts (cycle-free); re-exported here for the verbs
// that extend it (hour.ts).
export { CANTUS_QUERY_KEYS };

/**
 * Cross-corpus chant retrieval (`tonus.cantus`) over every corpus book
 * (the codes in SOURCES). A `gabc` field bypasses the corpus and returns a
 * single user chant parsed from raw GABC (body or full file with headers).
 */
export function getChants(query?: CantusQuery): Chant[] {
  // A no-match returns []; a malformed query is a caller bug and throws with
  // guidance (the reconciled query contract — see CODE-STANDARDS → Boundaries).
  if (!query || Object.keys(query).length === 0) {
    throw new Error(
      "cantus: an empty query matches nothing meaningful — pass a filter " +
      `(one of ${[...CANTUS_QUERY_KEYS].join(", ")}), or a gabc string to parse.`,
    );
  }
  const unknown = Object.keys(query).filter((k) => !CANTUS_QUERY_KEYS.has(k));
  if (unknown.length > 0) {
    throw new Error(
      `cantus: unknown query key(s) ${unknown.map((k) => `"${k}"`).join(", ")} ` +
      `(expected ${[...CANTUS_QUERY_KEYS].join(", ")}).`,
    );
  }

  if (query.gabc) return chantFromGABC(query);

  // `id` is a fast path, but it must still honour the other filters — returning
  // a chant that fails them makes `cantus({ source, id })` silently ignore the
  // source and report an id from any book as belonging to that one.
  const ids = toArray(query.id);
  let out: readonly Chant[] = CORPUS;
  if (ids) {
    const map = byId();
    out = ids.map((id) => map.get(id)).filter((c): c is Chant => !!c);
  }

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

  // ── Attestation: the repertoire AS OF a date ───────────────────────────────
  // The analogue of `festum({ before })` over the calendar. The corpus ships
  // 20th-century Solesmes editions, so the BOOK dates nothing; CANTUS's
  // manuscript index does. `century` is the earliest surviving witness — a
  // terminus ante quem, so this answers "what is ATTESTED by then", never "what
  // existed then". A chant CANTUS cannot date is excluded rather than assumed
  // old: the filter states what is evidenced, and silence is not evidence.
  // One rule, one door-keeper: the same chantAdmissible() the day verbs use,
  // so `cantus({ before })` and `proprium({ feast, before })` can never drift.
  {
    const cutoff = attestationCutoff(query, "cantus");
    if (cutoff != null || query.cursus) {
      out = out.filter((c) => chantAdmissible(c.id, cutoff, query.cursus));
    }
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
