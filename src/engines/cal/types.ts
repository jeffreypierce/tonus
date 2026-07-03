// ---------------------------------------------------------------------------
// engines/cal/types — calendar types and constants
// ---------------------------------------------------------------------------

// ── Season codes ──
// One-to-one with the Divinum Officium Tempora stems, so findSeason and the
// cal data agree by construction (Adv→adv, Nat→nat, Epi→epi, Quadp→quadp,
// Quad→quad, Pasc→pasc, Pent→pent).
export type Season = "adv" | "nat" | "epi" | "quadp" | "quad" | "pasc" | "pent";

export const SEASON_LABELS: Readonly<Record<Season, string>> = Object.freeze({
  adv: "Advent",
  nat: "Christmastide",
  epi: "Time after Epiphany",
  quadp: "Septuagesima",
  quad: "Lent",
  pasc: "Paschaltide",
  pent: "Time after Pentecost",
});

// Penitential seasons: Gloria and (in quadp/quad) Alleluia are suppressed.
export const PENITENTIAL_SEASONS: ReadonlySet<Season> = new Set<Season>([
  "adv",
  "quadp",
  "quad",
]);

// ── Feast dignity (dignitas) ──
// The authentic Tridentine rank (the "ritus" string) reduces to a canonical
// ordered Dignitas. Ordering is classis-primary: a first-class day outranks
// any non-first-class feast regardless of the duplex/semiduplex axis, so a
// plain Duplex feast never displaces a Lent Sunday (Semiduplex I classis).
// (Named `dignitas`, not `gradus` — gradus is the Guidonian step on
// Temperamentum. One word per concept.)
export type Dignitas =
  | "triduum"
  | "duplex-i"
  | "duplex-majus-i"
  | "semiduplex-i"
  | "feria-privilegiata"
  | "duplex-ii"
  | "semiduplex-ii"
  | "duplex-majus"
  | "duplex"
  | "semiduplex"
  | "simplex"
  | "feria-major"
  | "vigilia"
  | "feria";

// High → low precedence. Position in this array IS the dignity — earlier
// outranks later. There is no separate numeric rank field; precedence is read
// from this order via dignitasOrder / compareDignitas.
export const DIGNITAS_ORDER: readonly Dignitas[] = [
  "triduum",
  "duplex-i",
  "duplex-majus-i",
  "semiduplex-i",
  "feria-privilegiata",
  "duplex-ii",
  "semiduplex-ii",
  "duplex-majus",
  "duplex",
  "semiduplex",
  "simplex",
  "feria-major",
  "vigilia",
  "feria",
];

// Exact reduction of every ritus string the extractor produces to its
// canonical Dignitas. Compounds ("… cum Octava …") reduce to their base
// grade; the Triduum's privileged-feria ritus reduces to `triduum`.
export const RITUS_TO_DIGNITAS: Readonly<Record<string, Dignitas>> =
  Object.freeze({
    "Feria privilegiata Duplex I classis": "triduum",
    "Duplex I classis": "duplex-i",
    "Duplex I classis cum Octava communi": "duplex-i",
    "Duplex I classis cum Octava privilegiata I ordinis": "duplex-i",
    "Duplex I classis cum Octava privilegiata II ordinis": "duplex-i",
    "Duplex I classis cum Octava privilegiata III ordinis": "duplex-i",
    "Duplex majus I classis": "duplex-majus-i",
    "Semiduplex I classis": "semiduplex-i",
    "Feria privilegiata": "feria-privilegiata",
    "Duplex II classis": "duplex-ii",
    "Duplex II classis cum Octava simplici": "duplex-ii",
    "Semiduplex II classis": "semiduplex-ii",
    "Duplex majus": "duplex-majus",
    Duplex: "duplex",
    Semiduplex: "semiduplex",
    Simplex: "simplex",
    "Feria major": "feria-major",
    Vigilia: "vigilia",
    Feria: "feria",
  });

// Ordered, most-specific-first fallback matcher for ritus strings not in the
// exact table above (future data). Longer patterns first so "Feria
// privilegiata Duplex I classis" wins over "Feria privilegiata", and
// "Duplex I classis" over "Duplex".
const RITUS_PATTERNS: readonly [string, Dignitas][] = [
  ["Feria privilegiata Duplex I classis", "triduum"],
  ["Duplex majus I classis", "duplex-majus-i"],
  ["Duplex I classis", "duplex-i"],
  ["Duplex II classis", "duplex-ii"],
  ["Semiduplex I classis", "semiduplex-i"],
  ["Semiduplex II classis", "semiduplex-ii"],
  ["Feria privilegiata", "feria-privilegiata"],
  ["Duplex majus", "duplex-majus"],
  ["Semiduplex", "semiduplex"],
  ["Duplex", "duplex"],
  ["Simplex", "simplex"],
  ["Feria major", "feria-major"],
  ["Vigilia", "vigilia"],
  ["Feria", "feria"],
];

/** Reduce a Tridentine ritus string to its canonical Dignitas. */
export function ritusToDignitas(ritus: string): Dignitas {
  const exact = RITUS_TO_DIGNITAS[ritus];
  if (exact) return exact;
  for (const [pattern, dignitas] of RITUS_PATTERNS) {
    if (ritus.includes(pattern)) return dignitas;
  }
  return "feria"; // last resort; extractor coverage is 100%, so unreached
}

// ── Privileged Sundays (per-id dignity overrides) ──
// DO's Tridentine ritus line under-specifies four privileged Sundays as plain
// "Semiduplex"; their precedence lived only in DO's numeric rank, which tonus
// does not use. Historically Advent I is a first-class Sunday (yields to
// nothing) and the Septuagesima-block Sundays are second-class (yield only to
// first- and second-class feasts) — the same Sunday classes DO itself encodes
// for Lent ("Semiduplex I classis") and late Advent ("Semiduplex II classis").
// `ritus` stays verbatim; only the derived dignitas is lifted.
export const PRIVILEGED_SUNDAYS: Readonly<Record<string, Dignitas>> =
  Object.freeze({
    "Adv1-0": "semiduplex-i", // Dominica I Adventus
    "Quadp1-0": "semiduplex-ii", // Dominica in Septuagesima
    "Quadp2-0": "semiduplex-ii", // Dominica in Sexagesima
    "Quadp3-0": "semiduplex-ii", // Dominica in Quinquagesima
  });

/**
 * Dignitas for a calendar entry: the per-id privileged-Sunday override when
 * one exists, otherwise the ritus reduction.
 */
export function entryDignitas(id: string | undefined, ritus: string): Dignitas {
  return (id !== undefined ? PRIVILEGED_SUNDAYS[id] : undefined) ?? ritusToDignitas(ritus);
}

/** Precedence index (0 = highest). Use for sorting and comparison. */
export function dignitasOrder(dignitas: Dignitas): number {
  return DIGNITAS_ORDER.indexOf(dignitas);
}

/** Sort comparator: earlier in DIGNITAS_ORDER (higher dignity) sorts first. */
export function compareDignitas(a: Dignitas, b: Dignitas): number {
  return dignitasOrder(a) - dignitasOrder(b);
}

// ── BVM / Apostolic feast sets (keyed by DO stem: MM-DD for Sancti) ──
export const BVM_FEAST_IDS: ReadonlySet<string> = new Set([
  "12-08", // Immaculate Conception
  "03-19", // St. Joseph
  "05-31", // Queenship of Mary
  "07-02", // Visitation
  "07-26", // St. Anne
  "08-05", // Our Lady of the Snows
  "08-14", // Vigil of the Assumption
  "08-15", // Assumption
  "08-16", // St. Joachim
  "08-22", // Immaculate Heart
  "09-08", // Nativity of Mary
  "09-12", // Most Holy Name of Mary
  "09-15", // Seven Sorrows
  "10-11", // Motherhood of Mary
]);

export const APOSTOLIC_FEAST_IDS: ReadonlySet<string> = new Set([
  "11-30", // St. Andrew
  "12-21", // St. Thomas
  "01-25", // Conversion of St. Paul
  "02-24", // St. Matthias
  "05-11", // SS. Philip and James
  "06-11", // St. Barnabas
  "06-28", // Vigil of SS. Peter and Paul
  "06-29", // SS. Peter and Paul
  "06-30", // St. Paul
  "07-25", // St. James
  "08-24", // St. Bartholomew
  "09-21", // St. Matthew
  "10-18", // St. Luke
  "10-28", // SS. Simon and Jude
  "04-25", // St. Mark
  "12-27", // St. John
]);

// ── Core interface ──
export interface Feast {
  id: string;
  name: string;
  ritus: string;      // authentic Tridentine rank, e.g. "Duplex majus"
  dignitas: Dignitas; // canonical grade the ritus reduces to; precedence via
                      // DIGNITAS_ORDER (no separate numeric rank field)
  season: Season;
  seasonLabel: string;
  seasonStart: Date;
  seasonEnd: Date;
  date: Date;
  weekday: number;  // 0 = Sunday
  masses: number[]; // ranked list of compatible kyriale mass numbers
  marian: boolean;
  apostolic: boolean;
}

export interface FeastQuery {
  date?: Date;
  from?: Date;
  to?: Date;
  name?: string;
  season?: Season;
  dignitas?: Dignitas;
  marian?: boolean;
  apostolic?: boolean;
}
