// ---------------------------------------------------------------------------
// engines/score/ir — build scored representation from parsed GABC
// ---------------------------------------------------------------------------
import type { ArsisThesis, Score, ParsedNote, Note, ParseResult, Phrase, Syllable } from "./types.js";
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
      rhythmicShape: "arsic",
      rhythmicIndex: 1,
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
      doubleEpisema: raw.doubleEpisema,
      weight: raw.weight,
    },
  };
}

function makeSyllable(lyric: string, notes: Note[]): Syllable {
  return { lyric, notes, neume: classifyNeume(notes) };
}

// ── Arsis/thesis classification (Solesmes) ──
// Arsis and thesis are qualities of a compound beat (the group of notes between
// one ictus and the next). Every note in a group shares the group's shape.
// Rules from Carroll, Technique of Gregorian Chironomy (1955), Ch. 4:
//   Rule 1 (incise unity): ictuses up to the melodic apex are arsic; after thetic
//   Rule 2 (relative ictus pitch): higher ictus → arsic; lower → thetic
//   Rule 3 (neume slope): rising notes → arsic; falling → thetic
// Conventional overrides (Ch. 5–6):
//   salicus always arsic; doubly-dotted clivis always thetic

interface AnnotatedNote {
  note: Note;
  neumeType: string;
}

interface Group {
  notes: Note[];
  neumeTypes: Set<string>;
  hasDoubleEpisema: boolean;
  ictusMidi: number | undefined;
  shape: ArsisThesis;
}

function partitionByIctus(annotated: AnnotatedNote[]): Group[] {
  const groups: Group[] = [];
  let current: AnnotatedNote[] = [];
  let currentIctusMidi: number | undefined;

  const closeGroup = (items: AnnotatedNote[], ictusMidi: number | undefined): Group => {
    const neumeTypes = new Set<string>();
    let hasDoubleEpisema = false;
    for (const a of items) {
      neumeTypes.add(a.neumeType);
      if (a.note.context.doubleEpisema) hasDoubleEpisema = true;
    }
    return {
      notes: items.map((a) => a.note),
      neumeTypes,
      hasDoubleEpisema,
      ictusMidi,
      shape: "arsic",
    };
  };

  for (const a of annotated) {
    if (a.note.context.ictus) {
      if (current.length > 0) groups.push(closeGroup(current, currentIctusMidi));
      current = [a];
      currentIctusMidi = a.note.pitch.midi;
    } else {
      current.push(a);
    }
  }
  if (current.length > 0) groups.push(closeGroup(current, currentIctusMidi));
  return groups;
}

function groupSlope(notes: Note[]): number {
  if (notes.length < 2) return 0;
  return notes[notes.length - 1]!.pitch.midi - notes[0]!.pitch.midi;
}

function classifyGroup(
  group: Group,
  prev: Group | null,
  apexMidi: number,
): ArsisThesis {
  // Conventional overrides: specific neume shapes have fixed rhythmic quality
  // regardless of melodic context.
  if (group.neumeTypes.has("salicus")) return "arsic";
  if (group.hasDoubleEpisema && group.neumeTypes.has("clivis")) return "thetic";

  const groupIctusMidi = group.ictusMidi ?? group.notes[0]!.pitch.midi;

  // Rule 1: incise unity — at or after the apex, everything thetic.
  if (prev && prev.ictusMidi !== undefined && prev.ictusMidi >= apexMidi) {
    return "thetic";
  }

  // Rule 2: relative ictus pitch.
  if (prev && prev.ictusMidi !== undefined) {
    if (groupIctusMidi > prev.ictusMidi) return "arsic";
    if (groupIctusMidi < prev.ictusMidi) return "thetic";
  }

  // Rule 3: neume slope within the group.
  const slope = groupSlope(group.notes);
  if (slope > 0) return "arsic";
  if (slope < 0) return "thetic";

  // Default: first group of a piece is arsic (Carroll: never begin with thesis).
  if (!prev) return "arsic";

  // Tie-breaker: alternate from previous.
  return prev.shape === "arsic" ? "thetic" : "arsic";
}

function classifyCompoundBeats(annotated: AnnotatedNote[]): void {
  if (annotated.length === 0) return;

  const groups = partitionByIctus(annotated);

  // Apex = highest-pitched ictus in the incise.
  const apexMidi = annotated
    .filter((a) => a.note.context.ictus)
    .reduce((max, a) => Math.max(max, a.note.pitch.midi), -Infinity);

  for (let gi = 0; gi < groups.length; gi++) {
    const group = groups[gi]!;
    const prev = gi > 0 ? groups[gi - 1]! : null;
    group.shape = classifyGroup(group, prev, apexMidi);
    for (let ni = 0; ni < group.notes.length; ni++) {
      group.notes[ni]!.performance.rhythmicShape = group.shape;
      group.notes[ni]!.performance.rhythmicIndex = ni + 1;
    }
  }
}

function applyCompoundBeats(phrases: Phrase[]): void {
  for (const phrase of phrases) {
    const annotated: AnnotatedNote[] = [];
    for (const syl of phrase.syllables) {
      for (const note of syl.notes) {
        annotated.push({ note, neumeType: syl.neume.type });
      }
    }
    classifyCompoundBeats(annotated);
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

  applyCompoundBeats(phrases);

  return {
    chant,
    phrases,
    errors: parsed.errors,
  };
}
