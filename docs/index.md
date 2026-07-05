# tonus API

The behavioral source of truth for the public API: eleven methods on
the `tonus` namespace, no sub-namespaces.

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
No runtime network requests are made.

## Error contract

- Query functions return `[]` on no match, never throw.
- Builder functions throw `Error` with a descriptive message on invalid input.
- `notatio` throws on invalid `Chant` input.
- `temperamentum.tonus()` throws if `mode` is `"auto"` — mode must be set
  explicitly.
- Malformed `comma`, ratio, or Scala input throws `RangeError`; custom scales
  must supply 7 or 12 steps.
- `pascha` throws `RangeError` on a non-finite year.
