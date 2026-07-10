// ---------------------------------------------------------------------------
// engines/voice/accordatio — pull formant centres toward a temperament
// ---------------------------------------------------------------------------
// Formants tuned to the temperament, on a sliding scale: each formant centre
// is drawn toward the tuning's nearest pitch, weighted by vis (0 = phonetic
// truth, 1 = fully tuned), the way a soprano tunes a formant onto a harmonic
// to carry. The public shape is formantes(vowel, temper, vis) — no lattice or
// options plumbing on the surface. Interop without dependency: the
// temperament is duck-typed (TuningLike: anything with gamut()), so this
// engine imports nothing from temper.

import type { Formant } from "./types.js";

/**
 * Anything with a `gamut()` — a Temperamentum, duck-typed so this engine
 * imports nothing from temper (interop without dependency). Its gamut is
 * unfolded across the formant octaves to make the internal snap targets.
 * This is the WHOLE public shape of accordatio: formantes(vowel, temper, vis)
 * — the lattice/options plumbing here is internal.
 */
export interface TuningLike {
  gamut(opts?: { span?: [number, number] }): Array<{ hz: number }>;
}

/** Formants live ~250–4200 Hz; unfold the tuning across that range (MIDI 36–120). */
const FORMANT_SPAN: [number, number] = [36, 120];

function toLattice(ad: TuningLike): number[] | null {
  if (ad && typeof ad.gamut === "function") {
    return ad.gamut({ span: FORMANT_SPAN }).map((p) => p.hz);
  }
  return null;
}

function nearest(hz: number, ad: number[]): number {
  if (ad.length === 0) return hz;
  let best = ad[0]!;
  let bestDist = Math.abs(hz - best);
  for (let i = 1; i < ad.length; i++) {
    const d = Math.abs(hz - ad[i]!);
    if (d < bestDist) {
      best = ad[i]!;
      bestDist = d;
    }
  }
  return best;
}

/**
 * Pull each formant's centre toward the nearest lattice frequency by `vis`.
 * vis 0 returns the formants unchanged; vis 1 snaps every centre to the lattice.
 * Q and gain are untouched — accordatio moves the resonance, not its shape.
 */
export function accord(
  formants: Formant[],
  ad: TuningLike,
  visIn?: number,
): Formant[] {
  const lattice = toLattice(ad);
  if (lattice === null)
    throw new Error(
      "formantes: the tuning must be a Temperamentum (from tonus.temperamentum)",
    );
  if (lattice.some((hz) => !Number.isFinite(hz)))
    throw new Error("formantes: the tuning produced a non-finite Hz value");
  if (visIn != null && !Number.isFinite(visIn))
    throw new Error(`formantes: vis must be a finite 0..1 weight, got ${String(visIn)}`);
  const vis = Math.max(0, Math.min(1, visIn ?? 1));
  if (vis === 0) return formants;
  return formants.map((f) => {
    const target = nearest(f.freqHz, lattice);
    return { freqHz: f.freqHz + (target - f.freqHz) * vis, q: f.q, gain: f.gain };
  });
}
