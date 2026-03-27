// ---------------------------------------------------------------------------
// engines/planets/aspects — angular aspect detection
// ---------------------------------------------------------------------------
import { wrapAngle } from "./math.js";
import type { Aspect } from "./types.js";

const ASPECTS: [Aspect["type"], number][] = [
  ["conjunction", 0],
  ["sextile",     60],
  ["square",      90],
  ["trine",       120],
  ["opposition",  180],
];

const DEFAULT_ORB = 8;

function separation(a: number, b: number): number {
  const d = Math.abs(wrapAngle(b - a));
  return d > 180 ? 360 - d : d;
}

export function detectAspects(
  bodies: Record<string, number>,
  opts?: { orbLimit?: number },
): Aspect[] {
  const orbLimit = opts?.orbLimit ?? DEFAULT_ORB;
  const names = Object.keys(bodies);
  const results: Aspect[] = [];

  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const sep = separation(bodies[names[i]], bodies[names[j]]);

      for (const [type, angle] of ASPECTS) {
        const orb = Math.abs(sep - angle);
        if (orb <= orbLimit) {
          results.push({
            type,
            bodies: [names[i], names[j]],
            angle: sep,
            orb,
            strength: Math.max(0, 1 - orb / orbLimit),
          });
        }
      }
    }
  }

  results.sort((a, b) => b.strength - a.strength || a.type.localeCompare(b.type));
  return results;
}
