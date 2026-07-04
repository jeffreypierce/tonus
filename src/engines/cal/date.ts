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
// in engines/epoch (it is shared with the planet engine).
export { DEFAULT_EPOCH } from "../epoch.js";

// ── Date math ──
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function startOfDay(date: Date): Date {
  // Canonical form is UTC midnight, so dates from ISO strings like
  // new Date("2025-12-25") behave identically in every timezone.
  const y = date.getUTCFullYear(),
    m = date.getUTCMonth(),
    d = date.getUTCDate();
  return new Date(Date.UTC(y, m, d));
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

export function nextSunday(date: Date): Date {
  const d = startOfDay(date);
  return addDays(d, (7 - d.getUTCDay()) % 7 || 7);
}

export function parseMonthDay(year: number, mmdd: string): Date {
  const [m, d] = mmdd.split("-").map(Number);
  if (!m || !d) throw new Error(`Invalid month-day: ${mmdd}`);
  return new Date(Date.UTC(year, m - 1, d));
}

// ── Easter ──
export function pascha(year: number): Date {
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
  return new Date(Date.UTC(year, month - 1, day));
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
  return new Date(Date.UTC(year, month - 1, day));
}

// ── Rule resolution ──
export interface Placement {
  date: Date;
  key: string; // isoDate
}

function place(date: Date): Placement {
  return { date, key: isoDate(date) };
}

export function resolveEntryId(
  id: string,
  year: number,
  anchors: RuleAnchors,
): Placement[] {
  if (/^\d{2}-\d{2}$/.test(id)) {
    return [place(startOfDay(parseMonthDay(year, id)))];
  }
  return [place(resolveTemporaStem(id, anchors))];
}

function resolveTemporaStem(stem: string, anchors: RuleAnchors): Date {
  // Stem format: PREFIX + week + "-" + weekday (0=Sun … 6=Sat)
  // e.g. Adv1-0, Pasc3-4, Pent12-2, Quad2-5, Quadp1-0, Nat1-0, Epi1-0
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
    case "Nat":
      base = firstSundayOnOrAfter(addDays(anchors.christmas, 1));
      if (week > 1) base = addDays(base, (week - 1) * 7);
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
