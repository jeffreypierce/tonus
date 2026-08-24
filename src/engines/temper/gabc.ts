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
// The staff-line slots the clefs anchor to, low to high: letters d/f/h/j per
// the Gregorio spec (2-line staff = a–i, 3-line = a–k, 4-line = a–m).
const LINE_SLOTS = [3, 5, 7, 9];

// Every clef GABC can declare, built from the same two rules rather than listed
// by hand: a c-clef puts "do" (MIDI 60) on its named line, an f-clef puts "fa"
// (MIDI 53) there. cN/fN for N in 1–4, plus the `b` variants (cbN/fbN) that
// additionally declare a B-flat key signature.
//
// This table used to hold six entries — c1–c4, f3, f4 — while `parse.ts`'s
// CLEF_OFFSETS held all sixteen. Two tables disagreeing about what a clef is,
// with the smaller one throwing "Unknown clef" on inputs the parser accepts
// happily. Deriving them removes the chance of a third disagreement.
const CLEFS: Record<string, { doMidi: number; doIdx: number }> = {};
for (let n = 1; n <= 4; n++) {
  const doIdx = LINE_SLOTS[n - 1]!;
  // An f-clef names fa's line, and fa is the 4th diatonic step (index 3), so
  // "do" sits three slots below the named line — which is what doMidi 53
  // (the F below middle C) is measured from.
  CLEFS[`c${n}`] = { doMidi: 60, doIdx };
  CLEFS[`cb${n}`] = { doMidi: 60, doIdx };
  CLEFS[`f${n}`] = { doMidi: 53, doIdx };
  CLEFS[`fb${n}`] = { doMidi: 53, doIdx };
}

/**
 * The GABC letter for a MIDI pitch under `clef` — with `x` appended when the
 * pitch is a B-flat (`jx`, the flat sign then the note).
 *
 * B-flat is the ONE accidental chant sings — the b molle of the medieval gamut,
 * the whole reason `parse.ts` carries a flat state machine and the `b` clefs
 * exist. This function used to throw "is not diatonic" on it, which made the
 * apparent inverse of `gabcToMidi` unable to spell a pitch the parser reads on
 * every other page. Every other chromatic pitch class still throws: those are
 * outside the gamut, and inventing a spelling for them would be a worse answer
 * than refusing.
 */
export function midiToGabc(midi: number, clef = "c4"): string {
  const def = CLEFS[clef];
  if (!def) throw new Error(`Unknown clef: ${clef}`);

  const pc = midi % 12;
  // A flat is spelled on the staff slot of the natural ABOVE it: B-flat takes
  // B's line with an `x`. Resolve to that natural, then mark the result.
  const flat = pc === 10;
  const natural = flat ? midi + 1 : midi;

  const octave = Math.floor(natural / 12) - 1;
  const diatIdx = DIATONIC.indexOf(natural % 12);
  if (diatIdx === -1) throw new Error(`MIDI note ${midi} (pc ${pc}) is not diatonic`);

  const doOctave = Math.floor(def.doMidi / 12) - 1;
  const staffPos = def.doIdx + diatIdx + (octave - doOctave) * 7;

  const letter = LETTERS[staffPos];
  if (!letter) throw new Error(`MIDI ${midi} out of GABC range for clef ${clef}`);
  return flat ? `${letter}x` : letter;
}

export function gabcToMidi(letter: string, clef = "c4"): number {
  const def = CLEFS[clef];
  if (!def) throw new Error(`Unknown clef: ${clef}`);

  // Accept the `x` that `midiToGabc` emits, so the two stay inverses. A flat
  // lowers the natural it marks by a semitone; only B carries one in the gamut,
  // but the arithmetic is written once for whatever letter arrives.
  const raw = letter.toLowerCase();
  const flat = raw.endsWith("x");
  const bare = flat ? raw.slice(0, -1) : raw;

  const staffPos = LETTERS.indexOf(bare);
  if (staffPos === -1) throw new Error(`Unknown GABC letter: ${letter}`);

  // Diatonic steps from "do", split into whole octaves (÷7) and the step within
  // the octave. The `((x % 7) + 7) % 7` form keeps the step in 0–6 for letters
  // below "do", where stepsFromDo is negative and JS `%` would return negative.
  const stepsFromDo = staffPos - def.doIdx;
  const octOffset = Math.floor(stepsFromDo / 7);
  const diatStep = ((stepsFromDo % 7) + 7) % 7;

  const doOctave = Math.floor(def.doMidi / 12) - 1;
  const natural = (doOctave + octOffset + 1) * 12 + DIATONIC[diatStep]!;
  return flat ? natural - 1 : natural;
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
