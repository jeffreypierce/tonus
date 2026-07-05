// ---------------------------------------------------------------------------
// engines/chant/hour — Divine Office hour retrieval
// ---------------------------------------------------------------------------
import { resolveChant, resolveChants } from "./chant.js";
import { getPsalm, getPsalmRange } from "./psalm.js";
import { temporaSundayId } from "../cal/date.js";
import { getFeast } from "../cal/calendar.js";
import type { Chant, OfficiumQuery, CanonicalHour } from "./types.js";
import type { Feast } from "../cal/types.js";
import { OFFICE_ROMAN, type OfficeDay } from "../../data/office-roman.js";
import {
  COMPLINE_ORDINARY,
  COMPLINE_PSALMS,
  COMPLINE_SEASONAL,
  marianAntiphonFor,
} from "../../data/compline.js";
import {
  PRIME_ORDINARY,
  PRIME_PSALMS_BY_WEEKDAY,
  PRIME_SEASONAL,
} from "../../data/prime.js";

let _roman: Map<string, OfficeDay> | null = null;
function romanMap(): Map<string, OfficeDay> {
  if (!_roman) _roman = new Map(OFFICE_ROMAN.map((d) => [d.feastId, d]));
  return _roman;
}

// A psalm portion — whole psalm, or an inclusive verse range — intoned. The
// office ordos take partial psalms (Compline Ps 30:2-6; Prime Ps 118 in
// sections), so verse ranges matter here.
function psalmPortion(p: { psalm: number; from?: number; to?: number }): Chant[] {
  return p.from != null && p.to != null
    ? getPsalmRange(p.psalm, p.from, p.to)
    : getPsalm({ psalm: p.psalm });
}

// Compline is fixed and seasonal, not per-feast: it does not use the OfficeDay
// tables at all. The ordo is assembled from the season (Te lucis, In manus
// tuas), the four fixed psalms, the invariable spine (Deus in adjutorium, Nunc
// dimittis), and the date-driven Marian antiphon. See data/compline.ts.
function complineForFeast(feast: Feast): Chant[] {
  const seasonal = COMPLINE_SEASONAL[feast.season];
  const results: Chant[] = [];

  const opening = resolveChant(COMPLINE_ORDINARY.opening);
  if (opening) results.push(opening);

  for (const p of COMPLINE_PSALMS) results.push(...psalmPortion(p));

  const hymn = seasonal && resolveChant(seasonal.teLucis);
  if (hymn) results.push(hymn);

  const responsory = seasonal && resolveChant(seasonal.inManusTuas);
  if (responsory) results.push(responsory);

  const canticle = resolveChant(COMPLINE_ORDINARY.canticle);
  if (canticle) results.push(canticle);

  const marian = resolveChant(marianAntiphonFor(feast.season, feast.date));
  if (marian) results.push(marian);

  return results;
}

// Prime, like Compline, is a fixed+seasonal ordo, not per-feast. Covers the
// sung parts only (see data/prime.ts): opening, fixed psalms, the hymn Iam
// lucis, and the seasonal short responsory Christe Fili Dei.
function primeForFeast(feast: Feast): Chant[] {
  const seasonal = PRIME_SEASONAL[feast.season];
  const results: Chant[] = [];

  const opening = resolveChant(PRIME_ORDINARY.opening);
  if (opening) results.push(opening);

  const hymn = resolveChant(PRIME_ORDINARY.hymn);
  if (hymn) results.push(hymn);

  const portions = PRIME_PSALMS_BY_WEEKDAY[feast.weekday]
    ?? PRIME_PSALMS_BY_WEEKDAY[0]!;
  for (const p of portions) results.push(...psalmPortion(p));

  const responsory = seasonal && resolveChant(seasonal.responsory);
  if (responsory) results.push(responsory);

  return results;
}

function chantsForFeastHour(feast: Feast, hour: CanonicalHour): Chant[] {
  if (hour === "completorium") return complineForFeast(feast);
  if (hour === "prima") return primeForFeast(feast);

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
  const hour = query.hora;

  let results: Chant[];

  if (feasts && hour) {
    // Prime and Compline are seasonal/weekday ordos, identical for every feast
    // of the day — so concurrent feasts collapse to a single ordo rather than
    // repeating it. The other hours are genuinely per-feast.
    results =
      hour === "prima" || hour === "completorium"
        ? feasts[0] ? chantsForFeastHour(feasts[0], hour) : []
        : feasts.flatMap((f) => chantsForFeastHour(f, hour));
  } else if (feasts) {
    const hours: CanonicalHour[] = [
      "matutinum", "laudes", "prima", "tertia", "sexta", "nona",
      "vesperae", "completorium",
    ];
    results = feasts.flatMap((f) => hours.flatMap((h) => chantsForFeastHour(f, h)));
  } else if (hour === "prima" || hour === "completorium") {
    // Prime and Compline are seasonal ordos, not per-feast. With no feast,
    // resolve for the default epoch (Guido d'Arezzo's era) — festum()'s anchor.
    const [feast] = getFeast();
    results = feast ? chantsForFeastHour(feast, hour) : [];
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

  // Prime and Compline are ordered ordos — their sequence IS the content — so
  // they keep assembly order unless the caller explicitly asks for a sort.
  // Every other hour returns a set of chants, sorted by incipit by default.
  const isOrderedOrdo = query.hora === "prima" || query.hora === "completorium";
  if (query.sort || !isOrderedOrdo) {
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
  }

  const offset = Math.max(0, query.offset ?? 0);
  const limit = query.limit == null ? results.length : Math.max(0, query.limit);
  return results.slice(offset, offset + limit);
}
