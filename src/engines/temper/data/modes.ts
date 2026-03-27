// ---------------------------------------------------------------------------
// engines/temper/data/modes — eight Gregorian modes (I–VIII)
// ---------------------------------------------------------------------------

export interface ModeProfile {
  mood: string;
  phrasing: "recitative" | "lyrical" | "hymnic" | "solemn";
  melodic: "rising" | "falling" | "arch" | "neutral";
  tendency: "melismatic" | "neumatic" | "syllabic" | "neutral";
}

export interface ModeData {
  mode: number;
  name: string;       // Latin: "Protus Authenticus", etc.
  alias: string;      // Greek: "dorian", "hypodorian", etc.
  family: string;     // "Protus" | "Deuterus" | "Tritus" | "Tetrardus"
  type: "authentic" | "plagal";
  final: number;      // finalis pitch class (C=0)
  tenor: number;      // reciting tone pitch class
  scalePcs: number[]; // 7 diatonic pitch classes
  hexachords: ("durum" | "naturale" | "molle")[];
  profile: ModeProfile;
  cadences: { final: number[]; tenor: number[] };
  modulations: {
    regular: number[];   // principal tonal centers; >12 = upper octave
    conceded: number[];  // permitted secondary points
    initials: number[];  // valid chant opening pitches
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
      name: "Protus Authenticus",
      alias: "dorian",
      family: "Protus",
      type: "authentic",
      final: 2,
      tenor: 9,
      scalePcs: [2, 4, 5, 7, 9, 11, 0],
      hexachords: ["naturale"],
      profile: { mood: "serious", phrasing: "lyrical", melodic: "falling", tendency: "melismatic" },
      cadences: { final: [5, 4, 2], tenor: [9, 2] },
      modulations: { regular: [2, 9, 5, 7], conceded: [12, 4], initials: [2, 5, 7, 9, 14] },
      ambitus: { lowest: 2, highest: 21, span: 19 },
      species: { fifth: [2, 9], fourth: [9, 2] },
    },
  ],
  [
    2,
    {
      mode: 2,
      name: "Protus Plagalis",
      alias: "hypodorian",
      family: "Protus",
      type: "plagal",
      final: 2,
      tenor: 5,
      scalePcs: [2, 4, 5, 7, 9, 11, 0],
      hexachords: ["naturale"],
      profile: { mood: "sad", phrasing: "lyrical", melodic: "arch", tendency: "neumatic" },
      cadences: { final: [8, 7, 5], tenor: [0, 5] },
      modulations: { regular: [2, 5, 7, 9], conceded: [0, 4], initials: [0, 2, 4, 5, 7, 9] },
      ambitus: { lowest: 0, highest: 17, span: 17 },
      species: { fifth: [2, 9], fourth: [9, 2] },
    },
  ],
  [
    3,
    {
      mode: 3,
      name: "Deuterus Authenticus",
      alias: "phrygian",
      family: "Deuterus",
      type: "authentic",
      final: 4,
      tenor: 0,
      scalePcs: [4, 5, 7, 9, 11, 0, 2],
      hexachords: ["naturale"],
      profile: { mood: "mystic", phrasing: "solemn", melodic: "falling", tendency: "melismatic" },
      cadences: { final: [7, 6, 4], tenor: [0, 4] },
      modulations: { regular: [4, 0, 7, 9], conceded: [5, 11], initials: [0, 2, 4, 7, 9] },
      ambitus: { lowest: 4, highest: 16, span: 12 },
      species: { fifth: [4, 11], fourth: [11, 4] },
    },
  ],
  [
    4,
    {
      mode: 4,
      name: "Deuterus Plagalis",
      alias: "hypophrygian",
      family: "Deuterus",
      type: "plagal",
      final: 4,
      tenor: 9,
      scalePcs: [4, 5, 7, 9, 11, 0, 2],
      hexachords: ["naturale"],
      profile: { mood: "harmonious", phrasing: "lyrical", melodic: "arch", tendency: "neumatic" },
      cadences: { final: [7, 6, 4], tenor: [9, 4] },
      modulations: { regular: [4, 9, 7, 0], conceded: [11], initials: [0, 4, 7, 9] },
      ambitus: { lowest: 2, highest: 21, span: 19 },
      species: { fifth: [4, 11], fourth: [11, 4] },
    },
  ],
  [
    5,
    {
      mode: 5,
      name: "Tritus Authenticus",
      alias: "lydian",
      family: "Tritus",
      type: "authentic",
      final: 5,
      tenor: 0,
      scalePcs: [5, 7, 9, 11, 0, 2, 4],
      hexachords: ["molle"],
      profile: { mood: "happy", phrasing: "solemn", melodic: "rising", tendency: "melismatic" },
      cadences: { final: [8, 7, 5], tenor: [0, 5] },
      modulations: { regular: [5, 0, 7, 12], conceded: [9, 2], initials: [5, 7, 9, 0, 12] },
      ambitus: { lowest: 5, highest: 17, span: 12 },
      species: { fifth: [5, 0], fourth: [0, 5] },
    },
  ],
  [
    6,
    {
      mode: 6,
      name: "Tritus Plagalis",
      alias: "hypolydian",
      family: "Tritus",
      type: "plagal",
      final: 5,
      tenor: 9,
      scalePcs: [5, 7, 9, 11, 0, 2, 4],
      hexachords: ["molle"],
      profile: { mood: "devout", phrasing: "lyrical", melodic: "arch", tendency: "neumatic" },
      cadences: { final: [8, 7, 5], tenor: [9, 5] },
      modulations: { regular: [5, 9, 0, 7], conceded: [2, 12], initials: [0, 2, 4, 5, 7, 9] },
      ambitus: { lowest: 3, highest: 21, span: 18 },
      species: { fifth: [5, 0], fourth: [0, 5] },
    },
  ],
  [
    7,
    {
      mode: 7,
      name: "Tetrardus Authenticus",
      alias: "mixolydian",
      family: "Tetrardus",
      type: "authentic",
      final: 7,
      tenor: 2,
      scalePcs: [7, 9, 11, 0, 2, 4, 5],
      hexachords: ["durum"],
      profile: { mood: "angelical", phrasing: "solemn", melodic: "rising", tendency: "melismatic" },
      cadences: { final: [10, 9, 7], tenor: [2, 7] },
      modulations: { regular: [7, 2, 9, 14], conceded: [5, 0], initials: [7, 9, 11, 2, 14] },
      ambitus: { lowest: 7, highest: 19, span: 12 },
      species: { fifth: [7, 2], fourth: [2, 7] },
    },
  ],
  [
    8,
    {
      mode: 8,
      name: "Tetrardus Plagalis",
      alias: "hypomixolydian",
      family: "Tetrardus",
      type: "plagal",
      final: 7,
      tenor: 0,
      scalePcs: [7, 9, 11, 0, 2, 4, 5],
      hexachords: ["durum"],
      profile: { mood: "perfect", phrasing: "lyrical", melodic: "arch", tendency: "neumatic" },
      cadences: { final: [10, 9, 7], tenor: [0, 7] },
      modulations: { regular: [7, 0, 9, 14], conceded: [2, 5], initials: [0, 2, 4, 7, 9, 12, 14] },
      ambitus: { lowest: 5, highest: 19, span: 14 },
      species: { fifth: [7, 2], fourth: [2, 7] },
    },
  ],
]);
