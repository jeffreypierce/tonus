// ---------------------------------------------------------------------------
// engines/voice/data/liquescentia — coda targets for the liquescent melt
// ---------------------------------------------------------------------------
// A liquescent note is a vowel melting into its nasal/lateral/glide coda — what
// a cephalicus IS. The coda has a characteristic formant target the vowel bends
// toward as the note closes. These targets are INVENTED — proposed articulatory
// approximations, not measured. They are offsets applied to the vowel's own
// formants, so the melt is relative to whatever vowel precedes the coda.

import type { Formant } from "../types.js";

/** The liquescent codas tonus flags on neumes. */
export type Coda = "m" | "n" | "l" | "j" | "w";

/** A per-formant multiplicative bend toward the coda's articulation. */
interface CodaBend {
  freqMul: number[]; // per-formant frequency scaling (F1..F5)
  gainMul: number[]; // per-formant gain scaling (nasals damp, glides shift)
}

// Invented — articulatory intuition, not measurement:
//   m — bilabial nasal: lower F1/F2, added nasal damping (low gain on F2+).
//   n — alveolar nasal: lower F1, F2 held/raised slightly, nasal damping.
//   l — alveolar lateral: F1 low, F3 lowered (the lateral's dark resonance).
//   j — palatal glide (toward [i]): F2 raised strongly, F1 lowered.
//   w — labiovelar glide (toward [u]): F2 lowered strongly, F1 lowered.
export const CODA_BEND: Record<Coda, CodaBend> = {
  m: { freqMul: [0.85, 0.8, 1.0, 1.0, 1.0], gainMul: [1.0, 0.6, 0.7, 0.7, 0.7] },
  n: { freqMul: [0.85, 1.05, 1.0, 1.0, 1.0], gainMul: [1.0, 0.7, 0.75, 0.75, 0.75] },
  l: { freqMul: [0.9, 0.95, 0.85, 1.0, 1.0], gainMul: [1.0, 0.9, 0.8, 1.0, 1.0] },
  j: { freqMul: [0.75, 1.35, 1.05, 1.0, 1.0], gainMul: [1.0, 1.0, 1.0, 1.0, 1.0] },
  w: { freqMul: [0.8, 0.6, 1.0, 1.0, 1.0], gainMul: [1.0, 1.0, 1.0, 1.0, 1.0] },
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
  return vowelFormants.map((f, i) => {
    const fm = 1 + (bend.freqMul[i]! - 1) * d;
    const gm = 1 + (bend.gainMul[i]! - 1) * d;
    return { freqHz: f.freqHz * fm, q: f.q, gain: f.gain * gm };
  });
}
