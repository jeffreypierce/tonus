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
import { feastKeptBy } from "./data/eras.js";
import {
  massesForRubric,
  CLASS_I_GRADES,
  CLASS_II_GRADES,
  CLASS_III_GRADES,
  type MassRubric,
} from "../chant/data/masses.js";
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
  TEMPORA,
  entryGrade,
  gradeOrder,
  BVM_FEAST_IDS,
  APOSTOLIC_FEAST_IDS,
  PENITENTIAL_SEASONS,
} from "./types.js";

const _calCache = new Map<number, Map<string, CalEntry[]>>();
const _anchorCache = new Map<number, RuleAnchors>();

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

// The Sunday-as-such grades. Per the canonical grade table, an ordinary Sunday is
// `semiduplex`, an Advent Sunday `semiduplex-ii`, a Lent Sunday `semiduplex-i` —
// so a day that is merely a Sunday is recognised by carrying one of these, while
// a feast that outranks the Sunday carries a duplex grade and takes its class.
const SUNDAY_GRADES: readonly Grade[] = [
  "semiduplex-i",
  "semiduplex-ii",
  "semiduplex",
];

/**
 * The Kyriale rubric this day falls under — the book classifies by RANK and
 * appoints one category per day [biblio: liber-usualis-1961, Kyriale].
 *
 * Order matters. "In Paschal Time" is a season rubric and governs inside
 * Paschaltide. The Sunday categories must be tested before the class tiers,
 * because the Sunday grades are the semiduplex variants — which would otherwise
 * be claimed by the I, II and III class tiers and hand a Lent Sunday a
 * first-class mass.
 *
 * An open editorial question: should a I class feast inside Paschaltide
 * (Ascension, Pentecost) reach for the I-class pair II/III instead of Lux et
 * Origo? The book's heading is unqualified, so Paschaltide wins here.
 */
function rubricForDay(
  id: string,
  grade: Grade,
  season: Season,
  date: Date,
): MassRubric {
  const isSunday = date.getUTCDay() === 0;
  const penitential = PENITENTIAL_SEASONS.has(season);

  // The book's own subject category outranks the season: a BVM feast in
  // Paschaltide is "For feasts of the Blessed Virgin", not "In Paschal Time" —
  // paschal-first left Cum jubilo unreachable for the whole of Eastertide.
  if (BVM_FEAST_IDS.has(id)) return "bvm";
  if (season === "pasc") return "paschal";

  if (isSunday && SUNDAY_GRADES.includes(grade)) {
    return penitential ? "sunday-penitential" : "sunday";
  }

  if (CLASS_I_GRADES.includes(grade)) return "class-i";
  if (CLASS_II_GRADES.includes(grade)) return "class-ii";
  if (CLASS_III_GRADES.includes(grade)) return "class-iii";
  if (grade === "simplex") return "commemoration";

  return penitential ? "feria-penitential" : "feria";
}

// The masses the day may sing: those the Kyriale appoints under its rubric, in
// the book's own numbering. Where a rubric names several — II class 1–5 — that
// numbering IS the invitation to choose, and ordinary.ts rotates among them.
//
// This replaced a `seasons ∩ grades ∩ days` intersection that returned every
// mass not positively excluded, which is how Easter came to be offered masses IV
// and V (appointed for the II class). See the header of chant/data/masses.ts.
function selectMasses(
  id: string,
  grade: Grade,
  season: Season,
  date: Date,
): number[] {
  return massesForRubric(rubricForDay(id, grade, season, date)).map(
    (m) => m.mass,
  );
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
    tempus: TEMPORA[season.code],
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
 * the default-epoch day (Guido d'Arezzo's era); for a filter-only query,
 * the liturgical year containing that epoch. Dates are UTC-canonical:
 * build them from ISO strings or `Date.UTC`.
 */
const FEAST_QUERY_KEYS = new Set([
  "date", "from", "to", "nomen", "season", "grade", "marian", "apostolic",
  "before",
]);

export function getFeast(query?: FeastQuery): Feast[] {
  // A bare Date is the natural guess, and it has no own enumerable keys — so
  // without this it would read as "no query" and quietly return the default
  // epoch, the same plausible-looking wrong answer the unknown-key guard below
  // exists to prevent. Say what was meant instead.
  if (query instanceof Date) {
    throw new Error(
      `festum: pass the date as a query — festum({ date }), not festum(date)`,
    );
  }

  if (!query || Object.keys(query).length === 0) {
    return feastsForDate(DEFAULT_EPOCH);
  }

  // Reject unknown keys rather than silently falling through to the default
  // epoch — `festum({ month: 12, day: 25 })` (a natural guess) would otherwise
  // return a plausible-looking wrong answer. Fail loudly on the typo instead.
  const unknown = Object.keys(query).filter((k) => !FEAST_QUERY_KEYS.has(k));
  if (unknown.length > 0) {
    throw new Error(
      `festum: unknown query key(s) ${unknown.map((k) => `"${k}"`).join(", ")} ` +
      `(expected ${[...FEAST_QUERY_KEYS].join(", ")})`,
    );
  }

  let results: Feast[];

  if (query.date) {
    if (!(query.date instanceof Date) || Number.isNaN(query.date.getTime()))
      throw new Error(
        `festum: date must be a Date — e.g. new Date("2026-12-25") (UTC-canonical)`,
      );
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

  // `before` resolves the day AS OF a year: feasts instituted later step aside,
  // and whatever ranked behind them — usually the temporale or the feria — wins
  // instead. The calendar DATA is untouched; this is a view over it, so a caller
  // asking for 1350 and a caller asking for 1962 read the same shipped table.
  // A day whose every candidate is later than `before` returns empty, which is
  // the honest answer: that day had no feast yet.
  if (query.before != null) {
    if (!Number.isFinite(query.before)) {
      throw new Error(`festum: before must be a year — e.g. festum({ date, before: 1350 })`);
    }
    results = results
      .filter((f) => feastKeptBy(f.id, query.before!))
      // Stamp the view on the survivors. The chant verbs read it back, so one
      // `before` at the calendar door carries through the whole day — the
      // calendar as of 1100 serves the repertoire attested by 1100, without
      // the caller saying the year twice. A `before` of their own overrides.
      .map((f) => ({ ...f, before: query.before! }));
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
