import type { Score, ScoredNote, Neume } from "../types.js";
import { MODES } from "../../temper/modes.js";
import type { ModeData } from "../../temper/modes.js";
import {
  buildPhrasing,
  shapePhrasingForMode,
  applyPhrasing,
} from "../phrasing.js";
import { inferMode } from "../infer.js";
import { selectVowel } from "../../chant/syllabify.js";
import { CHROMA_TO_SOLFEGE as SOLFEGE_BY_PC } from "../../temper/data/constants.js";
import type { ChantType, InterpretationOptions } from "../types.js";

export type NoteRole = "final" | "tenor" | "mod" | null;

export interface Note {
  phraseIndex: number;
  syllableIndex: number;
  noteIndex: number;
  /** Index of this note within its syllable (neume group), 0-based */
  neumeIndex: number;
  lyric: string;
  vowel: string;
  /** MIDI pitch number (after transpose, clamped 0–127) */
  midi: number;
  /** Fractional MIDI derived from tuning offset (midi + offset/100) */
  midiF: number;
  /** Pitch class 0–11 (C=0) */
  pc: number;
  /** Octave (MIDI convention: C4 = octave 4) */
  octave: number;
  /** Diatonic scale degree 1–7 relative to mode finalis (or C if no mode) */
  degree: number;
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
  rows: Note[];
}

const DIATONIC_PCS = [0, 2, 4, 5, 7, 9, 11] as const;

/**
 * Diatonic scale degree 1–7 relative to a finalis pitch class.
 * Chromatic pitches (black keys) are mapped to the nearest lower diatonic PC.
 */
function scaleDegree(midiPitch: number, finalPc: number): number {
  const pc = ((midiPitch % 12) + 12) % 12;
  const diatonicPc = DIATONIC_PCS.includes(pc as typeof DIATONIC_PCS[number])
    ? pc
    : DIATONIC_PCS.slice().reverse().find((d) => d <= pc) ?? DIATONIC_PCS[DIATONIC_PCS.length - 1];

  const finalDiatonicPc = DIATONIC_PCS.includes(finalPc as typeof DIATONIC_PCS[number])
    ? finalPc
    : DIATONIC_PCS[0];
  const finalIdx = DIATONIC_PCS.indexOf(finalDiatonicPc as typeof DIATONIC_PCS[number]);
  const noteIdx  = DIATONIC_PCS.indexOf(diatonicPc as typeof DIATONIC_PCS[number]);

  return ((noteIdx - finalIdx + 7) % 7) + 1;
}

function noteRole(pc: number, modeData: ModeData | undefined): NoteRole {
  if (!modeData) return null;
  if (pc === modeData.final) return "final";
  if (pc === modeData.tenor) return "tenor";
  if (modeData.modulations.regular.includes(pc)) return "mod";
  return null;
}

export function toTable(ir: Score, options: TableEmitOptions = {}): TableEmitResult {
  const modeNum   = options.mode ?? inferMode(ir);
  const modeData  = modeNum !== undefined ? MODES.get(modeNum) : undefined;
  const finalPc   = modeData?.final ?? 0;
  const interpretation = options.interpretation ?? {};
  const usePhrasing =
    options.mode !== undefined ||
    interpretation.phrasing !== undefined ||
    options.office !== undefined;

  type AnnotatedNote = {
    note: ScoredNote;
    phraseIndex: number;
    syllableIndex: number;
    noteIndex: number;
    divisio: string | null;
    neume: Neume;
  };

  const annotated: AnnotatedNote[] = [];
  type RestEntry = { type: "rest"; divisio: string; duration: number };
  const flatForPhrasing: Array<ScoredNote | RestEntry> = [];

  for (let pi = 0; pi < ir.phrases.length; pi++) {
    const phrase = ir.phrases[pi];
    const divStr = phrase.divisio?.divisio ?? null;
    let si = 0;

    for (const syl of phrase.syllables) {
      for (let ni = 0; ni < syl.notes.length; ni++) {
        const note = syl.notes[ni];
        annotated.push({ note, phraseIndex: pi, syllableIndex: si, noteIndex: ni, divisio: divStr, neume: syl.neume });
        flatForPhrasing.push(note);
      }
      si++;
    }

    if (phrase.divisio) {
      flatForPhrasing.push({ type: "rest", divisio: phrase.divisio.divisio, duration: phrase.divisio.duration });
    }
  }

  let velocities: (number | null)[]  = annotated.map(() => null);
  let shapedDurations: number[] = annotated.map((a) => a.note.duration ?? 1);

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
      velocities[i]      = shaped[i].velocity;
      shapedDurations[i] = shaped[i].shapedDuration;
    }
  }

  const rows: Note[] = annotated.map((a, i) => {
    const n = a.note;
    const { vowel } = selectVowel(n.lyric);
    const degree = scaleDegree(n.midi, finalPc);
    const role = noteRole(n.pc, modeData);

    return {
      phraseIndex:    a.phraseIndex,
      syllableIndex:  a.syllableIndex,
      noteIndex:      a.noteIndex,
      neumeIndex:     a.noteIndex,
      lyric:          n.lyric,
      vowel,
      midi:           n.midi,
      midiF:          n.midi + (n.bend - 8192) / 8192,
      pc:             n.pc,
      octave:         n.oct,
      degree,
      hz:             n.hz,
      offset:         0,
      arsis:          n.arsis ?? 0,
      duration:       n.duration ?? 1,
      velocity:       velocities[i],
      shapedDuration: shapedDurations[i],
      ictus:          n.ictus,
      accidental:     n.acc,
      divisio:        a.divisio,
      role,
      name:           n.step.name?.short ?? null,
      fullName:       n.step.name?.compound ?? null,
      hand:           n.step.hand,
      hexachord:      n.step.hexachord,
      solfege:        n.step.solmization ?? SOLFEGE_BY_PC.get(n.pc) ?? null,
      neume:          a.neume,
    };
  });

  return { rows };
}
