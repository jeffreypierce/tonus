// ---------------------------------------------------------------------------
// engines/cal/types — calendar types and constants
// ---------------------------------------------------------------------------

// ── Season codes ──
// Named after the Divinum Officium Tempora stems (Adv→adv, Nat→nat, Epi→epi,
// Quadp→quadp, Quad→quad, Pasc→pasc, Pent→pent), but a feast's season is read
// from its date, not its stem: Ash Wednesday is Quadp3-3 and falls in `quad`.
export type Season = "adv" | "nat" | "epi" | "quadp" | "quad" | "pasc" | "pent";

export const SEASON_LABEL: Readonly<Record<Season, string>> = Object.freeze({
  adv: "Advent",
  nat: "Christmastide",
  epi: "Time after Epiphany",
  quadp: "Septuagesima",
  quad: "Lent",
  pasc: "Paschaltide",
  pent: "Time after Pentecost",
});

// Authentic Latin season names (the books' own headings). Feast.tempus
// carries these; SEASON_LABEL above is the English reference map.
export const TEMPORA: Readonly<Record<Season, string>> = Object.freeze({
  adv: "Tempus Adventus",
  nat: "Tempus Nativitatis",
  epi: "Tempus post Epiphaniam",
  quadp: "Tempus Septuagesimæ",
  quad: "Tempus Quadragesimæ",
  pasc: "Tempus Paschale",
  pent: "Tempus post Pentecosten",
});

// Penitential seasons: Gloria and (in quadp/quad) Alleluia are suppressed.
export const PENITENTIAL_SEASONS: ReadonlySet<Season> = new Set<Season>([
  "adv",
  "quadp",
  "quad",
]);

// ── Feast dignity (grade) ──
// The authentic rank (the "ritus" string) reduces to a canonical
// ordered Grade. Ordering is classis-primary: a first-class day outranks
// any non-first-class feast regardless of the duplex/semiduplex axis, so a
// plain Duplex feast never displaces a Lent Sunday (Semiduplex I classis).
// Register pattern: `grade` is the English-keyed machine code, `ritus` the
// Latin-keyed authentic carrier (mirroring season/tempus). English `grade`
// also keeps clear of Latin `gradus`, the Guidonian step on Temperamentum.
export type Grade =
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

// High → low dignity. Position in this array IS the dignity — earlier
// outranks later. There is no separate numeric rank field. Same-day
// precedence starts from this order and adjusts it for the excluding days and
// the Sundays (precedence in ./calendar.ts).
export const GRADE_ORDER: readonly Grade[] = [
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

// Canonical Latin name per grade (display reference map, like SEASON_LABEL).
// Feast objects don't carry this — `ritus` is the on-object Latin carrier;
// use this map when the canonical grade name is wanted instead (it differs
// from ritus only for octave compounds, the Triduum, and the privileged-
// Sunday overrides).
export const GRADUS: Readonly<Record<Grade, string>> = Object.freeze({
  triduum: "Triduum Sacrum",
  "duplex-i": "Duplex I classis",
  "duplex-majus-i": "Duplex majus I classis",
  "semiduplex-i": "Semiduplex I classis",
  "feria-privilegiata": "Feria privilegiata",
  "duplex-ii": "Duplex II classis",
  "semiduplex-ii": "Semiduplex II classis",
  "duplex-majus": "Duplex majus",
  duplex: "Duplex",
  semiduplex: "Semiduplex",
  simplex: "Simplex",
  "feria-major": "Feria major",
  vigilia: "Vigilia",
  feria: "Feria",
});

// Exact reduction of every ritus string the extractor produces to its
// canonical Grade. Compounds ("… cum Octava …") reduce to their base
// grade; the Triduum's privileged-feria ritus reduces to `triduum`.
export const RITUS_TO_GRADE: Readonly<Record<string, Grade>> =
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
const RITUS_PATTERNS: readonly [string, Grade][] = [
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

/** Reduce a ritus string to its canonical Grade. */
export function ritusToGrade(ritus: string): Grade {
  const exact = RITUS_TO_GRADE[ritus];
  if (exact) return exact;
  for (const [pattern, grade] of RITUS_PATTERNS) {
    if (ritus.includes(pattern)) return grade;
  }
  return "feria"; // last resort; extractor coverage is 100%, so unreached
}

// ── Privileged Sundays (per-id dignity overrides) ──
// DO's ritus line under-specifies four privileged Sundays as plain
// "Semiduplex"; their precedence lived only in DO's numeric rank, which tonus
// does not use. Advent I is a first-class Sunday and the Septuagesima-block
// Sundays are second-class — the same Sunday classes DO itself encodes for
// Lent ("Semiduplex I classis") and late Advent ("Semiduplex II classis").
// `ritus` stays verbatim; only the derived grade is lifted. That Advent I
// yields to NO feast is not a grade matter: it is in EXCLUDING_DAYS below.
export const PRIVILEGED_SUNDAYS: Readonly<Record<string, Grade>> =
  Object.freeze({
    "Adv1-0": "semiduplex-i", // Dominica I Adventus
    "Quadp1-0": "semiduplex-ii", // Dominica in Septuagesima
    "Quadp2-0": "semiduplex-ii", // Dominica in Sexagesima
    "Quadp3-0": "semiduplex-ii", // Dominica in Quinquagesima
  });

/**
 * Grade for a calendar entry: the per-id privileged-Sunday override when
 * one exists, otherwise the ritus reduction.
 */
export function entryGrade(id: string | undefined, ritus: string): Grade {
  return (id !== undefined ? PRIVILEGED_SUNDAYS[id] : undefined) ?? ritusToGrade(ritus);
}

/** Precedence index (0 = highest). Use for sorting and comparison. */
export function gradeOrder(grade: Grade): number {
  return GRADE_ORDER.indexOf(grade);
}

// ── Days that admit no feast ──
// Under Divino Afflatu these days exclude every feast: whatever falls on them
// is impeded (and, in the books, transferred or commemorated). They lead the
// day whatever the other entry's grade — a Duplex I classis Annunciation on
// Palm Sunday, or St Joseph on a Lent Sunday, follows the temporale.
export const EXCLUDING_DAYS: ReadonlySet<string> = new Set([
  "Adv1-0", // Dominica I Adventus
  "Quadp3-3", // Feria IV Cinerum (Ash Wednesday)
  "Quad1-0", "Quad2-0", "Quad3-0", "Quad4-0", // Sundays of Lent
  "Quad5-0", // Dominica de Passione
  "Quad6-0", // Dominica in Palmis
  "Quad6-1", "Quad6-2", "Quad6-3", // Holy Week, Monday to Wednesday
  "Quad6-4", "Quad6-5", "Quad6-6", // the Triduum
  "Pasc0-0", "Pasc0-1", "Pasc0-2", "Pasc0-3", "Pasc0-4", "Pasc0-5", "Pasc0-6", // Easter and its octave
  "Pasc1-0", // Dominica in Albis
  "Pasc7-0", "Pasc7-1", "Pasc7-2", "Pasc7-3", "Pasc7-4", "Pasc7-5", "Pasc7-6", // Pentecost and its octave
]);

// ── BVM / Apostolic feast sets (keyed by DO stem: MM-DD for Sancti) ──
// Feasts OF Our Lady and OF the Apostles (and Evangelists), not their vigils
// nor the feasts of their kin: a vigil is not the feast it precedes, and St
// Joseph, St Anne and St Joachim are not Marian feasts. `marian` selects the
// Kyriale's "For feasts of the Blessed Virgin" (IX, X) and Credo IV;
// `apostolic` selects Credo III.
export const BVM_FEAST_IDS: ReadonlySet<string> = new Set([
  "02-02", // Purification
  "02-11", // Apparition at Lourdes
  "03-25", // Annunciation
  "Quad5-5", // Seven Sorrows (Friday of Passion week)
  "05-31", // Queenship of Mary
  "07-02", // Visitation
  "07-16", // Our Lady of Mount Carmel
  "08-05", // Our Lady of the Snows
  "08-15", // Assumption
  "08-22", // Immaculate Heart
  "09-08", // Nativity of Mary
  "09-12", // Most Holy Name of Mary
  "09-15", // Seven Sorrows
  "09-24", // Our Lady of Ransom
  "10-07", // Holy Rosary
  "10-11", // Motherhood of Mary
  "11-21", // Presentation of Mary
  "12-08", // Immaculate Conception
  "12-15", // Octave of the Immaculate Conception
]);

export const APOSTOLIC_FEAST_IDS: ReadonlySet<string> = new Set([
  "11-30", // St. Andrew
  "12-21", // St. Thomas
  "01-25", // Conversion of St. Paul
  "02-24", // St. Matthias
  "05-01", // SS. Philip and James
  "06-11", // St. Barnabas
  "06-29", // SS. Peter and Paul
  "06-30", // Commemoration of St. Paul
  "07-25", // St. James
  "08-24", // St. Bartholomew
  "09-21", // St. Matthew
  "10-18", // St. Luke
  "10-28", // SS. Simon and Jude
  "04-25", // St. Mark
  "12-27", // St. John
]);

// ── Core interface ──
// Field-name registers: a Latin key returns authentic Latin content (nomen,
// ritus, tempus); an English key returns a machine code or datum (grade,
// season, date, weekday, masses).
export interface Feast {
  id: string;
  nomen: string;      // Latin feast name, e.g. "In Nativitate Domini"
  ritus: string;      // authentic rank (DO [Rank] line), e.g. "Duplex majus"
  grade: Grade; // canonical grade the ritus reduces to; precedence via
                      // GRADE_ORDER (no separate numeric rank field)
  season: Season;     // machine code (DO Tempora stem)
  tempus: string;     // Latin season name, e.g. "Tempus Adventus"
  seasonStart: Date;
  seasonEnd: Date;
  date: Date;       // proleptic-Gregorian UTC midnight
  weekday: number;  // 0 = Sunday
  masses: number[]; // the masses the day's Kyriale rubric appoints, in book order
  marian: boolean;
  apostolic: boolean;
  /** The era view this feast was resolved under — the `before` year given to
   *  festum. Carried on the feast so the chant verbs (proprium, ordinarium,
   *  officium) serve the SAME view without being told twice; a `before` on
   *  their own query overrides. Absent on a present-day resolution. */
  before?: number;
}

export interface FeastQuery {
  date?: Date;
  from?: Date;
  to?: Date;
  nomen?: string; // partial match, case-insensitive
  season?: Season;
  grade?: Grade;
  marian?: boolean;
  apostolic?: boolean;
  /**
   * Resolve the day AS OF this year: feasts instituted later step aside and
   * whatever ranked behind them wins — usually the temporale or the feria. A
   * view over the shipped calendar, which keeps every day either way. Dates
   * live in cal/data/eras.ts.
   */
  before?: number;
}

// The anchors of one CIVIL year, as returned by tonus.pascha (its Advent and
// Christmas open the next liturgical year). All dates are proleptic-Gregorian
// UTC midnights.
export interface Pascha {
  year: number;
  septuagesima: Date;
  ashWednesday: Date;
  firstLentSunday: Date;
  palmSunday: Date;
  goodFriday: Date;
  easter: Date;
  ascension: Date;
  pentecost: Date;
  trinitySunday: Date;
  corpusChristi: Date;
  adventFirstSunday: Date;
  gaudete: Date;
  christmas: Date;
  epiphany: Date;
  baptism: Date;
}
