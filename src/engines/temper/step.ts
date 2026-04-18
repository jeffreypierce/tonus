// ---------------------------------------------------------------------------
// engines/temper/step — Step type and modal/Guidonian annotation
// ---------------------------------------------------------------------------
import { MODES } from "./modes.js";
import { lookupGuido } from "./guido.js";
import { SHARP_SPELLING, FLAT_SPELLING, PREFER_FLAT_PCS } from "./data/constants.js";
import type { Scale } from "./scale.js";

export type Finger = "wrist" | "palm" | "thumb" | "index" | "middle" | "ring" | "pinky";
export type Region = "base" | "mid" | "tip" | "top";

export interface StepVariant {
  hexachord: "durum" | "naturale" | "molle";
  solmization: string;
}

export interface Step {
  pc: number;
  name: string;                                     // "d" (Guidonian) or SPN letter ("D") fallback
  compound: string | null;                          // "Delasolre" or null (out of gamut)
  hexachord: "durum" | "naturale" | "molle" | null;
  solmization: string | null;
  variants: StepVariant[];
  hand: { finger: Finger; region: Region } | null;
  degree: number | null;                            // 1–7 diatonic degree in mode
  role: "finalis" | "tenor" | "other" | null;
}

// SPN letter fallback (e.g. "D" for D4, pc 2) for out-of-gamut pitches.
function spnLetterForPc(pc: number): string {
  const useFlat = PREFER_FLAT_PCS.has(pc);
  const sp = useFlat ? FLAT_SPELLING[pc]! : SHARP_SPELLING[pc]!;
  return sp.step;
}

export function toStep(midi: number, scala?: Scale): Step {
  const mode = scala?.mode;
  const guido = lookupGuido(midi, mode);

  const pc = ((midi % 12) + 12) % 12;
  let degree: number | null = null;
  let role: Step["role"] = null;

  if (mode != null) {
    const modeData = MODES.get(mode);
    if (modeData) {
      const idx = modeData.scalePcs.indexOf(pc);
      degree = idx === -1 ? null : idx + 1;

      if (degree != null) {
        if (pc === modeData.final) role = "finalis";
        else if (pc === modeData.tenor) role = "tenor";
        else role = "other";
      }
    }
  }

  const name = guido.name ?? spnLetterForPc(pc);

  const hand: Step["hand"] = guido.hand
    ? { finger: guido.hand.finger as Finger, region: guido.hand.region as Region }
    : null;

  return {
    pc,
    name,
    compound: guido.compound,
    hexachord: guido.hexachord,
    solmization: guido.solmization,
    variants: guido.mutations.map((m) => ({
      hexachord: m.hexachord as StepVariant["hexachord"],
      solmization: m.solmization,
    })),
    hand,
    degree,
    role,
  };
}
