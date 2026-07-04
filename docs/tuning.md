# Tuning

`tonus.temperamentum` is the library's model of medieval pitch. It builds
a tuning context — a temperament, a mode, and a reference frequency — and
answers the questions a theorist put to the monochord: what frequency a
note sounds, where it sits on the Guidonian hand, what syllable it sings
in which hexachord, how two notes relate, what the mode requires of a
degree, and how a psalm verse is intoned. The engine depends on nothing
else in the library and may be used alone; every pitch elsewhere in tonus
is resolved through one of these contexts. The default tuning is
Pythagorean, as in the treatises.

- [The context — `temperamentum`](#the-context--temperamentum)
- [Pitch input](#pitch-input)
- [Pitches — `nota`](#pitches--nota)
- [Steps — `gradus`](#steps--gradus)
- [Intervals — `intervallum`](#intervals--intervallum)
- [Neumes — `neuma`](#neumes--neuma)
- [Ratios — `ratio`](#ratios--ratio)
- [The gamut — `gamut`](#the-gamut--gamut)
- [Modes — `modus`](#modes--modus)
- [Psalm tones — `tonus`](#psalm-tones--tonus)
- [Theory & Context](#theory--context)
- [Sources](#sources)

## The context — `temperamentum`

`temperamentum(input?)` returns a `Temperamentum`. The input is a tuning
name, an options object, or nothing; with nothing, the context is
Pythagorean, mode `"auto"`, A4 = 440 Hz. Invalid input throws.

```js
tonus.temperamentum()                                  // pythagorean, mode auto, A4=440
tonus.temperamentum("pythagorean")                     // string shorthand
tonus.temperamentum({ tuning: "meantone", comma: "1/4" })
tonus.temperamentum({ tuning: "ptolemy-intense" })     // just intonation
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

The tuning presets:

| Name | Description |
| --- | --- |
| `"pythagorean"` | Pure fifths (3/2), no tempering. Default |
| `"meantone"` | Tempered fifths; `comma` controls the amount (default 1/4) |
| `"equal"` | 12-tone equal temperament |
| `"ptolemy-intense"` | Ptolemy's intense diatonic (*syntonon*) — classical just intonation, pure major thirds (5/4) |
| `"ptolemy-soft"` | Ptolemy's soft diatonic (*malakon*) — septimal tuning, 8/7 whole tone |
| `"ptolemy-equable"` | Ptolemy's equable diatonic (*homalon*) — undecimal tuning, neutral 12/11 seconds |

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
  cents: number[];  // cent values per pitch class, relative to root

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

## Pitch input

Every method that takes a pitch accepts the same forms. A number is a MIDI
note; a string is scientific pitch notation, a GABC letter, or a frequency;
an object addresses one system explicitly. All inputs resolve to a pitch
first; `transpose` is applied last as a uniform output shift.

```js
t.nota(62);              // MIDI
t.nota("D4");            // scientific pitch notation
t.nota("293.33hz");      // frequency
t.nota({ gabc: "d", clef: "c4" });                       // GABC letter under a clef
t.nota({ solmization: "RE", hexachord: "naturale" });    // hexachordal address
```

```ts
type PitchInput = number | string | PitchObject;

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

## Pitches — `nota`

`nota` resolves any pitch input to a tuned `Pitch`. The frequency comes
through the scale; the same note name lands on a different frequency in a
different tuning.

```js
const t = tonus.temperamentum({ mode: 1 }); // pythagorean

t.nota("D4");
// { midi: 62, pc: 2, oct: 4, acc: 0, spn: "D4",
//   hz: 293.33, offset: -1.96, bend: 8112, ratio: 1 }

tonus.temperamentum({ root: 0 }).nota("C4").hz;                       // 260.74  pythagorean
tonus.temperamentum({ tuning: "meantone", root: 0 }).nota("C4").hz;   // 263.18  quarter-comma
tonus.temperamentum({ tuning: "equal",    root: 0 }).nota("C4").hz;   // 261.63  equal
```

`offset` is the distance in cents from the equal-tempered pitch of the same
MIDI number; `bend` is the corresponding 14-bit MIDI pitch bend. `Pitch` is
the tuned identity type used everywhere in tonus: in `Neume.pitches`, as
`note.pitch` in the score engine, and on `Attractor.pitch` in the imprint.

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
//   hand: { finger: "middle", region: "base" },
//   degree: 1, role: "finalis" }
```

The `variants` array lists the step's solmization in every hexachord that
contains it; these are the mutations a medieval singer had available at
that step. With a mode set, `degree` and `role` are filled; without one, or
for a pitch outside the gamut, they are `null`.

The hand position names the joint a singer would point to:

| `hand` field | values |
| --- | --- |
| `finger` | wrist, palm, thumb, index, middle, ring, pinky |
| `region` | base, mid, tip, top |

```ts
interface StepVariant {
  hexachord: "durum" | "naturale" | "molle";
  solmization: string;
}

interface Step {
  pc: number;                // pitch class 0–11
  name: string;              // "d" (Guidonian) or SPN letter fallback
  nomen: string | null;      // "Delasolre"; null out of gamut
  hexachord: "durum" | "naturale" | "molle" | null;
  solmization: string | null; // null out of gamut
  variants: StepVariant[];   // available mutations across hexachords
  hand: { finger: string; region: string } | null; // Guidonian hand position
  degree: number | null;     // 1–7 diatonic degree in mode
  role: "finalis" | "tenor" | "other" | null;
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

`semitones` and `cents` describe the interval class in nominal
(equal-tempered) terms. The tuned distance between two particular pitches
is the ratio of their frequencies; take it from `nota`.

| field | values |
| --- | --- |
| `class` | `P1` `m2` `M2` `m3` `M3` `P4` `TT` `P5` `m6` `M6` `m7` `M7` `P8` |
| `quality` | perfect, major, minor, augmented |
| `direction` | up, down, unison |
| `consonance` | perfect, imperfect, dissonant |

```ts
interface Interval {
  nomen: string;      // e.g. "Quinta", "Semitonium"
  alias?: string;     // e.g. "Diapente", "Diatessaron"
  quality: string;
  class: string;
  direction: string;
  semitones: number;
  cents: number;      // nominal class value
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

| `shape` | figure | `shape` | figure |
| --- | --- | --- | --- |
| `punctum` | a single note | `torculus resupinus` | torculus, then rising |
| `pes` | two notes, rising | `porrectus flexus` | porrectus, then falling |
| `clivis` | two notes, falling | `scandicus flexus` | scandicus, then falling |
| `torculus` | three: up, down | `climacus resupinus` | climacus, then rising |
| `porrectus` | three: down, up | `pes subpunctis` | pes, then descending points |
| `scandicus` | three, rising | `compound` | any figure not above |
| `climacus` | three, falling | | |

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
scale, the matching `Step` is returned with it.

```js
t.ratio("3/2");
// { ratio: 1.5, cents: 701.96, display: "3:2",
//   step: { nomen: "Alamire", degree: 5, role: "tenor", … } }
```

In mode 1 the pure fifth lands on the tenor; the step field says so.

```ts
interface RatioResult {
  ratio: number;   // decimal frequency ratio
  cents: number;   // interval in cents
  display: string; // colon notation, e.g. "3:2"
}
```

## The gamut — `gamut`

The gamut is the medieval note-space: the ordered range of singable
pitches Guido's system named from Gammaut upward. `gamut` returns the
tuned pitches of the scale across a span. With a mode set, the default
span is the mode's ambitus; mode 1 yields twelve diatonic pitches from D3
to A4. The `chromatic` option adds the chromatic degrees; `span` sets
explicit MIDI bounds.

```js
const g = t.gamut();   // 12 pitches, D3 … A4 (mode 1 ambitus)
t.gamut({ span: [48, 72], chromatic: true });
```

```ts
interface GamutOptions {
  span?: [number, number]; // [lowest, highest] MIDI
  chromatic?: boolean;     // include chromatic pitches, default false
}
```

## Modes — `modus`

`modus` returns the full profile of one of the eight modes, as the
medieval tonaries describe them:

- its identity — Latin name, modern alias, *maneria* (the family: Protus,
  Deuterus, Tritus, Tetrardus), and authentic or plagal type;
- its structure — finalis, tenor, scale degrees, ambitus, and the species
  of fifth and fourth that build it;
- its practice — hexachords in rank order, melodic profile, cadence
  degrees, and permitted modulations.

```js
t.modus(1);
// { mode: 1, nomen: "Protus Authenticus", alias: "dorian",
//   maneria: "Protus", type: "authentic",
//   final: 2, tenor: 9, … }
```

```ts
interface ModeProfile {
  mood: string;
  phrasing: "recitative" | "lyrical" | "hymnic" | "solemn";
  melodic: "rising" | "falling" | "arch" | "neutral";
  tendency: "melismatic" | "neumatic" | "syllabic" | "neutral";
}

interface ModeData {
  mode: number;
  nomen: string;   // "Protus Authenticus"
  alias: string;   // "dorian" (modern name)
  maneria: string; // "Protus" — the mode family
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

## Psalm tones — `tonus`

`tonus` returns the recitation formula of the context's mode as tuned
pitches: the **intonatio** (the opening rise), the **mediatio** (the
cadence at the verse's colon), and the **terminatio** (the closing
cadence). The termination varies by **differentia**, the cadential variant
chosen to lead back into the antiphon; the mode's default differentia is
used when none is given. The mode must be set explicitly — with mode
`"auto"`, `tonus()` throws.

```js
const t = tonus.temperamentum({ mode: 1 });

t.tonus();
// { mode: 1, differentia: "1g",
//   intonatio:  [F3, A3, C4],
//   mediatio:   [C4, A3, G3, A3],
//   terminatio: [C4, A3, G3, A3, G3] }   // each entry a tuned Pitch

t.tonus({ differentia: "1f" });
```

To sing psalm texts to these formulas, use
[`tonus.psalmus`](chant.md#psalms--psalmus), which returns
GABC-encoded verses pointed to the tone.

```ts
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

## Theory & Context

`temperamentum` represents a tuning as a table of twelve frequency ratios,
one per pitch class, relative to the context's root and anchored at the
reference A4. The presets fill that table from history: the Pythagorean
division the treatises teach, the meantone compromise of the Renaissance,
Ptolemy's three diatonic shades, and the modern equal division.

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
For unaccompanied chant it is correct — melodic fifths and fourths are
perfect, the narrow limma gives half-steps a keen, leading quality, and the
wide third never has to serve as a consonance. tonus makes it the default
for the same reason the Middle Ages did.

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

The planetary-scale derivations in
[heavens.md](heavens.md#theory--context) use the same Pythagorean interval
arithmetic laid out here.

## Sources

- Boethius, *De institutione musica* — the medieval transmission of
  Pythagorean interval math.
- Ptolemy, *Harmonics* I.15–16 — the diatonic shades.
- Guido of Arezzo's gamut and solmization, and the eight-mode system, as
  standardized in medieval theory (gamut, hexachords, modes, psalm tones).
- Atkinson, Charles M. *The Critical Nexus: Tone-System, Mode, and
  Notation in Early Medieval Music*. New York: Oxford University Press,
  2009.
- Reisenweaver, Anna. "Guido of Arezzo and His Influence on Music
  Learning." *Musical Offerings* 3, no. 1 (2012).
- Schulter, Margo. "Pythagorean Tuning and Medieval Polyphony." Medieval
  Music & Arts Foundation —
  <https://www.medieval.org/emfaq/harmony/pyth.html>.
- Schulter, Margo. "Hexachords, solmization, and musica ficta." Medieval
  Music & Arts Foundation —
  <https://www.medieval.org/emfaq/harmony/hex.html>.
- Rockstro, W. S. "Modes, The Ecclesiastical." In Grove, *A Dictionary of
  Music and Musicians* (1st ed.) —
  <https://en.wikisource.org/wiki/A_Dictionary_of_Music_and_Musicians/Modes,_The_Ecclesiastical>.
- Powers, Harold S., and Frans Wiering, et al. "Mode." *Grove Music
  Online*, 2001, §§I–III (the term; medieval modal theory) —
  <https://doi.org/10.1093/gmo/9781561592630.article.43718>.
- *The Liber Usualis, with Introduction and Rubrics in English*. Ed. the
  Benedictines of Solesmes. Tournai: Desclée, 1961 — the introduction ("Rules for Interpretation" and the
  rubrics for the chant); the book itself is a chant corpus source
  ([chant.md](chant.md#sources)).
- Wikipedia: [Pythagorean tuning](https://en.wikipedia.org/wiki/Pythagorean_tuning),
  [Meantone temperament](https://en.wikipedia.org/wiki/Meantone_temperament),
  [Gregorian mode](https://en.wikipedia.org/wiki/Gregorian_mode).
- Scala scale archive and `.scl` format, Manuel Op de Coul, Huygens-Fokker
  Foundation — <https://www.huygens-fokker.org/scala/scl_format.html>.
