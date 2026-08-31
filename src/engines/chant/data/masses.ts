// engines/chant/data/masses — the 18 kyriale mass profiles
//
// WHICH mass a day sings is decided by the Kyriale's own printed rubric, one
// category per mass, carried here as `rubric` and quoted verbatim in `heading`
// [biblio: liber-usualis, Kyriale]. The book classifies by RANK — "For
// feasts of the I class", "For ferias throughout the Year" — not by subject, and
// where a category holds several masses it numbers them (II class 1–5), which is
// the book's own invitation to choose among them.
//
// This replaces an earlier `seasons ∩ grades ∩ days` eligibility triple. Those
// three fields were mechanically widened from a legacy DO 0–4 rank bucket (see
// archive/plan-2-rank-redesign.md, which called that bucket "medievally
// incoherent" and asked for a re-derivation that never happened — the migration
// gate only checked that a day resolved to a NON-EMPTY mass list, never to the
// right one). The result: Cum jubilo was eligible for all 14 grades, de Angelis
// for 13, and Easter — a I class day — was offered masses IV and V, which the
// book appoints for the II class. `rubric` is now the single source of truth;
// the triple is gone rather than left lying around looking authoritative.
//
// `notes` is kept, and is worth keeping, but it records CUSTOMARY use — what
// choirs actually reach for — which is a different thing from the rubric and
// disagrees with it for 9 of the 18. It is documentation, never a selector.
import { type Grade } from "../../cal/types.js";

/**
 * The Kyriale's rubric categories, in the book's own order. A day resolves to
 * exactly one; the masses carrying that rubric are the masses it may sing.
 */
export type MassRubric =
  | "paschal" // In Paschal Time
  | "class-i" // For feasts of the I class
  | "class-ii" // For feasts of the II class
  | "class-iii" // For feasts of the III class
  | "bvm" // For feasts of the Blessed Virgin
  | "sunday" // For Sundays throughout the Year
  | "commemoration" // For commemorations
  | "feria" // For ferias throughout the Year
  | "sunday-penitential" // For the Sundays of Advent and Lent
  | "feria-penitential"; // For the ferias of Advent and Lent

// "This Ordinary is NOT meant to be a matter of hard and fast rule: chants from
// one Mass may be used together with those from others, the Ferial Masses
// excepted." [liber-usualis, Kyriale] — so slots may mix freely EXCEPT
// under these two rubrics, whose masses are sung whole.
export const WHOLE_MASS_RUBRICS: ReadonlySet<MassRubric> = new Set<MassRubric>([
  "feria",
  "feria-penitential",
]);

export interface MassEntry {
  id: string;
  mass: number; // 1–18 (also the lookup key into the Kyriale)
  title: string;
  rubric: MassRubric; // THE selector — the book's category
  heading: string; // the LU's printed rubric, verbatim
  bvm: boolean; // BVM-specific mass (rubric "bvm")
  credos: string[]; // credos this mass's rubric names; [] = no credo that day
  notes: string; // CUSTOMARY use — documentation only, never a selector
}

// The grades belonging to each rank category. The Grade ladder is
// classis-primary and already carries the class in its names — `-i` is
// "Duplex/Semiduplex I classis", `-ii` is II classis, unsuffixed is the
// III-class tier (see cal/types.ts and archive/plan-2-rank-redesign.md for
// the canonical 14-grade table).
export const CLASS_I_GRADES: readonly Grade[] = [
  "triduum",
  "duplex-i",
  "duplex-majus-i",
  "semiduplex-i",
];
export const CLASS_II_GRADES: readonly Grade[] = ["duplex-ii", "semiduplex-ii"];
export const CLASS_III_GRADES: readonly Grade[] = [
  "duplex-majus",
  "duplex",
  "semiduplex",
];
// `feria-privilegiata` is Ash Wednesday and Holy Week Mon–Wed — ranked high in
// precedence but a feria, and always penitential.
export const FERIA_GRADES: readonly Grade[] = [
  "feria-privilegiata",
  "feria-major",
  "vigilia",
  "feria",
];

// Ad libitum fallbacks for a day whose calendar entry names no mass at all.
// `mass` doubles as the lookup key into the Kyriale, so a fallback must name a
// mass the book actually carries. These two carried mass 0 — a number no Kyriale
// entry has — so the fallback silently resolved to nothing: the ordinary came
// back with a Credo and the sprinkling and no Kyrie, Gloria, Sanctus or Agnus at
// all, on roughly 50 days a year. The numbers below are the settings these
// entries are already named after: de Angelis IS mass VIII, Cum jubilo IS the
// BVM mass. An open editorial question on bvm: "Missa Salve" could instead
// point at the ad libitum Kyrie Salve (appendix); mass IX is the plain reading
// of "de Beata Maria".
export const AD_LIB: { standard: MassEntry; bvm: MassEntry } = {
  standard: {
    id: "adlib_standard",
    mass: 8,
    title: "Missa de Angelis (short)",
    rubric: "class-ii",
    heading: "For feasts of the II class. 5.",
    bvm: false,
    credos: ["I"],
    notes: "Ad libitum variant for ordinary Sundays.",
  },
  bvm: {
    id: "adlib_bvm",
    mass: 9,
    title: "Missa de Beata Maria (Missa Salve)",
    rubric: "bvm",
    heading: "For feasts of the Blessed Virgin. 1.",
    bvm: true,
    credos: [],
    notes: "BVM Saturdays outside privileged seasons.",
  },
};

export const MASSES: Map<number, MassEntry> = new Map([
  [
    1,
    {
      id: "mass_1",
      mass: 1,
      title: "Lux et Origo",
      rubric: "paschal" as MassRubric,
      heading: "I. — In Paschal Time.",
      bvm: false,
      credos: ["I", "III"],
      notes: "Sundays of Paschaltide; also solemn feasts in Paschaltide.",
    },
  ],
  [
    2,
    {
      id: "mass_2",
      mass: 2,
      title: "Kyrie fons bonitatis",
      rubric: "class-i" as MassRubric,
      heading: "II. — For feasts of the I class. 1.",
      bvm: false,
      credos: ["I", "III"],
      notes: "Solemn feasts of the Lord during Paschaltide.",
    },
  ],
  [
    3,
    {
      id: "mass_3",
      mass: 3,
      title: "Kyrie Deus sempiterne",
      rubric: "class-i" as MassRubric,
      heading: "III. — For feasts of the I class. 2.",
      bvm: false,
      credos: ["I", "III"],
      notes:
        "Solemn feasts of the Lord outside Paschaltide, especially at Christmas/Epiphany.",
    },
  ],
  [
    4,
    {
      id: "mass_4",
      mass: 4,
      title: "Cunctipotens genitor Deus",
      rubric: "class-ii" as MassRubric,
      heading: "IV. — For feasts of the II class. 1.",
      bvm: false,
      credos: ["I", "III"],
      notes: "Feasts of the Apostles and major solemnities.",
    },
  ],
  [
    5,
    {
      id: "mass_5",
      mass: 5,
      title: "Kyrie magnæ Deus potentiæ",
      rubric: "class-ii" as MassRubric,
      heading: "V. — For feasts of the II class. 2.",
      bvm: false,
      credos: [],
      notes: "For Apostles and certain solemnities.",
    },
  ],
  [
    6,
    {
      id: "mass_6",
      mass: 6,
      title: "Kyrie Rex genitor",
      rubric: "class-ii" as MassRubric,
      heading: "VI. — For feasts of the II class. 3.",
      bvm: false,
      credos: [],
      notes: "For Confessors (non-bishops).",
    },
  ],
  [
    7,
    {
      id: "mass_7",
      mass: 7,
      title: "Kyrie Rex splendens",
      rubric: "class-ii" as MassRubric,
      heading: "VII. — For feasts of the II class. 4.",
      bvm: false,
      credos: [],
      notes: "For Sundays after Epiphany and after Pentecost (EF).",
    },
  ],
  [
    8,
    {
      id: "mass_8",
      mass: 8,
      title: "De Angelis",
      rubric: "class-ii" as MassRubric,
      heading: "VIII. — For feasts of the II class. 5.",
      bvm: false,
      credos: ["I", "III"],
      notes: "Commonly used for Sundays per annum.",
    },
  ],
  [
    9,
    {
      id: "mass_9",
      mass: 9,
      title: "Cum jubilo",
      rubric: "bvm" as MassRubric,
      heading: "IX. — For feasts of the Blessed Virgin. 1.",
      bvm: true,
      credos: ["IV"],
      notes:
        "Mass of the Blessed Virgin Mary; often for BVM feasts and Saturdays.",
    },
  ],
  [
    10,
    {
      id: "mass_10",
      mass: 10,
      title: "Alme Pater",
      rubric: "bvm" as MassRubric,
      heading: "X. — For feasts of the Blessed Virgin. 2.",
      bvm: true,
      credos: [],
      notes: "Marian Kyriale",
    },
  ],
  [
    11,
    {
      id: "mass_11",
      mass: 11,
      title: "Orbis factor",
      rubric: "sunday" as MassRubric,
      heading: "XI. — For Sundays throughout the Year.",
      bvm: false,
      credos: ["I", "III"],
      notes: "For Sundays per annum (after Epiphany and after Pentecost).",
    },
  ],
  [
    12,
    {
      id: "mass_12",
      mass: 12,
      title: "Pater cuncta",
      rubric: "class-iii" as MassRubric,
      heading: "XII. — For feasts of the III class. 1.",
      bvm: false,
      credos: [],
      notes: "For Sundays after Pentecost.",
    },
  ],
  [
    13,
    {
      id: "mass_13",
      mass: 13,
      title: "Stelliferi conditor orbis",
      rubric: "class-iii" as MassRubric,
      heading: "XIII. — For feasts of the III class. 2.",
      bvm: false,
      credos: [],
      notes: "For Sundays after Pentecost.",
    },
  ],
  [
    14,
    {
      id: "mass_14",
      mass: 14,
      title: "Jesu Redemptor",
      rubric: "class-iii" as MassRubric,
      heading: "XIV. — For feasts of the III class. 3.",
      bvm: false,
      credos: [],
      notes: "For Confessor Bishops.",
    },
  ],
  [
    15,
    {
      id: "mass_15",
      mass: 15,
      title: "Dominator Deus",
      rubric: "commemoration" as MassRubric,
      heading: "XV. — For commemorations.",
      bvm: false,
      credos: [],
      notes: "For Sundays after Pentecost of lower solemnity.",
    },
  ],
  [
    16,
    {
      id: "mass_16",
      mass: 16,
      title: "Deus genitor alme",
      rubric: "feria" as MassRubric,
      heading: "XVI. — For ferias throughout the Year.",
      bvm: false,
      credos: [],
      notes: "For lower-rank Sundays after Pentecost.",
    },
  ],
  [
    17,
    {
      id: "mass_17",
      mass: 17,
      title: "Salve",
      rubric: "sunday-penitential" as MassRubric,
      heading: "XVII. — For the Sundays of Advent and Lent.",
      bvm: false,
      credos: ["IV"],
      notes: "For Sundays of Advent, pre-Lent, and Lent.",
    },
  ],
  [
    18,
    {
      id: "mass_18",
      mass: 18,
      title: "Deus Genitor alme",
      rubric: "feria-penitential" as MassRubric,
      heading: "XVIII. — For the ferias of Advent and Lent.",
      bvm: false,
      credos: [],
      notes: "For weekdays of Advent, pre-Lent, and Lent; penitential ferias.",
    },
  ],
]);

/** The masses the book appoints under one rubric, in mass-number order. */
export function massesForRubric(rubric: MassRubric): MassEntry[] {
  return [...MASSES.values()]
    .filter((m) => m.rubric === rubric)
    .sort((a, b) => a.mass - b.mass);
}

// ── Kyriale century ascriptions ─────────────────────────────────────────────
// What the Vatican/Solesmes editors PRINT above each setting: "X. s." (saeculum
// X), "XI-XIII. s." for a span, "(X) XIV-XVI. s." where they record an
// alternative reading, and "?. s." where they decline to date it at all.
//
// ── THIS IS NOT MANUSCRIPT ATTESTATION ──────────────────────────────────────
// CANTUS dates a chant by the manuscripts that carry it. This dates it by
// editorial judgement, and the two must never be conflated — a census block
// carrying one of these sets flags bit2 (centuryEditorial) so a consumer can
// tell them apart. The Kyriale is outside CANTUS's index (CANTUS covers the
// Office; the Mass Ordinary is a separate scholarly tradition catalogued by
// Melnicki/Bosse/Thannabaur/Schildbach), which is why this table exists at all.
//
// Transcribed from the Kyriale Romanum (Bund fur Liturgie und Gregorianik,
// 2001, after the Graduale Romanum 1961) — media.musicasacra.com/pdf/kyriale.pdf
// — by machine extraction of its text layer, 74 ascriptions across 18 Masses
// and 6 Credos.
//
// Every value below is an editorial claim, still to be checked against the
// shelf copy. Four entries marked `inferred` had their PART resolved by
// position (the ascription sits between two identified parts in liturgical
// order) rather than by a legible incipit; the CENTURY is printed either way.
// Cross-check candidates: Melnicki (Kyrie), Bosse (Gloria), Thannabaur
// (Sanctus), Schildbach (Agnus).
export interface MassCentury {
  /** Earliest century the editors give (10 = the 900s); null where they print "?". */
  from: number | null;
  /** Latest, for a printed span like "XI-XIII. s."; equals `from` for a single. */
  to: number | null;
  /** A parenthesized alternative reading, e.g. "(X) XIV-XVI. s." → 10. */
  alt?: number;
  /** The part's century was read from position, not from a legible incipit. */
  inferred?: true;
  /** The token exactly as printed, so the claim stays auditable. */
  printed: string;
}

/** mass number → ordinary code → what the Kyriale prints. */
export const MASS_CENTURY: Record<number, Partial<Record<string, MassCentury>>> = {
  // Mass I — Lux et Origo
  1: {
    ke: { from: 10, to: 10, printed: "X. s." },
    gl: { from: 10, to: 10, printed: "X. s." },
    sa: { from: 10, to: 10, printed: "X. s." },
    ag: { from: 10, to: 10, printed: "X. s." },
  },
  // Mass II — Kyrie fons bonitatis
  2: {
    ke: { from: 10, to: 10, printed: "X. s." },
    gl: { from: 13, to: 13, printed: "XIII. s." },
    ag: { from: 10, to: 10, printed: "X. s." },
  },
  // Mass III — Kyrie Deus sempiterne
  3: {
    ke: { from: 11, to: 11, inferred: true, printed: "XI. s." },
    gl: { from: 11, to: 11, printed: "XI. s." },
    sa: { from: 12, to: 12, alt: 11, printed: "(XI) XII. s." },
    ag: { from: 11, to: 12, printed: "XI-XII. s." },
  },
  // Mass IV — Cunctipotens Genitor Deus
  4: {
    ke: { from: 10, to: 10, printed: "X. s." },
    gl: { from: 10, to: 10, printed: "X. s." },
    sa: { from: 11, to: 11, printed: "XI. s." },
    ag: { from: 13, to: 13, alt: 12, printed: "(XII) XIII. s." },
  },
  // Mass V — Kyrie magnæ Deus potentiæ
  5: {
    ke: { from: 13, to: 13, printed: "XIII. s." },
    gl: { from: 12, to: 12, printed: "XII. s." },
    sa: { from: 12, to: 12, printed: "XII. s." },
    ag: { from: 12, to: 12, printed: "XII. s." },
  },
  // Mass VI — Kyrie Rex Genitor
  6: {
    ke: { from: 10, to: 10, printed: "X. s." },
    gl: { from: 10, to: 10, printed: "X. s." },
    sa: { from: 11, to: 11, printed: "XI. s." },
    ag: { from: 11, to: 11, printed: "XI. s." },
  },
  // Mass VII — Kyrie Rex splendes
  7: {
    ke: { from: 10, to: 10, printed: "X. s." },
    gl: { from: 12, to: 12, printed: "XII. s." },
    sa: { from: 11, to: 11, printed: "XI. s." },
    ag: { from: 15, to: 15, printed: "XV. s." },
  },
  // Mass VIII — de Angelis
  8: {
    ke: { from: 15, to: 16, printed: "XV-XVI. s." },
    gl: { from: 16, to: 16, printed: "XVI. s." },
    sa: { from: 12, to: 12, alt: 11, printed: "(XI) XII. s." },
    ag: { from: 15, to: 15, printed: "XV. s." },
  },
  // Mass IX — Cum Jubilo
  9: {
    ke: { from: 12, to: 12, printed: "XII. s." },
    gl: { from: 11, to: 11, printed: "XI. s." },
    sa: { from: 14, to: 14, printed: "XIV. s." },
    ag: { from: 13, to: 13, alt: 10, printed: "(X) XIII. s." },
  },
  // Mass X — Alme Pater
  10: {
    ke: { from: 11, to: 11, printed: "XI. s." },
    gl: { from: 15, to: 15, printed: "XV. s." },
    sa: { from: null, to: null, printed: "?. s." },
    ag: { from: 12, to: 12, printed: "XII. s." },
  },
  // Mass XI — Orbis factor
  11: {
    ke: { from: 14, to: 16, alt: 10, printed: "(X) XIV-XVI. s." },
    gl: { from: 10, to: 10, printed: "X. s." },
    sa: { from: 10, to: 10, printed: "X. s." },
    ag: { from: 14, to: 14, printed: "XIV. s." },
  },
  // Mass XII — Pater cuncta
  12: {
    ke: { from: 12, to: 12, printed: "XII. s." },
    gl: { from: 12, to: 12, inferred: true, printed: "XII. s." },
    sa: { from: 13, to: 13, printed: "XIII. s." },
    ag: { from: 11, to: 11, printed: "XI. s." },
  },
  // Mass XIII — Stelliferi Conditor orbis
  13: {
    ke: { from: 11, to: 11, printed: "XI. s." },
    gl: { from: 12, to: 12, printed: "XII. s." },
    sa: { from: 13, to: 13, printed: "XIII. s." },
    ag: { from: null, to: null, printed: "? s." },
  },
  // Mass XIV — Jesu Redemptor
  14: {
    ke: { from: 10, to: 10, inferred: true, printed: "X. s." },
    gl: { from: 10, to: 10, printed: "X. s." },
    sa: { from: 12, to: 12, inferred: true, printed: "XII. s." },
    ag: { from: 13, to: 13, printed: "XIII. s." },
  },
  // Mass XV — Dominator Deus
  15: {
    ke: { from: 11, to: 13, printed: "XI-XIII. s." },
    gl: { from: 10, to: 10, printed: "X. s." },
    sa: { from: 10, to: 10, printed: "X. s." },
    ag: { from: 14, to: 14, alt: 12, printed: "(XII) XIV. s." },
  },
  // Mass XVI
  16: {
    ke: { from: 11, to: 13, printed: "XI-XIII. s." },
    sa: { from: 13, to: 13, printed: "XIII. s." },
    ag: { from: 10, to: 11, printed: "X-XI. s." },
  },
  // Mass XVII
  17: {
    ke: { from: 15, to: 17, alt: 10, printed: "(X) XV-XVII. s." },
    sa: { from: 11, to: 11, printed: "XI. s." },
    ag: { from: 13, to: 13, printed: "XIII. s." },
  },
  // Mass XVIII — Deus Genitor alme
  18: {
    ke: { from: 11, to: 11, printed: "XI. s." },
    sa: { from: 13, to: 13, printed: "XIII. s." },
    ag: { from: 12, to: 12, printed: "XII. s." },
  },
};

/** Credo number (roman, as the Kyriale names them) → its ascription. */
export const CREDO_CENTURY: Record<string, MassCentury> = {
  I: { from: 11, to: 11, printed: "XI. s." },
  II: { from: null, to: null, printed: "?. s." },
  III: { from: 17, to: 17, printed: "XVII. s." },
  IV: { from: 15, to: 15, printed: "XV. s." },
  V: { from: 12, to: 12, printed: "XII. s." },
  VI: { from: 11, to: 11, printed: "XI. s." },
};

// ── The Kyriale era rule ────────────────────────────────────────────────────
// A LATEST-CENTURY bound on ORDINARY settings, and nothing more. Scope matters
// here, so it is stated plainly rather than implied:
//
// This is NOT a corpus-wide era filter. tonus has per-chant EDITORIAL dates
// for the Kyriale and for nothing else — 71 of 2,860 shipped chants, 2.5%. A
// bound applied beyond that would be filtering 97.5% of the repertory on data
// that does not exist. The attestation filter learned this the hard way: at
// 69% coverage it answered "what was sung in 1098" by deleting the Night
// Office, because CANTUS had not yet dated the responsories, and it stayed
// retired until the coverage was closed (see chant/attest.ts). 2.5% is the
// stricter version of the same mistake.
//
// So the corpus's period is set by THE CUT — it ships what the liturgy places —
// and this rule only keeps the ordinary from reaching for a setting the
// Kyriale's own editors date to the Renaissance. Within its 2.5% the data is
// near-complete (66 of 72 mass parts printed) and per-part, which is what makes
// it safe to act on where CANTUS attestation was not.
//
// The cutoff: Docta Sanctorum Patrum, John XXII's bull at Avignon (1324),
// condemning the ars nova and insisting the plainchant melodies stay "intact
// and recognizable as such" — the liturgy's own line between the chant
// tradition and what followed. It lands on the seam already in the data:
// Kyriale parts by century run 10th 21 · 11th 17 · 12th 13 · 13th 8 · then
// 14th 2. A cliff, not a slope.
//
// There is deliberately NO lower bound. An earlier draft carried ERA_FROM=754
// (the Frankish adoption of the Roman rite), which read as doctrine but was
// unenforceable: nothing in the corpus is checked against it and no data could
// check it. A constant nothing enforces is a claim, not a rule.
export const ORDINARY_LATEST_YEAR = 1324;

/**
 * The latest century a year admits WHOLE.
 *
 * The Kyriale dates a setting only to its century, so 1324 cannot admit "the
 * 14th century" — a chant marked XIV. s. may have been written in 1390, well
 * after the bull. A century is admitted only when it has CLOSED by the bound:
 * 1324 → 13 (through the 1200s), 1300 → 13 (the century closes at its
 * hundredth year). This is the same closed-century rule attest.ts applies to
 * `before` — floor, not ceil, so an exact century year admits the century it
 * ends. It is what keeps Mass IX's XIV-c Sanctus and Mass XI's XIV-c Agnus
 * out, which is the whole point of choosing 1324.
 */
function latestWholeCentury(year: number): number {
  return Math.floor(year / 100);
}

/**
 * Whether a Kyriale setting is early enough to sing.
 *
 * PER PART, never per mass. The Kyriale is a 19th-c Solesmes GROUPING of chants
 * from different centuries — which is why its ascriptions are per-part in the
 * first place. Mass XI "Orbis factor" is a 10th-c Kyrie + 10th Gloria + 10th
 * Sanctus with a 14th-c Agnus bolted on; a whole-mass test would lose the
 * ordinary Sunday mass over one late part. The book licenses the per-part
 * result outright — "chants from one Mass may be used together with those from
 * others, the Ferial Masses excepted" — so a dropped part simply borrows, which
 * is the machinery entriesForOffice() already runs.
 *
 * `alt` wins where the editors print one. Mass XI's Kyrie reads "(X) XIV-XVI.
 * s." — the parenthetical is the melody, the late reading is whichever
 * manuscript they transcribed. Modern scholarship agrees: Corpus Monodicum
 * (Brill, 2024) dates Orbis factor to the 10th-12th c.
 *
 * An undated part (the editors' own "?. s.") is ADMITTED, not excluded —
 * undated is not late, and excluding it would repeat the mistake that killed
 * the attestation filter. Same for a part with no entry at all: this rule can
 * only remove a setting the Kyriale itself dates late, never one it is silent
 * about.
 */
export function partWithinEra(
  mass: number | null | undefined,
  office: string | null | undefined,
  toYear: number = ORDINARY_LATEST_YEAR,
): boolean {
  if (mass == null || !office) return true;
  const entry = MASS_CENTURY[mass]?.[office];
  if (!entry) return true;                       // no printed century → admit
  const century = entry.alt ?? entry.from;
  if (century == null) return true;              // "?. s." → admit
  return century <= latestWholeCentury(toYear);
}
