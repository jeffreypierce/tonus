# Score

`tonus.notatio` renders a chant into a score. The GABC is parsed into
phrases, syllables, and neumes; every note is tuned through a
`Temperamentum` and annotated with its Guidonian step; the Solesmes
compound-beat classifier assigns the arsis/thesis rhythm; prosody is
measured and an analytic imprint drawn. The score is data: its structure
(`phrases`, `tabula`, `prosody`, `cadences`, `modulations`, `imprint`) plus two emission
methods, `score.midi()` and `score.musicxml()`.

- [Score](#score)
  - [The score — `notatio`](#the-score--notatio)
  - [Interpretation — `pondus` and `accentus`](#interpretation--pondus-and-accentus)
  - [The note](#the-note)
  - [The tabula](#the-tabula)
  - [Emission — `midi` and `musicxml`](#emission--midi-and-musicxml)
    - [midi](#midi)
    - [MusicXML](#musicxml)
  - [The imprint](#the-imprint)
  - [Prosody](#prosody)
  - [Cadences](#cadences)
  - [Modulations](#modulations)
  - [Theory \& Context](#theory--context)
    - [The model](#the-model)
    - [The classification rules](#the-classification-rules)
    - [Modeled and not](#modeled-and-not)

## The score — `notatio`

`notatio(chant, opts?)` builds a `Score` from a single `Chant`. Invalid
input throws; recoverable GABC problems land in `score.errors`, and
downstream fields degrade gracefully rather than throw.

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
the virgula), and a rest duration (MIDI). The differences are intentional and
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
}

interface Syllable {
  lyric: string;
  notes: Note[];
  neume: Neume;
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
  accidentalSource: "none" | "state" | "explicit";
  quilisma: boolean;
  liquescent: boolean;
  strophicus: boolean;
  oriscus: boolean;
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
([heavens.md](heavens.md#the-tabula)). The tabula is also the emission
surface — `score.midi()` and `score.musicxml()` ([below](#emission--midi-and-musicxml))
consume it directly, which is why `hz`, `velocity`, `bend`, and the
ornament flags live on each row.

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
  hz: number;
  offset: number;
  spn: string; // scientific pitch name, "D4"
  bend: number; // 14-bit MIDI pitch bend (8192 = center)
  velocity: number | null;
  duration: number;
  shapedDuration: number;
  rhythmicShape: "arsic" | "thetic";
  rhythmicIndex: number;
  ictus: boolean;

  // step fields
  degree: number | null;
  role: "finalis" | "tenor" | "other" | null;
  name: string | null; // Guidonian short name
  nomen: string | null; // Guidonian compound name, "Delasolre"
  hand: { finger: string; region: string } | null;
  hexachord: "durum" | "naturale" | "molle" | null;
  solfege: string | null;

  // context
  lyric: string;
  vowel: string;
  divisio: string | null;
  neume: Neume;
}
```

## Emission — `midi` and `musicxml`

The score has built-in emitters. Both consume `score.tabula`, so the
interpretation already applied through `pondus` and `accentus` flows into
the output — there is no separate emission-time interpretation pass.

### midi

`score.midi(opts?)` returns a Standard MIDI File as a `Uint8Array` by
default. Microtuning is carried as pitch-bend (from each row's `bend`),
phrasing as note velocity, and phrase divisiones become rests.

```js
const score = tonus.notatio(introit, { temperamentum: t, accentus: "solemn" });

const bytes = score.midi(); // Uint8Array — write to a .mid file
const { json } = score.midi({ format: "json" }); // inspect the event list instead
```

| `midi` option   | default  | effect                                                                       |
| --------------- | -------- | ---------------------------------------------------------------------------- |
| `format`        | `"file"` | `"file"` → `Uint8Array`; `"json"` → `{ json }`; `"both"` → `{ json, bytes }` |
| `tempoBpm`      | `120`    | tempo meta event                                                             |
| `ppq`           | `480`    | ticks per quarter note                                                       |
| `channel`       | `0`      | MIDI channel                                                                 |
| `velocity`      | `80`     | fallback velocity when a note carries no phrasing                            |
| `transpose`     | `0`      | semitone shift, applied then clamped to 0–127                                |
| `emitPitchBend` | `true`   | emit microtuning pitch-bend around each note                                 |

### MusicXML

`score.musicxml(opts?)` returns `{ xml, diagnostics }` — a MusicXML 4.0
partwise document. Phrases become measures. Each **neume figure** is drawn as
a slur — a syllable built of several figures (pes then pressus, say, split in
GABC by `!`, `/`, or `//`) gets one arc per figure; a single-note neume gets
none. The lyric attaches once, at the syllable's first note. Each row's
ornament flags (`quilisma`, `liquescent`, `strophicus`, `oriscus`) and explicit
accidentals render as notations. `emitWeights: true` adds the arsis/thesis
shape and index as an annotation per note.

```js
const { xml } = score.musicxml(); // MusicXML 4.0 partwise string
```

Emission is per-score by design, _e.g._ there is no top-level `tonus.midi`.
`Harmony` (the voiced sky) is deliberately **not** emitted this way. Voicing
planetary bodies into playable parts is out of scope for this library.

## The imprint

Both `Score` and `Harmony` expose `imprint: Imprint`, analytic
fingerprints computed from different inputs: unweighted pitch-class counts
from chant phrases, presence-weighted voiced bodies from the sky. The two
are comparable.

```js
score.imprint.attractors[0];
// { pc: 0, weight: 0.42, pitch: { spn: "C4", … } }

score.imprint.modalAffinity.slice(0, 2);
// [ { mode: 4, alias: "hypophrygian", score: 0.64 },
//   { mode: 3, alias: "phrygian",     score: 0.64 } ]
```

`modalAffinity` is a measurement, not a confirmation: _Puer natus est_
declares mode 7, and its pitch-class distribution still ranks the
Phrygian pair first. Conformance against the declared mode is read
directly:

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
  alias: string; // "Dorian" | "Hypodorian" | …
  score: number; // pc-distribution weight against mode's structural tones
}
```

## Prosody

`score.prosody` measures the chant's shape — counts, range, melisma,
rhythm, cadence. It is chant-specific; `Harmony` has no prosody. For
_Puer natus est_: ambitus 10 semitones, melisma ratio 2.04 notes per
syllable, ictus on 44% of notes, 80 arsic against 79 thetic.

```ts
interface Prosody {
  noteCount: number;
  syllableCount: number;
  phraseCount: number;
  noteRange: NoteRange | null;
  ambitus: number | null;
  melismaRatio: number;
  melismaByPhrase: number[];
  ictusRate: number;
  rhythmicProfile: RhythmicProfile;
  cadenceWeight: number;
  cadenceDistribution: CadenceDistribution;
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
phrase-ending divisio: its resolution `target`, the melodic `approach`, and —
when the ending matches one of the mode's cadence figures
([tuning.md](tuning.md#cadence-figures)) — the named `formula`. The `divisio`
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

## Theory & Context

The rhythm model is the Solesmes school's arsis/thesis synthesis, taken
from Gajard's lectures and Carroll's chironomy manuals. The full
treatise-level notes behind this section, including Le Guennant's seven
rhythmic types and a complete glossary, are archived in the project's
working files.

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

### Modeled and not

tonus models the compound-beat classification, the per-note rhythmic
index, and mode-specific cadence figures ([above](#cadences)). It does not
yet model Carroll's textual rules (word-accent → arsic, word-final →
thetic), accentual (spondaic vs. dactylic) cadences, or incise classifiers.

## Sources

Sources for this page are in the central [bibliography](../BIBLIOGRAPHY.md):
`carroll-chironomy`, `carroll-applied`, `gajard-rhythm`, `mocquereau-nombre`,
`cardine-semiology`, `desrocquettes-values`, `homan-cadence`, `murray-accentual`.
