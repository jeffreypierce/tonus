// ---------------------------------------------------------------------------
// engines/chant/hour — Divine Office hour retrieval
// ---------------------------------------------------------------------------
import { resolveChant, resolveChants } from "./chant.js";
import { intonePortion, officePsalmPortions } from "./psalm.js";
import { temporaSundayId } from "../cal/date.js";
import { getFeast } from "../cal/calendar.js";
import type { Chant, OfficiumQuery, CanonicalHour } from "./types.js";
import type { Feast } from "../cal/types.js";
import { OFFICE_ROMAN, type OfficeDay } from "../../data/office-roman.js";
import {
  COMPLINE_ORDINARY,
  COMPLINE_SEASONAL,
  marianAntiphonFor,
} from "../../data/compline.js";
import { PRIME_ORDINARY, PRIME_SEASONAL } from "../../data/prime.js";

let _roman: Map<string, OfficeDay> | null = null;
function romanMap(): Map<string, OfficeDay> {
  if (!_roman) _roman = new Map(OFFICE_ROMAN.map((d) => [d.feastId, d]));
  return _roman;
}

// Hours whose result is an ordered sequence (an ordo) rather than a set of
// chants — they keep assembly order instead of being sorted by incipit.
const ORDERED_ORDO_HOURS: ReadonlySet<CanonicalHour> = new Set([
  "prima", "tertia", "sexta", "nona", "completorium",
]);

// The purely seasonal/fixed hours — identical for every feast of a day, so
// concurrent feasts collapse to one and a no-feast query resolves the default
// epoch. (Terce/Sext/None are NOT here: their responsory breve is per-feast.)
const SEASONAL_ORDO_HOURS: ReadonlySet<CanonicalHour> = new Set([
  "prima", "completorium",
]);

// Compline is fixed and seasonal, not per-feast: it does not use the OfficeDay
// tables at all. The ordo is assembled from the season (Te lucis, In manus
// tuas), the fixed psalms (from the extracted DO scheme), the invariable spine
// (Deus in adjutorium, Nunc dimittis), and the date-driven Marian antiphon.
// See data/compline.ts.
function complineForFeast(feast: Feast): Chant[] {
  const seasonal = COMPLINE_SEASONAL[feast.season];
  const results: Chant[] = [];

  const opening = resolveChant(COMPLINE_ORDINARY.opening);
  if (opening) results.push(opening);

  for (const p of officePsalmPortions("Completorium", feast.weekday)) {
    results.push(...intonePortion(p));
  }

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

  for (const p of officePsalmPortions("Prima", feast.weekday)) {
    results.push(...intonePortion(p));
  }

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
  } else if (hour === "tertia" || hour === "sexta" || hour === "nona") {
    // The little hours: their portion of Ps 118 (Terce vv. 33–80, Sext 81–128,
    // None 129–176, from the extracted DO scheme), then the responsory breve.
    // The psalmody belongs to a specific day, so it is only included for a real
    // feast query — not the all-days survey scan (which has no date and would
    // repeat the psalms once per feast).
    if (feast.date) {
      const hourName = hour === "tertia" ? "Tertia" : hour === "sexta" ? "Sexta" : "Nona";
      for (const p of officePsalmPortions(hourName, feast.weekday)) {
        results.push(...intonePortion(p));
      }
    }
    const rb = resolveChant(
      hour === "tertia" ? day.respBreveTertia
        : hour === "sexta" ? day.respBreveSexta
          : day.respBreveNona,
    );
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
    results = SEASONAL_ORDO_HOURS.has(hour)
      ? feasts[0] ? chantsForFeastHour(feasts[0], hour) : []
      : feasts.flatMap((f) => chantsForFeastHour(f, hour));
  } else if (feasts) {
    const hours: CanonicalHour[] = [
      "matutinum", "laudes", "prima", "tertia", "sexta", "nona",
      "vesperae", "completorium",
    ];
    results = feasts.flatMap((f) => hours.flatMap((h) => chantsForFeastHour(f, h)));
  } else if (hour && SEASONAL_ORDO_HOURS.has(hour)) {
    // Prime and Compline are seasonal ordos, not per-feast. With no feast,
    // resolve for the default epoch (Guido d'Arezzo's era) — festum()'s anchor.
    const [feast] = getFeast();
    results = feast ? chantsForFeastHour(feast, hour) : [];
  } else if (hour) {
    // Hour without feast — survey per-feast content across all office entries.
    // mockFeast has no date, so the little hours return only their responsories.
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

  // The little hours and Compline are ordered ordos — their sequence IS the
  // content — so they keep assembly order unless the caller explicitly asks for
  // a sort. The other hours return a set of chants, sorted by incipit.
  const isOrderedOrdo = query.hora != null && ORDERED_ORDO_HOURS.has(query.hora);
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
