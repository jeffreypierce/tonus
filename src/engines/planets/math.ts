// ---------------------------------------------------------------------------
// engines/planets/math — pure trig/math helpers
// ---------------------------------------------------------------------------
const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

export const sinDeg = (d: number): number => Math.sin(d * DEG2RAD);
export const cosDeg = (d: number): number => Math.cos(d * DEG2RAD);
export const asinDeg = (v: number): number => Math.asin(Math.max(-1, Math.min(1, v))) * RAD2DEG;
export const acosDeg = (v: number): number => Math.acos(Math.max(-1, Math.min(1, v))) * RAD2DEG;
export const atan2Deg = (y: number, x: number): number => Math.atan2(y, x) * RAD2DEG;

// Solve Kepler's equation M = E - e*sin(E) for E (eccentric anomaly), all in degrees
export function kepler(M: number, e: number, tol = 1e-7): number {
  let E = M + RAD2DEG * e * sinDeg(M);
  for (let i = 0; i < 80; i++) {
    const dM = E - e * RAD2DEG * sinDeg(E) - M;
    const dE = -dM / (1 - e * cosDeg(E));
    E += dE;
    if (Math.abs(dE) < tol) break;
  }
  return E;
}

// Wrap angle to 0–360
export const wrapAngle = (deg: number): number => {
  const a = deg % 360;
  return a < 0 ? a + 360 : a;
};

// Signed angular difference (shortest arc, -180 to +180)
export function angleDelta(a: number, b: number): number {
  let d = wrapAngle(b - a);
  if (d > 180) d -= 360;
  return d;
}

// km → AU
export const toAu = (km: number): number => km * 6.6845871222684e-9;

// Ecliptic spherical → Cartesian (lon, lat in deg, dist in any unit)
export const toCartesian = (lon: number, lat: number, dist: number): [number, number, number] => [
  dist * cosDeg(lon) * cosDeg(lat),
  dist * sinDeg(lon) * cosDeg(lat),
  dist * sinDeg(lat),
];

// Cartesian → ecliptic spherical [lon, lat, dist]
export const toSpherical = (x: number, y: number, z: number): [number, number, number] => {
  const lon = atan2Deg(y, x);
  const lat = atan2Deg(z, Math.sqrt(x * x + y * y));
  const dist = Math.sqrt(x * x + y * y + z * z);
  return [lon, lat, dist];
};

// Rotate ecliptic Cartesian to equatorial by obliquity ε (deg)
export const toEquatorial = (x: number, y: number, z: number, eps: number): [number, number, number] => [
  x,
  y * cosDeg(eps) - z * sinDeg(eps),
  y * sinDeg(eps) + z * cosDeg(eps),
];
