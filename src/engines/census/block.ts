// ---------------------------------------------------------------------------
// engines/census/block — the census groups of one notated chant
// ---------------------------------------------------------------------------
// The FORMULA for one chant's block, which the corpus bake and census({ score })
// both call, so a composed chant is read exactly as a shipped one was baked.
// The bake (blocks.mjs, in tonus-corpus's census scripts) imports this and writes
// what it returns at CENSUS_GROUPS' offsets; the floats it adds around them —
// flags, extras, attestation — are about corpus membership, not the chant.
//
// This is per-chant arithmetic, not mining. What is corpus-scale — the two
// dictionaries, the mean — is mined in the corpus and arrives as generated
// data. The dictionaries are a PARAMETER, not an import: the bake counts
// against the ones it has just mined, before tonus holds them.
//
// The floats must agree with the bake to the bit, so the accumulation is the
// bake's: degreeHist sums in float32, the rest in float64, every group stored
// as float32. The census test holds every shipped block to it.

import type { Score } from "../score/api.js";
import type { ChantTabulaRow } from "../score/tabula.js";
import { cadenceKeys } from "../score/cadence.js";
import { CENSUS_GROUPS } from "../../data/census.js";
import type { CensusGroup } from "./types.js";

/** The two mined vocabularies a block counts against, commonest first. */
export interface CensusDictionaries {
  /** Diatonic step trigrams, "1,-1,-1". */
  trigrams: readonly string[];
  /** Cadence genus keys, "cadens @0". */
  cadences: readonly string[];
}

const DEG_BINS = 15;    // octave-aware final-relative degree bins
const DEG_LO = -4;      // lowest degree offset (a fourth below the final)
const TOP = 15;         // dictionary entries counted (+1 "other")
const VOWELS = ["a", "e", "i", "o", "u"];

/** Octave-aware final-relative degree of a row (0 = final, +7 = octave). */
function octaveDegree(row: ChantTabulaRow, finalMidi: number): number | null {
  if (row.degree == null) return null;
  const oct = Math.floor((row.midi - finalMidi) / 12);
  return oct * 7 + (row.degree - 1);
}

/**
 * Per-phrase diatonic step runs. A step never spans a divisio nor a
 * non-diatonic note — the boundary rule the dictionaries were mined under.
 */
function degreeSteps(rows: readonly ChantTabulaRow[], finalMidi: number): number[][] {
  const runs: number[][] = [];
  let cur: number[] = [];
  let pDeg: number | null = null;
  let pPhrase = rows.length ? rows[0]!.phraseIndex : 0;
  for (const r of rows) {
    const d = octaveDegree(r, finalMidi);
    if (r.phraseIndex !== pPhrase || d == null) {
      if (cur.length) runs.push(cur);
      cur = [];
      pPhrase = r.phraseIndex;
      pDeg = d;
      continue;
    }
    if (pDeg != null) cur.push(d - pDeg);
    pDeg = d;
  }
  if (cur.length) runs.push(cur);
  return runs;
}

/** Counts → a float32 distribution, all zero when there is nothing to count. */
function distribution(counts: Float64Array): Float32Array {
  let total = 0;
  for (const v of counts) total += v;
  const out = new Float32Array(counts.length);
  if (total > 0) for (let i = 0; i < counts.length; i++) out[i] = counts[i]! / total;
  return out;
}

/**
 * The eight census groups of a notated chant, each at its CENSUS_GROUPS width.
 * An empty tabula has no block; the caller decides what that means.
 */
export function censusGroups(
  score: Score,
  dicts: CensusDictionaries,
): Record<CensusGroup, Float32Array> {
  const rows = score.tabula;
  if (!rows.length) throw new Error("census: the score has no notes to census.");
  const finalMidi = rows[rows.length - 1]!.midi;
  const width = (g: CensusGroup): number => CENSUS_GROUPS[g]!.count;

  // modal: 8-mode affinity (normalized) · final pc · tenor pc · ambitus · margin
  const modal = new Float32Array(width("modal"));
  {
    const byMode = new Map(score.imprint.modalAffinity.map((a) => [a.mode, a.score]));
    let affSum = 0;
    for (let m = 1; m <= 8; m++) affSum += Math.max(0, byMode.get(m) ?? 0);
    for (let m = 1; m <= 8; m++) {
      modal[m - 1] = affSum > 0 ? Math.max(0, byMode.get(m) ?? 0) / affSum : 0;
    }
    modal[8] = ((finalMidi % 12) + 12) % 12;
    const tenor = rows.find((r) => r.role === "tenor");
    modal[9] = tenor ? ((tenor.midi % 12) + 12) % 12 : -1;
    modal[10] = score.metrics.ambitus ?? 0;
    const ranked = [...byMode.values()].map((v) => Math.max(0, v)).sort((a, b) => b - a);
    modal[11] = affSum > 0 && ranked.length > 1 ? (ranked[0]! - ranked[1]!) / affSum : 0;
  }

  // degreeHist: duration-weighted, final-relative, octave-aware. Summed IN
  // float32, as the bake sums it in its block buffer.
  const degreeHist = new Float32Array(DEG_BINS);
  {
    let total = 0;
    for (const r of rows) {
      const d = octaveDegree(r, finalMidi);
      if (d == null) continue;
      const bin = Math.min(DEG_BINS - 1, Math.max(0, d - DEG_LO));
      degreeHist[bin] = degreeHist[bin]! + (r.duration || 0);
      total += r.duration || 0;
    }
    if (total > 0) for (let i = 0; i < DEG_BINS; i++) degreeHist[i] = degreeHist[i]! / total;
  }

  const steps = degreeSteps(rows, finalMidi);

  // melodic: step bigrams, steps clipped to ±5, an 11 × 11 grid.
  const bigram = new Float64Array(121);
  {
    const clip = (s: number): number => Math.max(-5, Math.min(5, s)) + 5;
    for (const run of steps) {
      for (let i = 1; i < run.length; i++) bigram[clip(run[i - 1]!) * 11 + clip(run[i]!)]!++;
    }
  }

  // trigram: against the dictionary's top fifteen, the sixteenth slot "other".
  const trigramIndex = new Map(dicts.trigrams.slice(0, TOP).map((k, i) => [k, i]));
  const trigrams = new Float64Array(TOP + 1);
  for (const run of steps) {
    for (let i = 2; i < run.length; i++) {
      const key = `${run[i - 2]},${run[i - 1]},${run[i]}`;
      trigrams[trigramIndex.get(key) ?? TOP]!++;
    }
  }

  // cadenceFinal / cadenceMedial: one genus vocabulary, counted at the chant
  // end and "::" apart from interior phrase ends.
  const cadenceIndex = new Map(dicts.cadences.slice(0, TOP).map((k, i) => [k, i]));
  const fin = new Float64Array(TOP + 1);
  const med = new Float64Array(TOP + 1);
  for (const ev of cadenceKeys(rows)) {
    (ev.isFinal ? fin : med)[cadenceIndex.get(ev.genus) ?? TOP]!++;
  }

  // chironomy: mean pitch per quarter (final-relative) · phrase length · melisma
  const chironomy = new Float32Array(width("chironomy"));
  {
    const q = [0, 0, 0, 0];
    const qn = [0, 0, 0, 0];
    for (let i = 0; i < rows.length; i++) {
      const qi = Math.min(3, Math.floor((i / rows.length) * 4));
      q[qi]! += rows[i]!.midi - finalMidi;
      qn[qi]!++;
    }
    for (let i = 0; i < 4; i++) chironomy[i] = qn[i]! > 0 ? q[i]! / qn[i]! : 0;
    chironomy[4] = score.metrics.phraseCount > 0 ? rows.length / score.metrics.phraseCount : 0;
    chironomy[5] = score.metrics.melismaRatio ?? 0;
  }

  // textual: vowels by sung duration · accent rate · cadential melisma
  const textual = new Float32Array(width("textual"));
  {
    const vw = [0, 0, 0, 0, 0];
    let vTot = 0;
    let accDur = 0;
    let durTot = 0;
    for (const r of rows) {
      const vi = VOWELS.indexOf((r.vowel || "").toLowerCase());
      if (vi >= 0) { vw[vi]! += r.duration || 0; vTot += r.duration || 0; }
      if (r.accent) accDur += r.duration || 0;
      durTot += r.duration || 0;
    }
    for (let i = 0; i < 5; i++) textual[i] = vTot > 0 ? vw[i]! / vTot : 0;
    textual[5] = durTot > 0 ? accDur / durTot : 0;
    textual[6] = score.metrics.melismaCadential ?? 0;
  }

  return {
    modal,
    degreeHist,
    melodic: distribution(bigram),
    trigram: distribution(trigrams),
    cadenceFinal: distribution(fin),
    cadenceMedial: distribution(med),
    chironomy,
    textual,
  };
}
