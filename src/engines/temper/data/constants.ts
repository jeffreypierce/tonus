// ---------------------------------------------------------------------------
// engines/temper/data/constants — pitch-class vocabulary, solfège, intervals
// ---------------------------------------------------------------------------

/** 12 pitch-class names, index = pitch class 0–11. Sharp-biased except Eb/Ab/Bb. */
export const PITCH_CLASS = [
  "C",
  "C#",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "G",
  "Ab",
  "A",
  "Bb",
  "B",
] as const;

/** Diatonic step letters in ascending order. */
export const DIATONIC_STEPS = ["C", "D", "E", "F", "G", "A", "B"] as const;

export type DiatonicStep = (typeof DIATONIC_STEPS)[number];

/** Map any note name (including enharmonics) to its pitch class 0–11. */
export const NAME_TO_CHROMA = new Map<string, number>([
  ["C", 0],
  ["B#", 0],
  ["C#", 1],
  ["Db", 1],
  ["D", 2],
  ["D#", 3],
  ["Eb", 3],
  ["E", 4],
  ["Fb", 4],
  ["E#", 5],
  ["F", 5],
  ["F#", 6],
  ["Gb", 6],
  ["G", 7],
  ["G#", 8],
  ["Ab", 8],
  ["A", 9],
  ["A#", 10],
  ["Bb", 10],
  ["B", 11],
  ["Cb", 11],
]);

// Modern fixed-do solfège → pitch class (input only; UT = C always)
export const SOLFEGE_TO_CHROMA = new Map<string, number>([
  ["UT", 0],
  ["DO", 0],
  ["RE", 2],
  ["MI", 4],
  ["FA", 5],
  ["SOL", 7],
  ["SO", 7],
  ["LA", 9],
  ["TE", 10],
  ["TI", 11],
  ["SI", 11],
]);

// Diatonic pitch class → Guidonian solfège name (UT system, medieval 6-syllable)
// pc 10 (Bb) = FA in molle hexachord; pc 11 (B) = MI in durum hexachord
// Chromatic pcs have no canonical name — use lookupGuido() for context-aware solmization
export const CHROMA_TO_SOLFEGE = new Map<number, string>([
  [0, "UT"],
  [2, "RE"],
  [4, "MI"],
  [5, "FA"],
  [7, "SOL"],
  [9, "LA"],
  [10, "FA"], // Bb — b-molle
  [11, "MI"], // B  — b-durum
]);

// Interval table

export interface IntervalEntry {
  latin: string;
  alias?: string;
  degree: number;
  quality: "perfect" | "major" | "minor" | "augmented" | "diminished";
  class: string;
}

// Entries indexed by semitone count 0–11.
// semitone=0: use UNISONUS when abs=0, this entry when abs=12 (octave).
export const INTERVAL: IntervalEntry[] = [
  {
    latin: "Octava",
    alias: "Diapason",
    degree: 8,
    quality: "perfect",
    class: "P8",
  },
  { latin: "Semitonium", degree: 2, quality: "minor", class: "m2" },
  { latin: "Tonus", degree: 2, quality: "major", class: "M2" },
  { latin: "Tertia minor", degree: 3, quality: "minor", class: "m3" },
  { latin: "Tertia maior", degree: 3, quality: "major", class: "M3" },
  {
    latin: "Quarta",
    alias: "Diatessaron",
    degree: 4,
    quality: "perfect",
    class: "P4",
  },
  { latin: "Tritonus", degree: 4, quality: "augmented", class: "TT" },
  {
    latin: "Quinta",
    alias: "Diapente",
    degree: 5,
    quality: "perfect",
    class: "P5",
  },
  { latin: "Sexta minor", degree: 6, quality: "minor", class: "m6" },
  { latin: "Sexta maior", degree: 6, quality: "major", class: "M6" },
  { latin: "Septima minor", degree: 7, quality: "minor", class: "m7" },
  { latin: "Septima maior", degree: 7, quality: "major", class: "M7" },
];

export const UNISONUS: IntervalEntry = {
  latin: "Unisonus",
  degree: 1,
  quality: "perfect",
  class: "P1",
};

// ── Pitch spelling tables (used by pitch.ts) ──

export interface StepAlter {
  step: DiatonicStep;
  acc: -1 | 0 | 1;
}

// prettier-ignore
export const SHARP_SPELLING: StepAlter[] = [
  { step: "C", acc: 0  }, // 0
  { step: "C", acc: 1  }, // 1
  { step: "D", acc: 0  }, // 2
  { step: "D", acc: 1  }, // 3
  { step: "E", acc: 0  }, // 4
  { step: "F", acc: 0  }, // 5
  { step: "F", acc: 1  }, // 6
  { step: "G", acc: 0  }, // 7
  { step: "G", acc: 1  }, // 8
  { step: "A", acc: 0  }, // 9
  { step: "A", acc: 1  }, // 10
  { step: "B", acc: 0  }, // 11
];

// prettier-ignore
export const FLAT_SPELLING: StepAlter[] = [
  { step: "C", acc: 0  }, // 0
  { step: "D", acc: -1 }, // 1
  { step: "D", acc: 0  }, // 2
  { step: "E", acc: -1 }, // 3
  { step: "E", acc: 0  }, // 4
  { step: "F", acc: 0  }, // 5
  { step: "G", acc: -1 }, // 6
  { step: "G", acc: 0  }, // 7
  { step: "A", acc: -1 }, // 8
  { step: "A", acc: 0  }, // 9
  { step: "B", acc: -1 }, // 10
  { step: "B", acc: 0  }, // 11
];

// Prefer flat spelling for Bb, Eb, Ab
export const PREFER_FLAT_PCS = new Set([3, 8, 10]);

// Guidonian solmization syllable → pitch class, by hexachord
export const GUIDO_TO_PC: Record<string, Record<string, number>> = {
  durum: { UT: 7, RE: 9, MI: 11, FA: 0, SOL: 2, LA: 4 },
  naturale: { UT: 0, RE: 2, MI: 4, FA: 5, SOL: 7, LA: 9 },
  molle: { UT: 5, RE: 7, MI: 9, FA: 10, SOL: 0, LA: 2 },
};
