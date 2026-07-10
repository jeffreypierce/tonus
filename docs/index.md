# tonus API

The full public API, the conventions every method
obeys, the error contract, and the code standards. The API is **sixteen methods
on the `tonus` namespace**, no sub-namespaces.

```js
import tonus from "tonus";
```

- [The methods](#the-methods) — by engine
- [Named exports](#named-exports) — reference data and helpers beside the namespace
- [Deep contents](#deep-contents) — every method and section, page by page
- [Conventions](#conventions) — Latin/English, query/builder, dates, determinism
- [Error contract](#error-contract)
- [Code standards](#code-standards)

## The methods

| Method                             | Page                    | Returns                                                 |
| ---------------------------------- | ----------------------- | ------------------------------------------------------- |
| `tonus.festum(query?)`             | [calendar](calendar.md) | `Feast[]` — liturgical calendar lookup                  |
| `tonus.pascha(year)`               | [calendar](calendar.md) | `Pascha` — the movable anchors of a liturgical year     |
| `tonus.cantus(query?)`             | [chant](chant.md)       | `Chant[]` — cross-corpus chant retrieval / GABC parsing |
| `tonus.corpus(code)`               | [chant](chant.md)       | `Corpus` — one book's metadata + content breakdown      |
| `tonus.proprium(query?)`           | [chant](chant.md)       | `Chant[]` — Mass propers                                |
| `tonus.ordinarium(query?)`         | [chant](chant.md)       | `OrdinaryChant[]` — Kyriale                             |
| `tonus.officium(query?)`           | [chant](chant.md)       | `Chant[]` — Divine Office hours                         |
| `tonus.matutinum(query?)`          | [chant](chant.md)       | `Matins \| null` — structured Roman Matins nocturns     |
| `tonus.psalmus(query?)`            | [chant](chant.md)       | `Chant[]` — intoned psalm verses                        |
| `tonus.temperamentum(input?)`      | [tuning](tuning.md)     | `Temperamentum` — tuning context                        |
| `tonus.notatio(chant, opts?)`      | [score](score.md)       | `Score` — GABC → musical score                          |
| `tonus.inscriptio(score, opts?)`   | [score](score.md)       | `Inscriptio` — the rendered score                       |
| `tonus.caelum(query?)`             | [heavens](heavens.md)   | `Cosmos \| Cosmos[]` — ephemeris                        |
| `tonus.harmonia(cosmos, opts?)`    | [heavens](heavens.md)   | `Harmony` — musica universalis                          |
| `tonus.vox(persona?, over?)`       | [voice](voice.md)       | `Vox` — one singing voice, as data                      |
| `tonus.chorus(consortium?, opts?)` | [voice](voice.md)       | `Chorus` — a seeded ensemble of voices                  |

The methods divide in two. **Query methods** (`festum`, `pascha`, `cantus`,
`corpus`, `proprium`, `ordinarium`, `officium`, `matutinum`, `psalmus`, `caelum`)
name what you want and return data. **Construction methods** (`temperamentum`,
`notatio`, `harmonia`, `vox`, `chorus`, and the pure transform `inscriptio`) build
a context object or artifact from their input. The [query/builder
contract](#query-and-builder-functions) below states how each behaves.

## Named exports

Reference data and helpers ship as named exports beside the namespace, for
code that builds on tonus rather than querying it. A downstream generator
imports everything from `"tonus"`; nothing requires a deep import.

```js
import tonus, { TONES, midiToGabc, syllabifyWord } from "tonus";
```

| Export | What it is |
| --- | --- |
| `SEASON_LABELS`, `TEMPUS_NAMES` | season code → display string (English label, Latin tempus) |
| `GRADE_ORDER`, `GRADE_NAMES` | the fourteen grades in precedence order, and their display names |
| `gradeOrder(grade)`, `compareGrade(a, b)`, `ritusToGrade(ritus)` | precedence index, sort comparator, Latin rank → grade code |
| `MODES` | `Map<number, ModeData>` — the eight modes' doctrine: final, tenor, ambitus, cadence figures |
| `TONES`, `getTone(mode)`, `getDifferentia(tone, code?)` | the psalm tones (Graduale Romanum appendix) with their differentiae |
| `midiToGabc(midi, clef?)`, `gabcToMidi(letter, clef?)` | pitch arithmetic between MIDI numbers and GABC letters under a clef |
| `syllabifyWord(word)`, `syllabifyPhrase(phrase)`, `selectVowel(text)` | Latin syllabification, and the sung vowel of a syllable with its accent |

The types `PsalmTone` and `Differentia` ride along with `TONES`.

## Deep contents

Every method and every section, page by page, in dependency order. Pages later in
the list resolve their pitches through the ones before.

**[Tuning](tuning.md)** — the medieval pitch system; depends on nothing else.

- [The context — `temperamentum`](tuning.md#the-context--temperamentum)
- [Pitch input](tuning.md#pitch-input)
- [Pitches — `nota`](tuning.md#pitches--nota)
- [Steps — `gradus`](tuning.md#steps--gradus)
- [Intervals — `intervallum`](tuning.md#intervals--intervallum)
- [Neumes — `neuma`](tuning.md#neumes--neuma)
- [Ratios — `ratio`](tuning.md#ratios--ratio)
- [The gamut — `gamut`](tuning.md#the-gamut--gamut)
- [Modes — `modus`](tuning.md#modes--modus) · [Cadence figures](tuning.md#cadence-figures)
- [Psalm tones — `tonus`](tuning.md#psalm-tones--tonus)
- [Theory & Context](tuning.md#theory--context) · [Sources](tuning.md#sources)

**[Calendar](calendar.md)** — the Tridentine calendar against Julian/Gregorian-computus Easter.

- [The day's feasts — `festum`](calendar.md#the-days-feasts--festum)
- [Rank — `ritus` and `grade`](calendar.md#rank--ritus-and-grade)
- [Seasons — the temporale](calendar.md#seasons--the-temporale)
- [The year's anchors — `pascha`](calendar.md#the-years-anchors--pascha)
- [Theory & Context](calendar.md#theory--context) · [Sources](calendar.md#sources)

**[Chant](chant.md)** — the Solesmes books in GABC.

- [The corpora](chant.md#the-corpora)
- [The books — `corpus`](chant.md#the-books--corpus)
- [Retrieval — `cantus`](chant.md#retrieval--cantus)
- [The Mass propers — `proprium`](chant.md#the-mass-propers--proprium)
- [The ordinary — `ordinarium`](chant.md#the-ordinary--ordinarium)
- [The Office — `officium`](chant.md#the-office--officium)
- [Matins nocturns — `matutinum`](chant.md#matins-nocturns--matutinum)
- [Psalms — `psalmus`](chant.md#psalms--psalmus)
- [Theory & Context](chant.md#theory--context) · [Sources](chant.md#sources)

**[Score](score.md)** — GABC parsed into tuned, rhythmicized, drawable notes.

- [The score — `notatio`](score.md#the-score--notatio)
- [Interpretation — `pondus` and `accentus`](score.md#interpretation--pondus-and-accentus)
- [The note](score.md#the-note)
- [The tabula](score.md#the-tabula)
- [Rendering](score.md#rendering) · [inscriptio — the standalone renderer](score.md#inscriptio--the-standalone-renderer) · [The intonation channel](score.md#the-intonation-channel)
- [The imprint](score.md#the-imprint)
- [Prosody](score.md#prosody)
- [Cadences](score.md#cadences)
- [Modulations](score.md#modulations)
- [Melodic formulae](score.md#melodic-formulae)
- [Theory & Context](score.md#theory--context) · [Sources](score.md#sources)

**[Voice](voice.md)** — a singing voice modelled as formant and spectrum data.

- [The singer — `vox`](voice.md#the-singer--vox)
- [Vowels and formants — `formantes`, `iter`](voice.md#vowels-and-formants--formantes-iter)
- [Spectrum and brightness — `spectrum`, `claritas`](voice.md#spectrum-and-brightness--spectrum-claritas)
- [Liquescents — `liquescentia`](voice.md#liquescents--liquescentia)
- [The ensemble — `chorus`](voice.md#the-ensemble--chorus)
- [Theory & Context](voice.md#theory--context) · [Sources](voice.md#sources)

**[Heavens](heavens.md)** — an ephemeris voiced through the planetary doctrines.

- [The heavens — `caelum`](heavens.md#the-heavens--caelum)
- [Aspects](heavens.md#aspects)
- [The voiced heavens — `harmonia`](heavens.md#the-voiced-heavens--harmonia)
- [The planetary vowels](heavens.md#the-planetary-vowels)
- [The tabula](heavens.md#the-tabula)
- [Theory & Context](heavens.md#theory--context) · [Sources](heavens.md#sources)

## Conventions

### Latin and English

The language of a key tells you the register of its value. A Latin key
returns authentic Latin content; an English key returns a machine code or
datum. Where a concept has both registers, they form a pair:

| English            | Latin        |
| ------------------ | ------------ |
| `season`           | `tempus`     |
| `grade`            | `ritus`      |
| `mode`             | `modus`      |
| `office`           | `genus`      |
| `ordinary`         | `ordinarium` |
| `name` (on `Body`, `Step`, tabula rows) | `nomen` |

Other fields carry only one register. Latin-only, _e.g._ `incipit`,
`differentia`, `intonatio`, `hora`. English-only, _e.g._ `date`, `velocity`,
`hz`.

The rule binds **output carriers**. Option and input keys name their concept —
often in Latin (`accentus`, `pondus`, `doctrina`, `hora`) — while their
*values* are machine codes (`accentus: "lyrical"`, `doctrina: "boethius"`):
an option is an address, not a carrier. One deliberate collision to know:
`intonatio` on a `PsalmusQuery` is a boolean toggle (include the intonation
on the first verse), while `intonatio` on a `Tonus` carries the formula
itself.

Display strings live in exported maps (_e.g._ `SEASON_LABELS`),
never as label fields on objects.

### Query and builder functions

**Query functions** name what you want and return arrays. Empty matches
return `[]`, never `null`. Calendar results sort `day asc, dignity desc`;
chant results sort by rank then incipit.

**Builder functions** construct and return context objects, and throw
`Error` on invalid input.

Context objects can be passed back into query functions as filters:

```js
const feasts = tonus.festum({ season: "pasc" });
tonus.proprium({ feast: feasts, office: "an" });

const t = tonus.temperamentum({ tuning: "pythagorean" });
t.nota("D4");
```

### Dates

Dates are UTC-canonical. Local-time constructions like
`new Date(2026, 0, 6)` resolve to different days depending on the
machine's timezone. Prefer `new Date("2026-01-06")` instead.

`tonus.festum()` and `tonus.caelum()` default to an emblematic
medieval epoch, **1 June 991**, the symbolic birthday of Guido d'Arezzo. Pass
an explicit `date` for any other day.

### Determinism

All pure transforms are deterministic for identical inputs and options.
No runtime network requests are made. Where variation is wanted (the scatter of
an ensemble) it is seeded, so the same seed yields byte-identical output.

## Error contract

- Query functions return `[]` on no match, never throw — but an **empty or
  unknown-key query** throws (a mistyped filter is a bug, not an empty result):
  `festum({ month: 12 })`, `cantus({})`, and `proprium({ bogus: 1 })` throw
  rather than silently resolving a plausible-looking answer. A `date` that
  is not a `Date`, or a `feast` that is not a `Feast`, throws the same way.
- Builder functions throw `Error` with a descriptive message on invalid input.
- `notatio` throws on anything that is not a `Chant` with a `gabc` string.
- `inscriptio` throws on a non-`Score` argument or an unknown notation species.
- `temperamentum.tonus()` throws if `mode` is `"auto"` — mode must be set
  explicitly.
- Malformed `comma`, ratio, or Scala input throws `RangeError`; custom scales
  must supply 7 or 12 steps.
- `pascha` throws `RangeError` on a non-finite year.
- `caelum` in range mode (`{ from, to, step }`) throws `RangeError` on a missing
  bound, `to` before `from`, a non-positive step, or a range exceeding the frame cap.
- `harmonia` throws `RangeError` on an unknown doctrina.
- `vox` throws on an unknown persona and on sliders outside their physical
  range (a `tract` of 0 is not a voice); a bare `chorus()` sings — the schola
  is the default — but an unknown consortium or persona throws.

## Code standards

How the library is built — the shape a contributor needs. The full rules are the
agent's working reference.

- **The two API layers.** Engine functions (`getX` / `buildX`, in `src/engines/`)
  are internal and never exported; the public API is the Latin nouns assembled in
  `src/index.ts`. Only `Score` and `Temperamentum` are classes with methods,
  spec-mandated rather than a pattern to copy.
- **The two boundaries.** tonus computes what is derivable from one chant or one
  moment with received theory (the analysis boundary); corpus-scale census and
  editorial calibration live in the sibling `tonus-enodatio` and re-enter only as
  generated data with provenance. And `score` analyzes while `inscriptio` draws
  (the rendering boundary): rendering is a standalone function taking a `Score`,
  and analysis tracks live downstream.
- **The query/builder contract.** A no-match is `[]`; a malformed query throws.
  Builders throw on invalid input and carry an `errors` field for parse-level
  issues.
- **Naming and register.** Public methods are Latin nouns; Latin keys carry
  authentic Latin content, English keys carry machine codes and data; engine
  internals and outputs are English. Types are PascalCase, constant maps
  SCREAMING_SNAKE, module caches `_camelCase`.
- **Data patterns.** Large corpora are typed `const` arrays; indices and caches
  build lazily on first access, never at load. Generated data lives in `src/data/`
  and is never hand-edited; hand-built editorial tables live beside the engine
  that owns them.
- **Comments carry the reasoning.** Theory, provenance, and editorial decisions
  sit in the code next to what they explain: module headers for a file's doctrine,
  inline blocks at specific non-obvious choices. A comment never restates a
  signature.
- **Tests.** `node:test` + `node:assert/strict`, one file per public method,
  importing from `dist/` not `src/`. Green tests and clean `tsc` at every commit.
