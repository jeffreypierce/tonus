// humana/data/masses — 18 kyriale mass profiles
//
// Describes which masses are appropriate for a given season, rank, and day.
// Mass 0 has two ad-lib variants (index 0a/0b); all others are single entries.
export interface MassEntry {
  id: string;
  mass: number; // 0–18
  title: string;
  seasons: string[]; // season codes; "ot" and "ap" are treated as equivalent
  ranks: number[]; // applicable feast ranks (0–4)
  days: ("dominica" | "feria")[];
  bvm: boolean; // BVM-specific mass
  credos: string[]; // allowed Credo numerals
  notes: string;
}

// Ad libitum entries are not part of the numbered kyriale; they serve as a
// last-resort fallback when no numbered mass matches the feast context.
export const AD_LIB: { standard: MassEntry; bvm: MassEntry } = {
  standard: {
    id: "adlib_standard",
    mass: 0,
    title: "Missa de Angelis (short)",
    seasons: ["ot", "ct"],
    ranks: [2, 3, 4],
    days: ["dominica"],
    bvm: false,
    credos: ["I"],
    notes: "Ad libitum variant for ordinary Sundays.",
  },
  bvm: {
    id: "adlib_bvm",
    mass: 0,
    title: "Missa de Beata Maria (Missa Salve)",
    seasons: ["ot", "ap"],
    ranks: [3, 4],
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
      seasons: ["ea"],
      ranks: [0, 1, 2],
      days: ["dominica"],
      bvm: false,
      credos: ["I", "III"],
      notes: "Sundays of Eastertide; also solemn feasts in Paschaltide.",
    },
  ],
  [
    2,
    {
      id: "mass_2",
      mass: 2,
      title: "Kyrie fons bonitatis",
      seasons: ["ea"],
      ranks: [0, 1, 2],
      days: ["dominica", "feria"],
      bvm: false,
      credos: ["I", "III"],
      notes: "Solemn feasts of the Lord during Eastertide.",
    },
  ],
  [
    3,
    {
      id: "mass_3",
      mass: 3,
      title: "Kyrie Deus sempiterne",
      seasons: ["ct", "ot"],
      ranks: [1, 2],
      days: ["dominica", "feria"],
      bvm: false,
      credos: ["I", "III"],
      notes:
        "Solemn feasts of the Lord outside Eastertide, especially at Christmas/Epiphany.",
    },
  ],
  [
    4,
    {
      id: "mass_4",
      mass: 4,
      title: "Cunctipotens genitor Deus",
      seasons: ["ct", "ot", "ea"],
      ranks: [1, 2],
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
      seasons: ["ct", "ot", "ea"],
      ranks: [1, 2],
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
      seasons: ["ct", "ot", "ea"],
      ranks: [2, 3],
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
      seasons: ["ot", "ap"],
      ranks: [2],
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
      seasons: ["ot", "ct"],
      ranks: [1, 2, 3, 4],
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
      seasons: ["ad", "ct", "lt", "ea", "ot"],
      ranks: [0, 1, 2, 3, 4],
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
      seasons: ["ad", "ct", "lt", "ea", "ot"],
      ranks: [2, 3, 4],
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
      seasons: ["ot"],
      ranks: [2, 3, 4],
      days: ["dominica"],
      bvm: false,
      credos: ["I", "III"],
      notes: "For Sundays per annum.",
    },
  ],
  [
    12,
    {
      id: "mass_12",
      mass: 12,
      title: "Pater cuncta",
      seasons: ["ot", "ap"],
      ranks: [2],
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
      seasons: ["ot", "ap"],
      ranks: [2],
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
      seasons: ["ot", "ct"],
      ranks: [2],
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
      seasons: ["ot", "ap"],
      ranks: [2],
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
      seasons: ["ot", "ap"],
      ranks: [3],
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
      seasons: ["ad", "lt"],
      ranks: [2, 3, 4],
      days: ["dominica"],
      bvm: false,
      credos: ["IV"],
      notes: "For Sundays of Advent and Lent.",
    },
  ],
  [
    18,
    {
      id: "mass_18",
      mass: 18,
      title: "Deus Genitor alme",
      seasons: ["ad", "lt"],
      ranks: [3, 4],
      days: ["feria"],
      bvm: false,
      credos: [],
      notes: "For weekdays of Advent and Lent; penitential ferias.",
    },
  ],
]);
