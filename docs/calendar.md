# Calendar — `tonus.festum`

The liturgical calendar of the Tridentine Roman rite (1570–1962), extracted
from [Divinum Officium](https://github.com/DivinumOfficium/divinum-officium):
642 entries across the sanctorale (fixed feasts) and temporale (movable
feasts), resolved against dual-computus Easter anchors.

## `tonus.festum(query?) -> Feast[]`

Calendar lookup. Returns all matching feasts sorted by date ascending, then
by dignity (highest first). For a date query, returns the primary feast and
all concurrent feasts on that day in dignity order. For a range query
(`from`/`to`), iterates each day and flattens. With no date or range, scans
the current liturgical year (Advent to Advent).

```js
tonus.festum();                                  // today (current UTC day)
tonus.festum({ date: new Date("2026-01-06") }); // Epiphany
tonus.festum({ from: advent1, to: epiphany });  // range
tonus.festum({ name: "Dominica I Adventus" });
tonus.festum({ season: "pasc" });               // Paschaltide feasts
tonus.festum({ dignitas: "duplex-i", marian: true });
```

## Rank: `ritus` and `dignitas`

Each feast carries two views of its rank:

- **`ritus`** — the authentic Tridentine rank string, verbatim from the
  Divinum Officium `[Rank]` line: `"Duplex majus"`, `"Semiduplex II classis"`,
  `"Feria privilegiata"`, `"Duplex I classis cum Octava privilegiata I
  ordinis"`. Taken from the default (Tridentine) rank line — the vocabulary
  continuous with medieval usage — never from the 1960-rubric variants. For
  the ~18 great feasts with an octave, `ritus` is the only field that
  preserves the octave detail (communi / simplici / privilegiata).
- **`dignitas`** — the canonical ordered grade the `ritus` reduces to. The
  19 ritus strings collapse into 14 grades whose *order* encodes precedence;
  this is what sorting, filtering, and mass selection read.

*Ritus* is what the book says; *dignitas* is where that ranks. `dignitas` is
named to avoid `gradus`, which is reserved for the Guidonian step
([`Temperamentum.gradus()`](tuning.md#step)).

### The dignity order

`DIGNITAS_ORDER` runs highest → lowest. Ordering is **classis-primary**: a
first-class day outranks any non-first-class feast regardless of the
duplex/semiduplex axis, so a plain Duplex feast never displaces a Lent Sunday.

| # | `dignitas` | reduces from `ritus` | who it is |
| --- | --- | --- | --- |
| 1 | `triduum` | Feria privilegiata Duplex I classis | Maundy Thu, Good Fri, Holy Sat |
| 2 | `duplex-i` | Duplex I classis (+ octave variants) | Christmas, Easter, Pentecost |
| 3 | `duplex-majus-i` | Duplex majus I classis | Low Sunday |
| 4 | `semiduplex-i` | Semiduplex I classis | Lent Sundays, Palm Sunday, Easter/Pentecost octave weekdays |
| 5 | `feria-privilegiata` | Feria privilegiata | Ash Wednesday, Holy Week Mon–Wed |
| 6 | `duplex-ii` | Duplex II classis (+ octave) | second-class feasts |
| 7 | `semiduplex-ii` | Semiduplex II classis | later Advent Sundays, octave days |
| 8 | `duplex-majus` | Duplex majus | |
| 9 | `duplex` | Duplex | |
| 10 | `semiduplex` | Semiduplex | ordinary Sundays, semiduplex feasts |
| 11 | `simplex` | Simplex | |
| 12 | `feria-major` | Feria major | Advent/Lent ferias, Ember days |
| 13 | `vigilia` | Vigilia | |
| 14 | `feria` | Feria | ordinary weekdays |

`dignitasOrder(d)` gives the 0-based index (0 = highest); `compareDignitas`
is a sort comparator; `ritusToDignitas(s)` performs the reduction.

**Privileged-Sunday override.** Divinum Officium's Tridentine ritus line
under-specifies four privileged Sundays as plain `"Semiduplex"`: Advent I
(historically first-class — it yields to nothing) and the three
Septuagesima-block Sundays (second-class). Their precedence lived only in
DO's numeric rank, which tonus does not use, so a small per-id override
(`PRIVILEGED_SUNDAYS`) lifts their derived `dignitas` — Advent I to
`semiduplex-i`, Septuagesima/Sexagesima/Quinquagesima to `semiduplex-ii` —
matching the Sunday classes DO itself encodes for Lent and late Advent.
`ritus` stays verbatim; without the override, St. Andrew would displace
Advent I Sunday whenever November 30 falls on it.

## Seasons (the temporale)

Season codes are one-to-one with the Divinum Officium Tempora stems, so a
date's season and the stem of any Tempora feast on it agree by construction:

| `season` | Label | Span | Stem |
| --- | --- | --- | --- |
| `adv` | Advent | Advent I Sunday → Christmas | Adv |
| `nat` | Christmastide | Christmas → 1st Sunday after Epiphany | Nat |
| `epi` | Time after Epiphany | there → Septuagesima | Epi |
| `quadp` | Septuagesima | Septuagesima Sunday → Ash Wednesday | Quadp |
| `quad` | Lent | Ash Wednesday → Easter | Quad |
| `pasc` | Paschaltide | Easter → Trinity Sunday (Pentecost octave included) | Pasc |
| `pent` | Time after Pentecost | Trinity Sunday → next Advent | Pent |

Two boundary decisions follow the data: the Pentecost octave stays **paschal**
(so the Vidi aquam sprinkle covers it), and the weeks after Epiphany run until
Septuagesima. A stem's week *number* is only a counter — overflow weeks (a 4th
Advent week after Christmas, resumed post-Pentecost Epiphany weeks) land in the
later season they actually fall in; the date-derived season is authoritative.

Season drives real liturgy in the ordinary: the **Gloria is omitted** in the
penitential seasons (`adv`, `quadp`, `quad`) — including Septuagesima — and the
**Vidi aquam** sprinkle replaces Asperges throughout `pasc`.

## Easter

`pascha(year)` uses the Gregorian (Gauss/Butcher) computus from 1583 onward and
the Julian computus with Julian→Gregorian day-number conversion before that, so
date queries reaching into the medieval period stay historically correct.

## Theory & Context

**How medieval is this calendar?** Its structure is: the temporale (Advent
through the season after Pentecost, including pre-Lenten Septuagesima), the
eight-hour office cursus, and the duplex/semiduplex/simplex dignity system are
all medieval in origin — a 13th-century cleric would recognize the shape at
once. But the data is the *Tridentine* codification (1570–1962) via Divinum
Officium: substantially continuous with late-medieval Roman usage, yet
including feasts instituted as late as the 1950s (Queenship of Mary 1954,
Immaculate Heart 1944). tonus keeps these rather than adjudicate each feast's
century; the honest description is "Tridentine Roman, continuous with medieval
practice," not "a medieval calendar."

**Why two rank fields.** The `dignitas` grade is the computable workhorse —
ordered, filterable, the key to mass selection. But collapsing to it would
discard the octave qualifiers that distinguish, say, Christmas ("Duplex I
classis cum Octava privilegiata") from an ordinary Duplex I classis. Only 18 of
642 feasts carry such a compound `ritus`, but they are the great feasts, and
the octave governs the following week — so `ritus` earns its place as the
faithful record, `dignitas` as the usable index.

**Rank ordering is classis-primary.** In the occurrence rules a first-class day
outranks a non-first-class feast irrespective of the duplex/semiduplex axis —
which is why a plain Duplex feast yields to a Lent Sunday (Semiduplex I
classis). The alternative (solemnity-primary, duplex over semiduplex) would
misorder the penitential Sundays.

## Types

```ts
type Season = "adv" | "nat" | "epi" | "quadp" | "quad" | "pasc" | "pent";

type Dignitas =
  | "triduum" | "duplex-i" | "duplex-majus-i" | "semiduplex-i"
  | "feria-privilegiata" | "duplex-ii" | "semiduplex-ii" | "duplex-majus"
  | "duplex" | "semiduplex" | "simplex" | "feria-major" | "vigilia" | "feria";

interface FeastQuery {
  date?: Date;
  from?: Date;
  to?: Date;
  name?: string;       // partial match, case-insensitive
  season?: Season;
  dignitas?: Dignitas;
  marian?: boolean;
  apostolic?: boolean;
}

interface Feast {
  id: string;         // "MM-DD" (sancti) or DO stem, e.g. "Adv1-0" (tempora)
  name: string;       // "In Nativitate Domini"
  ritus: string;      // authentic Tridentine rank, incl. octave detail
  dignitas: Dignitas; // canonical ordered grade; precedence via DIGNITAS_ORDER
  season: Season;
  seasonLabel: string;
  seasonStart: Date;
  seasonEnd: Date;
  date: Date;
  weekday: number;    // 0 = Sunday (UTC)
  masses: number[];   // compatible kyriale mass numbers, most-fitting first
  marian: boolean;
  apostolic: boolean;
}
```

## Sources

- **Divinum Officium** — the 1570–1962 Roman Breviary and Missal in
  machine-readable form. <https://github.com/DivinumOfficium/divinum-officium>.
  Source of the calendar entries, feast names, ranks (`ritus`), and the
  Tempora stem structure the seasons follow.
- Easter computus: the Gregorian algorithm (Gauss/Butcher) and, before 1583,
  the classical 19-year Julian cycle with Julian→Gregorian day-number
  conversion.
