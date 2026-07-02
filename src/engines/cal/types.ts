// ---------------------------------------------------------------------------
// engines/cal/types — calendar types and constants
// ---------------------------------------------------------------------------

// ── Primitive codes ──
export type Season = "ad" | "ct" | "lt" | "ea" | "ap" | "ot" | "sg";

export type Rank = 0 | 1 | 2 | 3 | 4;

// ── Display labels ──
export const SEASON_LABELS: Readonly<Record<Season, string>> = Object.freeze({
  ad: "Advent",
  ct: "Christmastide",
  lt: "Lent",
  ea: "Eastertide",
  ap: "Time after Pentecost",
  ot: "Time after Epiphany",
  sg: "Septuagesima",
});

// Period vocabulary for the simplified 1–4 scale. The precise per-feast term
// ("Duplex majus", "Feria privilegiata", …) lives in Feast.ritus.
export const RANK_LABELS: Readonly<Record<Rank, string>> = Object.freeze({
  0: "Triduum Sacrum",
  1: "Duplex I classis",
  2: "Duplex II classis",
  3: "Semiduplex",
  4: "Simplex",
});

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
  rank: Rank;
  rankLabel: string;
  ritus: string; // authentic Tridentine rank, e.g. "Duplex majus"
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
  rank?: Rank;
  marian?: boolean;
  apostolic?: boolean;
}
