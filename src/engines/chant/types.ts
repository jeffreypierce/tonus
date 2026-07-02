// ---------------------------------------------------------------------------
// engines/chant/types — internal types and shared constants for chant engines
// ---------------------------------------------------------------------------
import type { Season, Rank, Feast } from "../cal/types.js";

export type { Season, Rank, Feast };

// ── Primitive codes ──
export type OfficeCode =
  | "an" | "al" | "ca" | "co" | "gr" | "hy" | "in"
  | "of" | "ps" | "re" | "rb" | "se" | "tr" | "tp" | "or";

export type OrdinaryCode = "ky" | "gl" | "cr" | "sa" | "ag" | "be" | "it";

export type ChantSource = "gr" | "lu" | "la" | "lh";

export type CanonicalHour =
  | "matutinum" | "laudes" | "prima" | "tertia" | "sexta" | "nona"
  | "vesperae" | "completorium";

// ── Display labels ──
export const MODE_LABELS: Readonly<Record<string, string>> = Object.freeze({
  "1": "Mode I", "2": "Mode II", "3": "Mode III", "4": "Mode IV",
  "5": "Mode V", "6": "Mode VI", "7": "Mode VII", "8": "Mode VIII",
});

export const OFFICE_LABELS: Readonly<Record<OfficeCode, string>> = Object.freeze({
  an: "Antiphona",
  al: "Alleluia",
  ca: "Canticum",
  co: "Communio",
  gr: "Graduale",
  hy: "Hymnus",
  in: "Introitus",
  of: "Offertorium",
  ps: "Psalmus",
  re: "Responsorium",
  rb: "Responsorium Breve",
  se: "Sequentia",
  tr: "Tractus",
  tp: "Tonus Peregrinus",
  or: "Ordinarium",
});

export const ORDINARY_LABELS: Readonly<Record<string, string>> = Object.freeze({
  ky: "Kyrie eleison",
  gl: "Gloria",
  cr: "Credo",
  sa: "Sanctus",
  ag: "Agnus Dei",
  be: "Benedicamus",
  it: "Ite missa est",
  as: "Asperges",
  va: "Vidi aquam",
});

// ── Core interfaces ──
export interface Chant {
  id: string;
  incipit: string;
  gabc: string;
  office: OfficeCode;
  officeLabel: string;
  mode: string | null;       // raw from source: "1"–"8", "*", "†" …
  modeLabel: string | null;  // "Mode I"–"Mode VIII", null for non-numeric
  pages: { page: string; sequence: number; extent: number }[];
  source: { book: string; year: number | null; editor: string | null; code?: ChantSource | "user" };
  ordinary?: OrdinaryCode;   // present for kyriale chants
  ordinaryLabel?: string;
  mass?: number;
}

export interface OrdinaryChant extends Chant {
  ordinary: OrdinaryCode;
  ordinaryLabel: string;
  mass: number;
}

export interface CantusQuery {
  id?: string | string[];
  gabc?: string;
  incipit?: string;
  mode?: number | string | (number | string)[];
  office?: OfficeCode | OfficeCode[];
  source?: ChantSource | ChantSource[];
  limit?: number;
  offset?: number;
  sort?: "incipit" | "mode" | "id";
}

export interface PropriumQuery extends CantusQuery {
  feast?: Feast | Feast[];
}

export interface OrdinariumQuery extends CantusQuery {
  feast?: Feast | Feast[];
  ordinary?: OrdinaryCode;
  mass?: number;
}

export interface OfficiumQuery extends CantusQuery {
  feast?: Feast | Feast[];
  hour?: CanonicalHour;
}

export interface PsalmusQuery {
  psalm?: number | string;
  verse?: string;
  mode?: number;
  differentia?: string;
  intonation?: boolean;
}

export interface PsalmVerse {
  psalm: number;
  verse: string;
  half1: string;
  half2: string;
  type: "psalm" | "canticle";
  source?: string;
}
