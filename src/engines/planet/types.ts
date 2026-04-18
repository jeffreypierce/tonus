// ---------------------------------------------------------------------------
// engines/planet/types — planetary engine types
// ---------------------------------------------------------------------------
export interface HelioPos {
  lon: number;  // ecliptic longitude, deg (0–360)
  lat: number;  // ecliptic latitude, deg
  dist: number; // distance from Sun, AU
}

export interface GeoPos {
  lon: number;
  lat: number;
  dist: number; // AU (Earth radii for Moon)
  equatorial: {
    ra: number;   // right ascension, deg
    dec: number;  // declination, deg
    dist: number;
  };
}

export type BodyName =
  | "Sun" | "Moon" | "Mercury" | "Venus" | "Earth"
  | "Mars" | "Jupiter" | "Saturn";

export type PlanetName = "Mercury" | "Venus" | "Mars" | "Jupiter" | "Saturn";

const LATIN_NAMES: Record<BodyName, string> = {
  Sun: "Sol",
  Moon: "Luna",
  Mercury: "Mercurius",
  Venus: "Venus",
  Earth: "Terra",
  Mars: "Mars",
  Jupiter: "Iuppiter",
  Saturn: "Saturnus",
};

export function latinName(name: BodyName): string {
  return LATIN_NAMES[name];
}

export interface Body {
  name: BodyName;
  nomen: string;       // Latin name
  symbol: string;
  helio: HelioPos;
  geo: GeoPos;
  speed: number;       // deg/day (negative = retrograde)
  retrograde: boolean;
  magnitude: number;
  elongation: number;  // deg from Sun (geocentric)
  phase: number;       // 0–1 illuminated fraction
  apparentDiameter: number | { equ: number; pol: number }; // arcsec
  zodiac: number;      // sign 0–11 (Aries=0 … Pisces=11)
  sign: string;        // "Aries", "Taurus", etc.
  distEarthRadii?: number; // Moon only
}

export interface Aspect {
  type: "conjunction" | "opposition" | "trine" | "square" | "sextile";
  bodies: [string, string];
  angle: number;   // exact separation, deg
  orb: number;     // degrees from exact aspect angle
  strength: number; // 0–1
}

export interface Cosmos {
  date: Date;
  bodies: Body[];
  aspects: Aspect[];
}

export interface CosmosQuery {
  date?: Date;
  feast?: { date: Date };
  from?: Date;
  to?: Date;
  step?: number; // in days (1 = 86400000 ms), default 1
  bodies?: BodyName[];
  orbLimit?: number; // max orb for aspect detection, degrees (default 8)
}
