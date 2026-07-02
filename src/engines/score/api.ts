// ---------------------------------------------------------------------------
// engines/score/api — score builder and interpretation profiles
// ---------------------------------------------------------------------------
import { parseGABC } from "./parse.js";
import { buildIR } from "./ir.js";
import { buildRatios } from "../temper/scale.js";
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
  pondus?: PondusInput;
  accentus?: AccentusInput;
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

function resolvePondus(input?: PondusInput): PondusOpts {
  return typeof input === "string" ? { style: input } : (input ?? {});
}

function resolveAccentus(input?: AccentusInput): AccentusOpts {
  return typeof input === "string" ? { style: input } : (input ?? {});
}

/**
 * Score builder (`tonus.notatio`). Parses a chant's GABC into a musical
 * IR — phrases, syllables, notes with tuned pitches, arsis/thesis
 * rhythm, prosody, imprint, and a tabula. Options: a temperamentum
 * (tuning), a pondus (articulation weight, style name or opts), and an
 * accentus (phrasing, style name or opts).
 * @throws Error on invalid Chant input or unparseable GABC.
 */
export function buildScore(chant: Chant, opts?: ScoreOpts): Score {
  const pondus = resolvePondus(opts?.pondus);
  const accentus = resolveAccentus(opts?.accentus);
  const parsed = parseGABC(chant.gabc, {
    interpretation: {
      articulation: PONDUS_TO_ARTICULATION[pondus.style ?? "balanced"],
      articulationOverrides: pondus.overrides,
    },
  });
  const modeNum = chant.mode ? parseInt(chant.mode) || undefined : undefined;
  const scale = buildRatios({
    mode: opts?.temperamentum?.mode === "auto" ? (modeNum ?? 1) : (opts?.temperamentum?.mode ?? modeNum ?? 1),
    a4: opts?.temperamentum?.a4 ?? 440,
    transpose: opts?.temperamentum?.transpose ?? 0,
    // Carry the temperamentum's fully resolved scale — otherwise custom
    // and non-pythagorean tunings would be silently rebuilt as default.
    steps: opts?.temperamentum?.cents,
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
      // Only pass phrasing when the caller asked for it, so the default
      // tabula shaping (mode-gated) is unchanged.
      interpretation: opts?.accentus
        ? {
            phrasing: ACCENTUS_TO_PHRASING[accentus.style ?? "lyrical"],
            phrasingOverrides: accentus.overrides,
          }
        : undefined,
    }),
    prosody: computeProsody(ir.phrases),
    imprint: computeImprint(ir.phrases, scale),
  };
}

export type { ParseError };
