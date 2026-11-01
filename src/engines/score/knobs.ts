// ---------------------------------------------------------------------------
// engines/score/knobs — the five singing knobs over the two profile tables
// ---------------------------------------------------------------------------
// Five knobs set the interpretation. A knob is a number, 0..1, or an object of
// its own profile fields with the number beside them as `gradus`. 0.5 is the
// reference reading (the balanced articulation, the lyrical phrasing); 0 leans
// to the restrained and recitative profiles. The top is set so that the Mass's
// manner (expressive, with its nine phrasing overrides) sits at about 0.8,
// leaving room above it: the top anchor is the middle pushed past that manner
// by 1/0.6. Each profile number is a line through its three anchors, read at
// the knob that owns it; a field given in a knob's object replaces the line's
// reading. A number no knob gives keeps its 0.5 value.
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

type KnobName = "pondus" | "modulatio" | "cadentia" | "expressio" | "modalitas";

/** A knob: its level, 0..1, or an object of its fields with the level as `gradus` (0.5 when left out). */
export type Knob<F> = number | (F & { gradus?: number });

/** pondus, stress. `ictusBoost` sets both the ictus weight and its velocity. */
export interface PondusFields {
  weights?: Partial<ArticulationWeights>;
  weightBase?: number;
  weightGain?: number;
  weightSaturation?: number;
  ruleGain?: number;
  ictusBoost?: number;
  accent?: number;
}

/** modulatio, phrasing. `neumeArch` and `durArch` set the arch in weight and in velocity alike. */
export interface ModulatioFields {
  curve?: number;
  contourScale?: number;
  contourVel?: number;
  contourDur?: number;
  neumeArch?: number;
  durArch?: number;
  lean?: number;
  rush?: number;
}

/** cadentia, the close. */
export interface CadentiaFields {
  cadence?: number;
  ritard?: number;
  ritardNotes?: number;
  ritardCurve?: number;
  finisBoost?: number;
}

/** expressio, the dynamic range. */
export interface ExpressioFields {
  baseVelocity?: number;
  velSpread?: number;
  durationBase?: number;
  durationGain?: number;
  durationMin?: number;
  durationMax?: number;
}

/** modalitas, the mode's bend. */
export interface ModalitasFields {
  tenor?: number;
}

export interface Knobs {
  /** stress: how hard the accents and the signs are leaned on */
  pondus?: Knob<PondusFields>;
  /** phrasing: how much a phrase arches, its rise and fall */
  modulatio?: Knob<ModulatioFields>;
  /** cadence: how much the ends broaden and settle */
  cadentia?: Knob<CadentiaFields>;
  /** dynamics: the span from soft to loud and from short to long */
  expressio?: Knob<ExpressioFields>;
  /** mode: how far the chant's mode bends the phrasing; 0 none, 0.5 tonus's old default, 1 twice that */
  modalitas?: Knob<ModalitasFields>;
}

export const KNOB_NAMES: readonly KnobName[] = ["pondus", "modulatio", "cadentia", "expressio", "modalitas"];

// Which profile a field lives in. Three names stand in both (the ictus boost
// and the neume arch, in weight and in velocity), and one override sets both.
type Layer = "articulation" | "phrasing" | "both";

// Every field, sorted under the knob that owns it. `weights` (pondus) is the
// articulation's sign table, every sign a stress.
const FIELDS: Record<KnobName, Record<string, Layer>> = {
  pondus: {
    weightBase: "articulation", weightGain: "articulation", weightSaturation: "articulation",
    ruleGain: "articulation", ictusBoost: "both", accent: "phrasing",
  },
  modulatio: {
    contourScale: "articulation", neumeArch: "both", durArch: "both",
    curve: "phrasing", contourVel: "phrasing", contourDur: "phrasing", lean: "phrasing", rush: "phrasing",
  },
  cadentia: {
    cadence: "phrasing", ritard: "phrasing", ritardNotes: "phrasing", ritardCurve: "phrasing", finisBoost: "phrasing",
  },
  expressio: {
    durationBase: "articulation", durationGain: "articulation", durationMin: "articulation", durationMax: "articulation",
    baseVelocity: "phrasing", velSpread: "phrasing",
  },
  // modalitas is the mode's bend, not a line through the profiles: its one
  // field, the tenor's pull, is fixed at lyrical unless given.
  modalitas: { tenor: "phrasing" },
};

const LINE_KNOBS: KnobName[] = ["pondus", "modulatio", "cadentia", "expressio"];

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

/** The levels the knobs give, by name. */
export type Levels = Partial<Record<KnobName, number>>;

/** Any knob given, as a number or as an object. */
export function hasKnobs(k: Knobs | undefined): k is Knobs {
  return !!k && KNOB_NAMES.some((name) => k[name] !== undefined);
}

const isPlain = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

const finite = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function ownerOf(field: string): KnobName | undefined {
  if (field === "weights") return "pondus";
  return KNOB_NAMES.find((name) => field in FIELDS[name]);
}

/**
 * Read the five knobs: each level checked to 0..1, each object's fields
 * checked against the knob that owns them and sorted into the two profiles.
 * @throws Error on a level outside 0..1, a field another knob owns, an unknown
 *   field or sign weight, or a value that is not a finite number.
 */
export function readKnobs(k: Knobs): {
  levels: Levels; articulation: ArticulationOverrides; phrasing: Partial<PhrasingProfile>;
} {
  const levels: Levels = {};
  const articulation: Record<string, unknown> = {};
  const phrasing: Record<string, unknown> = {};
  const level = (name: KnobName, v: unknown, as: string): number => {
    if (!finite(v) || v < 0 || v > 1)
      throw new Error(`notatio: ${as} must be a number from 0 to 1, not ${String(v)}`);
    return v;
  };

  for (const name of KNOB_NAMES) {
    const v = k[name];
    if (v === undefined) continue;
    if (typeof v === "number") { levels[name] = level(name, v, name); continue; }
    if (!isPlain(v))
      throw new Error(`notatio: ${name} must be a number from 0 to 1, or an object of its fields, not ${String(v)}`);

    for (const [field, x] of Object.entries(v)) {
      if (field === "gradus") { levels[name] = level(name, x, `${name}.gradus`); continue; }
      if (field === "weights" && name === "pondus") {
        if (!isPlain(x)) throw new Error("notatio: pondus.weights must be an object of sign weights");
        const known = ARTICULATION_PROFILES.balanced.weights;
        for (const [sign, w] of Object.entries(x)) {
          if (!(sign in known)) throw new Error(`notatio: pondus.weights has no sign weight ${sign}`);
          if (!finite(w)) throw new Error(`notatio: pondus.weights.${sign} must be a finite number, not ${String(w)}`);
        }
        articulation.weights = { ...x };
        continue;
      }
      const layer = FIELDS[name][field];
      if (!layer) {
        const owner = ownerOf(field);
        throw new Error(owner
          ? `notatio: ${field} is a ${owner} field, not ${name}`
          : `notatio: ${name} has no field ${field}`);
      }
      if (!finite(x)) throw new Error(`notatio: ${name}.${field} must be a finite number, not ${String(x)}`);
      if (layer !== "phrasing") articulation[field] = x;
      if (layer !== "articulation") phrasing[field] = x;
    }
  }
  return {
    levels,
    articulation: articulation as ArticulationOverrides,
    phrasing: phrasing as Partial<PhrasingProfile>,
  };
}

/** The two profiles the knob levels describe, as overrides on balanced and lyrical. */
export function knobProfiles(levels: Levels): {
  articulation: ArticulationOverrides; phrasing: Partial<PhrasingProfile>;
} {
  const A = ARTICULATION_PROFILES;
  const P = PHRASING_PROFILES;
  const articulation: ArticulationOverrides = {};
  const phrasing: Partial<PhrasingProfile> = {};

  for (const name of LINE_KNOBS) {
    const t = levels[name];
    if (t === undefined) continue;
    for (const [field, layer] of Object.entries(FIELDS[name])) {
      if (layer !== "phrasing") {
        const key = field as keyof Omit<ArticulationProfile, "weights">;
        const lo = A.restrained[key], mid = A.balanced[key], ref = A.expressive[key];
        if (lo !== undefined && mid !== undefined && ref !== undefined)
          (articulation as Record<string, number>)[key] = at(lo, mid, top(mid, ref), t);
      }
      if (layer !== "articulation") {
        const key = field as keyof PhrasingProfile;
        const mid = P.lyrical[key];
        const x = at(P.recitative[key], mid, top(mid, MANNER[key] ?? P.solemn[key]), t);
        phrasing[key] = key === "ritardNotes" ? Math.round(x) : x;
      }
    }
    if (name === "pondus") {
      const weights: Partial<ArticulationWeights> = {};
      for (const key of Object.keys(A.balanced.weights) as (keyof ArticulationWeights)[])
        weights[key] = at(A.restrained.weights[key], A.balanced.weights[key], top(A.balanced.weights[key], A.expressive.weights[key]), t);
      articulation.weights = weights;
    }
  }
  return { articulation, phrasing };
}

/** The interpretation the knobs set: each profile's line reading, with any
 *  field given in a knob's object laid over it (sign weights key by key). */
export function interpretKnobs(k: Knobs): {
  articulation: ArticulationOverrides; phrasing: Partial<PhrasingProfile>; modalitas?: number;
} {
  const { levels, articulation: givenA, phrasing: givenP } = readKnobs(k);
  const line = knobProfiles(levels);
  const weights = line.articulation.weights || givenA.weights
    ? { ...line.articulation.weights, ...givenA.weights }
    : undefined;
  return {
    articulation: { ...line.articulation, ...givenA, ...(weights ? { weights } : {}) },
    phrasing: { ...line.phrasing, ...givenP },
    modalitas: levels.modalitas,
  };
}
