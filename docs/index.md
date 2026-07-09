# tonus API

The technical center of tonus: the full public API, the conventions every method
obeys, the error contract, and the standards the code and docs are held to. The
API is **sixteen methods on the `tonus` namespace**, no sub-namespaces.

```js
import tonus from "tonus";
```

- [The methods](#the-methods) — the sixteen, by engine
- [Deep contents](#deep-contents) — every method and section, page by page
- [Theory & stance](#theory--stance)
- [Conventions](#conventions) — Latin/English, query/builder, dates, determinism
- [Error contract](#error-contract)
- [Internals](#internals) — code standards, the comment hierarchy, the bibliography

## The methods

| Method                          | Page                    | Returns                                                 |
| ------------------------------- | ----------------------- | ------------------------------------------------------- |
| `tonus.festum(query?)`          | [calendar](calendar.md) | `Feast[]` — liturgical calendar lookup                  |
| `tonus.pascha(year)`            | [calendar](calendar.md) | `Pascha` — the movable anchors of a liturgical year     |
| `tonus.cantus(query?)`          | [chant](chant.md)       | `Chant[]` — cross-corpus chant retrieval / GABC parsing |
| `tonus.corpus(code)`            | [chant](chant.md)       | `Corpus` — one book's metadata + content breakdown      |
| `tonus.proprium(query?)`        | [chant](chant.md)       | `Chant[]` — Mass propers                                |
| `tonus.ordinarium(query?)`      | [chant](chant.md)       | `OrdinaryChant[]` — Kyriale                             |
| `tonus.officium(query?)`        | [chant](chant.md)       | `Chant[]` — Divine Office hours                         |
| `tonus.matutinum(query?)`       | [chant](chant.md)       | `Matins \| null` — structured Roman Matins nocturns     |
| `tonus.psalmus(query?)`         | [chant](chant.md)       | `Chant[]` — intoned psalm verses                        |
| `tonus.temperamentum(input?)`   | [tuning](tuning.md)     | `Temperamentum` — tuning context                        |
| `tonus.notatio(chant, opts?)`   | [score](score.md)       | `Score` — GABC → musical score                          |
| `tonus.inscriptio(score, opts?)`| [score](score.md)       | `Inscriptio` — `{ svg, geometry }`, the score drawn     |
| `tonus.caelum(query?)`          | [heavens](heavens.md)   | `Cosmos \| Cosmos[]` — ephemeris                        |
| `tonus.harmonia(cosmos, opts?)` | [heavens](heavens.md)   | `Harmony` — musica universalis                          |
| `tonus.vox(persona?, over?)`    | [voice](voice.md)       | `Vox` — one synthesized singing voice                   |
| `tonus.chorus(consortium?, opts?)` | [voice](voice.md)    | `Chorus` — a seeded ensemble of voices                  |

The methods divide in two. **Query methods** (`festum`, `pascha`, `cantus`,
`corpus`, `proprium`, `ordinarium`, `officium`, `matutinum`, `psalmus`, `caelum`)
name what you want and return data. **Construction methods** (`temperamentum`,
`notatio`, `harmonia`, `vox`, `chorus`, and the pure transform `inscriptio`) build
a context object or artifact from their input. The [query/builder
contract](#query-and-builder-functions) below states how each behaves.

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

**[Calendar](calendar.md)** — the Tridentine calendar against dual-computus Easter.

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

**[Voice](voice.md)** — a synthetic singing voice as formant and spectrum data.

- [The singer — `vox`](voice.md#the-singer--vox)
- [Vowels and formants — `formantes`, `locus`, `iter`](voice.md#vowels-and-formants--formantes-locus-iter)
- [Spectrum and brightness — `spectrum`, `claritas`](voice.md#spectrum-and-brightness--spectrum-claritas)
- [Liquescents — `liquescentia`](voice.md#liquescents--liquescentia)
- [Tuning the formants — accordatio](voice.md#tuning-the-formants--accordatio)
- [Regional Latin — latinitas](voice.md#regional-latin--latinitas)
- [The ensemble — `chorus`](voice.md#the-ensemble--chorus)
- [Theory & Context](voice.md#theory--context) · [Sources](voice.md#sources)

**[Heavens](heavens.md)** — an ephemeris voiced through the planetary doctrines.

- [The heavens — `caelum`](heavens.md#the-heavens--caelum)
- [Aspects](heavens.md#aspects)
- [The voiced heavens — `harmonia`](heavens.md#the-voiced-heavens--harmonia)
- [The planetary vowels](heavens.md#the-planetary-vowels)
- [The tabula](heavens.md#the-tabula)
- [Theory & Context](heavens.md#theory--context) · [Sources](heavens.md#sources)

## Theory & stance

tonus is a music-analysis and data library. It treats the chant repertoire as
musical and historical material (modes, tuning, neumes, prosody, the analytic
imprint) not as liturgy to be performed. The liturgical scaffolding is here
because that is how this music was transmitted and indexed for a thousand years:
the calendar is a retrieval key, the feast a filter, the office an ordering. They
are the catalogue, not the point.

The music came to us through the Church because that is who kept the books, but
this is a library for the music. Half the cantors who wrote it down likely held
a working musician's skepticism toward the institution around them; many still
do. tonus takes no theological position and asks none of its users. What it
models is the sound and its structure.

## Conventions

### Latin and English

The language of a key tells you the register of its value. A Latin key
returns authentic Latin content; an English key returns a machine code or
datum. Where a concept has both registers, they form a pair:

| English            | Latin    |
| ------------------ | -------- |
| `season`           | `tempus` |
| `grade`            | `ritus`  |
| `mode`             | `modus`  |
| `name` (on `Body`) | `nomen`  |

Other fields carry only one register. Latin-only, _e.g._ `genus`, `ordinarium`,
`incipit`, `differentia`, `accentus`. English-only, _e.g._ `date`, `velocity`, `hz`.

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
No runtime network requests are made. Where variation is wanted — the scatter of
an ensemble — it is seeded, so the same seed yields byte-identical output.

## Error contract

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
  must supply 7 or 12 steps.
- `pascha` throws `RangeError` on a non-finite year.
- `vox` throws on an unknown persona; `chorus` throws on an unknown
  consortium or persona, or an empty roster.

## Internals

The behaviour above is the contract. How the code is written, and how these docs
are written, are governed by two standards documents at the repository root. This
section is their map; each links to the authoritative file.

### Code — [`CODE-STANDARDS.md`](../CODE-STANDARDS.md)

TypeScript/ESM rules, naming, and the shape of the whole library.

- **The two API layers.** Engine functions (`getX` / `buildX`, in
  `src/engines/`) are internal and never exported; the public API is the Latin
  nouns assembled in `src/index.ts`. Only `Score` and `Temperamentum` are classes
  with methods — spec-mandated, not a pattern to copy.
- **The two boundaries.** tonus computes what is derivable from *one chant or one
  moment* with received theory (the **analysis boundary**); corpus-scale census
  and editorial calibration live in the sibling `tonus-enodatio` and re-enter
  only as generated data with provenance. And `score` analyzes while `inscriptio`
  draws (the **rendering boundary**): rendering is a standalone function taking a
  `Score`, and analysis tracks live downstream.
- **The query/builder contract.** A no-match is `[]`; a malformed query throws.
  Builders throw on invalid input and carry an `errors` field for parse-level
  issues.

### Documentation — [`DOCS-STANDARDS.md`](../DOCS-STANDARDS.md)

The three-level ladder and the one voice these pages speak in.

- **Three levels, one voice.** Level 1 is the interactive docs (future); **level
  2 is these `docs/*.md` pages** (options, examples, interfaces, plus high-level
  theory); level 3 is the code, where the deepest material lives — derivations,
  provenance, calibration values, and recorded editorial decisions. Each level is
  lighter than the one below and links down into it.
- **The comment hierarchy.** In code (see CODE-STANDARDS § Comments), theory and
  provenance sit *next to the code they explain*: module-header doc-comments carry
  a file's big-picture doctrine, inline blocks sit at specific non-obvious
  decisions, and data files carry the provenance of their data beside the data.
  A comment never merely restates a signature.
- **The register.** Public methods are Latin nouns of action; Latin keys carry
  authentic Latin content, English keys carry machine codes and data; engine
  internals and output data are English.

### The bibliography — [`BIBLIOGRAPHY.md`](../BIBLIOGRAPHY.md)

The single source of truth for citations, each with a stable kebab key. Code
cites by bracketed key (`[biblio: key]`); each page keeps a short `## Sources`
line pointing to the keys it draws on. Nothing outside `BIBLIOGRAPHY.md` restates
a full reference.
