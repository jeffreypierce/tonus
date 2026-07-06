// ---------------------------------------------------------------------------
// engines/temper/data/modes — eight Gregorian modes (I–VIII)
// ---------------------------------------------------------------------------

export interface ModeProfile {
  mood: string;    // English gloss of the ethos
  ethos: string;   // traditional Latin epithet: gravis, tristis, mysticus, …
  phrasing: "recitative" | "lyrical" | "hymnic" | "solemn";
  melodic: "rising" | "falling" | "arch" | "neutral";
  tendency: "melismatic" | "neumatic" | "syllabic" | "neutral";
}

// A melodic cadence figure — see docs/tuning.md#cadence-figures.
// Figures resolve onto the finalis; `id` is the solmization ("sol-fa-re").
export interface CadenceFigure {
  id: string;        // solmization, e.g. "sol-fa-re"
  steps: number[];   // diatonic steps relative to the final; resolution (0) last
}

export interface ModeData {
  mode: number;
  nomen: string;      // Latin: "Protus Authenticus", etc.
  alias: string;      // Greek: "dorian", "hypodorian", etc.
  maneria: string;    // "Protus" | "Deuterus" | "Tritus" | "Tetrardus"
  type: "authentic" | "plagal";
  final: number;      // finalis pitch class (C=0)
  tenor: number;      // reciting tone pitch class
  scalePcs: number[]; // 7 diatonic pitch classes
  hexachords: ("durum" | "naturale" | "molle")[];
  profile: ModeProfile;
  cadences: CadenceFigure[];   // characteristic cadence figures
  // Tonal centres and openings, each list in order of importance (after
  // Rockstro's Grove table — see docs/tuning.md). >12 = upper octave.
  modulations: {
    regular: number[];   // principal tonal centres (final, dominant, then others)
    conceded: number[];  // secondary centres, permitted but less characteristic
    initials: number[];  // valid opening pitches, most characteristic first
  };
  ambitus: {
    lowest: number;
    highest: number;  // >12 = upper octave
    span: number;
  };
  species: {
    fifth: [number, number];
    fourth: [number, number];
  };
}

export const MODES = new Map<number, ModeData>([
  [
    1,
    {
      mode: 1,
      nomen: "Protus Authenticus",
      alias: "dorian",
      maneria: "Protus",
      type: "authentic",
      final: 2,
      tenor: 9,
      scalePcs: [2, 4, 5, 7, 9, 11, 0],
      hexachords: ["naturale"],
      profile: { mood: "serious", ethos: "gravis", phrasing: "lyrical", melodic: "falling", tendency: "melismatic" },
      cadences: [
        { id: "mi-re", steps: [1, 0] },
        { id: "ut-re", steps: [-1, 0] },
        { id: "sol-fa-re", steps: [3, 2, 0] },
        { id: "mi-fa-re", steps: [1, 2, 0] },
      ],
      modulations: { regular: [2, 9, 5, 7], conceded: [12, 4], initials: [2, 5, 7, 9, 14] },
      ambitus: { lowest: 2, highest: 21, span: 19 },
      species: { fifth: [2, 9], fourth: [9, 2] },
    },
  ],
  [
    2,
    {
      mode: 2,
      nomen: "Protus Plagalis",
      alias: "hypodorian",
      maneria: "Protus",
      type: "plagal",
      final: 2,
      tenor: 5,
      scalePcs: [2, 4, 5, 7, 9, 11, 0],
      hexachords: ["naturale"],
      profile: { mood: "sad", ethos: "tristis", phrasing: "lyrical", melodic: "arch", tendency: "neumatic" },
      cadences: [
        { id: "mi-re", steps: [1, 0] },
        { id: "ut-re", steps: [-1, 0] },
        { id: "sol-fa-re", steps: [3, 2, 0] },
        { id: "mi-fa-re", steps: [1, 2, 0] },
      ],
      modulations: { regular: [2, 5, 7, 9], conceded: [0, 4], initials: [0, 2, 4, 5, 7, 9] },
      ambitus: { lowest: 0, highest: 17, span: 17 },
      species: { fifth: [2, 9], fourth: [9, 2] },
    },
  ],
  [
    3,
    {
      mode: 3,
      nomen: "Deuterus Authenticus",
      alias: "phrygian",
      maneria: "Deuterus",
      type: "authentic",
      final: 4,
      tenor: 0,
      scalePcs: [4, 5, 7, 9, 11, 0, 2],
      hexachords: ["naturale"],
      profile: { mood: "mystic", ethos: "mysticus", phrasing: "solemn", melodic: "falling", tendency: "melismatic" },
      cadences: [
        { id: "fa-mi", steps: [1, 0] },
        { id: "re-mi", steps: [-1, 0] },
        { id: "sol-fa-mi", steps: [2, 1, 0] },
      ],
      modulations: { regular: [4, 0, 7, 9], conceded: [5, 11], initials: [0, 2, 4, 7, 9] },
      ambitus: { lowest: 4, highest: 16, span: 12 },
      species: { fifth: [4, 11], fourth: [11, 4] },
    },
  ],
  [
    4,
    {
      mode: 4,
      nomen: "Deuterus Plagalis",
      alias: "hypophrygian",
      maneria: "Deuterus",
      type: "plagal",
      final: 4,
      tenor: 9,
      scalePcs: [4, 5, 7, 9, 11, 0, 2],
      hexachords: ["naturale"],
      profile: { mood: "harmonious", ethos: "harmonicus", phrasing: "lyrical", melodic: "arch", tendency: "neumatic" },
      cadences: [
        { id: "fa-mi", steps: [1, 0] },
        { id: "re-mi", steps: [-1, 0] },
        { id: "sol-fa-mi", steps: [2, 1, 0] },
      ],
      modulations: { regular: [4, 9, 7, 0], conceded: [11], initials: [0, 4, 7, 9] },
      ambitus: { lowest: 2, highest: 21, span: 19 },
      species: { fifth: [4, 11], fourth: [11, 4] },
    },
  ],
  [
    5,
    {
      mode: 5,
      nomen: "Tritus Authenticus",
      alias: "lydian",
      maneria: "Tritus",
      type: "authentic",
      final: 5,
      tenor: 0,
      scalePcs: [5, 7, 9, 11, 0, 2, 4],
      hexachords: ["molle"],
      profile: { mood: "happy", ethos: "laetus", phrasing: "solemn", melodic: "rising", tendency: "melismatic" },
      cadences: [
        { id: "mi-fa", steps: [-1, 0] },
        { id: "fa-mi-fa", steps: [0, -1, 0] },
        { id: "la-sol-fa", steps: [2, 1, 0] },
      ],
      modulations: { regular: [5, 0, 7, 12], conceded: [9, 2], initials: [5, 7, 9, 0, 12] },
      ambitus: { lowest: 5, highest: 17, span: 12 },
      species: { fifth: [5, 0], fourth: [0, 5] },
    },
  ],
  [
    6,
    {
      mode: 6,
      nomen: "Tritus Plagalis",
      alias: "hypolydian",
      maneria: "Tritus",
      type: "plagal",
      final: 5,
      tenor: 9,
      scalePcs: [5, 7, 9, 11, 0, 2, 4],
      hexachords: ["molle"],
      profile: { mood: "devout", ethos: "devotus", phrasing: "lyrical", melodic: "arch", tendency: "neumatic" },
      cadences: [
        { id: "mi-fa", steps: [-1, 0] },
        { id: "fa-mi-fa", steps: [0, -1, 0] },
        { id: "la-sol-fa", steps: [2, 1, 0] },
      ],
      modulations: { regular: [5, 9, 0, 7], conceded: [2, 12], initials: [0, 2, 4, 5, 7, 9] },
      ambitus: { lowest: 3, highest: 21, span: 18 },
      species: { fifth: [5, 0], fourth: [0, 5] },
    },
  ],
  [
    7,
    {
      mode: 7,
      nomen: "Tetrardus Authenticus",
      alias: "mixolydian",
      maneria: "Tetrardus",
      type: "authentic",
      final: 7,
      tenor: 2,
      scalePcs: [7, 9, 11, 0, 2, 4, 5],
      hexachords: ["durum"],
      profile: { mood: "angelical", ethos: "angelicus", phrasing: "solemn", melodic: "rising", tendency: "melismatic" },
      cadences: [
        { id: "la-sol", steps: [1, 0] },
        { id: "fa-sol", steps: [-1, 0] },
        { id: "ut-sol", steps: [3, 0] },
        { id: "ut-ti-sol", steps: [3, 2, 0] },
      ],
      modulations: { regular: [7, 2, 9, 14], conceded: [5, 0], initials: [7, 9, 11, 2, 14] },
      ambitus: { lowest: 7, highest: 19, span: 12 },
      species: { fifth: [7, 2], fourth: [2, 7] },
    },
  ],
  [
    8,
    {
      mode: 8,
      nomen: "Tetrardus Plagalis",
      alias: "hypomixolydian",
      maneria: "Tetrardus",
      type: "plagal",
      final: 7,
      tenor: 0,
      scalePcs: [7, 9, 11, 0, 2, 4, 5],
      hexachords: ["durum"],
      profile: { mood: "perfect", ethos: "perfectus", phrasing: "lyrical", melodic: "arch", tendency: "neumatic" },
      cadences: [
        { id: "la-sol", steps: [1, 0] },
        { id: "fa-sol", steps: [-1, 0] },
        { id: "ut-sol", steps: [3, 0] },
        { id: "ut-ti-sol", steps: [3, 2, 0] },
      ],
      modulations: { regular: [7, 0, 9, 14], conceded: [2, 5], initials: [0, 2, 4, 7, 9, 12, 14] },
      ambitus: { lowest: 5, highest: 19, span: 14 },
      species: { fifth: [7, 2], fourth: [2, 7] },
    },
  ],
]);
