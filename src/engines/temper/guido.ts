// ---------------------------------------------------------------------------
// engines/temper/guido — Guidonian hexachord lookups
// ---------------------------------------------------------------------------

import { MODES } from "./modes.js";
import { GUIDONIAN_DATA } from "./data/guido.js";
import type { GuidonianEntry } from "./data/guido.js";
import type { Finger, Region } from "./step.js";

export type { GuidonianVariant, GuidonianEntry } from "./data/guido.js";

// Look up the gamut entry for an exact MIDI number
function lookupExact(midi: number): GuidonianEntry | undefined {
  return GUIDONIAN_DATA.get(midi);
}

// Look up by pitch class, picking the entry closest in pitch to the given MIDI
function lookupByPc(midi: number): GuidonianEntry | undefined {
  const pc = ((midi % 12) + 12) % 12;
  let best: GuidonianEntry | undefined;
  let bestDist = Infinity;
  for (const [key, entry] of GUIDONIAN_DATA) {
    if (key % 12 === pc) {
      const dist = Math.abs(key - midi);
      if (dist < bestDist) { bestDist = dist; best = entry; }
    }
  }
  return best;
}

// ── Public ──

// Build a Step's guidonian fields for a given MIDI note and optional mode.
// All fields are always present; nulled when out of gamut or context missing.
export function lookupGuido(
  midi: number,
  mode?: number,
): {
  name: string | null;
  nomen: string | null;
  hexachord: "durum" | "naturale" | "molle" | null;
  solmization: string | null;
  mutations: { hexachord: string; solmization: string }[];
  hand: { finger: Finger; region: Region } | null;
} {
  const entry = lookupExact(midi) ?? lookupByPc(midi);

  if (!entry) {
    return { name: null, nomen: null, hexachord: null, solmization: null, mutations: [], hand: null };
  }

  // Determine primary hexachord — prefer mode's hexachord if available
  const modeHex = mode != null ? MODES.get(mode)?.hexachords[0] : undefined;
  const primary =
    (modeHex && entry.variants.find((v) => v.hexachord === modeHex)) ??
    entry.variants.find((v) => v.hexachord === "naturale") ??
    entry.variants[0];

  return {
    name: entry.name[0],
    nomen: entry.name[1],
    hexachord: primary?.hexachord ?? null,
    solmization: primary?.solmization ?? null,
    mutations: entry.variants.map((v) => ({ hexachord: v.hexachord, solmization: v.solmization })),
    hand: entry.hand,
  };
}
