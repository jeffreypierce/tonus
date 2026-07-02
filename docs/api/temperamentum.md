# Tuning — `tonus.temperamentum`

The tuning engine: historical temperaments, the Guidonian gamut, the eight
modes, and psalm tones. For what the tunings *are* and when to choose each,
see [theory/tuning.md](../theory/tuning.md).

## `tonus.temperamentum(input?) -> Temperamentum`

Builds a tuning context. All pitch helper methods live on the returned
`Temperamentum` object.

```js
tonus.temperamentum()                                  // pythagorean, mode auto, A4=440
tonus.temperamentum("pythagorean")                     // string shorthand
tonus.temperamentum({ tuning: "meantone", comma: "1/4" })
tonus.temperamentum({ tuning: "ptolemy-intense" })     // just intonation (pure thirds)
tonus.temperamentum({ tuning: "ptolemy-soft" })        // septimal (7th harmonic)
tonus.temperamentum({ tuning: "ptolemy-equable" })     // undecimal (neutral intervals)
tonus.temperamentum({ tuning: "equal", mode: 3, a4: 415 })
tonus.temperamentum({ scale: ["1/1", "9/8", "5/4", /* … */] }) // custom array
tonus.temperamentum({ scale: "! meanquar.scl\n…" })    // Scala file
```

**`TemperamentumOpts`**

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `tuning` | `Tuning` | `"pythagorean"` | Base temperament |
| `mode` | `number \| "auto"` | `"auto"` | Gregorian mode (1–8); `"auto"` resolves from chant, falls back to UT (C) with no modal rotation |
| `a4` | `number` | `440` | A4 reference frequency in Hz |
| `root` | `number` | mode finalis | Root pitch class override (0–11) |
| `transpose` | `number` | `0` | Output semitone transposition |
| `comma` | `number \| string` | — | Meantone comma (`0.25`, `"1/4"`, `"1/3"`); ignored for other tunings |
| `scale` | `string \| string[]` | — | Scala `.scl` file string or array of 7/12 ratio/cent values; implies custom tuning, name taken from the Scala description |

**Tuning presets** (details and history in
[theory/tuning.md](../theory/tuning.md)):

| Name | Description |
| --- | --- |
| `"pythagorean"` | Pure fifths (3/2), no tempering. Default |
| `"meantone"` | Tempered fifths; `comma` controls the amount (default 1/4) |
| `"equal"` | 12-tone equal temperament |
| `"ptolemy-intense"` | Ptolemy's intense diatonic (*syntonon*) — classical just intonation, pure major thirds (5/4) |
| `"ptolemy-soft"` | Ptolemy's soft diatonic (*malakon*) — septimal tuning, 8/7 whole tone |
| `"ptolemy-equable"` | Ptolemy's equable diatonic (*homalon*) — undecimal tuning, neutral 12/11 seconds |

Any other string is accepted as a custom tuning name (e.g. from a Scala file
description).

```ts
type Tuning =
  | "pythagorean" | "meantone" | "equal"
  | "ptolemy-intense" | "ptolemy-soft" | "ptolemy-equable"
  | string;

type TemperamentumInput = BuiltinTuning | TemperamentumOpts;
```

**`Temperamentum`** — resolved context object

```ts
interface Temperamentum {
  // resolved
  tuning: Tuning;
  mode: number | "auto";
  a4: number;
  root: number;
  transpose: number;
  comma: number;

  // computed
  ratios: number[]; // frequency ratios relative to root, one per pitch class
  cents: number[];  // cent values 0–1200 per pitch class

  // methods
  nota(input: PitchInput): Pitch;
  gradus(input: PitchInput): Step;
  intervallum(a: PitchInput, b: PitchInput): Interval;
  ratio(input: string): RatioResult & { step: Step | null };
  neuma(inputs: PitchInput[]): Neume;
  gamut(opts?: GamutOptions): Pitch[];
  modus(mode: number): ModeData;
  tonus(opts?: TonusOpts): Tonus;
}
```

## PitchInput

Every method that takes a pitch accepts the same flexible input. All inputs
resolve to a pitch first; `transpose` is applied last as a uniform output
shift.

```ts
type PitchInput = number | string | PitchObject;

// number → MIDI note number
// string → SPN ("C4", "Eb3"), GABC letter ("d"), or Hz ("440hz")

interface PitchObject {
  midi?: number;
  spn?: string;
  hz?: number;
  gabc?: string;
  clef?: string;        // default "c4", only with gabc
  solfege?: string;     // modern fixed-do: "DO" | "RE" | "MI" | "FA" | "SOL" | "LA" | "SI"
  solmization?: string; // medieval: "UT" | "RE" | "MI" | "FA" | "SOL" | "LA"
  hexachord?: "durum" | "naturale" | "molle"; // default "naturale", only with solmization
}
```

## Pitch

`Pitch` is the tuned identity type — every pitch in tonus carries tuning
data since it is always resolved through a scale. Returned by
`temperamentum.nota()`, present in `Neume.pitches[]`, nested as `note.pitch`
in the score engine's `Note`, and referenced by `Attractor.pitch`.

```ts
interface Pitch {
  midi: number;
  pc: number;       // pitch class 0–11
  oct: number;
  acc: -1 | 0 | 1;  // flat, natural, sharp
  spn: string;      // scientific pitch name, e.g. "D4"
  hz: number;       // frequency in Hz (through the scale)
  offset: number;   // cents from 12-TET
  bend: number;     // 14-bit MIDI pitch bend, 8192 = center
  ratio: number;    // scale ratio for this pc
}
```

## Step

`Step` is modal/Guidonian annotation for a pitch class. Returned by
`temperamentum.gradus()` and nested as `note.step` in the score engine.
Carries no tuning data — that's on `Pitch`.

```ts
type Finger = "wrist" | "palm" | "thumb" | "index" | "middle" | "ring" | "pinky";
type Region = "base" | "mid" | "tip" | "top";

interface StepVariant {
  hexachord: "durum" | "naturale" | "molle";
  solmization: string;
}

interface Step {
  pc: number;                // pitch class 0–11
  name: string;              // "d" (Guidonian) or SPN letter fallback
  compound: string | null;   // "Delasolre"; null out of gamut
  hexachord: "durum" | "naturale" | "molle" | null;
  solmization: string | null; // null out of gamut
  variants: StepVariant[];   // available mutations across hexachords
  hand: { finger: Finger; region: Region } | null; // Guidonian hand position
  degree: number | null;     // 1–7 diatonic degree in mode
  role: "finalis" | "tenor" | "other" | null;
}
```

## Neume and Interval

```ts
type NeumeShape =
  | "punctum" | "pes" | "clivis" | "torculus" | "porrectus"
  | "scandicus" | "climacus"
  | "torculus resupinus" | "porrectus flexus" | "scandicus flexus"
  | "climacus resupinus" | "pes subpunctis"
  | "compound";

interface Neume {
  pitches: Pitch[];
  intervals: Interval[];
  shape: NeumeShape;
}

type IntervalClass =
  | "P1" | "m2" | "M2" | "m3" | "M3" | "P4" | "TT"
  | "P5" | "m6" | "M6" | "m7" | "M7" | "P8";
type IntervalQuality = "perfect" | "major" | "minor" | "augmented";
type IntervalDirection = "up" | "down" | "unison";

interface Interval {
  name: string;       // e.g. "Quinta", "Semitonium"
  alias?: string;     // e.g. "Diapente", "Diatessaron"
  quality: IntervalQuality;
  class: IntervalClass;
  direction: IntervalDirection;
  semitones: number;
  cents: number;
}
```

## RatioResult

`ratio()` converts between cents, decimal ratios, and colon display
notation. Accepts Scala-convention strings: period = cents (`"701.955"`),
slash or colon = ratio (`"3/2"`, `"3:2"`), bare integer = ratio (`"2"` =
2:1). Returns a matching `Step` when the ratio corresponds to a scale degree
in the current tuning.

```ts
interface RatioResult {
  ratio: number;   // decimal frequency ratio
  cents: number;   // interval in cents
  display: string; // colon notation, e.g. "3:2"
}
```

## Gamut and psalm tones

```ts
interface GamutOptions {
  span?: [number, number]; // [lowest, highest] MIDI
  chromatic?: boolean;     // include chromatic pitches, default false
}

interface TonusOpts {
  differentia?: string; // e.g. "6F", "4e"; mode comes from Temperamentum, throws if "auto"
}

interface Tonus {
  mode: number;
  differentia: string;
  intonation: Pitch[];
  mediant: Pitch[];
  termination: Pitch[];
}
```

## ModeData

```ts
interface ModeProfile {
  mood: string;
  phrasing: "recitative" | "lyrical" | "hymnic" | "solemn";
  melodic: "rising" | "falling" | "arch" | "neutral";
  tendency: "melismatic" | "neumatic" | "syllabic" | "neutral";
}

interface ModeData {
  mode: number;
  name: string;   // "Protus Authenticus"
  alias: string;  // "dorian"
  family: string; // "Protus"
  type: "authentic" | "plagal";
  final: number;      // finalis pitch class (C=0)
  tenor: number;      // reciting tone pitch class
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
