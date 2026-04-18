// ---------------------------------------------------------------------------
// engines/summa/vowels — vowel-weighted pitch resonances
// ---------------------------------------------------------------------------
import type { Phrase } from "../score/types.js";

export interface VowelAttractor {
  vowel: string;  // "a", "e", "i", "o", "u"
  weight: number; // fraction of total weight (sums to 1 across all vowels)
  pc: number;     // most-associated pitch class for this vowel
}

const VOWELS = ["a", "e", "i", "o", "u"];

export function computeVowelAttractors(sources: Phrase[][]): VowelAttractor[] {
  // vowel → pc → accumulated weight
  const vowelPcMap = new Map<string, Map<number, number>>();
  for (const v of VOWELS) vowelPcMap.set(v, new Map());

  for (const phrases of sources) {
    for (const phrase of phrases) {
      for (const syl of phrase.syllables) {
        if (syl.notes.length === 0) continue;
        for (const note of syl.notes) {
          const vowel = note.context.vowel?.toLowerCase();
          if (!vowel) continue;
          const pcMap = vowelPcMap.get(vowel);
          if (!pcMap) continue;
          pcMap.set(note.pitch.pc, (pcMap.get(note.pitch.pc) ?? 0) + 1);
        }
      }
    }
  }

  const vowelTotals = new Map<string, number>();
  for (const [v, pcMap] of vowelPcMap) {
    let total = 0;
    for (const w of pcMap.values()) total += w;
    vowelTotals.set(v, total);
  }
  const grandTotal = Array.from(vowelTotals.values()).reduce((s, v) => s + v, 0);
  if (grandTotal === 0) return [];

  const results: VowelAttractor[] = [];
  for (const v of VOWELS) {
    const pcMap = vowelPcMap.get(v)!;
    if (pcMap.size === 0) continue;
    let bestPc = 0;
    let bestW = -1;
    for (const [pc, w] of pcMap) {
      if (w > bestW) { bestW = w; bestPc = pc; }
    }
    const total = vowelTotals.get(v) ?? 0;
    results.push({ vowel: v, weight: total / grandTotal, pc: bestPc });
  }
  return results.sort((a, b) => b.weight - a.weight);
}
