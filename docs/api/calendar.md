# Calendar — `tonus.festum`

The liturgical calendar of the Tridentine Roman rite (1570–1962), extracted
from [Divinum Officium](https://github.com/DivinumOfficium/divinum-officium):
642 entries across the sanctorale (fixed feasts) and temporale (movable
feasts), resolved against dual-computus Easter anchors. See the
[liturgical review](../REVIEW-liturgical.md) for how this relates to
medieval usage.

## `tonus.festum(query?) -> Feast[]`

Calendar lookup. Returns all matching feasts sorted `day asc, rank desc`.
For a date query, returns the primary feast and all concurrent feasts on that
day in rank order. For a range query (`from`/`to`), iterates each day and
flattens. With no date or range, scans the current liturgical year (Advent
to Advent).

```js
tonus.festum();                                  // today (current UTC day)
tonus.festum({ date: new Date("2026-01-06") }); // Epiphany
tonus.festum({ from: advent1, to: epiphany });  // range
tonus.festum({ name: "Dominica I Adventus" });
tonus.festum({ season: "ea" });
tonus.festum({ rank: 4, marian: true });
```

## Ranks: `rank`, `rankLabel`, and `ritus`

Each feast carries two rank expressions:

- **`rank`** — a simplified `1` (highest) … `4` (lowest) scale used for
  filtering and kyriale mass selection, labelled with period vocabulary in
  `rankLabel` (`"Duplex I classis"` … `"Simplex"`).
- **`ritus`** — the authentic Tridentine rank string from the Divinum
  Officium `[Rank]` line: `"Duplex majus"`, `"Semiduplex II classis"`,
  `"Feria privilegiata"`, `"Duplex I classis cum Octava privilegiata I
  ordinis"`, and so on. Taken from the default (Tridentine) rank line — the
  vocabulary continuous with medieval usage — never from the 1960-rubric
  variants.

*Ritus* is the rubrics' own term for feast rank ("festa ritus duplicis");
`gradus` is reserved for the Guidonian step
([`Temperamentum.gradus()`](temperamentum.md#step)).

## Easter

`pascha(year)` uses the Gregorian (Gauss/Butcher) computus from 1583 onward
and the Julian computus with Julian→Gregorian day-number conversion before
that, so date queries reaching into the medieval period stay historically
correct.

## Types

```ts
type Season = "ad" | "ct" | "lt" | "ea" | "ap" | "ot" | "sg";
// Advent, Christmastide, Lent, Eastertide, Time after Pentecost,
// Time after Epiphany, Septuagesima

type Rank = 0 | 1 | 2 | 3 | 4;
// 0 Triduum Sacrum · 1 Duplex I classis · 2 Duplex II classis
// 3 Semiduplex · 4 Simplex

interface FeastQuery {
  date?: Date;
  from?: Date;
  to?: Date;
  name?: string;      // partial match, case-insensitive
  season?: Season;
  rank?: Rank;
  marian?: boolean;
  apostolic?: boolean;
}

interface Feast {
  id: string;         // "MM-DD" (sancti) or DO stem, e.g. "Adv1-0" (tempora)
  name: string;       // "In Nativitate Domini"
  rank: Rank;
  rankLabel: string;  // period label for the simplified rank
  ritus: string;      // authentic Tridentine rank from Divinum Officium
  season: Season;
  seasonLabel: string;
  seasonStart: Date;
  seasonEnd: Date;
  date: Date;
  weekday: number;    // 0 = Sunday (UTC)
  masses: number[];   // ranked list of compatible kyriale mass numbers
  marian: boolean;
  apostolic: boolean;
}
```
