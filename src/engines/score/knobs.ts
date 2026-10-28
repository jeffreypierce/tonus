// ---------------------------------------------------------------------------
// engines/score/knobs — the five singing knobs over the two profile tables
// ---------------------------------------------------------------------------
// Five numbers, each 0..1, in place of the pondus and accentus presets and
// their overrides. 0.5 is what the presets sing today (balanced, lyrical);
// 0 leans to the restrained and recitative profiles. The top is set so that
// the Mass's manner (expressive, with its nine phrasing overrides) sits at
// about 0.8, leaving room above it: the top anchor is the middle pushed past
// that manner by 1/0.6. Each profile number is a line through its three
// anchors, read at the knob that owns it. A number no knob owns keeps its
// 0.5 value.
//
//   pondus     stress: how hard the accents and signs are leaned on
//   modulatio  phrasing: how much a phrase arches, rise and fall; and, one
//              level down, how much a melisma's real notes are leaned into
//              and its runs rushed (the profile's lean and rush)
//   cadentia   cadence: how much the ends broaden and settle
//   expressio  dynamics: the span from soft to loud, short to long
//   modalitas  mode: how far the chant's mode bends the phrasing (its tenor
//              pull, its cadence weight, its curve and floor); 0 none, 0.5
//              what tonus always did quietly, 1 twice that

import type {
  ArticulationOverrides, ArticulationProfile, ArticulationWeights, PhrasingProfile,
} from "./types.js";
import { ARTICULATION_PROFILES } from "./articulation.js";
import { PHRASING_PROFILES } from "./phrasing.js";

type Knob = "pondus" | "modulatio" | "cadentia" | "expressio" | "modalitas";

export interface Knobs {
  /** stress: how hard the accents and the signs are leaned on, 0..1 */
  pondus?: number;
  /** phrasing: how much a phrase arches, its rise and fall, 0..1 */
  modulatio?: number;
  /** cadence: how much the ends broaden and settle, 0..1 */
  cadentia?: number;
  /** dynamics: the span from soft to loud and from short to long, 0..1 */
  expressio?: number;
  /** mode: how far the chant's mode bends the phrasing; 0 none, 0.5 tonus's old default, 1 twice that */
  modalitas?: number;
}

const KNOB_NAMES: Knob[] = ["pondus", "modulatio", "cadentia", "expressio", "modalitas"];

/** Every knob given must be a finite number from 0 to 1. */
export function checkKnobs(k: Knobs): void {
  for (const name of KNOB_NAMES) {
    const v = k[name];
    if (v === undefined) continue;
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 1)
      throw new Error(`notatio: ${name} must be a number from 0 to 1, not ${String(v)}`);
  }
}


const ARTICULATION_OWNER: Partial<Record<keyof Omit<ArticulationProfile, "weights">, Knob>> = {
  weightGain: "pondus", ruleGain: "pondus", ictusBoost: "pondus", weightSaturation: "pondus",
  contourScale: "modulatio", neumeArch: "modulatio", durArch: "modulatio",
  durationGain: "expressio", durationMin: "expressio", durationMax: "expressio",
};
// every sign weight is stress
const WEIGHTS_OWNER: Knob = "pondus";

const PHRASING_OWNER: Partial<Record<keyof PhrasingProfile, Knob>> = {
  accent: "pondus", ictusBoost: "pondus",   // tenor stays lyrical: recitative leans on it most, so it is no stress axis
  curve: "modulatio", neumeArch: "modulatio", durArch: "modulatio", contourVel: "modulatio", contourDur: "modulatio",
  lean: "modulatio", rush: "modulatio",
  cadence: "cadentia", ritard: "cadentia", ritardNotes: "cadentia", ritardCurve: "cadentia", finisBoost: "cadentia",
  velSpread: "expressio", baseVelocity: "expressio",
};

/** The phrasing numbers the Mass sang over lyrical (orreliquum's MISSA_MANNER),
 *  which define where 0.8 is on the phrasing knobs. */
const MANNER: Partial<PhrasingProfile> = {
  curve: 0.55, accent: 1.0, cadence: 0.3, ritard: 0.65, ritardNotes: 5,
  finisBoost: 2.5, velSpread: 0.65, contourVel: 0.27, contourDur: 0.17,
  lean: 0.5, rush: 0.45,
};
const STRETCH = 1 / 0.6;
/** The top anchor: the middle pushed past a reference by STRETCH. */
const top = (mid: number, ref: number): number => mid + (ref - mid) * STRETCH;

/** A line through three anchors (at 0, 0.5, 1), read at t in 0..1. */
function at(lo: number, mid: number, hi: number, t: number): number {
  return t < 0.5 ? lo + (mid - lo) * (t / 0.5) : mid + (hi - mid) * ((t - 0.5) / 0.5);
}

export function hasKnobs(k: Knobs | undefined): k is Knobs {
  return !!k && [k.pondus, k.modulatio, k.cadentia, k.expressio, k.modalitas].some((v) => typeof v === "number");
}

/** The two profiles the knobs describe, as overrides on balanced and lyrical. */
export function knobProfiles(knobs: Knobs): {
  articulation: ArticulationOverrides; phrasing: Partial<PhrasingProfile>;
} {
  const t = (k: Knob | undefined): number | undefined => (k ? knobs[k] : undefined);

  const A = ARTICULATION_PROFILES;
  const articulation: ArticulationOverrides = {};
  for (const key of Object.keys(ARTICULATION_OWNER) as (keyof typeof ARTICULATION_OWNER)[]) {
    const v = t(ARTICULATION_OWNER[key]);
    if (v === undefined) continue;
    const lo = A.restrained[key], mid = A.balanced[key], ref = A.expressive[key];
    if (lo === undefined || mid === undefined || ref === undefined) continue;
    (articulation as Record<string, number>)[key] = at(lo, mid, top(mid, ref), v);
  }
  const w = t(WEIGHTS_OWNER);
  if (w !== undefined) {
    const weights: Partial<ArticulationWeights> = {};
    for (const key of Object.keys(A.balanced.weights) as (keyof ArticulationWeights)[])
      weights[key] = at(A.restrained.weights[key], A.balanced.weights[key], top(A.balanced.weights[key], A.expressive.weights[key]), w);
    articulation.weights = weights;
  }

  const P = PHRASING_PROFILES;
  const phrasing: Partial<PhrasingProfile> = {};
  for (const key of Object.keys(PHRASING_OWNER) as (keyof PhrasingProfile)[]) {
    const v = t(PHRASING_OWNER[key]);
    if (v === undefined) continue;
    const mid = P.lyrical[key];
    const ref = MANNER[key] ?? P.solemn[key];
    const x = at(P.recitative[key], mid, top(mid, ref), v);
    phrasing[key] = key === "ritardNotes" ? Math.round(x) : x;
  }
  return { articulation, phrasing };
}
