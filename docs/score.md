# Score

`tonus.notatio` renders a chant into a score: the analyzed, tuned, and
rhythm-classified reading of one GABC melody. The score is data: `phrases`,
`tabula`, `prosody`, `cadences`, `modulations`, `formulas`, and `imprint`. The
standalone `tonus.inscriptio(score)` draws it to SVG.

- [Score](#score)
  - [The score — `notatio`](#the-score--notatio)
  - [Interpretation — `pondus` and `accentus`](#interpretation--pondus-and-accentus)
  - [The note](#the-note)
  - [The tabula](#the-tabula)
  - [Rendering](#rendering)
  - [The imprint](#the-imprint)
  - [Prosody](#prosody)
  - [Cadences](#cadences)
  - [Modulations](#modulations)
  - [Melodic formulae](#melodic-formulae)
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
  formulas: FormulaMatch[];
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
  notes: Note[];
  neume: Neume;
  melisma: number;          // notes on this syllable (1 = syllabic, >1 melismatic)
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

Options, by group (all optional):

- **layout** — `width` wraps systems to fit (absent = a single line); `systemGap`,
  `custos` (line-end guides).
- **front matter** — `title`, `rubric` (or `annotation: "auto"` to derive
  _genus · modus · book_ from the chant), `dropcap` (a rubricated initial),
  `rubricaColor` (the liturgical red).
- **intonation** — `accidentals: "standard" | "heji" | "cents"` and
  `centsBaseline: "pythagorean" | "et"`. See _the intonation channel_ below.
- **scale & ink** — `staffHeight`, `noteScale`, `padding`, `noteColor`,
  `staffLineColor`.

**The geometry contract (public API).** `geometry` is one `NoteGeometry` per note,
in tabula order — the interface downstream analysis _tracks_ (chironomy,
tonarium) build on, so they place marks by index and coordinate instead of
scraping the SVG:

```ts
interface NoteGeometry {
  phraseIndex: number; syllableIndex: number; neumeGroup: number; noteIndex: number;
  system: number;      // which wrapped system the note landed in
  x: number; y: number; // notehead anchor, svg user units
  systemY: number;      // the system's top offset within the svg
}
```

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
- `"cents"` — signed cent deviations (moderna), for any tuning. `centsBaseline: "pythagorean"`
  (default) reads against the chant's home intonation — so changing the tuning
  shows what each temperament _does_ to the chant; `"et"` reads against equal
  temperament, the modern-reader instinct.

## The imprint

Both `Score` and `Harmony` expose `imprint: Imprint`, analytic
fingerprints computed from different inputs: unweighted pitch-class counts
from chant phrases, presence-weighted voiced bodies from the sky. The two
are comparable.

```js
score.imprint.attractors[0];
// { pc: 0, weight: 0.39, pitch: { spn: "C4", … } }

score.imprint.modalAffinity.slice(0, 2);
// [ { mode: 7, alias: "mixolydian",     score: 2.54 },
//   { mode: 8, alias: "hypomixolydian", score: 2.09 } ]
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
named `formula` when the ending matches one of the mode's cadence figures
([tuning.md](tuning.md#cadence-figures)). The `divisio`
tells medial from final (the double bar `::` is the final cadence). Each note
that forms a cadence carries a `cadenceRef` back-index on the tabula.

```ts
interface Cadence {
  phraseIndex: number;
  divisio: string; // the bar that ends the phrase ("::" = final cadence)
  target: "finalis" | "tenor" | "other";
  approach: "descending" | "ascending" | "unison";
  formula: string | null; // matched figure id, e.g. "la-sol"; null if unmatched
  pcs: number[]; // observed pitch classes, resolution last
  steps: (number | null)[]; // diatonic steps from the target; [] with no mode
  confidence: number; // 0–1
  notes: [number, number, number][]; // [phrase, syllable, note] positions
}
```

## Modulations

`score.modulations` marks where the tonal centre leans away from the home
mode — the local, temporal counterpart to the imprint's global modal
affinity. Each phrase is scored against all eight modes (the imprint's
affinity math); a run of phrases that favours a foreign mode, by a margin,
becomes one `Modulation` span. The margin is calibrated against Suñol's
worked examples (_Christus resurgens_ modulates toward mode 3). It's
distribution-based: it finds where a passage leans, not a functional
analysis, and can read a transposed mode as its untransposed twin.

```ts
interface Modulation {
  startPhrase: number; // first phrase of the span (inclusive)
  endPhrase: number; // last phrase (inclusive)
  toMode: number; // the mode the passage leans toward (1–8)
  confidence: number; // 0–1, the averaged margin over the home mode
}
```

## Melodic formulae

`score.formulas` reads each phrase against Apel's centonization catalogue: the
responsorial-melismatic chants (Graduals, Tracts, Great Responsories) are not
freely composed but assembled from a stock of standard phrases shared across a
mode. Each phrase is expressed as an octave-aware step-skeleton relative to
the final's register (0 = the final, +4 = the fifth, +7 = the octave — Apel's
own degree count, so a phrase reciting on the mode-5 tenor reads +4) and
matched against the catalogue for its genre × mode, tolerating the melismatic
filling that varies a formula to fit its text.

```ts
interface FormulaMatch {
  phraseIndex: number;
  formula: string | null;   // Apel's symbol (e.g. "F10"), or null if none fits
  slot: FormulaSlot | null; // opening | intonation | flex | mediant | termination | close
  confidence: number;       // 0–1: how completely the phrase realises the formula
  steps: (number | null)[]; // the phrase's step-skeleton — the evidence
}
```

Only the Tier-1 tabulatable genres (Graduals, Tracts, Great Responsories) will
carry a catalogue; other genres — and any chant with no mode — return
`formula: null` (the step-skeleton is still computed). **In 0.2 the catalogue
ships empty**: the machinery, the skeleton, and the graceful degradation are
the release surface, and `formula` is `null` for every chant until the Apel
transcription (mode-5 Graduals first) is dictated into
`score/data/formulas.ts`, where the format is documented.

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
precede the rules: the **salicus** (ascending three-note group with a
middle ictus) is always arsic, and the **doubly-dotted clivis** is always
thetic, as a cadential figure.

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

## Sources

Sources for this page are in the central [bibliography](../BIBLIOGRAPHY.md):
`carroll-chironomy`, `carroll-applied`, `gajard-rhythm`, `mocquereau-nombre`,
`cardine-semiology`, `desrocquettes-values`, `homan-cadence`, `murray-accentual`.
