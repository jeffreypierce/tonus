// ---------------------------------------------------------------------------
// engines/score/api — score builder and interpretation profiles
// ---------------------------------------------------------------------------
import { parseGABC } from "./parse.js";
import { buildIR } from "./ir.js";
import { buildRatios } from "../temper/scale.js";
import { buildArticulation } from "./articulation.js";
import { buildPhrasing } from "./phrasing.js";
import { computeMeta } from "./meta.js";
import { computeImprint, type Imprint } from "../imprint.js";
import { computeProsody, type Prosody } from "./prosody.js";
import { computeTabula, type ChantTabulaRow } from "./tabula.js";
import type { Chant } from "../chant/types.js";
import type { Temperamentum } from "../temper/api.js";
import type {
  ArticulationProfile,
  ArticulationType,
  PhrasingProfile,
  PhrasingType,
  ParseError,
  Phrase as IRPhrase,
} from "./types.js";

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

export interface ScoreOpts {
  temperamentum?: Temperamentum;
  pondus?: Pondus;
  accentus?: Accentus;
}

export interface Score {
  chant: Chant;
  phrases: IRPhrase[];
  errors: ParseError[];
  tabula: ChantTabulaRow[];
  prosody: Prosody;
  imprint: Imprint;
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
    mode: opts?.temperamentum?.mode === "auto" ? (modeNum ?? 1) : (opts?.temperamentum?.mode ?? modeNum ?? 1),
    a4: opts?.temperamentum?.a4 ?? 440,
    transpose: opts?.temperamentum?.transpose ?? 0,
  });
  const ir = buildIR(parsed, chant, scale);
  const meta = computeMeta(ir, { mode: modeNum });

  return {
    chant,
    phrases: ir.phrases,
    errors: ir.errors,
    tabula: computeTabula(ir, {
      mode: meta.mode ?? undefined,
      a4Hz: opts?.temperamentum?.a4,
      transpose: opts?.temperamentum?.transpose,
    }),
    prosody: computeProsody(ir.phrases),
    imprint: computeImprint(ir.phrases, scale),
  };
}

export type { ParseError };
