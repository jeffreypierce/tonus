# tonus API

The behavioral source of truth for the public API. All functions live on the
`tonus` namespace — ten Latin verbs, no sub-namespaces.

```js
import tonus from "tonus";
```

| Method | Page | Returns |
| --- | --- | --- |
| `tonus.festum(query?)` | [calendar](calendar.md) | `Feast[]` — liturgical calendar lookup |
| `tonus.cantus(query?)` | [chant](chant.md) | `Chant[]` — cross-corpus chant retrieval / GABC parsing |
| `tonus.proprium(query?)` | [chant](chant.md) | `Chant[]` — Mass propers |
| `tonus.ordinarium(query?)` | [chant](chant.md) | `OrdinaryChant[]` — Kyriale |
| `tonus.officium(query?)` | [chant](chant.md) | `Chant[]` — Divine Office hours |
| `tonus.psalmus(query?)` | [chant](chant.md) | `Chant[]` — intoned psalm verses |
| `tonus.temperamentum(input?)` | [tuning](tuning.md) | `Temperamentum` — tuning context |
| `tonus.notatio(chant, opts?)` | [score](score.md) | `Score` — GABC → musical score |
| `tonus.caelum(query?)` | [heavens](heavens.md) | `Cosmos \| Cosmos[]` — ephemeris |
| `tonus.harmonia(cosmos, opts?)` | [heavens](heavens.md) | `Harmony` — musica universalis |

## Conventions

**Query functions** are nouns — they name what you want and return arrays.
Empty matches return `[]`, never `null`. Calendar results sort
`day asc, dignity desc`; chant results sort by rank then incipit.

**Builder functions** are verbs — they construct and return context objects.
They throw `Error` on invalid input.

**Context objects** — `Feast[]` or `Temperamentum` — are passed into query
functions as optional filters via the query object:

```js
const feasts = tonus.festum({ season: "pasc" });
tonus.proprium({ feast: feasts, office: "an" });

const t = tonus.temperamentum({ tuning: "pythagorean" });
t.nota("D4");
```

**Dates are UTC-canonical.** Build query dates from ISO strings
(`new Date("2026-01-06")`) or `Date.UTC`, and read results with UTC getters
or `toISOString()`. Local-time constructions like `new Date(2026, 0, 6)`
resolve to different days depending on the machine's timezone. `tonus.festum()`
and `tonus.caelum()` with no date resolve "now" against the current UTC day.

## Error contract

- Query functions return `[]` on no match, never throw.
- Builder functions throw `Error` with a descriptive message on invalid input.
- `notatio` throws on invalid `Chant` input.
- `temperamentum.tonus()` throws if `mode` is `"auto"` — mode must be set
  explicitly.
- Malformed `comma`, ratio, or Scala input throws `RangeError`; custom scales
  must supply 7 or 12 steps.

## Determinism contract

- All pure transforms are deterministic for identical inputs and options.
- No runtime network requests are made.

## v1.1 deferred

- **`tonus.midi(source)` and `tonus.musicxml(source)`** — top-level emitters
  consuming a Score (or tabula directly). v1 archives the implementations at
  `src/engines/score/emitters/_archive/`; they're exercised by tests but not
  exported.
- **Multi-chant `notatio([...chants])`** and multi-score `Imprint`
  aggregation — v1 is single-score only.
- **`coniunctio(imprintA, imprintB)`** — overlap/comparison between two
  Imprints (Score vs Harmony, or Harmony at two times).
- **Solesmes rhythmic refinements** — textual rules (word-accent → arsic,
  word-final → thetic) and cadence-formula overrides.
- **Carroll's Seven Rhythmic Types** — derived classifier reading the
  `rhythmicShape` sequence across an incise.
- **Chironomy diagram emitter** — Carroll's reclining figure-8 arcs, rendered
  from per-note `rhythmicShape` + `rhythmicIndex` data.
- **Fludd and Kepler doctrinae** (heliocentric frames, monochord
  string-length data).
- **`color` harmonia option** (voicing profiles: natural, ficta, speculativa).
- **`cursus` harmonia option** (time-domain texture control).
- **Hildegard corpus** — returns when the author's critical edition
  (hildegabc) is complete.
