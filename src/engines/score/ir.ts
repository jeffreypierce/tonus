// ---------------------------------------------------------------------------
// engines/score/ir — build scored representation from parsed GABC
// ---------------------------------------------------------------------------
import type { Score, ParsedNote, Note, ParseResult, Phrase, Syllable } from "./types.js";
import type { Scale } from "../temper/scale.js";
import { toPitch } from "../temper/pitch.js";
import { toStep } from "../temper/step.js";
import { selectVowel } from "../chant/syllabify.js";
import { classifyNeume } from "./neume.js";

function rawToNote(raw: ParsedNote, scale: Scale): Note {
  const midi = raw.step;
  return {
    pitch: toPitch(midi, scale),
    step: toStep(midi, scale),
    performance: {
      velocity: 0,
      duration: raw.duration,
      arsis: 0,
      thesis: 0,
    },
    context: {
      lyric: raw.lyric,
      vowel: selectVowel(raw.lyric).vowel,
      syllableIndex: raw.syllableIndex,
      ictus: raw.ictus,
      accidentalSource: raw.accidentalSource,
      quilisma: raw.quilisma,
      liquescent: raw.liquescent,
      strophicus: raw.strophicus,
      weight: raw.weight,
    },
  };
}

function makeSyllable(lyric: string, notes: Note[]): Syllable {
  return { lyric, notes, neume: classifyNeume(notes) };
}

function computeGestureCounts(notes: Note[]): void {
  if (notes.length === 0) return;

  const ictusPositions = notes
    .map((n, i) => (n.context.ictus ? i : -1))
    .filter((i) => i >= 0);

  // If no ictus in this phrase, treat the whole phrase as one gesture
  if (ictusPositions.length === 0) {
    for (let i = 0; i < notes.length; i++) {
      notes[i].performance.arsis = i + 1;
      notes[i].performance.thesis = notes.length - i;
    }
    return;
  }

  // Notes before the first ictus
  if (ictusPositions[0] > 0) {
    const first = ictusPositions[0];
    for (let i = 0; i < first; i++) {
      notes[i].performance.arsis = i + 1;
      notes[i].performance.thesis = first - i;
    }
  }

  // Gesture segments: from each ictus to the next
  const boundaries = [...ictusPositions, notes.length];
  for (let g = 0; g < boundaries.length - 1; g++) {
    const start = boundaries[g];
    const end = boundaries[g + 1];
    for (let i = start; i < end; i++) {
      notes[i].performance.arsis = (i - start) + 1;
      notes[i].performance.thesis = end - i;
    }
  }
}

function applyGestureCounts(phrases: Phrase[]): void {
  for (const phrase of phrases) {
    const allNotes: Note[] = [];
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
  let currentNotes: Note[] = [];
  let currentLyric: string | null = null;

  for (const event of parsed.events) {
    if (event.type === "note") {
      const scored = rawToNote(event, scale);
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
