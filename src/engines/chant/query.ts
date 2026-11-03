// ---------------------------------------------------------------------------
// engines/chant/query — the query contract's door, shared by every chant verb
// ---------------------------------------------------------------------------
// One guard for cantus, proprium, ordinarium, officium and psalmus, so the
// contract cannot drift verb by verb: a no-match is `[]`; a malformed query
// throws with guidance. "Malformed" is three things here, and each verb used
// to check a different subset of them:
//
//   - an empty query, or one whose every filter is empty (`{ sort: "id" }`,
//     `{ incipit: "" }`, `{ id: undefined }`): no search ran, so `[]` would
//     claim a no-match and the whole shelf would dress the corpus as a result;
//   - an unknown key, almost always a typo or a removed option;
//   - a value outside its vocabulary (`sort: "bogus"`, `cursus: "bogus"`),
//     which otherwise fell through to a default and answered a question the
//     caller did not ask.
//
// A LEAF module (types and books only), like attest.ts.
import type { Chant } from "./types.js";
import { inBooks } from "./books.js";

const SORTS = new Set(["incipit", "mode", "id"]);
const CURSUS = new Set(["monastic", "secular"]);

/** A value that names something: not absent, not an empty string or list. */
function given(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

/**
 * Throw unless `query` is a well-formed query for `method`: it is an object,
 * every key is one the verb takes, at least one FILTER key carries a value,
 * and `sort` / `cursus` are in their vocabularies. Narrows `query` for the
 * caller.
 */
export function assertQueryShape<Q extends object>(
  query: Q | undefined | null,
  keys: ReadonlySet<string>,
  filterKeys: ReadonlySet<string>,
  method: string,
): asserts query is Q {
  if (query == null || typeof query !== "object") {
    throw new Error(`${method}: pass a query object (one of ${[...filterKeys].join(", ")}).`);
  }
  const record = query as Record<string, unknown>;
  const unknown = Object.keys(record).filter((k) => !keys.has(k));
  if (unknown.length) {
    throw new Error(
      `${method}: unknown query key(s) ${unknown.map((k) => `"${k}"`).join(", ")} ` +
      `(expected ${[...keys].join(", ")}).`,
    );
  }
  if (![...filterKeys].some((k) => given(record[k]))) {
    throw new Error(
      `${method}: an empty query matches nothing meaningful — pass a filter ` +
      `(one of ${[...filterKeys].join(", ")}).`,
    );
  }
  if (record.sort != null && !SORTS.has(record.sort as string)) {
    throw new Error(
      `${method}: unknown sort ${JSON.stringify(record.sort)} (expected ${[...SORTS].join(", ")}).`,
    );
  }
  if (record.cursus != null && !CURSUS.has(record.cursus as string)) {
    throw new Error(
      `${method}: unknown cursus ${JSON.stringify(record.cursus)} (expected ${[...CURSUS].join(", ")}).`,
    );
  }
}

function toArray<T>(v: T | T[] | undefined): T[] | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v : [v];
}

/** The ordering `sort` names. */
export function sortChants<T extends Chant>(chants: T[], sort: string): T[] {
  return chants.sort((a, b) => {
    if (sort === "id") return a.id.localeCompare(b.id);
    if (sort === "mode")
      return (
        String(a.mode ?? "").localeCompare(String(b.mode ?? "")) ||
        a.incipit.localeCompare(b.incipit)
      );
    return a.incipit.localeCompare(b.incipit);
  });
}

interface RefineQuery {
  id?: string | string[];
  incipit?: string;
  mode?: number | string | (number | string)[];
  office?: string | string[];
  source?: string | string[];
  sort?: string;
  limit?: number;
  offset?: number;
}

/**
 * The cantus filters, applied to what a day verb ASSEMBLED. A day verb's
 * result is an ordo, so its order is the liturgy's (Introit before Gradual,
 * the hymn after the psalms) and is kept unless `sort` asks otherwise; the
 * window (`offset`, `limit`) is taken last, over the filtered result, so a
 * page counts what the caller will actually see.
 */
export function refine<T extends Chant>(results: T[], query: RefineQuery): T[] {
  let out = results;
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
  const sources = toArray(query.source);
  if (sources) out = inBooks(out, sources);
  if (query.incipit) {
    const needle = query.incipit.toLowerCase();
    out = out.filter((c) => c.incipit.toLowerCase().includes(needle));
  }
  const ids = toArray(query.id);
  if (ids) {
    const set = new Set(ids);
    out = out.filter((c) => set.has(c.id));
  }
  if (query.sort) out = sortChants([...out], query.sort);
  const offset = Math.max(0, query.offset ?? 0);
  const limit = query.limit == null ? out.length : Math.max(0, query.limit);
  return out.slice(offset, offset + limit);
}

/**
 * The day's PRINCIPAL feast, one per date. `festum({ date })` returns every
 * celebration the calendar finds for a day, principal first, and a day verb
 * handed that list sings the first: the commemorated feria does not get an
 * office, a proper or an ordinary of its own beside Christmas. Several dates
 * in one list keep one feast each, in the order given; a feast with no date
 * (a hand-built one) stands for itself.
 */
export function principalFeasts<F extends { date?: Date | null }>(feasts: F[] | undefined): F[] | undefined {
  if (!feasts) return feasts;
  const seen = new Set<string>();
  const out: F[] = [];
  for (const f of feasts) {
    const key = f.date instanceof Date ? f.date.toISOString().slice(0, 10) : null;
    if (key != null) {
      if (seen.has(key)) continue;
      seen.add(key);
    }
    out.push(f);
  }
  return out;
}
