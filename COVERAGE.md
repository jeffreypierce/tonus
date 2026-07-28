# Coverage — calendar → chants

What the tonus calendar actually resolves to: for each day, whether tonus
carries its Mass propers and its Divine Office. Measured against the shipped
build, 2026-07-28.

## The day, end to end

The question that matters is not how many table rows are populated but whether
a **date** produces a sung day. Walking every day of 2026:

| Days | Propers | Office | Matins | No data |
| ---: | ---: | ---: | ---: | ---: |
| 365 | 365 (100%) | 365 (100%) | 365 (100%) | 0 |

Every day resolves all three — not because every day has proper chants of its
own (most do not), but because the fallback chain is complete: proper →
commune → ferial/seasonal. A day with no proper Matins still sings, from its
commune or the ferial cycle.

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

Core six slots: **2022 / 4134** (48.9%). The Sequentia is low by rubric, not by
omission — the Tridentine reform leaves only a handful standing.

## Divine Office — slot fill

The office table is **464 rows**, the Benedictine cursus. tonus serves one
cursus; see [chant.md](docs/chant.md#one-cursus-the-benedictine) for why the
Roman office was cut rather than kept as an option.

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

Read these against the day figures above, not on their own: a 34.9% Matins
antiphon rate coexists with 100% of days singing Matins, because the commune
and ferial fallbacks carry the rest.

## Matins — chants yes, nocturns no

Matins resolves on every day but returns its chants **flat**. The three-nocturn,
twelve-psalm Benedictine division is not modelled — the ordo shape is what is
missing, not the repertoire. The chants come from the Nocturnale Romanum (`nr`,
470 shipped chants), and a feast without proper Matins draws them from its
commune by the same rule as every other hour.

## Chant source usage

Sources drawn on across a full year of days (2026), counting every chant
returned by `proprium` and all eight hours of `officium`:

| Source | Chants returned |
| --- | ---: |
| psalm verses | 68,602 |
| `am` Antiphonale Monasticum | 7,579 |
| `lu` The Liber Usualis | 4,656 |
| `nr` Nocturnale Romanum | 4,357 |
| `la` Liber antiphonarius | 2,856 |
| `psm` Psalterium Monasticum | 482 |
| `cot` Chants of the Church | 400 |
| `cse` Cantus selecti | 252 |
| `gr` Graduale Romanum | 218 |
| `lh` Liber Hymnarius | 115 |
| `ams` Antiphonale Mon. Solesmense | 19 |

These are **returns, not distinct chants** — a psalm sung daily counts daily.
That is why the office books dominate and the Graduale, sung once a day at
Mass, sits low despite being among the largest books.

The shipped corpus is 2,887 chants across eleven books. Because it is
assignment-driven — a chant ships only if some day calls for it — there is no
large unreferenced remainder to report. That was the point of
[the cut](docs/chant.md#the-cut).
