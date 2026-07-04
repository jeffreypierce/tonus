# Score

`tonus.notatio` renders a chant into a score. The GABC is parsed into
phrases, syllables, and neumes; every note is tuned through a
`Temperamentum` and annotated with its Guidonian step; the Solesmes
compound-beat classifier assigns the arsis/thesis rhythm; prosody is
measured and an analytic imprint drawn. The score is pure data — no
methods. Two profiles govern interpretation: `pondus` for articulation and
`accentus` for phrasing.

- [The score — `notatio`](#the-score--notatio)
- [Interpretation — `pondus` and `accentus`](#interpretation--pondus-and-accentus)
- [The note](#the-note)
- [The tabula](#the-tabula)
- [The imprint](#the-imprint)
- [Prosody](#prosody)
- [Theory & Context](#theory--context)
- [Sources](#sources)

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

| divisio | name |
| --- | --- |
| `,` | divisio minima (quarter bar) |
| `` ` `` | virgula (tick) |
| `;` | divisio minor (half bar) |
| `:` | divisio maior (full bar) |
| `::` | divisio finalis (double bar) |

```ts
interface Score {
  chant: Chant;
  phrases: Phrase[];
  errors: ParseError[];
  tabula: ChantTabulaRow[];
  prosody: Prosody;
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
  divisio: string;   // a mark from the table above
  duration: number;
}

interface ParseError {
  message: string;
  index?: number;
}
```

## Interpretation — `pondus` and `accentus`

Interpretation is set at build time. `pondus` governs articulation — note
weight, duration, ornament response; `accentus` governs phrasing —
velocity curves, cadence weight, tenor emphasis. Each accepts a style name
or an options object with overrides. `rhythmicShape` and `rhythmicIndex`
are always populated by the Solesmes classifier, whatever the styles.

```js
tonus.notatio(chant, {
  temperamentum: t,
  pondus: "expressive",                                  // style name…
  accentus: { style: "solemn", overrides: { /* … */ } }, // …or opts
});
```

| `pondus` | articulation |
| --- | --- |
| `"restrained"` | minimal ornament response, flatter dynamics — the semiological approach |
| `"balanced"` | default; even articulation, moderate weight |
| `"expressive"` | heightened ornament response, stronger shaping |
| `"strict"` | full Solesmes rule fidelity, careful episema and quilisma treatment |

| `accentus` | phrasing |
| --- | --- |
| `"recitative"` | flat, declamatory; minimal curve, strong tenor pull |
| `"lyrical"` | default; balanced arch, moderate cadence |
| `"hymnic"` | measured, steady; suits metrical hymns |
| `"solemn"` | deep curve, strong cadence, elevated velocity |

When `accentus` is omitted, tabula shaping uses the mode-gated default.

A style is a named profile of numbers; `overrides` adjusts individual
fields on top of the chosen style. The presets in
`src/engines/score/articulation.ts` and `phrasing.ts` are the reference
values to start from.

```js
tonus.notatio(chant, {
  accentus: { style: "lyrical", overrides: { cadence: 1.0 } }, // heavier cadences
  pondus: { style: "strict", overrides: { ictusBoost: 0 } },   // …without ictus stress
});
```

The `pondus` profile (`ArticulationProfile`):

| field | governs |
| --- | --- |
| `weights` | per-mark weight and duration multipliers: ictus, episema (single and double), strophicus, quilisma |
| `weightBase`, `weightGain`, `weightSaturation` | how ornament weight accumulates and where it caps |
| `durationBase`, `durationGain`, `durationMin`, `durationMax` | how accumulated weight maps to note duration |
| `neumeArch`, `durArch` | arch shaping across a neume, in weight and duration |
| `ictusBoost` | extra weight on ictic notes |
| `ruleGain`, `contourScale` | strength of rule-driven and contour-driven shaping |

The `accentus` profile (`PhrasingProfile`):

| field | governs |
| --- | --- |
| `curve` | depth of the phrase-level velocity arch |
| `accent` | accent emphasis within the phrase |
| `cadence` | weight given to phrase-final cadences |
| `tenor` | pull toward the reciting tone |
| `baseVelocity`, `velSpread` | the velocity floor and the dynamic range above it |
| `contourVel`, `contourDur` | melodic-contour influence on velocity and duration |
| `ictusBoost` | extra velocity on ictic notes |
| `neumeArch`, `durArch` | arch shaping across a neume |

```ts
interface ScoreOpts {
  temperamentum?: Temperamentum;
  pondus?: string | PondusOpts;     // a style from the table, or opts
  accentus?: string | AccentusOpts;
}

interface PondusOpts {
  style?: string;
  overrides?: Partial<ArticulationProfile>;  // fields from the table above
}

interface AccentusOpts {
  style?: string;
  overrides?: Partial<PhrasingProfile>;      // fields from the table above
}
```

## The note

The score's unified `Note` composes four concerns into sub-objects:
`pitch` is the tuned identity and `step` the Guidonian annotation, both
from the tuning engine ([tuning.md](tuning.md)); `performance` carries the
interpretation; `context` the position, lyric, and ornament marks. Access
as `note.pitch.midi`, `note.performance.velocity`, `note.step.nomen`,
`note.context.lyric`.

```ts
interface Note {
  pitch: Pitch;             // tuned identity — tuning.md
  step: Step;               // modal/Guidonian annotation — tuning.md
  performance: Performance;
  context: Context;
}

interface Performance {
  velocity: number;           // 0–1 shaping factor
  duration: number;
  rhythmicShape: "arsic" | "thetic"; // quality of this note's compound beat
  rhythmicIndex: number;      // 1-based position within the compound beat
}

interface Context {
  lyric: string;
  vowel: string;
  syllableIndex: number;
  ictus: boolean;
  accidentalSource: "none" | "state" | "explicit";
  quilisma: boolean;
  liquescent: boolean;
  strophicus: boolean;
  weight: number; // articulation weight
}
```

A compound beat is the group of notes between one ictus and the next;
every note in the group shares its quality, arsic (rising, active) or
thetic (resting, retractive). The classification rules are in
[Theory & Context](#theory--context).

## The tabula

`score.tabula` is the flat iteration surface: one row per note, for
analysis, visualization, or emission. Always a property, never a method.
`Harmony` exposes the same surface for voiced bodies
([heavens.md](heavens.md#the-tabula)). The tabula is also the emission
surface: `tonus.midi` and `tonus.musicxml` will consume it when they join
the API in v1.1; `hz`, `velocity`, and the pitch-bend data exist for that
purpose.

```js
score.tabula[0];
// { lyric: "PU", midi: 43, hz: 97.8,
//   name: "Γ", nomen: "Gammaut",
//   rhythmicShape: "arsic", rhythmicIndex: 1, ictus: true,
//   degree: 1, role: "finalis", … }
```

The first note of *Puer natus est* sits on Gammaut, the bottom of the
Guidonian hand.

```ts
interface ChantTabulaRow {
  // position
  phraseIndex: number;
  syllableIndex: number;
  noteIndex: number;
  neumeIndex: number;

  // note fields
  midi: number;
  pc: number;
  octave: number;
  accidental: -1 | 0 | 1;
  hz: number;
  offset: number;
  velocity: number | null;
  duration: number;
  shapedDuration: number;
  rhythmicShape: "arsic" | "thetic";
  rhythmicIndex: number;
  ictus: boolean;

  // step fields
  degree: number | null;
  role: "finalis" | "tenor" | "other" | null;
  name: string | null;     // Guidonian short name
  nomen: string | null;    // Guidonian compound name, "Delasolre"
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

## The imprint

Both `Score` and `Harmony` expose `imprint: Imprint` — the same analytic
fingerprint computed from different inputs: unweighted pitch-class counts
from chant phrases, presence-weighted voiced bodies from the sky. The two
are comparable.

```js
score.imprint.attractors[0];
// { pc: 0, weight: 0.42, pitch: { spn: "C4", … } }

score.imprint.modalAffinity.slice(0, 2);
// [ { mode: 4, alias: "hypophrygian", score: 0.64 },
//   { mode: 3, alias: "phrygian",     score: 0.64 } ]
```

`modalAffinity` is a measurement, not a confirmation: *Puer natus est*
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
  attractors: Attractor[];                // top pitch classes, tuned
  vowelAttractors: VowelAttractor[];      // vowel-weighted resonances, tuned
  modalAffinity: ModalAffinity[];         // all 8 modes ranked by fit
}

interface Attractor {
  pc: number;     // pitch class 0–11
  weight: number; // normalized 0–1
  pitch: Pitch;   // tuned through the score/harmony's temperamentum
}

interface VowelAttractor {
  vowel: string;  // "a" | "e" | "i" | "o" | "u"
  weight: number; // fraction of total vowel weight
  pitch: Pitch;   // the vowel's most-associated tuned pitch
}

interface ModalAffinity {
  mode: number;   // 1–8
  alias: string;  // "Dorian" | "Hypodorian" | …
  score: number;  // pc-distribution weight against mode's structural tones
}
```

## Prosody

`score.prosody` measures the chant's shape — counts, range, melisma,
rhythm, cadence. It is chant-specific; `Harmony` has no prosody. For
*Puer natus est*: ambitus 10 semitones, melisma ratio 2.04 notes per
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
  arsic: number;        // count of arsic notes across the score
  thetic: number;       // count of thetic notes across the score
  avgGroupSize: number; // mean notes per compound beat
  maxGroupSize: number; // largest compound beat observed
}

interface CadenceDistribution {
  comma: number;     // divisio minima
  tick: number;      // virgula
  semicolon: number; // divisio minor
  colon: number;     // divisio maior
  doubleBar: number; // divisio finalis
}
```

## Theory & Context

The rhythm model is the Solesmes school's arsis/thesis synthesis, taken
from Gajard's lectures and Carroll's chironomy manuals. The full
treatise-level notes behind this section, including Le Guennant's seven
rhythmic types and a complete glossary, are archived in the project's
working files.

### The model

Arsis and thesis are not properties of single notes. They are qualities of
the **compound beat** — the group of notes between one **ictus** and the
next — and every note in the group shares its quality: arsic (ἄρσις,
rising, active) or thetic (θέσις, resting, retractive). The ictus itself
is a measuring point, not an accent; Gajard is emphatic that it carries
"no intensity of itself" (pp. 22–24). This is why tonus puts the
categorical shape on `Performance.rhythmicShape` rather than encoding it
as a velocity signal, and why phrases — bounded by any divisio — serve as
the **incise**, the unit within which rhythm is judged.

### The classification rules

The classifier applies Carroll's three melodic rules in priority order
(*Chironomy* Ch. 4):

1. **Incise unity.** Ictuses before the melodic apex of the incise are
   arsic; after it, thetic. The apex is the incise's highest-pitched
   ictus.
2. **Relative ictus pitch.** An ictus higher than the one before it tends
   arsic; lower tends thetic.
3. **Neume slope.** When the first two are inconclusive, rising notes are
   arsic, falling thetic.

The first compound beat of an incise is always arsic (an incise never
begins with thesis, Carroll p. 43); when every rule is inconclusive, the
shape alternates from the previous group. Two conventional overrides
precede the rules: the **salicus** — an ascending three-note group with a
middle ictus — is always arsic, and the **doubly-dotted clivis** is always
thetic, as a cadential figure (Ch. 5–6).

### Modeled and not

tonus models the compound-beat classification and the per-note rhythmic
index. It does not yet model Carroll's textual rules (word-accent → arsic,
word-final → thetic), mode-specific cadence formulas, the seven-types
incise classifier, or chironomy rendering; all are deferred.

## Sources

- Carroll, Joseph Robert. *The Technique of Gregorian Chironomy*. Toledo,
  OH: Gregorian Institute of America, 1955.
- Carroll, Joseph Robert. *An Applied Course in Gregorian Chant*. Toledo,
  OH: Gregorian Institute of America, 1956.
- Gajard, Joseph (trans. Aldhelm Dean). *The Rhythm of Plainsong According
  to the Solesmes School*. New York: J. Fischer & Bro., 1945.
- Mocquereau, André. *Le nombre musical grégorien*, 1908–1927 — the school
  whose synthesis the above codify.
- Williams, Richard. "What the heck are arsis and thesis?" Musica Sacra
  forum, 2011 — plain-English gloss only.
- Cardine, Eugène. "Semiology and the Interpretation of Gregorian Chant."
  Trans. Virginia A. Schubert; from the Festschrift for Joseph Lennards —
  the semiological position the `"restrained"` pondus style reflects.
- Desrocquettes, Jean Hébert. "Gregorian Musical Values" — the Solesmes
  school's rhythmic values, from Mocquereau's collaborator.
