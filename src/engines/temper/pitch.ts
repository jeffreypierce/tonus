// ---------------------------------------------------------------------------
// engines/temper/pitch — Pitch type, input parsing, and scale binding
// ---------------------------------------------------------------------------

import { NAME_TO_CHROMA, SOLFEGE_TO_CHROMA, SHARP_SPELLING, FLAT_SPELLING, PREFER_FLAT_PCS, GUIDO_TO_PC } from "./data/constants.js";
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
  | { gabc: string; clef?: string; oct?: number };

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
export function toPitch(input: PitchInput, scale: Scale): Pitch {
  const rawMidi = parsePitch(input, { mode: scale.mode, a4: scale.a4 });
  const { hz, offset, bend } = midiToHz(rawMidi, scale);
  const midi = clamp(rawMidi + scale.transpose);
  const pc = midi % 12;
  const oct = Math.floor(midi / 12) - 1;
  const useFlat = PREFER_FLAT_PCS.has(pc);
  const sp = useFlat ? FLAT_SPELLING[pc]! : SHARP_SPELLING[pc]!;
  const accStr = sp.acc === -1 ? "b" : sp.acc === 1 ? "#" : "";
  const spn = `${sp.step}${accStr}${oct}`;
  const ratio = scale.ratios[pc] ?? 1;
  return { midi, pc, oct, acc: sp.acc, spn, hz, offset, bend, ratio };
}

// ── scaleDegreeInMode ──
export function scaleDegreeInMode(midi: number, mode: number): number | null {
  const modeData = MODES.get(mode);
  if (!modeData) return null;
  const pc = ((midi % 12) + 12) % 12;
  const idx = modeData.scalePcs.indexOf(pc);
  return idx === -1 ? null : idx + 1;
}

// ── Internal helpers ──

function clamp(n: number): number {
  return Math.min(127, Math.max(0, Math.round(n)));
}

function hzToMidi(hz: number, a4 = 440): number {
  return clamp(69 + 12 * Math.log2(hz / a4));
}

function parseSpn(s: string): number {
  const m = s.trim().match(/^([A-Ga-g])([#b]?)(-?\d+)$/);
  if (!m) throw new Error(`Invalid scientific pitch name: "${s}"`);
  const [, letter, acc, octStr] = m;
  const normalized = letter!.toUpperCase() + (acc === "b" ? "b" : acc === "#" ? "#" : "");
  const pc = NAME_TO_CHROMA.get(normalized);
  if (pc === undefined) throw new Error(`Unknown note name: "${normalized}"`);
  return (parseInt(octStr!, 10) + 1) * 12 + pc;
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
