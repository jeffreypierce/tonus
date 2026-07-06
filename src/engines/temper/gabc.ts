// ---------------------------------------------------------------------------
// engines/temper/gabc — GABC pitch letter utilities
// ---------------------------------------------------------------------------
// GABC pitch letters (a–m) are DIATONIC STAFF POSITIONS, not pitch classes: the
// thirteen letters are the thirteen slots of the four-line staff and its ledger
// space, spanning roughly two octaves of white-key steps [biblio: gregorio-gabc].
// A letter has no fixed pitch on its own — the clef fixes it. So converting to
// and from MIDI is staff-position arithmetic, done in two moduli: 7 for the
// diatonic staff (steps per octave) and 12 for MIDI (semitones per octave).
//
// DIATONIC maps a diatonic step (0–6, do re mi fa sol la si) to its pitch class.
// LETTERS is the staff-slot alphabet, low to high.
const DIATONIC = [0, 2, 4, 5, 7, 9, 11];
const LETTERS = "abcdefghijklm";
// A GABC clef names the staff line that carries "do" (c-clefs) or "fa" (f-clefs)
// and thereby anchors every letter. `doIdx` is the LETTERS slot that line falls
// on; `doMidi` is the MIDI pitch of "do" there (60 = middle C; 53 = the F below).
// A higher c-clef (c4 vs c1) moves "do" up the staff, so the same letter reads a
// lower pitch — hence doIdx climbs 3→5→7→9 across c1→c4. The f-clefs anchor on
// fa (MIDI 53) and are used for lower-tessitura chant.
const CLEFS: Record<string, { doMidi: number; doIdx: number }> = {
  c1: { doMidi: 60, doIdx: 3 },
  c2: { doMidi: 60, doIdx: 5 },
  c3: { doMidi: 60, doIdx: 7 },
  c4: { doMidi: 60, doIdx: 9 },
  f3: { doMidi: 53, doIdx: 5 },
  f4: { doMidi: 53, doIdx: 3 },
};

export function midiToGabc(midi: number, clef = "c4"): string {
  const def = CLEFS[clef];
  if (!def) throw new Error(`Unknown clef: ${clef}`);

  const octave = Math.floor(midi / 12) - 1;
  const pc = midi % 12;
  const diatIdx = DIATONIC.indexOf(pc);
  if (diatIdx === -1) throw new Error(`MIDI note ${midi} (pc ${pc}) is not diatonic`);

  const doOctave = Math.floor(def.doMidi / 12) - 1;
  const staffPos = def.doIdx + diatIdx + (octave - doOctave) * 7;

  const letter = LETTERS[staffPos];
  if (!letter) throw new Error(`MIDI ${midi} out of GABC range for clef ${clef}`);
  return letter;
}

export function gabcToMidi(letter: string, clef = "c4"): number {
  const def = CLEFS[clef];
  if (!def) throw new Error(`Unknown clef: ${clef}`);

  const staffPos = LETTERS.indexOf(letter.toLowerCase());
  if (staffPos === -1) throw new Error(`Unknown GABC letter: ${letter}`);

  // Diatonic steps from "do", split into whole octaves (÷7) and the step within
  // the octave. The `((x % 7) + 7) % 7` form keeps the step in 0–6 for letters
  // below "do", where stepsFromDo is negative and JS `%` would return negative.
  const stepsFromDo = staffPos - def.doIdx;
  const octOffset = Math.floor(stepsFromDo / 7);
  const diatStep = ((stepsFromDo % 7) + 7) % 7;

  const doOctave = Math.floor(def.doMidi / 12) - 1;
  return (doOctave + octOffset + 1) * 12 + DIATONIC[diatStep];
}

export function pcToGabc(pc: number, clef = "c4", oct = 0): string {
  const def = CLEFS[clef];
  if (!def) throw new Error(`Unknown clef: ${clef}`);
  const doOctave = Math.floor(def.doMidi / 12) - 1;
  return midiToGabc((doOctave + oct + 1) * 12 + pc, clef);
}

export function gabcToPc(letter: string, clef = "c4"): number {
  return gabcToMidi(letter, clef) % 12;
}
