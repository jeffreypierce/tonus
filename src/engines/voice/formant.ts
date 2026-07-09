// ---------------------------------------------------------------------------
// engines/voice/formant — build the resolved 5×15 table, then read it (bilinear)
// ---------------------------------------------------------------------------
// The heavy work: from a resolved slider bank, produce one voice's 5-vowel ×
// 5-formant table. Reading it — at a corner vowel, an arbitrary (u,v), or a
// point along a vowel path — is bilinear interpolation of the LOCUS, then a
// table lookup, so midpoints are real mouth shapes and not per-formant lerps.

import type { Vowel, Formant, Locus, VoxParams } from "./types.js";
import { VIR, FEMINA, PUER, VOWELS, LOCI } from "./data/vowels.js";
import type { VowelTable } from "./data/vowels.js";

// ── Base-voice blend ──

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const lerpFormant = (a: Formant, b: Formant, t: number): Formant => ({
  freqHz: lerp(a.freqHz, b.freqHz, t),
  q: lerp(a.q, b.q, t),
  gain: lerp(a.gain, b.gain, t),
});

const blendTables = (a: VowelTable, b: VowelTable, t: number): VowelTable => {
  const out = {} as VowelTable;
  for (const v of VOWELS) {
    out[v] = a[v].map((fa, i) => lerpFormant(fa, b[v][i]!, t));
  }
  return out;
};

/**
 * Pick the base voice from the tract axis. tract is continuous physiology, so
 * the base is a blend, not a switch: below ~0.90 leans on the boy treble, the
 * adult range blends female→male across ~0.94..1.22. The blend is where the
 * gender/size axis actually lives.
 */
function baseVoice(tract: number): VowelTable {
  if (tract <= 0.9) {
    // 0.80 puer … 0.90 female edge
    const t = clamp01((tract - 0.8) / 0.1);
    return blendTables(PUER, FEMINA, t);
  }
  // 0.90 female … 1.22 male. Above 1.22 stays fully male (bass tract scaling
  // then does the deepening).
  const t = clamp01((tract - 0.9) / (1.22 - 0.9));
  return blendTables(FEMINA, VIR, t);
}

// ── Slider transforms (only where they change a formant number) ──

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

/**
 * Apply the slider bank to the base table. Each axis touches only the numbers
 * it physically should:
 *   tract     — scales all formant frequencies (residual beyond the base blend).
 *   aetas     — small downward formant drift + loosened Q (older tract).
 *   fatigatio — loosens Q further (a tired tract rings less sharply). The
 *               spectral-tilt consequence of fatigue lives in spectrum(), not
 *               here — this is only its formant-Q effect.
 * nisus and cantoris act on the SOURCE spectrum, not the formant table, so they
 * are absent here by design and applied in spectrum().
 */
function applySliders(base: VowelTable, p: VoxParams): VowelTable {
  // Residual tract scaling: the base blend spans ~0.90..1.22, so scale by the
  // ratio of the requested tract to the middle of that span. F1 moves least,
  // upper formants fully (a longer tract lowers the whole envelope, high
  // formants most). Weights after the legacy voice-spec shape.
  const tractRatio = 1.06 / p.tract; // >1 tract → ratio <1 → lower formants
  const weights = [0.35, 0.55, 0.85, 1.0, 1.0];
  const ageFreq = 1 - p.aetas * 0.02; // elder formants drift down slightly
  const ageQ = 1 - p.aetas * 0.1;
  const fatQ = 1 - p.fatigatio * 0.2;

  const out = {} as VowelTable;
  for (const v of VOWELS) {
    out[v] = base[v].map((f, i) => {
      const scale = 1 + (tractRatio - 1) * weights[i]!;
      return {
        freqHz: f.freqHz * scale * ageFreq,
        q: f.q * ageQ * fatQ,
        gain: f.gain,
      };
    });
  }
  return out;
}

/** Build one voice's resolved 5×15 table. Called once per vox(); cached there. */
export function computeTable(p: VoxParams): VowelTable {
  return applySliders(baseVoice(p.tract), p);
}

// ── Reading the table (barycentric over the vowel diamond) ──
//
// The five vowels form a DIAMOND: a at the centre (0.5,0.5), and e/i/o/u at the
// four edge-midpoints (0.5,1)/(1,0.5)/(0,0.5)/(0.5,0). Five independent tables
// cannot round-trip through a 4-corner bilinear patch (4 DoF < 5 vowels, and an
// independent centre vowel can never be a bilinear result). So we triangulate:
// the diamond tiles into four triangles fanning from a — (a,e,i), (a,i,u),
// (a,u,o), (a,o,e) — and any point is a barycentric blend of its triangle's
// three vowels. At a vowel's own locus one weight is 1, so every cardinal
// returns its authored table exactly; the blend is continuous across the shared
// a-spokes. Points outside the diamond clamp to the nearest triangle (the
// diamond IS the vowel space — the square's corners are not phonetic).

const A: Locus = { u: 0.5, v: 0.5 };

/** The two rim vowels bounding the triangle that contains (u,v), by quadrant. */
function rimVowels(u: number, v: number): [Vowel, Vowel] {
  const right = u >= 0.5;
  const up = v >= 0.5;
  if (right && up) return ["i", "e"]; // (a,i,e)
  if (right && !up) return ["u", "i"]; // (a,u,i)
  if (!right && !up) return ["o", "u"]; // (a,o,u)
  return ["e", "o"]; // (a,e,o)
}

/**
 * Barycentric weights of point p in triangle (A, B, C). Clamped to ≥0 and
 * renormalised, so points just outside the diamond fold onto the nearest edge
 * rather than extrapolating to nonsense.
 */
function barycentric(
  p: Locus,
  b: Locus,
  c: Locus,
): { wa: number; wb: number; wc: number } {
  const v0u = b.u - A.u, v0v = b.v - A.v;
  const v1u = c.u - A.u, v1v = c.v - A.v;
  const v2u = p.u - A.u, v2v = p.v - A.v;
  const den = v0u * v1v - v1u * v0v;
  if (den === 0) return { wa: 1, wb: 0, wc: 0 };
  let wb = (v2u * v1v - v1u * v2v) / den;
  let wc = (v0u * v2v - v2u * v0v) / den;
  let wa = 1 - wb - wc;
  wa = Math.max(0, wa); wb = Math.max(0, wb); wc = Math.max(0, wc);
  const s = wa + wb + wc || 1;
  return { wa: wa / s, wb: wb / s, wc: wc / s };
}

const blend3 = (
  ta: Formant[],
  tb: Formant[],
  tc: Formant[],
  wa: number,
  wb: number,
  wc: number,
): Formant[] =>
  ta.map((fa, i) => ({
    freqHz: fa.freqHz * wa + tb[i]!.freqHz * wb + tc[i]!.freqHz * wc,
    q: fa.q * wa + tb[i]!.q * wb + tc[i]!.q * wc,
    gain: fa.gain * wa + tb[i]!.gain * wb + tc[i]!.gain * wc,
  }));

/** Evaluate the table at an arbitrary plane point (barycentric on the diamond). */
export function formantsAt(table: VowelTable, loc: Locus): Formant[] {
  const [rb, rc] = rimVowels(loc.u, loc.v);
  const { wa, wb, wc } = barycentric(loc, LOCI[rb], LOCI[rc]);
  return blend3(table.a, table[rb], table[rc], wa, wb, wc);
}

/** The plane coordinate of a cardinal vowel. */
export function locusOf(vowel: Vowel): Locus {
  const loc = LOCI[vowel];
  if (!loc) throw new Error(`vox: "${vowel}" is not a vowel (a|e|i|o|u)`);
  return loc;
}

/**
 * The point t of the way along the path a→b, as a plane locus. Interpolating
 * the LOCUS (not the formants) is the primitive liquescentia later specializes
 * with an off-plane coda target.
 */
export function iterLocus(a: Vowel, b: Vowel, t: number): Locus {
  const la = locusOf(a);
  const lb = locusOf(b);
  return { u: lerp(la.u, lb.u, t), v: lerp(la.v, lb.v, t) };
}
