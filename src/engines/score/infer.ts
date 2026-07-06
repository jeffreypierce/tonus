// ---------------------------------------------------------------------------
// engines/score/infer — mode and chant type inference from parsed GABC
// ---------------------------------------------------------------------------
import type { ChantType, Score, OrdinaryCode, OfficeCode } from "./types.js";
import { OFFICE_LABELS } from "../chant/types.js";
import { MODES } from "../temper/modes.js";

// Identify an ordinary chant by its opening words. Two movements have a second,
// interior incipit because they are conventionally intoned from their second
// phrase: the Gloria's "Et in terra pax" (the celebrant sings "Gloria in
// excelsis") and the Credo's "Patrem omnipotentem" ("Credo in unum Deum").
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

  // The finalis is the last note of the chant — the fundamental assumption of
  // modal analysis: a chant comes to rest on its mode's final [biblio:
  // liber-usualis]. That pitch class picks the maneria (mode pair).
  const finalisPc = ((midis[midis.length - 1] % 12) + 12) % 12;

  const candidates: number[] = [];
  for (const [num, data] of MODES) {
    if (data.final === finalisPc) candidates.push(num);
  }
  if (candidates.length === 0) return undefined;
  if (candidates.length === 1) return candidates[0];

  // Within a maneria the authentic mode ranges a fifth-and-more ABOVE the final,
  // the plagal one straddles it (roughly a fourth below to a fifth above) [biblio:
  // sunol-textbook]. So the mean pitch's height above the final separates them.
  // The thresholds are asymmetric and tuned: a melody must sit a clear +3
  // semitones above the final to read authentic, but only dip −1 below to read
  // plagal (plagal melodies dip under the final; authentic ones rarely do).
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
