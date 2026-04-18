// ---------------------------------------------------------------------------
// engines/score/infer — mode and chant type inference from parsed GABC
// ---------------------------------------------------------------------------
import type { ChantType, Score, OrdinaryCode, OfficeCode } from "./types.js";
import { OFFICE_LABELS } from "../chant/types.js";
import { MODES } from "../temper/modes.js";

const ORDINARY_INCIPITS: Array<[RegExp, OrdinaryCode]> = [
  [/^kyrie/i, "ky"],
  [/^gloria/i, "gl"],
  [/^etinterra/i, "gl"],
  [/^credo/i, "cr"],
  [/^patrem/i, "cr"],
  [/^sanctus/i, "sa"],
  [/^agnus/i, "ag"],
  [/^benedica/i, "be"],
  [/^ite/i, "it"],
];

const OFFICE_CODES = new Set(Object.keys(OFFICE_LABELS));

export function inferChantType(ir: Score): ChantType | undefined {
  const officePart = ir.chant.office?.toLowerCase().trim();
  if (officePart && OFFICE_CODES.has(officePart)) return officePart as OfficeCode;

  const incipit = collectIncipit(ir, 4);
  if (!incipit) return undefined;

  for (const [pattern, type] of ORDINARY_INCIPITS) {
    if (pattern.test(incipit)) return type;
  }
  return undefined;
}

export function inferMode(ir: Score): number | undefined {
  const headerMode = parseInt(ir.chant.mode ?? "", 10);
  if (headerMode >= 1 && headerMode <= 8) return headerMode;

  const midis: number[] = [];
  for (const phrase of ir.phrases) {
    for (const syl of phrase.syllables) {
      for (const note of syl.notes) midis.push(note.pitch.midi);
    }
  }
  if (midis.length === 0) return undefined;

  const finalisPc = ((midis[midis.length - 1] % 12) + 12) % 12;

  const candidates: number[] = [];
  for (const [num, data] of MODES) {
    if (data.final === finalisPc) candidates.push(num);
  }
  if (candidates.length === 0) return undefined;
  if (candidates.length === 1) return candidates[0];

  // Authentic vs plagal: melody mean above finalis → authentic
  const finalisStep = midis[midis.length - 1];
  const mean = midis.reduce((s, v) => s + v, 0) / midis.length;
  const offset = mean - finalisStep;

  const authentic = candidates.filter((n) => MODES.get(n)?.type === "authentic");
  const plagal = candidates.filter((n) => MODES.get(n)?.type === "plagal");

  if (offset > 3 && authentic.length > 0) return authentic[0];
  if (offset < -1 && plagal.length > 0) return plagal[0];
  return (authentic[0] ?? plagal[0])!;
}

function collectIncipit(ir: Score, maxSyllables: number): string {
  const parts: string[] = [];
  outer: for (const phrase of ir.phrases) {
    for (const syl of phrase.syllables) {
      const text = syl.lyric.replace(/-+$/, "").trim();
      if (text) {
        parts.push(text);
        if (parts.length >= maxSyllables) break outer;
      }
    }
  }
  return parts.join("");
}
