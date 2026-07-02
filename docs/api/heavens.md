# Heavens — `tonus.caelum` · `tonus.harmonia`

Two layers, deliberately paired: an accurate ephemeris (JPL Keplerian
elements, Standish 1992/DE430, 3000 BC – 3000 AD) heard through the
historical doctrines of the harmony of the spheres. The doctrina derivations
are documented in [theory/doctrines.md](../theory/doctrines.md).

## `tonus.caelum(query?) -> Cosmos | Cosmos[]`

Planetary ephemeris. Returns a sky snapshot with positional data for the
classical solar-system bodies and angular aspects between them: heliocentric
and geocentric positions, apparent magnitude, phase, elongation, zodiac
sign, and speed.

Single moment (returns `Cosmos`):

```js
tonus.caelum(); // now
tonus.caelum({ date: new Date("2026-12-25") });
tonus.caelum({ feast: feasts[0] });
tonus.caelum({ bodies: ["Sun", "Moon", "Jupiter"] });
```

Time range (returns `Cosmos[]`):

```js
tonus.caelum({ from: new Date("2026-12-25"), to: new Date("2026-12-31") });
tonus.caelum({ from: jan1, to: dec31, step: 7 }); // weekly snapshots
```

**Return type:** `Cosmos` for single-moment queries, `Cosmos[]` for ranges —
TypeScript narrows automatically on the presence of `from`/`to`.

**Range semantics:** snapshots at `from.getTime() + n * step * 86400000 ms`
while `<= to.getTime()`. Throws if `to < from`, `step <= 0`, or the range
would produce more than 10,000 frames.

When `bodies` is omitted, all 8 are returned. Aspects are computed only
between requested bodies. When `feast` is provided, its date is used
(an explicit `date` takes precedence).

```ts
interface CosmosQuery {
  date?: Date;
  feast?: Feast;
  from?: Date;
  to?: Date;
  step?: number;      // days, default 1
  bodies?: BodyName[];
  orbLimit?: number;  // max orb for aspect detection, degrees (default 8)
}

type BodyName =
  | "Sun" | "Moon" | "Mercury" | "Venus"
  | "Earth" | "Mars" | "Jupiter" | "Saturn";

interface Cosmos {
  date: Date;
  bodies: Body[];
  aspects: Aspect[];
}

interface Body {
  name: BodyName;
  nomen: string;   // Latin name ("Sol", "Luna", "Iuppiter", …)
  symbol: string;  // Unicode symbol ("☉", "☾", "♃", …)
  helio: HelioPos;
  geo: GeoPos;
  speed: number;      // deg/day (negative = retrograde)
  retrograde: boolean;
  magnitude: number;
  elongation: number; // deg from Sun (geocentric)
  phase: number;      // 0–1 illuminated fraction
  apparentDiameter: number | { equ: number; pol: number }; // arcsec
  zodiac: number;     // sign 0–11 (Aries=0 … Pisces=11)
  sign: string;       // "Aries", "Taurus", …
  distEarthRadii?: number; // Moon only
}

interface HelioPos {
  lon: number;  // ecliptic longitude, deg (0–360)
  lat: number;  // ecliptic latitude, deg
  dist: number; // distance from Sun, AU
}

interface GeoPos {
  lon: number;
  lat: number;
  dist: number;
  equatorial: {
    ra: number;  // right ascension, deg
    dec: number; // declination, deg
    dist: number;
  };
}
```

### Aspect

Aspects are pure geometric data — angular relationships between geocentric
body longitudes. Five classical aspects are detected: conjunction (0°),
sextile (60°), square (90°), trine (120°), opposition (180°). Strength is a
linear falloff from 1 (exact) to 0 (at the orb limit).

```ts
interface Aspect {
  type: "conjunction" | "opposition" | "trine" | "square" | "sextile";
  bodies: [string, string];
  angle: number;    // exact separation, deg
  orb: number;      // degrees from exact aspect angle
  strength: number; // 0–1
}
```

## `tonus.harmonia(cosmos, opts?) -> Harmony`

Voices the sky through a planetary-harmony doctrina. Pure data — no methods.
Every voiced body carries a Greek planetary vowel; every aspect's interval
carries a consonance classification.

```js
const sky = tonus.caelum();
tonus.harmonia(sky);                          // Boethius + pythagorean default
tonus.harmonia(sky, { doctrina: "ptolemy" }); // Ptolemy doctrine
tonus.harmonia(sky, { temperamentum: tonus.temperamentum("ptolemy-intense") });

// Time-range analysis with per-cosmos frames
const range = tonus.caelum({ from, to });
const h = tonus.harmonia(range); // h.frames is populated
```

```ts
interface HarmoniaOpts {
  temperamentum?: Temperamentum; // default: pythagorean A440
  doctrina?: Author;             // default: "boethius"
}

type Author = "pythagoras" | "boethius" | "pliny" | "ptolemy";
```

**Doctrines** (derivations in [theory/doctrines.md](../theory/doctrines.md)):

| Author | Source | Span | Notable |
| --- | --- | --- | --- |
| `"pythagoras"` | via Plato, *Republic* X | 1 octave | Disjunct diatonic tetrachords (B durum); includes Fixed Stars |
| `"boethius"` | *De institutione musica* | major 7th | Conjunct diatonic tetrachords (B molle); medieval default |
| `"pliny"` | *Naturalis historia* II.xx | 1 octave | Chromatic Dorian (distance-based); Earth = proslambanomenos |
| `"ptolemy"` | *Harmonics* III | 2 octaves | Fixed tones of the Greater Perfect System |

Sphere pitches are computed directly from the doctrina's pure ratios
(anchored at the temperamentum's A4), so historical coherence holds:
`temperamentum("ptolemy-intense")` + `harmonia({ doctrina: "ptolemy" })`
gives pure Ptolemaic intervals throughout — Sun→Jupiter a pure 3/2,
Sun→Saturn a pure 2/1. The temperamentum's scale governs pitch naming and
the imprint.

```ts
interface Harmony {
  doctrina: Author;
  doctrinaName: string; // "Anicius Manlius Severinus Boethius"
  date: Date;           // first cosmos's date
  bodies: VoicedBody[];
  aspects: VoicedAspect[];
  frames?: Frame[];     // only when input was an array of cosmos

  tabula: HarmonyTabulaRow[]; // flat iterable view
  imprint: Imprint;           // shared analytical fingerprint — see score.md
}

interface VoicedPitch {
  pitch: Pitch;
  performance: Performance;
}

interface VoicedBody extends Body {
  nota: VoicedPitch;
  presence: number;  // 0–1 (visibility + brightness)
  motion: number;    // 0–1 (normalized speed)
  greekName: string; // position in the Greek tonal system
  vowel: PlanetVowel;
}

interface VoicedAspect extends Aspect {
  interval: Interval; // carries consonance classification
}

interface Frame {
  date: Date;
  bodies: VoicedBody[];
  aspects: VoicedAspect[];
}
```

Each `VoicedBody` has a `nota` (velocity scaled by the body's presence) and
a `vowel`. Aspects receive an `interval` whose consonance is classified
P1/P5/P8 → perfect, m3/M3/m6/M6 → imperfect, else → dissonant.

Bodies not mapped in `PLANET_VOWELS` (Earth, Fixed Stars) are **not**
voiced; Pliny's Earth-as-proslambanomenos is dropped in v1 as a consequence.

### Planetary vowels

Each classical planet maps to one of the seven Greek vowels. Source: Godwin,
*The Mystery of the Seven Vowels* (1991), drawing on Porphyry, Marcus
Gnosticus, Demetrius, Nicomachus, Eusebius, and Barthélemy of Edessa. The
Moon→Saturn ordering follows Nicomachus (*Excerpta ex Nicomacho* 6).

| Body | Greek | Name | Phonetic |
| --- | --- | --- | --- |
| Moon | Α / α | Alpha | a |
| Mercury | Ε / ε | Epsilon | e |
| Venus | Η / η | Eta | e |
| Sun | Ι / ι | Iota | i |
| Mars | Ο / ο | Omicron | o |
| Jupiter | Υ / υ | Upsilon | u |
| Saturn | Ω / ω | Omega | o |

```ts
interface PlanetVowel {
  greek: string;      // "Α"
  greekLower: string; // "α"
  name: string;       // "Alpha"
  modern: string;     // "A"
  phonetic: "a" | "e" | "i" | "o" | "u";
  ipa: string;
}
```

### Tabula

`harmony.tabula` — one row per voiced body, the flat iteration surface
(chant scores expose the same idea per note; see
[score.md](score.md#tabula)).

```ts
interface HarmonyTabulaRow {
  bodyIndex: number;
  name: BodyName;
  nomen: string;
  greekName: string;

  midi: number;
  pc: number;
  oct: number;
  spn: string;
  hz: number;

  presence: number; // 0–1
  motion: number;   // 0–1
  velocity: number; // 0–127 MIDI byte

  vowelGreek: string;
  vowelPhonetic: string;
  vowelName: string;

  zodiac: number; // 0–11
  sign: string;
  retrograde: boolean;
  elongation: number; // deg from Sun
  magnitude: number;

  aspectCount: number; // aspects this body participates in
}
```
