# tonus API

The technical center of tonus: the full public API, the conventions every method
obeys, and the error contract. The API is **fourteen methods on the `tonus`
namespace**, no sub-namespaces.

**[Interactive demo →](https://jeffreypierce.github.io/tonus/)**

```js
import tonus from "tonus";
```

- [The methods](#the-methods) — by engine
- [The appendix](#the-appendix) — the canonical constant tables
- [Full contents](#full-contents) — every method and section
- [Conventions](#conventions) — Latin/English, dates, determinism, error contracts, bibliography

## The methods

| Method                           | Page                    | Returns                                                 |
| -------------------------------- | ----------------------- | ------------------------------------------------------- |
| `tonus.festum(query?)`           | [calendar](calendar.md) | `Feast[]` — liturgical calendar lookup                  |
| `tonus.pascha(year)`             | [calendar](calendar.md) | `Pascha` — the movable anchors of a liturgical year     |
| `tonus.cantus(query?)`           | [chant](chant.md)       | `Chant[]` — cross-corpus chant retrieval / GABC parsing |
| `tonus.corpus(code?)`            | [chant](chant.md)       | `Corpus` — a book's ledger; no arg → the whole shelf    |
| `tonus.proprium(query?)`         | [chant](chant.md)       | `Chant[]` — Mass propers                                |
| `tonus.ordinarium(query?)`       | [chant](chant.md)       | `OrdinaryChant[]` — Kyriale                             |
| `tonus.officium(query?)`         | [chant](chant.md)       | `Chant[]` — Divine Office hours                         |
| `tonus.psalmus(query?)`          | [chant](chant.md)       | `Chant[]` — intoned psalm verses                        |
| `tonus.temperamentum(input?)`    | [tuning](tuning.md)     | `Temperamentum` — tuning context                        |
| `tonus.notatio(chant, opts?)`    | [score](score.md)       | `Score` — GABC → musical score                          |
| `tonus.inscriptio(score, opts?)` | [score](score.md)       | `Inscriptio` — `{ svg, geometry }`, the score drawn     |
| `tonus.caelum(query?)`           | [heavens](heavens.md)   | `Cosmos \                                               |
| `tonus.harmonia(cosmos, opts?)`  | [heavens](heavens.md)   | `Harmony` — musica universalis                          |
| `tonus.census(query)`            | [census](census.md)     | `Census` — a chant against the corpus                   |

### Query and builder functions

**Query functions** (`festum`, `pascha`, `cantus`,
`corpus`, `proprium`, `ordinarium`, `officium`, `psalmus`, `caelum`) name what you want and return arrays. Empty matches
return `[]`, never `null`. Calendar results sort `day asc, dignity desc`;
chant results sort by rank then incipit.

**Builder functions** (`temperamentum`,
`notatio`, `harmonia`, and `inscriptio`) construct and return context objects, and throw
`Error` on invalid input. Only `Temperamentum` carries methods; `Score` is a
plain data record, and rendering is the standalone `inscriptio`.

`census` takes the query form but answers for exactly one chant: an id with no
block throws rather than returning `[]`.

Context objects can be passed back into query functions as filters:

```js
const feasts = tonus.festum({ season: "pasc" });
tonus.proprium({ feast: feasts, office: "an" });

const t = tonus.temperamentum({ tuning: "pythagorean" });
t.nota("D4");
```

## The appendix

The canonical constant tables ship as named exports beside the namespace.
Return values are plain data, and the appendix carries tables only, never
functions. It holds the tables a caller would otherwise transcribe: the mode
list, the hour list, the valid `by:` values.

```js
import tonus, { SEASON_LABEL, HORAE, MODES } from "tonus";
```

Names follow the register rule: a table of Latin values takes a Latin name, a
table of codes or English keeps English.

**Calendar**

| Export         | What it holds                                                   |
| -------------- | --------------------------------------------------------------- |
| `SEASON_LABEL` | season code → English display label (`adv` → "Advent")          |
| `TEMPORA`      | season code → the Latin tempus name (`adv` → "Tempus Adventus") |
| `GRADE_ORDER`  | the fourteen grades in precedence order (sort by `indexOf`)     |
| `GRADUS`       | grade code → the Latin rank name                                |

**Chant**

| Export      | What it holds                                                              |
| ----------- | -------------------------------------------------------------------------- |
| `HORAE`     | the eight canonical hours, Matins first — the order is the content         |
| `OFFICIA`   | office code → the Latin genus (`an` → "Antiphona")                         |
| `ORDINARIA` | ordinary code → the Latin name (`ky` → "Kyrie eleison")                    |
| `MODI`      | mode number → the Latin name (`"1"` → "Modus I")                           |
| `SOURCES`   | book code → its bibliographic record; the codes `cantus({ source })` takes |

**Tuning**

| Export                 | What it holds                                                                                         |
| ---------------------- | ----------------------------------------------------------------------------------------------------- |
| `MODES`                | the eight modes' doctrine: final, tenor, ambitus, and the **received** cadence figures                |
| `TONES`                | the psalm tones (Graduale Romanum appendix), with their differentiae                                  |
| `CADENTIAE`            | the **mined** cadence families (`CadentiaFamilia`) — shape, arrival, share, finality, per-mode counts |
| `CADENTIAE_POPULATION` | the denominator behind every `share`: all phrase-ends, and the same total per mode                    |

The two cadence tables answer different questions. `MODES.cadences` is what the
treatises say a mode closes on (final cadences only); `CADENTIAE` is what the
corpus was measured doing (any target, so it is the one of the two that
accounts for medial closes). See [one spine, two
annotations](score.md#one-spine-two-annotations), and
[lift](tuning.md#lift--how-mode-bound-a-close-is) for what `CADENTIAE_POPULATION`
is for.

**Heavens**

| Export    | What it holds                                                           |
| --------- | ----------------------------------------------------------------------- |
| `ZODIACA` | the twelve signs in ecliptic order — each one's names and what it means |

`ZODIACA[body.zodiac]` is the join: a body's `zodiac` index addresses its sign
directly, so a sky and its doctrine are one lookup apart. Each entry carries
`sign` and `signum` (the English code and the Latin, `Scorpio`/`Scorpius`)
beside the element and its Galenic humor, the quality, the ruling and exalted
planets, and the member of the zodiac man the sign governs.

There are no dates. When the Sun enters a sign is the ephemeris's business and
moves with precession — a table that carried one would be wrong for most of the
period this library models, and wrong differently every century.

**Census**

| Export          | What it holds                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| `CENSUS_GROUPS` | the field groups → `{ offset, count }`; the keys are the valid `by:` values **and** the `profile` keys |
| `CENSUS_ORDER`  | every censused chant id, in block order — so membership is a lookup, not a `try/catch`                 |

Use these to pool blocks without reproducing the distance rule — see [the census
contract](census.md#distance-is-cosine-per-field-group).

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
- [Modes — `modus`](tuning.md#modes--modus) · [Cadence figures](tuning.md#cadence-figures) · [The corpus catalogue](tuning.md#the-corpus-catalogue--cadentiae)
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
- [Retrieval — `cantus`](chant.md#retrieval--cantus) · [Reaching the ordinary](chant.md#reaching-the-ordinary--ordinary)
- [The repertoire as of a date — the era view](chant.md#the-repertoire-as-of-a-date--the-era-view)
- [The Mass propers — `proprium`](chant.md#the-mass-propers--proprium)
- [The ordinary — `ordinarium`](chant.md#the-ordinary--ordinarium)
- [The Office — `officium`](chant.md#the-office--officium)
- [Psalms — `psalmus`](chant.md#psalms--psalmus)
- [Theory & Context](chant.md#theory--context) · [Sources](chant.md#sources)

**[Score](score.md)** — GABC parsed into tuned, rhythmicized, drawable notes.

- [The score — `notatio`](score.md#the-score--notatio)
- [Interpretation — `pondus` and `accentus`](score.md#interpretation--pondus-and-accentus)
- [The note](score.md#the-note)
- [The tabula](score.md#the-tabula)
- [Rendering — `inscriptio`](score.md#rendering) · [theme](score.md#theme--faces-and-ink) · [The analysis tracks](score.md#the-analysis-tracks)
- [The imprint](score.md#the-imprint)
- [Prosody](score.md#prosody)
- [Cadences](score.md#cadences) · [One spine, two annotations](score.md#one-spine-two-annotations)
- [Modulations](score.md#modulations)
- [Theory & Context](score.md#theory--context) · [Sources](score.md#sources)

**[Heavens](heavens.md)** — an ephemeris voiced through the planetary doctrines.

- [The heavens — `caelum`](heavens.md#the-heavens--caelum)
- [Aspects](heavens.md#aspects)
- [The voiced heavens — `harmonia`](heavens.md#the-voiced-heavens--harmonia)
- [The planetary vowels](heavens.md#the-planetary-vowels)
- [The tabula](heavens.md#the-tabula)
- [Theory & Context](heavens.md#theory--context) · [Sources](heavens.md#sources)

**[Census](census.md)** — one chant measured against the corpus that holds it.

- [The method](census.md#the-method)
- [What a block holds](census.md#what-a-block-holds)
- [How the measurement works](census.md#how-the-measurement-works)
- [Distance is cosine per field group](census.md#distance-is-cosine-per-field-group)
- [Profile and typicality](census.md#profile-and-typicality)
- [Balance — distance and deviance](census.md#balance--distance-and-deviance)
- [Neighbors, and `by`](census.md#neighbors-and-by)
- [The era view](census.md#the-era-view)
- [What the census is not](census.md#what-the-census-is-not)

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

`tonus.festum()` and `tonus.caelum()` default to **1 June 991**, the
symbolic birthday of Guido d'Arezzo. Pass an explicit `date` for any other
day.

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
- `census` throws on an id with no block (the census covers only the chants
  tonus ships) and on an unknown query key or field group.

### The bibliography — [`BIBLIOGRAPHY.md`](https://github.com/jeffreypierce/tonus/blob/main/BIBLIOGRAPHY.md)

The single source of truth for citations, each with a stable key. Code
cites by bracketed key (`[biblio: key]`); each page keeps a short `## Sources`
line pointing to the keys it draws on. Nothing outside `BIBLIOGRAPHY.md` restates
a full reference.
