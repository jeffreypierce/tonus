import type { Score, Note, Neume } from "../types.js";
import { MODES } from "../../temper/modes.js";
import {
  buildPhrasing,
  shapePhrasingForMode,
  applyPhrasing,
} from "../phrasing.js";
import { inferMode } from "../infer.js";
import { CHROMA_TO_SOLFEGE as SOLFEGE_BY_PC } from "../../temper/data/constants.js";
import type { ChantType, InterpretationOptions } from "../types.js";

export type NoteRole = "finalis" | "tenor" | "other" | null;

export interface TabulaRow {
  phraseIndex: number;
  syllableIndex: number;
  noteIndex: number;
  /** Index of this note within its syllable (neume group), 0-based */
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
  arsis: number;
  duration: number;
  /** 0–1 from phrasing; null if phrasing inactive */
  velocity: number | null;
  shapedDuration: number;
  ictus: boolean;
  accidental: -1 | 0 | 1;
  divisio: string | null;
  /** Modal role: "final" | "tenor" | "mod" (modulation) | null if no mode or no match */
  role: NoteRole;
  /** Guidonian short name (e.g. "g", "aa") — null for chromatic pitches with no gamut entry */
  name: string | null;
  /** Guidonian full compound name (e.g. "Gesolreut") — null for chromatic pitches */
  fullName: string | null;
  /** Guidonian hand position */
  hand: { finger: string; region: string } | null;
  /** Hexachord context for this pitch */
  hexachord: "durum" | "naturale" | "molle" | null;
  /** Solfege syllable — Guidonian variant when in gamut, chromatic fallback otherwise */
  solfege: string | null;
  /** Neume classification for the syllable this note belongs to */
  neume: Neume;
}

export interface TableEmitOptions {
  mode?: number;
  office?: ChantType;
  interpretation?: InterpretationOptions;
  a4Hz?: number;
  transpose?: number;
}

export interface TableEmitResult {
  rows: TabulaRow[];
}

export function toTable(
  ir: Score,
  options: TableEmitOptions = {},
): TableEmitResult {
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

  const rows: TabulaRow[] = annotated.map((a, i) => {
    const n = a.note;

    return {
      phraseIndex: a.phraseIndex,
      syllableIndex: a.syllableIndex,
      noteIndex: a.noteIndex,
      neumeIndex: a.noteIndex,
      lyric: n.context.lyric,
      vowel: n.context.vowel,
      midi: n.pitch.midi,
      pc: n.pitch.pc,
      octave: n.pitch.oct,
      degree: n.step.degree,
      hz: n.pitch.hz,
      offset: n.pitch.offset,
      arsis: n.performance.arsis,
      duration: n.performance.duration,
      velocity: velocities[i],
      shapedDuration: shapedDurations[i],
      ictus: n.context.ictus,
      accidental: n.pitch.acc,
      divisio: a.divisio,
      role: n.step.role,
      name: n.step.name,
      fullName: n.step.compound,
      hand: n.step.hand,
      hexachord: n.step.hexachord,
      solfege: n.step.solmization ?? SOLFEGE_BY_PC.get(n.pitch.pc) ?? null,
      neume: a.neume,
    };
  });

  return { rows };
}
