# tonus API

The technical center of tonus: the full public API, the conventions every method
obeys, the error contract, and the standards the code and docs are held to. The
API is **fourteen methods on the `tonus` namespace**, no sub-namespaces.

```js
import tonus from "tonus";
```

- [The methods](#the-methods) — by engine
- [The appendix](#the-appendix) — seven constant tables
- [Full contents](#full-contents) — every method and section
- [Conventions](#conventions) — Latin/English, dates, determinism, error contracts, bibiliography

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
| `tonus.inscriptio(score, opts?)`   | [score](score.md)       | `Inscriptio` — `{ svg, geometry }`, the score drawn     |
| `tonus.caelum(query?)`             | [heavens](heavens.md)   | `Cosmos \| Cosmos[]` — ephemeris                        |
| `tonus.harmonia(cosmos, opts?)`    | [heavens](heavens.md)   | `Harmony` — musica universalis                          |

### Query and builder functions

**Query functions** (`festum`, `pascha`, `cantus`,
`corpus`, `proprium`, `ordinarium`, `officium`, `matutinum`, `psalmus`, `caelum`) name what you want and return arrays. Empty matches
return `[]`, never `null`. Calendar results sort `day asc, dignity desc`;
chant results sort by rank then incipit.

**Builder functions** (`temperamentum`,
`notatio`, `harmonia`, and `inscriptio`) construct and return context objects, and throw
`Error` on invalid input. Only `Temperamentum` carries methods; `Score` is a
plain data record, and rendering is the standalone `inscriptio`. Voice
synthesis (`vox`, `chorus`) now lives in the private orreliquum app.

Context objects can be passed back into query functions as filters:

```js
const feasts = tonus.festum({ season: "pasc" });
tonus.proprium({ feast: feasts, office: "an" });

const t = tonus.temperamentum({ tuning: "pythagorean" });
t.nota("D4");
```

## The appendix

Seven constant tables ship as named exports beside the namespace. Return values are plain data, and the appendix carries
canonical tables only, never functions.

```js
import tonus, { SEASON_LABEL, MODES } from "tonus";
```

| Export         | What it holds                                                        |
| -------------- | -------------------------------------------------------------------- |
| `SEASON_LABEL` | season code → English display label                                  |
| `TEMPUS_NAME`  | season code → the Latin tempus name                                  |
| `GRADE_ORDER`  | the fourteen grades in precedence order (sort by `indexOf`)          |
| `GRADE_NAME`   | grade code → the Latin rank name                                     |
| `MODES`        | the eight modes' doctrine: final, tenor, ambitus, cadence figures    |
| `TONES`        | the psalm tones (Graduale Romanum appendix), with their differentiae |
| `CADENTIAE`    | the cadence families (`CadentiaFamilia`), generated corpus data      |

## Full contents

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
- [Rendering — `inscriptio`](score.md#rendering)
- [The intonation channel](score.md#the-intonation-channel)
- [The imprint](score.md#the-imprint)
- [Prosody](score.md#prosody)
- [Cadences](score.md#cadences)
- [Modulations](score.md#modulations)
- [Melodic formulae](score.md#melodic-formulae)
- [Theory & Context](score.md#theory--context) · [Sources](score.md#sources)

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

| English  | Latin    |
| -------- | -------- |
| `season` | `tempus` |
| `grade`  | `ritus`  |
| `mode`   | `modus`  |
| `name`   | `nomen`  |

Other fields carry only one register. Latin-only, _e.g._ `genus`, `ordinarium`,
`incipit`, `differentia`, `accentus`. English-only, _e.g._ `date`, `velocity`, `hz`.

Display strings live in exported maps (_e.g._ `SEASON_LABEL`),
never as label fields on objects — the maps are [the appendix](#the-appendix).

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

### Error contract

- Query functions return `[]` on no match, never throw — but an **empty or
  unknown-key query** throws (a mistyped filter is a bug, not an empty result):
  `festum({ month: 12 })` and `cantus({})` throw rather than silently resolving a
  plausible-looking answer.
- Builder functions throw `Error` with a descriptive message on invalid input.
- `notatio` throws on invalid `Chant` input.
- `inscriptio` throws on a non-`Score` argument or an unknown notation species.
- `temperamentum.tonus()` throws if `mode` is `"auto"` — mode must be set
  explicitly.
- Malformed `comma`, ratio, or Scala input throws `RangeError`; custom scales
  must supply 7 or 12 steps, beginning at `1/1` (a degree list) or ending at
  `2/1` (Scala convention).
- `pascha` throws `RangeError` on a non-finite year.
- `caelum` in range mode (`{ from, to, step }`) throws `RangeError` on a missing
  bound, `to` before `from`, a non-positive step, or a range exceeding the frame cap.
- `harmonia` throws `RangeError` on an unknown doctrina.

### The bibliography — [`BIBLIOGRAPHY.md`](../BIBLIOGRAPHY.md)

The single source of truth for citations, each with a stables key. Code
cites by bracketed key (`[biblio: key]`); each page keeps a short `## Sources`
line pointing to the keys it draws on. Nothing outside `BIBLIOGRAPHY.md` restates
a full reference.
