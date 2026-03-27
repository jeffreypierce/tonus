// ---------------------------------------------------------------------------
// engines/temper/gabc — GABC pitch letter utilities
// ---------------------------------------------------------------------------
const DIATONIC = [0, 2, 4, 5, 7, 9, 11];
const LETTERS = "abcdefghijklm";
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
