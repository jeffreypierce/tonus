// ---------------------------------------------------------------------------
// engines/chant/hour — Divine Office hour retrieval
// ---------------------------------------------------------------------------
import { resolveChant, resolveChants } from "./chant.js";
import { temporaSundayId } from "../cal/date.js";
import type { Chant, OfficiumQuery, CanonicalHour } from "./types.js";
import type { Feast } from "../cal/types.js";
import { OFFICE_ROMAN, type OfficeDay } from "../../data/office-roman.js";

let _roman: Map<string, OfficeDay> | null = null;
function romanMap(): Map<string, OfficeDay> {
  if (!_roman) _roman = new Map(OFFICE_ROMAN.map((d) => [d.feastId, d]));
  return _roman;
}

function chantsForFeastHour(feast: Feast, hour: CanonicalHour): Chant[] {
  const map = romanMap();
  const sunday = temporaSundayId(feast.id);
  const day = map.get(feast.id) ?? (sunday ? (map.get(sunday) ?? null) : null);
  if (!day) return [];

  const results: Chant[] = [];

  if (hour === "matutinum") {
    const inv = resolveChant(day.invit);
    if (inv) results.push(inv);
    results.push(...resolveChants(day.antMatutinum));
    const hy = resolveChant(day.hymnMatutinum);
    if (hy) results.push(hy);
    results.push(...resolveChants(day.respMatutinum));
  } else if (hour === "laudes") {
    results.push(...resolveChants(day.antLaudes));
    const bc = resolveChant(day.antBenedictus);
    if (bc) results.push(bc);
    const hy = resolveChant(day.hymnLaudes);
    if (hy) results.push(hy);
  } else if (hour === "tertia") {
    const rb = resolveChant(day.respBreveTertia);
    if (rb) results.push(rb);
  } else if (hour === "sexta") {
    const rb = resolveChant(day.respBreveSexta);
    if (rb) results.push(rb);
  } else if (hour === "nona") {
    const rb = resolveChant(day.respBreveNona);
    if (rb) results.push(rb);
  } else if (hour === "vesperae") {
    results.push(...resolveChants(day.antVespera));
    const mc = resolveChant(day.antMagnificat);
    if (mc) results.push(mc);
    const hy = resolveChant(day.hymnVespera);
    if (hy) results.push(hy);
  }

  return results;
}

function toArray<T>(v: T | T[] | undefined): T[] | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v : [v];
}

/**
 * Divine Office retrieval (`tonus.officium`) for a canonical hour
 * (matutinum … completorium). Without an hour, returns chants for all
 * available hours; a feast acts as a filter.
 */
export function getHour(query?: OfficiumQuery): Chant[] {
  if (!query || Object.keys(query).length === 0) return [];

  const feasts = toArray(query.feast);
  const hour = query.hour;

  let results: Chant[];

  if (feasts && hour) {
    results = feasts.flatMap((f) => chantsForFeastHour(f, hour));
  } else if (feasts) {
    const hours: CanonicalHour[] = ["matutinum", "laudes", "tertia", "sexta", "nona", "vesperae"];
    results = feasts.flatMap((f) => hours.flatMap((h) => chantsForFeastHour(f, h)));
  } else if (hour) {
    // Hour without feast — scan all office entries
    results = OFFICE_ROMAN.flatMap((day) => {
      const mockFeast = { id: day.feastId } as Feast;
      return chantsForFeastHour(mockFeast, hour);
    });
  } else {
    return [];
  }

  // Apply CantusQuery filters
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
    const ids = new Set(toArray(query.id));
    results = results.filter((c) => ids.has(c.id));
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
