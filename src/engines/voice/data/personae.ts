// ---------------------------------------------------------------------------
// engines/voice/data/personae — single-voice presets (bundles over VoxParams)
// ---------------------------------------------------------------------------
// Each persona is just a VoxParams bundle with a citation-backed tract/nisus/
// cantoris profile. None is special-cased in code; adding one is a table row.

import type { VoxParams } from "../types.js";

export type PersonaName =
  | "bassus"
  | "baritonus"
  | "tenor"
  | "contratenor"
  | "altus"
  | "superius"
  | "puer";

/** A persona is a full or partial slider bundle; unset axes fall to defaults. */
export type Persona = Partial<VoxParams>;

/** Neutral centre of the slider bank — the resolution floor. */
export const DEFAULTS: VoxParams = {
  tract: 1.0,
  aetas: 0.35,
  fatigatio: 0.0,
  cantoris: 0.5,
  nisus: 0.5,
  latinitas: "romana",
};

// Tracts follow the plan's register table; cantoris/nisus give each part its
// carrying and weight tendencies (the chant workhorse tenor carries strongest).
export const PERSONAE: Record<PersonaName, Persona> = {
  bassus: { tract: 1.22, cantoris: 0.4, nisus: 0.6 }, // drone floor
  baritonus: { tract: 1.12 },
  tenor: { tract: 1.02, cantoris: 0.7 }, // chant workhorse; strong cantoris
  contratenor: { tract: 0.98, nisus: 0.3, cantoris: 0.55 }, // falsettist, heady
  altus: { tract: 0.94 },
  superius: { tract: 0.9, cantoris: 0.6 }, // highest adult voice; open, carrying
  puer: { tract: 0.82, aetas: 0.12, nisus: 0.45 }, // boy treble; bright, young
};

/**
 * vetus — the elder cantor, a MODIFIER persona. Composes onto any part by
 * raising aetas (drift, loosened Q) and letting fatigue creep. Applied as an
 * override, not a standalone base.
 */
export const VETUS: Persona = { aetas: 0.85, fatigatio: 0.25 };
