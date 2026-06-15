// ---------------------------------------------------------------------------
// engines/harmonia/aspects — classify aspects by interval
// ---------------------------------------------------------------------------
// Consonance lives on the Interval itself (see temper/interval.ts); callers
// read it as `aspect.interval.consonance`.
import type { Aspect } from "../planet/types.js";
import type { Interval } from "../temper/interval.js";
import { classifyInterval } from "../temper/interval.js";
import type { VoicedBody } from "./voice.js";

export interface VoicedAspect extends Aspect {
  interval: Interval;
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
    results.push({ ...asp, interval });
  }
  return results;
}
