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
import { computeModalAffinity, type ModalAffinity } from "./temper/modality.js";
import type { VoicedBody } from "./harmonia/voice.js";

export type { ModalAffinity };

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

export interface Imprint {
  pcDistribution: Record<number, number>;
  attractors: Attractor[];
  vowelAttractors: VowelAttractor[];
  modalAffinity: ModalAffinity[];
}

const DEFAULT_TOP = 5;
// Attractors are pitch *classes*; they're rendered at a fixed octave (4) purely
// so they carry a concrete Pitch for display. The octave is not meaningful — do
// not read it as register.
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

// A note's contribution to the pc-distribution is raised where it carries more
// structural weight: on an ictus (the rhythmic footfall) and, above all, when it
// is a cadence's resolution. Cadence notes are passed in — the imprint sits below
// the score engine, so it cannot detect them itself. The principle that ictus and
// cadence notes are the modally load-bearing ones is Solesmes doctrine [biblio:
// mocquereau-nombre]; the magnitudes (1.5×, 2×) are a tuned editorial weighting,
// not a figure from any source — cadence weighted above ictus by intent.
const ICTUS_WEIGHT = 1.5;
const CADENCE_WEIGHT = 2;

export interface ImprintOptions {
  /** Positions "phrase:syllable:note" of cadence resolution notes, weighted up. */
  cadenceNotes?: Set<string>;
}

/** Build an Imprint from chant phrases, weighting structural notes more. */
export function computeImprint(
  phrases: Phrase[],
  scale: Scale,
  opts: ImprintOptions = {},
): Imprint {
  const cadenceNotes = opts.cadenceNotes;
  const pcCounts = new Array<number>(12).fill(0);
  let total = 0;
  // For the tessitura signal: the mean MIDI of every note, and the last note.
  let midiSum = 0;
  let noteCount = 0;
  let lastNote: { pc: number; midi: number } | null = null;
  for (let pi = 0; pi < phrases.length; pi++) {
    const phrase = phrases[pi]!;
    for (let si = 0; si < phrase.syllables.length; si++) {
      const notes = phrase.syllables[si]!.notes;
      for (let ni = 0; ni < notes.length; ni++) {
        const note = notes[ni]!;
        let w = 1;
        if (note.context.ictus) w *= ICTUS_WEIGHT;
        if (cadenceNotes?.has(`${pi}:${si}:${ni}`)) w *= CADENCE_WEIGHT;
        pcCounts[note.pitch.pc] += w;
        total += w;
        midiSum += note.pitch.midi;
        noteCount++;
        lastNote = { pc: note.pitch.pc, midi: note.pitch.midi };
      }
    }
  }
  const pcDistribution: Record<number, number> = {};
  for (let pc = 0; pc < 12; pc++) {
    pcDistribution[pc] = total > 0 ? pcCounts[pc]! / total : 0;
  }

  const firstNotePc = phrases[0]?.syllables[0]?.notes[0]?.pitch.pc;
  // Tessitura = the melody's mean height above where it comes to rest.
  const tessitura = lastNote && noteCount > 0 ? midiSum / noteCount - lastNote.midi : undefined;

  return {
    pcDistribution,
    attractors: computeAttractors(pcDistribution, scale),
    vowelAttractors: computeVowelAttractors(phrases, scale),
    modalAffinity: computeModalAffinity(pcDistribution, {
      firstNotePc,
      lastNotePc: lastNote?.pc,
      tessitura,
    }),
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
