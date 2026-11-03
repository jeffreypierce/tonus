// ---------------------------------------------------------------------------
// engines/chant/propers — Mass proper lookup
// ---------------------------------------------------------------------------
import { resolveChant } from "./chant.js";
import { assertQueryShape, refine, principalFeasts } from "./query.js";
import { eraCutoff, chantAdmissible } from "./attest.js";
import { temporaSundayId } from "../cal/date.js";
import type { Chant, PropriumQuery } from "./types.js";
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


// `gabc` and `ordinary` are cantus's alone: one parses a user chant, the other
// opens the Kyriale, and the proper has neither to refine.
const PROPRIUM_QUERY_KEYS = new Set([
  "feast", "id", "incipit", "mode", "office", "source",
  "before", "cursus",
  "limit", "offset", "sort",
]);
const PROPRIUM_FILTER_KEYS = new Set(
  [...PROPRIUM_QUERY_KEYS].filter((k) => !["limit", "offset", "sort"].includes(k)),
);

/**
 * Mass proper retrieval (`tonus.proprium`): Introitus, Graduale,
 * Alleluia/Tractus, Offertorium, Communio, in that order — the order they are
 * sung. A feast narrows the result; feasts without a dedicated proper fall
 * back to the Commune Sanctorum.
 */
export function getPropers(query?: PropriumQuery): Chant[] {
  // The query contract (query.ts): an empty query or an unknown key is a
  // caller bug, not a filter that silently matches everything.
  assertQueryShape(query, PROPRIUM_QUERY_KEYS, PROPRIUM_FILTER_KEYS, "proprium");

  // One Mass a day: the principal feast's (see principalFeasts). Handed
  // festum's whole list for Christmas, the proper used to sing the Nativity's
  // and the Advent feria's side by side.
  const rawFeasts = toFeastArray(query.feast);
  assertFeasts(rawFeasts, "proprium");
  const feasts = principalFeasts(rawFeasts);
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

  // The cantus filters, read the way cantus reads them (a `source` is the
  // books a chant is PRINTED in, presented as the book asked for), and the
  // sung order kept unless a `sort` is asked.
  return refine(results, query);
}
