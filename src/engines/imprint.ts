// ---------------------------------------------------------------------------
// engines/imprint — shared analytical fingerprint for Score and Harmony
// ---------------------------------------------------------------------------
// An Imprint is a compact summary of the pitch and modal content of a work,
// computed identically from chant phrases or voiced planetary bodies. Score
// and Harmony both carry one; callers compare them to measure overlap.
import type { Phrase } from "./score/types.js";
import type { Pitch } from "./temper/pitch.js";
import type { Scale } from "./temper/scale.js";
import { toPitch } from "./temper/pitch.js";
import { MODES } from "./temper/modes.js";
import type { VoicedBody } from "./harmonia/voice.js";

export interface Attractor {
  pc: number;
  weight: number;
  pitch: Pitch;
}

export interface VowelAttractor {
  vowel: string;
  weight: number;
  pitch: Pitch;
}

export interface ModalAffinity {
  mode: number;
  alias: string;
  score: number;
}

export interface Imprint {
  pcDistribution: Record<number, number>;
  attractors: Attractor[];
  vowelAttractors: VowelAttractor[];
  modalAffinity: ModalAffinity[];
}

const DEFAULT_TOP = 5;
const DEFAULT_MIDI_OCTAVE = 4;
const VOWELS = ["a", "e", "i", "o", "u"];

function pitchForPc(pc: number, scale: Scale): Pitch {
  return toPitch(12 * (DEFAULT_MIDI_OCTAVE + 1) + pc, scale);
}

function computeAttractors(
  pcDistribution: Record<number, number>,
  scale: Scale,
  topN = DEFAULT_TOP,
): Attractor[] {
  const entries: [number, number][] = [];
  for (let pc = 0; pc < 12; pc++) {
    const w = pcDistribution[pc] ?? 0;
    if (w > 0) entries.push([pc, w]);
  }
  entries.sort((a, b) => b[1] - a[1]);
  const top = entries.slice(0, topN);
  const total = top.reduce((s, [, w]) => s + w, 0) || 1;
  return top.map(([pc, w]) => ({
    pc,
    weight: w / total,
    pitch: pitchForPc(pc, scale),
  }));
}

function computeModalAffinity(
  pcDistribution: Record<number, number>,
): ModalAffinity[] {
  const results: ModalAffinity[] = [];
  for (let m = 1; m <= 8; m++) {
    const data = MODES.get(m);
    if (!data) continue;
    const structural = new Set<number>([
      data.final,
      data.tenor,
      ...data.modulations.regular,
    ]);
    let score = 0;
    for (const pc of structural) score += pcDistribution[pc] ?? 0;
    results.push({ mode: m, alias: data.alias, score });
  }
  return results.sort((a, b) => b.score - a.score);
}

function computeVowelAttractors(phrases: Phrase[], scale: Scale): VowelAttractor[] {
  const vowelPcMap = new Map<string, Map<number, number>>();
  for (const v of VOWELS) vowelPcMap.set(v, new Map());

  for (const phrase of phrases) {
    for (const syl of phrase.syllables) {
      for (const note of syl.notes) {
        const vowel = note.context.vowel?.toLowerCase();
        if (!vowel) continue;
        const pcMap = vowelPcMap.get(vowel);
        if (!pcMap) continue;
        pcMap.set(note.pitch.pc, (pcMap.get(note.pitch.pc) ?? 0) + 1);
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
    results.push({ vowel: v, weight: total / grandTotal, pitch: pitchForPc(bestPc, scale) });
  }
  return results.sort((a, b) => b.weight - a.weight);
}

/** Build an Imprint from chant phrases (unweighted pc counts). */
export function computeImprint(phrases: Phrase[], scale: Scale): Imprint {
  const pcCounts = new Array<number>(12).fill(0);
  let total = 0;
  for (const phrase of phrases) {
    for (const syl of phrase.syllables) {
      for (const note of syl.notes) {
        pcCounts[note.pitch.pc]++;
        total++;
      }
    }
  }
  const pcDistribution: Record<number, number> = {};
  for (let pc = 0; pc < 12; pc++) {
    pcDistribution[pc] = total > 0 ? pcCounts[pc] / total : 0;
  }

  return {
    pcDistribution,
    attractors: computeAttractors(pcDistribution, scale),
    vowelAttractors: computeVowelAttractors(phrases, scale),
    modalAffinity: computeModalAffinity(pcDistribution),
  };
}

/** Build an Imprint from voiced planetary bodies (presence-weighted pc counts). */
export function computeImprintFromBodies(
  bodies: VoicedBody[],
  scale: Scale,
): Imprint {
  const pcWeight = new Array<number>(12).fill(0);
  let totalPresence = 0;
  for (const b of bodies) {
    pcWeight[b.nota.pitch.pc] += b.presence;
    totalPresence += b.presence;
  }
  const pcDistribution: Record<number, number> = {};
  for (let pc = 0; pc < 12; pc++) {
    pcDistribution[pc] = totalPresence > 0 ? pcWeight[pc] / totalPresence : 0;
  }

  // Vowel attractors: harmony has no phrase text, but each voiced body carries
  // its own Greek planetary vowel. Weight by presence; pitch is the body's own.
  const vowelWeight = new Map<string, { weight: number; pitch: Pitch }>();
  let vowelTotal = 0;
  for (const b of bodies) {
    const key = b.vowel.phonetic;
    const entry = vowelWeight.get(key);
    if (entry) {
      entry.weight += b.presence;
    } else {
      vowelWeight.set(key, { weight: b.presence, pitch: b.nota.pitch });
    }
    vowelTotal += b.presence;
  }
  const vowelAttractors: VowelAttractor[] = [];
  if (vowelTotal > 0) {
    for (const [vowel, { weight, pitch }] of vowelWeight) {
      vowelAttractors.push({ vowel, weight: weight / vowelTotal, pitch });
    }
    vowelAttractors.sort((a, b) => b.weight - a.weight);
  }

  return {
    pcDistribution,
    attractors: computeAttractors(pcDistribution, scale),
    vowelAttractors,
    modalAffinity: computeModalAffinity(pcDistribution),
  };
}
