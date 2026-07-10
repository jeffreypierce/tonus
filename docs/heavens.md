# Heavens

`tonus.caelum` computes the classical bodies' places for a single moment, from
JPL Keplerian elements valid 3000 BC – 3000 AD. `tonus.harmonia` voices those
bodies through a planetary-harmony doctrine, assigning each visible planet a
tuned pitch and a Greek vowel. The doctrines and their derived ratios are
summarized in [Theory & Context](#theory--context).

- [Heavens](#heavens)
  - [The heavens — `caelum`](#the-heavens--caelum)
  - [Aspects](#aspects)
  - [The voiced heavens — `harmonia`](#the-voiced-heavens--harmonia)
  - [The planetary vowels](#the-planetary-vowels)
  - [The tabula](#the-tabula)
  - [Theory \& Context](#theory--context)

## The heavens — `caelum`

`caelum(query?)` returns a `Cosmos` for a single moment and `Cosmos[]` for
a `from`/`to` range. With `bodies` omitted, all eight are returned, and
aspects are computed only between requested bodies. A `feast` supplies its
date; an explicit `date` takes precedence.

```js
tonus.caelum({ date: new Date("2026-12-25") });
```

```js
// bodies[6], Jupiter that morning — retrograde in Leo:
{ name: "Jupiter", nomen: "Iuppiter", symbol: "♃",
  helio: { lon: 137.9, lat: 0.79, dist: 5.33 },
  geo:   { lon: 146.6, … },
  speed: -0.037, retrograde: true,
  magnitude: -2.13, elongation: 125.1, phase: 0.99,
  zodiac: 4, sign: "Leo" }
```

```js
tonus.caelum(); // the default epoch (991)
tonus.caelum({ feast: feasts[0] }); // the feast's date
tonus.caelum({ bodies: ["Sun", "Moon", "Jupiter"] });
tonus.caelum({ from: jan1, to: dec31, step: 7 }); // weekly snapshots
```

The eight bodies:

| `name`  | `nomen`   |     | `name`  | `nomen`  |     |
| ------- | --------- | --- | ------- | -------- | --- |
| Sun     | Sol       | ☉   | Earth   | Terra    | ♁   |
| Moon    | Luna      | ☾   | Mars    | Mars     | ♂   |
| Mercury | Mercurius | ☿   | Jupiter | Iuppiter | ♃   |
| Venus   | Venus     | ♀   | Saturn  | Saturnus | ♄   |

```ts
interface CosmosQuery {
  date?: Date;
  feast?: Feast;
  from?: Date;
  to?: Date;
  step?: number; // days, default 1
  bodies?: BodyName[];
  orbLimit?: number; // max orb for aspect detection, degrees (default 8)
}

interface Cosmos {
  date: Date;
  bodies: Body[];
  aspects: Aspect[];
}

interface Body {
  name: BodyName; // from the table above
  nomen: string; // Latin name
  symbol: string; // Unicode symbol
  helio: HelioPos;
  geo: GeoPos;
  speed: number; // deg/day (negative = retrograde)
  retrograde: boolean;
  magnitude: number;
  elongation: number; // deg from Sun (geocentric)
  phase: number; // 0–1 illuminated fraction
  apparentDiameter: number | { equ: number; pol: number }; // arcsec
  zodiac: number; // sign 0–11 (Aries=0 … Pisces=11)
  sign: string; // "Aries", "Taurus", …
  distEarthRadii?: number; // Moon only
}

interface HelioPos {
  lon: number; // ecliptic longitude, deg (0–360)
  lat: number; // ecliptic latitude, deg
  dist: number; // distance from Sun, AU
}

interface GeoPos {
  lon: number;
  lat: number;
  dist: number;
  equatorial: {
    ra: number; // right ascension, deg
    dec: number; // declination, deg
    dist: number;
  };
}
```

## Aspects

Aspects are angular relationships between geocentric body
longitudes, detected within the orb limit. Strength falls linearly from 1
at the exact angle to 0 at the limit. On Christmas 2026 the sky holds
eight, led by a Mercury–Jupiter trine 1.1° from exact.

| `type`        | angle |
| ------------- | ----- |
| `conjunction` | 0°    |
| `sextile`     | 60°   |
| `square`      | 90°   |
| `trine`       | 120°  |
| `opposition`  | 180°  |

```ts
interface Aspect {
  type: string; // from the table above
  bodies: [string, string];
  angle: number; // exact separation, deg
  orb: number; // degrees from exact aspect angle
  strength: number; // 0–1
}
```

## The voiced heavens — `harmonia`

`harmonia(cosmos, opts?)` gives each body a pitch and a Greek vowel according to
a **doctrina** (a named historical scheme for who sounds what: Pythagoras,
Boethius, Pliny, Ptolemy). The result
is pure data: each visible planet becomes a `VoicedBody` with a tuned pitch and
a Greek vowel; each aspect gains the `Interval` its angle sounds, with its
consonance grade. Range input populates `frames`, one per cosmos.

```js
const sky = tonus.caelum({ date: new Date("2026-12-25") });
const h = tonus.harmonia(sky); // Boethius, pythagorean A440

h.auctor; // "Anicius Manlius Severinus Boethius"

h.bodies.find((b) => b.name === "Jupiter");
// { …Body, nota: { pitch: { spn: "F4", hz: 347.65, … },
//                  performance: { velocity: 0.55, … } },
//   presence: 0.55, motion: 0.15,
//   greekName: "parhypate meson", vowel: { name: "Upsilon", phonetic: "u", … } }

h.aspects[0];
// trine Mercury–Jupiter → interval: Quinta, consonance: "perfect"
```

The doctrinae:

| `doctrina`     | Source                     | Span      | Notable                                                       |
| -------------- | -------------------------- | --------- | ------------------------------------------------------------- |
| `"pythagoras"` | via Plato, _Republic_ X    | 1 octave  | Disjunct diatonic tetrachords (B durum); includes Fixed Stars |
| `"boethius"`   | _De institutione musica_   | major 7th | Conjunct diatonic tetrachords (B molle); medieval default     |
| `"pliny"`      | _Naturalis historia_ II.xx | 1 octave  | Chromatic Dorian (distance-based); Earth = proslambanomenos   |
| `"ptolemy"`    | _Harmonics_ III            | 2 octaves | Fixed tones of the Greater Perfect System                     |

Sphere pitches are computed directly from the doctrina's pure ratios,
anchored at the temperamentum's A4, so historical coherence holds:
`temperamentum("ptolemy-intense")` with `harmonia({ doctrina: "ptolemy" })`
gives pure Ptolemaic intervals throughout — Sun→Jupiter a pure 3/2,
Sun→Saturn a pure 2/1. The temperamentum's scale governs pitch naming and
the imprint.

Each voiced body's `nota` carries its velocity as a 0–1 factor: the body's
presence (visibility and brightness), on the same scale the score engine uses.
An aspect's interval is graded by class:

| interval class | consonance |
| -------------- | ---------- |
| P1, P5, P8     | perfect    |
| m3, M3, m6, M6 | imperfect  |
| all others     | dissonant  |

Bodies without a classical vowel are not voiced: Earth and the Fixed
Stars. Pliny's Earth-as-proslambanomenos is dropped in v1 as a
consequence.

```js
tonus.harmonia(sky, { doctrina: "ptolemy" });
tonus.harmonia(sky, { temperamentum: tonus.temperamentum("ptolemy-intense") });
const h2 = tonus.harmonia(tonus.caelum({ from, to })); // h2.frames populated
```

```ts
interface HarmoniaOpts {
  temperamentum?: Temperamentum; // default: pythagorean A440
  doctrina?: string; // from the doctrinae table; default "boethius"
}

interface Harmony {
  doctrina: string;
  auctor: string; // full Latin name of the doctrina's author
  date: Date; // first cosmos's date
  bodies: VoicedBody[];
  aspects: VoicedAspect[];
  frames?: Frame[]; // only when input was an array of cosmos

  tabula: HarmonyTabulaRow[]; // flat iterable view
  imprint: Imprint; // shared analytical fingerprint — score.md
}

interface VoicedPitch {
  pitch: Pitch;
  performance: Performance; // velocity 0–1, presence-scaled
}

interface VoicedBody extends Body {
  nota: VoicedPitch;
  presence: number; // 0–1 (visibility + brightness)
  motion: number; // 0–1 (normalized speed)
  greekName: string; // position in the Greek tonal system
  vowel: PlanetVowel;
}

interface VoicedAspect extends Aspect {
  interval: Interval; // carries the consonance grade
}

interface Frame {
  date: Date;
  bodies: VoicedBody[];
  aspects: VoicedAspect[];
}
```

## The planetary vowels

Each classical planet sounds one of the seven Greek vowels; the
Moon→Saturn ordering follows Nicomachus (_Excerpta ex Nicomacho_ 6), the
attestations Godwin's _The Mystery of the Seven Vowels_ (1991).

| Body    | Greek | Name    | Phonetic |
| ------- | ----- | ------- | -------- |
| Moon    | Α / α | Alpha   | a        |
| Mercury | Ε / ε | Epsilon | e        |
| Venus   | Η / η | Eta     | e        |
| Sun     | Ι / ι | Iota    | i        |
| Mars    | Ο / ο | Omicron | o        |
| Jupiter | Υ / υ | Upsilon | u        |
| Saturn  | Ω / ω | Omega   | o        |

```ts
interface PlanetVowel {
  greek: string; // "Α"
  greekLower: string; // "α"
  name: string; // "Alpha"
  modern: string; // "A"
  phonetic: "a" | "e" | "i" | "o" | "u";
  ipa: string;
}
```

## The tabula

`harmony.tabula` is the flat iteration surface: one row per voiced body
(chant scores expose the same surface per note,
[score.md](score.md#the-tabula)).

```js
h.tabula.find((r) => r.name === "Jupiter");
// { name: "Jupiter", nomen: "Iuppiter", greekName: "parhypate meson",
//   spn: "F4", hz: 347.7, presence: 0.55, velocity: 0.55,
//   vowelGreek: "Υ", sign: "Leo", aspectCount: 3, … }
```

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
  motion: number; // 0–1
  velocity: number; // 0–1, presence-scaled

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

## Theory & Context

The doctrina ratios are reconstructed from the primary texts through
Joscelyn Godwin's syntheses, mapping each body to a Greek tone-name and
deriving its ratio by Pythagorean interval arithmetic normalized to the
mese (Sun = 1/1). The full method, the taxonomy, and the decisions taken
along the way are documented at the data — see `DOCTRINAE` in
[`harmonia/data/doctrines.ts`](../src/engines/harmonia/data/doctrines.ts).
The same arithmetic is laid out from the tuning side in
[tuning.md](tuning.md#theory--context).

The resulting ratios, by sphere from the outermost:

| body        | `pythagoras` | `boethius` | `pliny`     | `ptolemy` |
| ----------- | ------------ | ---------- | ----------- | --------- |
| Fixed Stars | 3/2          | —          | —           | —         |
| Saturn      | 3/4          | 3/4        | 4/3         | 2/1       |
| Jupiter     | 64/81        | 64/81      | 65536/59049 | 3/2       |
| Mars        | 8/9          | 8/9        | 256/243     | 9/8       |
| Sun         | 1/1          | 1/1        | 1/1         | 1/1       |
| Venus       | 9/8          | 256/243    | 16384/19683 | 3/4       |
| Mercury     | 32/27        | 32/27      | 64/81       | 9/16      |
| Moon        | 4/3          | 4/3        | 3/4         | 1/2       |
| Earth       | —            | —          | 2/3         | —         |

The single pitch separating Pythagoras from Boethius is Venus: a whole
tone above the Sun in the disjunct system (9/8, B durum), a semitone in
the conjunct (256/243, B molle) — the origin of the durum/molle
distinction that runs through all of medieval music theory. The editorial
decisions behind the table (why Boethius carries Nicomachus's ratios, how
Pliny's off-mese Sun is handled, the Fixed Stars left unvoiced) are
recorded in the code beside the data.

## Sources

Sources for this page are in the central [bibliography](../BIBLIOGRAPHY.md):
`godwin-harmonies`, `godwin-spheres`, `godwin-vowels`, `boethius-institutione`,
`doctrina-primaries` (Nicomachus, Plato, Pliny, Ptolemy, and the vowel
attestations), `standish-jpl`, `schlyter-positions`.
