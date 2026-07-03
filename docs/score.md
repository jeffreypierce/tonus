# Score — `tonus.notatio`

GABC → musical score: phrases, syllables, tuned notes, Solesmes
arsis/thesis rhythm, prosody measurements, and an analytical imprint. The
rhythm model is documented in
[theory/solesmes-rhythm.md](../theory/solesmes-rhythm.md).

## `tonus.notatio(chant, opts?) -> Score`

Builds a `Score` from a single `Chant`. Interpretation is controlled by two
options: `pondus` (note-level articulation weight) and `accentus`
(phrase-level velocity shaping) — each accepts a style name or an opts
object with overrides. `rhythmicShape` and `rhythmicIndex` are always
populated by the Solesmes compound-beat classifier.

The `Score` is pure data: no methods. Analysis lives on `score.imprint`
(shared with `Harmony`) and `score.prosody` (chant-specific). A flat
iteration surface is exposed via `score.tabula`.

```js
const t = tonus.temperamentum({ tuning: "pythagorean" });

const score = tonus.notatio(chant, {
  temperamentum: t,
  pondus: "expressive",                                // style name…
  accentus: { style: "solemn", overrides: { /* … */ } }, // …or opts with overrides
});

score.phrases; // structured: Phrase[] with Syllable[] and Note[]
score.tabula;  // flat: ChantTabulaRow[] — one row per note
score.prosody; // chant measurements: counts, ranges, melisma, cadence
score.imprint; // pc/modal fingerprint (comparable with harmony.imprint)
```

**`pondus`** — articulation: note weight, duration, ornament interpretation.
Default `"balanced"`.

| Style | Description |
| --- | --- |
| `"restrained"` | Minimal ornament response, flatter dynamics — semiological approach |
| `"balanced"` | Default. Even articulation, moderate weight |
| `"expressive"` | Heightened ornament response, stronger shaping |
| `"strict"` | Full Solesmes rule fidelity, careful episema and quilisma treatment |

**`accentus`** — phrasing: velocity curves, cadence weight, tenor emphasis.
When omitted, tabula shaping uses the mode-gated default.

| Style | Description |
| --- | --- |
| `"recitative"` | Flat, declamatory; minimal curve, strong tenor pull |
| `"lyrical"` | Default. Balanced arch, moderate cadence |
| `"hymnic"` | Measured, steady; suits metrical hymns |
| `"solemn"` | Deep curve, strong cadence, elevated velocity |

```ts
interface ScoreOpts {
  temperamentum?: Temperamentum;
  pondus?: PondusInput;     // PondusStyle | PondusOpts
  accentus?: AccentusInput; // AccentusStyle | AccentusOpts
}

type PondusStyle = "restrained" | "balanced" | "expressive" | "strict";
type PondusInput = PondusStyle | PondusOpts;
interface PondusOpts {
  style?: PondusStyle;
  overrides?: Partial<ArticulationProfile>;
}

type AccentusStyle = "recitative" | "lyrical" | "hymnic" | "solemn";
type AccentusInput = AccentusStyle | AccentusOpts;
interface AccentusOpts {
  style?: AccentusStyle;
  overrides?: Partial<PhrasingProfile>;
}
```

## Score structure

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
  divisio: "," | "`" | ";" | ":" | "::";
  duration: number;
}

interface ParseError {
  message: string;
  index?: number;
}
```

## Note

The score engine's unified `Note` composes four concerns into sub-objects.
Access as `note.pitch.midi`, `note.performance.velocity`, `note.step.name`,
`note.context.lyric`.

```ts
interface Note {
  pitch: Pitch;             // tuned identity — see temperamentum.md
  step: Step;               // modal/Guidonian annotation — see temperamentum.md
  performance: Performance; // interpretation
  context: Context;         // position, lyric, ornamentation
}

// Solesmes compound-beat classification. A compound beat is the group of
// notes between one ictus and the next. Each group has a single quality
// (arsic = rising, active; thetic = resting, retractive) shared by every
// note in it. `rhythmicIndex` is the 1-based position within the group.
// Rules (Carroll, *The Technique of Gregorian Chironomy*, 1955, Ch. 4):
//   1. Incise unity — after the melodic apex, groups are thetic.
//   2. Relative ictus pitch — higher than previous ictus → arsic, lower → thetic.
//   3. Neume slope — rising notes → arsic, falling → thetic.
type ArsisThesis = "arsic" | "thetic";

interface Performance {
  velocity: number;           // 0–1 shaping factor
  duration: number;
  rhythmicShape: ArsisThesis; // shape of this note's compound beat
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

## Tabula

`score.tabula` is a flat array with one row per note — the iteration surface
for analysis, visualization, or emission. Always a property, never a method.
(`Harmony` exposes the same idea for voiced bodies; see
[heavens.md](heavens.md#tabula).)

```ts
type NoteRole = "finalis" | "tenor" | "other" | null;

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
  role: NoteRole;
  name: string | null;     // Guidonian short name
  fullName: string | null; // Guidonian compound name
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

## Imprint (shared analytical fingerprint)

Both `Score` and `Harmony` expose an `imprint: Imprint` property. Same shape,
computed from different inputs: chant phrases in the Score case (unweighted
pc counts), voiced planetary bodies in the Harmony case (presence-weighted).
Comparable between the two.

```js
score.imprint.modalAffinity[0];   // best-fitting mode for this chant
harmony.imprint.modalAffinity[0]; // best-fitting mode for this moment of sky

// modal conformance against the chant's declared mode:
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

## Prosody (chant-specific measurements)

`score.prosody` only — Harmony has no prosody. Shape-only, no modal analysis.

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
  comma: number;
  tick: number;
  semicolon: number;
  colon: number;
  doubleBar: number;
}
```
