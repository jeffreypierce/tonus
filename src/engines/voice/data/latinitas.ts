// ---------------------------------------------------------------------------
// engines/voice/data/latinitas — regional Latin vowel loci (romana/germanica/gallica)
// ---------------------------------------------------------------------------
// The same chant voweled as Solesmes (romana), Regensburg (germanica), or
// pre-reform France (gallica) would sing it. Each region shifts the vowel's
// plane locus — how open, how fronted a vowel sits. Offsets after Copeman,
// Singing in Latin; magnitudes small (regional colour, not different vowels).
// romana is the identity (the base loci are already Solesmes practice).

import type { Vowel, Latinitas, Locus } from "../types.js";

/** A per-vowel (u,v) offset added to the base locus for a region. */
type LocusShift = Record<Vowel, Locus>;

const ZERO: LocusShift = {
  a: { u: 0, v: 0 },
  e: { u: 0, v: 0 },
  i: { u: 0, v: 0 },
  o: { u: 0, v: 0 },
  u: { u: 0, v: 0 },
};

export const LATINITAS_SHIFT: Record<Latinitas, LocusShift> = {
  // Solesmes / Italianate — the reference.
  romana: ZERO,
  // Germanic — brighter, more fronted e and i; the darker, rounder u of the
  // German liturgical tradition.
  germanica: {
    a: { u: 0.0, v: 0.02 },
    e: { u: 0.04, v: 0.03 },
    i: { u: 0.0, v: 0.02 },
    o: { u: -0.02, v: -0.02 },
    u: { u: -0.04, v: -0.03 },
  },
  // Gallican — the pre-reform French colour: fronted, slightly closer vowels,
  // the characteristic French rounding on o and u.
  gallica: {
    a: { u: 0.02, v: 0.0 },
    e: { u: 0.03, v: 0.0 },
    i: { u: -0.02, v: 0.03 },
    o: { u: 0.03, v: -0.02 },
    u: { u: 0.05, v: -0.02 },
  },
};

/** Apply a region's shift to a base locus for a given cardinal vowel. */
export function shiftLocus(base: Locus, vowel: Vowel, region: Latinitas): Locus {
  const s = LATINITAS_SHIFT[region][vowel];
  return { u: base.u + s.u, v: base.v + s.v };
}
