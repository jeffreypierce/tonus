# Tuning — `tonus.temperamentum`

The tuning engine: historical temperaments, the Guidonian gamut, the eight
modes, and psalm tones. What the tunings *are* and when to choose each:
[Theory & Context](#theory--context) below.

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
[Theory & Context](#theory--context)):

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
  intonatio: Pitch[];   // opening intonation formula
  mediatio: Pitch[];    // mediant cadence at the verse colon
  terminatio: Pitch[];  // termination cadence (per differentia)
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

## Theory & Context

What the `tuning:` presets actually are — the ratios, the history, and when
to choose each. The theme running through all of them: **you cannot have
pure fifths, pure thirds, and closed octaves at once.** Every tuning is a
decision about which purity to keep and which to sacrifice.

### Why chant cares

Gregorian chant is monophonic: a single unaccompanied line. Melodic
intervals are heard one after another, not stacked, so the ear tracks the
*melodic* quality of seconds, thirds, and fourths against a remembered
tonal center — there are no chords to beat against. This is why the Middle
Ages could live comfortably inside Pythagorean intonation, whose fifths and
fourths are perfect and whose thirds are bright and wide: in a melodic
idiom, a wide third is expressive color, not an out-of-tune triad.

The moment polyphony and organs arrive, sustained thirds start to beat, and
tuning history becomes a slow negotiation away from pure fifths toward pure
thirds — meantone — and finally to the great compromise of equal
temperament, where nothing is pure and everything is usable.

### The commas

Two small intervals drive everything:

- **Pythagorean comma** (~23.46 ¢): twelve pure fifths overshoot seven
  octaves by this much. `(3/2)¹² ≈ 129.75` vs `2⁷ = 128`. Any tuning built
  from pure fifths cannot close the circle.
- **Syntonic comma** (81/80, ~21.51 ¢): the gap between the Pythagorean
  third (81/64, four stacked fifths) and the pure third (5/4). This is the
  comma that meantone "means to" distribute — `comma: "1/4"` narrows each
  fifth by a quarter of it.

### The presets

#### `"pythagorean"` — the medieval default

All intervals derive from the pure fifth 3/2 and the octave. Whole tone
9/8 (~204 ¢); diatonic semitone (*limma*) 256/243 (~90 ¢); major third
81/64 (~408 ¢ — a full syntonic comma wider than pure).

This is the tuning of medieval theory from Boethius through the Guidonian
gamut: the monochord divisions taught in every treatise are Pythagorean.
For unaccompanied chant it is simply *correct* — melodic fifths and fourths
are perfect, the narrow limma gives half-steps a keen, leading quality, and
the wide third never has to serve as a consonance. tonus makes it the
default for the same reason the Middle Ages did.

```js
tonus.temperamentum(); // pythagorean, A4 = 440
```

#### `"meantone"` — the Renaissance compromise

Quarter-comma meantone (`comma: "1/4"`, the default) narrows every fifth by
¼ syntonic comma so that four of them stack to a **pure major third** (5/4).
Fifths beat gently (~697 ¢ instead of 702 ¢); most thirds are perfect;
and somewhere around G♯–E♭ lurks the *wolf* — the leftover fifth, wide by
~36 ¢, that gave the system its keyboard limits.

Historically this is the sound of the 16th–17th century organ and the
polyphonic choir. For tonus it matters when you want chant heard as the
Renaissance heard it — or accompanied. `comma` accepts other fractions
(`"1/3"` gives pure minor thirds, `"1/6"` leans toward the baroque
well-temperaments).

```js
tonus.temperamentum({ tuning: "meantone", comma: "1/4" });
```

#### The three Ptolemaic diatonics — antiquity's just intonations

Ptolemy (*Harmonics* I.15–16, 2nd c.) catalogued tetrachord divisions by
their ratio "shades" (χρόαι). tonus implements his three diatonics, which
between them cover just, septimal, and neutral intonation:

- **`"ptolemy-intense"`** (*syntonon*) — the tense diatonic: tetrachord
  steps 9/8 · 10/9 · 16/15. This is **classical just intonation**: pure
  major thirds (5/4), pure minor thirds (6/5), and two sizes of whole tone.
  Renaissance theorists (Zarlino) later canonized exactly this division as
  the "natural" scale. Choose it when you want maximally consonant vertical
  sonorities — including coherence with the Ptolemy doctrina in
  [`harmonia`](heavens.md).
- **`"ptolemy-soft"`** (*malakon*) — the soft diatonic: 8/7 · 10/9 · 21/20.
  Septimal — the 7th harmonic enters, giving a large, relaxed whole tone
  (8/7, ~231 ¢) and a distinctive dark color foreign to the later Western
  canon.
- **`"ptolemy-equable"`** (*homalon*) — the equable diatonic:
  10/9 · 11/10 · 12/11. Undecimal — nearly equal steps around ~150–182 ¢,
  producing *neutral* seconds and thirds (between major and minor). Its
  sound-world is closer to some Near-Eastern practice than to anything in
  the Latin tradition; Ptolemy himself presents it as an outlier.

```js
tonus.temperamentum({ tuning: "ptolemy-intense" });
```

#### `"equal"` — the modern baseline

Twelve identical semitones of 100 ¢; every fifth 2 ¢ narrow, every major
third 14 ¢ wide, nothing pure, nothing unusable. Anachronistic for chant by
some seven centuries, but indispensable as a reference point and for
interoperating with modern instruments and MIDI defaults.

```js
tonus.temperamentum({ tuning: "equal", a4: 415 }); // equal at baroque pitch
```

#### Custom scales and Scala files

Any 7- or 12-step scale can be supplied as ratios or cents, or as a
[Scala `.scl`](https://www.huygens-fokker.org/scala/scl_format.html) file —
the standard exchange format of the microtonal community, giving access to
thousands of historical and experimental tunings.

```js
tonus.temperamentum({ scale: ["1/1", "9/8", "5/4", "4/3", "3/2", "5/3", "15/8"] });
tonus.temperamentum({ scale: sclFileString }); // name taken from the file
```

### The scale degrees compared

Cents from the root, C-major degrees:

| Degree | Pythagorean | ¼-comma meantone | Ptolemy intense | Equal |
| --- | --- | --- | --- | --- |
| C | 0 | 0 | 0 | 0 |
| D | 204 | 193 | 204 | 200 |
| E | 408 | 386 | 386 | 400 |
| F | 498 | 503 | 498 | 500 |
| G | 702 | 697 | 702 | 700 |
| A | 906 | 890 | 884 | 900 |
| B | 1110 | 1083 | 1088 | 1100 |

Read the E column: 408 (bright Pythagorean ditone) → 386 (pure 5/4, both
meantone and Ptolemy) → 400 (the equal-tempered average). That one number
is most of Western tuning history.

### Choosing

| You want… | Use |
| --- | --- |
| Chant as the medieval theorists tuned it | `"pythagorean"` (default) |
| Chant with Renaissance-era accompaniment | `"meantone"` |
| Maximal vertical consonance / harmonia coherence | `"ptolemy-intense"` |
| Septimal or neutral-interval color | `"ptolemy-soft"` / `"ptolemy-equable"` |
| Modern-instrument interop | `"equal"` |
| Anything else | `scale:` with ratios, cents, or a Scala file |

The planetary-scale derivations in
[heavens.md](heavens.md#theory--context) use the same Pythagorean interval
arithmetic laid out here.

## Sources

- Boethius, *De institutione musica* — the medieval transmission of
  Pythagorean interval math.
- Ptolemy, *Harmonics* I.15–16 — the diatonic shades.
- J. Murray Barbour, *Tuning and Temperament: A Historical Survey* (1951) —
  the standard survey of the meantone and equal-temperament transitions.
- Scala scale archive and `.scl` format, Manuel Op de Coul, Huygens-Fokker
  Foundation — <https://www.huygens-fokker.org/scala/scl_format.html>.
- Guido of Arezzo's gamut and solmization, and the eight-mode system, as
  standardized in medieval theory (gamut, hexachords, modes, psalm tones).
