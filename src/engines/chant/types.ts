// ---------------------------------------------------------------------------
// engines/chant/types — internal types and shared constants for chant engines
// ---------------------------------------------------------------------------
import type { Season, Grade, Feast } from "../cal/types.js";

export type { Season, Grade, Feast };

// ── Primitive codes ──
export type OfficeCode =
  | "an" | "al" | "ca" | "co" | "gr" | "hy" | "in"
  | "of" | "ps" | "re" | "rb" | "se" | "tr" | "tp" | "or"
  // Genera tonus does not SHIP but does REPORT: they appear in a book's
  // pre-cut `full` tally, so they need names there. The cut keeps them out of
  // the shipped corpus (extract-gregobase.mjs OFFICE_MAP is the admission
  // list), but a ledger that prints a bare code where every other row has a
  // Latin genus is showing its own plumbing.
  | "im" | "pa" | "su";

export type OrdinaryCode =
  | "ky" | "gl" | "cr" | "sa" | "ag" | "be" | "it"
  | "as"   // Asperges me (sprinkle rite, outside Paschaltide)
  | "va";  // Vidi aquam (sprinkle rite, Paschaltide)

/**
 * The books a chant can come from. `source` is PROVENANCE, not an acquisition
 * unit: a book appears here because some chant the liturgy asks for is found in
 * it, not because the whole book ships.
 *
 * The first seven are the original corpus. The office books after them widened
 * it: they carry antiphons and short responsories that fill weekday office
 * slots — without them a matcher could only bind a slot to a chant the five
 * extracted books happened to hold, which is why 41 Fridays had no Vespers
 * ("Per singulos dies" lives in the Psalterium Monasticum).
 *
 * That widening brought in eight; six are gone again. am1, am2,
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
  | "gr" | "lu" | "la" | "lh" | "am" | "nr"
  // office books, monastic
  | "ams" | "psm"
  // further MARKED Solesmes books. The rule for admission is stated in
  // extract-gregobase.mjs OFFICE_BOOKS: Solesmes AND rhythmically marked
  // (>50% episema or mora), because tonus reads those marks and a bare
  // transcription is a worse copy of a chant already held.
  | "cse" | "cot";

export type CanonicalHour =
  | "matutinum" | "laudes" | "prima" | "tertia" | "sexta" | "nona"
  | "vesperae" | "completorium";

/** The eight canonical hours in the order they are sung, Matins first. The
 *  order is the content: a day's office read out of sequence is not the day's
 *  office. `officium` validates `hora` against this, so the list a caller reads
 *  and the check it must satisfy cannot drift apart. */
export const HORAE: readonly CanonicalHour[] = Object.freeze([
  "matutinum", "laudes", "prima", "tertia", "sexta", "nona",
  "vesperae", "completorium",
]);

// ── Display labels ──
/** The keys cantus() accepts — the base set the day verbs extend. Lives here,
 *  cycle-free, so ordinary.ts can build its own key set without importing
 *  chant.ts (the two are an import cycle). */
export const CANTUS_QUERY_KEYS = new Set([
  "id", "gabc", "incipit", "mode", "office", "source", "limit", "offset", "sort",
  "before", "cursus", "ordinary",
]);

export const MODI: Readonly<Record<string, string>> = Object.freeze({
  "1": "Modus I", "2": "Modus II", "3": "Modus III", "4": "Modus IV",
  "5": "Modus V", "6": "Modus VI", "7": "Modus VII", "8": "Modus VIII",
});

export const OFFICIA: Readonly<Record<OfficeCode, string>> = Object.freeze({
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
  // Reported in the pre-cut tallies, not shipped — see OfficeCode above.
  im: "Improperia",       // the Good Friday Reproaches (Popule meus)
  pa: "Antiphona Mariana", // Marian antiphons outside the office cycle
  su: "Supplicatio",      // litanies and supplications (the Easter Vigil litany)
  tr: "Tractus",
  tp: "Tonus Peregrinus",
  or: "Ordinarium",
});

export const ORDINARIA: Readonly<Record<string, string>> = Object.freeze({
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

// The Kyriale's bibliographic identity. NOT a ChantSource: `ky` is a partition
// of the Graduale, not a book of its own (chant.ts, CORPUS), so it is not a
// value `cantus({ source })` takes and not a row in the shelf. This record
// still rides every kyriale chant, because a chant should say which book it is
// printed in — and the Kyriale is what a singer would be holding.
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
    // A queryable book code, plus the two that are not books: "user" for a
    // chant parsed from raw GABC, and "ky" for the Kyriale — a partition of the
    // Graduale, so it names a printing rather than a shelf entry.
    code?: ChantSource | "user" | "ky";
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
  /**
   * What the book HOLDS, before the cut — the ledger of what was left behind.
   * Same genera/modes shape as the shipped counts above, so an omission is
   * visible rather than merely implied by a smaller number. `null` for a book
   * outside GregoBase (nr, ky), the same "unmeasured, not zero" rule as
   * `total`/`unique`/`shared`.
   */
  full: CorpusFullCount | null;
}

/** A book's pre-cut tally, in the shape `corpus()` reports the shipped one. */
export interface CorpusFullCount {
  total: number;
  genera: GenusCount[];
  modes: ModeCount[];
}

/**
 * The whole shelf: every book's ledger, and the corpus-wide rollup.
 * Returned by `corpus()` with no argument.
 */
export interface CorpusLedger {
  /**
   * How many chants tonus holds — every chant it can name, counted once.
   *
   * This is THE number: distinct chants, so it does not move with how many
   * books happen to print the same melody. Listings are `listings` below —
   * a fact about the shelf, not about the repertoire.
   */
  count: number;
  /**
   * Book listings across the shelf: a chant printed in two books counts twice.
   * `listings - count` is how much the books overlap. Secondary on purpose —
   * it answers "how long is the shelf", not "how much chant is there".
   */
  listings: number;
  /** Chants the books hold in total, before the cut. */
  total: number;
  genera: GenusCount[];
  modes: ModeCount[];
  /** Per book, in corpus order. */
  books: Corpus[];
}

/** `corpus({ book })` — the query form; `corpus(code)` still works. */
export interface CorpusQuery {
  book?: ChantSource;
}

export interface CantusQuery {
  id?: string | string[];
  gabc?: string;
  incipit?: string;
  mode?: number | string | (number | string)[];
  office?: OfficeCode | OfficeCode[];
  source?: ChantSource | ChantSource[];
  /**
   * A part of the Mass ordinary — `"ky"` for the Kyries, `"gl"` the Glorias,
   * and so on. This is the door to the Kyriale, which is addressable but not
   * shelved (it is a partition of the Graduale, not a book), so it is absent
   * from `source` and from an unfiltered search. Asking for an ordinary can
   * only mean one thing, which is why it may reach where `mode` alone does not.
   *
   * For the setting a given DAY calls for, `ordinarium({ feast })` is the verb:
   * it applies the Kyriale's own rubrics. This is the flat retrieval — every
   * Kyrie in the book, whatever day would sing it.
   */
  ordinary?: OrdinaryCode | OrdinaryCode[];
  /**
   * Only chants ATTESTED by this year — the repertoire as of a date, the
   * analogue of `festum({ before })`, and the two COMPOSE: a Feast resolved by
   * `festum({ date, before })` carries the view, and every day verb (proprium,
   * ordinarium, officium) serves under it without being told the year twice;
   * an own `before` overrides the feast's. Only centuries wholly CLOSED by
   * the year count as witnessed: `before: 1098` keeps what a manuscript of
   * the 10th century or earlier already holds (see attest.ts for why).
   *
   * This is evidence, not existence: the date comes from CANTUS's manuscript
   * index, so it is a terminus ante quem. A chant with no dated witness is
   * excluded rather than assumed old — silence is not evidence of age.
   * This is the ONE time argument: a `century` spelling is deliberately
   * absent, because it was `before: N * 100` in different clothes — one
   * cutoff internally, two spellings at the door (see attest.ts).
   */
  before?: number;
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

// A `Rite` type and a `rite` option are deliberately absent. tonus assembles
// one cursus, the Benedictine: the Roman office table was largely hollow and
// its psalmody had no consumer but that office, so `rite: "romanum"` returned a
// chimera — Tridentine psalms under monastic hymns and versicles, agreeing on 3
// chant ids out of 48. An option that cannot produce a cursus anyone sang is
// worse than no option, because callers read it as a supported choice.
export interface OfficiumQuery extends CantusQuery {
  feast?: Feast | Feast[];
  hora?: CanonicalHour;
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
