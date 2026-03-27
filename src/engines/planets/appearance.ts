// mundana/appearance — magnitude, phase, elongation, apparent diameter
// Internal module — not exported from barrel. Use cosmos.ts API.
import { sinDeg, cosDeg, asinDeg, acosDeg, wrapAngle } from "./math.js";

// Apparent diameter at 1 AU (arcsec) — flat for Mercury/Venus/Sun, obj for others
const DIAMETERS_AT_1AU = new Map<string, number | { equ: number; pol: number }>([
  ["Mercury", 6.74],
  ["Venus",   16.92],
  ["Earth",   { equ: 17.59, pol: 17.53 }],
  ["Mars",    { equ: 9.36,  pol: 9.28 }],
  ["Jupiter", { equ: 196.94, pol: 185.08 }],
  ["Saturn",  { equ: 165.6, pol: 150.8 }],
  ["Uranus",  { equ: 65.8,  pol: 62.1 }],
  ["Neptune", { equ: 62.2,  pol: 60.9 }],
  ["Sun",     1919.26],
]);

const apparentDiam = (d0: number, dist: number): number => d0 / dist;

// ── Sun ──
export interface SunAppearance {
  elongation: 0;
  phaseAngle: 0;
  phase: 1;
  magnitude: -26.74;
  apparentDiameter: number;
}

export function sunAppearance(distAu: number): SunAppearance {
  return {
    elongation: 0,
    phaseAngle: 0,
    phase: 1,
    magnitude: -26.74,
    apparentDiameter: apparentDiam(1919.26, distAu),
  };
}

// ── Moon ──
export interface MoonAppearance {
  elongation: number;
  phaseAngle: number;
  phase: number;
  apparentDiameter: number;
}

function moonElongation(sunLon: number, moonLon: number, moonLat: number): number {
  const delta = wrapAngle(sunLon - moonLon);
  return acosDeg(cosDeg(delta) * cosDeg(moonLat));
}

export function moonAppearance(config: {
  sunLongitude: number;
  moonLongitude: number;
  moonLatitude: number;
  distEarthRadii: number;
}): MoonAppearance {
  const { sunLongitude, moonLongitude, moonLatitude, distEarthRadii } = config;
  const elong = moonElongation(sunLongitude, moonLongitude, moonLatitude);
  const phaseAngle = 180 - elong;
  const phase = (1 + cosDeg(phaseAngle)) / 2;
  return {
    elongation: elong,
    phaseAngle,
    phase,
    apparentDiameter: (1873.7 * 60) / distEarthRadii,
  };
}

// ── Planet ──
export interface PlanetAppearance {
  elongation: number;
  phaseAngle: number;
  phase: number;
  apparentDiameter: number | { equ: number; pol: number };
  magnitude: number;
}

function saturnRingTilt(los: number, las: number, J: number): number {
  const ir = 28.06;
  const Nr = 169.51 + 3.82e-5 * J;
  return asinDeg(sinDeg(las) * cosDeg(ir) - cosDeg(las) * sinDeg(ir) * sinDeg(los - Nr));
}

function planetMagnitude(
  name: string, r: number, R: number, FV: number,
  extras?: { los?: number; las?: number; J?: number }
): number {
  const base = 5 * Math.log10(r * R);
  switch (name) {
    case "Mercury": return -0.36 + base + 0.027 * FV + 2.2e-13 * FV ** 6;
    case "Venus":   return -4.34 + base + 0.013 * FV + 4.2e-7 * FV ** 3;
    case "Mars":    return -1.51 + base + 0.016 * FV;
    case "Jupiter": return -9.25 + base + 0.014 * FV;
    case "Saturn": {
      const B = saturnRingTilt(extras?.los ?? 0, extras?.las ?? 0, extras?.J ?? 0);
      return -9.0 + base + 0.044 * FV + (-2.6 * Math.abs(sinDeg(B)) + 1.2 * sinDeg(B) ** 2);
    }
    case "Uranus":  return -7.15 + base + 0.001 * FV;
    case "Neptune": return -6.9  + base + 0.001 * FV;
    default: return 0;
  }
}

export function planetAppearance(config: {
  name: string;
  heliocentricDistance: number;
  geocentricDistance: number;
  geocentricLongitude: number;
  geocentricLatitude: number;
  sunDistance: number;
  J: number;
}): PlanetAppearance {
  const { name, heliocentricDistance: r, geocentricDistance: R, sunDistance: s,
          geocentricLongitude, geocentricLatitude, J } = config;

  // elongation: angle at Earth between Sun and planet
  const elongation = acosDeg((s * s + R * R - r * r) / (2 * s * R));
  // phase angle: angle at planet between Sun and Earth
  const phaseAngle = acosDeg((r * r + R * R - s * s) / (2 * r * R));
  const phase = (1 + cosDeg(phaseAngle)) / 2;

  const d0 = DIAMETERS_AT_1AU.get(name);
  let apparentDiameter: number | { equ: number; pol: number } = 0;
  if (typeof d0 === "number") {
    apparentDiameter = apparentDiam(d0, R);
  } else if (d0) {
    apparentDiameter = { equ: apparentDiam(d0.equ, R), pol: apparentDiam(d0.pol, R) };
  }

  const magnitude = planetMagnitude(name, r, R, phaseAngle, {
    los: geocentricLongitude, las: geocentricLatitude, J,
  });

  return { elongation, phaseAngle, phase, apparentDiameter, magnitude };
}
