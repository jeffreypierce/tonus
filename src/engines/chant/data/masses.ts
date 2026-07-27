// engines/chant/data/masses — the 18 kyriale mass profiles
//
// WHICH mass a day sings is decided by the Kyriale's own printed rubric, one
// category per mass, carried here as `rubric` and quoted verbatim in `heading`
// [biblio: liber-usualis-1961, Kyriale]. The book classifies by RANK — "For
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
// excepted." [liber-usualis-1961, Kyriale] — so slots may mix freely EXCEPT
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
// III-class tier (see cal/types.ts and archive/plan-2-rank-redesign.md, the
// 14-grade table ratified 2026-07-02).
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
// BVM mass.
// 【DECISIO ⟨Jeffrey⟩ — bvm: "Missa Salve" could instead point at the ad libitum
// Kyrie Salve (appendix); mass IX is the plain reading of "de Beata Maria".】
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
