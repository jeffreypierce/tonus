// ---------------------------------------------------------------------------
// engines/score/ir — build scored representation from parsed GABC
// ---------------------------------------------------------------------------
import type { Score, ParsedNote, ScoredNote, ParseResult, Phrase, Syllable } from "./types.js";
import type { Scale } from "../temper/scale.js";
import { toPitch } from "../temper/pitch.js";
import { toStep } from "../temper/step.js";
import { midiToHz } from "../temper/scale.js";
import { classifyNeume } from "./neume.js";

function rawToScoredNote(raw: ParsedNote, scale: Scale): ScoredNote {
  const midi = raw.step;
  const { hz, offset, bend } = midiToHz(midi, scale);
  const pitch = toPitch(midi, hz, offset, bend);
  const step = toStep(midi, scale);
  return {
    ...pitch,
    step,
    velocity: null,
    duration: raw.duration,
    arsis: null,
    thesis: null,
    lyric: raw.lyric,
    syllableIndex: raw.syllableIndex,
    ictus: raw.ictus,
    accidentalSource: raw.accidentalSource,
    quilisma: raw.quilisma,
    liquescent: raw.liquescent,
    strophicus: raw.strophicus,
    weight: raw.weight,
  };
}

function makeSyllable(lyric: string, notes: ScoredNote[]): Syllable {
  return { lyric, notes, neume: classifyNeume(notes) };
}

function computeGestureCounts(notes: ScoredNote[]): void {
  if (notes.length === 0) return;

  const ictusPositions = notes
    .map((n, i) => n.ictus ? i : -1)
    .filter((i) => i >= 0);

  // If no ictus in this phrase, treat the whole phrase as one gesture
  if (ictusPositions.length === 0) {
    for (let i = 0; i < notes.length; i++) {
      notes[i].arsis = i + 1;
      notes[i].thesis = notes.length - i;
    }
    return;
  }

  // Notes before the first ictus
  if (ictusPositions[0] > 0) {
    const first = ictusPositions[0];
    for (let i = 0; i < first; i++) {
      notes[i].arsis = i + 1;
      notes[i].thesis = first - i;
    }
  }

  // Gesture segments: from each ictus to the next
  const boundaries = [...ictusPositions, notes.length];
  for (let g = 0; g < boundaries.length - 1; g++) {
    const start = boundaries[g];
    const end = boundaries[g + 1];
    for (let i = start; i < end; i++) {
      notes[i].arsis = (i - start) + 1;
      notes[i].thesis = end - i;
    }
  }
}

function applyGestureCounts(phrases: Phrase[]): void {
  for (const phrase of phrases) {
    const allNotes: ScoredNote[] = [];
    for (const syl of phrase.syllables) {
      allNotes.push(...syl.notes);
    }
    computeGestureCounts(allNotes);
  }
}

export function buildIR(
  parsed: ParseResult,
  chant: Score["chant"],
  scale: Scale,
): Score {
  const phrases: Phrase[] = [];
  let currentPhrase: Phrase = { syllables: [] };
  let currentNotes: ScoredNote[] = [];
  let currentLyric: string | null = null;

  for (const event of parsed.events) {
    if (event.type === "note") {
      const scored = rawToScoredNote(event, scale);
      if (currentLyric === null || event.lyric !== currentLyric) {
        if (currentLyric !== null && currentNotes.length > 0) {
          currentPhrase.syllables.push(makeSyllable(currentLyric, currentNotes));
        }
        currentLyric = event.lyric;
        currentNotes = [scored];
      } else {
        currentNotes.push(scored);
      }
    } else {
      if (currentLyric !== null && currentNotes.length > 0) {
        currentPhrase.syllables.push(makeSyllable(currentLyric, currentNotes));
        currentLyric = null;
        currentNotes = [];
      }
      currentPhrase.divisio = event;
      phrases.push(currentPhrase);
      currentPhrase = { syllables: [] };
    }
  }

  if (currentLyric !== null && currentNotes.length > 0) {
    currentPhrase.syllables.push(makeSyllable(currentLyric, currentNotes));
  }
  if (currentPhrase.syllables.length > 0) {
    phrases.push(currentPhrase);
  }

  applyGestureCounts(phrases);

  return {
    chant,
    phrases,
    errors: parsed.errors,
  };
}
