// ---------------------------------------------------------------------------
// engines/score/articulation — note-level articulation profiles
// ---------------------------------------------------------------------------
// The pondus ("weight") tables. Each GABC performance mark — the episemata,
// the mora, quilisma, liquescent, strophicus, oriscus — carries a weight delta
// and a duration delta that the parser folds into a note's weight and duration
// (see the tanh compressor in parse.ts). The signs encode the semiological
// reading of the mark [biblio: cardine-semiology], and the durational values
// the Solesmes rhythmic tradition [biblio: desrocquettes-values,
// liber-usualis]: POSITIVE lengthens/stresses, NEGATIVE lightens/shortens. So
// a mora vocis lengthens (+0.9 duration), a liquescent is a passing
// lightening (−0.4 weight), a punctum inclinatum is de-stressed (−0.7).
//
// Three profiles anchor the pondus knob (knobs.ts) at 0, 0.5 and toward 1:
//   restrained — Cardine's semiological reading: rules present but soft-spoken.
//   balanced   — the reference; BASE_WEIGHTS unaltered.
//   expressive — rules pushed (stronger ictus and accent, wider contour).
// The differences live in the per-profile weight overrides below.
// The curve params (weightBase/Gain/Saturation) shape the tanh knee, not the
// marks; they are documented at the profile block. These magnitudes are tuned
// by ear, not taken from a table — the sources fix the direction, not the value.

import type {
  ArticulationOverrides,
  ArticulationProfile,
  ArticulationType,
  ArticulationWeights,
} from "./types.js";

export interface BuildArticulationOptions {
  overrides?: ArticulationOverrides;
}

const BASE_WEIGHTS: ArticulationWeights = {
  // The written episemata — the vertical (') and the horizontal (_) — a
  // stress and a slight broadening. These weigh the MARKS the source writes,
  // not the ictus the Liber's rules place (ictus.ts): a placed ictus is
  // lengthened only by `ictusBoost`.
  ictusWeight: 0.9,
  ictusDuration: 0.35,
  // Mora vocis — the dot (.), the Solesmes doubling of the note: broadened,
  // only lightly stressed; the double dot (..) broadens further. The keys say
  // "episema" for a historical reason and are kept so overrides stay valid;
  // the horizontal episema is weighed with the vertical, above.
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
  // Liquescent — a half-voiced note easing a diphthong or a consonant cluster.
  // It is LIGHTER, NOT SHORTER. The half-note seems "to lose half its force
  // rather than its duration", and the small type "does not affect their
  // duration nor their execution, except in that they must be sung lightly"
  // [biblio: liber-usualis, preface and Rules §10]. So the duration delta is 0.
  // A choir that clips liquescents, the common modern habit, does it through
  // an override and not in the default (ruled 2026-10-22: the LU is the rubric).
  liquescentWeight: -0.4,
  liquescentDuration: 0,
  // Punctum liquescens — a lone note carrying a liquescence. It is the
  // Antiphonale Monasticum's sign, and the LU has none. The AM fills that gap:
  // the syllable, "nedum valore suo partim privetur, aliquantulum protracte,
  // dulcius et quasi rotunde cantari debet". Far from losing value, it is drawn
  // out a little. It also takes the liquescent lightening ("dulcius").
  punctumLiquescensDuration: 0.15,
  // Initio — the first note of a group/melisma gets a gentle onset stress.
  initioWeight: 0.6,
  initioMelismaWeight: 0.3,
  initioMelismaDuration: 0.1,
  // Accent — a tonic word-accent lands a stress.
  accentWeight: 0.4,
  // Uppercase — an uppercase pitch letter is the punctum inclinatum, the
  // diamond of a descending run (climacus and its kin): de-stressed and
  // slightly quickened, a note of passage.
  uppercaseWeight: -0.7,
  uppercaseDuration: -0.2,
  // Repercussion (pressus) — like the quilisma, the weight falls on the note
  // *before* the repercussed unison. Where the repeat is an oriscus,
  // repercussionOriscusWeight takes some of that back from the note before:
  // an oriscus pair leans less than a pressus.
  repercussionPrevWeight: 0.5,
  repercussionPrevDuration: 0.4,
  repercussionOriscusWeight: -0.5,
  // Oriscus — a soft, light note taken slightly faster (accelerando); its
  // rhythmic support sits on the preceding note.
  oriscusWeight: -0.3,
  oriscusDuration: -0.15,
  oriscusPrevWeight: 0.3,
  // Break (a spacing separator inside a syllable, `/` `//` `/0` `/[n]`) marks
  // a fresh onset → a stress. The cut `!` and the fusion `@` part no figure
  // and take none. Dash (`-` before a pitch, the initio debilis, the weak
  // first note of a neume) lightens and quickens.
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
//                      gain authority (2.3 → 3 → 3.5).
//   weightSaturation — the tanh knee divisor: larger = later compression, so louder
//                      peaks survive; expressive lowers it (2.8) for a sharper dynamic.
//   durationBase/Gain/Min/Max — the same shape applied to duration deltas, clamped.
//   ruleGain         — global authority of the mark rules vs. positional shaping.
//   contourScale     — how much melodic contour (rise/fall) colours velocity.
//   neumeArch/durArch— the rise-and-fall across a syllable's notes, in weight
//                      and in duration (parse.ts's finalization pass).
//   ictusBoost       — a final multiplier on the duration of ictic notes.
// All tuned by ear; the ordering across profiles is the doctrine, the values are not.
export const ARTICULATION_PROFILES: Record<ArticulationType, ArticulationProfile> = {
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

