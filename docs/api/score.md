# Score

`tonus.notatio` builds a chant into a score: the analyzed, tuned, and
rhythm-classified reading of one GABC melody. The score is data: `phrases`,
`tabula`, `metrics`, `cadences`, `modulations`, and `imprint`. The
standalone `tonus.inscriptio(score)` draws it to SVG.

- [Score](#score)
  - [The score — `notatio`](#the-score--notatio)
  - [Interpretation, the four knobs](#interpretation-the-four-knobs)
  - [The note](#the-note)
  - [The tabula](#the-tabula)
  - [Rendering](#rendering)
    - [inscriptio — the standalone renderer](#inscriptio--the-standalone-renderer)
    - [theme — faces and ink](#theme--faces-and-ink)
    - [The analysis tracks](#the-analysis-tracks)
  - [The imprint](#the-imprint)
  - [Metrics](#metrics)
  - [Cadences](#cadences)
    - [One key, two levels](#one-key-two-levels)
    - [`finality` — how often this close closes](#finality--how-often-this-close-closes)
  - [Modulations](#modulations)
  - [Theory \& Context](#theory--context)
    - [The model](#the-model)
    - [The classification rules](#the-classification-rules)
    - [Rhythmic types](#rhythmic-types)
    - [Modeled and not](#modeled-and-not)

## The score — `notatio`

`notatio(chant, opts?)` builds a `Score` from a single `Chant`. Invalid
input throws; recoverable GABC problems land in `score.errors`, and
downstream fields degrade rather than throw.

```js
const [feast] = tonus.festum({ date: new Date("2026-12-25") });
const [introit] = tonus.proprium({ feast, office: "in" }); // Puer natus est
const t = tonus.temperamentum({ mode: 7 });

const score = tonus.notatio(introit, { temperamentum: t });
// 10 phrases, 78 syllables, 159 notes, 0 errors
```

The structured view is `score.phrases`; the flat view, one row per note,
is `score.tabula`. Phrases split at every divisio, the bars of chant
notation, which are signs of punctuation rather than measure:

| divisio | name                         |
| ------- | ---------------------------- |
| `,`     | divisio minima (quarter bar) |
| `` ` `` | virgula (tick)               |
| `;`     | divisio minor (half bar)     |
| `:`     | divisio maior (full bar)     |
| `::`    | divisio finalis (double bar) |

gregorio's numbered bars (`;1`–`;8`, `,0`–`,6`) are read as their base bar.
Two bars with no note between them close one phrase, under the stronger of
the two; a bar before the first note opens none.

This hierarchy is read three ways in the engine, each weighting the bars for its
own end: an analytic cadence weight (metrics), a phrasing strength (which zeroes
the virgula), and a rest duration (the divisio's pause length). Each weighting
is documented at its table in the code.

```ts
interface Score {
  chant: Chant;
  phrases: Phrase[];
  errors: ParseError[];
  tabula: ChantTabulaRow[];
  metrics: Metrics;
  cadences: Cadence[];
  modulations: Modulation[];
  imprint: Imprint;
}

interface Phrase {
  syllables: Syllable[];
  divisio?: RestEvent;
  noteCount: number;        // notes across the phrase
  syllableCount: number;    // sung syllables in the phrase
  beats: CompoundBeat[];    // the incise's arsis/thesis sequence
  rhythmicType: RhythmicType; // Le Guennant/Carroll type, or null
}

interface Syllable {
  lyric: string;
  runs?: LyricRun[];        // styled spans, present only when GABC markup styled this syllable
  notes: Note[];
  neume: Neume;             // the syllable read as ONE figure
  neumes: Neume[];          // its figures, as GABC groups them, each classified
  melisma: number;          // notes on this syllable (1 = syllabic, >1 melismatic)
  accent: boolean;          // bears the Latin tonic word-accent (see below)
  accentInferred?: true;    // the accent was read by the rule, not printed
}
```

The accent is the printed acute where the edition prints one, and the rule
where it does not. The Solesmes books mark the acute only on words of three
syllables and more, so a word of two is accented on its first and a
monosyllable on none; an unmarked word of three or more takes the penult.
A printed acute wins at any length. Where the rule and not the print
supplied the accent, `accentInferred` says so; the same two fields sit on
every note's `context` and on every tabula row. The articulation weight for
an accent is applied from the printed acute alone.

A syllable carries neumes rather than being one. GABC marks the figures with
`/`, `//`, `/0` and `/[n]`, and `neumes` names each; the cut `!` and the
fusion `@` join glyphs within one figure, as gregorio sets them; `neume` reads the whole syllable as
a single figure, which for a melisma of several is usually `compound`. A
syllable of one figure reports the same shape both ways. The salicus is the
exception and reports at syllable scope: its rule reads the oriscus on the
next-to-last note of an ascent, and the scribe may break the figure between
that oriscus and the summit.

The written marks name two kinds of figure. The salicus is one, and the Liber's
liquescent figures are the other: a pes, clivis or climacus whose last note
carries the deminutive half-note (GABC `~`) reports as `epiphonus`,
`cephalicus` or `ancus`, with `hasLiquescent` still set. The augmented `<`
and `>` leave the name alone. A lone note marked with one is the punctum
liquescens, and stays a `punctum`.

GABC's lyric markup is decoded at parse, so `lyric` is always clean display
text. A translation in square brackets (`Hic[Here]`) is not lyric, and is
dropped; a parenthesis inside verbatim TeX or a translation (`<v>(</v>`) opens
no note group. A `%` begins a comment that runs to the end of its line, and a
whole file's header, through `%%`, is skipped. Beyond that: the `<sp>` shortcuts arrive as real characters (`<sp>V/</sp>` → ℣,
`<sp>R/</sp>` → ℟, `<sp>+</sp>` → the flex †, `<sp>'ae</sp>` → ǽ, the
`\greheightstar` verbatim → the raised *), centering braces and layout tags
(`<clear>`, `<nlba>`) vanish, above-lines text (`<alt>`) is not lyric text,
and page cross-references (`\pageref`) to the paper books are dropped. Style
tags (`<i>`, `<b>`, `<sc>`, `<c>` for rubric color, `<e>` for elision) survive
as `runs`, styled spans that concatenate to `lyric`; a style opened in one
syllable and closed several later (the common `<i>ij.</i>` and euouae
patterns) styles every syllable it crosses. Verbatim spacing commands
(`\kern 6mm`, `\hspace{…}`) leave no text. Both notation species draw the
runs (italic, bold, small caps, rubric color) as SVG `<tspan>`s.

```typescript
interface LyricRun {
  text: string;
  italic?: boolean;
  bold?: boolean;
  smallCaps?: boolean;
  rubric?: boolean;         // rendered in rubricaColor
}

interface Neume {
  type: NeumeShape;    // "punctum", "pes", "clivis", "torculus" …
  intervals: number[]; // semitones between successive notes
  hasQuilisma: boolean;
  hasLiquescent: boolean;
  hasStrophicus: boolean;
}

interface RestEvent {
  type: "rest";
  divisio: string;
  duration: number;
}

interface ParseError {
  message: string;
  index?: number;
}
```

## Interpretation, the four knobs

Interpretation is set at build time by four knobs:

| knob        |           | governs                                                   |
| ----------- | --------- | --------------------------------------------------------- |
| `pondus`    | stress    | how hard the accents and the signs are leaned on          |
| `modulatio` | phrasing  | how much a phrase arches, its rise and fall               |
| `cadentia`  | cadence   | how much the ends broaden and settle                      |
| `expressio` | dynamics  | the span from soft to loud, and from short to long        |

A knob is a number, 0 to 1, which sets its level; or an object of its own
fields, which overrides them, with the level beside them as `gradus` (0.5 when
left out).

```js
tonus.notatio(chant, {
  temperamentum: t,
  pondus: 0.8, modulatio: 0.8, cadentia: 0.9, expressio: 0.7,
});

tonus.notatio(chant, {
  cadentia: { gradus: 0.9, ritard: 0 },  // broad closes, no rallentando
  pondus: { ictusBoost: 1 },             // stress at 0.5, without the ictus boost
});
```

0.5 on every knob is the reference reading. 0 leans to the restrained and the
recitative; 1 goes past the expressive and the solemn, so a reading that
pushes hard has room above it. Each field a knob owns is a line through those
anchors, read at the knob's level; a field given in the object replaces that
reading, and a knob left out keeps its 0.5 values. A level outside 0 to 1
throws; so does a field given to a knob that does not own it, an unknown
field, a value that is not a finite number, and an option `notatio` does not
know.

Inside `modulatio` is the phrasing one level down, lean and rush. A sung
melisma is not a row of equal notes: its first and last, its turning points
and the notes on the tenor or the final are the real notes, and the rest are
runs between them. A sung cadence leans into the note before the final when
it comes by step, and releases on the final. `modulatio` at 0 leans least; at 0.5 the lean and the rush are modest; at 1 a long melisma is
three or four notes with runs between. Syllables of fewer than four notes
are untouched, so syllabic chant keeps its even flow apart from the cadence.
`modulatio` at 0 still leaves its recitative floor of lean and rush (0.1
each), so "every note equal" is the fields at 0: `modulatio: { lean: 0, rush: 0 }`.

With no knob given, notes are articulated at the reference reading, and the
phrasing is shaped for any chant with a mode, named in its header or read
from its notes, or that names its office. Only a chant with neither keeps
`velocity: null` on its rows.
`rhythmicShape` and `rhythmicIndex` are always populated by the Solesmes
classifier, whatever the knobs.

### The fields

Every field belongs to one knob. One name stands in both the articulation
(weight and duration) and the phrasing (velocity and shaped duration):
`ictusBoost`, which lengthens an ictic note in each. One field sets both.

| knob        | field                                         | governs                                                     |
| ----------- | --------------------------------------------- | ----------------------------------------------------------- |
| `pondus`    | `weights`                                     | per-sign weight and duration deltas: ictus, episema, strophicus, quilisma, liquescent, oriscus, … |
|             | `weightBase`, `weightGain`, `weightSaturation` | how sign weight accumulates and where it caps               |
|             | `ruleGain`                                    | the authority of the sign rules over positional shaping     |
|             | `ictusBoost`                                  | a multiplier on an ictic note's duration (not its weight or velocity) |
|             | `accent`                                      | a uniform gain on every note's velocity                     |
| `modulatio` | `curve`                                       | depth of the phrase-level velocity arch                     |
|             | `neumeArch`, `durArch`                        | the arch across a syllable's notes, in weight and duration  |
|             | `contourScale`, `contourVel`, `contourDur`    | the melodic contour's pull on weight, velocity and duration |
|             | `lean`, `rush`                                | a melisma's real notes leaned into, its runs rushed; the cadence's penultimate leaned into, its final released |
| `cadentia`  | `cadence`                                     | weight given to phrase-final cadences                       |
|             | `ritard`, `ritardNotes`                       | depth and width, in notes, of the rallentando               |
|             | `ritardCurve`, `finisBoost`                   | how late it gathers; the piece's own last `::`              |
| `expressio` | `baseVelocity`, `velSpread`                   | a multiplier on the shaped velocity, and its spread about the centre (velocity is clamped to 0.1–1) |
|             | `durationBase`, `durationGain`, `durationMin`, `durationMax` | how sign weight maps to note duration, and its clamp |

`weightBase` and `durationBase` do not move with their knob's level;
they change only when given.

`weights` merges key by key, so one sign can change on its own. The defaults
follow the Liber's rubrics, and taste goes through an override. A liquescent,
for instance, is lighter but not shorter: it loses "half its force rather than
its duration". The Antiphonale Monasticum's punctum liquescens, a lone
liquescent note, is drawn out a little. A choir that clips liquescents sets:

```js
tonus.notatio(chant, {
  pondus: { weights: { liquescentDuration: -0.35 } },
});
```

The anchor profiles in `src/engines/score/articulation.ts` and `phrasing.ts`
are the reference values to start from.

```ts
interface ScoreOpts {
  temperamentum?: Temperamentum;
  pondus?: Knob<PondusFields>;
  modulatio?: Knob<ModulatioFields>;
  cadentia?: Knob<CadentiaFields>;
  expressio?: Knob<ExpressioFields>;
}

// a level, or the knob's fields (from the table above) with the level as gradus
type Knob<F> = number | (F & { gradus?: number });
```

## The note

The score's unified `Note` composes four concerns into sub-objects:
`pitch` is the tuned identity and `step` the Guidonian annotation, both
from the tuning engine ([tuning.md](tuning.md)); `performance` carries the
interpretation; `context` the position, lyric, and ornament marks.

```ts
interface Note {
  pitch: Pitch; // tuned identity — tuning.md
  step: Step; // modal/Guidonian annotation — tuning.md
  performance: Performance;
  context: Context;
}

interface Performance {
  velocity: number; // always 0 here: the shaped velocity is the tabula row's
  duration: number;
  rhythmicShape: "arsic" | "thetic"; // quality of this note's compound beat
  rhythmicIndex: number; // 1-based position within the compound beat
}

interface Context {
  lyric: string;
  vowel: string;
  diphthong: string | null; // the pair the vowel belongs to: "ae" | "oe" | "au" | "ui"
  runs?: LyricRun[]; // styled lyric spans (see Syllable above)
  syllableIndex: number; // the syllable within its WORD (0 = the word's first)
  accent: boolean; // this note's syllable bears the Latin tonic word-accent (printed, or by the rule)
  accentInferred?: true; // the accent was read by the rule, not printed
  neumeGroup: number; // neume figure within the syllable (0-based); `!` and `@` part none
  separator: string | null; // the GABC separator written before this note: ! @ / // /0 /[n]
  lineBreak?: boolean; // a forced system break (gabc z / Z) falls before this note
  keepWithPrev?: boolean; // inside an <nlba> span: no line break before this syllable
  ictus: boolean;
  ictusSign: boolean; // an editorial ictus mark is printed in the source
  episema: boolean;
  accidentalSource: "none" | "state" | "explicit";
  accidentalSign?: -1 | 0 | 1; // an accidental SIGN drawn before this note (gabc x / y / #)
  quilisma: boolean;
  liquescent: boolean;
  strophicus: boolean;
  oriscus: boolean; // gabc o, or O (the oriscus scapus)
  liquescence: "deminutive" | "ascending" | "descending" | null; // ~ < >
  oriscusDirection: "ascending" | "descending" | null; // o1/o0, else toward the next pitch
  hollow: boolean; // cavum, gabc r
  signum: "accentus" | "accentusReversus" | "circulus"
    | "semicirculus" | "semicirculusReversus" | null; // gabc r1–r5
  mora: 0 | 1 | 2; // mora vocis: 0 none, 1 dot, 2 double dot
  staffLetter: string; // the GABC staff letter as written
  clef: string; // the clef in force at this note ("c3", "f4", …)
  shape: string; // the notehead shape (punctum, inclinatum, quilisma, lineaPunctum, …)
  weight: number; // articulation weight
}
```

An accidental holds for the rest of its word or until the next bar, and
alters only the degree it is written on: a flat on E leaves the B natural. A
clef with a flat (`cb3`, `fb2`) sets B-flat at every word and bar, and a
natural written on B holds through the word like any other accidental.

```ts
```

A compound beat is the group of notes between one ictus and the next;
every note in the group shares its quality, arsic (rising, active) or
thetic (resting, retractive). The classification rules are in
[Theory & Context](#theory--context).

## The tabula

`score.tabula` is the flat iteration surface: one row per note, for
analysis, visualization, or emission.

The tabula is also the rendering
surface. The SVG renderer ([below](#rendering)) consumes it directly, which is
why `hz`, `velocity`, `bend`, and the ornament flags live on each row.

```js
score.tabula[0];
// { lyric: "PU", midi: 55, hz: 195.56,
//   name: "G", nomen: "Gesolreut",
//   rhythmicShape: "arsic", rhythmicIndex: 1, ictus: true,
//   degree: 1, role: "finalis", … }
```

The first note of _Puer natus est_ sits on Gesolreut, the G of the grave
hexachords, an octave above Gammaut at the bottom of the Guidonian hand.

```ts
interface ChantTabulaRow {
  // position
  phraseIndex: number;
  syllableIndex: number;
  noteIndex: number;
  accent: boolean; // this note's syllable bears the Latin tonic word-accent (printed, or by the rule)
  accentInferred?: true; // the accent was read by the rule, not printed
  neumeGroup: number; // which neume figure within the syllable (0-based)
  neumeIndex: number; // position of this note within that figure
  separator: string | null; // the GABC separator written before this note
  wordStart: boolean; // first syllable of its word
  lineBreak: boolean; // a forced system break falls before this note
  keepWithPrev: boolean; // inside an <nlba> span

  // note fields
  midi: number;
  pc: number;
  octave: number;
  accidental: -1 | 0 | 1;
  accidentalSource: "none" | "state" | "explicit";
  accidentalSign?: -1 | 0 | 1; // an accidental sign drawn before this note
  quilisma: boolean;
  liquescent: boolean;
  strophicus: boolean;
  oriscus: boolean;
  liquescence: "deminutive" | "ascending" | "descending" | null; // ~ < >
  oriscusDirection: "ascending" | "descending" | null; // o1/o0, else toward the next pitch
  hollow: boolean; // cavum, gabc r
  signum: "accentus" | "accentusReversus" | "circulus"
    | "semicirculus" | "semicirculusReversus" | null; // gabc r1–r5
  mora: 0 | 1 | 2; // mora vocis: 0 none, 1 dot, 2 double dot
  hz: number;
  offset: number;
  spn: string; // scientific pitch name, "D4"
  staffLetter: string; // the GABC staff letter as written
  staffPosition: number; // half-spaces above the staff's bottom line (0 = the line, 1 = the space above)
  clef: string; // the clef in force at this note ("c3", "f4", …)
  shape: string; // the notehead shape (punctum, inclinatum, quilisma, lineaPunctum, …)
  bend: number; // 14-bit MIDI pitch bend (8192 = center)
  velocity: number | null; // the shaped velocity; null when no phrasing ran
  duration: number;
  shapedDuration: number;
  rhythmicShape: "arsic" | "thetic";
  rhythmicIndex: number;
  ictus: boolean;
  ictusSign: boolean; // an editorial ictus mark is printed in the source
  episema: boolean;

  // step fields
  degree: number | null;
  role: "finalis" | "tenor" | "alia" | null;
  name: string | null; // Guidonian short name
  nomen: string | null; // Guidonian compound name, "Delasolre"
  hand: { finger: Finger; region: Region } | null;
  hexachord: "durum" | "naturale" | "molle" | null;
  solfege: string | null;

  // context
  lyric: string;
  runs?: LyricRun[];         // styled lyric spans (see Syllable above)
  vowel: string;             // the NUCLEUS — one of a e i o u, or "" when textless
  diphthong: string | null;  // the pair it belongs to: "ae" | "oe" | "au" | "ui"
  divisio: string | null;
  cadenceRef: number | null; // index into score.cadences[] when this note closes one
  neume: Neume;
}
```

## Rendering

The score is drawn as **SVG**: a square-note chant staff with SMuFL glyphs baked
as inline paths, so the music needs no font. Text (lyric, title, margin mark,
initial) names a font-family the host page supplies, unless the caller embeds
its own bytes (see [theme](#theme--faces-and-ink)). It consumes `score.tabula`,
so the interpretation applied through the knobs is already in the geometry.
Microtuning lives on each tabula row's `bend`, `hz`, and `offset` for a
Web-Audio player to read directly.

### inscriptio — the standalone renderer

`tonus.inscriptio(score, opts?)` draws a `Score` and returns `{ svg, geometry }`.
Rendering is a standalone function that _takes_ a score, not a method on one. The
score analyzes, `inscriptio` inks. It throws on a non-Score, on an unknown
option key, and on an invalid value: an unknown `notation`, `accidentals`,
`centsBaseline`, `annotation`, named `scale` or track name; a `width` or
numeric `scale` that is not a positive finite number; a `tracks` that is not
an array; an unknown `theme` key, font role or colour role (the
builder-function contract).

```js
const score = tonus.notatio(introit);
const { svg, geometry } = tonus.inscriptio(score, { width: 680, title: "Puer natus est" });
```

Two notation species, each with its own spacing pass:

| `notation` | look |
| --- | --- |
| `"quadrata"` (default) | square-note chant staff, SMuFL glyphs baked inline |
| `"moderna"` | modern round-note transcription: treble-8 clef, engraved slurs |

**Layout is deterministic, and lyric widths are computed rather than measured.**
The same score and options give byte-identical SVG on every machine, with no
DOM, no canvas, and no font file, so `inscriptio` runs anywhere Node does. Note
glyphs carry exact SMuFL advance widths; lyric text is computed from character
classes, since measuring it would require the font's own metrics. Line breaks,
system fill, and the width of the returned canvas all rest on that figure. It is
close, not exact: a lyric set in a face far from the assumed proportions will
break slightly early or late.

Two consequences worth planning around. `width` is a **request, not a promise**:
the canvas returned is `max(width, content)` in both species, so a chant whose
content cannot fit (a single syllable wider than the line) comes back wider
rather than clipped. And a caller who needs typographic
precision should render at a generous `width` and scale the result, rather than
relying on the estimate to land a tight column exactly.

Options, by group (all optional):

- **layout**: `width` wraps systems to fit (absent = a single line, and a GABC
  `z` is then ignored); `scale` sets how big the chant is drawn: `"small"`,
  `"normal"` (default), `"large"`, or a staff height in px for fitting a known
  column. A named size is a size of type: the lyric is the same in both species
  (16px at `"normal"`), and each draws its staff to suit, so quadrata's staff at
  `"normal"` is a little under 40px and moderna's five lines span about 30px. A
  number is the drawn staff's height (top line to bottom line) exactly, in
  either species, so `scale: 40` draws larger than `"normal"` in both.
  Everything scales from it (notes, clef, lyrics, the air between systems), and
  it reflows the music, so a larger scale means fewer notes per line. The page
  margin does not scale: it belongs to the page rather than the notation, and
  scaling it gave a large chant *less* usable width than a small one.
- **line breaks**: a system ends at a divisio, or between syllables, never
  inside a syllable. Quadrata prefers a divisio and keeps a word whole where it
  can; a word that will not fit a line already 85% full is carried over at a
  syllable, with a hyphen at the line's end, as the books carry it. Moderna
  breaks between any two syllables. Both honour `z` (when `width` is set) and
  the `<nlba>` seal.
- **front matter**: set as the Solesmes books open a piece: `title` centers
  over the score; `rubric` (or `annotation: "auto"` to derive the genus/mode
  mark, abbreviated as the books set it — _Intr. 8._, _Ton. comm. 1._; an
  ordinary chant shows its mode alone) sits upright at the left margin; `dropcap` draws
  the initial the printed books open with, taking the first letter out of the
  lyric and indenting the first system to hold it. Both species take the
  title; the margin mark and the initial are **quadrata's alone**, because moderna is
  a transcription read as an edition, and carries the analysis tracks a
  reserved cap column would fight. It ignores them rather than refusing.
- **intonation**: `accidentals` chooses the channel. `"standard"` (default)
  draws the accidentals the GABC writes, in square notation's own glyphs under
  quadrata (b rotundum, b quadratum) and as ♭ ♮ ♯ under moderna. `"heji"`
  draws HEJI comma-inflected accidentals and `"cents"` floats each note's
  deviation in cents above the staff; both are modern analytical overlays and
  **moderna only**, so asking for either under quadrata throws.
  `centsBaseline` (`"pythagorean"` default, or `"et"`) sets what the cents are
  measured from.
- **theme**: the dress, `fonts` and `colors`.

### theme — faces and ink

```js
tonus.inscriptio(score, {
  width: 900,
  theme: {
    fonts: {
      dropcap:    { family: "Pfeffer Simpelgotisch", weight: 700 },
      title:      "Junicode",
      annotation: "Junicode",
      lyric:      { family: "Junicode", weight: 400, scale: 1.06 },
    },
    colors: { note: "#111", staffLine: "#111", rubrica: "#9E2B25" },
  },
});
```

**`fonts`** carries four roles. A book's dropcap is very often *not* its lyric
face, but a Lombardic or uncial initial against a text hand, which is the pairing
the printed books use. Each role takes a font-family string or
`{ family, weight?, scale? }` (`scale` adjusts that role's size, for a face
whose apparent size differs from the house serif).

The SVG carries font-family *references* by default, and the page hosting it
supplies the face (`@font-face`). A slot may instead carry
`embed: { base64, format? }` (the caller's own bytes), and the face then rides
inside the SVG's `<style>`, making the file self-contained (at the cost of its
size; one `@font-face` per family + weight, deduped). tonus bundles no font
files: with `embed` it is a conduit for data the consumer supplies, so the
consumer carries the face's license terms. Unset roles keep the house serif
(Junicode first, then the Garamonds). `moderna` honours the `lyric` and `title`
slots; it draws no initial and no margin mark, so it has no use for the other
two.

#### The recommended face — Junicode

The plates are drawn in
**[Junicode](https://github.com/psb1558/Junicode-font)** (OFL), which the house
stack already asks for first. Load it and add the dress:

```css
@font-face {
  font-family: "Junicode";
  src: url("JunicodeVF-Roman.woff2") format("woff2-variations");
  font-weight: 300 700;
}
```

```js
tonus.inscriptio(score, {
  width: 900,
  theme: {
    fonts: {
      dropcap:    { family: "Junicode", weight: 700 },
      title:      { family: "Junicode", weight: 620 },
      annotation: { family: "Junicode", weight: 640 },
      lyric:      { family: "Junicode", weight: 560, scale: 1.06 },
    },
  },
  dropcap: true, annotation: "auto", // a role shows only once its feature is on
});
```

Reference it rather than `embed` it unless one SVG must travel alone: an
embedded face is larger than a typical chant's own markup and repeats in every
file, where a reference is cached once.

**`colors`** reach the SVG as CSS custom properties with the theme's own value
as the fallback, `fill="var(--tonus-note, #111)"`. A rendered chant therefore
carries the ink it was drawn with *and* stays themable: a host stylesheet that
sets the property rethemes the score without re-rendering it.

```css
/* the page follows its own tokens; the chant follows the page */
.score svg {
  --tonus-note: var(--ink);
  --tonus-staff-line: var(--ink);
  --tonus-rubrica: var(--rubrica);
}
```

The emitters' semantic classes are stylable from the host page.

| species | classes |
| --- | --- |
| both | `note`, `clef`, `accidental`, `ledger`, `stem`, `divisio`, `mora`, `lyric`, `lyric hyphen`, `title`, `cents` |
| quadrata | `swash` (the porrectus's diagonal, beside `note`), `key-flat`, `custos`, `episema`, `ictus`, `signum`, `rubric` (the margin mark), `dropcap` |
| moderna | `slur`, `quilisma` |

Every notehead carries `data-note-index="phrase.syllable.neumeGroup.neumeIndex"`,
the address that joins it to its tabula row; quadrata's also carry
`data-staff`, the row's staff letter.

**`scale` is not part of the theme**: line breaking consumes it, so a scale
change re-renders while a colour change does not.

Nothing else about the layout is a caller's decision. The margin, the air
between systems, the notehead calibration against the staff, and the line-end
custos are constants. The custos is quadrata's: it appears at the end of every
wrapped system, as it does in a chant book, except after a divisio finalis
(`::`), where the melody does not continue. Moderna draws none.

**The geometry contract (public API).** `geometry` is one `NoteGeometry` per
note, in tabula order, so `geometry[i]` and `tabula[i]` are the same note two
ways. It says where each note landed on the drawn page, so a caller can put a
playhead, a selection, or an overlay against a note without scraping the SVG.

```ts
interface NoteGeometry {
  phraseIndex: number; syllableIndex: number; neumeGroup: number;
  noteIndex: number;   // position within the SYLLABLE — the tabula's own index
  neumeIndex: number;  // position within the neume FIGURE
  system: number;      // which wrapped system the note landed in
  x: number; y: number; // notehead anchor, svg user units
  inkLeft: number;      // the ink extent: a mark that spans notes
  inkRight: number;     //   reaches for these rather than for `x`
  systemY: number;      // the system's top offset within the svg
}
```

The anchor differs by species. Quadrata's square glyphs start at the anchor and
run right, so `x` is the head's left edge and `inkLeft`/`inkRight` are the
figure's measured ink (a porrectus's first two notes share the swash's extent,
the second anchored at the swash's foot). Moderna centres each round head on
the anchor, so `x` is the head's centre and the ink straddles it evenly.

`y` is already absolute on the canvas; `systemY` reports which system a note
is in, not an offset to add.

### The analysis tracks

`tracks` draws an analysis band beneath every system. Any track rides either
species, and all may ride one score: the selection is independent of the
notation, as `notation` itself is. One governing ink system runs through them:
every mark draws in the score's black, strata graded by opacity alone (the
liturgical red belongs to the claims, the tonarium's mode line and the
prosodia's accent dots), and every pressure-bearing line shares one nib law:
velocity as stroke width.

```js
tonus.inscriptio(score, { width: 680, tracks: ["prosodia"] });
tonus.inscriptio(score, { width: 680, tracks: ["chironomia"] });
tonus.inscriptio(score, { notation: "moderna", width: 680, tracks: ["tonarium"] });
tonus.inscriptio(score, { width: 680, tracks: ["chironomia", "tonarium"] });      // stacked
tonus.inscriptio(score, { width: 680, tracks: ["prosodia", "chironomia", "tonarium"] });
```

Several stack in a fixed order whatever order they are asked for: prosodia
first, directly under the lyric line it reads; chironomia next; tonarium
below. The page grows by the sum of the bands. The conventional pairing is the
chironomia under `quadrata` and the tonarium under `moderna`; the renderer
enforces none of it.

**`"prosodia"`** draws how the melody treats the word, in two lanes.

| mark | means |
| --- | --- |
| tent, one per word | apex over the accented syllable; accented words rise past the lane's rule, unaccented crest on it |
| filled dot at the peak | the accent lands **arsic** (struck) |
| open ring at the peak | the accent lands **thetic** (deferred) |
| stem on the rail | a spoken syllable; height is its note count |
| flat dash above the rail | the syllable is **recited on the tenor** |
| block | a **melisma of 4+ notes**, as wide as its extent, as tall as its count (8+ prints the count inside) |
| hairline through both lanes | a divisio |

Connected melismas join into one ridge, blocks sloping toward their
neighbours. Accents are the book's written accents (the GABC accented
vowels); the track derives none.

**`"chironomia"`** draws the conducting hand as one continuous line. Arsic
beats crest, thetic beats trough, single-note theses pass through shallow, and
the hand picks up between close arses in a small backward loop
[biblio: carroll-chironomy]. Each note's `velocity` (the knobs' shaping)
becomes nib width, so the line presses where the voice does. Pierik letters
(A · T · PT) name the beats.

**`"tonarium"`** is the melodic-analysis lane, named for the book that
catalogued chants by mode. Four rails carry the maneriae finals ladder, D on
the bottom (categories, not pitches). Through them runs the melody itself,
compressed to the chant's ambitus at a lighter stratum: context, not message.

| mark | means |
| --- | --- |
| red line + numeral | the governing **mode** of each phrase (authentic vs plagal lives in the numeral) |
| line steps solid | a modulation of kind `"inflection"` |
| line dashed | a `"transposition"` (the affinal frame read as displacement) |
| melody re-inked black | a **cadence**: the same curve at the same width, turned pure black across the figure |
| filled terminal node | the family's measured `finality` **closes** |
| open terminal node | it **suspends** |

A wrapped cadence draws its node and label once, in the system holding the
figure's last note.

Every inked cadence carries a label beneath its node: the family's **in-mode
share** (`"3.9%"`), how often this close's genus ends a phrase in this
chant's mode. Where the chant has no mode, or the genus has too few occurrences
in it to divide, it falls back to the plain corpus share. A close that joins
no [`CADENTIAE`](index.md#the-appendix) genus reads **`rara`**. That is a
measurement rather than a gap: the catalogue tables every genus above a floor
of fifty corpus occurrences, so failing to join means rarer than anything it
records, and few closes fall below that floor. It is a word, not a number, so
it is not read on the percentage scale beside it.

Each cadence group carries the keys that join back to
[`CADENTIAE`](index.md#the-appendix): `data-genus`, `data-nomen` and
`data-species`, with `data-species-share` (the species' own in-mode share,
where it clears the floor in the mode) and `data-lift` (the genus's
distinctiveness, for a caller who wants it rather than frequency). Crowded
labels dodge to a second row.

Everywhere, confidence is opacity, and a claim below confidence 0.45 draws
nothing. Every mark sits under the notation that would falsify it.

## The imprint

`score.imprint` is the chant's analytic fingerprint: a pitch-class
distribution over its phrases, the attractors and vowel attractors read from
it, and the eight modes ranked by fit. The distribution weights the notes that
carry the mode: a note on an ictus counts 1.5×, a cadence's resolution 2×
[biblio: mocquereau-nombre]; the magnitudes are an editorial weighting.

```js
score.imprint.attractors[0];
// { pc: 0, weight: 0.39, pitch: { spn: "C4", … } }

score.imprint.modalAffinity.slice(0, 2);
// [ { mode: 7, alias: "mixolydian",     score: 2.79 },
//   { mode: 8, alias: "hypomixolydian", score: 2.26 } ]
```

The ranking reads three signals beyond the pitch-class distribution: the opening
note (each mode's Absolute Initials after Rockstro, the ones he marks "barely
used" counting for less), the closing note (a chant
rests on its final, the treatises' first determinant of mode), and the tessitura
(how high the melody sits above its final, the classical authentic/plagal
separator). Together these rank the labelled mode first for a typical chant, its
plagal/authentic twin usually second. _Puer natus est_ (mode 7) leads with 7,
then its plagal twin 8.

It remains a measurement, not a confirmation: a transposed or mislabelled chant
will not rank its nominal mode first, which is itself a useful signal.
Conformance against the declared mode is read directly:

```js
const declared = parseInt(score.chant.mode, 10);
score.imprint.modalAffinity.find((m) => m.mode === declared).score;
```

```ts
interface Imprint {
  pcDistribution: Record<number, number>; // fractions sum to 1
  attractors: Attractor[]; // top pitch classes, tuned
  vowelAttractors: VowelAttractor[]; // vowel-weighted resonances, tuned
  modalAffinity: ModalAffinity[]; // all 8 modes ranked by fit
}

interface Attractor {
  pc: number; // pitch class 0–11
  weight: number; // normalized 0–1
  pitch: Pitch; // tuned through the score/harmony's temperamentum
}

interface VowelAttractor {
  vowel: string; // "a" | "e" | "i" | "o" | "u"
  weight: number; // fraction of total vowel weight
  pitch: Pitch; // the vowel's most-associated tuned pitch
}

interface ModalAffinity {
  mode: number; // 1–8
  alias: string; // "dorian" | "hypodorian" | …
  score: number; // pc-distribution weight against mode's structural tones
}
```

## Metrics

`score.metrics` measures the chant's shape: counts, range, melisma, melodic
motion, contour, tessitura, rhythm, cadence. It is chant-specific; `Harmony`
has no metrics.

```js
tonus.notatio(puerNatusEst).metrics;
// { noteCount: 159, syllableCount: 78, phraseCount: 10,
//   ambitus: 10, melismaRatio: 2.04, tessitura: 5.2, … }
```

_Puer natus est_ spans ten semitones, sings a little over two notes to the
syllable, and sits about five semitones above its final.

```ts
interface Metrics {
  noteCount: number;
  syllableCount: number;
  phraseCount: number;
  noteRange: NoteRange | null;
  ambitus: number | null;
  melismaRatio: number;         // notes ÷ syllables, whole score
  melismaByPhrase: number[];    // per-phrase melisma density
  melismaCadential: number;     // mean notes on each phrase's final syllable
  tessitura: number | null;     // mean pitch − final, in semitones
  intervals: IntervalStats;     // melodic motion over adjacent within-phrase notes
  arcus: Arcus | null;          // the melodic arch
  ictusRate: number;
  rhythmicProfile: RhythmicProfile;
  cadenceWeight: number;
  cadenceDistribution: CadenceDistribution;
}
```

The five composite fields each answer one question about the chant.

**Where the melody sits, and the shape it traces.** `noteRange` is the plain
compass; `arcus` reads the classic chant arch, a rise to a peak and a return to the
final.

```ts
interface NoteRange {
  min: number;   // lowest note MIDI
  max: number;   // highest note MIDI
  span: number;  // max − min, in semitones (this is `ambitus`)
}

interface Arcus {
  initial: number;   // first note MIDI
  peak: number;      // highest note MIDI
  final: number;     // last note MIDI
  archIndex: number; // ≥ 0: 0 ends on its peak, 1 returns to its start, > 1 ends below it
}
```

**How the melody moves.** Chant is overwhelmingly stepwise, so `motus` sorts
every adjacent within-phrase motion by size. The three names are the tradition's
own, and a chant whose skips and leaps outnumber its steps is unusual enough to
question.

```ts
interface IntervalStats {
  histogram: Record<number, number>; // signed semitone interval → count
  maxLeap: number;                   // largest absolute interval (semitones)
  leapRate: number;                  // fraction of motions that are leaps
  motus: { unison: number; step: number; skip: number; leap: number };
}
```

| motion   | semitones | interval          |
| -------- | --------- | ----------------- |
| `unison` | 0         | a repeated pitch  |
| `step`   | 1–2       | a second          |
| `skip` | 3–4       | a third           |
| `leap` | 5+        | a fourth or wider |

**How it is rhythmed.** Arsis and thesis across the score, and the size of the
compound beats they group into.

```ts
interface RhythmicProfile {
  arsic: number;        // arsic notes across the score
  thetic: number;       // thetic notes across the score
  avgGroupSize: number; // mean notes per compound beat
  maxGroupSize: number; // largest compound beat observed
}
```

**How it comes to rest.** `cadenceDistribution` counts the divisiones the chant
writes, one field per rung of the bar-line hierarchy. `cadenceWeight` sums the
same bars by that rank, so a chant closing on full bars weighs more than one
broken by breaths.

| field       | GABC    | divisio         | weight |
| ----------- | ------- | --------------- | -----: |
| `tick`      | `` ` `` | virgula         |   0.25 |
| `comma`     | `,`     | divisio minima  |    0.5 |
| `semicolon` | `;`     | divisio minor   |   0.75 |
| `colon`     | `:`     | divisio maior   |    1.0 |
| `doubleBar` | `::`    | divisio finalis |    1.5 |

This table is canonical: `metrics.ts` cites it rather than restating the
weights.

## Cadences

`score.cadences` names the melodic close of each phrase. Where metrics
only counts the divisio bars, this identifies the close. One `Cadence` per
phrase-ending divisio: its resolution `target`, the melodic `approach`, and the
`divisio` that tells medial from final (the double bar `::` is the final
cadence). Each note that forms a cadence carries a `cadenceRef` back-index on
the tabula.

### One key, two levels

A cadence is keyed by its closing tail in **letter steps** from the chant's
own closing note (its sounded final), resolution last, signed, not
octave-reduced. Letter steps, not semitones, because the same gesture on a
different final is the same gesture: F E onto E and E D onto D are both a
step down onto the final. Letter steps, not the mode's scale, so B-flat and
B-natural are one degree and a mode-less chant keys like any other. The one
tail is read at two levels:

- **`species`** is the whole collapsed tail, at most three notes: `"2,1,0"`.
  The cadence, what the melody did. Interior repeats collapse (G G A G is
  G A G); the landing's own repeat is kept once, so A G G is `"1,0,0"`.
- **`genus`** is the last motion and the landing: `"cadens @0"`. The
  landing, and the level at which corpus counts hold per mode. `motion` and
  `degree` are its two halves, with `degree` in signed letter steps from the
  final: 0 the final, -1 the note below, +2 the third, +4 the fifth.

The motion is named the way a neume is, one descriptive word, the direction
in the sense of the verb and the size in its root:

| motion | | |
|---|---|---|
| `insistens` | standing on it | the repeated landing |
| `surgens` / `cadens` | rising / falling | a step |
| `transcendens` / `translabens` | climbing over / sliding over | a third, one note crossed |
| `exsiliens` / `desiliens` | springing up / leaping down | a leap |
| `sola` | alone | a one-note phrase, a landing with no gesture |

The landing's word is the mode's reading where it has one, `finalis` or
`tenor`, else the degree itself: `subfinalis`, `secunda`, `tertia`, `quarta`,
`quinta` (below the final, `sub-` is prefixed). Together they are **`nomen`**,
the two-word name a page prints: `cadens finalis`, `insistens tenor`,
`desiliens quinta`. The key stays `genus`; the name is its reading in a mode.

The English sits beside the Latin. [`CADENTIA_LABEL`](index.md#the-appendix)
glosses every word a `nomen` can contain, so a whole name reads word by word:

```js
import { CADENTIA_LABEL } from "tonus";

CADENTIA_LABEL.cadens; // "falling a step onto"
CADENTIA_LABEL.subfinalis; // "the note below the final"
const gloss = (nomen) => nomen.split(" ").map((w) => CADENTIA_LABEL[w] ?? w).join(" ");
gloss("cadens finalis"); // "falling a step onto the final"
gloss("insistens tenor"); // "standing on the tenor"
gloss("desiliens quinta"); // "leaping down onto the fifth"
```

Both join [`CADENTIAE`](index.md#the-appendix), the mined catalogue, which
tables the 48 genera above a floor of fifty corpus occurrences and, under
each, the species above the same floor. A close whose genus fails to join is
not unknown, it is **rarer** than anything tabled: about one live close in a
hundred. The received figures of the treatises are no longer a second
annotation; each is a species of this key, and they stand as a reference
note beside the table.

### `finality` — how often this close closes

`finality` is the share of the **species'** corpus occurrences that fall at a
final close, or the **genus'** where only the genus is tabled. It is a
measurement, not a property of this particular cadence, and it cannot be read
off the landing: genera landing on the final close between 7% and 100% of the
time, so `degree === 0` implies nothing about whether a close is final.

It is `null` when both levels fall below the catalogue's floor: an
uncatalogued close, not a close that never closes. `confidence` rises with
the same evidence: a landing on the finalis or tenor starts at 0.6, a tabled
species adds 0.4, a tabled genus alone 0.2.

```ts
interface Cadence {
  phraseIndex: number;
  divisio: string; // the bar that ends the phrase ("::" = final cadence)
  target: "finalis" | "tenor" | "alia";
  approach: "descending" | "ascending" | "unison";
  pcs: number[]; // observed pitch classes, resolution last
  steps: (number | null)[]; // diatonic steps from the target; [] with no mode
  confidence: number; // 0–1
  notes: [number, number, number][]; // [phrase, syllable, note] positions
  species: string; // the collapsed tail from the sounded final, "2,1,0"
  tail: number[]; // the species as numbers
  genus: string; // "<motion> @<degree>", e.g. "cadens @0"
  motion: "sola" | "insistens" | "surgens" | "cadens" | "transcendens" | "translabens" | "exsiliens" | "desiliens";
  degree: number; // SIGNED letter steps from the chant's own closing note
  nomen: string; // the two-word name in the chant's mode, "cadens finalis"
  finality: number | null; // the catalogued finality; null below both floors
}
```

A one-note phrase is a cadence (a landing with no gesture) and keys as its
landing alone (`"0"`, genus `"sola @0"`).

`degree` is signed and not octave-reduced: `@-3`, a fourth below the final,
and `@4`, a fifth above, are distinct genera.

## Modulations

`score.modulations` marks where the tonal centre leans away from the home
mode, the local counterpart to the imprint's global modal
affinity. Each phrase is scored against all eight modes (the imprint's
affinity math); a run of phrases that favours a foreign mode, by a margin,
becomes one `Modulation` span. The margin is calibrated against Suñol's
worked examples (_Christus resurgens_ modulates toward mode 3). It is
distribution-based: it finds where a passage leans, not a functional analysis.

`kind` says what the span is evidence OF, which matters because the three are
not the same phenomenon. **`inflection`** is a single phrase leaning away and
back: passing colour, not a shift. **`modulation`** is a sustained internal
excursion, two phrases or more, that returns. **`transposition`** is the whole
chant sitting in a foreign mode's frame: it does not close on its labelled
final and one foreign mode dominates most of its phrases, meaning the melody is
notated at a transposed position (the affinal) or the label disagrees with the
notation. A transposed chant is not modulating, because the displacement is
global, so a caller displaying "modulations" should treat those spans as a re-reading of
the whole chant rather than an event inside it.

```ts
interface Modulation {
  startPhrase: number; // first phrase of the span (inclusive)
  endPhrase: number; // last phrase (inclusive)
  toMode: number; // the mode the passage leans toward (1–8)
  confidence: number; // 0–1, the averaged margin over the home mode
  kind: "inflection" | "modulation" | "transposition";
}
```

## Theory & Context

The rhythm model is the Solesmes school's arsis/thesis synthesis, taken
from Gajard's lectures and Carroll's chironomy manuals. The full
treatise-level model lives at the classifier in
[`score/ir.ts`](https://github.com/jeffreypierce/tonus/blob/main/src/engines/score/ir.ts), which also derives Le Guennant's
incise rhythmic types ([below](#rhythmic-types)).

### The model

Arsis and thesis are properties of the **compound beat**, the group of
notes between one **ictus** and the next, not of single notes. Every
note in the group shares its quality, arsic (rising) or thetic (resting).
The ictus marks the grouping and is not itself an accent, which is why
tonus stores the quality as `Performance.rhythmicShape` rather than as a
velocity signal. Phrases, bounded by any divisio, serve as the
**incise**, the unit within which rhythm is judged.

The ictus follows the Liber's Rules for Interpretation, section by section
between bars:

1. Every vertical episema takes it.
2. So does every sustained note: the first of a distropha, tristropha,
   bivirga, pressus or oriscus pair, a dotted note, and the note before a
   quilisma.
3. So does any note that begins a group, unless rules 1 or 2 claim a note
   beside it.

Two ictus never fall in succession unless the first is of double value. There
are two exceptions, where a group start keeps its ictus beside the next note's:
before its own dotted note, taken from the Antiphonale Monasticum, and before
a lone horizontal episema, which the Liber says "generally" takes the ictus. Wherever more than three notes would pass without an
ictus, the run is cut 2+2, 2+3 or 3+2. The cut prefers word endings, then
accented syllables, and avoids a weak penultimate. Where those tie, it counts
back by twos from the next ictus. The word accent never places an ictus on its
own. A horizontal episema over one note takes the ictus; over a group, it
lengthens the group.

### The classification rules

The classifier applies Carroll's three melodic rules in priority order
(_Chironomy_ Ch. 4):

1. **Incise unity.** Once the melodic apex of the incise is passed, every
   compound beat is thetic. The apex is the incise's highest-pitched ictus.
   The rise to it is read by rules 2 and 3.
2. **Relative ictus pitch.** An ictus higher than the one before it tends
   arsic; lower tends thetic.
3. **Neume slope.** When the first two are inconclusive, rising notes are
   arsic, falling thetic.

The first compound beat of an incise is arsic ahead of the three rules: an
incise never begins with thesis. When every rule is inconclusive, the shape
alternates from the previous group. Two conventional overrides precede
everything, the first beat included. The **salicus** is always arsic, because the tension toward
its summit is the arsic gesture, and the **doubly-dotted clivis** is always
thetic, as a cadential figure.

A salicus here is Cardine's: an ascent of at least three notes whose
**next-to-last note is an oriscus** [biblio: cardine-semiology, ch. 16]. The
oriscus is what makes one. An ascending group carrying only the editorial
Solesmes ictus is a **scandicus** that was marked for rhythm. The distinction
is worth stating because conflating the two is, in Bevenot's word, a trap: over
the shelf's 7,709 chants tonus reads 616 syllables as salici against 5,418 as
scandici.

Cardine's correction also decides WHICH note is principal. The printed
editions lengthen the oriscus itself; the manuscripts show the principal note
is the one **immediately following** it (the summit), so tonus prolongs that
note and takes the oriscus lightly. This is the one point where the rhythmic
layer departs from Mocquereau and Suñol, and it does so deliberately.

### Rhythmic types

Above the per-beat arsis/thesis, each phrase carries a `rhythmicType`, Le
Guennant's taxonomy (via Carroll) of how the incise's compound beats chain, and
the `beats` sequence it reads. The observable types are modeled: **IV** (a single
arsis to a single thesis), **V** (several arses to one thesis), **VI** (one arsis
to several theses), **VII** (regular A–T alternation), and **VIII** (a
contraction of two simple rhythms overlapping at a shared ictus, after Suñol).
Types I–III use sub-beat cells that never surface in isolation and are not
labeled; an incise that fits no type is `null`. The classification rules live at
the data. See `classifyRhythmicType` in
[`score/ir.ts`](https://github.com/jeffreypierce/tonus/blob/main/src/engines/score/ir.ts).

### Modeled and not

tonus models the compound-beat classification, the per-note rhythmic index,
mode-specific cadence figures ([above](#cadences)), and the incise rhythmic types
(above). It does not yet model Carroll's textual rules (word-accent → arsic,
word-final → thetic) or accentual (spondaic vs. dactylic) cadences.

## Sources

Sources for this page are in the central [bibliography](https://github.com/jeffreypierce/tonus/blob/main/BIBLIOGRAPHY.md):
`carroll-chironomy`, `carroll-applied`, `gajard-rhythm`, `mocquereau-nombre`,
`cardine-semiology`, `desrocquettes-values`, `sunol-textbook`, `homan-cadence`,
`pierik-spirit`, `apel-chant`, `liber-usualis`, `bravura-smufl`.
