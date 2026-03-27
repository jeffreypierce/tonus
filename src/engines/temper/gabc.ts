// ---------------------------------------------------------------------------
// engines/temper/gabc — GABC pitch letter utilities
// ---------------------------------------------------------------------------
import { DIATONIC_SEMITONES, GABC_LETTERS, CLEF_DEF } from "../../data/gabc.js";

export function midiToGabc(midi: number, clef = "c4"): string {
  const def = CLEF_DEF[clef];
  if (!def) throw new Error(`Unknown clef: ${clef}`);

  const octave = Math.floor(midi / 12) - 1;
  const pc = midi % 12;
  const diatIdx = DIATONIC_SEMITONES.indexOf(pc);
  if (diatIdx === -1) throw new Error(`MIDI note ${midi} (pc ${pc}) is not diatonic`);

  const doOctave = Math.floor(def.doMidi / 12) - 1;
  const staffPos = def.doIdx + diatIdx + (octave - doOctave) * 7;

  const letter = GABC_LETTERS[staffPos];
  if (!letter) throw new Error(`MIDI ${midi} out of GABC range for clef ${clef}`);
  return letter;
}

export function gabcToMidi(letter: string, clef = "c4"): number {
  const def = CLEF_DEF[clef];
  if (!def) throw new Error(`Unknown clef: ${clef}`);

  const staffPos = GABC_LETTERS.indexOf(letter.toLowerCase());
  if (staffPos === -1) throw new Error(`Unknown GABC letter: ${letter}`);

  const stepsFromDo = staffPos - def.doIdx;
  const octOffset = Math.floor(stepsFromDo / 7);
  const diatStep = ((stepsFromDo % 7) + 7) % 7;

  const doOctave = Math.floor(def.doMidi / 12) - 1;
  return (doOctave + octOffset + 1) * 12 + DIATONIC_SEMITONES[diatStep];
}

export function pcToGabc(pc: number, clef = "c4", oct = 0): string {
  const def = CLEF_DEF[clef];
  if (!def) throw new Error(`Unknown clef: ${clef}`);
  const doOctave = Math.floor(def.doMidi / 12) - 1;
  return midiToGabc((doOctave + oct + 1) * 12 + pc, clef);
}

export function gabcToPc(letter: string, clef = "c4"): number {
  return gabcToMidi(letter, clef) % 12;
}
