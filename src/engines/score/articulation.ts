// ---------------------------------------------------------------------------
// engines/score/articulation — note-level articulation profiles
// ---------------------------------------------------------------------------
// The pondus ("weight") tables. Each GABC performance mark — episema, quilisma,
// liquescent, strophicus, oriscus, ictus — carries a weight delta and a
// duration delta that the parser folds into a note's rhythmicShape (see the
// tanh compressor in parse.ts). The signs encode the semiological reading of
// the mark [biblio: cardine-semiology], and the durational values the Solesmes
// rhythmic tradition [biblio: desrocquettes-values, liber-usualis]: POSITIVE
// lengthens/stresses, NEGATIVE lightens/shortens. So an episema lengthens
// (+0.9 duration), a liquescent is a passing lightening (−0.4 weight), an
// uppercase-syllable note is de-stressed (−0.7).
//
// Four profiles select how strongly those rules speak, from a semiological
// restraint to full Solesmes-rule fidelity:
//   restrained — Cardine's semiological reading: rules present but soft-spoken.
//   balanced   — the default; BASE_WEIGHTS unaltered.
//   expressive — rules pushed (stronger ictus and accent, wider contour).
//   strict     — maximal Solesmes-rule fidelity (episema to a full double, a
//                sharper quilisma). The differences live in the per-profile
//                weight overrides below.
// The curve params (weightBase/Gain/Saturation) shape the tanh knee, not the
// marks; they are documented at the profile block. These magnitudes are tuned
// by ear, not taken from a table — the sources fix the direction, not the value.

import type {
  ArticulationProfile,
  ArticulationType,
  ArticulationWeights,
} from "./types.js";

export interface BuildArticulationOptions {
  overrides?: Partial<ArticulationProfile>;
}

const BASE_WEIGHTS: ArticulationWeights = {
  // Ictus — the rhythmic footfall (parse.ts's three-rule assignment): a stress
  // and a slight broadening.
  ictusWeight: 0.9,
  ictusDuration: 0.35,
  // Episema — the horizontal episema is the Solesmes lengthening mark; the note
  // is broadened but only lightly stressed. Double episema broadens further.
  episemaWeight: 0.6,
  episemaDuration: 0.9,
  episemaDoubleDuration: 0.6,
  // Strophicus — repeated notes (distropha/tristropha); a soft repercussion
  // that broadens; the triple adds duration.
  strophicusWeight: 0.4,
  strophicusDuration: 0.8,
  strophicusTripleDuration: 0.6,
  // Quilisma — the mark itself is a light, tremulous passing note (−0.3), but
  // the rule is that the *preceding* note receives the stress and lengthening.
  // Hence prev is positive and the quilisma negative — not a sign error.
  quilismaPrevWeight: 0.6,
  quilismaWeight: -0.3,
  // Liquescent — a diminished, half-voiced note easing a consonant cluster:
  // lighter and shorter.
  liquescentWeight: -0.4,
  liquescentDuration: -0.35,
  // Initio — the first note of a group/melisma gets a gentle onset stress.
  initioWeight: 0.6,
  initioMelismaWeight: 0.3,
  initioMelismaDuration: 0.1,
  // Accent — a tonic word-accent lands a stress.
  accentWeight: 0.4,
  // Uppercase — an emphasized-capital syllable in GABC is conventionally the
  // quiet incipit letter of a chant, so it is de-stressed and slightly quickened.
  uppercaseWeight: -0.7,
  uppercaseDuration: -0.2,
  // Repercussion (pressus) — like the quilisma, the weight falls on the note
  // *before* the repercussed unison; the oriscus element itself is light.
  repercussionPrevWeight: 0.5,
  repercussionPrevDuration: 0.4,
  repercussionOriscusWeight: -0.5,
  // Oriscus — a soft, light note taken slightly faster (accelerando); its
  // rhythmic support sits on the preceding note.
  oriscusWeight: -0.3,
  oriscusDuration: -0.15,
  oriscusPrevWeight: 0.3,
  // Break (a neume-internal division `!`/`/`) marks a fresh onset → a stress;
  // dash (a bare context, e.g. an unaccented syllable) lightens and quickens.
  breakWeight: 0.6,
  dashWeight: -0.8,
  dashDuration: -0.2,
};

// Curve params (same fields on every profile below). They shape how the summed
// weight becomes a velocity, not what each mark contributes:
//   weightBase       — the velocity a note centres on; the tanh term swings ±gain
//                      around it, so output sits roughly in [base−gain, base+gain].
//   weightGain       — how loudly the rules speak: scales the tanh output (also
//                      multiplied by ruleGain). Rises restrained→expressive as rules
//                      gain authority (2.3 → 3 → 3.5), strict slightly under expressive.
//   weightSaturation — the tanh knee divisor: larger = later compression, so louder
//                      peaks survive; expressive lowers it (2.8) for a sharper dynamic.
//   durationBase/Gain/Min/Max — the same shape applied to duration deltas, clamped.
//   ruleGain         — global authority of the mark rules vs. positional shaping.
//   contourScale     — how much melodic contour (rise/fall) colours velocity.
//   neumeArch/durArch— the within-neume rise-and-fall (see phrasing.ts's arch).
//   ictusBoost       — a final multiplier on ictus notes.
// All tuned by ear; the ordering across profiles is the doctrine, the values are not.
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

