// ---------------------------------------------------------------------------
// engines/temper/pitch — Pitch type, input parsing, and scale binding
// ---------------------------------------------------------------------------

import { SOLFEGE_TO_CHROMA, SHARP_SPELLING, FLAT_SPELLING, PREFER_FLAT_PCS, GUIDO_TO_PC } from "./data/constants.js";
import { gabcToMidi } from "./gabc.js";
import { MODES } from "./modes.js";
import { midiToHz } from "./scale.js";
import type { Scale } from "./scale.js";

// ── Types ──

export interface Pitch {
  midi: number;
  pc: number;
  oct: number;
  acc: -1 | 0 | 1;
  spn: string;       // scientific pitch name e.g. "D4", "Bb3"
  hz: number;
  offset: number;    // cents from 12-TET
  bend: number;      // 14-bit MIDI pitch bend (8192 = center)
  ratio: number;     // frequency ratio for this pc within the Scale
}

// Tagged input forms — explicit, no ambiguity
export type PitchInput =
  | number                                                          // bare: MIDI (int 0–127) or Hz (float or >127)
  | string                                                          // bare: "D4" | "RE" | "d" (GABC)
  | { midi: number }
  | { hz: number }
  | { spn: string }
  | { solfege: string; oct?: number }                              // modern fixed-do
  | { solmization: string; hexachord?: "durum" | "naturale" | "molle"; oct?: number }  // medieval
  | { gabc: string; clef?: string };                                // the clef fixes the octave

// Context passed alongside bare string input for GABC/medieval resolution
export interface PitchContext {
  clef?: string;
  mode?: number;
  hexachord?: "durum" | "naturale" | "molle";
  a4?: number;
}

// ── parsePitch ──
// Resolves any input form to a raw MIDI number.
// ctx provides fallback mode/clef/hexachord for ambiguous inputs.
export function parsePitch(input: PitchInput, ctx: PitchContext = {}): number {
  // Tagged object forms
  if (typeof input === "object" && input !== null) {
    if ("midi" in input) {
      return clamp(input.midi);
    }
    if ("hz" in input) {
      return hzToMidi(input.hz, ctx.a4 ?? 440);
    }
    if ("spn" in input) {
      return parseSpn(input.spn);
    }
    if ("solfege" in input) {
      return parseModernSolfege(input.solfege, input.oct ?? 4);
    }
    if ("solmization" in input) {
      const hex = input.hexachord ?? inferHexachord(ctx.mode);
      return parseMedievalSolmization(input.solmization, hex, input.oct ?? 4);
    }
    if ("gabc" in input) {
      return parseGabc(input.gabc, input.clef ?? ctx.clef ?? "c4");
    }
  }

  // Bare number
  if (typeof input === "number") {
    if (Number.isInteger(input) && input >= 0 && input <= 127) return input;
    return hzToMidi(input, ctx.a4 ?? 440);
  }

  // Bare string — detect form
  if (typeof input === "string") {
    const s = input.trim();

    // Scientific name: starts with A–G, optional #/b, then digits
    if (/^[A-Ga-g][#b]?-?\d+$/.test(s)) {
      return parseSpn(s);
    }

    // Modern solfège: uppercase syllable, no digits
    if (/^[A-Z]+$/.test(s) && SOLFEGE_TO_CHROMA.has(s)) {
      return parseModernSolfege(s, 4);
    }

    // GABC letter: single lowercase a–m
    if (/^[a-m]$/.test(s)) {
      if (!ctx.clef && !ctx.mode) {
        throw new Error(`GABC input "${s}" requires clef context. Pass { gabc: "${s}", clef: "c4" } or provide ctx.clef.`);
      }
      return parseGabc(s, ctx.clef ?? "c4");
    }
  }

  throw new Error(`Cannot parse pitch input: ${JSON.stringify(input)}`);
}

// ── toPitch ──
// Resolves a PitchInput through a Scale into a tuned Pitch.
// Applies the Scale's transpose and returns a Pitch with midi/pc/oct/spn
// from the transposed MIDI plus tuning-derived hz/offset/bend/ratio.
export function toPitch(input: PitchInput, scale: Scale, prefer?: "flat" | "sharp"): Pitch {
  const rawMidi = parsePitch(input, { mode: scale.mode, a4: scale.a4 });
  const { hz, offset, bend } = midiToHz(rawMidi, scale);
  const midi = clamp(rawMidi + scale.transpose);
  const pc = midi % 12;
  const oct = Math.floor(midi / 12) - 1;
  // Spell as the source WROTE it when the caller knows. Deriving the spelling
  // from the pitch class alone cannot: pc 1 is D-flat in a chant that wrote a
  // flat and C-sharp in one that wrote a sharp, and the class is identical.
  // PREFER_FLAT_PCS ({3, 8, 10}) is a reasonable default but omits pc 1 and 6,
  // so a written flat landing there came back spelled — and reported in `acc` —
  // as a SHARP, the opposite of what the source said.
  //
  // The Graduale only ever writes B-flat (pc 10, the bmolle), so the corpus
  // never reached the gap; `notatio` passes the hint because a caller may set
  // any GABC accidental on any degree. A spelled input ("Db4", { spn: "Gb4" })
  // carries its own hint.
  const hint = prefer ?? writtenAccidental(input);
  const useFlat = hint ? hint === "flat" : PREFER_FLAT_PCS.has(pc);
  const sp = useFlat ? FLAT_SPELLING[pc]! : SHARP_SPELLING[pc]!;
  const accStr = sp.acc === -1 ? "b" : sp.acc === 1 ? "#" : "";
  const spn = `${sp.step}${accStr}${oct}`;
  const ratio = scale.ratios[pc] ?? 1;
  return { midi, pc, oct, acc: sp.acc, spn, hz, offset, bend, ratio };
}

// The accidental an SPN input was written with, if any.
function writtenAccidental(input: PitchInput): "flat" | "sharp" | undefined {
  const s = typeof input === "string" ? input : typeof input === "object" && input && "spn" in input ? input.spn : null;
  const m = s?.trim().match(/^[A-Ga-g]([#b])-?\d+$/);
  return m ? (m[1] === "b" ? "flat" : "sharp") : undefined;
}

// ── Internal helpers ──

function clamp(n: number): number {
  return Math.min(127, Math.max(0, Math.round(n)));
}

function hzToMidi(hz: number, a4 = 440): number {
  if (!(Number.isFinite(hz) && hz > 0))
    throw new RangeError(`A frequency must be a positive number of Hz (or a MIDI integer 0–127), got ${hz}`);
  return clamp(69 + 12 * Math.log2(hz / a4));
}

// The octave number belongs to the LETTER, so an accidental can carry the
// pitch across C: B#4 is the C above B4 (MIDI 72), Cb4 the B below C4 (59).
const LETTER_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function parseSpn(s: string): number {
  const m = s.trim().match(/^([A-Ga-g])([#b]?)(-?\d+)$/);
  if (!m) throw new Error(`Invalid scientific pitch name: "${s}"`);
  const [, letter, acc, octStr] = m;
  const alter = acc === "#" ? 1 : acc === "b" ? -1 : 0;
  return (parseInt(octStr!, 10) + 1) * 12 + LETTER_PC[letter!.toUpperCase()]! + alter;
}

function parseModernSolfege(s: string, oct: number): number {
  const pc = SOLFEGE_TO_CHROMA.get(s.trim().toUpperCase());
  if (pc === undefined) throw new Error(`Unknown solfège syllable: "${s}"`);
  return (oct + 1) * 12 + pc;
}

function parseMedievalSolmization(s: string, hexachord: string, oct: number): number {
  const map = GUIDO_TO_PC[hexachord];
  if (!map) throw new Error(`Unknown hexachord: "${hexachord}"`);
  const pc = map[s.trim().toUpperCase()];
  if (pc === undefined) throw new Error(`Unknown solmization "${s}" in hexachord "${hexachord}"`);
  return (oct + 1) * 12 + pc;
}

function parseGabc(letter: string, clef: string): number {
  return gabcToMidi(letter.toLowerCase(), clef);
}

function inferHexachord(mode?: number): "durum" | "naturale" | "molle" {
  if (!mode) return "naturale";
  const modeData = MODES.get(mode);
  return modeData?.hexachords[0] ?? "naturale";
}
