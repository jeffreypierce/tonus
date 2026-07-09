// ---------------------------------------------------------------------------
// engines/voice/chorus — the Chorus context builder (a seeded ensemble of Vox)
// ---------------------------------------------------------------------------
// buildChorus expands a consortium roster into individual cantors, each a Vox
// with his own character baked in. The character is COMPUTED, not configured:
// a cantor's sliders set the ENVELOPE of his deviation (an old voice drifts
// flatter, a treble rushes), and the seed only places him WITHIN his own
// envelope. "This singer sounds like this" — forever, for that seed.
//
// Deviation magnitudes (a few cents of tuning scatter, a few ms of timing) are
// grounded in choral-ensemble measurement (Ternström). The specific per-slider
// couplings on top are invented — proposed, not measured.

import type { Vowel, Formant, Locus } from "./types.js";
import { buildVoice, type Vox } from "./api.js";
import { PERSONAE, type Persona, type PersonaName } from "./data/personae.js";
import { CONSORTIA, type ConsortiumName, type Voces } from "./data/consortia.js";
import { hashName, mulberry32, jitter } from "./random.js";

export interface ChorusOpts extends Persona {
  seed?: number;
  /** A custom roster, overriding the named consortium. */
  voces?: Voces;
}

/** One cantor's computed deviation from the nominal voice. */
export interface Dispersio {
  index: number;
  persona: string;
  detuneCents: number; // tuning scatter, grounded in Ternström-class spread
  timingMs: number; // onset laziness (+) or eagerness (−)
}

export interface Chorus {
  /** Total number of singers. */
  size: number;
  /** One cantor as a Vox, his character baked in. */
  cantor(index: number): Vox;
  /** Every cantor's computed deviation sheet (output only). */
  dispersio(): Dispersio[];
  /** Per-cantor formant tables at a vowel. */
  formantes(vowel: Vowel | Locus): Formant[][];
  /** The SUMMED ensemble spectrum — every cantor's detune folded in. */
  spectrum(f0: number, vowel: Vowel | Locus, nHarmonics?: number): number[];
}

// ── Roster expansion ──

function expandRoster(voces: Voces): PersonaName[] {
  const out: PersonaName[] = [];
  for (const [persona, count] of voces) {
    if (!PERSONAE[persona]) {
      throw new Error(`chorus: unknown persona "${persona}" in roster`);
    }
    for (let i = 0; i < count; i++) out.push(persona);
  }
  if (out.length === 0) throw new Error("chorus: empty roster");
  return out;
}

function resolveRoster(input?: ConsortiumName | ChorusOpts, opts?: ChorusOpts): {
  roster: PersonaName[];
  overrides: Persona;
  seed: number;
} {
  let voces: Voces | undefined;
  let bag: ChorusOpts = {};

  if (typeof input === "string") {
    voces = CONSORTIA[input];
    if (!voces) {
      throw new Error(
        `chorus: unknown consortium "${input}" — try ${Object.keys(CONSORTIA).join(", ")}`,
      );
    }
    bag = opts ?? {};
  } else {
    bag = input ?? {};
  }

  voces = bag.voces ?? voces;
  if (!voces) throw new Error("chorus: no consortium or voces roster given");

  const { seed, voces: _v, ...overrides } = bag;
  return { roster: expandRoster(voces), overrides, seed: seed ?? 0 };
}

// ── Per-cantor character ──

/**
 * A cantor's deviation envelope, from his own sliders, then a seeded draw
 * within it. Older and more tired → wider tuning scatter and lazier onset;
 * a boy treble (low aetas) rushes. Detune in cents, timing in ms.
 */
function deviate(params: Vox["params"], seed: number, index: number): Dispersio {
  const rng = mulberry32((seed ^ hashName(`cantor-${index}`)) >>> 0);

  // Envelope widths grow with age and fatigue; a young voice rushes (negative
  // timing bias). Magnitudes are Ternström-order (single-digit cents/ms).
  const detuneWidth = 3 + params.aetas * 4 + params.fatigatio * 5;
  const timingWidth = 8 + params.fatigatio * 12;
  const rushBias = (0.35 - params.aetas) * 10; // young → eager, old → lazy

  return {
    index,
    persona: "",
    detuneCents: jitter(rng, detuneWidth),
    timingMs: rushBias + jitter(rng, timingWidth),
  };
}

// ── Builder ──

/**
 * Build an ensemble (`chorus`). Accepts a consortium name (`"schola"`) or an
 * options bag with a custom `voces` roster, plus an explicit `seed` and any
 * slider overrides applied to every cantor. Two identical seeds produce
 * byte-identical choirs.
 * @throws on an unknown consortium/persona or an empty roster.
 */
export function buildChorus(
  input?: ConsortiumName | ChorusOpts,
  opts?: ChorusOpts,
): Chorus {
  const { roster, overrides, seed } = resolveRoster(input, opts);

  // Build each cantor once; his deviation is computed and stored beside him.
  const cantors = roster.map((persona, index) => {
    const vox = buildVoice(persona, overrides);
    const dev = deviate(vox.params, seed, index);
    dev.persona = persona;
    return { vox, dev };
  });

  return {
    size: cantors.length,

    cantor(index: number): Vox {
      const c = cantors[index];
      if (!c) throw new Error(`chorus: no cantor ${index} (size ${cantors.length})`);
      return c.vox;
    },

    dispersio(): Dispersio[] {
      return cantors.map((c) => ({ ...c.dev }));
    },

    formantes(vowel: Vowel | Locus): Formant[][] {
      return cantors.map((c) => c.vox.formantes(vowel));
    },

    spectrum(f0: number, vowel: Vowel | Locus, nHarmonics = 40): number[] {
      // Each cantor sings at his own detuned f0; sum the harmonic amplitudes.
      const sum = new Array<number>(nHarmonics).fill(0);
      for (const c of cantors) {
        const detuned = f0 * Math.pow(2, c.dev.detuneCents / 1200);
        const spec = c.vox.spectrum(detuned, vowel, nHarmonics);
        for (let i = 0; i < nHarmonics; i++) sum[i]! += spec[i]!;
      }
      return sum;
    },
  };
}
