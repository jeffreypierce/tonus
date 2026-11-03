# Tuning

`tonus.temperamentum` is the library's model of medieval pitch. It builds
a tuning context (temperament, mode, A4) and returns helper functions to tune and analyze pitch content. The engine may be used alone. It
reads two things from the rest of the library, both for `modus(n).cadences`:
the mined cadence catalogue and the score engine's cadence names. Every pitch
elsewhere in tonus is resolved through one of these contexts. The default
tuning is Pythagorean, as in the treatises.

- [Tuning](#tuning)
  - [The context — `temperamentum`](#the-context--temperamentum)
  - [Pitch input](#pitch-input)
  - [Pitches — `nota`](#pitches--nota)
  - [Steps — `gradus`](#steps--gradus)
  - [Intervals — `intervallum`](#intervals--intervallum)
  - [Neumes — `neuma`](#neumes--neuma)
  - [Ratios — `ratio`](#ratios--ratio)
  - [The gamut — `gamut`](#the-gamut--gamut)
  - [Modes — `modus`](#modes--modus)
    - [The mode's cadences — `modus(n).cadences`](#the-modes-cadences--modusncadences)
    - [The corpus catalogue — `CADENTIAE`](#the-corpus-catalogue--cadentiae)
      - [Lift — how mode-bound a close is](#lift--how-mode-bound-a-close-is)
  - [Psalm tones — `tonus`](#psalm-tones--tonus)
  - [Theory \& Context](#theory--context)
    - [The presets](#the-presets)
  - [Sources](#sources)

## The context — `temperamentum`

`temperamentum(input?)` returns a `Temperamentum`. The input is a tuning
name, an options object, or nothing; with nothing, the context is
Pythagorean, mode `"auto"`, A4 = 440 Hz. Invalid input throws: an unknown
option key, a `comma` outside [0, 1], a `root` that is not an integer 0–11, a
non-positive `a4`, a fractional `transpose`, an empty `scale`, or a ratio that
is not a positive number.

```js
tonus.temperamentum(); // pythagorean, mode auto, A4=440
tonus.temperamentum("pythagorean"); // string shorthand
tonus.temperamentum({ tuning: "meantone", comma: "1/4" });
tonus.temperamentum({ tuning: "ptolemy-intense" }); // just intonation
tonus.temperamentum({ tuning: "equal", mode: 3, a4: 415 });
tonus.temperamentum({ scale: ["1/1", "9/8", "5/4" /* … */] }); // custom array
tonus.temperamentum({ scale: "! meanquar.scl\n…" }); // Scala file
```

**`TemperamentumOpts`**

| Field       | Type                 | Default         | Description                                                                                                               |
| ----------- | -------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `tuning`    | `Tuning`             | `"pythagorean"` | Base temperament                                                                                                          |
| `mode`      | `number \| "auto"`   | `"auto"`        | Gregorian mode (1–8); `"auto"` resolves from chant, falls back to mode 1 (final D)                                        |
| `a4`        | `number`             | `440`           | A4 reference frequency in Hz                                                                                              |
| `root`      | `number`             | mode finalis    | Pitch class (integer 0–11) the ratio table is normalized to                                                               |
| `transpose` | `number`             | `0`             | Output transposition, whole semitones                                                                                     |
| `comma`     | `number \| string`   | —               | Meantone comma, a fraction of the syntonic comma in [0, 1] (`0.25`, `"1/4"`, `"1/3"`); ignored for other tunings          |
| `scale`     | `string \| string[]` | —               | Scala `.scl` file string or array of 7/12 ratio/cent values, beginning at `1/1` (degree list) or ending at `2/1` (Scala convention); implies custom tuning, name from the Scala description |

The tuning presets:

| Name                | Description                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------- |
| `"pythagorean"`     | Pure fifths (3/2), no tempering. Default                                                     |
| `"meantone"`        | Tempered fifths; `comma` controls the amount (default 1/4)                                   |
| `"equal"`           | 12-tone equal temperament                                                                    |
| `"ptolemy-intense"` | Ptolemy's intense diatonic (_syntonon_) — classical just intonation, pure major thirds (5/4) |
| `"ptolemy-soft"`    | Ptolemy's soft diatonic (_malakon_) — septimal tuning, 8/7 whole tone                        |
| `"ptolemy-equable"` | Ptolemy's equable diatonic (_homalon_) — undecimal tuning, neutral 12/11 seconds             |

`root` changes what the table is measured from (`ratios`, `cents`, and each
pitch's `ratio`), never a frequency. Frequencies are anchored at A4, so a pitch
sounds the same whatever the root.

What each preset is, and when to choose it, is treated in
[Theory & Context](#theory--context). Any other string is accepted as a
custom tuning name (for instance, from a Scala file description).

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
  cents: number[]; // cent values per pitch class, relative to root

  // methods
  nota(input: PitchInput): Pitch;
  gradus(input: PitchInput): Step;
  intervallum(a: PitchInput, b: PitchInput): Interval;
  ratio(input: string): RatioResult & { step: Step | null };
  neuma(inputs: PitchInput[]): Neume;
  gamut(opts?: GamutOptions): Pitch[];
  modus(mode: number): Modus;
  tonus(opts?: TonusOpts): Tonus;
}
```

## Pitch input

Every method that takes a pitch accepts the same forms. A number is a MIDI
note (a non-integer or a value past 127 reads as a frequency in Hz); a
string is scientific pitch notation or a GABC letter; an object addresses
one system explicitly (`{ hz: 293.33 }` for an exact frequency). A frequency
must be positive. All inputs resolve to a pitch first; `transpose` is applied
last, as a uniform shift of what `nota` and `neuma` return. `gradus` names the
written pitch, untransposed, and `intervallum` is unchanged by a uniform shift.

```js
t.nota(62); // MIDI
t.nota("D4"); // scientific pitch notation
t.nota(293.33); // frequency (any non-integer, or > 127)
t.nota({ gabc: "d", clef: "c4" }); // GABC letter under a clef
t.nota({ solmization: "RE", hexachord: "naturale" }); // hexachordal address
t.nota("RE"); // modern fixed-do syllable, octave 4
```

A bare string is read in this order: scientific pitch notation (`"D4"`,
`"Bb3"`); an uppercase fixed-do syllable (`"DO"`/`"UT"`, `"RE"`, `"MI"`,
`"FA"`, `"SOL"`/`"SO"`, `"LA"`, `"TE"` for B-flat, `"TI"`/`"SI"`), in octave
4; a single lowercase GABC letter, read under the `c4` clef (pass
`{ gabc, clef }` for any other).

```ts
type PitchInput = number | string | PitchObject;

interface PitchObject {
  midi?: number;
  spn?: string;
  hz?: number;
  gabc?: string; // the clef fixes its octave
  clef?: string; // default "c4", only with gabc
  solfege?: string; // modern fixed-do: "DO" | "UT" | "RE" | "MI" | "FA" | "SOL" | "SO" | "LA" | "TE" | "TI" | "SI"
  solmization?: string; // medieval: "UT" | "RE" | "MI" | "FA" | "SOL" | "LA"
  hexachord?: "durum" | "naturale" | "molle"; // only with solmization; default the mode's principal hexachord
  oct?: number; // octave, default 4; only with solfege or solmization
}
```

The `hexachord` default is the context mode's principal hexachord
(`MODES[n].hexachords[0]`): _naturale_ for modes 1–4 and for `"auto"`,
_molle_ for 5 and 6, _durum_ for 7 and 8.

```js
tonus.temperamentum({ mode: 5 }).nota({ solmization: "FA" }).spn; // "Bb4" — fa of the molle
```

## Pitches — `nota`

`nota` resolves any pitch input to a tuned `Pitch`. The frequency comes
through the scale; the same note name lands on a different frequency in a
different tuning.

```js
const t = tonus.temperamentum({ mode: 1 }); // pythagorean

t.nota("D4");
// { midi: 62, pc: 2, oct: 4, acc: 0, spn: "D4",
//   hz: 293.33, offset: -1.96, bend: 8112, ratio: 1 }

tonus.temperamentum().nota("C4").hz; // 260.74  pythagorean
tonus.temperamentum("meantone").nota("C4").hz; // 263.18  quarter-comma
tonus.temperamentum("equal").nota("C4").hz; // 261.63  equal
```

A spelled input keeps its spelling: `nota("Db4").spn` is `"Db4"`, and
`nota("C#4").spn` is `"C#4"`. An accidental may carry the pitch across C, so
`"B#4"` is MIDI 72 and `"Cb4"` MIDI 59. A pitch given without a spelling (a
number, a frequency) takes the flat for E♭, A♭ and B♭ and the sharp otherwise.

`offset` is the distance in cents from the equal-tempered pitch of the same
MIDI number; `bend` is the corresponding 14-bit MIDI pitch bend. `Pitch` is
the tuned identity type used everywhere in tonus: in `Neume.pitches`, as
`note.pitch` in the score engine, and on `Attractor.pitch` in the imprint.

```ts
interface Pitch {
  midi: number;
  pc: number; // pitch class 0–11
  oct: number;
  acc: -1 | 0 | 1; // flat, natural, sharp
  spn: string; // scientific pitch name, e.g. "D4"
  hz: number; // frequency in Hz (through the scale)
  offset: number; // cents from 12-TET
  bend: number; // 14-bit MIDI pitch bend, 8192 = center
  ratio: number; // scale ratio for this pc
}
```

## Steps — `gradus`

`gradus` returns the modal and Guidonian identity of a pitch class: its
letter, its compound name, its hexachord and solmization syllable, the
mutations available to it, its position on the Guidonian hand, and its
degree and role in the current mode. `Step` carries no tuning data; that is
`Pitch`'s office.

```js
const t = tonus.temperamentum({ mode: 1 });

t.gradus("D4");
// { pc: 2, name: "d", nomen: "Delasolre",
//   hexachord: "naturale", solmization: "RE",
//   variants: [ { hexachord: "durum",    solmization: "SOL" },
//               { hexachord: "naturale", solmization: "RE"  },
//               { hexachord: "molle",    solmization: "LA"  } ],
//   hand: { finger: "middle", region: "tip" },
//   degree: 1, role: "finalis" }
```

The `variants` array lists the step's solmization in every hexachord that
contains it; these are the mutations a medieval singer had available at
that step. `degree` and `role` read against the resolved mode (`"auto"`
falls back to mode 1); for a chromatic pitch outside the mode's scale they
are `null`.

`nomen`, `solmization` and `hand` are `null` only for the chromatic pitch
classes the gamut does not hold (C♯, E♭, F♯, G♯). A diatonic pitch above or
below the gamut takes the nearest gamut letter of its class: `gradus("D6")`
names dd, _Delasol_.

The hand position names the joint a singer would point to. The loci follow the
canonical counter-clockwise spiral (Γ ut at the thumb tip, across the finger
bases, up the little finger, back across the tips, in), not a linear fill:

| `hand` field | values                              |
| ------------ | ----------------------------------- |
| `finger`     | thumb, index, middle, ring, pinky   |
| `region`     | base, mid, top, tip, super          |

```ts
interface StepVariant {
  hexachord: "durum" | "naturale" | "molle";
  solmization: string;
}

interface Step {
  pc: number; // pitch class 0–11
  name: string; // "d" (Guidonian) or SPN letter fallback
  nomen: string | null; // "Delasolre"; null out of gamut
  hexachord: "durum" | "naturale" | "molle" | null;
  solmization: string | null; // null out of gamut
  variants: StepVariant[]; // available mutations across hexachords
  hand: { finger: string; region: string } | null; // Guidonian hand position
  degree: number | null; // 1–7 diatonic degree in mode
  role: "finalis" | "tenor" | "alia" | null;
}
```

## Intervals — `intervallum`

`intervallum` classifies the interval between two pitches: its Latin name,
its Greek alias where one exists, its quality, class, direction, and
consonance grade.

```js
t.intervallum("D4", "A4");
// { nomen: "Quinta", alias: "Diapente", quality: "perfect",
//   class: "P5", direction: "up", semitones: 7, cents: 700,
//   consonance: "perfect" }
```

`semitones` and `cents` describe the interval in nominal (equal-tempered)
terms. A compound interval keeps its full `semitones` and `cents`, but is named
and classed as its simple reduction: D4 to A5 is `"Quinta"`, `P5`, 19
semitones. The consonance grade is that of counterpoint from the fourteenth
century on, where a fourth above the lowest voice counts as a dissonance; it
grades simultaneities, not melody. The tuned distance between two particular pitches
is the ratio of their frequencies; take it from `nota`.

| field        | values                                                           |
| ------------ | ---------------------------------------------------------------- |
| `class`      | `P1` `m2` `M2` `m3` `M3` `P4` `TT` `P5` `m6` `M6` `m7` `M7` `P8` |
| `quality`    | perfect, major, minor, augmented                                 |
| `direction`  | up, down, unison                                                 |
| `consonance` | perfect, imperfect, dissonant                                    |

```ts
interface Interval {
  nomen: string; // e.g. "Quinta", "Semitonium"
  alias?: string; // e.g. "Diapente", "Diatessaron"
  quality: string;
  class: string;
  direction: string;
  semitones: number;
  cents: number; // nominal class value
  consonance: string;
}
```

## Neumes — `neuma`

The neume is chant's unit of notation: a group of notes written as one
figure and sung on one syllable. `neuma` classifies a sequence of pitches
as a neume shape, under the Solesmes nomenclature, and returns the tuned
pitches with the intervals between them.

```js
t.neuma(["D4", "F4", "E4"]);
// shape: "torculus" — up, then down
// intervals: Tertia minor, Semitonium
```

Shapes that match no simple figure classify as `"compound"`.

| `shape`     | figure             | `shape`                | figure                          |
| ----------- | ------------------ | ---------------------- | ------------------------------- |
| `punctum`   | a single note      | `torculus resupinus`   | torculus, then rising           |
| `pes`       | two notes, rising  | `porrectus flexus`     | porrectus, then falling         |
| `clivis`    | two notes, falling | `scandicus flexus`     | scandicus, then falling         |
| `torculus`  | three: up, down    | `climacus resupinus`   | climacus, then rising           |
| `porrectus` | three: down, up    | `pes subpunctis`       | pes, then descending points     |
| `scandicus` | three, rising      | `scandicus subpunctis` | two rising, then descending     |
| `climacus`  | three, falling     | `salicus`              | rising, next-to-last an oriscus |

The repercussive figures restate a pitch rather than leave it.

| `shape`            | figure              | `shape`         | figure                 |
| ------------------ | ------------------- | --------------- | ---------------------- |
| `distropha`        | two on one pitch    | `pressus`       | restated, then falling |
| `tristropha`       | three on one pitch  | `pressus maior` | falling in, then out   |
| `tristropha flexa` | three, then falling | `compound`      | any figure not above   |

The liquescent figures are the pes, clivis and climacus ending on the
diminished half-note. The name comes from a written mark that pitches cannot
carry, so, like the salicus, only the score names them (`notatio`, see
[score.md](score.md)). `neuma` never returns them.

| `shape`      | figure                           |
| ------------ | -------------------------------- |
| `epiphonus`  | a pes, upper note liquescent     |
| `cephalicus` | a clivis, lower note liquescent  |
| `ancus`      | a climacus, last note liquescent |

```ts
interface Neume {
  pitches: Pitch[];
  intervals: Interval[];
  shape: string; // a value from the table above
}
```

## Ratios — `ratio`

`ratio` converts between cents, decimal ratios, and colon display
notation, following the Scala conventions: a period means cents
(`"701.955"`); a slash, colon, or bare integer means a ratio (`"3/2"`,
`"3:2"`, `"2"`). When the ratio corresponds to a degree of the current
scale, the matching `Step` is returned with it. The match is octave-free, so a
ratio below 1/1 or past 2/1 finds its pitch class (`ratio("16/9")` in mode 1 is
the c above the final). A ratio must be positive; `"0/1"`, `"-5"` and trailing
junk such as `"1/4abc"` throw `RangeError`.

```js
t.ratio("3/2");
// { ratio: 1.5, cents: 701.96, display: "3:2",
//   step: { nomen: "Alamire", degree: 5, role: "tenor", … } }
```

In mode 1 the pure fifth lands on the tenor; the step field says so. A
fraction displays as written, reduced (`"2187/2048"` stays `"2187:2048"`);
cents and decimals display the nearest simple fraction.

```ts
interface RatioResult {
  ratio: number; // decimal frequency ratio
  cents: number; // interval in cents
  display: string; // colon notation, e.g. "3:2"
}
```

## The gamut — `gamut`

The gamut is the medieval note-space: the ordered range of singable
pitches Guido's system named from Gammaut upward. `gamut` returns the
tuned pitches of the scale across a span. With a mode set, the default
span is the mode's ambitus; mode 1 yields eight diatonic pitches from D3
to D4. The `chromatic` option adds the chromatic degrees; `span` sets
explicit MIDI bounds.

```js
const g = t.gamut(); // 8 pitches, D3 … D4 (mode 1 ambitus)
t.gamut({ span: [48, 72], chromatic: true });
```

```ts
interface GamutOptions {
  span?: [number, number]; // [lowest, highest] MIDI
  chromatic?: boolean; // include chromatic pitches, default false
}
```

## Modes — `modus`

`modus` returns the full profile of one of the eight modes, as the
medieval tonaries describe them:

- its identity: Latin name, modern alias, _maneria_ (the family: Protus,
  Deuterus, Tritus, Tetrardus), and authentic or plagal type;
- its structure: finalis, tenor, scale degrees, ambitus, and the species
  of fifth and fourth that build it;
- its practice: hexachords in rank order, melodic profile, and permitted
  modulations;
- its cadences, read from the corpus catalogue at call (below).

Each mode also carries its traditional **ethos** (the character medieval theory
ascribed to it) as both a Latin epithet (`gravis`, `tristis`, …) and an English
gloss. The full set and its source are at the data, in
[`temper/data/modes.ts`](https://github.com/jeffreypierce/tonus/blob/main/src/engines/temper/data/modes.ts).

The `modulations` fields are the mode's tonal centres and valid openings,
transcribed from Rockstro's Grove table [`rockstro-grove`](https://github.com/jeffreypierce/tonus/blob/main/BIBLIOGRAPHY.md):
`regular` (the final, then Dominant, Mediant and Participant, in the order
Rockstro ranks them), `conceded`, `initials` (the Absolute Initials, the
notes a melody's first phrase may begin on) and `rareInitials` (those he marks
"barely used"). Each value is **one pitch**, in semitones above C3, the frame
`ambitus` uses: mode II's A2 is `-3`, mode VII's d is `14`. Take a pitch class
with `((v % 12) + 12) % 12`. How the chart's capital letters were placed in
their octaves is documented at the data, in [`temper/data/modes.ts`](https://github.com/jeffreypierce/tonus/blob/main/src/engines/temper/data/modes.ts).

The `ambitus` is the mode's one-octave range, Rockstro's Range column, in the
same frame: the authentic modes run final to final (mode I D3–D4), the plagal
modes a fourth lower (mode II A2–A3, IV B2–B3, VI C3–C4, VIII D3–D4).

`modus` resolves the mode's structural pitches through its own
temperamentum: the **finalis** and **reciting** tone as tuned notes (pitch +
Guidonian step), placed inside the ambitus, and **ambitusNotes**, the mode's
diatonic range walked out note by note. Steps read against the mode asked
for, whatever the context's own mode. The raw `ModeData` fields (`final`,
`tenor`, `ambitus`, …) remain alongside, because `Modus` extends `ModeData`.

```js
t.modus(1);
// { mode: 1, nomen: "Protus Authenticus", alias: "dorian",
//   maneria: "Protus", type: "authentic",
//   final: 2, tenor: 9,
//   finalis: { pitch: <D3 146.67 Hz>, step: { … role: "finalis" } },
//   reciting: { pitch: <A3>, step: { … role: "tenor" } },
//   ambitusNotes: [ <D3>, <E3>, <F3>, … <D4> ],
//   profile: { mood: "serious", ethos: "gravis", … }, … }
```

```ts
interface ModeProfile {
  mood: string; // English gloss of the ethos, e.g. "serious"
  ethos: string; // traditional Latin epithet, e.g. "gravis"
  phrasing: "recitative" | "lyrical" | "hymnic" | "solemn";
  melodic: "rising" | "falling" | "arch" | "neutral";
  tendency: "melismatic" | "neumatic" | "syllabic" | "neutral";
}

interface ModeData {
  mode: number;
  nomen: string; // "Protus Authenticus"
  alias: string; // "dorian" (modern name)
  maneria: string; // "Protus" — the mode family
  type: "authentic" | "plagal";
  final: number; // finalis pitch class (C=0)
  tenor: number; // reciting tone pitch class
  recitingNotes: { pc: number; rank: string; label: string }[]; // tenor + secondary reciting pitches
  scalePcs: number[]; // 7 diatonic pitch classes
  hexachords: ("durum" | "naturale" | "molle")[]; // rank-ordered
  profile: ModeProfile;
  modulations: {
    regular: number[]; // final, Dominant, Mediant, Participant: pitches above C3
    conceded: number[];
    initials: number[]; // the Absolute Initials
    rareInitials: number[]; // the initials Rockstro marks "barely used"
  };
  ambitus: {
    lowest: number; // semitones above C3, e.g. mode II's A2 = -3
    highest: number;
    span: number; // 12: one octave
  };
  species: {
    fifth: [number, number];
    fourth: [number, number];
  };
}

interface TunedNote {
  pitch: Pitch; // tuned through the temperamentum
  step: Step; // Guidonian annotation
}

interface Modus extends ModeData {
  finalis: TunedNote; // the final, tuned
  reciting: TunedNote; // the tenor / reciting tone, tuned
  ambitusNotes: TunedNote[]; // every diatonic step across the mode's range
  cadences: ModusCadentiae; // the five genera the mode closes on (below)
}
```

### The mode's cadences — `modus(n).cadences`

Each mode reads its own set out of the corpus catalogue below, derived at
call: the **five** genera the mode's phrases most often close on, each with
its three commonest species in the mode. Five is a fixed count, not a
threshold. Measured at five, six of the eight modes' tenors appear in their
own set (1, 5 and 7 rest on the fifth, 4 on the fourth, 2 rests on and 6 steps
up to the third); at four, modes 4, 5 and 6 had none. Modes 3 and 8 stay
loose, their tenor closes ranking 18th and 8th.

```ts
interface ModusCadentiae {
  ends: number;    // the mode's phrase-ends, the denominator
  covered: number; // share of them the five genera account for
  genera: ModusGenus[]; // commonest first
}

interface ModusGenus {
  key: string;      // "cadens @0"
  nomen: string;    // "cadens finalis" — the two-word name, the printed form
  motion: string;   // "cadens"
  degree: number;   // 0 = the final, -1 = below, +4 = the fifth
  role: "finalis" | "tenor" | "alia"; // the mode's reading of the degree
  n: number;        // the mode's phrase-ends landing here
  share: number;    // n / ends
  finality: number; // share of those at a final close, in this mode
  species: { key: string; tail: number[]; n: number; share: number; finality: number }[];
}
```

```js
tonus.temperamentum().modus(1).cadences.genera.map((g) => [g.key, g.nomen, g.share]);
// [["insistens @0", "insistens finalis", 0.171], ["cadens @0", "cadens finalis", 0.153],
//  ["insistens @4", "insistens tenor", 0.076], ["cadens @-1", "cadens subfinalis", 0.066],
//  ["surgens @0", "surgens finalis", 0.049]]
```

The static `MODES` table carries no cadences: reference data is fixed, a
cadence is a measurement, and measurements ride the verb. The treatises'
received figures (Niedermeyer & d'Ortigue, Bragers) are a reference note
beside the table, not data; every one of them is a species of the key.

### The corpus catalogue — `CADENTIAE`

[`CADENTIAE`](index.md#the-appendix) is **mined**: every phrase-end in the
sung corpus, keyed by what the melody did. The key is the closing tail in
**letter steps** from the chant's own closing note, resolution last, signed,
not octave-reduced ([score.md](score.md#one-key-two-levels)), read at two
levels. A **genus** is the last motion and the landing, `"cadens @0"`, the
level at which counts hold per mode. A **species** is the whole collapsed
tail, at most three notes, `"2,1,0"`, the cadence itself. The motion words
and the landing's word are [score.md's](score.md#one-key-two-levels).

The 48 genera above a floor of 50 occurrences hold 99% of all phrase-ends;
under them, 119 species above the same floor hold 96%. The rest is real but
too thin to characterise, and rarer than anything tabled.

```ts
interface CadentiaGenus {
  key: string;      // "<motion> @<degree>" — the name, and the join
  motion: string;   // "insistens" | "cadens" | "surgens" | "translabens" | …
  degree: number;   // SIGNED letter steps from the chant's own closing note
  n: number;        // corpus occurrences
  share: number;    // n over ALL phrase-ends (CADENTIAE_POPULATION.ends)
  finality: number; // share of those occurrences at a final close
  modes: Record<string, number>;  // occurrences by mode digit ("?" = mode-less)
  closes: Record<string, number>; // occurrences at a final close, by mode digit
  species: CadentiaSpecies[];     // the tabled species under it, commonest first
}

interface CadentiaSpecies {
  key: string;   // "2,1,0" — the tail, and the join
  tail: number[];
  n: number; share: number; finality: number;
  modes: Record<string, number>; closes: Record<string, number>;
}
```

`share` is taken against **every** phrase-end, not against the tabled subset.
The denominator ships beside the table:

```ts
CADENTIAE_POPULATION.ends;   // 66565 — all phrase-ends, sung corpus
CADENTIAE_POPULATION.byMode; // the same total per mode digit
```

#### Lift — how mode-bound a close is

`modes` and `byMode` share a denominator, so a genus' **lift** in a given
mode is one division: how much more (or less) that mode reaches for this close
than the corpus at large.

```js
import { CADENTIAE, CADENTIAE_POPULATION as POP } from "tonus";

const genus = CADENTIAE.find((g) => g.key === "insistens @4");
const lift = (g, mode) =>
  (g.modes[String(mode)] / POP.byMode[String(mode)]) / g.share;

lift(genus, 7); // 2.4 — mode 7 rests on its fifth far more than the corpus does
lift(genus, 4); // 0.03 — mode 4 almost never
```

**The ratio is not baked.** The table exports the vocabulary (counts and
their denominators) and leaves the arithmetic to the caller. Two cautions when
you take it: below roughly ten in-mode occurrences the ratio is one or two
chants deciding a number that reads like a measurement, and a mode-less chant
(`"?"`) has no denominator at all. In both cases fall back to `share`. The
tonarium prints the in-mode **share** under a cadence, not the lift
([score.md](score.md#the-analysis-tracks)).

## Psalm tones — `tonus`

`tonus` returns the recitation formula of the context's mode as tuned
pitches: the **tenor** (the reciting note), the **intonatio** (the opening
rise), the **mediatio** (the cadence at the verse's colon), and the
**terminatio** (the closing cadence). The termination varies by
**differentia**, the cadential variant chosen to lead back into the
antiphon; the mode's default differentia is used when none is given. The
mode must be set explicitly, because with mode `"auto"`, `tonus()` throws.

```js
const t = tonus.temperamentum({ mode: 1 });

t.tonus();
// { mode: 1, differentia: "1g", tenor: A3,
//   intonatio:  [F3, G3, A3],
//   mediatio:   [Bb3, A3, G3, A3],
//   terminatio: [G3, F3, G3, A3, G3] }   // each entry a tuned Pitch

t.tonus({ differentia: "1f" }).terminatio; // [G3, F3, G3, A3, G3, F3]
```

Each formula is the cadence's pitch sequence, a neume on one syllable
appearing as its notes in order (tone I's accented g-a). Which syllable takes
which note is the office of [`tonus.psalmus`](chant.md#psalms--psalmus), which
returns GABC-encoded verses pointed to the tone.

A differentia code is the mode, then the letter of the termination's last
note: `1g` ends on g, `8c` on c. A capital marks an ending on the mode's final
(`1D`, `2D`, `4E`, `6F`, `8G`) or on a, the final of the transposed fourth
mode (`4A`). A digit marks a further variant on the same note. A `*` marks one
that closes on the named note and then rises a step (`8G*`: g, a). The code
matches without regard to case (`"4e"` is `4E`). A code the tone does not have
throws `RangeError`, listing the tone's codes.

| Tone       | Tenor | Differentiae                                  | Default |
| ---------- | ----- | --------------------------------------------- | ------- |
| I          | a     | `1D` `1D2` `1f` `1g` `1g2` `1a` `1a2` `1a3`   | `1g`    |
| II         | F     | `2D`                                          | `2D`    |
| III        | c     | `3a` `3a2` `3b` `3g`                          | `3a`    |
| IV         | a     | `4E` `4g`; `4A` `4A*` on the tenor d          | `4E`    |
| V          | c     | `5a`                                          | `5a`    |
| VI         | a     | `6F`                                          | `6F`    |
| VII        | d     | `7a` `7b` `7c` `7c2` `7d`                     | `7a`    |
| VIII       | c     | `8G` `8G*` `8c`                               | `8G`    |
| Peregrinus | a, g  | `per`                                         | `per`   |

Tone IV's A endings are sung on the transposed tone, a fourth higher: with
`4A` or `4A*` the tenor is d and the intonation and mediant are the
transposed ones. The tonus peregrinus (mode 0, the `TONES` table) recites on a
in the first half and on g in the second (`secondTenor`). Its intonation and
mediant are not transcribed, and are empty.

No tone carries a solemn (ornamented) mediant. `PsalmTone.solemnMediant` is
reserved for one and is absent throughout.

```ts
interface TonusOpts {
  differentia?: string; // e.g. "6F", "4E"; mode comes from Temperamentum, throws if "auto"
}

interface Tonus {
  mode: number;
  differentia: string; // the code, as the table spells it
  tenor: Pitch; // the reciting note (the differentia's own, for 4A)
  intonatio: Pitch[]; // opening intonation formula
  mediatio: Pitch[]; // mediant cadence at the verse colon
  terminatio: Pitch[]; // termination cadence (per differentia)
}
```

The tones are transcribed from the Liber Usualis. Where the corpus prints a
pointed verse (tones I, II, VII, VIII, IV A*) or an antiphon's _Euouae_ (every
termination), the table is read off it; the provenance of each formula is at
the data, in
[`temper/data/tones.ts`](https://github.com/jeffreypierce/tonus/blob/main/src/engines/temper/data/tones.ts).

## Theory & Context

`temperamentum` represents a tuning as a table of twelve frequency ratios,
one per pitch class, relative to the context's root and anchored at the
reference A4. The presets fill that table from history: the Pythagorean
division the treatises teach, the meantone compromise of the Renaissance,
Ptolemy's three diatonic shades, and the modern equal division.

### The presets

Six ways to fill the table, five historical and one modern. Each has a
character; the interval arithmetic, the commas that drive it, and the
editorial choices behind it are documented at the builder, in
[`temper/scale.ts`](https://github.com/jeffreypierce/tonus/blob/main/src/engines/temper/scale.ts).

- **`"pythagorean"`** — the medieval default. All intervals from the pure
  fifth and the octave: perfect melodic fifths and fourths, a narrow keen
  semitone, a wide third that never has to be a consonance. Correct for
  unaccompanied chant, and the tuning the treatises teach.

  ```js
  tonus.temperamentum(); // pythagorean, A4 = 440
  ```

- **`"meantone"`** — the Renaissance compromise. Narrows each fifth to buy
  purer thirds; `comma` sets how far (`"1/4"`, the default, gives pure major
  thirds and the 16th-century sound; `"1/3"` pure minor thirds; `"1/6"` leans
  baroque). One fifth is left over as the _wolf_.

  ```js
  tonus.temperamentum({ tuning: "meantone", comma: "1/4" });
  ```

- **The three Ptolemaic diatonics** — antiquity's just intonations, Ptolemy's
  three "shades" of the diatonic. `"ptolemy-intense"` is classical just
  intonation (pure thirds); `"ptolemy-soft"` is septimal and dark;
  `"ptolemy-equable"` has neutral, near-equal steps outside the Latin tradition.
  Each tunes one fixed scale, so pairing one with a non-default mode can surface
  unexpected intervals, including a wolf.

  ```js
  tonus.temperamentum({ tuning: "ptolemy-intense" });
  ```

- **`"equal"`** — twelve identical semitones; nothing pure, nothing unusable.
  Anachronistic for chant by some seven centuries, included as a reference point.

  ```js
  tonus.temperamentum({ tuning: "equal", a4: 415 }); // equal at baroque pitch
  ```

Any 7- or 12-step scale can also be supplied directly as ratios or cents, or as
a [Scala `.scl`](https://www.huygens-fokker.org/scala/scl_format.html) file:

```js
tonus.temperamentum({
  scale: ["1/1", "9/8", "5/4", "4/3", "3/2", "5/3", "15/8"],
});
tonus.temperamentum({ scale: sclFileString }); // name taken from the file
```

## Sources

Sources for this page are in the central [bibliography](https://github.com/jeffreypierce/tonus/blob/main/BIBLIOGRAPHY.md):
`boethius-institutione`, `ptolemy-harmonics`, `schulter-harmony`,
`rockstro-grove`, `niedermeyer-ortigue`, `bragers-treatise`,
`sunol-textbook`, `apel-chant`, `saulnier-modes`, `liber-usualis`,
`graduale-toni-communes`, `nocturnale-romanum`, `scala-format`.
