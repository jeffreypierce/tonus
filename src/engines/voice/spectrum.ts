// ---------------------------------------------------------------------------
// engines/voice/spectrum — harmonic amplitudes through the formant envelope
// ---------------------------------------------------------------------------
// Source–filter: each harmonic n·f0 gets a glottal-source amplitude (a spectral
// tilt set by nisus and fatigatio) multiplied by the formant envelope at that
// frequency (a sum of resonant peaks, plus the cantoris singer's-formant
// cluster). Source law after Sundberg, The Science of the Singing Voice; the
// cantoris cluster after Sundberg's singer's-formant measurement (2.8–3.2 kHz).
// The fatigatio→extra-tilt coupling is invented — proposed, not measured.

import type { Formant, VoxParams } from "./types.js";

// ── Formant envelope ──

/**
 * Envelope magnitude at frequency f: sum of each formant's resonance (a simple
 * Lorentzian peak of width freq/q), scaled by its gain. This is the transfer
 * function the source is filtered through.
 */
function envelopeAt(formants: Formant[], f: number): number {
  let sum = 0;
  for (const band of formants) {
    const bw = band.freqHz / band.q; // -3 dB bandwidth
    const x = (f - band.freqHz) / (bw / 2);
    sum += band.gain / (1 + x * x); // Lorentzian: 1 at centre, falls off
  }
  return sum;
}

/**
 * The cantoris boost near 2.9 kHz — a broad Gaussian bump added to the
 * envelope, its height scaled by the cantoris slider and faded by fatigue (a
 * tired voice loses its ring). This is the "carries in a stone room" cluster.
 */
function cantorisBoost(p: VoxParams, f: number): number {
  const centre = 2900;
  const width = 700;
  const strength = p.cantoris * (1 - 0.5 * p.fatigatio);
  const x = (f - centre) / width;
  return strength * Math.exp(-x * x);
}

// ── Source tilt ──

/**
 * Glottal-source amplitude at harmonic n (n ≥ 1). A pressed voice (high nisus)
 * has a flatter source (stronger upper harmonics); a light voice rolls off
 * faster. Fatigue steepens the roll-off further. Expressed as amplitude ∝
 * n^(-tilt): tilt ~1.2 pressed … ~2.4 light, +0.6·fatigatio.
 */
function sourceAmp(n: number, p: VoxParams): number {
  const tilt = 2.4 - 1.2 * p.nisus + 0.6 * p.fatigatio;
  return Math.pow(n, -tilt);
}

// ── Public ──

/**
 * The amplitudes of the first `nHarmonics` harmonics of `f0`, voiced through
 * `formants` under the slider bank `p`. Deterministic; the input to additive
 * renderers and every spectral chart.
 */
export function spectrumOf(
  f0: number,
  formants: Formant[],
  p: VoxParams,
  nHarmonics: number,
): number[] {
  const out: number[] = [];
  for (let n = 1; n <= nHarmonics; n++) {
    const f = n * f0;
    const amp = sourceAmp(n, p) * (envelopeAt(formants, f) + cantorisBoost(p, f));
    out.push(amp);
  }
  return out;
}

/**
 * Brightness as an OUTPUT reading, never a knob: the spectral centroid (the
 * amplitude-weighted mean frequency) of the spectrum. Rises when nisus or
 * cantoris rise because the physics did. The y-axis of every spectral chart.
 */
export function claritasOf(
  f0: number,
  formants: Formant[],
  p: VoxParams,
  nHarmonics = 40,
): number {
  const amps = spectrumOf(f0, formants, p, nHarmonics);
  let num = 0;
  let den = 0;
  for (let i = 0; i < amps.length; i++) {
    const f = (i + 1) * f0;
    num += f * amps[i]!;
    den += amps[i]!;
  }
  return den === 0 ? 0 : num / den;
}
