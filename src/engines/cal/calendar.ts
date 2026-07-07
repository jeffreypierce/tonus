// ---------------------------------------------------------------------------
// engines/cal/calendar — liturgical feast lookup
// ---------------------------------------------------------------------------
// The era, and why it is what it is. The calendar's *structure* is medieval —
// the temporale from Advent through the season after Pentecost (Septuagesima
// included), the eight-hour office cursus, the duplex/semiduplex/simplex
// dignity system. The *data* is the Tridentine codification (1570–1962) drawn
// from Divinum Officium [biblio: divinum-officium], substantially continuous
// with late-medieval Roman usage but carrying feasts instituted as late as the
// 1950s (Queenship of Mary 1954, Immaculate Heart 1944).
//
// Decision: those post-medieval feasts are KEPT, not pruned. Pruning would
// break the DO data's integrity and demand per-feast historical adjudication;
// instead tonus states its actual era plainly. The honest description is
// "Tridentine Roman, continuous with medieval practice" — not "a medieval
// calendar." (Per-feast era metadata — medieval / tridentine / modern — is
// noted as future work.) The rank system this data carries is documented at
// `ritus`/`Grade` in ./types.ts; Easter reckoning at pascha() in ./date.ts.
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
  DEFAULT_EPOCH,
  type RuleAnchors,
} from "./date.js";
import {
  type Feast,
  type FeastQuery,
  type Pascha,
  type Season,
  type Grade,
  TEMPUS_NAMES,
  entryGrade,
  gradeOrder,
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
  const advent1 = firstSundayOnOrAfter(new Date(Date.UTC(year, 10, 27)));
  const anchors: RuleAnchors = {
    year,
    easter,
    ashWednesday: subDays(easter, 46),
    firstLentSunday: addDays(subDays(easter, 46), 4),
    septuagesima: subDays(easter, 63),
    pentecost: addDays(easter, 49),
    ascension: addDays(easter, 39),
    adventFirstSunday: advent1,
    gaudete: addDays(advent1, 14),
    christmas: new Date(Date.UTC(year, 11, 25)),
    epiphany: new Date(Date.UTC(year, 0, 6)),
    baptism: nextSunday(new Date(Date.UTC(year, 0, 7))),
  };

  _anchorCache.set(year, anchors);
  return anchors;
}

/**
 * The movable anchors of a liturgical year (`tonus.pascha`). Easter is
 * computed by the Gregorian (Gauss/Butcher) computus from 1583 and by the
 * Julian computus with day-number conversion before that; everything else
 * anchors to it, except Advent, which anchors to November 27.
 */
export function getPascha(year: number): Pascha {
  if (!Number.isFinite(year)) {
    throw new RangeError(`pascha requires a finite year, got ${year}`);
  }
  const a = getAnchors(Math.trunc(year));
  const d = (x: Date) => new Date(x.getTime());
  return {
    year: Math.trunc(year),
    septuagesima: d(a.septuagesima),
    ashWednesday: d(a.ashWednesday),
    firstLentSunday: d(a.firstLentSunday),
    palmSunday: subDays(a.easter, 7),
    goodFriday: subDays(a.easter, 2),
    easter: d(a.easter),
    ascension: d(a.ascension),
    pentecost: d(a.pentecost),
    trinitySunday: addDays(a.pentecost, 7),
    corpusChristi: addDays(a.pentecost, 11),
    adventFirstSunday: d(a.adventFirstSunday),
    gaudete: d(a.gaudete),
    christmas: d(a.christmas),
    epiphany: d(a.epiphany),
    baptism: d(a.baptism),
  };
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
  for (const list of map.values())
    list.sort((a, b) => entryGradeOrder(a) - entryGradeOrder(b));

  _calCache.set(year, map);
  return map;
}

// Season boundaries follow the Divinum Officium Tempora stems exactly, so a
// date's season always matches the stem of any Tempora feast that falls on it
// (asserted by the stem↔season test):
//   adv   Advent I Sunday          → Christmas (Dec 25)
//   nat   Christmas                → epiphanySunday (1st Sun after Epiphany)
//   epi   epiphanySunday           → Septuagesima (Easter − 63)
//   quadp Septuagesima Sunday      → Ash Wednesday (Easter − 46)
//   quad  Ash Wednesday            → Easter
//   pasc  Easter                   → trinitySunday (Pentecost + 7); the
//                                     Pentecost octave stays paschal
//   pent  trinitySunday            → next Advent I Sunday
// Epi and Nat both anchor on firstSundayOnOrAfter(feast+1) in
// resolveTemporaStem; epiphanySunday is that boundary between them.
function epiphanySunday(a: RuleAnchors): Date {
  return firstSundayOnOrAfter(addDays(a.epiphany, 1));
}

function trinitySunday(a: RuleAnchors): Date {
  return addDays(a.pentecost, 7);
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
    return s("adv", next.adventFirstSunday, next.christmas);
  if (date >= a.adventFirstSunday && date < a.christmas)
    return s("adv", a.adventFirstSunday, a.christmas);
  if (date >= prev.christmas && date < epiphanySunday(a))
    return s("nat", prev.christmas, epiphanySunday(a));
  if (date >= a.christmas && date < epiphanySunday(next))
    return s("nat", a.christmas, epiphanySunday(next));
  if (date >= epiphanySunday(a) && date < a.septuagesima)
    return s("epi", epiphanySunday(a), a.septuagesima);
  if (date >= a.septuagesima && date < a.ashWednesday)
    return s("quadp", a.septuagesima, a.ashWednesday);
  if (date >= a.ashWednesday && date < a.easter)
    return s("quad", a.ashWednesday, a.easter);
  if (date >= a.easter && date < trinitySunday(a))
    return s("pasc", a.easter, trinitySunday(a));
  if (date >= trinitySunday(a) && date < next.adventFirstSunday)
    return s("pent", trinitySunday(a), next.adventFirstSunday);

  return s("epi", epiphanySunday(a), a.septuagesima);
}

function selectMasses(
  id: string,
  grade: Grade,
  season: Season,
  date: Date,
): number[] {
  const dowCode = date.getUTCDay() === 0 ? "dominica" : "feria";
  const requireBvm = BVM_FEAST_IDS.has(id);

  const matches: number[] = [];
  for (const num of DEFAULT_MASSES) {
    const mass = MASSES.get(num);
    if (!mass) continue;
    if (requireBvm !== mass.bvm) continue;
    if (!mass.seasons.includes(season)) continue;
    if (!mass.grades.includes(grade)) continue;
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
  // All 642 entries carry a ritus; "Feria" is a defensive floor only.
  const ritus = entry.ritus ?? "Feria";
  const grade = entryGrade(id, ritus);
  return {
    id,
    nomen: entry.name,
    ritus,
    grade,
    season: season.code,
    tempus: TEMPUS_NAMES[season.code],
    seasonStart: season.start,
    seasonEnd: season.end,
    date: d,
    weekday: d.getUTCDay(),
    masses: selectMasses(id, grade, season.code, d),
    marian: BVM_FEAST_IDS.has(id),
    apostolic: APOSTOLIC_FEAST_IDS.has(id),
  };
}

// Precedence order of a raw CalEntry (for same-day sorting before conversion).
function entryGradeOrder(entry: CalEntry): number {
  return gradeOrder(entryGrade(entry.id, entry.ritus ?? "Feria"));
}

function feastsForDate(date: Date): Feast[] {
  const d = startOfDay(date);
  const key = isoDate(d);
  const year = d.getUTCFullYear();
  // Tempora anchored in the previous year can spill into January (e.g.
  // Nat2-0, the Sunday of the Holy Name), so the prior year's calendar is
  // consulted too.
  const entries = [
    ...(buildCalendar(year).get(key) ?? []),
    ...(buildCalendar(year - 1).get(key) ?? []),
  ];
  if (!entries.length) return [];
  entries.sort((a, b) => entryGradeOrder(a) - entryGradeOrder(b));
  const season = findSeason(d);
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
    return feastsForDate(DEFAULT_EPOCH);
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
    // Full calendar scan for the default liturgical year range (the year
    // containing DEFAULT_EPOCH — Guido d'Arezzo's era). The liturgical year
    // begins at Advent, so before Advent the range anchors to the previous
    // civil year's first Advent Sunday.
    const today = startOfDay(DEFAULT_EPOCH);
    let year = today.getUTCFullYear();
    if (today < getAnchors(year).adventFirstSunday) year -= 1;
    const startDate = getAnchors(year).adventFirstSunday;
    const endDate = getAnchors(year + 1).adventFirstSunday;

    results = [];
    let d = startDate;
    while (d < endDate) {
      results.push(...feastsForDate(d));
      d = addDays(d, 1);
    }
  }

  if (query.nomen) {
    const n = query.nomen.toLowerCase();
    results = results.filter((f) => f.nomen.toLowerCase().includes(n));
  }
  if (query.season) {
    results = results.filter((f) => f.season === query.season);
  }
  if (query.grade !== undefined) {
    results = results.filter((f) => f.grade === query.grade);
  }
  if (query.marian !== undefined) {
    results = results.filter((f) => f.marian === query.marian);
  }
  if (query.apostolic !== undefined) {
    results = results.filter((f) => f.apostolic === query.apostolic);
  }

  // Sort: day asc, rank desc (lower rank number = higher priority, so asc)
  results.sort(
    (a, b) =>
      a.date.getTime() - b.date.getTime() ||
      gradeOrder(a.grade) - gradeOrder(b.grade),
  );

  return results;
}
