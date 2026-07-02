// ---------------------------------------------------------------------------
// engines/planet/planet — planetary snapshot builder
// ---------------------------------------------------------------------------
import { angleDelta, wrapAngle } from "./math.js";
import { getState, sunPos, moonPos, planetPos, EARTH_RADIUS_AU } from "./position.js";
import { sunAppearance, moonAppearance, planetAppearance } from "./appearance.js";
import { detectAspects } from "./aspects.js";
import { ORBITAL_ELEMENTS } from "./orbital.js";
import type { Body, BodyName, PlanetName, Cosmos, CosmosQuery } from "./types.js";
import { latinName } from "./types.js";

const MS_PER_DAY = 86400000;
const ALL_BODIES: BodyName[] = ["Sun", "Moon", "Mercury", "Venus", "Earth", "Mars", "Jupiter", "Saturn"];

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
] as const;

const zodiac = (lon: number): number => Math.floor(wrapAngle(lon) / 30) % 12;
const sign = (lon: number): string => SIGNS[zodiac(lon)];

function computeSpeed(geoLon: number, name: string, ts: number): number {
  const nextState = getState(ts + MS_PER_DAY);
  const nextSun = sunPos(nextState);
  let nextLon: number;
  if (name === "Sun") {
    nextLon = nextSun.geo.lon;
  } else if (name === "Moon") {
    nextLon = moonPos(nextState, nextSun).geo.lon;
  } else {
    nextLon = planetPos(name, nextState, nextSun).geo.lon;
  }
  return angleDelta(geoLon, nextLon);
}

function buildSun(ts: number): Body {
  const state = getState(ts);
  const pos = sunPos(state);
  const app = sunAppearance(pos.geo.dist);
  const speed = computeSpeed(pos.geo.lon, "Sun", ts);

  return {
    name: "Sun",
    nomen: latinName("Sun"),
    symbol: "☉",
    helio: { lon: pos.helio.lon, lat: pos.helio.lat, dist: pos.helio.dist },
    geo: pos.geo,
    speed,
    retrograde: speed < 0,
    magnitude: app.magnitude,
    elongation: 0,
    phase: 1,
    apparentDiameter: app.apparentDiameter,
    zodiac: zodiac(pos.geo.lon),
    sign: sign(pos.geo.lon),
  };
}

function buildMoon(ts: number): Body {
  const state = getState(ts);
  const sun = sunPos(state);
  const pos = moonPos(state, sun);
  const app = moonAppearance({
    sunLongitude: sun.geo.lon,
    moonLongitude: pos.geo.lon,
    moonLatitude: pos.geo.lat,
    distEarthRadii: pos.distEarthRadii,
  });
  const speed = computeSpeed(pos.geo.lon, "Moon", ts);

  return {
    name: "Moon",
    nomen: latinName("Moon"),
    symbol: "☾",
    helio: { lon: 0, lat: 0, dist: 0 },
    geo: {
      lon: pos.geo.lon,
      lat: pos.geo.lat,
      dist: pos.geo.dist,
      equatorial: pos.geo.equatorial,
    },
    speed,
    retrograde: speed < 0,
    magnitude: -12.6,
    elongation: app.elongation,
    phase: app.phase,
    apparentDiameter: app.apparentDiameter,
    zodiac: zodiac(pos.geo.lon),
    sign: sign(pos.geo.lon),
    distEarthRadii: pos.distEarthRadii,
  };
}

function buildPlanet(name: PlanetName, ts: number): Body {
  const state = getState(ts);
  const sun = sunPos(state);
  const pos = planetPos(name, state, sun);
  const elem = ORBITAL_ELEMENTS.get(name)!;
  const app = planetAppearance({
    name,
    heliocentricDistance: pos.helio.dist,
    geocentricDistance: pos.geo.dist,
    geocentricLongitude: pos.geo.lon,
    geocentricLatitude: pos.geo.lat,
    sunDistance: sun.geo.dist,
    J: state.J,
  });
  const speed = computeSpeed(pos.geo.lon, name, ts);

  return {
    name,
    nomen: latinName(name),
    symbol: elem.symbol,
    helio: { lon: pos.helio.lon, lat: pos.helio.lat, dist: pos.helio.dist },
    geo: {
      lon: pos.geo.lon, lat: pos.geo.lat, dist: pos.geo.dist,
      equatorial: pos.geo.equatorial,
    },
    speed,
    retrograde: speed < 0,
    magnitude: app.magnitude,
    elongation: app.elongation,
    phase: app.phase,
    apparentDiameter: app.apparentDiameter,
    zodiac: zodiac(pos.helio.lon),
    sign: sign(pos.helio.lon),
  };
}

function buildEarth(ts: number): Body {
  const state = getState(ts);
  const sun = sunPos(state);
  const pos = planetPos("Earth", state, sun);
  const elem = ORBITAL_ELEMENTS.get("Earth")!;
  const speed = computeSpeed(pos.geo.lon, "Earth", ts);

  return {
    name: "Earth",
    nomen: latinName("Earth"),
    symbol: elem.symbol,
    helio: { lon: pos.helio.lon, lat: pos.helio.lat, dist: pos.helio.dist },
    geo: {
      lon: pos.geo.lon, lat: pos.geo.lat, dist: pos.geo.dist,
      equatorial: pos.geo.equatorial,
    },
    speed,
    retrograde: speed < 0,
    magnitude: 0,
    elongation: 0,
    phase: 1,
    apparentDiameter: 0,
    zodiac: zodiac(pos.helio.lon),
    sign: sign(pos.helio.lon),
  };
}

const BODY_BUILDERS: Record<BodyName, (ts: number) => Body> = {
  Sun: buildSun,
  Moon: buildMoon,
  Mercury: (ts) => buildPlanet("Mercury", ts),
  Venus: (ts) => buildPlanet("Venus", ts),
  Earth: buildEarth,
  Mars: (ts) => buildPlanet("Mars", ts),
  Jupiter: (ts) => buildPlanet("Jupiter", ts),
  Saturn: (ts) => buildPlanet("Saturn", ts),
};

const MAX_FRAMES = 10000;

function snapshotAt(date: Date, requested: BodyName[], orbLimit: number | undefined): Cosmos {
  const ts = date.getTime();
  const bodies = requested.map((name) => BODY_BUILDERS[name](ts));

  const geoLons: Record<string, number> = {};
  for (const body of bodies) {
    if (body.name !== "Earth") geoLons[body.name] = body.geo.lon;
  }

  const aspects = detectAspects(geoLons, { orbLimit });
  return { date, bodies, aspects };
}

/**
 * Ephemeris lookup (`tonus.caelum`). Computes geocentric and heliocentric
 * positions, zodiac signs, retrogradation, and aspects for the classical
 * bodies at an instant (JPL Keplerian elements, 3000 BC – 3000 AD). A
 * `from`/`to` range returns a stepped series.
 */
export function getCosmos(query: CosmosQuery & { from: Date; to: Date }): Cosmos[];
export function getCosmos(query?: CosmosQuery): Cosmos;
export function getCosmos(query: CosmosQuery = {}): Cosmos | Cosmos[] {
  const requested = query.bodies ?? ALL_BODIES;

  if (query.from != null || query.to != null) {
    if (query.from == null || query.to == null) {
      throw new RangeError("caelum range requires both from and to");
    }
    if (query.to.getTime() < query.from.getTime()) {
      throw new RangeError("caelum range: to must be >= from");
    }
    const step = query.step ?? 1;
    if (step <= 0) {
      throw new RangeError("caelum range: step must be > 0");
    }
    const stepMs = step * MS_PER_DAY;
    const startTs = query.from.getTime();
    const endTs = query.to.getTime();
    const frameCount = Math.floor((endTs - startTs) / stepMs) + 1;
    if (frameCount > MAX_FRAMES) {
      throw new RangeError(`caelum range would produce ${frameCount} frames (max ${MAX_FRAMES})`);
    }

    const frames: Cosmos[] = [];
    for (let ts = startTs; ts <= endTs; ts += stepMs) {
      frames.push(snapshotAt(new Date(ts), requested, query.orbLimit));
    }
    return frames;
  }

  const date = query.date ?? query.feast?.date ?? new Date();
  return snapshotAt(date, requested, query.orbLimit);
}
