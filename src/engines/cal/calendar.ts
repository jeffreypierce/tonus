// ---------------------------------------------------------------------------
// engines/cal/calendar — liturgical feast lookup
// ---------------------------------------------------------------------------
import { CAL, type CalEntry } from "../../data/cal.js";
import { MASSES } from "../../data/masses.js";
import {
  isoDate,
  startOfDay,
  addDays,
  subDays,
  firstSundayOnOrAfter,
  nextSunday,
  pascha,
  resolveEntryId,
  type RuleAnchors,
} from "./date.js";
import {
  type Feast,
  type FeastQuery,
  type Season,
  type Rank,
  SEASON_LABELS,
  RANK_LABELS,
  BVM_FEAST_IDS,
  APOSTOLIC_FEAST_IDS,
} from "./types.js";

const _calCache = new Map<number, Map<string, CalEntry[]>>();
const _anchorCache = new Map<number, RuleAnchors>();

// Preferred mass order; ad libitum (mass 0) is handled separately in ordinary.ts.
const DEFAULT_MASSES = [
  8, 9, 11, 1, 2, 3, 4, 5, 6, 7, 10, 12, 13, 14, 15, 16, 17, 18,
];

export function getAnchors(year: number): RuleAnchors {
  if (_anchorCache.has(year)) return _anchorCache.get(year)!;

  const easter = startOfDay(pascha(year));
  const anchors: RuleAnchors = {
    year,
    easter,
    ashWednesday: subDays(easter, 46),
    firstLentSunday: addDays(subDays(easter, 46), 4),
    septuagesima: subDays(easter, 63),
    pentecost: addDays(easter, 49),
    ascension: addDays(easter, 39),
    adventFirstSunday: firstSundayOnOrAfter(new Date(Date.UTC(year, 10, 27))),
    gaudete: addDays(firstSundayOnOrAfter(new Date(Date.UTC(year, 10, 27))), 14),
    christmas: new Date(Date.UTC(year, 11, 25)),
    epiphany: new Date(Date.UTC(year, 0, 6)),
    baptism: nextSunday(new Date(Date.UTC(year, 0, 7))),
  };

  _anchorCache.set(year, anchors);
  return anchors;
}

export function buildCalendar(year: number): Map<string, CalEntry[]> {
  if (_calCache.has(year)) return _calCache.get(year)!;

  const anchors = getAnchors(year);
  const map = new Map<string, CalEntry[]>();

  for (const entry of CAL) {
    for (const { key } of resolveEntryId(entry.id, year, anchors)) {
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(entry);
    }
  }

  // Lower rank number means higher priority.
  for (const list of map.values()) list.sort((a, b) => a.rank - b.rank);

  _calCache.set(year, map);
  return map;
}

function findSeason(date: Date): { code: Season; start: Date; end: Date } {
  const year = date.getUTCFullYear();
  const a = getAnchors(year);
  const prev = getAnchors(year - 1);
  const next = getAnchors(year + 1);

  const s = (code: Season, start: Date, end: Date) => ({
    code,
    start: startOfDay(start),
    end: startOfDay(end),
  });

  if (date >= next.adventFirstSunday && date < next.christmas)
    return s("ad", next.adventFirstSunday, next.christmas);
  if (date >= a.adventFirstSunday && date < a.christmas)
    return s("ad", a.adventFirstSunday, a.christmas);
  if (date >= prev.christmas && date < a.baptism)
    return s("ct", prev.christmas, a.baptism);
  if (date >= a.christmas && date < next.baptism)
    return s("ct", a.christmas, next.baptism);
  if (date >= a.baptism && date < a.septuagesima)
    return s("ot", a.baptism, a.septuagesima);
  if (date >= a.septuagesima && date < a.ashWednesday)
    return s("sg", a.septuagesima, a.ashWednesday);
  if (date >= a.ashWednesday && date < a.easter)
    return s("lt", a.ashWednesday, a.easter);
  if (date >= a.easter && date < a.pentecost)
    return s("ea", a.easter, a.pentecost);
  if (date >= a.pentecost && date < next.adventFirstSunday)
    return s("ap", a.pentecost, next.adventFirstSunday);

  return s("ot", prev.pentecost, a.septuagesima);
}

function selectMasses(feast: CalEntry, season: Season, date: Date): number[] {
  const dowCode = date.getUTCDay() === 0 ? "dominica" : "feria";
  const requireBvm = BVM_FEAST_IDS.has(feast.id);
  const desiredRank = feast.rank;
  // Treat "ot" and "ap" as equivalent (both Ordinary Time).
  const normSeason = (s: string) => (s === "ap" ? "ot" : s);
  const sc = normSeason(season);

  const matches: number[] = [];
  for (const num of DEFAULT_MASSES) {
    const mass = MASSES.get(num);
    if (!mass) continue;
    if (requireBvm !== mass.bvm) continue;
    const hasSeasonMatch = mass.seasons.some((s) => normSeason(s) === sc);
    if (!hasSeasonMatch) continue;
    if (!mass.ranks.includes(desiredRank)) continue;
    if (!mass.days.includes(dowCode)) continue;
    matches.push(num);
  }

  return matches;
}

function calEntryToFeast(
  entry: CalEntry,
  season: ReturnType<typeof findSeason>,
  d: Date,
): Feast {
  const id = entry.id ?? "";
  return {
    id,
    name: entry.name,
    rank: entry.rank as Rank,
    rankLabel: RANK_LABELS[entry.rank as Rank] ?? "Feria",
    gradus: entry.gradus ?? RANK_LABELS[entry.rank as Rank] ?? "Feria",
    season: season.code,
    seasonLabel: SEASON_LABELS[season.code],
    seasonStart: season.start,
    seasonEnd: season.end,
    date: d,
    weekday: d.getUTCDay(),
    masses: selectMasses(entry, season.code, d),
    marian: BVM_FEAST_IDS.has(id),
    apostolic: APOSTOLIC_FEAST_IDS.has(id),
  };
}

function feastsForDate(date: Date): Feast[] {
  const d = startOfDay(date);
  const season = findSeason(d);
  const key = isoDate(d);
  const entries = buildCalendar(d.getUTCFullYear()).get(key);
  if (!entries?.length) return [];
  return entries.map((e) => calEntryToFeast(e, season, d));
}

/**
 * Calendar lookup (`tonus.festum`). Returns matching feasts sorted
 * `day asc, rank desc` — for a date, the primary feast plus concurrent
 * feasts; for a `from`/`to` range, every day flattened; with no query,
 * the current liturgical year. Dates are UTC-canonical: build them from
 * ISO strings or `Date.UTC`.
 */
export function getFeast(query?: FeastQuery): Feast[] {
  if (!query || Object.keys(query).length === 0) {
    return feastsForDate(new Date());
  }

  let results: Feast[];

  if (query.date) {
    results = feastsForDate(query.date);
  } else if (query.from != null || query.to != null) {
    if (query.from == null || query.to == null) {
      throw new RangeError("festum range requires both from and to");
    }
    if (query.to.getTime() < query.from.getTime()) {
      throw new RangeError("festum range: to must be >= from");
    }
    results = [];
    let d = startOfDay(query.from);
    const end = startOfDay(query.to);
    while (d <= end) {
      results.push(...feastsForDate(d));
      d = addDays(d, 1);
    }
  } else {
    // Full calendar scan for the current liturgical year range
    const now = new Date();
    const year = now.getUTCFullYear();
    const anchors = getAnchors(year);
    const startDate = anchors.adventFirstSunday;
    const endAnchors = getAnchors(year + 1);
    const endDate = endAnchors.adventFirstSunday;

    results = [];
    let d = startDate;
    while (d < endDate) {
      results.push(...feastsForDate(d));
      d = addDays(d, 1);
    }
  }

  if (query.name) {
    const n = query.name.toLowerCase();
    results = results.filter((f) => f.name.toLowerCase().includes(n));
  }
  if (query.season) {
    results = results.filter((f) => f.season === query.season);
  }
  if (query.rank !== undefined) {
    results = results.filter((f) => f.rank === query.rank);
  }
  if (query.marian !== undefined) {
    results = results.filter((f) => f.marian === query.marian);
  }
  if (query.apostolic !== undefined) {
    results = results.filter((f) => f.apostolic === query.apostolic);
  }

  // Sort: day asc, rank desc (lower rank number = higher priority, so asc)
  results.sort(
    (a, b) => a.date.getTime() - b.date.getTime() || a.rank - b.rank,
  );

  return results;
}
