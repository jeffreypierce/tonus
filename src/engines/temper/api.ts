// ---------------------------------------------------------------------------
// engines/temper/api — Temperamentum context builder
// ---------------------------------------------------------------------------
import { buildRatios, parseScala, parseComma, getPtolemaicRatios, toRatio, wolfOf, foldOctave } from "./scale.js";
import type { Scale, ScaleOpts, ScalaFile, RatioResult, Lupus } from "./scale.js";
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
import type { ModeData, ModeProfile } from "./modes.js";
import { modusCadentiae, type ModusCadentiae, type ModusGenus } from "./cadentiae.js";
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
  tenor: Pitch;         // the reciting note (the differentia's own, where it has one)
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
 * What `modus()` returns: a mode's reference data (ModeData), with its
 * structural pitches tuned through the temperamentum that returned it.
 * `cadences` is the mode's set from the corpus catalogue, derived at call: a
 * measurement riding the verb, where the reference data is fixed.
 */
export interface Modus extends ModeData {
  finalis: TunedNote;         // the final, tuned
  reciting: TunedNote;        // the tenor / reciting tone, tuned
  ambitusNotes: TunedNote[];  // every diatonic step across the mode's range
  cadences: ModusCadentiae;   // the top five genera the mode closes on, with their species
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
  /** The wolf, or null when no fifths chain built this scale. UNDOCUMENTED:
   *  the site is its only caller and the shape is still settling. */
  lupus(): Lupus | null;
  gamut(opts?: GamutOptions): Pitch[];
  modus(mode: number): Modus;
  tonus(opts?: TonusOpts): Tonus;
}

const OPTION_KEYS = new Set(["tuning", "mode", "a4", "root", "transpose", "comma", "scale"]);

function resolveOpts(input?: TemperamentumInput): TemperamentumOpts {
  if (input == null) return {};
  if (typeof input === "string") return { tuning: input };
  if (typeof input !== "object" || Array.isArray(input))
    throw new Error(
      `temperamentum input must be a tuning name or an options object, got ${Array.isArray(input) ? "an array (pass it as { scale: [...] })" : typeof input}`,
    );
  const opts = input;
  // The same door policy as the query functions: an unknown key is a typo
  // ({ tunning: "equal" }) and throws, rather than building the default tuning.
  const unknown = Object.keys(opts).filter((k) => !OPTION_KEYS.has(k));
  if (unknown.length)
    throw new Error(
      `temperamentum: unknown option(s) ${unknown.map((k) => `"${k}"`).join(", ")} ` +
        `(expected ${[...OPTION_KEYS].join(", ")}).`,
    );
  if (opts.tuning != null && typeof opts.tuning !== "string")
    throw new Error(`tuning must be a string, got ${typeof opts.tuning}`);
  if (
    opts.mode != null &&
    opts.mode !== "auto" &&
    (!Number.isInteger(opts.mode) || opts.mode < 1 || opts.mode > 8)
  )
    throw new RangeError(`Unknown mode: ${opts.mode}. Supported: 1–8 or "auto".`);
  if (opts.a4 != null && !(Number.isFinite(opts.a4) && opts.a4 > 0))
    throw new RangeError(`a4 must be a positive frequency in Hz, got ${opts.a4}`);
  if (opts.root != null && !(Number.isInteger(opts.root) && opts.root >= 0 && opts.root <= 11))
    throw new RangeError(`root must be a pitch class, an integer 0–11, got ${opts.root}`);
  if (opts.transpose != null && !Number.isInteger(opts.transpose))
    throw new RangeError(`transpose must be a whole number of semitones, got ${opts.transpose}`);
  if (opts.comma != null) parseComma(opts.comma); // throws outside [0, 1]
  if (opts.scale != null) {
    const empty = Array.isArray(opts.scale) ? opts.scale.length === 0 : opts.scale.trim() === "";
    if (empty) throw new RangeError("scale is empty: pass a Scala file string or an array of 7 or 12 steps");
  }
  return opts;
}

function resolveScale(opts: TemperamentumOpts): { tuning: string; scaleSteps?: string[] } {
  if (opts.scale == null) return { tuning: opts.tuning ?? "pythagorean" };

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

    /** The wolf of THIS temperament.
     *
     *  Null when the scale was supplied rather than stacked: a Ptolemaic
     *  genus and a Scala list arrive as ratios, so there is no chain of
     *  fifths and nothing is left over. Returning a number there would be
     *  inventing one.
     */
    lupus(): Lupus | null {
      if (scalaOpts.steps != null) return null;
      return wolfOf(scala.comma);
    },

    ratio(input: string): RatioResult & { step: Step | null } {
      const result = toRatio(input);
      // Compare octave-free: the input folded into [1, 2), against each table
      // entry folded the same way. The table is root-relative, so a pitch
      // class below the root sits under 1 (16/9 above D is C, at 8/9 in the
      // table) and an unfolded comparison never finds it.
      const folded = foldOctave(result.ratio);
      let step: Step | null = null;
      for (let pc = 0; pc < 12; pc++) {
        if (Math.abs(foldOctave(scala.ratios[pc] ?? 1) - folded) < 1e-6) {
          // Name the pitch where the ratio puts it: above the root, in the
          // frame the modes are written in (C3 = 48).
          step = toStep(48 + scala.root + ((pc - scala.root + 12) % 12), scala);
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
      // The mode's degrees are stored as semitones above C3, values past 12 in
      // the upper octave (data/modes.ts, THE FRAME); gamut() reads the same
      // frame. Steps read against THIS mode, not the context's.
      const tuned = (offset: number): TunedNote => ({
        pitch: toPitch(48 + offset, scala),
        step: toStep(48 + offset, scala, mode),
      });

      const scaleSet = new Set(data.scalePcs);
      const ambitusNotes: TunedNote[] = [];
      for (let off = data.ambitus.lowest; off <= data.ambitus.highest; off++) {
        if (scaleSet.has(((off % 12) + 12) % 12)) ambitusNotes.push(tuned(off));
      }

      // `final` and `tenor` are pitch classes; place each inside the mode's
      // range, so mode VIII's tenor is the c above its final g, not below it.
      return {
        ...data,
        finalis: tuned(data.ambitus.lowest + ((data.final - data.ambitus.lowest + 12) % 12)),
        reciting: tuned(data.ambitus.lowest + ((data.tenor - data.ambitus.lowest + 12) % 12)),
        ambitusNotes,
        cadences: modusCadentiae(data),
      };
    },

    tonus(tonusOpts?: TonusOpts): Tonus {
      if (modeVal === "auto") throw new Error("tonus() requires an explicit mode — set mode in temperamentum()");
      const tone = getTone(modeVal);
      const diff = getDifferentia(tone, tonusOpts?.differentia);
      return {
        mode: modeVal,
        differentia: diff.code,
        tenor: toPitch(diff.tenor ?? tone.tenor, scala),
        // An ending that brings its own tone body (IV A, on the transposed
        // tenor d) sings its own intonation and mediant.
        intonatio: (diff.intonation ?? tone.intonation).map((m) => toPitch(m, scala)),
        mediatio: (diff.mediant ?? tone.mediant).map((m) => toPitch(m, scala)),
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
  ModusCadentiae,
  ModusGenus,
  GamutOptions,
  GuidonianEntry,
  GuidonianVariant,
};
