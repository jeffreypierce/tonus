// ---------------------------------------------------------------------------
// engines/cal/date — date math, computus, and liturgical calendar rule resolution
// ---------------------------------------------------------------------------

// ── Anchor shape ──
export interface RuleAnchors {
  year: number;
  easter: Date;
  ashWednesday: Date;
  firstLentSunday: Date;
  septuagesima: Date;
  pentecost: Date;
  ascension: Date;
  adventFirstSunday: Date;
  gaudete: Date;
  christmas: Date;
  epiphany: Date;
  baptism: Date;
}

// Re-exported for cal consumers; the canonical definition and rationale live
// in engines/epoch.
export { DEFAULT_EPOCH } from "../epoch.js";

// ── Date math ──
/**
 * UTC midnight of a proleptic-Gregorian day. `Date.UTC` reads years 0–99 as
 * 1900–1999, so `Date.UTC(33, 3, 5)` is 1933; setUTCFullYear takes the year
 * as given.
 */
export function utc(year: number, monthIndex: number, day: number): Date {
  const d = new Date(0);
  d.setUTCFullYear(year, monthIndex, day);
  return d;
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function startOfDay(date: Date): Date {
  // Canonical form is UTC midnight, so dates from ISO strings like
  // new Date("2025-12-25") behave identically in every timezone.
  return utc(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function subDays(date: Date, days: number): Date {
  return addDays(date, -days);
}

export function firstSundayOnOrAfter(date: Date): Date {
  const d = startOfDay(date);
  return addDays(d, (7 - d.getUTCDay()) % 7);
}

// ── The civil frame ──
// Every Date tonus returns is a proleptic-Gregorian UTC midnight. The books
// date their fixed feasts by the calendar in force, so before the reform a
// "March 25" is a JULIAN March 25: Thursday 4 October 1582 (Julian) was
// followed by Friday 15 October 1582 (Gregorian). civilDate maps a calendar
// label to its day under that rule, and gives null for the ten labels the
// reform skipped. Easter makes the same split (pascha below), so the fixed and
// the movable cycles stay in one frame.
const REFORM_YEAR = 1582;
const REFORM_MONTH = 9; // October, zero-based
const LAST_JULIAN_DAY = 4;
const FIRST_GREGORIAN_DAY = 15;

export function civilDate(
  year: number,
  monthIndex: number,
  day: number,
): Date | null {
  const julian =
    year < REFORM_YEAR ||
    (year === REFORM_YEAR &&
      (monthIndex < REFORM_MONTH ||
        (monthIndex === REFORM_MONTH && day <= LAST_JULIAN_DAY)));
  if (julian) return julianToGregorian(year, monthIndex + 1, day);
  if (
    year === REFORM_YEAR &&
    monthIndex === REFORM_MONTH &&
    day < FIRST_GREGORIAN_DAY
  )
    return null;
  return utc(year, monthIndex, day);
}

/** civilDate for a label that is never one of the ten skipped days. */
function civilAnchor(year: number, monthIndex: number, day: number): Date {
  return civilDate(year, monthIndex, day)!;
}

/** Leap year by the calendar in force for that February. */
export function isBissextile(year: number): boolean {
  if (year <= REFORM_YEAR) return year % 4 === 0;
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// ── Easter ──
// Split at the Gregorian reform (1583): from 1583 on, the Gauss/Butcher
// Gregorian computus; before it, the classical 19-year Julian cycle with a
// Julian→Gregorian day-number conversion [biblio: computus]. This keeps Easter
// correct for date queries reaching back into the medieval period — the era the
// calendar is built for (see the era note in ./calendar.ts).
export function pascha(year: number): Date {
  if (!Number.isInteger(year) || year < 1) {
    throw new RangeError(`pascha requires a year from AD 1, got ${year}`);
  }
  return easterSunday(year);
}

/** Easter without the public guard: the calendar also reads year 0, whose
 *  Christmas spills into AD 1. */
export function easterSunday(year: number): Date {
  if (year < 1583) return paschaJulian(year);
  const t = Math.trunc;
  const G = year % 19;
  const C = t(year / 100);
  const H = (C - t(C / 4) - t((8 * C + 13) / 25) + 19 * G + 15) % 30;
  const I = H - t(H / 28) * (1 - t(29 / (H + 1)) * t((21 - G) / 11));
  const J = (year + t(year / 4) + I + 2 - C + t(C / 4)) % 7;
  const L = I - J;
  const month = 3 + t((L + 40) / 44);
  const day = L + 28 - 31 * t(month / 4);
  return utc(year, month - 1, day);
}

function paschaJulian(year: number): Date {
  const a = year % 4,
    b = year % 7,
    c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;
  return julianToGregorian(year, month, day);
}

function julianToJdn(year: number, month: number, day: number): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083
  );
}

function julianToGregorian(y: number, m: number, d: number): Date {
  const jdn = julianToJdn(y, m, d);
  let l = jdn + 68569;
  const n = Math.floor((4 * l) / 146097);
  l -= Math.floor((146097 * n + 3) / 4);
  const i = Math.floor((4000 * (l + 1)) / 1461001);
  l = l - Math.floor((1461 * i) / 4) + 31;
  const j = Math.floor((80 * l) / 2447);
  const day = l - Math.floor((2447 * j) / 80);
  l = Math.floor(j / 11);
  const month = j + 2 - 12 * l;
  const year = 100 * (n - 49) + i + l;
  return utc(year, month - 1, day);
}

/** The fixed anchors of civil year `year`, in the civil frame above. */
export function fixedAnchors(year: number): {
  christmas: Date;
  epiphany: Date;
  adventFirstSunday: Date;
} {
  return {
    christmas: civilAnchor(year, 11, 25),
    epiphany: civilAnchor(year, 0, 6),
    adventFirstSunday: firstSundayOnOrAfter(civilAnchor(year, 10, 27)),
  };
}

// ── Rule resolution ──
export interface Placement {
  date: Date;
  key: string; // isoDate
}

function place(date: Date): Placement {
  return { date, key: isoDate(date) };
}

/**
 * The Sunday within the Christmas octave (Nat1-0), by the Divino Afflatu rule:
 * the Sunday falling Dec 29–31; when the Sunday falls Dec 26–28, or Christmas
 * itself is the Sunday, its office is said on Dec 30.
 */
function sundayWithinChristmasOctave(year: number): Date {
  const dec29 = civilAnchor(year, 11, 29);
  const sunday = firstSundayOnOrAfter(dec29);
  return sunday <= addDays(dec29, 2) ? sunday : addDays(dec29, 1);
}

/**
 * The Holy Name of Jesus (Nat2-0): the Sunday between the Circumcision and
 * the Epiphany, Jan 2–5; when there is none, Jan 2.
 */
function holyNameOfJesus(year: number): Date {
  const jan2 = civilAnchor(year + 1, 0, 2);
  const sunday = firstSundayOnOrAfter(jan2);
  return sunday <= addDays(jan2, 3) ? sunday : jan2;
}

export function resolveEntryId(
  id: string,
  year: number,
  anchors: RuleAnchors,
): Placement[] {
  const fixed = id.match(/^(\d{2})-(\d{2})$/);
  if (fixed) {
    const month = Number(fixed[1]);
    let day = Number(fixed[2]);
    // The bissextile day is doubled after Feb 23, so in a leap year the feasts
    // of Feb 24–28 are kept a day later — St Matthias on the 25th.
    if (month === 2 && day >= 24 && isBissextile(year)) day += 1;
    const date = civilDate(year, month - 1, day);
    return date ? [place(date)] : [];
  }

  // The Christmas-octave days are DATE-stemmed, not week-stemmed:
  // Nat26–Nat31 = Dec 26–31 ("Diei VI infra Octavam Nativitatis"). Dec 30
  // has no saint, so without Nat30 the date resolved to nothing at all. The
  // Sunday within the octave takes the octave day it falls on.
  const nat = id.match(/^Nat(2[6-9]|3[01])$/);
  if (nat) {
    const date = civilAnchor(year, 11, Number(nat[1]));
    if (date.getTime() === sundayWithinChristmasOctave(year).getTime()) return [];
    return [place(date)];
  }
  if (id === "Nat1-0") return [place(sundayWithinChristmasOctave(year))];
  if (id === "Nat2-0") return [place(holyNameOfJesus(year))];

  const m = id.match(/^([A-Za-z]+)(\d+)-(\d+)$/);
  if (!m) throw new Error(`Unrecognized tempora stem: ${id}`);
  const prefix = m[1];
  const week = parseInt(m[2], 10);
  const weekday = parseInt(m[3], 10);

  // The season after Pentecost is ELASTIC (23–28 Sundays), and the book's
  // rule is not linear: DO's Pent24 is "Dominica XXIV et ultima" — ALWAYS
  // the last Sunday before Advent — and the surplus Sundays between the 23rd
  // and the last resume the post-Epiphany Sundays omitted in January, in
  // their order, ending at the sixth. Linear placement stranded the November
  // tail with no tempora at all (the 11-18 / 11-27 / 11-28 holes of 2026).
  const lastSunday = addDays(anchors.adventFirstSunday, -7);
  const sundaysAfterPentecost = Math.round(
    (lastSunday.getTime() - anchors.pentecost.getTime()) / (7 * 86400000),
  );

  if (prefix === "Pent") {
    // Dominica ultima: anchored to Advent, not to Pentecost.
    if (week === 24) return [place(addDays(lastSunday, weekday))];
    // In a 23-Sunday year the ultima falls ON the 23rd slot and sings the
    // 24th's mass — the 23rd steps aside rather than double-booking the day.
    if (week >= sundaysAfterPentecost) return [];
    return [place(addDays(anchors.pentecost, week * 7 + weekday))];
  }

  if (prefix === "Adv") {
    // The fourth week of Advent is cut short by Christmas: in a year when
    // Advent IV falls on Dec 19–24, its later ferias never happen.
    const date = resolveTemporaStem(id, anchors);
    return date < anchors.christmas ? [place(date)] : [];
  }

  if (prefix === "Epi") {
    const placements: Placement[] = [];
    // The January placement, until Septuagesima closes the season: in an
    // early-Easter year the later weeks are omitted here…
    const january = resolveTemporaStem(id, anchors);
    if (january < anchors.septuagesima) placements.push(place(january));
    // …and, in a long year, resumed in autumn: with S Sundays after
    // Pentecost, the surplus g = S − 24 weeks between the 23rd and the
    // ultima take Epi(7−g) … Epi6, in their order.
    const surplus = sundaysAfterPentecost - 24;
    if (surplus > 0 && week >= 7 - surplus && week <= 6) {
      const sundayIndex = 24 + (week - (7 - surplus));
      placements.push(
        place(addDays(anchors.pentecost, sundayIndex * 7 + weekday)),
      );
    }
    return placements;
  }

  return [place(resolveTemporaStem(id, anchors))];
}

function resolveTemporaStem(stem: string, anchors: RuleAnchors): Date {
  // Stem format: PREFIX + week + "-" + weekday (0=Sun … 6=Sat)
  // e.g. Adv1-0, Pasc3-4, Pent12-2, Quad2-5, Quadp1-0, Epi1-0 (Nat1-0 and
  // Nat2-0 have rules of their own, in resolveEntryId)
  const m = stem.match(/^([A-Za-z]+)(\d+)-(\d+)$/);
  if (!m) throw new Error(`Unrecognized tempora stem: ${stem}`);
  const prefix = m[1];
  const week = parseInt(m[2], 10);
  const weekday = parseInt(m[3], 10);

  let base: Date;
  switch (prefix) {
    case "Adv":
      base = addDays(anchors.adventFirstSunday, (week - 1) * 7);
      break;
    case "Epi":
      base = firstSundayOnOrAfter(addDays(anchors.epiphany, 1));
      if (week > 1) base = addDays(base, (week - 1) * 7);
      break;
    case "Quadp":
      // Quadp1-0 = Septuagesima Sunday
      base = addDays(anchors.septuagesima, (week - 1) * 7);
      break;
    case "Quad":
      // Quad1-0 = first Sunday of Lent (4 days after Ash Wednesday)
      base = addDays(anchors.ashWednesday, 4 + (week - 1) * 7);
      break;
    case "Pasc":
      // Pasc0-0 = Easter Sunday; Pasc1-0 = +7, etc.
      base = addDays(anchors.easter, week * 7);
      break;
    case "Pent":
      // Pent01-0 = Trinity Sunday (Pentecost + 7 days)
      base = addDays(anchors.pentecost, week * 7);
      break;
    default:
      throw new Error(`Unknown tempora prefix: ${prefix}`);
  }
  return addDays(base, weekday);
}

/** For a tempora weekday ID like "Adv1-3", return the Sunday "Adv1-0". Null for non-tempora or already a Sunday. */
export function temporaSundayId(id: string): string | null {
  const m = id.match(/^([A-Za-z]+\d+)-([1-6])$/);
  return m ? `${m[1]}-0` : null;
}
