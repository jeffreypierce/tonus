// ---------------------------------------------------------------------------
// engines/temper/api — Temper context builder
// ---------------------------------------------------------------------------
import { buildRatios } from "./scale.js";
import type { Scale, ScaleOpts } from "./scale.js";
import { parsePitch } from "./pitch.js";
import type { Pitch, PitchInput } from "./pitch.js";
import { toStep } from "./step.js";
import type { Step, StepName, StepVariant, Finger, Region } from "./step.js";
import { toNote } from "./note.js";
import type { Note } from "./note.js";
import { buildNeume } from "./neume.js";
import type { Neume, NeumeShape, Interval, IntervalDirection, IntervalQuality } from "./neume.js";
import { buildGamut } from "./gamut.js";
import type { GamutOptions } from "./gamut.js";
import { getMode } from "./modes.js";
import type { ModeData, ModeProfile } from "./modes.js";
import { getTone, getDifferentia } from "../../data/tones.js";
import type { GuidonianEntry, GuidonianVariant } from "./guido.js";

export type Tuning = "pythagorean" | "meantone" | "just" | "equal" | "custom";

export interface TemperOpts {
  tuning?: Tuning;
  mode?: number | "auto";
  a4?: number;
  root?: number;
  transpose?: number;
  comma?: number | string;
  scale?: string[];
}

export type TemperInput = Tuning | TemperOpts;

export interface TonusOpts {
  differentia?: string;
}

export interface Tonus {
  mode: number;
  differentia: string;
  intonation: Note[];
  mediant: Note[];
  termination: Note[];
}

export interface Temper {
  tuning: Tuning;
  mode: number | "auto";
  a4: number;
  root: number;
  transpose: number;
  comma: number;
  ratios: number[];
  cents: number[];

  nota(input: PitchInput): Note;
  gradus(input: PitchInput): Step;
  neuma(inputs: PitchInput[]): Neume;
  gamut(opts?: GamutOptions): Note[];
  modus(mode: number): ModeData;
  tonus(opts?: TonusOpts): Tonus;
}

function resolveOpts(input?: TemperInput): TemperOpts {
  if (!input) return {};
  if (typeof input === "string") return { tuning: input };
  return input;
}

function tuningToScaleOpts(opts: TemperOpts): ScaleOpts {
  const tuning = opts.tuning ?? "pythagorean";
  const scalaOpts: ScaleOpts = {
    mode: opts.mode === "auto" ? 1 : (opts.mode ?? 1),
    a4: opts.a4 ?? 440,
    root: opts.root,
    transpose: opts.transpose ?? 0,
  };

  switch (tuning) {
    case "pythagorean":
      scalaOpts.comma = 0;
      break;
    case "meantone":
      scalaOpts.comma = opts.comma ?? "1/4";
      break;
    case "just":
      scalaOpts.comma = 1;
      break;
    case "equal":
      scalaOpts.steps = Array.from({ length: 12 }, (_, i) => i * 100);
      break;
    case "custom":
      if (!opts.scale) throw new Error("custom tuning requires a scale array");
      scalaOpts.steps = opts.scale;
      break;
  }

  return scalaOpts;
}

export function buildTemper(input?: TemperInput): Temper {
  const opts = resolveOpts(input);
  const tuning = opts.tuning ?? "pythagorean";
  const modeVal = opts.mode ?? "auto";
  const scalaOpts = tuningToScaleOpts(opts);
  const scala = buildRatios(scalaOpts);

  return {
    tuning,
    mode: modeVal,
    a4: scala.a4,
    root: scala.root,
    transpose: scala.transpose,
    comma: scala.comma,
    ratios: scala.ratios,
    cents: scala.cents,

    nota(pitchInput: PitchInput): Note {
      return toNote(pitchInput, scala);
    },

    gradus(pitchInput: PitchInput): Step {
      const midi = parsePitch(pitchInput, { mode: scala.mode, a4: scala.a4 });
      return toStep(midi, scala);
    },

    neuma(inputs: PitchInput[]): Neume {
      return buildNeume(inputs, scala);
    },

    gamut(gamutOpts?: GamutOptions): Note[] {
      return buildGamut(scala, gamutOpts);
    },

    modus(mode: number): ModeData {
      return getMode(mode);
    },

    tonus(tonusOpts?: TonusOpts): Tonus {
      if (modeVal === "auto") throw new Error("tonus() requires an explicit mode — set mode in buildTemper()");
      const tone = getTone(modeVal);
      const diff = getDifferentia(tone, tonusOpts?.differentia);
      return {
        mode: modeVal,
        differentia: diff.code,
        intonation: tone.intonation.map((m) => toNote(m, scala)),
        mediant: tone.mediant.map((m) => toNote(m, scala)),
        termination: diff.termination.map((m) => toNote(m, scala)),
      };
    },
  };
}

export type {
  Scale,
  ScaleOpts,
  Pitch,
  PitchInput,
  Step,
  StepName,
  StepVariant,
  Finger,
  Region,
  Note,
  Neume,
  NeumeShape,
  Interval,
  IntervalDirection,
  IntervalQuality,
  ModeData,
  ModeProfile,
  GamutOptions,
  GuidonianEntry,
  GuidonianVariant,
};
