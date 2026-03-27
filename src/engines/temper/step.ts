// ---------------------------------------------------------------------------
// engines/temper/step — Step type and modal/Guidonian annotation
// ---------------------------------------------------------------------------
import { MODES } from "./modes.js";
import { lookupGuido } from "./guido.js";
import type { Scale } from "./scale.js";

export type Finger = "wrist" | "palm" | "thumb" | "index" | "middle" | "ring" | "pinky";
export type Region = "base" | "mid" | "tip" | "top";

export interface StepName {
  short: string;
  compound: string;
}

export interface StepVariant {
  hexachord: "durum" | "naturale" | "molle";
  solmization: string;
}

export interface Step {
  name: StepName | null;
  hexachord: "durum" | "naturale" | "molle" | null;
  solmization: string | null;
  variants: StepVariant[];
  hand: { finger: Finger; region: Region } | null;
  degree: number | null;
  role: "finalis" | "tenor" | "other" | null;
}

export function toStep(midi: number, scala?: Scale): Step {
  const mode = scala?.mode;
  const guido = lookupGuido(midi, mode);

  let degree: number | null = null;
  let role: Step["role"] = null;

  if (mode != null) {
    const modeData = MODES.get(mode);
    if (modeData) {
      const pc = ((midi % 12) + 12) % 12;
      const idx = modeData.scalePcs.indexOf(pc);
      degree = idx === -1 ? null : idx + 1;

      if (degree != null) {
        if (pc === modeData.final) role = "finalis";
        else if (pc === modeData.tenor) role = "tenor";
        else role = "other";
      }
    }
  }

  const name: StepName | null =
    guido.name && guido.compound ? { short: guido.name, compound: guido.compound } : null;

  const hand: Step["hand"] = guido.hand
    ? { finger: guido.hand.finger as Finger, region: guido.hand.region as Region }
    : null;

  return {
    name,
    hexachord: guido.hexachord,
    solmization: guido.solmization,
    variants: guido.mutations.map((m) => ({ hexachord: m.hexachord as StepVariant["hexachord"], solmization: m.solmization })),
    hand,
    degree,
    role,
  };
}
