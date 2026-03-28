// ---------------------------------------------------------------------------
// engines/score/api — score builder and interpretation profiles
// ---------------------------------------------------------------------------
import { parseGABC } from "./parse.js";
import { buildIR } from "./ir.js";
import { buildRatios } from "../temper/scale.js";
import { buildArticulation } from "./articulation.js";
import { buildPhrasing, shapePhrasingForMode, applyPhrasing } from "./phrasing.js";
import { computeMeta } from "./meta.js";
import { toMidi } from "./emitters/midi.js";
import { toMusicXML } from "./emitters/musicxml.js";
import { toTable } from "./emitters/datatable.js";
import { computeMetrics } from "./emitters/metrics.js";
import type { Chant } from "../chant/types.js";
import type { Temper } from "../temper/api.js";
import type {
  ArticulationProfile,
  ArticulationType,
  PhrasingProfile,
  PhrasingType,
  ParseError,
  Phrase as IRPhrase,
} from "./types.js";
import type { MidiEmitOptions } from "./emitters/midi.js";
import type { TableEmitResult } from "./emitters/datatable.js";
import type { ChantMetrics } from "./emitters/metrics.js";

export type PondusStyle = "restrained" | "balanced" | "expressive" | "strict";
export type AccentusStyle = "recitative" | "lyrical" | "hymnic" | "solemn";

export interface Pondus {
  style: PondusStyle;
  profile: ArticulationProfile;
}

export interface Accentus {
  style: AccentusStyle;
  profile: PhrasingProfile;
}

export interface PondusOpts {
  style?: PondusStyle;
  overrides?: Partial<ArticulationProfile>;
}

export interface AccentusOpts {
  style?: AccentusStyle;
  overrides?: Partial<PhrasingProfile>;
}

export type PondusInput = PondusStyle | PondusOpts;
export type AccentusInput = AccentusStyle | AccentusOpts;

export interface MidiOpts {
  ppq?: number;
  bpm?: number;
  bendRange?: number;
  velocityRange?: [number, number];
}

export interface ScoreOpts {
  temper?: Temper;
  pondus?: Pondus;
  accentus?: Accentus;
}

export interface Score {
  chant: Chant;
  phrases: IRPhrase[];
  errors: ParseError[];
  midi(opts?: MidiOpts): Uint8Array;
  musicxml(): string;
  tabula(): TableEmitResult;
  summa(): ChantMetrics;
}

const PONDUS_TO_ARTICULATION: Record<PondusStyle, ArticulationType> = {
  restrained: "restrained",
  balanced: "balanced",
  expressive: "expressive",
  strict: "strict",
};

const ACCENTUS_TO_PHRASING: Record<AccentusStyle, PhrasingType> = {
  recitative: "recitative",
  lyrical: "lyrical",
  hymnic: "hymnic",
  solemn: "solemn",
};

export function buildPondus(input?: PondusInput): Pondus {
  const opts: PondusOpts = typeof input === "string" ? { style: input } : (input ?? {});
  const style = opts.style ?? "balanced";
  const artType = PONDUS_TO_ARTICULATION[style];
  const profile = buildArticulation(artType, { overrides: opts.overrides });
  return { style, profile };
}

export function buildAccentus(input?: AccentusInput): Accentus {
  const opts: AccentusOpts = typeof input === "string" ? { style: input } : (input ?? {});
  const style = opts.style ?? "lyrical";
  const phraseType = ACCENTUS_TO_PHRASING[style];
  const profile = buildPhrasing(phraseType, { overrides: opts.overrides });
  return { style, profile };
}

export function buildScore(chant: Chant, opts?: ScoreOpts): Score {
  const parsed = parseGABC(chant.gabc, {
    interpretation: {
      articulation: opts?.pondus
        ? PONDUS_TO_ARTICULATION[opts.pondus.style]
        : "balanced",
    },
  });
  const modeNum = chant.mode ? parseInt(chant.mode) || undefined : undefined;
  const scale = buildRatios({
    mode: opts?.temper?.mode === "auto" ? (modeNum ?? 1) : (opts?.temper?.mode ?? modeNum ?? 1),
    a4: opts?.temper?.a4 ?? 440,
    transpose: opts?.temper?.transpose ?? 0,
  });
  const ir = buildIR(parsed, chant, scale);
  const meta = computeMeta(ir, { mode: modeNum });

  return {
    chant,
    phrases: ir.phrases,
    errors: ir.errors,

    midi(midiOpts?: MidiOpts): Uint8Array {
      const emitted = toMidi(ir, {
        mode: meta.mode ?? undefined,
        tempoBpm: midiOpts?.bpm,
        ppq: midiOpts?.ppq,
        format: "file",
      });
      return emitted.bytes ?? new Uint8Array(0);
    },

    musicxml(): string {
      const result = toMusicXML(ir, {
        mode: meta.mode ?? undefined,
      });
      return result.xml;
    },

    tabula(): TableEmitResult {
      return toTable(ir, {
        mode: meta.mode ?? undefined,
        a4Hz: opts?.temper?.a4,
        transpose: opts?.temper?.transpose,
      });
    },

    summa(): ChantMetrics {
      return computeMetrics(ir, {
        mode: meta.mode ?? undefined,
      });
    },
  };
}

export type { TableEmitResult, ChantMetrics, ParseError };
