# Coverage — calendar → chants

What the tonus calendar actually resolves to: for each day, whether tonus
carries its Mass propers and its Divine Office. Measured against the shipped
build, 2026-10-28.

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
| Introitus | 406 / 689 | 58.9% |
| Graduale | 386 / 689 | 56.0% |
| Alleluia | 297 / 689 | 43.1% |
| Tractus | 204 / 689 | 29.6% |
| Offertorium | 400 / 689 | 58.1% |
| Communio | 406 / 689 | 58.9% |
| Sequentia | 18 / 689 | 2.6% |

Core six slots: **2099 / 4134** (50.8%). The Sequentia is low by rubric, not by
omission — the Tridentine reform leaves only a handful standing.

## Divine Office — slot fill

The office table is **464 rows**, the Benedictine cursus. tonus serves one
cursus; see [chant.md](docs/chant.md#one-cursus-the-benedictine) for why the
Roman office was cut rather than kept as an option.

| Slot | Filled | Rate |
| --- | ---: | ---: |
| Invitatory | 52 / 464 | 11.2% |
| Ant Matutinum | 88 / 464 | 19.0% |
| Hymn Matutinum | 75 / 464 | 16.2% |
| Resp Matutinum | 299 / 464 | 64.4% |
| Ant Laudes | 158 / 464 | 34.1% |
| Ant Benedictus | 134 / 464 | 28.9% |
| Hymn Laudes | 121 / 464 | 26.1% |
| RB Tertia | 104 / 464 | 22.4% |
| RB Sexta | 118 / 464 | 25.4% |
| RB Nona | 118 / 464 | 25.4% |
| Ant Vespera | 150 / 464 | 32.3% |
| Ant Magnificat | 128 / 464 | 27.6% |
| Hymn Vespera | 106 / 464 | 22.8% |

Read these against the day figures above, not on their own: a 19.0% Matins
antiphon rate coexists with 100% of days singing Matins, because the commune
and ferial fallbacks carry the rest.

## Matins — chants yes, nocturns no

Matins resolves on every day but returns its chants **flat**. The three-nocturn,
twelve-psalm Benedictine division is not modelled — the ordo shape is what is
missing, not the repertoire. The chants come from the Nocturnale Romanum (`nr`,
1549 shipped chants), and a feast without proper Matins draws them from its
commune by the same rule as every other hour.

## Chant source usage

Sources drawn on across a full year of days (2026), counting every chant
returned by `proprium` and all eight hours of `officium`:

| Source | Chants returned |
| --- | ---: |
| psalm verses | 68,602 |
| `am` Antiphonale Monasticum | 7,850 |
| `lu` The Liber Usualis | 5,159 |
| `nr` Nocturnale Romanum | 4,900 |
| `la` Liber antiphonarius | 2,731 |
| `psm` Psalterium Monasticum | 489 |
| `gr` Graduale Romanum | 223 |
| `lh` Liber Hymnarius | 116 |

These are **returns, not distinct chants** — a psalm sung daily counts daily.
That is why the office books dominate and the Graduale, sung once a day at
Mass, sits low despite being among the largest books.

The shipped corpus is 9,906 rows over 7,988 distinct chants, across nine
books — the books themselves. The corpus was assignment-driven until
2026-08-31, shipping only what some day called for; that gate is gone, so a
chant with no day to be sung on is still on the shelf and still findable.

`corpus()` reports the whole shelf (7,988 listed of **9,959 catalogued**), and every
book carries a `full` tally in the same genera/modes shape as its shipped one —
so the Antiphonale's 1,049 catalogued antiphons and the 1,045 tonus lists sit side by side.
See [what the book holds](docs/api/chant.md#what-the-book-holds--full).
