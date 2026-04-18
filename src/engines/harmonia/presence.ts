// ---------------------------------------------------------------------------
// engines/harmonia/presence — body visibility and motion weights
// ---------------------------------------------------------------------------
import type { Body, BodyName } from "../planet/types.js";

// Brightest to dimmest magnitude expected per body. Anything dimmer → presence 0.
// The Sun is fixed; others range within realistic visual magnitudes.
const MAX_MAGNITUDE = 6;   // naked-eye limit
const MIN_MAGNITUDE = -27; // Sun

// Per-body peak geocentric speeds (deg/day) — used to normalize motion to 0–1.
// Values are approximate empirical maxima.
const SPEED_MAX: Record<BodyName, number> = {
  Moon: 15,
  Mercury: 2.2,
  Venus: 1.3,
  Sun: 1.02,
  Mars: 0.8,
  Jupiter: 0.25,
  Saturn: 0.14,
  Earth: 1.02,
};

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

/**
 * Presence: how audible a body is, 0–1.
 * Combines magnitude (inverse, linear scale), elongation (low near Sun → combust),
 * and phase (fraction illuminated).
 */
export function computePresence(body: Body): number {
  if (body.name === "Sun") return 1;
  // Earth is a listener in most doctrinae; individual harmonia may override
  if (body.name === "Earth") return 0;

  // Magnitude → 0–1 (brighter = higher)
  const magNorm = clamp01(
    (MAX_MAGNITUDE - body.magnitude) / (MAX_MAGNITUDE - MIN_MAGNITUDE),
  );

  // Elongation: low → combust. Linear fall-off below 15°.
  const elongFactor = clamp01(body.elongation / 15);

  // Phase: already 0–1 for planets/moon
  const phaseFactor = clamp01(body.phase);

  // Weighted combination; magnitude dominates
  return clamp01(0.6 * magNorm + 0.25 * elongFactor + 0.15 * phaseFactor);
}

/**
 * Motion: normalized absolute angular speed, 0–1.
 * Retrograde treated as motion (sign ignored); the retrograde flag is separate.
 */
export function computeMotion(body: Body): number {
  const max = SPEED_MAX[body.name] ?? 1;
  return clamp01(Math.abs(body.speed) / max);
}
