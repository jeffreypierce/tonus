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

// No cadence figures ride the mode. The received figures (Niedermeyer &
// d'Ortigue, Bragers) were data here until 0.11; they are now a reference note
// (working/notes/cadentiae-tradita.md) against the ONE cadence catalogue, the
// mined CADENTIAE (data/cadentiae.ts), which `modus(n).cadences` reads per mode
// at call. Reference data is fixed; a cadence is a measurement, and
// measurements ride the verb.

// A mode's reciting notes, ranked. `tenor` (below) names the single principal
// one for backward compatibility, but real chant practice recognizes more than
// one: some modes recite on a second degree for certain pieces (mode IV's
// e/g/a), on an auxiliary alongside the principal (modes VI–VIII), or even on
// the final itself (mode V, mode VIII's g) [biblio: saulnier-modes, Degree
// Summary Tables, per-mode]. `label` carries the source's own wording where it
// doesn't collapse cleanly into a rank, so a mistaken rank call is visible and
// checkable against the book rather than silently asserted.
//
// v1 is deliberately narrow: only reciting notes the tables/prose name
// explicitly (principal/auxiliary, plus a few prose-confirmed "note of
// composition" mentions) are included. The tables also grade several more
// degrees as "important," "rare," or give per-degree cadence types
// (final/intermediate/suspensive) — real information, left out here to avoid
// asserting low-confidence transcription as data. That's a separate layer,
// not yet built.
//
// Mode III has no photographed Degree Summary Table (prose only) — its single
// entry is the historically-shifted practical tenor (see the mode's own
// comment), not a transcription.
export interface RecitingNote {
  pc: number;
  rank: "principal" | "auxiliary" | "secondary" | "pseudo" | "rare";
  label?: string;
}

export interface ModeData {
  mode: number;
  nomen: string;      // Latin: "Protus Authenticus", etc.
  alias: string;      // Greek: "dorian", "hypodorian", etc.
  maneria: string;    // "Protus" | "Deuterus" | "Tritus" | "Tetrardus"
  type: "authentic" | "plagal";
  final: number;      // finalis pitch class (C=0)
  tenor: number;      // reciting tone pitch class — the principal entry of `recitingNotes`, kept as a plain duplicate (not derived) per tonus's plain-data-table convention; the two must stay in sync (guarded by tests/reciting-notes.test.mjs)
  recitingNotes: RecitingNote[]; // ranked reciting notes — see the type's own comment
  scalePcs: number[]; // 7 diatonic pitch classes
  hexachords: ("durum" | "naturale" | "molle")[];
  profile: ModeProfile;
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
      recitingNotes: [{ pc: 9, rank: "principal", label: "psalmodic tenor" }],
      scalePcs: [2, 4, 5, 7, 9, 11, 0],
      hexachords: ["naturale"],
      profile: { mood: "serious", ethos: "gravis", phrasing: "lyrical", melodic: "falling", tendency: "melismatic" },
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
      recitingNotes: [
        { pc: 5, rank: "principal", label: "official dominant, psalmodic tenor, strong degree" },
        { pc: 2, rank: "principal", label: "final; also a principal note of composition per prose" },
        { pc: 7, rank: "secondary", label: "important; prose also names it a note of composition" },
      ],
      scalePcs: [2, 4, 5, 7, 9, 11, 0],
      hexachords: ["naturale"],
      profile: { mood: "sad", ethos: "tristis", phrasing: "lyrical", melodic: "arch", tendency: "neumatic" },
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
      // No Degree Summary Table exists for mode III (prose only, see
      // ../../../../BIBLIOGRAPHY.md [biblio: saulnier-modes]): "the primitive
      // psalmodic tenor is b, but in numerous medieval manuscripts from northern Europe
      // and in the modern editions, this tenor is raised to c." tonus already
      // stored the raised/practical value; this just cites the confirmation.
      recitingNotes: [{ pc: 0, rank: "principal", label: "historically raised from the primitive tenor b" }],
      scalePcs: [4, 5, 7, 9, 11, 0, 2],
      hexachords: ["naturale"],
      profile: { mood: "mystic", ethos: "mysticus", phrasing: "solemn", melodic: "falling", tendency: "melismatic" },
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
      recitingNotes: [
        { pc: 9, rank: "principal", label: "psalmodic tenor" },
        { pc: 7, rank: "secondary", label: "note of composition for Responsory verses (deuterus-tritus)" },
        { pc: 4, rank: "secondary", label: "final; also usable as a recitation note per prose" },
        { pc: 5, rank: "pseudo", label: "pseudo-tenor; strong importance but not a true note of composition per prose" },
      ],
      scalePcs: [4, 5, 7, 9, 11, 0, 2],
      hexachords: ["naturale"],
      profile: { mood: "harmonious", ethos: "harmonicus", phrasing: "lyrical", melodic: "arch", tendency: "neumatic" },
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
      recitingNotes: [
        { pc: 0, rank: "principal", label: "official dominant, psalmodic tenor" },
        { pc: 5, rank: "rare", label: "final; sometimes used as a recitation note" },
      ],
      scalePcs: [5, 7, 9, 11, 0, 2, 4],
      hexachords: ["molle"],
      profile: { mood: "happy", ethos: "laetus", phrasing: "solemn", melodic: "rising", tendency: "melismatic" },
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
      // Prose: "Mode VI possesses only one note of composition: f, the final
      // of the pieces. For the psalmody, it resorts to a, even if it has been
      // infrequently heard in the piece." So the reciting note is real but
      // structurally secondary — hence "auxiliary," not "principal."
      recitingNotes: [{ pc: 9, rank: "auxiliary", label: "psalmodic tenor; the mode's only note of composition is the final f, itself not used for recitation" }],
      scalePcs: [5, 7, 9, 11, 0, 2, 4],
      hexachords: ["molle"],
      profile: { mood: "devout", ethos: "devotus", phrasing: "lyrical", melodic: "arch", tendency: "neumatic" },
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
      recitingNotes: [
        { pc: 2, rank: "principal", label: "psalmodic tenor" },
        { pc: 0, rank: "auxiliary", label: "strong degree" },
        { pc: 11, rank: "auxiliary" },
      ],
      scalePcs: [7, 9, 11, 0, 2, 4, 5],
      hexachords: ["durum"],
      profile: { mood: "angelical", ethos: "angelicus", phrasing: "solemn", melodic: "rising", tendency: "melismatic" },
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
      // Prose: "Mode VIII has two upper notes of recitation: c (psalmodic
      // tenor) and b. The lower note of recitation, g, is also the final of
      // the pieces. B and g are the notes of recitation for the verses of the
      // Responsories." — the final doubling as a low reciting note is a real,
      // distinct case (see also mode V's f).
      recitingNotes: [
        { pc: 0, rank: "principal", label: "psalmodic tenor" },
        { pc: 11, rank: "auxiliary" },
        { pc: 7, rank: "secondary", label: "final; the mode's lower recitation note, used for Responsory verses alongside b" },
      ],
      scalePcs: [7, 9, 11, 0, 2, 4, 5],
      hexachords: ["durum"],
      profile: { mood: "perfect", ethos: "perfectus", phrasing: "lyrical", melodic: "arch", tendency: "neumatic" },
      modulations: { regular: [7, 0, 9, 14], conceded: [2, 5], initials: [0, 2, 4, 7, 9, 12, 14] },
      ambitus: { lowest: 5, highest: 19, span: 14 },
      species: { fifth: [7, 2], fourth: [2, 7] },
    },
  ],
]);
