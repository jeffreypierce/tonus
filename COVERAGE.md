# Coverage — calendar → chants

What the tonus calendar resolves to: for each day, whether tonus carries its
Mass propers and its Divine Office. Measured against the shipped build,
2026-08-10.

## The day, end to end

The question is not how many table rows are populated but whether a **date**
produces a sung day. Walking every day of 2026, taking each day's primary feast:

| Days | Propers | Office | Matins | No data |
| ---: | ---: | ---: | ---: | ---: |
| 365 | 365 (100%) | 365 (100%) | 365 (100%) | 0 |

Every day resolves all three. Most days have no proper chants of their own; the
fallback chain carries the rest — proper → commune → ferial/seasonal — so a day
with no proper Matins still sings, from its commune or the ferial cycle.

The calendar is **650 entries**: 285 sanctorale (fixed) and 365 temporale
(moveable).

## Mass propers — slot fill

Of the 689 proper formularies, how many carry each slot. A low rate is not a
gap: the missing slot comes from the commune or the season.

| Slot | Filled | Rate |
| --- | ---: | ---: |
| Introitus | 405 / 689 | 58.8% |
| Graduale | 366 / 689 | 53.1% |
| Alleluia | 296 / 689 | 43.0% |
| Tractus | 175 / 689 | 25.4% |
| Offertorium | 398 / 689 | 57.8% |
| Communio | 382 / 689 | 55.4% |
| Sequentia | 18 / 689 | 2.6% |

Core six slots: **2,022 / 4,134** (48.9%). The Sequentia is low by rubric — the
Tridentine reform leaves only a handful standing.

## Divine Office — slot fill

The office table is **464 rows**, the Benedictine cursus. tonus serves one
cursus; see [chant.md](docs/api/chant.md#one-cursus-the-benedictine).

| Slot | Filled | Rate |
| --- | ---: | ---: |
| Invitatory | 51 / 464 | 11.0% |
| Ant Matutinum | 162 / 464 | 34.9% |
| Hymn Matutinum | 75 / 464 | 16.2% |
| Resp Matutinum | 288 / 464 | 62.1% |
| Ant Laudes | 158 / 464 | 34.1% |
| Ant Benedictus | 152 / 464 | 32.8% |
| Hymn Laudes | 100 / 464 | 21.6% |
| RB Tertia | 104 / 464 | 22.4% |
| RB Sexta | 118 / 464 | 25.4% |
| RB Nona | 118 / 464 | 25.4% |
| Ant Vespera | 150 / 464 | 32.3% |
| Ant Magnificat | 148 / 464 | 31.9% |
| Hymn Vespera | 97 / 464 | 20.9% |

Read these against the day figures above: a 34.9% Matins antiphon rate coexists
with 100% of days singing Matins, because the commune and ferial fallbacks carry
the rest.

## Matins — chants yes, nocturns no

Matins resolves on every day and returns its chants **flat**. The three-nocturn,
twelve-psalm Benedictine division is not modelled: the chants are right, their
grouping into nocturns is not expressed. They come from the Nocturnale Romanum
(`nr`, 470 shipped chants), and a feast without proper Matins draws them from
its commune by the same rule as every other hour.

## Chant source usage

Sources drawn on across a full year of days (2026), taking each day's primary
feast and counting every chant returned by `proprium` and by all eight hours of
`officium`:

| Source | Chants returned |
| --- | ---: |
| psalm verses | 49,204 |
| `am` Antiphonale Monasticum | 4,730 |
| `lu` The Liber Usualis | 3,166 |
| `nr` Nocturnale Romanum | 2,950 |
| `la` Liber antiphonarius | 2,316 |
| `cot` Chants of the Church | 398 |
| `psm` Psalterium Monasticum | 156 |
| `gr` Graduale Romanum | 155 |
| `lh` Liber Hymnarius | 103 |
| `cse` Cantus selecti | 76 |
| `ams` Antiphonale Mon. Solesmense | 19 |

These are **returns, not distinct chants** — a psalm sung daily counts daily.
That is why the office books dominate and the Graduale, sung once a day at
Mass, sits low despite being among the largest books.

The shipped corpus is 2,767 listings over 2,187 distinct chants, across ten
books. It is assignment-driven — a chant ships only if some day calls for it —
so there is no large unreferenced remainder to report. See
[The cut](docs/api/chant.md#the-cut).

`corpus()` reports the whole shelf, 2,187 chants against the **10,156 held**,
and every book carries a `full` tally in the same genera/modes shape as its
shipped one, so the Antiphonale's 1,049 antiphons and the 458 tonus sings sit
side by side. See
[the ledger of the cut](docs/api/chant.md#the-ledger-of-the-cut--full).
