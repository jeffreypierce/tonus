// ---------------------------------------------------------------------------
// engines/score/api — score builder and interpretation profiles
// ---------------------------------------------------------------------------
import { parseGABC } from "./parse.js";
import { buildIR } from "./ir.js";
import { buildRatios } from "../temper/scale.js";
import { computeMeta } from "./meta.js";
import { computeImprint, type Imprint } from "../imprint.js";
import { computeMetrics, type Metrics } from "./metrics.js";
import { detectCadences, type Cadence } from "./cadence.js";
import { detectModulations, type Modulation } from "./modulation.js";
import { computeTabula, type ChantTabulaRow } from "./tabula.js";
import { MODES } from "../temper/modes.js";
import { cadentiaGenus, cadentiaSpecies } from "../../data/cadentiae.js";
import type { Chant } from "../chant/types.js";
import type { Temperamentum } from "../temper/api.js";
import type {
  ArticulationOverrides,
  ArticulationType,
  PhrasingProfile,
  PhrasingType,
  ParseError,
  Phrase as IRPhrase,
} from "./types.js";
import { hasKnobs, knobProfiles, checkKnobs, type Knobs } from "./knobs.js";
export type { Knobs } from "./knobs.js";

export type PondusStyle = "restrained" | "balanced" | "expressive" | "strict";
export type AccentusStyle = "recitative" | "lyrical" | "hymnic" | "solemn";

export interface PondusOpts {
  style?: PondusStyle;
  overrides?: ArticulationOverrides;
}

export interface AccentusOpts {
  style?: AccentusStyle;
  overrides?: Partial<PhrasingProfile>;
}

export type PondusInput = PondusStyle | PondusOpts;
export type AccentusInput = AccentusStyle | AccentusOpts;

export interface ScoreOpts extends Omit<Knobs, "pondus"> {
  temperamentum?: Temperamentum;
  /** the stress knob, 0..1; or, the older way, a pondus preset by name or opts */
  pondus?: number | PondusInput;
  accentus?: AccentusInput;
}

function knobsOf(opts?: ScoreOpts): Knobs | undefined {
  if (!opts) return undefined;
  const { modulatio, cadentia, expressio, modalitas } = opts;
  return { pondus: typeof opts.pondus === "number" ? opts.pondus : undefined, modulatio, cadentia, expressio, modalitas };
}

export interface Score {
  chant: Chant;
  phrases: IRPhrase[];
  errors: ParseError[];
  tabula: ChantTabulaRow[];
  metrics: Metrics;
  /** Mode-specific cadence at each phrase-ending divisio. */
  cadences: Cadence[];
  /** Passages where the tonal centre leans away from the home mode. */
  modulations: Modulation[];
  imprint: Imprint;
}

const PONDUS_TO_ARTICULATION: Record<PondusStyle, ArticulationType> = {
  restrained: "restrained",
  balanced: "balanced",
  expressive: "expressive",
  strict: "strict",
};

const ACCENTUS_TO_PHRASING: Record<AccentusStyle, PhrasingType> = {
  recitative: "recitative",
  lyrical: "lyrical",
  hymnic: "hymnic",
  solemn: "solemn",
};

function resolvePondus(input?: PondusInput): PondusOpts {
  return typeof input === "string" ? { style: input } : (input ?? {});
}

function resolveAccentus(input?: AccentusInput): AccentusOpts {
  return typeof input === "string" ? { style: input } : (input ?? {});
}

/**
 * Score builder (`tonus.notatio`). Parses a chant's GABC into a musical
 * IR — phrases, syllables, notes with tuned pitches, arsis/thesis
 * rhythm, metrics, imprint, and a tabula. Options: a temperamentum
 * (tuning), a pondus (articulation weight, style name or opts), and an
 * accentus (phrasing, style name or opts).
 * @throws Error on invalid Chant input or unparseable GABC.
 */
export function buildScore(chant: Chant, opts?: ScoreOpts): Score {
  if (!chant || typeof chant !== "object" || typeof (chant as Chant).gabc !== "string")
    throw new Error(
      "notatio needs a Chant with a gabc string — build one with tonus.cantus({ gabc })",
    );
  // The five knobs. When any is given they speak for the whole
  // interpretation, so a preset beside them is a contradiction, not a layer.
  const k = knobsOf(opts);
  if (hasKnobs(k)) {
    checkKnobs(k);
    if (typeof opts?.pondus === "string" || (opts?.pondus && typeof opts.pondus === "object") || opts?.accentus)
      throw new Error("notatio: the knobs (pondus as a number, modulatio, cadentia, expressio, modalitas) and the presets (pondus by name, accentus) cannot be mixed");
  }
  const knobs = hasKnobs(k) ? knobProfiles(k) : undefined;
  const pondus = resolvePondus(typeof opts?.pondus === "number" ? undefined : opts?.pondus);
  const accentus = resolveAccentus(opts?.accentus);
  const parsed = parseGABC(chant.gabc, {
    interpretation: knobs
      ? { articulation: "balanced", articulationOverrides: knobs.articulation }
      : {
          articulation: PONDUS_TO_ARTICULATION[pondus.style ?? "balanced"],
          articulationOverrides: pondus.overrides,
        },
  });
  const modeNum = chant.mode ? parseInt(chant.mode) || undefined : undefined;
  const scale = buildRatios({
    mode: opts?.temperamentum?.mode === "auto" ? (modeNum ?? 1) : (opts?.temperamentum?.mode ?? modeNum ?? 1),
    a4: opts?.temperamentum?.a4 ?? 440,
    transpose: opts?.temperamentum?.transpose ?? 0,
    // Carry the temperamentum's fully resolved scale — otherwise custom
    // and non-pythagorean tunings would be silently rebuilt as default.
    steps: opts?.temperamentum?.cents,
  });
  const ir = buildIR(parsed, chant, scale);
  const meta = computeMeta(ir, { mode: modeNum });

  // Cadence detection runs here, where the resolved mode is in hand. Pure
  // data — mirrors the arsis/thesis pass in ir.ts.
  const cadences = detectCadences(
    ir.phrases,
    meta.mode != null ? MODES.get(meta.mode) : undefined,
  );

  // The corpus join, on the same footing as MODES above: a resolved table
  // meeting detected data. The detector computes the key and stops, so this
  // is the one place a cadence learns how often its close closes, and how
  // much the corpus vouches for it. The species' finality where the species
  // is tabled, the genus' where only the genus is; below both floors null —
  // an uncatalogued close, not a close that never closes. Confidence rises
  // with the same evidence: a tabled species is a close the corpus knows by
  // name, a tabled genus one it knows by its landing.
  for (const cadence of cadences) {
    const species = cadentiaSpecies(cadence.species);
    const genus = cadentiaGenus(cadence.genus);
    cadence.finality = species?.finality ?? genus?.finality ?? null;
    const evidence = species ? 0.4 : genus ? 0.2 : 0;
    cadence.confidence = Math.round(Math.min(1, cadence.confidence + evidence) * 100) / 100;
  }

  // Modulation: where the tonal centre leans away from the home mode.
  const modulations = detectModulations(ir.phrases, meta.mode ?? undefined);

  const tabula = computeTabula(ir, {
    mode: meta.mode ?? undefined,
    // The office gate: a chant that names its liturgical type gets phrasing
    // even when its mode must be inferred — the gate computeTabula always had,
    // now actually fed.
    office: chant.office,
    a4Hz: opts?.temperamentum?.a4,
    transpose: opts?.temperamentum?.transpose,
    cadences,
    // Only pass phrasing when the caller asked for it, so the default
    // tabula shaping (mode-gated) is unchanged.
    interpretation: knobs
      ? { phrasing: "lyrical", phrasingOverrides: knobs.phrasing, modalInfluence: k?.modalitas }
      : opts?.accentus
        ? {
            phrasing: ACCENTUS_TO_PHRASING[accentus.style ?? "lyrical"],
            phrasingOverrides: accentus.overrides,
          }
        : undefined,
  });

  return {
    chant,
    phrases: ir.phrases,
    errors: ir.errors,
    tabula,
    metrics: computeMetrics(ir.phrases),
    cadences,
    modulations,
    imprint: computeImprint(ir.phrases, scale, {
      // Each cadence's resolution note (its last) is the strongest modal anchor.
      cadenceNotes: new Set(
        cadences.map((c) => {
          const [pi, si, ni] = c.notes[c.notes.length - 1]!;
          return `${pi}:${si}:${ni}`;
        }),
      ),
    }),
  };
}

export type { ParseError };
export type { Cadence, CadenceTarget, CadenceApproach, CadenceMotion, CadenceKeyEvent } from "./cadence.js";
// THE cadence family key, exported as a FUNCTION and not only a type: the
// census and the CADENTIAE miner need to key a flat tabula, and re-deriving
// the algorithm is exactly the fork this shared export forbids.
export { cadenceKeys, genusFromSteps, landingWord, nomenOf, glossOf, CADENTIA_LABEL } from "./cadence.js";
export type { Modulation } from "./modulation.js";
