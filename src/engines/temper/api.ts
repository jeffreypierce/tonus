// ---------------------------------------------------------------------------
// engines/temper/api — Temperamentum context builder
// ---------------------------------------------------------------------------
import { buildRatios, parseScala, getPtolemaicRatios, toRatio } from "./scale.js";
import type { Scale, ScaleOpts, ScalaFile, RatioResult } from "./scale.js";
import { parsePitch, toPitch } from "./pitch.js";
import type { Pitch, PitchInput } from "./pitch.js";
import { toStep } from "./step.js";
import type { Step, StepVariant, Finger, Region } from "./step.js";
import { classifyInterval } from "./interval.js";
import type { Interval, IntervalDirection, IntervalQuality } from "./interval.js";
import { buildNeume } from "./neume.js";
import type { Neume, NeumeShape } from "./neume.js";
import { buildGamut } from "./gamut.js";
import type { GamutOptions } from "./gamut.js";
import { getMode } from "./modes.js";
import type { ModeData, ModeProfile, CadenceFigure } from "./modes.js";
import { getTone, getDifferentia } from "./data/tones.js";
import type { GuidonianEntry, GuidonianVariant } from "./guido.js";

export type BuiltinTuning =
  | "pythagorean" | "meantone" | "equal"
  | "ptolemy-intense" | "ptolemy-soft" | "ptolemy-equable";
export type Tuning = BuiltinTuning | string;

export interface TemperamentumOpts {
  tuning?: Tuning;
  mode?: number | "auto";
  a4?: number;
  root?: number;
  transpose?: number;
  comma?: number | string;
  scale?: string | string[];
}

export type TemperamentumInput = BuiltinTuning | TemperamentumOpts;

export interface TonusOpts {
  differentia?: string;
}

export interface Tonus {
  mode: number;
  differentia: string;
  intonatio: Pitch[];   // opening intonation formula
  mediatio: Pitch[];    // mediant cadence at the verse colon
  terminatio: Pitch[];  // termination cadence (per differentia)
}

/** A pitch resolved through the tuning, with its Guidonian annotation. */
export interface TunedNote {
  pitch: Pitch;
  step: Step;
}

/**
 * A mode's reference data (ModeData), enriched with its structural pitches
 * tuned through the temperamentum that returned it. `modus()`. Cadence figures
 * stay in their diatonic-step form on `cadences` — they are transposition-
 * relative by design.
 */
export interface Modus extends ModeData {
  finalis: TunedNote;         // the final, tuned
  reciting: TunedNote;        // the tenor / reciting tone, tuned
  ambitusNotes: TunedNote[];  // every diatonic step across the mode's range
}

export interface Temperamentum {
  tuning: Tuning;
  mode: number | "auto";
  a4: number;
  root: number;
  transpose: number;
  comma: number;
  ratios: number[];
  cents: number[];

  nota(input: PitchInput): Pitch;
  gradus(input: PitchInput): Step;
  intervallum(a: PitchInput, b: PitchInput): Interval;
  neuma(inputs: PitchInput[]): Neume;
  ratio(input: string): RatioResult & { step: Step | null };
  gamut(opts?: GamutOptions): Pitch[];
  modus(mode: number): Modus;
  tonus(opts?: TonusOpts): Tonus;
}

function resolveOpts(input?: TemperamentumInput): TemperamentumOpts {
  if (input == null) return {};
  if (typeof input === "string") return { tuning: input };
  if (typeof input !== "object")
    throw new Error(
      `temperamentum input must be a tuning name or an options object, got ${typeof input}`,
    );
  const opts = input;
  if (opts.tuning != null && typeof opts.tuning !== "string")
    throw new Error(`tuning must be a string, got ${typeof opts.tuning}`);
  if (
    opts.mode != null &&
    opts.mode !== "auto" &&
    (!Number.isInteger(opts.mode) || opts.mode < 1 || opts.mode > 8)
  )
    throw new RangeError(`Unknown mode: ${opts.mode}. Supported: 1–8 or "auto".`);
  return opts;
}

function resolveScale(opts: TemperamentumOpts): { tuning: string; scaleSteps?: string[] } {
  if (!opts.scale) return { tuning: opts.tuning ?? "pythagorean" };

  if (Array.isArray(opts.scale)) {
    return { tuning: opts.tuning ?? "custom", scaleSteps: opts.scale };
  }

  const parsed = parseScala(opts.scale);
  return { tuning: opts.tuning ?? (parsed.name || "custom"), scaleSteps: parsed.steps };
}

function tuningToScaleOpts(opts: TemperamentumOpts): { scalaOpts: ScaleOpts; tuning: string } {
  const { tuning, scaleSteps } = resolveScale(opts);
  const scalaOpts: ScaleOpts = {
    mode: opts.mode === "auto" ? 1 : (opts.mode ?? 1),
    a4: opts.a4 ?? 440,
    root: opts.root,
    transpose: opts.transpose ?? 0,
  };

  if (scaleSteps) {
    scalaOpts.steps = scaleSteps;
  } else {
    switch (tuning) {
      case "pythagorean":
        scalaOpts.comma = 0;
        break;
      case "meantone":
        scalaOpts.comma = opts.comma ?? "1/4";
        break;
      case "equal":
        scalaOpts.steps = Array.from({ length: 12 }, (_, i) => i * 100);
        break;
      default: {
        const ptolemaic = getPtolemaicRatios(tuning);
        if (!ptolemaic)
          throw new Error(
            `Unknown tuning: "${tuning}". Built-ins: pythagorean, meantone, equal, ` +
              `ptolemy-intense, ptolemy-soft, ptolemy-equable — or pass a scale.`,
          );
        scalaOpts.steps = ptolemaic;
        break;
      }
    }
  }

  return { scalaOpts, tuning };
}

/**
 * Tuning context builder (`tonus.temperamentum`). Accepts a built-in
 * tuning name, options, a custom scale array, or a Scala file, and
 * returns a Temperamentum whose methods resolve pitches, intervals,
 * neumes, the Guidonian gamut, and psalm tones under that tuning.
 * @throws Error on invalid tuning, scale, or mode input.
 */
export function buildTemper(input?: TemperamentumInput): Temperamentum {
  const opts = resolveOpts(input);
  const modeVal = opts.mode ?? "auto";
  const { scalaOpts, tuning } = tuningToScaleOpts(opts);
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

    nota(pitchInput: PitchInput): Pitch {
      return toPitch(pitchInput, scala);
    },

    gradus(pitchInput: PitchInput): Step {
      const midi = parsePitch(pitchInput, { mode: scala.mode, a4: scala.a4 });
      return toStep(midi, scala);
    },

    intervallum(a: PitchInput, b: PitchInput): Interval {
      const midiA = parsePitch(a, { mode: scala.mode, a4: scala.a4 });
      const midiB = parsePitch(b, { mode: scala.mode, a4: scala.a4 });
      return classifyInterval(midiA, midiB);
    },

    neuma(inputs: PitchInput[]): Neume {
      return buildNeume(inputs, scala);
    },

    ratio(input: string): RatioResult & { step: Step | null } {
      const result = toRatio(input);
      const folded = result.ratio >= 2 ? result.ratio / Math.pow(2, Math.floor(Math.log2(result.ratio))) : result.ratio;
      let step: Step | null = null;
      for (let pc = 0; pc < 12; pc++) {
        if (Math.abs((scala.ratios[pc] ?? 0) - folded) < 1e-6) {
          const baseMidi = 60 + pc;
          step = toStep(baseMidi, scala);
          break;
        }
      }
      return { ...result, step };
    },

    gamut(gamutOpts?: GamutOptions): Pitch[] {
      return buildGamut(scala, gamutOpts);
    },

    modus(mode: number): Modus {
      const data = getMode(mode);
      // The mode's degrees are stored as semitone offsets from C (pc 0), with
      // values past 12 in the upper octave. Anchor them at C4 (MIDI 60).
      const tuned = (offset: number): TunedNote => ({
        pitch: toPitch(60 + offset, scala),
        step: toStep(60 + offset, scala),
      });

      const scaleSet = new Set(data.scalePcs);
      const ambitusNotes: TunedNote[] = [];
      for (let off = data.ambitus.lowest; off <= data.ambitus.highest; off++) {
        if (scaleSet.has(((off % 12) + 12) % 12)) ambitusNotes.push(tuned(off));
      }

      return {
        ...data,
        finalis: tuned(data.final),
        reciting: tuned(data.tenor),
        ambitusNotes,
      };
    },

    tonus(tonusOpts?: TonusOpts): Tonus {
      if (modeVal === "auto") throw new Error("tonus() requires an explicit mode — set mode in temperamentum()");
      const tone = getTone(modeVal);
      const diff = getDifferentia(tone, tonusOpts?.differentia);
      return {
        mode: modeVal,
        differentia: diff.code,
        intonatio: tone.intonation.map((m) => toPitch(m, scala)),
        mediatio: tone.mediant.map((m) => toPitch(m, scala)),
        terminatio: diff.termination.map((m) => toPitch(m, scala)),
      };
    },
  };
}

export type {
  Scale,
  ScaleOpts,
  ScalaFile,
  RatioResult,
  Pitch,
  PitchInput,
  Step,
  StepVariant,
  Finger,
  Region,
  Neume,
  NeumeShape,
  Interval,
  IntervalDirection,
  IntervalQuality,
  ModeData,
  ModeProfile,
  CadenceFigure,
  GamutOptions,
  GuidonianEntry,
  GuidonianVariant,
};
