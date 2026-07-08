// ---------------------------------------------------------------------------
// engines/chant/types — internal types and shared constants for chant engines
// ---------------------------------------------------------------------------
import type { Season, Grade, Feast } from "../cal/types.js";

export type { Season, Grade, Feast };

// ── Primitive codes ──
export type OfficeCode =
  | "an" | "al" | "ca" | "co" | "gr" | "hy" | "in"
  | "of" | "ps" | "re" | "rb" | "se" | "tr" | "tp" | "or";

export type OrdinaryCode =
  | "ky" | "gl" | "cr" | "sa" | "ag" | "be" | "it"
  | "as"   // Asperges me (sprinkle rite, outside Paschaltide)
  | "va";  // Vidi aquam (sprinkle rite, Paschaltide)

export type ChantSource = "gr" | "lu" | "la" | "lh" | "am";

export type CanonicalHour =
  | "matutinum" | "laudes" | "prima" | "tertia" | "sexta" | "nona"
  | "vesperae" | "completorium";

// ── Display labels ──
export const MODE_LABELS: Readonly<Record<string, string>> = Object.freeze({
  "1": "Modus I", "2": "Modus II", "3": "Modus III", "4": "Modus IV",
  "5": "Modus V", "6": "Modus VI", "7": "Modus VII", "8": "Modus VIII",
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
  office: OfficeCode;        // machine code; Latin name on `genus`
  genus: string;             // Latin genre name, e.g. "Antiphona", "Introitus"
  mode: string | null;       // raw from source: "1"–"8", "*", "†" …
  modus: string | null;      // Latin mode name, "Modus I"–"Modus VIII";
                             // "Tonus Peregrinus" for psalm tone P
  pages: { page: string; sequence: number; extent: number }[];
  source: {
    book: string;
    fullTitle?: string | null;   // full Latin title (from GregoBase), where it has one
    edition?: string | null;     // edition note, e.g. "US edition"
    year: number | null;
    editor: string | null;
    scanSource?: string | null;  // scan attribution (from GregoBase)
    code?: ChantSource | "user";
  };
  ordinary?: OrdinaryCode;   // machine code; present for kyriale chants
  ordinarium?: string;       // Latin ordinary name, e.g. "Kyrie eleison"
  mass?: number;
}

export interface OrdinaryChant extends Chant {
  ordinary: OrdinaryCode;
  ordinarium: string;
  mass: number;
}

// One genre's chant count within a book (office code + its Latin label).
export interface GenusCount {
  office: OfficeCode;
  genus: string;
  count: number;
}

// One mode's chant count within a book. `mode`/`modus` are null for the
// aggregate "other/none" bucket (chants without a mode 1–8).
export interface ModeCount {
  mode: string | null;
  modus: string | null;
  count: number;
}

// A book's bibliographic identity and a breakdown of its contents (`corpus`).
export interface Corpus {
  code: ChantSource;
  book: string;                  // short title
  fullTitle: string | null;      // full Latin title, where the source has one
  edition: string | null;        // edition note, else null
  year: number | null;
  editor: string | null;
  scanSource: string | null;     // scan attribution
  count: number;                 // total chants
  genera: GenusCount[];          // genre breakdown, descending by count
  modes: ModeCount[];            // mode breakdown, 1–8 then the other/none bucket
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

/** Which rite's Office to assemble. `romanum` (default) is the Tridentine Roman
 *  cursus; `monasticum` is the Benedictine cursus (Antiphonale Monasticum). */
export type Rite = "romanum" | "monasticum";

export interface OfficiumQuery extends CantusQuery {
  feast?: Feast | Feast[];
  hora?: CanonicalHour;
  rite?: Rite;
}

export interface PsalmusQuery {
  psalm?: number | string;
  verse?: string;
  mode?: number;
  differentia?: string;
  intonatio?: boolean;
  /** Sing in directum: straight through to the termination, no mediant. */
  inDirectum?: boolean;
  /** Use the ornamented solemn mediant, where the tone has one. */
  solemn?: boolean;
}

export interface PsalmVerse {
  psalm: number;
  verse: string;
  half1: string;
  half2: string;
  type: "psalm" | "canticle";
  source?: string;
}
