// ---------------------------------------------------------------------------
// engines/voice/data/liquescentia — coda targets for the liquescent melt
// ---------------------------------------------------------------------------
// A liquescent note is a vowel melting into its nasal/lateral/glide coda — what
// a cephalicus IS. The coda has a characteristic formant target the vowel bends
// toward as the note closes. The bend directions follow the measured consonant
// acoustics in Stevens, Acoustic Phonetics [biblio: stevens-acoustic-phonetics]:
// nasal murmur (low F1, damped/shifted F2), the lateral's lowered F3, the glides'
// F2 toward [i]/[u]. The values are multiplicative offsets on the vowel's OWN
// formants (so the melt is relative to the preceding vowel) and are calibrated to
// a partial transition toward the coda, not its full steady state.

import type { Formant } from "../types.js";

/** The liquescent codas tonus flags on neumes. */
export type Coda = "m" | "n" | "l" | "j" | "w";

/** A per-formant multiplicative bend toward the coda's articulation. */
interface CodaBend {
  freqMul: number[]; // per-formant frequency scaling (F1..F5)
  gainMul: number[]; // per-formant gain scaling (nasals damp, glides shift)
}

// After Stevens' consonant formants (Ch. 6 nasals/laterals, Ch. 9 glides); the
// bends carry the vowel partway toward each coda's measured resonances:
//   m — bilabial nasal: low murmur F1 (~250 Hz), strong F2 antiresonance/damping.
//   n — alveolar nasal: low F1, F2 RAISED toward ~1500 Hz, nasal damping.
//   l — alveolar lateral: F1 low, F3 lowered ~2500 Hz (the lateral's dark
//       resonance), moderate damping.
//   j — palatal glide (toward [i]): F2 raised strongly (~2300 Hz), F1 lowered.
//   w — labiovelar glide (toward [u]): F2 lowered strongly (~750 Hz), F1 lowered.
export const CODA_BEND: Record<Coda, CodaBend> = {
  m: { freqMul: [0.72, 0.78, 1.0, 1.0, 1.0], gainMul: [1.0, 0.55, 0.65, 0.65, 0.65] },
  n: { freqMul: [0.72, 1.18, 1.0, 1.0, 1.0], gainMul: [1.0, 0.7, 0.7, 0.7, 0.7] },
  l: { freqMul: [0.85, 0.98, 0.88, 1.0, 1.0], gainMul: [1.0, 0.9, 0.82, 1.0, 1.0] },
  j: { freqMul: [0.7, 1.55, 1.08, 1.0, 1.0], gainMul: [1.0, 1.0, 1.0, 1.0, 1.0] },
  w: { freqMul: [0.75, 0.55, 1.0, 1.0, 1.0], gainMul: [1.0, 1.0, 1.0, 1.0, 1.0] },
};

/**
 * The formant transition target for a vowel melting into `coda`, `depth` of the
 * way to the coda (0 = the plain vowel, 1 = the full coda articulation). Built
 * on the vowel's own formants — the primitive is iter, specialized off-plane.
 */
export function liquescentTarget(
  vowelFormants: Formant[],
  coda: Coda,
  depth: number,
): Formant[] {
  const bend = CODA_BEND[coda];
  if (!bend) {
    throw new Error(`liquescentia: unknown coda "${coda}" — try m, n, l, j, w`);
  }
  const d = Math.max(0, Math.min(1, depth));
  const bent = vowelFormants.map((f, i) => {
    const fm = 1 + (bend.freqMul[i]! - 1) * d;
    const gm = 1 + (bend.gainMul[i]! - 1) * d;
    return { freqHz: f.freqHz * fm, q: f.q, gain: f.gain * gm };
  });
  // The bends are calibrated against mid vowels; on a front vowel the palatal
  // glide's F2 raise can overshoot F3 (in [j] the two converge — they never
  // cross). Enforce the ascending-formant contract: cap each band just under
  // the one above, sweeping downward so a capped band cascades if needed.
  for (let i = bent.length - 2; i >= 0; i--) {
    const ceiling = bent[i + 1]!.freqHz * 0.98;
    if (bent[i]!.freqHz > ceiling) bent[i]!.freqHz = ceiling;
  }
  return bent;
}
