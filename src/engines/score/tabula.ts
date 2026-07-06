import type { Score, Note, Neume } from "./types.js";
import { MODES } from "../temper/modes.js";
import {
  buildPhrasing,
  shapePhrasingForMode,
  applyPhrasing,
} from "./phrasing.js";
import { inferMode } from "./infer.js";
import { CHROMA_TO_SOLFEGE as SOLFEGE_BY_PC } from "../temper/data/constants.js";
import type { Cadence } from "./cadence.js";
import type { ChantType, InterpretationOptions } from "./types.js";

export type NoteRole = "finalis" | "tenor" | "other" | null;

export interface ChantTabulaRow {
  phraseIndex: number;
  syllableIndex: number;
  noteIndex: number;
  /** 0-based index of the neume figure within the syllable (GABC break markers). */
  neumeGroup: number;
  /** 0-based position of this note within its neume figure. */
  neumeIndex: number;
  lyric: string;
  vowel: string;
  /** MIDI pitch number (after transpose, clamped 0–127) */
  midi: number;
  /** Pitch class 0–11 (C=0) */
  pc: number;
  /** Octave (MIDI convention: C4 = octave 4) */
  octave: number;
  /** Diatonic scale degree 1–7 relative to mode finalis; null for non-diatonic pitches or no mode */
  degree: number | null;
  hz: number;
  offset: number;
  /** Scientific pitch name, e.g. "D4", "Bb3" — the MusicXML step + octave. */
  spn: string;
  /** 14-bit MIDI pitch bend for this note's microtuning (8192 = center). */
  bend: number;
  /** Solesmes quality of this note's compound beat (shared across group). */
  rhythmicShape: "arsic" | "thetic";
  /** 1-based position within the compound beat. */
  rhythmicIndex: number;
  duration: number;
  /** 0–1 from phrasing; null if phrasing inactive */
  velocity: number | null;
  shapedDuration: number;
  ictus: boolean;
  accidental: -1 | 0 | 1;
  /** How this note's accidental arose — only "explicit" prints a glyph. */
  accidentalSource: "none" | "state" | "explicit";
  quilisma: boolean;
  liquescent: boolean;
  strophicus: boolean;
  divisio: string | null;
  /** Index into score.cadences[] when this note forms a cadence; null otherwise. */
  cadenceRef: number | null;
  /** Modal role: "final" | "tenor" | "mod" (modulation) | null if no mode or no match */
  role: NoteRole;
  /** Guidonian short name (e.g. "g", "aa") — null for chromatic pitches with no gamut entry */
  name: string | null;
  /** Guidonian full compound name (e.g. "Gesolreut") — null for chromatic pitches */
  nomen: string | null;
  /** Guidonian hand position */
  hand: { finger: string; region: string } | null;
  /** Hexachord context for this pitch */
  hexachord: "durum" | "naturale" | "molle" | null;
  /** Solfege syllable — Guidonian variant when in gamut, chromatic fallback otherwise */
  solfege: string | null;
  /** Neume classification for the syllable this note belongs to */
  neume: Neume;
}

export interface TabulaOptions {
  mode?: number;
  office?: ChantType;
  interpretation?: InterpretationOptions;
  a4Hz?: number;
  transpose?: number;
  /** Detected cadences; used to stamp each row's cadenceRef. */
  cadences?: Cadence[];
}

export function computeTabula(
  ir: Score,
  options: TabulaOptions = {},
): ChantTabulaRow[] {
  const modeNum = options.mode ?? inferMode(ir);
  const modeData = modeNum !== undefined ? MODES.get(modeNum) : undefined;
  const interpretation = options.interpretation ?? {};
  const usePhrasing =
    options.mode !== undefined ||
    interpretation.phrasing !== undefined ||
    options.office !== undefined;

  type AnnotatedNote = {
    note: Note;
    phraseIndex: number;
    syllableIndex: number;
    noteIndex: number;
    divisio: string | null;
    neume: Neume;
  };

  const annotated: AnnotatedNote[] = [];
  type RestEntry = { type: "rest"; divisio: string; duration: number };
  const flatForPhrasing: Array<Note | RestEntry> = [];

  for (let pi = 0; pi < ir.phrases.length; pi++) {
    const phrase = ir.phrases[pi];
    const divStr = phrase.divisio?.divisio ?? null;
    let si = 0;

    for (const syl of phrase.syllables) {
      for (let ni = 0; ni < syl.notes.length; ni++) {
        const note = syl.notes[ni];
        annotated.push({
          note,
          phraseIndex: pi,
          syllableIndex: si,
          noteIndex: ni,
          divisio: divStr,
          neume: syl.neume,
        });
        flatForPhrasing.push(note);
      }
      si++;
    }

    if (phrase.divisio) {
      flatForPhrasing.push({
        type: "rest",
        divisio: phrase.divisio.divisio,
        duration: phrase.divisio.duration,
      });
    }
  }

  let velocities: (number | null)[] = annotated.map(() => null);
  let shapedDurations: number[] = annotated.map((a) => a.note.performance.duration);

  if (usePhrasing && annotated.length > 0) {
    const profile = buildPhrasing(interpretation.phrasing ?? "lyrical", {
      overrides: interpretation.phrasingOverrides,
    });
    const modeProfile = shapePhrasingForMode(profile, modeData, {
      strength: interpretation.modalInfluence,
    });
    const tenorPc = modeData?.tenor;
    const shaped = applyPhrasing(
      flatForPhrasing as Parameters<typeof applyPhrasing>[0],
      modeProfile,
      tenorPc,
    );

    for (let i = 0; i < shaped.length && i < annotated.length; i++) {
      velocities[i] = shaped[i].performance.velocity;
      shapedDurations[i] = shaped[i].shapedDuration;
    }
  }

  // Map each cadence's constituent notes back to its index, keyed by position.
  const cadenceRefByPos = new Map<string, number>();
  if (options.cadences) {
    for (let ci = 0; ci < options.cadences.length; ci++) {
      for (const [pi, si, ni] of options.cadences[ci]!.notes) {
        cadenceRefByPos.set(`${pi}:${si}:${ni}`, ci);
      }
    }
  }

  // Position of each note within its neume figure — resets when the
  // (syllableIndex, neumeGroup) pair changes.
  const neumeIndices: number[] = [];
  let prevKey: string | null = null;
  let withinGroup = 0;
  for (const a of annotated) {
    const key = `${a.phraseIndex}:${a.syllableIndex}:${a.note.context.neumeGroup}`;
    withinGroup = key === prevKey ? withinGroup + 1 : 0;
    neumeIndices.push(withinGroup);
    prevKey = key;
  }

  const rows: ChantTabulaRow[] = annotated.map((a, i) => {
    const n = a.note;

    return {
      phraseIndex: a.phraseIndex,
      syllableIndex: a.syllableIndex,
      noteIndex: a.noteIndex,
      neumeGroup: n.context.neumeGroup,
      neumeIndex: neumeIndices[i],
      lyric: n.context.lyric,
      vowel: n.context.vowel,
      midi: n.pitch.midi,
      pc: n.pitch.pc,
      octave: n.pitch.oct,
      degree: n.step.degree,
      hz: n.pitch.hz,
      offset: n.pitch.offset,
      spn: n.pitch.spn,
      bend: n.pitch.bend,
      rhythmicShape: n.performance.rhythmicShape,
      rhythmicIndex: n.performance.rhythmicIndex,
      duration: n.performance.duration,
      velocity: velocities[i],
      shapedDuration: shapedDurations[i],
      ictus: n.context.ictus,
      accidental: n.pitch.acc,
      accidentalSource: n.context.accidentalSource,
      quilisma: n.context.quilisma,
      liquescent: n.context.liquescent,
      strophicus: n.context.strophicus,
      divisio: a.divisio,
      cadenceRef:
        cadenceRefByPos.get(`${a.phraseIndex}:${a.syllableIndex}:${a.noteIndex}`) ?? null,
      role: n.step.role,
      name: n.step.name,
      nomen: n.step.nomen,
      hand: n.step.hand,
      hexachord: n.step.hexachord,
      solfege: n.step.solmization ?? SOLFEGE_BY_PC.get(n.pitch.pc) ?? null,
      neume: a.neume,
    };
  });

  return rows;
}
