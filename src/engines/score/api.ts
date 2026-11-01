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
import type { ParseError, Phrase as IRPhrase } from "./types.js";
import { hasKnobs, interpretKnobs, KNOB_NAMES, type Knobs } from "./knobs.js";
export type {
  Knobs, Knob, PondusFields, ModulatioFields, CadentiaFields, ExpressioFields,
} from "./knobs.js";

export interface ScoreOpts extends Knobs {
  temperamentum?: Temperamentum;
}

const OPTION_KEYS = new Set<string>(["temperamentum", ...KNOB_NAMES]);

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

/**
 * Score builder (`tonus.notatio`). Parses a chant's GABC into a musical
 * IR — phrases, syllables, notes with tuned pitches, arsis/thesis
 * rhythm, metrics, imprint, and a tabula. Options: a temperamentum
 * (tuning) and the four knobs (see knobs.ts), each a level or an object of
 * its fields.
 * @throws Error on invalid Chant input, unparseable GABC, an unknown option,
 *   or a knob out of range or given a field it does not own.
 */
export function buildScore(chant: Chant, opts?: ScoreOpts): Score {
  if (!chant || typeof chant !== "object" || typeof (chant as Chant).gabc !== "string")
    throw new Error(
      "notatio needs a Chant with a gabc string — build one with tonus.cantus({ gabc })",
    );
  for (const key of Object.keys(opts ?? {}))
    if (!OPTION_KEYS.has(key))
      throw new Error(`notatio: unknown option ${key} (options: ${[...OPTION_KEYS].join(", ")})`);
  // The four knobs. With none given the articulation is balanced and the
  // phrasing is left to the tabula's own gate (mode or office).
  const knobs = hasKnobs(opts) ? interpretKnobs(opts) : undefined;
  const parsed = parseGABC(chant.gabc, {
    interpretation: { articulation: "balanced", articulationOverrides: knobs?.articulation },
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
      ? { phrasing: "lyrical", phrasingOverrides: knobs.phrasing,  }
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
