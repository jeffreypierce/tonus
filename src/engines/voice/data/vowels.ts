// ---------------------------------------------------------------------------
// engines/voice/data/vowels — the vowel plane and the canonical 5×15 base tables
// ---------------------------------------------------------------------------
// Three base voices (adult male, adult female, boy treble), each a 5-vowel ×
// 5-formant table of {freqHz, q, gain}. Values are authored formant targets
// after Sundberg, The Science of the Singing Voice, cross-checked against the
// Peterson–Barney corner-vowel measurements. Gains are linear (authored here
// from dB so the machine contract stays {freqHz, q, gain} end to end).

import type { Vowel, Formant, Locus } from "../types.js";

export const VOWELS: readonly Vowel[] = ["a", "e", "i", "o", "u"];

/**
 * Vowel → (u,v) plane coordinate. DIAMOND layout: a at the centre (0.5,0.5),
 * the other four at the edge-midpoints. The reader (formant.ts) triangulates
 * the diamond into four triangles fanning from a and blends barycentrically, so
 * every cardinal vowel round-trips to its own table and midpoints are real
 * mouth shapes (locus interpolation, not per-formant lerps).
 */
export const LOCI: Record<Vowel, Locus> = {
  a: { u: 0.5, v: 0.5 },
  e: { u: 0.5, v: 1.0 },
  i: { u: 1.0, v: 0.5 },
  o: { u: 0.0, v: 0.5 },
  u: { u: 0.5, v: 0.0 },
};

/** A full base voice: five vowels, each five formants. */
export type VowelTable = Record<Vowel, Formant[]>;

// dB → linear, applied once at authoring so tables carry machine gains.
const g = (db: number): number => Math.pow(10, db / 20);

// VIR — adult male chant voice (tract ~17.5 cm).
export const VIR: VowelTable = {
  a: [
    { freqHz: 680, q: 9.7, gain: g(0) },
    { freqHz: 1180, q: 13.1, gain: g(-6) },
    { freqHz: 2400, q: 20.0, gain: g(-14) },
    { freqHz: 2850, q: 19.0, gain: g(-22) },
    { freqHz: 3450, q: 19.2, gain: g(-36) },
  ],
  e: [
    { freqHz: 420, q: 7.0, gain: g(0) },
    { freqHz: 1950, q: 21.7, gain: g(-10) },
    { freqHz: 2650, q: 22.1, gain: g(-16) },
    { freqHz: 3000, q: 20.0, gain: g(-24) },
    { freqHz: 3500, q: 19.4, gain: g(-38) },
  ],
  i: [
    { freqHz: 290, q: 5.8, gain: g(0) },
    { freqHz: 2200, q: 24.4, gain: g(-22) },
    { freqHz: 2800, q: 25.5, gain: g(-20) },
    { freqHz: 3300, q: 22.0, gain: g(-30) },
    { freqHz: 3750, q: 20.8, gain: g(-42) },
  ],
  o: [
    { freqHz: 450, q: 7.5, gain: g(0) },
    { freqHz: 850, q: 10.6, gain: g(-9) },
    { freqHz: 2450, q: 20.4, gain: g(-22) },
    { freqHz: 2850, q: 19.0, gain: g(-28) },
    { freqHz: 3400, q: 18.9, gain: g(-40) },
  ],
  u: [
    { freqHz: 320, q: 6.4, gain: g(0) },
    { freqHz: 720, q: 10.3, gain: g(-18) },
    { freqHz: 2350, q: 19.6, gain: g(-30) },
    { freqHz: 2800, q: 18.7, gain: g(-34) },
    { freqHz: 3400, q: 18.9, gain: g(-44) },
  ],
};

// FEMINA — adult female chant voice (tract ~15 cm). Vowel space slightly more
// peripheral than vir, not merely scaled down.
export const FEMINA: VowelTable = {
  a: [
    { freqHz: 820, q: 10.3, gain: g(0) },
    { freqHz: 1350, q: 13.5, gain: g(-5) },
    { freqHz: 2800, q: 21.5, gain: g(-14) },
    { freqHz: 3300, q: 20.6, gain: g(-22) },
    { freqHz: 4100, q: 20.5, gain: g(-36) },
  ],
  e: [
    { freqHz: 480, q: 6.9, gain: g(0) },
    { freqHz: 2300, q: 23.0, gain: g(-9) },
    { freqHz: 3050, q: 23.5, gain: g(-16) },
    { freqHz: 3500, q: 21.9, gain: g(-24) },
    { freqHz: 4150, q: 20.8, gain: g(-38) },
  ],
  i: [
    { freqHz: 330, q: 5.5, gain: g(0) },
    { freqHz: 2600, q: 26.0, gain: g(-20) },
    { freqHz: 3250, q: 27.1, gain: g(-18) },
    { freqHz: 3850, q: 24.1, gain: g(-30) },
    { freqHz: 4400, q: 22.0, gain: g(-42) },
  ],
  o: [
    { freqHz: 520, q: 7.4, gain: g(0) },
    { freqHz: 950, q: 10.6, gain: g(-8) },
    { freqHz: 2850, q: 21.9, gain: g(-22) },
    { freqHz: 3300, q: 20.6, gain: g(-28) },
    { freqHz: 4000, q: 20.0, gain: g(-40) },
  ],
  u: [
    { freqHz: 380, q: 6.3, gain: g(0) },
    { freqHz: 820, q: 10.3, gain: g(-16) },
    { freqHz: 2750, q: 21.2, gain: g(-30) },
    { freqHz: 3250, q: 20.3, gain: g(-34) },
    { freqHz: 4000, q: 20.0, gain: g(-44) },
  ],
};

// PUER — pre-change chorister (tract ~13 cm). Less peripheral vowel space,
// slightly wider bandwidths → blended tone.
export const PUER: VowelTable = {
  a: [
    { freqHz: 900, q: 10.0, gain: g(0) },
    { freqHz: 1500, q: 13.6, gain: g(-7) },
    { freqHz: 3100, q: 22.1, gain: g(-16) },
    { freqHz: 3700, q: 21.8, gain: g(-24) },
    { freqHz: 4500, q: 20.5, gain: g(-38) },
  ],
  e: [
    { freqHz: 550, q: 6.9, gain: g(0) },
    { freqHz: 2500, q: 22.7, gain: g(-11) },
    { freqHz: 3350, q: 23.9, gain: g(-18) },
    { freqHz: 3850, q: 22.6, gain: g(-26) },
    { freqHz: 4550, q: 20.7, gain: g(-40) },
  ],
  i: [
    { freqHz: 400, q: 5.7, gain: g(0) },
    { freqHz: 2850, q: 25.9, gain: g(-22) },
    { freqHz: 3550, q: 27.3, gain: g(-20) },
    { freqHz: 4200, q: 24.7, gain: g(-32) },
    { freqHz: 4800, q: 21.8, gain: g(-44) },
  ],
  o: [
    { freqHz: 600, q: 7.5, gain: g(0) },
    { freqHz: 1100, q: 11.0, gain: g(-10) },
    { freqHz: 3150, q: 22.5, gain: g(-24) },
    { freqHz: 3650, q: 21.5, gain: g(-30) },
    { freqHz: 4400, q: 20.0, gain: g(-42) },
  ],
  u: [
    { freqHz: 440, q: 6.3, gain: g(0) },
    { freqHz: 950, q: 10.6, gain: g(-18) },
    { freqHz: 3050, q: 21.8, gain: g(-32) },
    { freqHz: 3600, q: 21.2, gain: g(-36) },
    { freqHz: 4400, q: 20.0, gain: g(-46) },
  ],
};
