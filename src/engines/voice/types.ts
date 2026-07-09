// ---------------------------------------------------------------------------
// engines/voice/types — the slider bank and the machine-output shapes
// ---------------------------------------------------------------------------

/** The five cardinal vowels, at the corners/edges of the vowel plane. */
export type Vowel = "a" | "e" | "i" | "o" | "u";

/** Latin pronunciation region — selects the vowel-locus table. */
export type Latinitas = "romana" | "germanica" | "gallica";

/**
 * The slider bank (Layer 1). Orthogonal continuous axes — each is a real cause,
 * none secretly modifies another. Where reality couples them (fatigue raises
 * breathiness), the coupling lives visibly in presets and helpers.
 */
export interface VoxParams {
  /**
   * Vocal-tract length scale — THE gender/size axis, continuous. Shifts every
   * formant frequency (smaller tract → higher). ~0.80 child, 1.00 alto/tenor,
   * ~1.25 deep bass. Physiology is a slider, not a dropdown.
   */
  tract: number;
  /** Age 0..1 (chorister → elder): jitter floor, formant drift, loosened Q. */
  aetas: number;
  /**
   * Tiredness 0..1 — the end-of-Matins voice, in numbers. Steepens spectral
   * tilt, loosens formant Q, fades cantoris. Survives Jeffrey's law because it
   * changes numbers we compute.
   */
  fatigatio: number;
  /**
   * Singer's-formant strength 0..1 — the ~2.8–3.2 kHz carrying cluster that
   * lets a schola fill a stone room without volume. A spectrum() term.
   */
  cantoris: number;
  /**
   * Vocal effort / weight 0..1 — light flute-like phonation … pressed voce
   * piena. Acts on the glottal-source spectral tilt BEFORE the formants, so it
   * is a real cause, orthogonal to age and fatigue. The honest root of
   * "brightness".
   */
  nisus: number;
  /** Latin pronunciation region. */
  latinitas: Latinitas;
}

/** One formant band — the machine contract every renderer reads. */
export interface Formant {
  freqHz: number;
  q: number;
  gain: number; // linear (0..1-ish), not dB
}

/** A point on the vowel plane. Corner vowels map to fixed (u,v). */
export interface Locus {
  u: number;
  v: number;
}
