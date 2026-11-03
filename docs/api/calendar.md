# Calendar

`tonus.festum` resolves a date to its place in the liturgical year. It
returns the entries that fall on the day, the leading one first, each
carrying its rank in the rubrics' own vocabulary, its season, and the
kyriale masses appropriate to it. The calendar is the Roman calendar under
the Divino Afflatu rubrics (1911, in the state of c. 1954), extracted from
[Divinum Officium](https://github.com/DivinumOfficium/divinum-officium):
650 entries across the sanctorale (fixed feasts) and the temporale
(movable feasts), resolved against Easter computed by the Gregorian computus
from 1583 and the Julian computus before it.

- [Calendar](#calendar)
  - [The day's feasts — `festum`](#the-days-feasts--festum)
    - [Precedence](#precedence)
    - [Dates before the reform](#dates-before-the-reform)
    - [The day as of a year — `before`](#the-day-as-of-a-year--before)
  - [Rank — `ritus` and `grade`](#rank--ritus-and-grade)
  - [Seasons — the temporale](#seasons--the-temporale)
  - [The year's anchors — `pascha`](#the-years-anchors--pascha)
  - [Theory \& Context](#theory--context)
    - [The calendar's era](#the-calendars-era)

## The day's feasts — `festum`

`festum(query?)` returns `Feast[]`. A date query returns every entry that
falls on the day, sorted by [precedence](#precedence): the leading entry
first, the entries it impedes after it. A range query (`from`/`to`) walks
each day and flattens the results, day by day. A query with filters but no
date scans the default liturgical year, Advent to Advent. With no argument
at all, the day resolves to tonus's default epoch, **1 June 991**
(proleptic Gregorian, Julian 27 May), the symbolic birthday of Guido d'Arezzo (see
[the conventions note](index.md#conventions)).
Empty matches return `[]`. A malformed query throws: an unknown key, a
`date`, `from` or `to` that is not a valid `Date` or falls before AD 1,
`date` given together with `from`/`to`, a range missing one end or running
backwards, an empty `nomen`, or a non-numeric `before`.

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
];
```

The fourth week of Advent ends on Christmas Eve, so in a year when Advent IV
falls on Dec 20, its Friday is never reached and Christmas stands alone.

On November 30, 2025, St. Andrew falls on the first Sunday of Advent. The
Sunday leads and the Apostle follows it:

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

### Precedence

The entries of one day sort by a simplified form of the Divino Afflatu
precedence, the rubrics the data was drawn under:

1. The **excluding days** lead whatever falls on them: Advent I, Ash
   Wednesday, the Sundays of Lent and Passiontide, Holy Week, Easter and its
   octave through Low Sunday, and Pentecost and its octave.
2. Otherwise the [grade](#rank--ritus-and-grade) decides, with the Sundays
   placed by their class. A greater Sunday of the II class (Advent II–IV,
   Septuagesima, Sexagesima, Quinquagesima) yields only to a I-class feast.
   An ordinary Sunday yields to I- and II-class feasts, so a Duplex majus or
   a Duplex falling on it follows the Sunday.
3. On a tie, the temporale leads the sanctorale.

```js
tonus.festum({ date: new Date("2029-03-25") });
// Dominica in Palmis                       [semiduplex-i]
// In Annuntiatione Beatæ Mariæ Virginis    [duplex-i]
```

An impeded feast is listed after the day that impedes it. It is not
transferred to its next free day, as the books direct: the Annunciation of
2029 stays on Palm Sunday, second, and All Souls on a Sunday (2008) stays on
the Sunday rather than moving to the Monday. Commemorations, the feasts of
the Lord that take an ordinary Sunday, and the finer occurrence tables are
not modelled.

Some dates follow rules of their own. The Sunday within the Christmas
octave (`Nat1-0`) is the Sunday falling Dec 29–31; when the Sunday falls
Dec 26–28, or Christmas is itself a Sunday, its office is said on Dec 30.
The Holy Name of Jesus (`Nat2-0`) is the Sunday falling Jan 2–5, or Jan 2
when there is none. In a leap year the feasts of Feb 24–28 are kept a day
later (St. Matthias on Feb 25), the bissextile day being doubled. The weeks
after the Epiphany end at Septuagesima; those the year leaves out resume in
November.

### Dates before the reform

Every `Date` tonus takes and returns is a proleptic-Gregorian UTC midnight.
Before the Gregorian reform the fixed feasts keep their Julian dates: Julian
Thursday 4 October 1582 is followed by Gregorian Friday 15 October, and an
earlier "March 25" is a Julian March 25. So in 1350 the Annunciation falls
on Gregorian April 2, Maundy Thursday that year, and Christmas 1350 on
Gregorian January 2, 1351. Easter makes the same split, so the fixed and
movable cycles stay in one frame. The ten skipped days of October 1582 keep
no fixed feast.

```js
tonus.festum({ date: new Date("1350-04-02") });
// Feria Quinta in Cena Domini              [triduum]
// In Annuntiatione Beatæ Mariæ Virginis    [duplex-i]
```

### The day as of a year — `before`

`before` resolves the day as it stood in a given year: the calendar holds
only the feasts instituted by then, and precedence runs over those. On most
days that returns the temporale or the feria in place of a modern feast.
Institution dates are in `src/engines/cal/data/eras.ts`: the later feasts
of Our Lady and of the Lord, the later temporale (Trinity, Corpus Christi,
the Sacred Heart and the Patrocinium of St Joseph, with their octaves), and
the saints canonized after c. 1050, dated by canonization where universal
entry is not well established. A feast the table does not list is kept. A
day with no feast yet instituted returns `[]`; the ferias and plain Sundays
that the later temporale replaced are not in the data, so such a day (the
octave of Corpus Christi before 1264) returns `[]` too.

```js
tonus.festum({ date: new Date("2026-07-01"), before: 1100 });
// the feria — the Precious Blood was not instituted until 1849
```

The feast returned **carries the view** (`feast.before`), and every chant
verb reads it back: `proprium`, `ordinarium`, and `officium`
serve only chants attested by the same year, without being told the year
twice. One `before` at the calendar door views the whole day. The chant side
(what "attested" means, and what a slot the view excludes does) is in
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
  ritus: string; // the DO [Rank] line verbatim, incl. octave detail
  grade: Grade; // canonical grade code, ordered by GRADE_ORDER
  season: Season; // machine code (DO Tempora stem)
  tempus: string; // Latin season name, "Tempus Adventus"
  seasonStart: Date;
  seasonEnd: Date;
  date: Date; // proleptic-Gregorian UTC midnight
  weekday: number; // 0 = Sunday (UTC)
  masses: number[]; // the masses the day's Kyriale rubric appoints
  marian: boolean;
  apostolic: boolean;
  before?: number; // the era view this feast was resolved under, if any
}
```

The `masses` list is derived from the Kyriale's own printed rubric, one
category per mass, by RANK: "In Paschal Time", "For feasts of the I class",
"For Sundays throughout the Year", "For ferias". A day resolves to exactly
one rubric (a feast flagged `marian` is "of the Blessed Virgin" even in
Paschaltide),
and the masses carrying that rubric are the masses it may sing, in the
book's own numbering. Two headings run past their first line, and the
second line appoints days by kind rather than rank: Mass XV is "for
commemorations **and ferias of the Christmas season**", and Mass XVIII "for
the ferias of Advent and Lent **as well as for Vigils, Ember Days, and
Rogation Days**". So a lesser vigil sings XVIII in any season but
Paschaltide, ahead of the BVM rubric, since a vigil is not the feast it
precedes. The September Ember Days are not in the calendar data, so they
reach no rubric at all. Where a rubric names several (II class 1–5), that
numbering is the book's invitation to choose, and `ordinarium` rotates
among them by year. The book's per-mass nicknames (_Orbis factor_ for
Sundays, and so on) record customary use, which disagrees with the rubric for 9
of the 18; `ordinarium` selects on the rubric.

`marian` marks the feasts of Our Lady, from the Purification and the
Annunciation to the Seven Sorrows and the Presentation; their vigils are not
marked, nor are the feasts of St. Joseph, St. Anne and St. Joachim.
`apostolic` marks the feasts of the Apostles and Evangelists, without their
vigils.

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
| 7   | `semiduplex-ii`      | Semiduplex II classis                | Advent II–IV Sundays, Corpus Christi octave days            |
| 8   | `duplex-majus`       | Duplex majus                         |                                                             |
| 9   | `duplex`             | Duplex                               |                                                             |
| 10  | `semiduplex`         | Semiduplex                           | Sundays throughout the year, semiduplex feasts              |
| 11  | `simplex`            | Simplex                              |                                                             |
| 12  | `feria-major`        | Feria major                          | Advent/Lent ferias, Ember days                              |
| 13  | `vigilia`            | Vigilia                              |                                                             |
| 14  | `feria`              | Feria                                | weekdays with no feast                                      |

Four Sundays are graded above their Divinum Officium rank, which marks Advent I
and the three Septuagesima-block Sundays plain `"Semiduplex"`. Advent I resolves
to `semiduplex-i`; Septuagesima, Sexagesima, and Quinquagesima to
`semiduplex-ii`, matching the classes DO gives the Lent and late-Advent Sundays.
`ritus` stays verbatim.

## Seasons — the temporale

Each feast carries the pair `season` (code) and `tempus` (the Latin
season name). The codes are named after the Divinum Officium Tempora stems,
but the season is read from the date, not the stem: Ash Wednesday is
`Quadp3-3` and falls in `quad`.

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
resumed before Advent, take the season of the day they fall on.

Season drives real liturgy in the ordinary: on the Sundays and ferias of
the penitential seasons (`adv`, `quadp`, `quad`) the Gloria is omitted, and
the Ite with it. The
Benedicamus dismissal appears only where the selected mass carries a
setting ([chant.md](chant.md#the-ordinary--ordinarium)).

## The year's anchors — `pascha`

`pascha(year)` returns the anchors of one civil year as UTC-midnight dates
(its Advent and Christmas open the next liturgical year). Easter is computed by the Gregorian (Gauss/Butcher)
computus from 1583, and by the Julian computus with Julian→Gregorian
day-number conversion before that, so years reaching into the medieval
period stay correct. Everything else anchors to Easter, except Advent,
which anchors to the first Sunday on or after November 27, and the fixed
Christmas-cycle dates, which before the reform are Julian
([Dates before the reform](#dates-before-the-reform)): `pascha(1350).christmas`
is 1351-01-02. `baptism` is the Sunday after the Epiphany, the Holy
Family's Sunday in this calendar. A non-number throws a `TypeError`; a
non-finite year, or one before AD 1, a `RangeError`.

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
and the duplex/semiduplex/simplex dignity system. The data is the Roman
calendar of the Divino Afflatu reform (1911) as it stood c. 1954, via Divinum
Officium: continuous with late-medieval usage, and carrying feasts as recent
as the 1950s. Precedence follows the same era, so a Sunday after the
Epiphany or after Pentecost keeps the day against a Duplex feast, which it
would not have done under the 1570 rubrics. tonus describes this calendar as
the Divino Afflatu Roman calendar, continuous with medieval practice.

## Sources

Sources for this page are in the central [bibliography](https://github.com/jeffreypierce/tonus/blob/main/BIBLIOGRAPHY.md):
`divinum-officium`, `computus`, `liber-usualis`.
