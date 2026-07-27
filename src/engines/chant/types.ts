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

/**
 * The books a chant can come from. `source` is PROVENANCE, not an acquisition
 * unit: a book appears here because some chant the liturgy asks for is found in
 * it, not because the whole book ships.
 *
 * The first seven are the original corpus. The office books after them
 * ⟨widened 2026-07-27⟩ carry antiphons and short responsories that fill weekday
 * office slots — without them a matcher could only bind a slot to a chant the
 * five extracted books happened to hold, which is why 41 Fridays had no Vespers
 * ("Per singulos dies" lives in the Psalterium Monasticum).
 *
 * That widening brought in eight; six are gone again ⟨2026-07-27⟩. am1, am2,
 * am3, lr, ar1 and ar2 are bare transcriptions — no episema, no ictus,
 * essentially no mora — so once the office matchers began preferring a
 * rhythmically marked witness, every text they carried was better served by a
 * book we already ship. tonus reads those marks for playback, so a bare chant is
 * a worse copy, not a missing one.
 *
 * ams and psm stayed because they are fully marked, and psm holds "Per singulos
 * dies" — the Friday Vespers antiphon the widening was for. Every chant tonus
 * now ships carries rhythmic notation.
 */
export type ChantSource =
  | "gr" | "lu" | "la" | "lh" | "am" | "nr" | "ky"
  // office books, monastic
  | "ams" | "psm";

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

// The Kyriale's bibliographic identity as a corpus book (`source: "ky"`).
// Hand-authored (the other books' SOURCE constants ride their generated data
// files; the kyriale's data file predates its book registration): the chants
// are the Kyriale section of the 1961 Solesmes Graduale Romanum, extracted
// from GregoBase GR source pages. Shared by the corpus surface (chant.ts) and
// the ordinary engine so a kyriale chant carries ONE identity everywhere.
export const KY_SOURCE = Object.freeze({
  book: "Kyriale (Graduale Romanum)",
  year: 1961,
  editor: "Solesmes",
  code: "ky",
}) as Chant["source"];

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

// How many chants one book shares with another (by GregoBase chant id).
export interface SharedCount {
  code: ChantSource;
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
  count: number;                 // chants tonus stores for this book (after dedup)
  // Cross-book overlap is measured only for the GregoBase-sourced books. For a
  // book outside GregoBase (e.g. the Nocturnale, `nr`) it is *unmeasured*: these
  // are null, distinct from a measured zero (`unique === count`, `shared === []`).
  total: number | null;          // chants the book actually holds (before dedup)
  unique: number | null;         // chants in this book alone (in no other book)
  shared: SharedCount[] | null;  // chants shared with each other book, descending
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
  /**
   * Only chants ATTESTED by this year — the repertoire as of a date, the
   * analogue of `festum({ before })`, and the two COMPOSE: a Feast resolved by
   * `festum({ date, before })` carries the view, and every day verb
   * (proprium, ordinarium, officium, matutinum) serves under it without being
   * told the year twice; an own `before`/`century` overrides the feast's.
   * `before: 1098` keeps what a manuscript of the 11th century or earlier
   * already holds.
   *
   * This is evidence, not existence: the date comes from CANTUS's manuscript
   * index, so it is a terminus ante quem. A chant with no dated witness is
   * excluded rather than assumed old — silence is not evidence of age.
   */
  before?: number;
  /** As `before`, but stated directly as a century (10 = the 900s):
   *  `century: N` ≡ `before: N * 100` — one cutoff internally, two spellings
   *  at the door. 【NOTED ⟨Jeffrey⟩ — these should converge into one argument
   *  eventually.】 */
  century?: number;
  /** Only chants transmitted by this cursus; `both` always qualifies. */
  cursus?: "monastic" | "secular";
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
