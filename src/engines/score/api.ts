// ---------------------------------------------------------------------------
// engines/score/api — score builder and interpretation profiles
// ---------------------------------------------------------------------------
import { parseGABC } from "./parse.js";
import { buildIR } from "./ir.js";
import { buildRatios } from "../temper/scale.js";
import { computeMeta } from "./meta.js";
import { computeImprint, type Imprint } from "../imprint.js";
import { computeProsody, type Prosody } from "./prosody.js";
import { detectCadences, type Cadence } from "./cadence.js";
import { detectModulations, type Modulation } from "./modulation.js";
import { detectFormulas, type FormulaMatch } from "./formula.js";
import { computeTabula, type ChantTabulaRow } from "./tabula.js";
import { MODES } from "../temper/modes.js";
import { toSvg, type SvgOpts } from "./emitters/svg.js";
import type { Chant } from "../chant/types.js";
import type { Temperamentum } from "../temper/api.js";
import type {
  ArticulationProfile,
  ArticulationType,
  PhrasingProfile,
  PhrasingType,
  ParseError,
  Phrase as IRPhrase,
} from "./types.js";

export type PondusStyle = "restrained" | "balanced" | "expressive" | "strict";
export type AccentusStyle = "recitative" | "lyrical" | "hymnic" | "solemn";

export interface PondusOpts {
  style?: PondusStyle;
  overrides?: Partial<ArticulationProfile>;
}

export interface AccentusOpts {
  style?: AccentusStyle;
  overrides?: Partial<PhrasingProfile>;
}

export type PondusInput = PondusStyle | PondusOpts;
export type AccentusInput = AccentusStyle | AccentusOpts;

export interface ScoreOpts {
  temperamentum?: Temperamentum;
  pondus?: PondusInput;
  accentus?: AccentusInput;
}

export interface Score {
  chant: Chant;
  phrases: IRPhrase[];
  errors: ParseError[];
  tabula: ChantTabulaRow[];
  prosody: Prosody;
  /** Mode-specific cadence at each phrase-ending divisio. */
  cadences: Cadence[];
  /** Passages where the tonal centre leans away from the home mode. */
  modulations: Modulation[];
  /** Apel standard-phrase formulae each phrase realises (Tier-1 genres only). */
  formulas: FormulaMatch[];
  imprint: Imprint;
  /**
   * Render the score as a self-contained SVG string — a square-note chant staff
   * with SMuFL glyphs (single line; MVP). See docs/score.md.
   */
  svg(opts?: SvgOpts): string;
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
 * rhythm, prosody, imprint, and a tabula. Options: a temperamentum
 * (tuning), a pondus (articulation weight, style name or opts), and an
 * accentus (phrasing, style name or opts).
 * @throws Error on invalid Chant input or unparseable GABC.
 */
export function buildScore(chant: Chant, opts?: ScoreOpts): Score {
  const pondus = resolvePondus(opts?.pondus);
  const accentus = resolveAccentus(opts?.accentus);
  const parsed = parseGABC(chant.gabc, {
    interpretation: {
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

  // Cadence detection runs here, where the resolved mode (and its cadence
  // figures) is in hand. Pure data — mirrors the arsis/thesis pass in ir.ts.
  const cadences = detectCadences(
    ir.phrases,
    meta.mode != null ? MODES.get(meta.mode) : undefined,
  );

  // Modulation: where the tonal centre leans away from the home mode.
  const modulations = detectModulations(ir.phrases, meta.mode ?? undefined);

  // Melodic formulae: which of Apel's standard phrases each phrase realises.
  // Keyed by genre × mode; only the Tier-1 tabulatable genres have a catalogue.
  const formulas = detectFormulas(
    ir.phrases,
    meta.mode != null ? MODES.get(meta.mode) : undefined,
    chant.office,
  );

  const tabula = computeTabula(ir, {
    mode: meta.mode ?? undefined,
    a4Hz: opts?.temperamentum?.a4,
    transpose: opts?.temperamentum?.transpose,
    cadences,
    // Only pass phrasing when the caller asked for it, so the default
    // tabula shaping (mode-gated) is unchanged.
    interpretation: opts?.accentus
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
    prosody: computeProsody(ir.phrases),
    cadences,
    modulations,
    formulas,
    imprint: computeImprint(ir.phrases, scale, {
      // Each cadence's resolution note (its last) is the strongest modal anchor.
      cadenceNotes: new Set(
        cadences.map((c) => {
          const [pi, si, ni] = c.notes[c.notes.length - 1]!;
          return `${pi}:${si}:${ni}`;
        }),
      ),
    }),
    svg(emitOpts?: SvgOpts): string {
      return toSvg(tabula, chant, emitOpts);
    },
  };
}

export type { ParseError };
export type { Cadence, CadenceTarget, CadenceApproach } from "./cadence.js";
export type { Modulation } from "./modulation.js";
export type { FormulaMatch } from "./formula.js";
export type { Formula, FormulaSlot } from "./data/formulas.js";
export type { SvgOpts } from "./emitters/svg.js";
