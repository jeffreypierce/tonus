// mundana/position — Julian date, astro state, helio/geo position engine
// Internal module — not exported from barrel. Use cosmos.ts API.
import { sinDeg, cosDeg, atan2Deg, kepler, wrapAngle, toAu, toCartesian, toSpherical, toEquatorial } from "./math.js";
import { ORBITAL_ELEMENTS } from "./orbital.js";

const MS_PER_DAY = 86400000;

// Precomputed Earth radius in AU (used for Moon distance conversion)
const EARTH_ELEM = ORBITAL_ELEMENTS.get("Earth")!;
export const EARTH_RADIUS_AU = toAu(EARTH_ELEM.radius);

// ── Astro state ──
export interface AstroState {
  JD: number;  // Julian Date (UT)
  TT: number;  // Julian Date (Terrestrial Time)
  TS: number;  // Unix timestamp (ms)
  J: number;   // Julian centuries from J2000.0 (TT)
  T: number;   // Julian centuries
  eps: number; // mean obliquity of the ecliptic, deg
}

function meanObliquity(T: number): number {
  const eps0 = 23 + 26 / 60 + 21.406 / 3600;
  const sec =
    -46.836769 * T -
    0.0001831 * T ** 2 +
    0.0020034 * T ** 3 -
    0.000000576 * T ** 4 -
    0.0000000434 * T ** 5;
  return eps0 + sec / 3600;
}

export function getState(ts: number): AstroState {
  const JD = 2440587.5 + ts / MS_PER_DAY;
  const _T = (JD - 2451545) / 36525;
  const dT = 64.7 + 64.7 * _T - 0.6 * _T * _T; // seconds
  const TT = JD + dT / 86400;
  const J = TT - 2451545.0;
  const T = J / 36525;
  const eps = meanObliquity(T);
  return { JD, TT, TS: ts, J, T, eps };
}

// ── Position return shapes ──
export interface ComputedPos {
  geo: {
    x: number; y: number; z: number;
    lon: number; lat: number; dist: number;
    equatorial: { x: number; y: number; z: number; ra: number; dec: number; dist: number };
  };
}

export interface SunPos extends ComputedPos {
  helio: { lon: number; lat: number; dist: number };
  orbit: { L: number; M: number; omega: number; e: number };
}

export interface PlanetPos extends ComputedPos {
  helio: { x: number; y: number; z: number; lon: number; lat: number; dist: number };
}

export interface MoonPos extends ComputedPos {
  helio: Record<string, never>; // Moon has no meaningful heliocentric position
  geo: ComputedPos["geo"] & { distEarthRadii: number };
  distEarthRadii: number;
}

// ── Sun position ──
export function sunPos(state: AstroState): SunPos {
  const { J, eps } = state;
  const omega = 282.9404 + 4.70935e-5 * J;
  const e = 0.016709 - 1.151e-9 * J;
  const M = 356.047 + 0.9856002585 * J;
  const E = M + (180 / Math.PI) * e * sinDeg(M) * (1 + e * cosDeg(M));
  const xp = cosDeg(E) - e;
  const yp = Math.sqrt(1 - e * e) * sinDeg(E);
  const dist = Math.sqrt(xp * xp + yp * yp);
  const v = atan2Deg(yp, xp);
  const lambda = v + omega;
  const L = omega + M;

  const x = dist * cosDeg(lambda);
  const y = dist * sinDeg(lambda);
  const z = 0;
  const [xe, ye, ze] = toEquatorial(x, y, z, eps);
  const [ra, dec, rho] = toSpherical(xe, ye, ze);

  return {
    helio: { lon: wrapAngle(lambda), lat: 0, dist },
    orbit: { L: wrapAngle(L), M: wrapAngle(M), omega, e },
    geo: {
      x, y, z,
      lon: wrapAngle(lambda), lat: 0, dist,
      equatorial: { x: xe, y: ye, z: ze, ra: wrapAngle(ra), dec, dist: rho },
    },
  };
}

// ── Moon position ──
export function moonPos(state: AstroState, sun: SunPos): MoonPos {
  const { J, eps } = state;
  const Omega = wrapAngle(125.1228 - 0.0529538083 * J);
  const I = 5.1454;
  const omega = wrapAngle(318.0634 + 0.1643573223 * J);
  const a = 60.2666; // Earth radii
  const e = 0.0549;
  const M = wrapAngle(115.3654 + 13.0649929509 * J);
  const E = M + (180 / Math.PI) * e * sinDeg(M) * (1 + e * cosDeg(M));

  const xh = a * (cosDeg(E) - e);
  const yh = a * Math.sqrt(1 - e * e) * sinDeg(E);

  const cO = cosDeg(Omega), sO = sinDeg(Omega);
  const cw = cosDeg(omega), sw = sinDeg(omega);
  const cI = cosDeg(I), sI = sinDeg(I);

  const x = (cw * cO - sw * sO * cI) * xh + (-sw * cO - cw * sO * cI) * yh;
  const y = (cw * sO + sw * cO * cI) * xh + (-sw * sO + cw * cO * cI) * yh;
  const z = sw * sI * xh + cw * sI * yh;

  const [lonE, latE, distE] = toSpherical(x, y, z);

  const Lm = wrapAngle(Omega + omega + M);
  const Ms = sun.orbit.M;
  const Ls = sun.orbit.L;
  const D = wrapAngle(Lm - Ls);
  const F = wrapAngle(Lm - Omega);

  // Lunar perturbations
  const lonPerturb =
    -1.274 * sinDeg(M - 2 * D) + 0.658 * sinDeg(2 * D) - 0.186 * sinDeg(Ms) -
    0.059 * sinDeg(2 * M - 2 * D) - 0.057 * sinDeg(M - 2 * D + Ms) +
    0.053 * sinDeg(M + 2 * D) + 0.046 * sinDeg(2 * D - Ms) +
    0.041 * sinDeg(M - Ms) - 0.035 * sinDeg(D) - 0.031 * sinDeg(M + Ms) -
    0.015 * sinDeg(2 * F - 2 * D) + 0.011 * sinDeg(M - 4 * D);
  const latPerturb =
    -0.173 * sinDeg(F - 2 * D) - 0.055 * sinDeg(M - F - 2 * D) -
    0.046 * sinDeg(M + F - 2 * D) + 0.033 * sinDeg(F + 2 * D) +
    0.017 * sinDeg(2 * M + F);
  const distPerturb = -0.58 * cosDeg(M - 2 * D) - 0.46 * cosDeg(2 * D);

  const lon = wrapAngle(lonE + lonPerturb);
  const lat = latE + latPerturb;
  const rER = distE + distPerturb; // Earth radii

  const [xc, yc, zc] = toCartesian(lon, lat, rER);
  const xAu = xc * EARTH_RADIUS_AU;
  const yAu = yc * EARTH_RADIUS_AU;
  const zAu = zc * EARTH_RADIUS_AU;
  const distAu = rER * EARTH_RADIUS_AU;

  const [xe, ye, ze] = toEquatorial(xAu, yAu, zAu, eps);
  const [ra, dec, rho] = toSpherical(xe, ye, ze);

  return {
    helio: {},
    distEarthRadii: rER,
    geo: {
      x: xAu, y: yAu, z: zAu,
      lon, lat, dist: distAu,
      distEarthRadii: rER,
      equatorial: { x: xe, y: ye, z: ze, ra: wrapAngle(ra), dec, dist: rho },
    },
  };
}

// ── Planet position ──
export function planetPos(name: string, state: AstroState, sun: SunPos): PlanetPos {
  const body = ORBITAL_ELEMENTS.get(name);
  if (!body) throw new Error(`Unknown body: ${name}`);

  const { J, T, eps } = state;
  const oe = body.datasets;
  // Use higher-precision dataset (1800–2050) if in range, otherwise long-range dataset
  const dataset = J > -73048.5 && J < 18626.5 ? oe[1] : oe[0];
  const [a, e, I, L, wBar, Omega] = dataset.map(([x0, x1]) => x0 + x1 * T);

  const omega = wBar - Omega; // argument of periapsis
  let M = L - wBar;           // mean anomaly

  // Perturbation correction for outer planets
  if (oe[2]) {
    const [b, c, s, f] = oe[2];
    M += b * T * T + c * cosDeg(f * T) + s * sinDeg(f * T);
  }

  const E = kepler(M, e);

  const xh = a * (cosDeg(E) - e);
  const yh = a * Math.sqrt(1 - e * e) * sinDeg(E);

  const cO = cosDeg(Omega), sO = sinDeg(Omega);
  const cw = cosDeg(omega), sw = sinDeg(omega);
  const cI = cosDeg(I), sI = sinDeg(I);

  // Ecliptic heliocentric Cartesian
  const x = (cw * cO - sw * sO * cI) * xh + (-sw * cO - cw * sO * cI) * yh;
  const y = (cw * sO + sw * cO * cI) * xh + (-sw * sO + cw * cO * cI) * yh;
  const z = sw * sI * xh + cw * sI * yh;

  const [helioLon, helioLat, helioR] = toSpherical(x, y, z);

  // Geocentric (add Sun's geocentric position vector to flip to Earth-centered)
  const xg = x + sun.geo.x;
  const yg = y + sun.geo.y;
  const zg = z + sun.geo.z;
  const [geoLon, geoLat, geoDist] = toSpherical(xg, yg, zg);

  const [xe, ye, ze] = toEquatorial(xg, yg, zg, eps);
  const [ra, dec, rho] = toSpherical(xe, ye, ze);

  return {
    helio: { x, y, z, lon: wrapAngle(helioLon), lat: helioLat, dist: helioR },
    geo: {
      x: xg, y: yg, z: zg,
      lon: wrapAngle(geoLon), lat: geoLat, dist: geoDist,
      equatorial: { x: xe, y: ye, z: ze, ra: wrapAngle(ra), dec, dist: rho },
    },
  };
}