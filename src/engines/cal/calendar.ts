// ---------------------------------------------------------------------------
// engines/cal/calendar — liturgical feast lookup
// ---------------------------------------------------------------------------
// The era, and why it is what it is. The calendar's *structure* is medieval —
// the temporale from Advent through the season after Pentecost (Septuagesima
// included), the eight-hour office cursus, the duplex/semiduplex/simplex
// dignity system. The *data* is the Roman calendar as Divinum Officium
// [biblio: divinum-officium] gives it under the Divino Afflatu rubrics (1911,
// in the state of c. 1954): substantially continuous with late-medieval Roman
// usage, but carrying feasts instituted as late as the 1950s (Queenship of
// Mary 1954, Immaculate Heart 1944).
//
// Decision: those post-medieval feasts are KEPT, not pruned. Pruning would
// break the DO data's integrity and demand per-feast historical adjudication;
// instead tonus states its actual era plainly, and `festum({ before })` views
// the day as of an earlier year (./data/eras.ts). Precedence follows the same
// era: the Divino Afflatu ordering, simplified (see precedence below). The
// rank system is documented at `ritus`/`Grade` in ./types.ts; Easter
// reckoning at pascha() in ./date.ts.
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
  fixedAnchors,
  easterSunday,
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
  EXCLUDING_DAYS,
  BVM_FEAST_IDS,
  APOSTOLIC_FEAST_IDS,
  PENITENTIAL_SEASONS,
} from "./types.js";

const _calCache = new Map<number, Map<string, CalEntry[]>>();
const _anchorCache = new Map<number, RuleAnchors>();

export function getAnchors(year: number): RuleAnchors {
  if (_anchorCache.has(year)) return _anchorCache.get(year)!;

  const easter = easterSunday(year);
  const { christmas, epiphany, adventFirstSunday } = fixedAnchors(year);
  const anchors: RuleAnchors = {
    year,
    easter,
    ashWednesday: subDays(easter, 46),
    firstLentSunday: addDays(subDays(easter, 46), 4),
    septuagesima: subDays(easter, 63),
    pentecost: addDays(easter, 49),
    ascension: addDays(easter, 39),
    adventFirstSunday,
    gaudete: addDays(adventFirstSunday, 14),
    christmas,
    epiphany,
    // The Sunday after the Epiphany — the Holy Family's Sunday in this
    // calendar, the Baptism of the Lord in the modern one.
    baptism: firstSundayOnOrAfter(addDays(epiphany, 1)),
  };

  _anchorCache.set(year, anchors);
  return anchors;
}

/**
 * The movable anchors of civil year `year` (`tonus.pascha`). Easter is
 * computed by the Gregorian (Gauss/Butcher) computus from 1583 and by the
 * Julian computus with day-number conversion before that; everything else
 * anchors to it, except Advent (the Sunday on or after November 27) and the
 * fixed Christmas and Epiphany. Before the reform those fixed dates are Julian
 * calendar dates, returned — like every Date here — as proleptic-Gregorian
 * UTC midnights.
 */
export function getPascha(year: number): Pascha {
  if (typeof year !== "number") {
    throw new TypeError(
      `pascha: year must be a number, got ${typeof year} ${JSON.stringify(year)}`,
    );
  }
  if (!Number.isFinite(year)) {
    throw new RangeError(`pascha requires a finite year, got ${year}`);
  }
  const y = Math.trunc(year);
  if (y < 1) throw new RangeError(`pascha requires a year from AD 1, got ${year}`);
  const a = getAnchors(y);
  const d = (x: Date) => new Date(x.getTime());
  return {
    year: y,
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

  const map = new Map<string, CalEntry[]>();
  if (year >= 0) {
    const anchors = getAnchors(year);
    for (const entry of CAL) {
      for (const { key } of resolveEntryId(entry.id, year, anchors)) {
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(entry);
      }
    }
  }

  _calCache.set(year, map);
  return map;
}

// Season boundaries, by date (a feast's season is the season of its DAY, not
// of its stem — Ash Wednesday is Quadp3-3 but falls in `quad`, and the
// resumed Epiphany weeks of November fall in `pent`):
//   adv   Advent I Sunday          → Christmas (Dec 25)
//   nat   Christmas                → epiphanySunday (1st Sun after Epiphany)
//   epi   epiphanySunday           → Septuagesima (Easter − 63)
//   quadp Septuagesima Sunday      → Ash Wednesday (Easter − 46)
//   quad  Ash Wednesday            → Easter
//   pasc  Easter                   → trinitySunday (Pentecost + 7); the
//                                     Pentecost octave stays paschal
//   pent  trinitySunday            → that year's Advent I Sunday
function epiphanySunday(a: RuleAnchors): Date {
  return firstSundayOnOrAfter(addDays(a.epiphany, 1));
}

function trinitySunday(a: RuleAnchors): Date {
  return addDays(a.pentecost, 7);
}

function findSeason(date: Date): { code: Season; start: Date; end: Date } {
  const year = date.getUTCFullYear();
  // The anchors of three civil years cover any day: before the reform the
  // Julian Christmas of one year falls in the next Gregorian January.
  for (const y of [year - 1, year, year + 1]) {
    if (y < 0) continue;
    const a = getAnchors(y);
    const spans: [Season, Date, Date][] = [
      ["epi", epiphanySunday(a), a.septuagesima],
      ["quadp", a.septuagesima, a.ashWednesday],
      ["quad", a.ashWednesday, a.easter],
      ["pasc", a.easter, trinitySunday(a)],
      ["pent", trinitySunday(a), a.adventFirstSunday],
      ["adv", a.adventFirstSunday, a.christmas],
      ["nat", a.christmas, epiphanySunday(getAnchors(y + 1))],
    ];
    for (const [code, start, end] of spans) {
      if (date >= start && date < end) return { code, start, end };
    }
  }
  throw new Error(`findSeason: ${isoDate(date)} falls in no season`);
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

// Vigils the calendar data ranks plainly Simplex (as Divinum Officium does),
// so their grade does not say they are vigils. Every other lesser vigil carries
// the grade `vigilia`; a vigil ranked semiduplex or above (Christmas, the
// Epiphany, Pentecost) takes its class like any feast of that rank.
const SIMPLEX_VIGIL_IDS: ReadonlySet<string> = new Set([
  "06-23", // Vigil of St. John the Baptist
  "08-14", // Vigil of the Assumption
]);

/**
 * The Kyriale rubric this day falls under — the book classifies by RANK and
 * appoints one category per day [biblio: liber-usualis, Kyriale].
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

  // Mass XVIII is "for the ferias of Advent and Lent as well as for Vigils".
  // A vigil is not the feast it precedes, so this comes before the BVM test —
  // the Vigil of the Assumption was singing Cum jubilo. Paschaltide still
  // governs inside its own season, as for every other rubric below.
  const vigil = grade === "vigilia" || SIMPLEX_VIGIL_IDS.has(id);
  if (vigil && season !== "pasc") return "feria-penitential";

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

  // Mass XV is "for commemorations and ferias of the Christmas season". No day
  // of Christmastide is a bare feria in this calendar today — octaves and
  // saints fill it — but the book appoints XV there, not XVI.
  if (season === "nat") return "commemoration";

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
  // Every entry carries a ritus; "Feria" is a defensive floor only.
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

const isTemporale = (id: string) => !/^\d{2}-\d{2}$/.test(id);

/**
 * Same-day precedence: lower sorts first. A simplified Divino Afflatu table,
 * the rubrics of the shipped data:
 *
 *  1. The days that admit no feast at all (EXCLUDING_DAYS) lead whatever falls
 *     on them — Annunciation on Palm Sunday, St Joseph on a Lent Sunday.
 *  2. Otherwise the grade ladder (GRADE_ORDER), with the Sundays placed where
 *     the 1911 rubrics put them: a greater Sunday of the II class (Advent II–IV,
 *     the Septuagesima block) yields only to I-class feasts, an ordinary Sunday
 *     to I- and II-class feasts — so a Duplex majus no longer takes the Sunday.
 *  3. On a tie, the temporale before the sanctorale (Corpus Christi before
 *     the Nativity of St John).
 *
 * Not modelled: transfer. An impeded feast is listed after the day that
 * impedes it, not moved to its next free day; nor are the feasts of the Lord
 * that take an ordinary Sunday, or the finer occurrence tables.
 */
function precedence(entry: CalEntry, date: Date): number {
  const id = entry.id;
  const grade = entryGrade(id, entry.ritus ?? "Feria");
  if (EXCLUDING_DAYS.has(id)) return -1;
  let p = gradeOrder(grade);
  if (isTemporale(id) && date.getUTCDay() === 0) {
    if (grade === "semiduplex-ii") p = gradeOrder("duplex-ii") - 0.5;
    else p = Math.min(p, gradeOrder("semiduplex-ii") + 0.5);
  }
  return p;
}

function byPrecedence(date: Date) {
  return (a: CalEntry, b: CalEntry) =>
    precedence(a, date) - precedence(b, date) ||
    Number(isTemporale(b.id)) - Number(isTemporale(a.id));
}

function feastsForDate(date: Date): Feast[] {
  const d = startOfDay(date);
  const key = isoDate(d);
  const year = d.getUTCFullYear();
  // Entries of a neighbouring civil year can land on this day: the Holy Name
  // (Nat2-0) belongs to the previous year's Christmas cycle, and before the
  // reform a Julian late December falls in the Gregorian January (and, before
  // AD 200, a Julian January 1 in the Gregorian December before it).
  const entries = [year, year - 1, year + 1].flatMap(
    (y) => buildCalendar(y).get(key) ?? [],
  );
  if (!entries.length) return [];
  entries.sort(byPrecedence(d));
  const season = findSeason(d);
  return entries.map((e) => calEntryToFeast(e, season, d));
}

const FEAST_QUERY_KEYS = new Set([
  "date", "from", "to", "nomen", "season", "grade", "marian", "apostolic",
  "before",
]);

function assertDate(value: unknown, key: string): asserts value is Date {
  if (!(value instanceof Date) || Number.isNaN(value.getTime()))
    throw new Error(
      `festum: ${key} must be a Date — e.g. new Date("2026-12-25") (UTC-canonical)`,
    );
  if (value.getUTCFullYear() < 1)
    throw new RangeError(`festum: ${key} must fall in AD 1 or later`);
}

/**
 * Calendar lookup (`tonus.festum`). Returns matching feasts sorted by day,
 * and within a day by precedence (see `precedence`) — for a date, the
 * leading entry plus the others falling on it; for a `from`/`to` range,
 * every day flattened; with no query, the default-epoch day (Guido
 * d'Arezzo's era); for a filter-only query, the liturgical year containing
 * that epoch. Dates are UTC-canonical, proleptic Gregorian: build them from
 * ISO strings or `Date.UTC` (years from 100; below that, setUTCFullYear).
 */
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

  const ranged = query.from != null || query.to != null;
  if (query.date != null && ranged) {
    throw new Error("festum: give either date or from/to, not both");
  }
  if (query.nomen != null && (typeof query.nomen !== "string" || query.nomen === "")) {
    throw new Error(`festum: nomen must be a non-empty string — e.g. festum({ nomen: "Adventus" })`);
  }
  if (query.before != null && !Number.isFinite(query.before)) {
    throw new Error(`festum: before must be a year — e.g. festum({ date, before: 1350 })`);
  }

  let results: Feast[];

  if (query.date != null) {
    assertDate(query.date, "date");
    results = feastsForDate(query.date);
  } else if (ranged) {
    if (query.from == null || query.to == null) {
      throw new RangeError("festum range requires both from and to");
    }
    assertDate(query.from, "from");
    assertDate(query.to, "to");
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

  // Already day-ascending and, within a day, in precedence order: every branch
  // above walks the days in order and feastsForDate sorts each one.
  return results;
}
