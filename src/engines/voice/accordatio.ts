// ---------------------------------------------------------------------------
// engines/voice/accordatio — pull formant centres toward a tuning lattice
// ---------------------------------------------------------------------------
// Formants tuned to the temperament, on a sliding scale. Each formant centre is
// drawn toward the nearest frequency in a lattice, weighted by vis (0 = phonetic
// truth, 1 = fully lattice-locked). The lattice can be f0's harmonics (the
// classical soprano strategy) or a temperament's own pitch lattice — Pythagorean
// fifths, just thirds. Interop without dependency: `ad` is a plain Hz array or
// an (hz)=>hz snapping function, so tonus.temperamentum can PRODUCE the lattice
// and vox-humana CONSUMES numbers, neither importing the other.

import type { Formant } from "./types.js";

/** A tuning lattice: sorted Hz values, or a function that snaps any Hz. */
export type Lattice = number[] | ((hz: number) => number);

export interface AccordatioOpts {
  ad: Lattice;
  vis?: number; // 0 phonetic … 1 lattice-locked (default 1)
}

function nearest(hz: number, ad: Lattice): number {
  if (typeof ad === "function") return ad(hz);
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
export function accord(formants: Formant[], opts: AccordatioOpts): Formant[] {
  const ad = opts?.ad;
  if (typeof ad !== "function" && !Array.isArray(ad))
    throw new Error(
      "accordatio needs { ad } — an array of target Hz or an (hz) => hz function. " +
        "Build one from a temperament: temper.gamut({ span }).map((p) => p.hz)",
    );
  if (Array.isArray(ad) && ad.some((hz) => !Number.isFinite(hz)))
    throw new Error("accordatio lattice contains a non-finite Hz value");
  if (opts.vis != null && !Number.isFinite(opts.vis))
    throw new Error(`accordatio: vis must be a finite 0..1 weight, got ${String(opts.vis)}`);
  const vis = Math.max(0, Math.min(1, opts.vis ?? 1));
  if (vis === 0) return formants;
  return formants.map((f) => {
    const target = nearest(f.freqHz, opts.ad);
    return { freqHz: f.freqHz + (target - f.freqHz) * vis, q: f.q, gain: f.gain };
  });
}
