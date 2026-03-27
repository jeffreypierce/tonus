# tonus API v1.0

This document is the behavioral source of truth for the v1 API.

All functions live on the `tonus` namespace. There are no sub-namespaces.

```js
import tonus from "tonus";
```

---

## Conventions

**Query functions** are nouns — they name what you want and return arrays. Empty matches return `[]`, never `null`. Results are sorted `day asc, rank desc`. For non-calendar queries, results sort by rank then incipit.

**Builder functions** are verbs — they do something and return context objects with methods. They throw `Error` on invalid input.

**Context objects** — `Feast[]` or `Temper` — are passed into query functions as optional filters via the query object.

```js
const feasts = tonus.festum({ season: "ea" });
tonus.proprium({ feast: feasts, office: "an" });

const t = tonus.temper({ tuning: "pythagorean" });
t.nota("D4");
```

**Determinism** — all pure transforms are deterministic for identical inputs and options. No runtime network requests are made.

**Errors** — query functions return `[]` on no match. Builder functions throw `Error` with a descriptive message on invalid input.

---

## Shared Types

### Enums

```ts
type ChantSource = "gr" | "lu" | "la" | "lh" | "hilde";

type OfficeCode =
  | "an"
  | "al"
  | "ca"
  | "co"
  | "gr"
  | "hy"
  | "in"
  | "of"
  | "ps"
  | "re"
  | "rb"
  | "se"
  | "tr"
  | "tp"
  | "or";

type OrdinaryCode = "ky" | "gl" | "cr" | "sa" | "ag" | "be" | "it";

type Season = "ad" | "ct" | "lt" | "ea" | "ap" | "ot" | "sg";

type Rank = 0 | 1 | 2 | 3 | 4;

type CanonicalHour =
  | "matutinum"
  | "laudes"
  | "prima"
  | "tertia"
  | "sexta"
  | "nona"
  | "vesperae"
  | "completorium";

type Divisio = "," | "`" | ";" | ":" | "::";
```

### Query Types

`CantusQuery` is the base query shape. All chant-returning query functions extend it.

```ts
interface CantusQuery {
  id?: string | string[];
  gabc?: string;
  incipit?: string;
  mode?: number | string | (number | string)[];
  office?: OfficeCode | OfficeCode[];
  source?: ChantSource | ChantSource[];
  limit?: number;
  offset?: number;
  sort?: "incipit" | "mode" | "id";
}

interface PropriumQuery extends CantusQuery {
  feast?: Feast | Feast[];
}

interface OrdinariumQuery extends CantusQuery {
  feast?: Feast | Feast[];
  ordinary?: OrdinaryCode;
  mass?: number;
}

interface OfficiumQuery extends CantusQuery {
  feast?: Feast | Feast[];
  hour?: CanonicalHour;
}

interface PsalmusQuery {
  psalm?: number | string;
  verse?: string;
  mode?: number;
  differentia?: string; // differentia code e.g. "6F", "4e"
  intonation?: boolean; // include opening intonation formula, default true
}

interface FeastQuery {
  date?: Date;
  name?: string;
  season?: Season;
  rank?: Rank;
  marian?: boolean;
  apostolic?: boolean;
}
```

### Core Types

```ts
interface Chant {
  id: string;
  incipit: string;
  gabc: string;
  office: OfficeCode;
  officeLabel: string;
  mode: string | null;
  modeLabel: string | null;
  pages: { page: string; sequence: number; extent: number }[];
  source: {
    book: string;
    year: number | null;
    editor: string | null;
    code?: ChantSource | "user";
  };
}

interface OrdinaryChant extends Chant {
  ordinary: OrdinaryCode;
  ordinaryLabel: string;
  mass: number;
}

interface Feast {
  id: string;
  name: string;
  rank: Rank;
  rankLabel: string;
  season: Season;
  seasonLabel: string;
  seasonStart: Date;
  seasonEnd: Date;
  date: Date;
  weekday: number;
  masses: number[];
  marian: boolean;
  apostolic: boolean;
}
```

---

## Query Functions

### `tonus.cantus(query?) -> Chant[]`

Cross-corpus chant retrieval over GR, LA, LH, LU, and Hilde. Also accepts raw GABC input via the `gabc` field — when present, the corpus is bypassed and a single user `Chant` is returned. GABC input may be a notation body or a full GABC file (headers + `%%` + body); header values for `name`, `mode`, and `office-part` are extracted automatically. The `incipit`, `mode`, and `office` fields on the query override header values.

```js
tonus.cantus({ mode: 1, office: "an", source: "gr" });
tonus.cantus({ mode: [1, 2], office: ["an", "hy"] });
tonus.cantus({ id: "gregobase:1234" });

// raw GABC body
tonus.cantus({
  gabc: "(c4) Sán(g)ctus(h) Sán(g)ctus(h)",
  incipit: "Sanctus",
  mode: 1,
});

// full GABC file
tonus.cantus({
  gabc: "name: Sanctus;\nmode: 1;\n%%\n(c4) Sán(g)ctus(h) Sán(g)ctus(h)",
});
```

### `tonus.festum(query?) -> Feast[]`

Calendar lookup. Returns all matching feasts sorted `day asc, rank desc`. For a date query, returns the primary feast and all concurrent feasts on that day in rank order.

```js
tonus.festum({ date: new Date() });
tonus.festum({ name: "Dominica I Adventus" });
tonus.festum({ season: "ea" });
tonus.festum({ rank: 4, marian: true });
```

### `tonus.proprium(query?) -> Chant[]`

Mass proper retrieval. Resolves Introitus, Graduale, Alleluia/Tractus, Offertorium, Communio. Feast acts as a focused filter when provided.

```js
tonus.proprium({ office: "in" });
tonus.proprium({ feast: feasts, office: "gr" });
```

**Coverage:** 926 entries (523 Sancti + 403 Tempora). When a feast has no dedicated proper for a slot, the Commune Sanctorum proper is used as fallback (31 commune sets, 387 feast→commune mappings).

### `tonus.ordinarium(query?) -> OrdinaryChant[]`

Mass ordinary retrieval. Queries the Kyriale. Feast drives mass selection when provided; `mass` pins a specific kyriale number directly.

```js
tonus.ordinarium({ ordinary: "ky" });
tonus.ordinarium({ feast: feasts });
tonus.ordinarium({ mass: 9, ordinary: "gl" });
```

### `tonus.officium(query?) -> Chant[]`

Divine Office hour retrieval. Returns chants for a canonical hour. Feast acts as a filter when provided. When no hour is specified, returns chants for all available hours.

```js
tonus.officium({ hour: "laudes" });
tonus.officium({ feast: feasts, hour: "vesperae" });
tonus.officium({ feast: feasts, hour: "matutinum" });
tonus.officium({ hour: "tertia" });
```

| Hour                    | Content                                   |
| ----------------------- | ----------------------------------------- |
| `matutinum`             | Invitatory, antiphons, hymn, responsories |
| `laudes`                | Antiphons, Benedictus antiphon, hymn      |
| `tertia`                | Responsory breve                          |
| `sexta`                 | Responsory breve                          |
| `nona`                  | Responsory breve                          |
| `vesperae`              | Antiphons, Magnificat antiphon, hymn      |
| `prima`, `completorium` | Not yet extracted — return empty          |

### `tonus.psalmus(query?) -> Chant[]`

Psalm and canticle retrieval as intoned `Chant[]`. Returns GABC-encoded psalm verses sung to a psalm tone. `differentia` specifies the cadential variant; `intonation` controls whether the opening formula is included.

```js
tonus.psalmus({ psalm: 109, mode: 1 });
tonus.psalmus({ psalm: 109, verse: "1a", mode: 2, differentia: "6F" });
tonus.psalmus({ psalm: "benedictus", mode: 8, intonation: false });
```

### `tonus.caelum(query?) -> Caelum`

Planetary ephemeris. Returns a sky snapshot with positional data for classical solar system bodies and angular aspects between them. Computes heliocentric and geocentric positions, apparent magnitude, phase, elongation, zodiac sign, and speed. Accepts a `Date`, a `Feast`, or defaults to now.

```js
tonus.caelum();
tonus.caelum({ date: new Date(2026, 11, 25) });
tonus.caelum({ feast: feasts[0] });
tonus.caelum({ bodies: ["Sun", "Moon", "Jupiter"] });
tonus.caelum({ feast: feasts[0], bodies: ["Sun", "Moon"], orbLimit: 5 });
```

**`CaelumQuery`**

```ts
interface CaelumQuery {
  date?: Date;
  feast?: Feast;
  bodies?: BodyName[];
  orbLimit?: number; // max orb for aspect detection, degrees (default 8)
}

type BodyName =
  | "Sun"
  | "Moon"
  | "Mercury"
  | "Venus"
  | "Earth"
  | "Mars"
  | "Jupiter"
  | "Saturn";
```

**`Caelum`**

```ts
interface Caelum {
  date: Date;
  bodies: Body[];
  aspects: Aspect[];
}
```

When `bodies` is omitted, all 8 are returned. Aspects are computed only between requested bodies. When `feast` is provided, its date is used (explicit `date` takes precedence).

---

## Builder Functions

### `tonus.temper(input?) -> Temper`

Builds a tuning context. All pitch helper methods are on the returned `Temper` object.

```js
tonus.temper()                                          // pythagorean, mode auto, A4=440
tonus.temper("pythagorean")                             // string shorthand
tonus.temper({ tuning: "meantone", comma: "1/4" })
tonus.temper({ tuning: "ptolemy-intense" })             // just intonation (pure thirds)
tonus.temper({ tuning: "ptolemy-soft" })                // septimal (7th harmonic)
tonus.temper({ tuning: "ptolemy-equable" })             // undecimal (neutral intervals)
tonus.temper({ tuning: "equal", mode: 3, a4: 415 })
tonus.temper({ scale: ["1/1", "9/8", "5/4", ...] })    // custom array
tonus.temper({ scale: "! meanquar.scl\n..." })          // Scala file
```

**`TemperOpts`**

| Field       | Type               | Default         | Description                                                                                                                |
| ----------- | ------------------ | --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `tuning`    | `Tuning`           | `"pythagorean"` | Base temperament                                                                                                           |
| `mode`      | `number \| "auto"` | `"auto"`        | Gregorian mode (1–8); `"auto"` resolves from chant, falls back to UT (C) with no modal rotation                            |
| `a4`        | `number`           | `440`           | A4 reference frequency in Hz                                                                                               |
| `root`      | `number`           | mode finalis    | Root pitch class override (0–11)                                                                                           |
| `transpose` | `number`           | `0`             | Output semitone transposition                                                                                              |
| `comma`     | `number \| string` | —               | Meantone comma (`0.25`, `"1/4"`, `"1/3"`). Only with `"meantone"` tuning                                                   |
| `scale`     | `string \| string[]` | —             | Scala `.scl` file string or array of 7/12 ratio/cent values. Implies custom tuning; name extracted from Scala description  |

**Tuning presets:**

| Name | Description |
|------|-------------|
| `"pythagorean"` | Pure fifths (3/2), no tempering. Default |
| `"meantone"` | Tempered fifths. `comma` controls amount (default 1/4) |
| `"equal"` | 12-tone equal temperament |
| `"ptolemy-intense"` | Ptolemy's intense diatonic (*syntonon*) — classical just intonation with pure major thirds (5/4) |
| `"ptolemy-soft"` | Ptolemy's soft diatonic (*malakon*) — septimal tuning using the 7th harmonic (8/7 whole tone) |
| `"ptolemy-equable"` | Ptolemy's equable diatonic (*homalon*) — undecimal tuning with neutral intervals (12/11 second) |

Any other string is accepted as a custom tuning name (e.g. from a Scala file description).

```ts
type Tuning = "pythagorean" | "meantone" | "equal"
  | "ptolemy-intense" | "ptolemy-soft" | "ptolemy-equable"
  | string;
type TemperInput = BuiltinTuning | TemperOpts;
```

**`Temper`** — resolved context object

```ts
interface Temper {
  // resolved
  tuning: Tuning;
  mode: number | "auto";
  a4: number;
  root: number;
  transpose: number;
  comma: number;

  // computed
  ratios: number[]; // frequency ratios relative to root, one per pitch class
  cents: number[]; // cent values 0–1200 per pitch class

  // methods
  nota(input: PitchInput): Note;
  gradus(input: PitchInput): Step;
  intervallum(a: PitchInput, b: PitchInput): Interval;
  ratio(input: string): RatioResult & { step: Step | null };
  neuma(inputs: PitchInput[]): Neume;
  gamut(opts?: GamutOptions): Note[];
  modus(mode: number): ModeData;
  tonus(opts?: TonusOpts): Tonus;
}
```

---

### `tonus.pondus(input?) -> Pondus`

Builds an articulation profile. Controls note-level weight, duration, and ornament interpretation. Default: `"balanced"`.

```js
tonus.pondus()
tonus.pondus("expressive")
tonus.pondus({ style: "strict", overrides: { ... } })
```

| Style          | Description                                                         |
| -------------- | ------------------------------------------------------------------- |
| `"balanced"`   | Default. Even articulation, moderate weight                         |
| `"expressive"` | Heightened ornament response, stronger shaping                      |
| `"strict"`     | Full Solesmes rule fidelity, careful episema and quilisma treatment |

```ts
type PondusStyle = "balanced" | "expressive" | "strict";
type PondusInput = PondusStyle | PondusOpts;

interface PondusOpts {
  style?: PondusStyle;
  overrides?: Partial<ArticulationProfile>;
}
```

---

### `tonus.accentus(input?) -> Accentus`

Builds a phrasing profile. Controls phrase-level velocity curves, cadence weight, and tenor emphasis. Default: `"lyrical"`.

```js
tonus.accentus()
tonus.accentus("solemn")
tonus.accentus({ style: "hymnic", overrides: { ... } })
```

| Style          | Description                                         |
| -------------- | --------------------------------------------------- |
| `"recitative"` | Flat, declamatory; minimal curve, strong tenor pull |
| `"lyrical"`    | Default. Balanced arch, moderate cadence            |
| `"hymnic"`     | Measured, steady; suits metrical hymns              |
| `"solemn"`     | Deep curve, strong cadence, elevated velocity       |

```ts
type AccentusStyle = "recitative" | "lyrical" | "hymnic" | "solemn";
type AccentusInput = AccentusStyle | AccentusOpts;

interface AccentusOpts {
  style?: AccentusStyle;
  overrides?: Partial<PhrasingProfile>;
}
```

---

### `tonus.ordo(chant, opts?) -> Score`

Builds a `Score` from a single `Chant`. Applies interpretation if `pondus` and `accentus` are provided — `velocity`, `duration`, `arsis`, and `thesis` on each `Note` will be `null` otherwise.

```js
const t = tonus.temper({ tuning: "pythagorean" });
const p = tonus.pondus("balanced");
const a = tonus.accentus("lyrical");

const score = tonus.ordo(chant, { temper: t, pondus: p, accentus: a });

score.midi({ bpm: 120 });
score.musicxml();
score.tabula();
score.summa();
```

**`ScoreOpts`**

```ts
interface ScoreOpts {
  temper?: Temper;
  pondus?: Pondus;
  accentus?: Accentus;
}
```

**`Score`**

```ts
interface Score {
  chant: Chant;
  phrases: Phrase[];
  errors: ParseError[];

  midi(opts?: MidiOpts): Uint8Array;
  musicxml(): string;
  tabula(): TabulaResult;
  summa(): ChantMetrics;
}
```

**`MidiOpts`**

```ts
interface MidiOpts {
  ppq?: number;
  bpm?: number;
  bendRange?: number;
  velocityRange?: [number, number]; // [min, max] e.g. [20, 110]
}
```

---

## Score Types

```ts
interface Phrase {
  syllables: Syllable[];
  divisio?: RestEvent;
}

interface Syllable {
  lyric: string;
  notes: ScoredNote[];
  neume: Neume;
}

interface RestEvent {
  type: "rest";
  divisio: "," | "`" | ";" | ":" | "::";
  duration: number;
}

interface ParseError {
  message: string;
  index?: number;
}
```

---

## Note

`Note` is the universal pitch type. Returned by `temper.nota()`, present in `Neume.notes[]`, and inlined into `TabulaRow`. Interpretation fields (`velocity`, `duration`, `arsis`, `thesis`) are `null` when `ordo` is called without `pondus` and `accentus`.

```ts
interface Note {
  midi: number;
  pc: number;
  oct: number;
  acc: number; // -1 flat, 0 natural, 1 sharp
  spn: string; // "D4"
  hz: number;
  bend: number; // 14-bit MIDI pitch bend, 8192 = center
  velocity: number | null;
  duration: number | null;
  arsis: number | null; // ascending rhythmic weight; 1 = ictus, counts up
  thesis: number | null; // descending rhythmic weight; counts down to next ictus
}
```

---

## Temper Types

### PitchInput

```ts
type PitchInput = number | string | PitchObject;

// number  → MIDI note number
// string  → SPN ("C4", "Eb3"), GABC letter ("d"), or Hz ("440hz")

interface PitchObject {
  midi?: number;
  spn?: string;
  hz?: number;
  gabc?: string;
  clef?: string; // default "c4", only with gabc
  solfege?: string; // modern fixed-do: "DO" | "RE" | "MI" | "FA" | "SOL" | "LA" | "SI"
  solmization?: string; // medieval: "UT" | "RE" | "MI" | "FA" | "SOL" | "LA"
  hexachord?: "durum" | "naturale" | "molle"; // default "naturale", only with solmization
}
```

All inputs resolve to a pitch first; `transpose` is applied last as a uniform output shift.

### Neume

```ts
type NeumeShape =
  | "punctum"
  | "pes"
  | "clivis"
  | "torculus"
  | "porrectus"
  | "scandicus"
  | "climacus"
  | "torculus resupinus"
  | "porrectus flexus"
  | "scandicus flexus"
  | "climacus resupinus"
  | "pes subpunctis"
  | "compound";

interface Neume {
  notes: Note[];
  intervals: Interval[];
  shape: NeumeShape;
}
```

### Interval

```ts
type IntervalClass =
  | "P1"
  | "m2"
  | "M2"
  | "m3"
  | "M3"
  | "P4"
  | "TT"
  | "P5"
  | "m6"
  | "M6"
  | "m7"
  | "M7"
  | "P8";
type IntervalQuality = "perfect" | "major" | "minor" | "augmented";
type IntervalDirection = "up" | "down" | "unison";

interface Interval {
  name: string; // e.g. "Quinta", "Semitonium"
  alias?: string; // e.g. "Diapente", "Diatessaron"
  quality: IntervalQuality;
  class: IntervalClass;
  direction: IntervalDirection;
  semitones: number;
  cents: number;
}
```

### Step

`Step` is returned by `temper.gradus()` and inlined into `TabulaRow`.

```ts
type Finger =
  | "wrist"
  | "palm"
  | "thumb"
  | "index"
  | "middle"
  | "ring"
  | "pinky";
type Region = "base" | "mid" | "tip" | "top";

interface StepName {
  short: string; // "d"
  compound: string; // "Delasolre"
}

interface StepVariant {
  hexachord: "durum" | "naturale" | "molle";
  solmization: string;
}

interface Step {
  name: StepName | null;
  hexachord: "durum" | "naturale" | "molle" | null;
  solmization: string | null;
  variants: StepVariant[];
  hand: { finger: Finger; region: Region } | null;
  degree: number | null;
  role: "finalis" | "tenor" | "other" | null;
  ratio: number | null; // frequency ratio from tuning scale
}
```

### RatioResult

`ratio()` converts between cents, decimal ratios, and colon display notation. Accepts Scala-convention strings: period = cents (`"701.955"`), slash or colon = ratio (`"3/2"`, `"3:2"`), bare integer = ratio (`"2"` = 2:1). Returns a matching `Step` when the ratio corresponds to a scale degree in the current tuning.

```ts
interface RatioResult {
  ratio: number;   // decimal frequency ratio
  cents: number;   // interval in cents
  display: string; // colon notation, e.g. "3:2"
}
```

### GamutOptions, TonusOpts, Tonus

```ts
interface GamutOptions {
  span?: [number, number]; // [lowest, highest] MIDI
  chromatic?: boolean; // include chromatic pitches, default false
}

interface TonusOpts {
  differentia?: string; // e.g. "6F", "4e"; mode comes from Temper, throws if "auto"
}

interface Tonus {
  mode: number;
  differentia: string;
  intonation: Note[];
  mediant: Note[];
  termination: Note[];
}
```

### ModeData

```ts
interface ModeProfile {
  mood: string;
  phrasing: "recitative" | "lyrical" | "hymnic" | "solemn";
  melodic: "rising" | "falling" | "arch" | "neutral";
  tendency: "melismatic" | "neumatic" | "syllabic" | "neutral";
}

interface ModeData {
  mode: number;
  name: string; // "Protus Authenticus"
  alias: string; // "dorian"
  family: string; // "Protus"
  type: "authentic" | "plagal";
  final: number; // finalis pitch class (C=0)
  tenor: number; // reciting tone pitch class
  scalePcs: number[]; // 7 diatonic pitch classes
  hexachords: ("durum" | "naturale" | "molle")[]; // rank-ordered
  profile: ModeProfile;
  cadences: { final: number[]; tenor: number[] };
  modulations: {
    regular: number[];
    conceded: number[];
    initials: number[];
  };
  ambitus: {
    lowest: number;
    highest: number;
    span: number;
  };
  species: {
    fifth: [number, number];
    fourth: [number, number];
  };
}
```

---

## Tabula Types

`tabula()` returns a flat normalized note table. Each row has positional indexes plus `Note` and `Step` fields inlined. Where field names overlap, `Note` takes precedence.

```ts
type NoteRole = "final" | "tenor" | "mod" | null;

interface TabulaRow {
  // position
  phraseIndex: number;
  syllableIndex: number;
  noteIndex: number;
  neumeIndex: number;

  // Note fields (see Note)
  midi: number;
  pc: number;
  oct: number;
  acc: number;
  spn: string;
  hz: number;
  bend: number;
  velocity: number | null;
  duration: number | null;
  arsis: number | null;
  thesis: number | null;

  // Step fields (see Step)
  nameSimple: string | null;
  nameCompound: string | null;
  hexachord: "durum" | "naturale" | "molle" | null;
  solmization: string | null;
  handFinger: Finger | null;
  handRegion: Region | null;
  degree: number | null;
  role: NoteRole;

  // additional analysis
  lyric: string;
  vowel: string;
  divisio: Divisio | null;
}

interface TabulaResult {
  rows: TabulaRow[];
}
```

---

## Summa Types

`summa()` returns computed metrics for a score.

```ts
interface NoteRange {
  min: number;
  max: number;
  span: number;
}

interface ArsisProfile {
  mean: number;
  variance: number;
}

interface CadenceDistribution {
  comma: number;
  tick: number;
  semicolon: number;
  colon: number;
  doubleBar: number;
}

interface ChantMetrics {
  phraseCount: number;
  noteCount: number;
  syllableCount: number;
  noteRange: NoteRange | null;
  ambitus: number | null;
  melismaRatio: number;
  melismaByPhrase: number[];
  ictusRate: number;
  arsisProfile: ArsisProfile | null;
  cadenceWeight: number;
  cadenceDistribution: CadenceDistribution;
  modalConformance: number | null; // 0–1, fraction of notes on structural pitches
  pcDistribution: Record<number, number>;
}
```

---

## Caelum Types

### Body

```ts
interface Body {
  name: BodyName;
  nomen: string; // Latin name ("Sol", "Luna", "Iuppiter", etc.)
  symbol: string; // Unicode symbol ("☉", "☾", "♃", etc.)
  helio: HelioPos;
  geo: GeoPos;
  speed: number; // deg/day (negative = retrograde)
  retrograde: boolean;
  magnitude: number;
  elongation: number; // deg from Sun (geocentric)
  phase: number; // 0–1 illuminated fraction
  apparentDiameter: number | { equ: number; pol: number }; // arcsec
  zodiac: number; // sign 0–11 (Aries=0 … Pisces=11)
  sign: string; // "Aries", "Taurus", etc.
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

### Aspect

Aspects are pure geometric data — angular relationships between geocentric body longitudes. Five classical aspects are detected: conjunction (0°), sextile (60°), square (90°), trine (120°), opposition (180°). Strength is a linear falloff from 1 (exact) to 0 (at orb limit).

```ts
interface Aspect {
  type: "conjunction" | "opposition" | "trine" | "square" | "sextile";
  bodies: [string, string];
  angle: number; // exact separation, deg
  orb: number; // degrees from exact aspect angle
  strength: number; // 0–1
}
```

---

## Error Contract

- Query functions return `[]` on no match, never throw.
- Builder functions throw `Error` with a descriptive message on invalid input.
- `ordo` throws on invalid `Chant` input.
- `temper.tonus()` throws if `mode` is `"auto"` — mode must be set explicitly.
- `comma` on `TemperOpts` throws if used with any tuning other than `"meantone"`.
- `scale` on `TemperOpts` requires `tuning: "custom"` — throws otherwise.

## Determinism Contract

- All pure transforms are deterministic for identical inputs and options.
- No runtime network requests are made.

---

## v1.1 Deferred

- Additional pitch/frequency conversion helpers, interval math, Scala format parsing
- `thesis` calculation verification and tuning
- planetary scale and music of the spheres emitters
