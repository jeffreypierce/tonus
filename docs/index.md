# tonus API

The behavioral source of truth for the public API: eleven methods on the
`tonus` namespace, no sub-namespaces.

```js
import tonus from "tonus";
```

| Method                          | Page                    | Returns                                                 |
| ------------------------------- | ----------------------- | ------------------------------------------------------- |
| `tonus.festum(query?)`          | [calendar](calendar.md) | `Feast[]` — liturgical calendar lookup                  |
| `tonus.pascha(year)`            | [calendar](calendar.md) | `Pascha` — the movable anchors of a liturgical year     |
| `tonus.cantus(query?)`          | [chant](chant.md)       | `Chant[]` — cross-corpus chant retrieval / GABC parsing |
| `tonus.proprium(query?)`        | [chant](chant.md)       | `Chant[]` — Mass propers                                |
| `tonus.ordinarium(query?)`      | [chant](chant.md)       | `OrdinaryChant[]` — Kyriale                             |
| `tonus.officium(query?)`        | [chant](chant.md)       | `Chant[]` — Divine Office hours                         |
| `tonus.psalmus(query?)`         | [chant](chant.md)       | `Chant[]` — intoned psalm verses                        |
| `tonus.temperamentum(input?)`   | [tuning](tuning.md)     | `Temperamentum` — tuning context                        |
| `tonus.notatio(chant, opts?)`   | [score](score.md)       | `Score` — GABC → musical score                          |
| `tonus.caelum(query?)`          | [heavens](heavens.md)   | `Cosmos \| Cosmos[]` — ephemeris                        |
| `tonus.harmonia(cosmos, opts?)` | [heavens](heavens.md)   | `Harmony` — musica universalis                          |

## Conventions

**Latin and English.** The language of a key tells you the register of its
value. A Latin field returns authentic Latin content: `nomen`
("In Nativitate Domini"), `ritus` ("Duplex majus"), `tempus`
("Tempus Adventus"), `genus` ("Antiphona"), `modus` ("Modus I"),
`ordinarium` ("Kyrie eleison"), `maneria` ("Protus"), `auctor`, `incipit`,
`differentia`, `tabula`, `pondus`, `accentus`, `hora`. An English field
returns a machine code or datum: `season: "adv"`, `grade: "duplex-i"`,
`mode: "1"`, `office: "an"`, `date`, `masses`, `velocity`, `midi`, `hz`.
Where both registers serve one concept they form a pair, as `season` with
`tempus`, `grade` with `ritus`, `mode` with `modus`, and `name` with
`nomen` on `Body`. Display strings live in exported maps (`SEASON_LABELS`,
`GRADE_NAMES`), never as label fields on objects. The astronomy layer is
modern English by design: an accurate sky, voiced through period doctrine.
Do not Latinize the machine register.

**Query functions** name what you want and return arrays. Empty matches
return `[]`, never `null`. Calendar results sort `day asc, dignity desc`;
chant results sort by rank then incipit.

**Builder functions** construct and return context objects. They throw
`Error` on invalid input.

**Context objects** are passed into query functions as filters via the
query object:

```js
const feasts = tonus.festum({ season: "pasc" });
tonus.proprium({ feast: feasts, office: "an" });

const t = tonus.temperamentum({ tuning: "pythagorean" });
t.nota("D4");
```

**Dates are UTC-canonical.** Build query dates from ISO strings
(`new Date("2026-01-06")`) or `Date.UTC`, and read results with UTC
getters or `toISOString()`. Local-time constructions like
`new Date(2026, 0, 6)` resolve to different days depending on the
machine's timezone. `tonus.festum()` and `tonus.caelum()` called with no
date do **not** resolve the modern day: tonus lives in the Middle Ages, so
they default to an emblematic medieval epoch — the symbolic birthday of
Guido d'Arezzo, **1 June 991** (his birth date is unrecorded; this is an
editorial anchor). Pass an explicit `date` for any other day.

**Determinism contract** All pure transforms are deterministic for identical inputs and options,
and no runtime network requests are made.

## Error contract

- Query functions return `[]` on no match, never throw.
- Builder functions throw `Error` with a descriptive message on invalid input.
- `notatio` throws on invalid `Chant` input.
- `temperamentum.tonus()` throws if `mode` is `"auto"` — mode must be set
  explicitly.
- Malformed `comma`, ratio, or Scala input throws `RangeError`; custom scales
  must supply 7 or 12 steps.
- `pascha` throws `RangeError` on a non-finite year.
