// ---------------------------------------------------------------------------
// engines/voice/data/consortia — ensemble presets (roster + character, as data)
// ---------------------------------------------------------------------------
// Each consortium is a named roster of [persona, count] pairs. THE schola is
// the default. Adding one is a table row, never a code path.

import type { PersonaName } from "./personae.js";

export type ConsortiumName =
  | "schola"
  | "pueri"
  | "duo"
  | "cantor"
  | "mixtum";

/** A roster entry: a persona and how many of them sing. */
export type Voces = [PersonaName, number][];

export const CONSORTIA: Record<ConsortiumName, Voces> = {
  // THE default: monastic-size all-male body, tenors + baritones.
  schola: [
    ["tenor", 4],
    ["baritonus", 3],
  ],
  pueri: [["puer", 6]], // the choir-school sound
  duo: [
    ["tenor", 1],
    ["bassus", 1],
  ], // intimate, minimal dispersio
  cantor: [["tenor", 1]], // the soloist — a consortium of one
  mixtum: [
    ["puer", 2],
    ["altus", 2],
    ["tenor", 2],
    ["bassus", 2],
  ], // modern mixed choir, for A/B against the historical scholae
};
