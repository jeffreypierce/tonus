# Calendar

`tonus.festum` resolves a date to its place in the liturgical year. It
returns the feasts that fall on the day, ordered by precedence, each
carrying its rank in the rubrics' own vocabulary, its season, and the
kyriale masses appropriate to it. The calendar is the Tridentine
Roman rite (1570–1962), extracted from
[Divinum Officium](https://github.com/DivinumOfficium/divinum-officium):
650 entries across the sanctorale (fixed feasts) and the temporale
(movable feasts), resolved against Easter computed by the Gregorian computus
from 1583 and the Julian computus before it.

- [Calendar](#calendar)
  - [The day's feasts — `festum`](#the-days-feasts--festum)
    - [The day as of a year — `before`](#the-day-as-of-a-year--before)
  - [Rank — `ritus` and `grade`](#rank--ritus-and-grade)
  - [Seasons — the temporale](#seasons--the-temporale)
  - [The year's anchors — `pascha`](#the-years-anchors--pascha)
  - [Theory \& Context](#theory--context)
    - [The calendar's era](#the-calendars-era)

## The day's feasts — `festum`

`festum(query?)` returns `Feast[]`. A date query returns every entry that
falls on the day: the primary feast first, concurrent feasts after it, in
order of dignity. A range query (`from`/`to`) walks each day and flattens
the results. A query with filters but no date scans the default liturgical
year, Advent to Advent. With no argument at all, the day resolved is not
the modern date but tonus's medieval epoch — **1 June 991**, the symbolic
birthday of Guido d'Arezzo (see [the conventions note](index.md#conventions)).
Empty matches return `[]`; an invalid range throws.

```js
tonus.festum({ date: new Date("2026-12-25") });
```

```js
[
  {
    id: "12-25",
    nomen: "In Nativitate Domini",
    ritus: "Duplex I classis",
    grade: "duplex-i",
    season: "nat",
    tempus: "Tempus Nativitatis",
    seasonStart: "2026-12-25",
    seasonEnd: "2027-01-10",
    date: "2026-12-25",
    weekday: 5,
    masses: [2, 3],
    marian: false,
    apostolic: false,
  },
  {
    id: "Adv4-5",
    nomen: "Feria VI infra Hebdomadam IV Adventus",
    ritus: "Feria major",
    grade: "feria-major",
    season: "nat",
    tempus: "Tempus Nativitatis",
    seasonStart: "2026-12-25",
    seasonEnd: "2027-01-10",
    date: "2026-12-25",
    weekday: 5,
    masses: [16],
    marian: false,
    apostolic: false,
  },
];
```

The privileged feast leads; the concurrent Advent feria follows, carrying only
the ferial rubric's mass (`masses: [16]`).

Precedence decides what comes first when feasts collide. On November 30,
2025, St. Andrew falls on the first Sunday of Advent; the privileged
Sunday wins the day and the Apostle follows it:

```js
tonus.festum({ date: new Date("2025-11-30") });
// Dominica I Adventus  [semiduplex-i]
// S. Andreæ Apostoli   [duplex-ii]
```

The other query forms:

```js
tonus.festum({ from: advent1, to: epiphany }); // range, day by day
tonus.festum({ nomen: "Dominica I Adventus" }); // partial match, case-insensitive
tonus.festum({ season: "pasc" }); // liturgical-year scan, filtered
tonus.festum({ grade: "duplex-i", marian: true });
```

### The day as of a year — `before`

`before` resolves the day AS OF a year: feasts instituted later step aside,
and whatever ranked behind them — usually the temporale or the feria — wins
instead. The calendar data is untouched; this is a view over it, from the
institution dates in `cal/data/eras.ts`. A day whose every candidate is later
than `before` returns `[]`, which is the honest answer: that day had no
feast yet.

```js
tonus.festum({ date: new Date("2026-07-01"), before: 1100 });
// the feria — the Precious Blood was not instituted until 1849
```

The feast returned **carries the view** (`feast.before`), and every chant
verb reads it back: `proprium`, `ordinarium`, and `officium`
serve only chants attested by the same year, without being told the year
twice. One `before` at the calendar door views the whole day. The chant side
— what "attested" means, and what a slot the view excludes does — is in
[chant.md](chant.md#the-repertoire-as-of-a-date--the-era-view).

```ts
interface FeastQuery {
  date?: Date;
  from?: Date;
  to?: Date;
  nomen?: string; // partial match, case-insensitive
  season?: Season;
  grade?: Grade;
  marian?: boolean;
  apostolic?: boolean;
  before?: number; // the era view: the day as of this year
}

interface Feast {
  id: string; // "MM-DD" (sancti) or DO stem, e.g. "Adv1-0" (tempora)
  nomen: string; // Latin feast name, "In Nativitate Domini"
  ritus: string; // authentic Tridentine rank, incl. octave detail
  grade: Grade; // canonical grade code; precedence via GRADE_ORDER
  season: Season; // machine code (DO Tempora stem)
  tempus: string; // Latin season name, "Tempus Adventus"
  seasonStart: Date;
  seasonEnd: Date;
  date: Date;
  weekday: number; // 0 = Sunday (UTC)
  masses: number[]; // the masses the day's Kyriale rubric appoints
  marian: boolean;
  apostolic: boolean;
  before?: number; // the era view this feast was resolved under, if any
}
```

The `masses` list is derived from the Kyriale's own printed rubric — one
category per mass, by RANK: "In Paschal Time", "For feasts of the I class",
"For Sundays throughout the Year", "For ferias". A day resolves to exactly
one rubric (a BVM feast is "of the Blessed Virgin" even in Paschaltide),
and the masses carrying that rubric are the masses it may sing, in the
book's own numbering — where a rubric names several (II class 1–5), that
numbering is the book's invitation to choose, and `ordinarium` rotates
among them by year. The book's per-mass nicknames (_Orbis factor_ for
Sundays, and so on) record CUSTOMARY use, which disagrees with the rubric
for 9 of the 18 — they are kept as documentation, never as a selector. The
encoding is `src/engines/chant/data/masses.ts`, one commented entry per
mass, `heading` carrying the printed rubric verbatim.

## Rank — `ritus` and `grade`

`ritus` is the rank string verbatim
from the Divinum Officium `[Rank]` line (`"Duplex majus"`, `"Semiduplex
II classis"`, `"Duplex I classis cum Octava privilegiata I ordinis"`).
It preserves the
octave detail, if present. `grade` is the canonical code the ritus reduces to for
sorting, filtering, and mass selection.

The order is classis-primary. A first-class day outranks any
non-first-class feast regardless of the duplex/semiduplex axis, so a plain
Duplex feast never displaces a Lent Sunday:

| #   | `grade`              | reduces from `ritus`                 | who it is                                                   |
| --- | -------------------- | ------------------------------------ | ----------------------------------------------------------- |
| 1   | `triduum`            | Feria privilegiata Duplex I classis  | Maundy Thu, Good Fri, Holy Sat                              |
| 2   | `duplex-i`           | Duplex I classis (+ octave variants) | Christmas, Easter, Pentecost                                |
| 3   | `duplex-majus-i`     | Duplex majus I classis               | Low Sunday                                                  |
| 4   | `semiduplex-i`       | Semiduplex I classis                 | Lent Sundays, Palm Sunday, Easter/Pentecost octave weekdays |
| 5   | `feria-privilegiata` | Feria privilegiata                   | Ash Wednesday, Holy Week Mon–Wed                            |
| 6   | `duplex-ii`          | Duplex II classis (+ octave)         | second-class feasts                                         |
| 7   | `semiduplex-ii`      | Semiduplex II classis                | later Advent Sundays, octave days                           |
| 8   | `duplex-majus`       | Duplex majus                         |                                                             |
| 9   | `duplex`             | Duplex                               |                                                             |
| 10  | `semiduplex`         | Semiduplex                           | ordinary Sundays, semiduplex feasts                         |
| 11  | `simplex`            | Simplex                              |                                                             |
| 12  | `feria-major`        | Feria major                          | Advent/Lent ferias, Ember days                              |
| 13  | `vigilia`            | Vigilia                              |                                                             |
| 14  | `feria`              | Feria                                | ordinary weekdays                                           |

Four privileged Sundays receive a per-id override. Divinum Officium marks
Advent I and the three Septuagesima-block Sundays plain `"Semiduplex"`;
the `PRIVILEGED_SUNDAYS` map lifts Advent I to `semiduplex-i` and
Septuagesima, Sexagesima, and Quinquagesima to `semiduplex-ii`, matching
the classes DO gives the Lent and late-Advent Sundays. `ritus` stays
verbatim. Without the override, St. Andrew would displace Advent I Sunday
in the example above.

## Seasons — the temporale

Each feast carries the pair `season` (code) and `tempus` (the Latin
season name). The codes are one-to-one with the Divinum Officium Tempora
stems, so a date's season and the stem of any Tempora feast on it agree by
construction.

| `season` | `tempus`                | English              | Span                                                |
| -------- | ----------------------- | -------------------- | --------------------------------------------------- |
| `adv`    | Tempus Adventus         | Advent               | Advent I Sunday → Christmas                         |
| `nat`    | Tempus Nativitatis      | Christmastide        | Christmas → 1st Sunday after Epiphany               |
| `epi`    | Tempus post Epiphaniam  | Time after Epiphany  | there → Septuagesima                                |
| `quadp`  | Tempus Septuagesimæ     | Septuagesima         | Septuagesima Sunday → Ash Wednesday                 |
| `quad`   | Tempus Quadragesimæ     | Lent                 | Ash Wednesday → Easter                              |
| `pasc`   | Tempus Paschale         | Paschaltide          | Easter → Trinity Sunday (Pentecost octave included) |
| `pent`   | Tempus post Pentecosten | Time after Pentecost | Trinity Sunday → next Advent                        |

A feast's `id` carries a nominal week number, but `season` is always
derived from the date; overflow entries, such as the Epiphany weeks
resumed before Septuagesima, take the season of the day they fall on.

Season drives real liturgy in the ordinary: in the penitential seasons
(`adv`, `quadp`, `quad`) the Gloria is omitted, and the Ite with it — the
Benedicamus dismissal appears only where the selected mass carries a
setting ([chant.md](chant.md#the-ordinary--ordinarium)).

## The year's anchors — `pascha`

`pascha(year)` returns the movable anchors of one liturgical year as
UTC-midnight dates. Easter is computed by the Gregorian (Gauss/Butcher)
computus from 1583, and by the Julian computus with Julian→Gregorian
day-number conversion before that, so years reaching into the medieval
period stay correct. Everything else anchors to Easter, except Advent,
which anchors to the first Sunday on or after November 27, and the fixed
Christmas-cycle dates. A non-finite year throws.

```js
tonus.pascha(2026);
```

```js
{ year: 2026,
  septuagesima:      2026-02-01,  ashWednesday:  2026-02-18,
  firstLentSunday:   2026-02-22,  palmSunday:    2026-03-29,
  goodFriday:        2026-04-03,  easter:        2026-04-05,
  ascension:         2026-05-14,  pentecost:     2026-05-24,
  trinitySunday:     2026-05-31,  corpusChristi: 2026-06-04,
  adventFirstSunday: 2026-11-29,  gaudete:       2026-12-13,
  christmas:         2026-12-25,  epiphany:      2026-01-06,
  baptism:           2026-01-11 }
```

```ts
interface Pascha {
  year: number;
  septuagesima: Date;
  ashWednesday: Date;
  firstLentSunday: Date;
  palmSunday: Date;
  goodFriday: Date;
  easter: Date;
  ascension: Date;
  pentecost: Date;
  trinitySunday: Date;
  corpusChristi: Date;
  adventFirstSunday: Date;
  gaudete: Date;
  christmas: Date;
  epiphany: Date;
  baptism: Date;
}
```

## Theory & Context

### The calendar's era

The calendar's structure is medieval: the temporale from Advent through the
season after Pentecost (Septuagesima included), the eight-hour office cursus,
and the duplex/semiduplex/simplex dignity system. The data, though, is the
Tridentine codification (1570–1962) via Divinum Officium, continuous with
late-medieval usage but carrying feasts as recent as the 1950s. The accurate
description is "Tridentine Roman, continuous with medieval practice," not "a
medieval calendar." Why those later feasts are kept rather than pruned is
recorded in the code — see the era note at
[`cal/calendar.ts`](../src/engines/cal/calendar.ts).

## Sources

Sources for this page are in the central [bibliography](../BIBLIOGRAPHY.md):
`divinum-officium`, `computus`, `liber-usualis`, `wikipedia-calendar`.
