// ---------------------------------------------------------------------------
// engines/score/articulation — note-level articulation profiles
// ---------------------------------------------------------------------------

import type {
  ArticulationProfile,
  ArticulationType,
  ArticulationWeights,
} from "./types.js";

export interface BuildArticulationOptions {
  overrides?: Partial<ArticulationProfile>;
}

const BASE_WEIGHTS: ArticulationWeights = {
  ictusWeight: 0.9,
  ictusDuration: 0.35,
  episemaWeight: 0.6,
  episemaDuration: 0.9,
  episemaDoubleDuration: 0.6,
  strophicusWeight: 0.4,
  strophicusDuration: 0.8,
  strophicusTripleDuration: 0.6,
  quilismaPrevWeight: 0.6,
  quilismaWeight: -0.3,
  liquescentWeight: -0.4,
  liquescentDuration: -0.35,
  initioWeight: 0.6,
  initioMelismaWeight: 0.3,
  initioMelismaDuration: 0.1,
  accentWeight: 0.4,
  uppercaseWeight: -0.7,
  uppercaseDuration: -0.2,
  repercussionPrevWeight: 0.5,
  repercussionPrevDuration: 0.4,
  repercussionOriscusWeight: -0.5,
  oriscusWeight: -0.3,       // soft, light note
  oriscusDuration: -0.15,    // taken slightly faster (accelerando)
  oriscusPrevWeight: 0.3,    // rhythmic support on the preceding note
  breakWeight: 0.6,
  dashWeight: -0.8,
  dashDuration: -0.2,
};

const ARTICULATION_PROFILES: Record<ArticulationType, ArticulationProfile> = {
  restrained: {
    weights: { ...BASE_WEIGHTS, accentWeight: 0.25, ictusDuration: 0.2 },
    weightBase: 5,
    weightGain: 2.3,
    weightSaturation: 3,
    durationBase: 1,
    durationGain: 0.45,
    durationMin: 0.25,
    durationMax: 3.6,
    ruleGain: 0.8,
    contourScale: 0.12,
    neumeArch: 0.3,
    durArch: 0.05,
    ictusBoost: 1.04,
  },
  balanced: {
    weights: { ...BASE_WEIGHTS },
    weightBase: 5,
    weightGain: 3,
    weightSaturation: 3,
    durationBase: 1,
    durationGain: 0.6,
    durationMin: 0.2,
    durationMax: 4,
    ruleGain: 1,
    contourScale: 0.2,
    neumeArch: 0.5,
    durArch: 0.08,
    ictusBoost: 1.08,
  },
  expressive: {
    weights: { ...BASE_WEIGHTS, ictusWeight: 1.1, accentWeight: 0.55 },
    weightBase: 5,
    weightGain: 3.5,
    weightSaturation: 2.8,
    durationBase: 1,
    durationGain: 0.72,
    durationMin: 0.2,
    durationMax: 4,
    ruleGain: 1.2,
    contourScale: 0.28,
    neumeArch: 0.62,
    durArch: 0.1,
    ictusBoost: 1.12,
  },
  strict: {
    weights: {
      ...BASE_WEIGHTS,
      episemaDuration: 1.0,
      quilismaPrevWeight: 0.7,
      quilismaWeight: -0.4,
      liquescentDuration: -0.4,
    },
    weightBase: 5,
    weightGain: 3.2,
    weightSaturation: 3,
    durationBase: 1,
    durationGain: 0.65,
    durationMin: 0.2,
    durationMax: 4,
    ruleGain: 1.08,
    contourScale: 0.2,
    neumeArch: 0.56,
    durArch: 0.1,
    ictusBoost: 1.1,
  },
};

export function buildArticulation(
  type: ArticulationType = "balanced",
  options: BuildArticulationOptions = {},
): ArticulationProfile {
  const base = ARTICULATION_PROFILES[type] ?? ARTICULATION_PROFILES.balanced;
  const overrides = options.overrides ?? {};
  const baseWeights = base.weights;
  const overrideWeights = overrides.weights ?? {};

  return {
    ...base,
    ...overrides,
    weights: {
      ...baseWeights,
      ...overrideWeights,
    },
  };
}

