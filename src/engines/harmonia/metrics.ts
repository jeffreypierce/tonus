// ---------------------------------------------------------------------------
// engines/harmonia/metrics — aggregate harmonia metrics
// ---------------------------------------------------------------------------
import type { Scale } from "../temper/scale.js";
import type { VoicedBody } from "./voice.js";
import type { VoicedAspect } from "./aspects.js";
import { computeAttractors, type Attractor } from "../summa/attractors.js";

const SILENT_THRESHOLD = 0.1;

const CONSONANCE_WEIGHT: Record<"perfect" | "imperfect" | "dissonant", number> = {
  perfect: 1.0,
  imperfect: 0.5,
  dissonant: 0,
};

export interface HarmoniaMetrics {
  pcDistribution: Record<number, number>;
  attractors: Attractor[];
  consonanceIndex: number;
  retrogradeCount: number;
  silentCount: number;
}

export function computeHarmoniaMetrics(
  bodies: VoicedBody[],
  aspects: VoicedAspect[],
  scale: Scale,
): HarmoniaMetrics {
  // PC distribution weighted by presence
  const pcWeight = new Array<number>(12).fill(0);
  let totalPresence = 0;
  for (const b of bodies) {
    const pc = b.nota.pitch.pc;
    pcWeight[pc] += b.presence;
    totalPresence += b.presence;
  }
  const pcDistribution: Record<number, number> = {};
  for (let pc = 0; pc < 12; pc++) {
    pcDistribution[pc] = totalPresence > 0 ? pcWeight[pc] / totalPresence : 0;
  }

  const attractors = computeAttractors(pcDistribution, scale);

  // Consonance index: weighted sum of aspect strengths / total strength
  let weighted = 0;
  let totalStrength = 0;
  for (const a of aspects) {
    weighted += a.strength * CONSONANCE_WEIGHT[a.consonance];
    totalStrength += a.strength;
  }
  const consonanceIndex = totalStrength > 0 ? weighted / totalStrength : 0;

  const retrogradeCount = bodies.filter((b) => b.retrograde).length;
  const silentCount = bodies.filter((b) => b.presence < SILENT_THRESHOLD).length;

  return { pcDistribution, attractors, consonanceIndex, retrogradeCount, silentCount };
}
