// ---------------------------------------------------------------------------
// engines/harmonia/aspects — classify aspects by interval and consonance
// ---------------------------------------------------------------------------
import type { Aspect } from "../planet/types.js";
import type { Interval } from "../temper/interval.js";
import { classifyInterval } from "../temper/interval.js";
import type { VoicedBody } from "./voice.js";

export type Consonance = "perfect" | "imperfect" | "dissonant";

export interface VoicedAspect extends Aspect {
  interval: Interval;
  consonance: Consonance;
}

const PERFECT = new Set(["P1", "P5", "P8"]);
const IMPERFECT = new Set(["m3", "M3", "m6", "M6"]);

function classifyConsonance(intervalClass: string): Consonance {
  if (PERFECT.has(intervalClass)) return "perfect";
  if (IMPERFECT.has(intervalClass)) return "imperfect";
  return "dissonant";
}

export function voiceAspects(
  aspects: Aspect[],
  voiced: VoicedBody[],
): VoicedAspect[] {
  const byName = new Map<string, VoicedBody>(voiced.map((v) => [v.name, v]));
  const results: VoicedAspect[] = [];
  for (const asp of aspects) {
    const a = byName.get(asp.bodies[0]);
    const b = byName.get(asp.bodies[1]);
    if (!a || !b) continue;
    const interval = classifyInterval(a.nota.pitch.midi, b.nota.pitch.midi);
    results.push({
      ...asp,
      interval,
      consonance: classifyConsonance(interval.class),
    });
  }
  return results;
}
