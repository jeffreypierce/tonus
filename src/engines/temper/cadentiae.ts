// ---------------------------------------------------------------------------
// engines/temper/cadentiae — the mode's reading of the corpus cadence table
// ---------------------------------------------------------------------------
// CADENTIAE (data/cadentiae.ts) is baked: every phrase-end in the sung corpus,
// keyed on the one diatonic key (score/cadence.ts), at two levels — genus (the
// landing) and species (the cadence). This module DERIVES from it at call time,
// so nothing is stored twice: the mode object's trimmed set, and the share a
// label prints. Both read the same function, so the page and the API cannot
// drift.
import {
  CADENTIAE,
  CADENTIAE_FLOOR,
  CADENTIAE_POPULATION,
  type CadentiaGenus,
  type CadentiaSpecies,
} from "../../data/cadentiae.js";
import type { ModeData } from "./data/modes.js";
import { nomenOf, type CadenceMotion } from "../score/cadence.js";

export type CadentiaRole = "finalis" | "tenor" | "alia";

/** One genus of the mode's trimmed set. */
export interface ModusGenus {
  /** The genus key, "cadens @0". */
  key: string;
  /** The two-word name, "cadens finalis": the motion and the landing's word
   *  in this mode. The printed form; `key` stays the key. */
  nomen: string;
  motion: CadenceMotion;
  /** The landing in signed letter steps from the final: 0 the final, -1 below, +4 the fifth. */
  degree: number;
  /** The mode's reading of the degree. */
  role: CadentiaRole;
  /** The mode's phrase-ends landing here. */
  n: number;
  /** `n` over the mode's ends. */
  share: number;
  /** Share of those at a final close, in this mode. */
  finality: number;
  /** The commonest species under it IN THIS MODE, up to three, commonest first. */
  species: Array<{ key: string; tail: number[]; n: number; share: number; finality: number }>;
}

/** What `modus(n).cadences` returns: the top five genera by in-mode share. */
export interface ModusCadentiae {
  /** The mode's phrase-ends — the denominator. */
  ends: number;
  /** Share of the mode's ends the five genera account for. */
  covered: number;
  genera: ModusGenus[];
}

/** Five is a fixed count, not a threshold: measured at five, six of the eight
 *  modes' tenors appear in their own set; at four, modes 4, 5 and 6 lost
 *  theirs. Modes 3 and 8 stay loose — their tenor closes rank 18th and 8th. */
export const MODUS_GENERA = 5;
const MODUS_SPECIES = 3;

/** A genus' occurrences in one mode must reach this before its in-mode share
 *  is read. Under it the figure is a rumour: one or two chants deciding a
 *  percentage that reads like a measurement. */
export const SHARE_FLOOR = 10;

/**
 * The share a label prints for a genus: how often this landing ends a phrase
 * in THIS mode. Falls back to the corpus share where the mode is unknown or the
 * in-mode count too thin to divide — the same KIND of number, a frequency.
 * null for a genus below the catalogue's floor: rarer than anything tabled.
 */
export function genusShare(genus: CadentiaGenus | undefined, mode?: number): number | null {
  if (!genus) return null;
  if (mode == null) return genus.share;
  const inMode = genus.modes[String(mode)] ?? 0;
  const modeEnds = CADENTIAE_POPULATION.byMode[String(mode)] ?? 0;
  if (inMode < SHARE_FLOOR || !modeEnds) return genus.share;
  return inMode / modeEnds;
}

/** The genus' lift — its in-mode share against its corpus share: how
 *  DISTINCTIVE a close is of the mode rather than how common. null where the
 *  in-mode share itself would not print. */
export function genusLift(genus: CadentiaGenus | undefined, mode?: number): number | null {
  if (!genus || mode == null || !genus.share) return null;
  const inMode = genus.modes[String(mode)] ?? 0;
  const modeEnds = CADENTIAE_POPULATION.byMode[String(mode)] ?? 0;
  if (inMode < SHARE_FLOOR || !modeEnds) return null;
  return (inMode / modeEnds) / genus.share;
}

/** Whether a species clears the catalogue's floor IN the mode — the condition
 *  under which the page prints it (plan-cadentiae §3). */
export function speciesTabledInMode(species: CadentiaSpecies | undefined, mode?: number): boolean {
  if (!species || mode == null) return false;
  return (species.modes[String(mode)] ?? 0) >= CADENTIAE_FLOOR;
}

/** The mode's reading of a landing degree: the pitch class it names, against
 *  the final and the tenor. `scalePcs` starts on the final. */
export function degreeRole(degree: number, mode: ModeData): CadentiaRole {
  const pc = mode.scalePcs[((degree % 7) + 7) % 7]!;
  if (pc === mode.final) return "finalis";
  if (pc === mode.tenor) return "tenor";
  return "alia";
}

/**
 * The mode's trimmed set: the top MODUS_GENERA genera by in-mode share, each
 * with its top MODUS_SPECIES species in the mode. Derived from CADENTIAE at
 * call — the full table stays reachable for anyone who wants all of it.
 */
export function modusCadentiae(mode: ModeData): ModusCadentiae {
  const m = String(mode.mode);
  const ends = CADENTIAE_POPULATION.byMode[m] ?? 0;
  const inMode = (x: { modes: Record<string, number> }) => x.modes[m] ?? 0;
  const closesIn = (x: { closes: Record<string, number> }) => x.closes[m] ?? 0;
  const finality = (x: CadentiaGenus | CadentiaSpecies) =>
    inMode(x) ? Number((closesIn(x) / inMode(x)).toFixed(4)) : 0;
  const share = (n: number) => (ends ? Number((n / ends).toFixed(4)) : 0);

  const genera = CADENTIAE
    .filter((g) => inMode(g) > 0)
    .sort((a, b) => inMode(b) - inMode(a) || (a.key < b.key ? -1 : 1))
    .slice(0, MODUS_GENERA)
    .map((g): ModusGenus => ({
      key: g.key,
      nomen: nomenOf(g.motion, g.degree, degreeRole(g.degree, mode)),
      motion: g.motion,
      degree: g.degree,
      role: degreeRole(g.degree, mode),
      n: inMode(g),
      share: share(inMode(g)),
      finality: finality(g),
      species: g.species
        .filter((s) => inMode(s) > 0)
        .sort((a, b) => inMode(b) - inMode(a) || (a.key < b.key ? -1 : 1))
        .slice(0, MODUS_SPECIES)
        .map((s) => ({
          key: s.key,
          tail: s.tail,
          n: inMode(s),
          share: share(inMode(s)),
          finality: finality(s),
        })),
    }));

  const covered = genera.reduce((a, g) => a + g.n, 0);
  return { ends, covered: share(covered), genera };
}
