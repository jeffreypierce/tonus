# Score

`tonus.notatio` renders a chant into a score: the analyzed, tuned, and
rhythm-classified reading of one GABC melody. The score is data: `phrases`,
`tabula`, `prosody`, `cadences`, `modulations`, and `imprint`. The
standalone `tonus.inscriptio(score)` draws it to SVG.

- [Score](#score)
  - [The score — `notatio`](#the-score--notatio)
  - [Interpretation — `pondus` and `accentus`](#interpretation--pondus-and-accentus)
  - [The note](#the-note)
  - [The tabula](#the-tabula)
  - [Rendering](#rendering)
    - [inscriptio — the standalone renderer](#inscriptio--the-standalone-renderer)
    - [The intonation channel](#the-intonation-channel)
  - [The imprint](#the-imprint)
  - [Prosody](#prosody)
  - [Cadences](#cadences)
    - [One spine, two annotations](#one-spine-two-annotations)
    - [`finality` — how often this family closes](#finality--how-often-this-family-closes)
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
is `score.tabula`. Phrases split at every divisio — the bars of chant
notation, signs of punctuation rather than measure:

| divisio | name                         |
| ------- | ---------------------------- |
| `,`     | divisio minima (quarter bar) |
| `` ` `` | virgula (tick)               |
| `;`     | divisio minor (half bar)     |
| `:`     | divisio maior (full bar)     |
| `::`    | divisio finalis (double bar) |

This hierarchy is read three ways in the engine, each weighting the bars for its
own end: an analytic cadence weight (prosody), a phrasing strength (which zeroes
the virgula), and a rest duration (the divisio's pause length). The differences are intentional and
documented at each table in the code.

```ts
interface Score {
  chant: Chant;
  phrases: Phrase[];
  errors: ParseError[];
  tabula: ChantTabulaRow[];
  prosody: Prosody;
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
  neume: Neume;
  melisma: number;          // notes on this syllable (1 = syllabic, >1 melismatic)
}
```

GABC's lyric markup is decoded at parse, so `lyric` is always clean display
text: the `<sp>` shortcuts arrive as real characters (`<sp>V/</sp>` → ℣,
`<sp>R/</sp>` → ℟, `<sp>+</sp>` → the flex †, `<sp>'ae</sp>` → ǽ, the
`\greheightstar` verbatim → the raised *), centering braces and layout tags
(`<clear>`, `<nlba>`) vanish, above-lines text (`<alt>`) is not lyric text,
and page cross-references (`\pageref`) to the paper books are dropped. Style
tags — `<i>`, `<b>`, `<sc>`, `<c>` (rubric color), `<e>` (elision) — survive
as `runs`, styled spans that concatenate to `lyric`; a style opened in one
syllable and closed several later (the common `<i>ij.</i>` and euouae
patterns) styles every syllable it crosses. Both notation species draw the
runs (italic, bold, small caps, rubric color) as SVG `<tspan>`s.

```typescript
interface LyricRun {
  text: string;
  italic?: boolean;
  bold?: boolean;
  smallCaps?: boolean;
  rubric?: boolean;         // rendered in rubricaColor
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

## Interpretation — `pondus` and `accentus`

Interpretation is set at build time.

- `pondus` governs articulation: note weight, duration, ornament response;
- `accentus` governs phrasing: velocity curves, cadence weight, tenor emphasis.

Each accepts a style name
or an options object with overrides. `rhythmicShape` and `rhythmicIndex`
are always populated by the Solesmes classifier, whatever the styles.

```js
tonus.notatio(chant, {
  temperamentum: t,
  pondus: "expressive", // style name…
  accentus: {
    style: "solemn",
    overrides: {
      /* … */
    },
  }, // …or opts
});
```

| `pondus`       | articulation                                                           |
| -------------- | ---------------------------------------------------------------------- |
| `"restrained"` | minimal ornament response, flatter dynamics, the semiological approach |
| `"balanced"`   | _default_; even articulation, moderate weight                          |
| `"expressive"` | heightened ornament response, stronger shaping                         |
| `"strict"`     | full Solesmes rule fidelity, careful episema and quilisma treatment    |

| `accentus`     | phrasing                                            |
| -------------- | --------------------------------------------------- |
| `"recitative"` | flat, declamatory; minimal curve, strong tenor pull |
| `"lyrical"`    | balanced arch, moderate cadence                     |
| `"hymnic"`     | measured, steady; suits metrical hymns              |
| `"solemn"`     | deep curve, strong cadence, elevated velocity       |

When `accentus` is omitted, tabula shaping picks the best style per mode.

A style is a named profile of numbers; `overrides` adjusts individual
fields on top of the chosen style. The presets in
`src/engines/score/articulation.ts` and `phrasing.ts` are the reference
values to start from.

```js
tonus.notatio(chant, {
  accentus: { style: "lyrical", overrides: { cadence: 1.0 } }, // heavier cadences
  pondus: { style: "strict", overrides: { ictusBoost: 0 } }, // …without ictus stress
});
```

The `pondus` profile (`ArticulationProfile`):

| field                                                        | governs                                                                                            |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `weights`                                                    | per-mark weight and duration multipliers: ictus, episema (single and double), strophicus, quilisma |
| `weightBase`, `weightGain`, `weightSaturation`               | how ornament weight accumulates and where it caps                                                  |
| `durationBase`, `durationGain`, `durationMin`, `durationMax` | how accumulated weight maps to note duration                                                       |
| `neumeArch`, `durArch`                                       | arch shaping across a neume, in weight and duration                                                |
| `ictusBoost`                                                 | extra weight on ictic notes                                                                        |
| `ruleGain`, `contourScale`                                   | strength of rule-driven and contour-driven shaping                                                 |

The `accentus` profile (`PhrasingProfile`):

| field                       | governs                                            |
| --------------------------- | -------------------------------------------------- |
| `curve`                     | depth of the phrase-level velocity arch            |
| `accent`                    | accent emphasis within the phrase                  |
| `cadence`                   | weight given to phrase-final cadences              |
| `tenor`                     | pull toward the reciting tone                      |
| `baseVelocity`, `velSpread` | the velocity floor and the dynamic range above it  |
| `contourVel`, `contourDur`  | melodic-contour influence on velocity and duration |
| `ictusBoost`                | extra velocity on ictic notes                      |
| `neumeArch`, `durArch`      | arch shaping across a neume                        |

```ts
interface ScoreOpts {
  temperamentum?: Temperamentum;
  pondus?: string | PondusOpts; // a style from the table, or opts
  accentus?: string | AccentusOpts;
}

interface PondusOpts {
  style?: string;
  overrides?: Partial<ArticulationProfile>; // fields from the table above
}

interface AccentusOpts {
  style?: string;
  overrides?: Partial<PhrasingProfile>; // fields from the table above
}
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
  velocity: number; // 0–1 shaping factor
  duration: number;
  rhythmicShape: "arsic" | "thetic"; // quality of this note's compound beat
  rhythmicIndex: number; // 1-based position within the compound beat
}

interface Context {
  lyric: string;
  vowel: string;
  syllableIndex: number;
  accent: boolean; // this note's syllable bears the Latin tonic word-accent
  neumeGroup: number; // neume figure within the syllable (0-based)
  ictus: boolean;
  ictusSign: boolean; // an editorial ictus mark is printed in the source
  episema: boolean;
  accidentalSource: "none" | "state" | "explicit";
  quilisma: boolean;
  liquescent: boolean;
  strophicus: boolean;
  oriscus: boolean;
  mora: 0 | 1 | 2; // mora vocis: 0 none, 1 dot, 2 double dot
  staffLetter: string; // the GABC staff letter as written
  clef: string; // the clef in force at this note ("c3", "f4", …)
  shape: string; // the notehead shape (punctum, inclinatum, quilisma, …)
  weight: number; // articulation weight
}
```

A compound beat is the group of notes between one ictus and the next;
every note in the group shares its quality, arsic (rising, active) or
thetic (resting, retractive). The classification rules are in
[Theory & Context](#theory--context).

## The tabula

`score.tabula` is the flat iteration surface: one row per note, for
analysis, visualization, or emission.

`Harmony` exposes the same surface for voiced bodies
([heavens.md](heavens.md#the-tabula)). The tabula is also the rendering
surface — the SVG renderer ([below](#rendering)) consumes it directly, which is
why `hz`, `velocity`, `bend`, and the ornament flags live on each row.

```js
score.tabula[0];
// { lyric: "PU", midi: 43, hz: 97.8,
//   name: "Γ", nomen: "Gammaut",
//   rhythmicShape: "arsic", rhythmicIndex: 1, ictus: true,
//   degree: 1, role: "finalis", … }
```

The first note of _Puer natus est_ sits on Gammaut, the bottom of the
Guidonian hand.

```ts
interface ChantTabulaRow {
  // position
  phraseIndex: number;
  syllableIndex: number;
  noteIndex: number;
  accent: boolean; // this note's syllable bears the Latin tonic word-accent
  neumeGroup: number; // which neume figure within the syllable (0-based)
  neumeIndex: number; // position of this note within that figure
  wordStart: boolean; // first syllable of its word

  // note fields
  midi: number;
  pc: number;
  octave: number;
  accidental: -1 | 0 | 1;
  accidentalSource: "none" | "state" | "explicit";
  quilisma: boolean;
  liquescent: boolean;
  strophicus: boolean;
  oriscus: boolean;
  mora: 0 | 1 | 2; // mora vocis: 0 none, 1 dot, 2 double dot
  hz: number;
  offset: number;
  spn: string; // scientific pitch name, "D4"
  staffLetter: string; // the GABC staff letter as written
  staffPosition: number; // vertical staff position (line/space index)
  clef: string; // the clef in force at this note ("c3", "f4", …)
  shape: string; // the notehead shape (punctum, inclinatum, quilisma, …)
  bend: number; // 14-bit MIDI pitch bend (8192 = center)
  velocity: number | null;
  duration: number;
  shapedDuration: number;
  rhythmicShape: "arsic" | "thetic";
  rhythmicIndex: number;
  ictus: boolean;
  ictusSign: boolean; // an editorial ictus mark is printed in the source
  episema: boolean;

  // step fields
  degree: number | null;
  role: "finalis" | "tenor" | "other" | null;
  name: string | null; // Guidonian short name
  nomen: string | null; // Guidonian compound name, "Delasolre"
  hand: { finger: Finger; region: Region } | null;
  hexachord: "durum" | "naturale" | "molle" | null;
  solfege: string | null;

  // context
  lyric: string;
  runs?: LyricRun[];         // styled lyric spans (see Syllable above)
  vowel: string;
  divisio: string | null;
  cadenceRef: number | null; // index into score.cadences[] when this note closes one
  neume: Neume;
}
```

## Rendering

The score is drawn as **SVG** — a self-contained, square-note chant staff with
SMuFL glyphs baked as inline paths (no external font). It consumes `score.tabula`,
so the interpretation applied through `pondus` and `accentus` is already in the
geometry.

> **Retired in 0.2:** the MusicXML and MIDI emitters (`score.musicxml()`,
> `score.midi()`) were removed. tonus emits one format: SVG. Microtuning still
> lives on each tabula row's `bend`/`hz`/`offset` for a Web-Audio player to read
> directly (microtonally exact, which MIDI never was); it is no longer serialized
> to a MIDI file here.

### inscriptio — the standalone renderer

`tonus.inscriptio(score, opts?)` draws a `Score` and returns `{ svg, geometry }`.
Rendering is a standalone function that _takes_ a score, not a method on one — the
score analyzes, `inscriptio` inks. It throws on a non-Score or an unknown
notation species (the builder-function contract).

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
DOM, no canvas, and no font file — `inscriptio` runs anywhere Node does. Note
glyphs carry exact SMuFL advance widths; lyric text is computed from character
classes, since measuring it would require the font's own metrics. Line breaks,
system fill, and the width of the returned canvas all rest on that figure. It is
close, not exact: a lyric set in a face far from the assumed proportions will
break slightly early or late.

Two consequences worth planning around. `width` is a **request, not a promise** —
the canvas returned is `max(width, content)`, so a chant whose content cannot fit
comes back wider rather than clipped. And a caller who needs typographic
precision should render at a generous `width` and scale the result, rather than
relying on the estimate to land a tight column exactly.

Options, by group (all optional):

- **layout** — `width` wraps systems to fit (absent = a single line); `scale`
  sets how big the chant is drawn: `"small"`, `"normal"` (default), `"large"`,
  or a staff height in px for fitting a known column. Everything scales from it
  — notes, lyrics, the air between systems — and it reflows the music, so a
  larger scale means fewer notes per line. The page margin does not scale: it
  belongs to the page rather than the notation, and scaling it gave a large
  chant *less* usable width than a small one.
- **front matter** — set as the Solesmes books open a piece: `title` centers
  over the score; `rubric` (or `annotation: "auto"` to derive the genus/mode
  mark, e.g. _Introitus. 8._) sits upright at the left margin; `dropcap` draws
  the rubricated initial the printed books open with, taking the first letter
  out of the lyric and indenting the first system to hold it. Both species
  honour the front matter.
- **intonation** — `accidentals: "standard" | "heji" | "cents"` and
  `centsBaseline: "pythagorean" | "et"`. See _the intonation channel_ below.
- **theme** — the dress: `fonts` and `colors`.

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

**`fonts`** carries four roles, and they are deliberately separate: a book's
dropcap is very often *not* its lyric face — a Lombardic or uncial initial
against a text hand, which is the pairing the printed books use. Each role takes
a font-family string or `{ family, weight?, scale? }` (`scale` adjusts that
role's size, for a face whose apparent size differs from the house serif).

The SVG carries font-family *references* by default, and the page hosting it
supplies the face (`@font-face`). A slot may instead carry
`embed: { base64, format? }` — the caller's own bytes — and the face then rides
inside the SVG's `<style>`, making the file self-contained (at the cost of its
size; one `@font-face` per family + weight, deduped). tonus bundles no font
files: with `embed` it is a conduit for data the consumer supplies, so the
consumer carries the face's license terms. Unset roles keep the house serif.
`moderna` honours the `lyric`, `title`, and `annotation` slots.

**`colors`** reach the SVG as CSS custom properties with the theme's own value
as the fallback — `fill="var(--tonus-note, #111)"`. A rendered chant therefore
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

That is why the colours are custom properties rather than literals: an inline
`fill` beats any stylesheet rule, so a literal would make the emitter's own
semantic classes (`note`, `lyric`, `dropcap`, `custos`, `episema`, `divisio`,
`clef`, `mora`, `ictus`, …) unstylable from the host page.

**`scale` is not part of the theme**, and deliberately so: it is consumed by
line breaking — it decides how many notes fit a system — so it is settled long
before a stylesheet sees the output. A scale change re-renders; a colour change
need not. That is the line between the two.

Nothing else about the layout is a caller's decision. The margin, the air
between systems, the notehead calibration against the staff, and the line-end
custos were all options until 0.5 and were never once set — not by the docs
site, the 28 lab plates, or the 13 stress pieces. They are now constants chosen
to look right at every scale, and the custos simply appears whenever a system
wraps, which is what a chant book does.

**The geometry contract (public API).** `geometry` is one `NoteGeometry` per note,
in tabula order — the interface analysis _tracks_ build on, so they place marks
by index and coordinate instead of scraping the SVG. The library's own tracks
(below) consume exactly these anchors; a custom track downstream does the same:

```ts
interface NoteGeometry {
  phraseIndex: number; syllableIndex: number; neumeGroup: number; noteIndex: number;
  system: number;      // which wrapped system the note landed in
  x: number; y: number; // notehead anchor, svg user units
  systemY: number;      // the system's top offset within the svg
}
```

### The analysis tracks

`tracks` draws an analysis band beneath every system. Either track rides either
species, and both may ride one score — the selection is independent of the
notation, as `notation` itself is. One governing ink system runs through both:
every mark draws in the score's black, strata graded by opacity alone (the
liturgical red belongs to the mode line and nothing else), and every
pressure-bearing line shares one nib law — velocity as stroke width.

```js
tonus.inscriptio(score, { width: 680, tracks: ["chironomia"] });
tonus.inscriptio(score, { notation: "moderna", width: 680, tracks: ["tonarium"] });
tonus.inscriptio(score, { width: 680, tracks: ["tonarium"] });                    // either way
tonus.inscriptio(score, { width: 680, tracks: ["chironomia", "tonarium"] });      // stacked
```

The **two-register principle** is the house pairing: the rhythmic band under the
square notation (the body), the melodic band under the transcription (the mind).
It is a default worth keeping, not a constraint the renderer enforces.

Requesting both stacks them in a fixed order — the chironomia above, the
tonarium below — whichever order they are asked for, and the page grows by the
sum of the two bands.

- **`"chironomia"`** — the conducting hand as one continuous line:
  arsic beats crest, thetic beats trough, single-note theses pass through
  shallow, and the hand picks up between close arses in a small backward loop
  [biblio: carroll-chironomy]. Pressure is the stroke's _weight_: each note's
  `velocity` (the `accentus` shaping) becomes nib width over solid ink, so the
  line presses where the voice does. Pierik letters (A · T · PT) name the
  beats — the incise's rhythmic shape is read straight off them.
- **`"tonarium"`** — the melodic-analysis lane, named for the book
  that catalogued chants by mode. Four rails — the maneriae finals ladder, D on
  the bottom (categories, not pitches) — carry the **mode line** in the
  liturgical red: the governing mode of each phrase, its numeral above
  (authentic-vs-plagal lives in the numeral). A modulation of kind
  `"inflection"` steps the line solid; a `"transposition"` (the affinal frame
  read as displacement) draws dashed. Through the rails runs the melody itself,
  compressed to the chant's ambitus and wearing the same pressure grammar, a
  lighter stratum — context, not message.
  A **cadence is the melody's own ending re-inked black**: the same curve at
  the same width turns pure black across the cadential figure and lands on a
  terminal node — filled when the family's measured `finality` closes, open
  when it suspends. The row beneath labels it with its **lift** against the
  chant's own mode — `"×2.1"`, how much more (or less) that mode reaches for
  this close than the corpus at large. A lift below 1.0 prints too: an
  atypical close is information. Where the chant has no mode, or the family
  has too few occurrences in it to divide honestly, the label falls back to
  the plain corpus share (`"3.8%"`). The family **key** has not vanished — it
  rides the cadence group as `data-cadentia`, which is the join back to
  [`CADENTIAE`](index.md#the-appendix) and the provenance a margin gloss can
  print. A light end-ticked bracket ties the label to the figure's span; a
  label always follows its figure, clamping to the margin at the system's
  edge, and crowded labels dodge to a second row.

  > **Layout in progress.** The tonarium's label row and band geometry are
  > being reworked now that the data behind them settled. The grammar above
  > is stable — what the marks MEAN will not change — but exact placement,
  > spacing, and the dodge behaviour are not yet final. This note comes out
  > when they are.

Everywhere, confidence is opacity, and a claim below confidence 0.45 draws
nothing — weak claims are not inked. Every mark sits under the notation that
would falsify it.

### The intonation channel

`accidentals` chooses how a note's tuning shows on the staff. The `standard`
accidentals are authentic to either species; the `heji` and `cents` modes are
modern analytical overlays and render on **moderna** only — asking for them on
`quadrata` (historical square notation) **throws**.

- `"standard"` (default) — plain performance accidentals (♭ ♮ ♯) as GABC
  expresses them, a mark stated once and suppressed on an immediate repeat of the
  same pitch. Both species draw these.
- `"heji"` — Extended Helmholtz–Ellis comma accidentals (moderna). HEJI's baseline
  is the **Pythagorean chain of pure fifths** — which is also tonus's default
  tuning — so a Pythagorean chant renders clean; comma arrows bloom only where the
  tuning departs from the pure-fifth chain (a just preset shows syntonic commas,
  ±21.5¢). Meantone tempers by fractional commas (not just), so `heji` **throws**
  under it.
- `"cents"` — signed cent deviations (moderna), for any tuning. Labels float in
  a band above the staff, and a deviating pitch class is labelled once per
  phrase (its repeats ride silently until the next phrase restates it).
  `centsBaseline: "pythagorean"` (default) reads against the chant's home
  intonation — so changing the tuning shows what each temperament _does_ to the
  chant; `"et"` reads against equal temperament, the modern-reader instinct.

## The imprint

Both `Score` and `Harmony` expose `imprint: Imprint`, analytic
fingerprints computed from different inputs: unweighted pitch-class counts
from chant phrases, presence-weighted voiced bodies from the sky. The two
are comparable.

```js
score.imprint.attractors[0];
// { pc: 0, weight: 0.39, pitch: { spn: "C4", … } }

score.imprint.modalAffinity.slice(0, 2);
// [ { mode: 7, alias: "mixolydian",     score: 2.64 },
//   { mode: 8, alias: "hypomixolydian", score: 2.18 } ]
```

The ranking reads three signals beyond the pitch-class distribution: the opening
note (each mode's initials, in Rockstro's ordering), the closing note (a chant
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

## Prosody

`score.prosody` measures the chant's shape — counts, range, melisma,
melodic motion, contour, tessitura, rhythm, cadence. It is chant-specific;
`Harmony` has no prosody. For _Puer natus est_: ambitus 10 semitones, melisma
ratio 2.04 notes per syllable, tessitura ~5 semitones above the final, a near-
perfect melodic arch, mostly stepwise motion (leap rate ~5%).

```ts
interface Prosody {
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

interface IntervalStats {
  histogram: Record<number, number>; // signed semitone interval → count
  maxLeap: number;                   // largest absolute interval (semitones)
  leapRate: number;                  // fraction of motions that are leaps (a 4th+)
  motus: { step: number; skip: number; leap: number }; // 1–2 st / 3–4 / 5+
}

interface Arcus {
  initial: number;   // first note MIDI
  peak: number;      // highest note MIDI
  final: number;     // last note MIDI
  archIndex: number; // signed: +1 rises and returns, 0 flat/monotonic
}

interface NoteRange {
  min: number;
  max: number;
  span: number;
}

interface RhythmicProfile {
  arsic: number; // count of arsic notes across the score
  thetic: number; // count of thetic notes across the score
  avgGroupSize: number; // mean notes per compound beat
  maxGroupSize: number; // largest compound beat observed
}

interface CadenceDistribution {
  comma: number; // divisio minima
  tick: number; // virgula
  semicolon: number; // divisio minor
  colon: number; // divisio maior
  doubleBar: number; // divisio finalis
}
```

## Cadences

`score.cadences` names the melodic close of each phrase — where prosody
only counts the divisio bars, this identifies the figure. One `Cadence` per
phrase-ending divisio: its resolution `target`, the melodic `approach`, and the
`divisio` that tells medial from final (the double bar `::` is the final
cadence). Each note that forms a cadence carries a `cadenceRef` back-index on
the tabula.

### One spine, two annotations

Two catalogues describe a cadence, and they answer different questions. Read
this before deciding which field to use:

> Every cadence carries a **`signature`** — always. Some are **catalogued** by
> the corpus (`finality`, and everything in
> [`CADENTIAE`](index.md#the-appendix)). Some, on the final, are **named** by
> received theory (`formula`).

- **`formula`** is _tradita_: the mode's cadence figures as the treatises give
  them ([tuning.md](tuning.md#cadence-figures)), matched in solmization
  relative to the final — `"la-sol"`, `"mi-re"`. It fires **only on the
  finalis**, because the received catalogue holds only final figures.
- **`signature`** is _inventa_: the tail's interval shape and where it lands,
  keyed as `"2,0,-2 @0"` and mined from the corpus. It fires on **any** target,
  which makes it the only thing that speaks about **medial** cadences at all.

Measured over 27,969 cadences in the shipped corpus: 42.5% carry a formula,
58.7% join the catalogue, 32.4% carry both, and 31.2% are keyed but fall below
the catalogue's floor. Neither is derivable from the other — of the 101
signatures that ever co-occur with a formula, 63 map to more than one, because
the signature is mode-blind and the formula is mode-relative.

### `finality` — how often this family closes

`finality` is the share of **this family's** corpus occurrences that fall at a
final close. It is a measurement, not a property of this particular cadence,
and it cannot be read off the signature: of the 55 families that land **on**
the final, 31 do not close, and their finality spans 0.054 to 1.000. So
`arrival === 0` implies nothing about whether a close is final.

It is `null` when the signature falls below the catalogue's floor — an
uncatalogued close, not a close that never closes.

```ts
interface Cadence {
  phraseIndex: number;
  divisio: string; // the bar that ends the phrase ("::" = final cadence)
  target: "finalis" | "tenor" | "other";
  approach: "descending" | "ascending" | "unison";
  formula: string | null; // tradita: matched figure id, e.g. "la-sol"; finalis only
  pcs: number[]; // observed pitch classes, resolution last
  steps: (number | null)[]; // diatonic steps from the target; [] with no mode
  confidence: number; // 0–1
  notes: [number, number, number][]; // [phrase, syllable, note] positions
  signature: string | null; // inventa: the family key, "shape @arrival"
  shape: number[]; // the tail's successive semitone intervals
  arrival: number; // SIGNED semitones from the chant's own closing note
  finality: number | null; // the family's measured finality; null below the floor
}
```

A one-note phrase is a cadence — a landing with no gesture — and keys with an
empty shape (`" @0"`), which is why `signature` is that key rather than null.

`arrival` is deliberately **not** octave-reduced. Folding it pooled a fifth
above the final with a fourth below: of 3,499 phrase-ends that landed on `@-5`
under the fold, 2,427 were really `+7`. Two opposite gestures under one key.

## Modulations

`score.modulations` marks where the tonal centre leans away from the home
mode — the local, temporal counterpart to the imprint's global modal
affinity. Each phrase is scored against all eight modes (the imprint's
affinity math); a run of phrases that favours a foreign mode, by a margin,
becomes one `Modulation` span. The margin is calibrated against Suñol's
worked examples (_Christus resurgens_ modulates toward mode 3). It is
distribution-based: it finds where a passage leans, not a functional analysis.

`kind` says what the span is evidence OF, which matters because the three are
not the same phenomenon. **`inflection`** is a single phrase leaning away and
back — passing colour, not a shift. **`modulation`** is a sustained internal
excursion, two phrases or more, that returns. **`transposition`** is the whole
chant sitting in a foreign mode's frame: it does not close on its labelled
final and one foreign mode dominates most of its phrases, meaning the melody is
notated at a transposed position (the affinal) or the label disagrees with the
notation. A transposed chant is not modulating — the displacement is global —
so a caller displaying "modulations" should treat those spans as a re-reading of
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
[`score/ir.ts`](../src/engines/score/ir.ts), which also derives Le Guennant's
incise rhythmic types ([above](#rhythmic-types)).

### The model

Arsis and thesis are properties of the **compound beat**, the group of
notes between one **ictus** and the next, not of single notes. Every
note in the group shares its quality, arsic (rising) or thetic (resting).
The ictus marks the grouping and is not itself an accent, which is why
tonus stores the quality as `Performance.rhythmicShape` rather than as a
velocity signal. Phrases, bounded by any divisio, serve as the
**incise**, the unit within which rhythm is judged.

### The classification rules

The classifier applies Carroll's three melodic rules in priority order
(_Chironomy_ Ch. 4):

1. **Incise unity.** Ictuses before the melodic apex of the incise are
   arsic; after it, thetic. The apex is the incise's highest-pitched
   ictus.
2. **Relative ictus pitch.** An ictus higher than the one before it tends
   arsic; lower tends thetic.
3. **Neume slope.** When the first two are inconclusive, rising notes are
   arsic, falling thetic.

The first compound beat of an incise is always arsic. When every rule is inconclusive, the
shape alternates from the previous group. Two conventional overrides
precede the rules: the **salicus** is always arsic — the tension toward its
summit is the arsic gesture — and the **doubly-dotted clivis** is always
thetic, as a cadential figure.

A salicus here is Cardine's: an ascent of at least three notes whose
**next-to-last note is an oriscus** [biblio: cardine-semiology, ch. 16]. The
oriscus is what makes one. An ascending group carrying only the editorial
Solesmes ictus is a **scandicus** that was marked for rhythm — a distinction
worth stating because conflating the two is, in Bevenot's word, a trap: over
the sung corpus the ictus rule matches 2,795 groups of which 36 carry an
oriscus, while the corpus holds 226 real salici.

Cardine's correction also decides WHICH note is principal. The printed
editions lengthen the oriscus itself; the manuscripts show the principal note
is the one **immediately following** it — the summit — so tonus prolongs that
note and takes the oriscus lightly. This is the one point where the rhythmic
layer departs from Mocquereau and Suñol, and it does so deliberately.

### Rhythmic types

Above the per-beat arsis/thesis, each phrase carries a `rhythmicType` — Le
Guennant's taxonomy (via Carroll) of how the incise's compound beats chain, and
the `beats` sequence it reads. The observable types are modeled: **IV** (a single
arsis to a single thesis), **V** (several arses to one thesis), **VI** (one arsis
to several theses), **VII** (regular A–T alternation), and **VIII** (a
contraction — two simple rhythms overlapping at a shared ictus, after Suñol).
Types I–III use sub-beat cells that never surface in isolation and are not
labeled; an incise that fits no type is `null`. The classification rules live at
the data — see `classifyRhythmicType` in
[`score/ir.ts`](../src/engines/score/ir.ts).

### Modeled and not

tonus models the compound-beat classification, the per-note rhythmic index,
mode-specific cadence figures ([above](#cadences)), and the incise rhythmic types
(above). It does not yet model Carroll's textual rules (word-accent → arsic,
word-final → thetic) or accentual (spondaic vs. dactylic) cadences.

### Why the layout estimates

A chant renderer must know how wide a lyric is before it can decide where a line
ends. The established engines measure: exsurge reads real text metrics through
canvas, SVG `getBBox`, or opentype.js depending on where it is running;
nabc-lib inserts a hidden `<text>` node and reads the browser's own box. Both are
exact, and both require a browser or a font file.

tonus computes the width instead, from character classes. This is a deliberate
trade rather than a missing feature: the library is a per-chant, deterministic
engine, and the two properties that follow from computing are worth more here
than the last few percent of typographic precision.

The first is **portability**. `inscriptio` has no environment: it runs in Node, in
a worker, in CI, in a build step, with no DOM to construct and no font to load.
A chant renders the same on a server as in a browser because nothing about the
host participates in the layout.

The second is **reproducibility**. The same score and options yield byte-identical
SVG — which is what makes the render suite testable at all. Two of this session's
layout changes were verified by hashing 2,500 renders and comparing them against
the previous commit; a layout that consulted the ambient font stack could not be
checked that way, because the reference bytes would differ per machine.

The cost is a bounded inaccuracy in one place: **inter-word spacing and line fill,
never pitch or rhythm.** Note positions come from SMuFL advance widths, which are
exact. A lyric in a face far from the assumed proportions shifts where a line
happens to break; it does not move a note off its staff position. The layout is
correct to within the estimate, and the estimate is the accuracy floor for
everything built above it — line fill, and any future justification or
mid-syllable splitting.

If exact metrics are ever needed, the honest shape is an optional measuring
callback on `InscriptioOpts`, so a caller who *has* a DOM can supply real widths
while the computed estimate remains the default. That preserves determinism for
everyone who does not.

## Sources

Sources for this page are in the central [bibliography](../BIBLIOGRAPHY.md):
`carroll-chironomy`, `carroll-applied`, `gajard-rhythm`, `mocquereau-nombre`,
`cardine-semiology`, `desrocquettes-values`, `sunol-textbook`, `homan-cadence`,
`pierik-spirit`, `apel-chant`, `liber-usualis`, `bravura-smufl`.
