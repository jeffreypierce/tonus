// ---------------------------------------------------------------------------
// engines/chant/propers — Mass proper lookup
// ---------------------------------------------------------------------------
import { resolveChant } from "./chant.js";
import { eraCutoff, chantAdmissible } from "./attest.js";
import { temporaSundayId } from "../cal/date.js";
import type { Chant, PropriumQuery, OfficeCode } from "./types.js";
import { PENITENTIAL_SEASONS, type Feast, type Season } from "../cal/types.js";
import { PROPERS, type ProperSet } from "../../data/propers.js";
import { COMMUNE_PROPERS, FEAST_COMMUNE, type CommuneProperSet } from "../../data/commune.js";

let _byFeastId: Map<string, ProperSet> | null = null;
function byFeastId(): Map<string, ProperSet> {
  if (!_byFeastId) _byFeastId = new Map(PROPERS.map((p) => [p.feastId, p]));
  return _byFeastId;
}

let _communeByFeast: Map<string, string> | null = null;
function communeByFeast(): Map<string, string> {
  if (!_communeByFeast) _communeByFeast = new Map(FEAST_COMMUNE.map((f) => [f.feastId, f.commune]));
  return _communeByFeast;
}

let _communePropers: Map<string, CommuneProperSet> | null = null;
function communePropers(): Map<string, CommuneProperSet> {
  if (!_communePropers) _communePropers = new Map(COMMUNE_PROPERS.map((c) => [c.commune, c]));
  return _communePropers;
}

const PROPER_SLOTS: (keyof Pick<ProperSet, "in" | "gr" | "al" | "tr" | "of" | "co">)[] =
  ["in", "gr", "al", "tr", "of", "co"];

function resolveProperChants(feastId: string, season?: Season | null): Chant[] {
  const map = byFeastId();
  const proper = map.get(feastId) ?? null;
  const sunday = temporaSundayId(feastId);
  const seasonProper = sunday ? (map.get(sunday) ?? null) : null;

  const commune = communeByFeast().get(feastId);
  const communeProper = commune ? (communePropers().get(commune) ?? null) : null;

  const ids: Record<string, string | null> = {};
  for (const slot of PROPER_SLOTS) {
    ids[slot] = proper?.[slot] ?? seasonProper?.[slot] ?? communeProper?.[slot] ?? null;
  }
  // Alleluia OR Tractus when the formulary carries BOTH: the commune sets
  // serve year-round and print the pair, and serving them together handed
  // 08-26 two gradual-tier chants in one Mass. Penitential seasons silence
  // the Alleluia and sing the Tract; the rest of the year the reverse. A
  // formulary carrying only ONE keeps it regardless — an Ember Saturday's
  // tract is not silenced for falling outside Lent — and a survey call
  // (no season in hand) still reports both.
  if (season != null && ids.al && ids.tr) {
    if (PENITENTIAL_SEASONS.has(season)) ids.al = null;
    else ids.tr = null;
  }

  const results: Chant[] = [];
  for (const slot of PROPER_SLOTS) {
    const chant = resolveChant(ids[slot]);
    if (chant) results.push(chant);
  }
  return results;
}

function toFeastArray(v: Feast | Feast[] | undefined): Feast[] | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v : [v];
}

/** The feast filter must carry Feast objects (from tonus.festum) — a raw
 * TypeError deep in resolution would otherwise mask the caller bug. */
function assertFeasts(feasts: Feast[] | undefined, method: string): void {
  if (!feasts) return;
  for (const f of feasts) {
    if (!f || typeof f !== "object" || typeof (f as Feast).id !== "string")
      throw new Error(`${method}: feast must be a Feast (from tonus.festum) — got ${typeof f}`);
  }
}


function toArray<T>(v: T | T[] | undefined): T[] | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v : [v];
}

const PROPRIUM_QUERY_KEYS = new Set([
  "feast", "id", "gabc", "incipit", "mode", "office", "source",
  "before", "cursus",
  "limit", "offset", "sort",
]);

/**
 * Mass proper retrieval (`tonus.proprium`): Introitus, Graduale,
 * Alleluia/Tractus, Offertorium, Communio. A feast narrows the result;
 * feasts without a dedicated proper fall back to the Commune Sanctorum.
 */
export function getPropers(query?: PropriumQuery): Chant[] {
  if (!query || Object.keys(query).length === 0) return [];
  // The reconciled query contract (as festum/cantus): an unknown key is a
  // caller bug, not a filter that silently matches everything.
  const unknown = Object.keys(query).filter((k) => !PROPRIUM_QUERY_KEYS.has(k));
  if (unknown.length > 0) {
    throw new Error(
      `proprium: unknown query key(s) ${unknown.map((k) => `"${k}"`).join(", ")} ` +
      `(expected ${[...PROPRIUM_QUERY_KEYS].join(", ")}).`,
    );
  }

  const feasts = toFeastArray(query.feast);
  assertFeasts(feasts, "proprium");
  let results: Chant[];

  if (feasts) {
    results = feasts.flatMap((f) => resolveProperChants(f.id, f.season));
  } else {
    // No feast filter — resolve all propers (a survey: no season, both
    // alleluia and tract report).
    results = PROPERS.flatMap((p) => resolveProperChants(p.feastId));
  }


  // The era view: an own `before` wins; otherwise the view festum({ before })
  // stamped on the feast rides along. A proper has no pool of alternatives, so
  // an excluded chant degrades to SILENCE by design — the same evidence law as
  // the corpus cut.
  const cutoff = eraCutoff(query, feasts, "proprium");
  if (cutoff != null || query.cursus) {
    results = results.filter((c) => chantAdmissible(c.id, cutoff, query.cursus));
  }

  const offices = toArray(query.office);
  if (offices) {
    const set = new Set<string>(offices);
    results = results.filter((c) => set.has(c.office));
  }

  const modes = toArray(query.mode);
  if (modes) {
    const set = new Set(modes.map(String));
    results = results.filter((c) => c.mode != null && set.has(c.mode));
  }

  const sources = toArray(query.source);
  if (sources) {
    const set = new Set<string>(sources);
    results = results.filter((c) => c.source.code != null && set.has(c.source.code));
  }

  if (query.incipit) {
    const needle = query.incipit.toLowerCase();
    results = results.filter((c) => c.incipit.toLowerCase().includes(needle));
  }

  if (query.id) {
    const ids = toArray(query.id)!;
    const set = new Set(ids);
    results = results.filter((c) => set.has(c.id));
  }

  const sort = query.sort ?? "incipit";
  results.sort((a, b) => {
    if (sort === "id") return a.id.localeCompare(b.id);
    if (sort === "mode")
      return (
        String(a.mode ?? "").localeCompare(String(b.mode ?? "")) ||
        a.incipit.localeCompare(b.incipit)
      );
    return a.incipit.localeCompare(b.incipit);
  });

  const offset = Math.max(0, query.offset ?? 0);
  const limit = query.limit == null ? results.length : Math.max(0, query.limit);
  return results.slice(offset, offset + limit);
}
