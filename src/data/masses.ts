// humana/data/masses — 18 kyriale mass profiles
//
// Describes which masses are appropriate for a given season, grade, and day.
// Mass 0 has two ad-lib variants (index 0a/0b); all others are single entries.
import {
  type Season,
  type Dignitas,
  DIGNITAS_ORDER,
} from "../engines/cal/types.js";

export interface MassEntry {
  id: string;
  mass: number; // 0–18
  title: string;
  seasons: Season[]; // liturgical seasons this mass serves
  grades: Dignitas[]; // feast grades (dignities) this mass serves
  days: ("dominica" | "feria")[];
  bvm: boolean; // BVM-specific mass
  credos: string[]; // allowed Credo numerals
  notes: string;
}

// Inclusive slice of DIGNITAS_ORDER from `high` (more solemn) to `low`.
// e.g. gradesFrom("duplex-i", "duplex-ii") lists every grade between them.
function gradesFrom(high: Dignitas, low: Dignitas): Dignitas[] {
  const hi = DIGNITAS_ORDER.indexOf(high);
  const lo = DIGNITAS_ORDER.indexOf(low);
  return DIGNITAS_ORDER.slice(hi, lo + 1);
}

// Ad libitum entries are not part of the numbered kyriale; they serve as a
// last-resort fallback when no numbered mass matches the feast context.
export const AD_LIB: { standard: MassEntry; bvm: MassEntry } = {
  standard: {
    id: "adlib_standard",
    mass: 0,
    title: "Missa de Angelis (short)",
    seasons: ["epi", "nat"],
    grades: gradesFrom("duplex-ii", "feria"),
    days: ["dominica"],
    bvm: false,
    credos: ["I"],
    notes: "Ad libitum variant for ordinary Sundays.",
  },
  bvm: {
    id: "adlib_bvm",
    mass: 0,
    title: "Missa de Beata Maria (Missa Salve)",
    seasons: ["epi", "pent"],
    grades: gradesFrom("semiduplex", "feria"),
    days: ["feria"],
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
      seasons: ["pasc"],
      grades: gradesFrom("triduum", "duplex-ii"),
      days: ["dominica"],
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
      seasons: ["pasc"],
      grades: gradesFrom("triduum", "duplex-ii"),
      days: ["dominica", "feria"],
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
      seasons: ["nat", "epi"],
      grades: gradesFrom("duplex-i", "duplex-ii"),
      days: ["dominica", "feria"],
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
      seasons: ["nat", "epi", "pasc", "pent"],
      grades: gradesFrom("duplex-i", "duplex-ii"),
      days: ["dominica", "feria"],
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
      seasons: ["nat", "epi", "pasc", "pent"],
      grades: gradesFrom("duplex-i", "duplex-ii"),
      days: ["dominica"],
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
      seasons: ["nat", "epi", "pasc", "pent"],
      grades: gradesFrom("duplex-ii", "semiduplex"),
      days: ["feria", "dominica"],
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
      seasons: ["epi", "pent"],
      grades: gradesFrom("duplex-ii", "duplex"),
      days: ["dominica"],
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
      seasons: ["epi", "nat", "pent"],
      grades: gradesFrom("duplex-i", "feria"),
      days: ["dominica"],
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
      seasons: ["adv", "nat", "quad", "pasc", "epi", "pent"],
      grades: gradesFrom("triduum", "feria"),
      days: ["feria", "dominica"],
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
      seasons: ["adv", "nat", "quad", "pasc", "epi", "pent"],
      grades: gradesFrom("duplex-ii", "feria"),
      days: ["feria", "dominica"],
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
      seasons: ["epi", "pent"],
      grades: gradesFrom("duplex-ii", "feria"),
      days: ["dominica"],
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
      seasons: ["epi", "pent"],
      grades: gradesFrom("duplex-ii", "duplex"),
      days: ["dominica"],
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
      seasons: ["epi", "pent"],
      grades: gradesFrom("duplex-ii", "duplex"),
      days: ["dominica"],
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
      seasons: ["epi", "nat"],
      grades: gradesFrom("duplex-ii", "duplex"),
      days: ["feria", "dominica"],
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
      seasons: ["epi", "pent"],
      grades: gradesFrom("duplex-ii", "duplex"),
      days: ["dominica"],
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
      seasons: ["epi", "pent"],
      grades: gradesFrom("semiduplex", "simplex"),
      days: ["dominica"],
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
      seasons: ["adv", "quadp", "quad"],
      // Advent/Lent Sundays are Semiduplex I classis — the highest dignity in
      // these seasons — so the penitential Sunday mass must reach that far up.
      grades: gradesFrom("semiduplex-i", "feria"),
      days: ["dominica"],
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
      seasons: ["adv", "quadp", "quad"],
      // Penitential ferias: privileged ferias (Ash Wed, Holy Week Mon–Wed)
      // down through ordinary ferias.
      grades: gradesFrom("feria-privilegiata", "feria"),
      days: ["feria"],
      bvm: false,
      credos: [],
      notes: "For weekdays of Advent, pre-Lent, and Lent; penitential ferias.",
    },
  ],
]);
