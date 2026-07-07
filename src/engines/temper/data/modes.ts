// ---------------------------------------------------------------------------
// engines/temper/data/modes — eight Gregorian modes (I–VIII)
// ---------------------------------------------------------------------------

// The character medieval theory ascribed to each mode. The Latin epithets —
// gravis, tristis, mysticus, harmonicus, laetus, devotus, angelicus, perfectus —
// are Niedermeyer & d'Ortigue's [biblio: niedermeyer-ortigue]; `mood` is their
// English gloss. `phrasing`/`melodic`/`tendency` shape score interpretation.
export interface ModeProfile {
  mood: string;    // English gloss of the ethos
  ethos: string;   // traditional Latin epithet: gravis, tristis, mysticus, …
  phrasing: "recitative" | "lyrical" | "hymnic" | "solemn";
  melodic: "rising" | "falling" | "arch" | "neutral";
  tendency: "melismatic" | "neumatic" | "syllabic" | "neutral";
}

// A melodic cadence figure: a shape a mode's phrases characteristically close
// on. `id` is the solmization ("sol-fa-re"); `steps` are DIATONIC steps relative
// to the final — 0 is the final, -1 the note below, +2 a third above — the
// resolution (0) last. Steps, not absolute pitches, for two reasons: the
// treatises write cadences that way ("re-do-re"), and a step-figure matches a
// chant whether it sits on its regular final or a transposed one. The score
// engine (score/cadence.ts) reads these to name a phrase's cadence.
//
// The catalogue is an editorial synthesis, not a transcription of any one book —
// drawn chiefly from Niedermeyer & d'Ortigue [biblio: niedermeyer-ortigue], who
// give cadences in square notation per mode, and cross-checked against Bragers
// [biblio: bragers-treatise]; Suñol [biblio: sunol-textbook] corroborates the
// dominants. All four maneriae are populated (see the per-maneria comments
// below). The figures are shared across each authentic/plagal pair, because the
// source classes cadences by maneria, not by the eight modes.
//
// Two known gaps. Every figure resolves onto the FINALIS; genuine tenor-resting
// medial cadences are not yet catalogued (they need Homan's genre-by-mode tables
// [biblio: homan-cadence], which we don't have in full). And a chromatic cadence
// note — the subsemitonium, B-flat vs B-natural — falls outside `scalePcs`, so
// the matcher drops it; a later refinement.
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
  // Tonal centres and openings, after Rockstro's Grove table
  // [biblio: rockstro-grove]. Each list is ORDERED BY IMPORTANCE — Rockstro's
  // principle is that a mode's characteristic notes are given "in the order in
  // which we have mentioned them." So `regular` runs final, dominant, then lesser
  // centres; `initials` from the most characteristic opening downward (Rockstro
  // footnotes some as "barely used" or used "chiefly in polyphonic music"). The
  // modal-affinity scorer (score/modality.ts) reads this order: a chant opening
  // on a mode's primary initial counts for more than one on a low-ranked initial,
  // which is what separates an authentic mode from its plagal twin on a shared
  // finalis. Pitch classes, C=0; a value >12 is the upper octave.
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
      // Shared with mode 1 (both Protus). An earlier seed here was wrong — a copy
      // of mode 5's figures, landing on F with an Ab outside hypodorian's scale;
      // Suñol's tables surfaced it, and it was corrected to the Protus descent.
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
