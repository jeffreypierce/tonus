// ---------------------------------------------------------------------------
// data/gabc — GABC staff position tables and clef definitions
// ---------------------------------------------------------------------------

// Diatonic semitone offsets within an octave (C major scale steps: C D E F G A B)
export const DIATONIC_SEMITONES = [0, 2, 4, 5, 7, 9, 11];

// GABC staff letters, low to high (13 positions = just under 2 octaves)
export const GABC_LETTERS = "abcdefghijklm";

// Clef → MIDI anchor: doMidi = MIDI of "ut" (C); doIdx = index in GABC_LETTERS
export const CLEF_DEF: Record<string, { doMidi: number; doIdx: number }> = {
  c1: { doMidi: 60, doIdx: 3 }, // do on line 1 → letter d
  c2: { doMidi: 60, doIdx: 5 }, // do on line 2 → letter f
  c3: { doMidi: 60, doIdx: 7 }, // do on line 3 → letter h
  c4: { doMidi: 60, doIdx: 9 }, // do on line 4 → letter j  ← standard
  f3: { doMidi: 53, doIdx: 5 }, // fa clef, F on line 3
  f4: { doMidi: 53, doIdx: 3 }, // fa clef, F on line 4
};
