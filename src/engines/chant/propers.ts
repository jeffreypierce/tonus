// ---------------------------------------------------------------------------
// engines/chant/propers — Mass proper lookup
// ---------------------------------------------------------------------------
import { resolveChant } from "./chant.js";
import { temporaSundayId } from "../cal/date.js";
import type { Chant, PropriumQuery, OfficeCode } from "./types.js";
import type { Feast } from "../cal/types.js";
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

function resolveProperChants(feastId: string): Chant[] {
  const map = byFeastId();
  const proper = map.get(feastId) ?? null;
  const sunday = temporaSundayId(feastId);
  const seasonProper = sunday ? (map.get(sunday) ?? null) : null;

  const commune = communeByFeast().get(feastId);
  const communeProper = commune ? (communePropers().get(commune) ?? null) : null;

  const results: Chant[] = [];
  for (const slot of PROPER_SLOTS) {
    const id = proper?.[slot] ?? seasonProper?.[slot] ?? communeProper?.[slot] ?? null;
    const chant = resolveChant(id);
    if (chant) results.push(chant);
  }
  return results;
}

function toFeastArray(v: Feast | Feast[] | undefined): Feast[] | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v : [v];
}

function toArray<T>(v: T | T[] | undefined): T[] | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v : [v];
}

export function getPropers(query?: PropriumQuery): Chant[] {
  if (!query || Object.keys(query).length === 0) return [];

  const feasts = toFeastArray(query.feast);
  let results: Chant[];

  if (feasts) {
    results = feasts.flatMap((f) => resolveProperChants(f.id));
  } else {
    // No feast filter — resolve all propers
    results = PROPERS.flatMap((p) => resolveProperChants(p.feastId));
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
