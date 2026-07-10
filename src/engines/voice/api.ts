// ---------------------------------------------------------------------------
// engines/voice/api — the Vox context builder (construct once, interrogate forever)
// ---------------------------------------------------------------------------
// buildVoice resolves preset + override into a slider bank, builds the 5×15 table
// once, and returns a Vox whose methods are closures over it. Mirrors the
// temperamentum pattern: no recomputation per call, no `this`, not a class.

import type { Vowel, Formant, Locus, VoxParams } from "./types.js";
import {
  PERSONAE,
  VETUS,
  DEFAULTS,
  type Persona,
  type PersonaName,
} from "./data/personae.js";
import { computeTable, formantsAt, locusOf } from "./formant.js";
import { spectrumOf, claritasOf } from "./spectrum.js";
import { shiftLocus } from "./data/latinitas.js";
import { liquescentTarget, type Coda } from "./data/liquescentia.js";
import { accord, type TuningLike } from "./accordatio.js";

export type VoxInput = PersonaName | "vetus" | Persona;

export interface Vox {
  /** The resolved slider bank. */
  params: VoxParams;
  /** The plane coordinate of a cardinal vowel (before latinitas shift). */
  locus(vowel: Vowel): Locus;
  /**
   * Five formants at a cardinal vowel or anywhere on the plane. Passing
   * accordatio opts pulls each formant centre toward a tuning lattice.
   */
  formantes(where: Vowel | Locus, ad?: TuningLike, vis?: number): Formant[];
  /** Five formants at the point t of the way along the path a→b. */
  iter(a: Vowel, b: Vowel, t: number): Formant[];
  /** The first `nHarmonics` harmonic amplitudes of `f0` on `vowel`. */
  spectrum(f0: number, vowel: Vowel | Locus, nHarmonics?: number): number[];
  /** Brightness as an output: the spectral centroid of the spectrum (Hz). */
  claritas(f0: number, vowel: Vowel | Locus): number;
  /**
   * The formant transition target for `vowel` melting into a liquescent `coda`,
   * `depth` of the way to the full coda articulation (default 1).
   */
  liquescentia(vowel: Vowel, coda: Coda, depth?: number): Formant[];
}

// ── Resolution ──

function resolvePersona(input?: VoxInput): Persona {
  if (!input) return {};
  if (typeof input === "string") {
    if (input === "vetus") return VETUS;
    const p = PERSONAE[input as PersonaName];
    if (!p) {
      throw new Error(
        `vox: unknown persona "${input}" — try ${Object.keys(PERSONAE).join(", ")}, or vetus`,
      );
    }
    return p;
  }
  return input;
}

/** Layer the defaults, the preset, then the caller's overrides. */
function resolveParams(input?: VoxInput, overrides?: Persona): VoxParams {
  const params = { ...DEFAULTS, ...resolvePersona(input), ...(overrides ?? {}) };
  // Builder contract: junk sliders throw rather than resolving NaN formants
  // (tract 0 would divide the table by zero; the 0..1 axes clamp is the
  // documented range, but non-finite input is a caller bug).
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "number" && !Number.isFinite(value))
      throw new Error(`vox: ${key} must be a finite number, got ${String(value)}`);
  }
  if (typeof params.tract !== "number" || !Number.isFinite(params.tract))
    throw new Error(`vox: tract must be a finite number, got ${String(params.tract)}`);
  if (params.tract <= 0.5 || params.tract > 2)
    throw new Error(`vox: tract ${params.tract} is outside the physical range (0.5–2; ~0.8 child, 1.0 tenor, ~1.25 deep bass)`);
  for (const axis of ["aetas", "fatigatio", "cantoris", "nisus"] as const) {
    if (params[axis] != null && (params[axis]! < 0 || params[axis]! > 1))
      throw new Error(`vox: ${axis} is a 0..1 slider, got ${params[axis]}`);
  }
  return params;
}

// ── Builder ──

/**
 * Build one singer (`vox`). Accepts a persona name (`"tenor"`), the `vetus`
 * modifier, or a bare slider bundle, plus optional overrides. The 5×15 formant
 * table is built once here and closed over by every method.
 * @throws on an unknown persona or a non-vowel argument.
 */
export function buildVoice(input?: VoxInput, overrides?: Persona): Vox {
  const params = resolveParams(input, overrides);
  const table = computeTable(params);

  // Resolve where-to-read into a plane locus. A cardinal vowel first takes its
  // base locus, then the latinitas regional shift; a raw Locus is used as-is.
  const resolveLocus = (where: Vowel | Locus): Locus =>
    typeof where === "string"
      ? shiftLocus(locusOf(where), where, params.latinitas)
      : where;

  const at = (where: Vowel | Locus): Formant[] =>
    formantsAt(table, resolveLocus(where));

  return {
    params,

    locus(vowel: Vowel): Locus {
      return locusOf(vowel);
    },

    formantes(where: Vowel | Locus, ad?: TuningLike, vis?: number): Formant[] {
      // Tune to a temperament: each band is drawn toward the tuning's nearest
      // pitch, weighted by vis (0 phonetic truth … 1 locked, default 1). The
      // temperament is duck-typed (anything with gamut()) — this engine
      // imports nothing from temper. Snapping math lives in accordatio.ts.
      const f = at(where);
      return ad === undefined ? f : accord(f, ad, vis);
    },

    iter(a: Vowel, b: Vowel, t: number): Formant[] {
      // Interpolate the RESOLVED loci (latinitas shift applied), so iter's
      // endpoints agree with formantes under every regional pronunciation,
      // not only the romana default.
      const la = resolveLocus(a);
      const lb = resolveLocus(b);
      return formantsAt(table, {
        u: la.u + (lb.u - la.u) * t,
        v: la.v + (lb.v - la.v) * t,
      });
    },

    spectrum(f0: number, vowel: Vowel | Locus, nHarmonics = 40): number[] {
      return spectrumOf(f0, at(vowel), params, nHarmonics);
    },

    claritas(f0: number, vowel: Vowel | Locus): number {
      return claritasOf(f0, at(vowel), params);
    },

    liquescentia(vowel: Vowel, coda: Coda, depth = 1): Formant[] {
      return liquescentTarget(at(vowel), coda, depth);
    },
  };
}
