# Census

`census` measures a chant against the corpus that holds it: how typical it is,
where it is unusual, and what it is near. Pass a set of chants and it answers
the same for the group.

- [Census](#census)
  - [The method](#the-method)
  - [What a block holds](#what-a-block-holds)
  - [How the measurement works](#how-the-measurement-works)
  - [Distance is cosine per field group](#distance-is-cosine-per-field-group)
  - [Profile and typicality](#profile-and-typicality)
  - [Balance — distance and deviance](#balance--distance-and-deviance)
  - [Neighbors, and `by`](#neighbors-and-by)
  - [A set of chants — `ids`](#a-set-of-chants--ids)
  - [The era view](#the-era-view)
  - [What the census is not](#what-the-census-is-not)

## The method

```js
tonus.census({ id: "gregobase:1210" });
```

Everything comes back in one call — profile, balance, neighbours:

```js
{
  id: "gregobase:1210",
  by: "all",
  profile: {
    modal:         { values: [...12], typicality: 0.986 },
    degreeHist:    { values: [...15], typicality: … },
    melodic:       { values: [...121], typicality: 0.694 },
    trigram:       { values: [...16], typicality: … },
    cadenceFinal:  { values: [...16], typicality: … },
    cadenceMedial: { values: [...16], typicality: … },
    chironomy:     { values: [...6],  typicality: … },
    textual:       { values: [...7],  typicality: … },
    formulas:      { values: [...4],  typicality: … },
  },
  balance: {
    distance: 0.1029,
    deviantGroups: ["degreeHist", "melodic", "formulas"],
  },
  neighbors: [
    { id: "gregobase:34", similarity: 0.999 },
    …
  ],
}
```

```ts
interface CensusQuery {
  id?: string; // the chant to census…
  ids?: readonly string[]; // …or a set of them, censused together
  k?: number; // how many neighbours, default 8; 0 returns none
  by?: CensusBy; // which field group similarity is measured on, default "all"
  before?: number; // restrict neighbours to chants attested by this year
}
```

Give `id` or `ids`, never both — see [A set of chants](#a-set-of-chants--ids).

The census covers the **2,187 chants tonus ships** — the same population
`cantus({ id })` addresses, one block per chant. An id with no block throws
rather than returning an empty answer, because a silent nothing reads as "this
chant is unlike everything," which is a different claim.

## What a block holds

The corpus pipeline censuses every shipped chant into 225 float32s, grouped by
what they describe:

| group           | floats | what it measures                                                                  |
| --------------- | -----: | --------------------------------------------------------------------------------- |
| `modal`         |     12 | affinity to each of the eight modes, the final's and tenor's pitch-class, ambitus |
| `degreeHist`    |     15 | how long the melody dwells on each scale degree, final-relative                   |
| `melodic`       |    121 | the interval bigram table — which step follows which                              |
| `trigram`       |     16 | three-note motifs, against the corpus's commonest                                 |
| `cadenceFinal`  |     16 | how the chant closes, keyed by cadence signature                                  |
| `cadenceMedial` |     16 | how its interior phrases land                                                     |
| `chironomy`     |      6 | the melodic arc in quarters, phrase length, melisma density                       |
| `textual`       |      7 | vowel distribution by sung duration, accent rate, melisma mean                    |
| `formulas`      |      4 | centonization hits against the formulary                                          |

Four more fields ride in the block and are **not** similarity dimensions:
`flags` (a bitfield), `attest` (dating — that is what `before` reads),
`extras`, and `reserve`. `by` will not accept them.

## How the measurement works

Every number in a block reads off a single `notatio()` parse — the same parse
`score` gives you — so the census can never disagree with the library about
what a chant is.

Each float is a named measurement, not a learned one: time spent on the
subfinal, how often a rising second follows a falling third. When the census
calls two chants near, the profile says in what respect.

Most groups are normalized to sum to one, so a group holds a distribution —
where the melody's time goes, not how much of it there is; length is not a
similarity. The trigram and cadence groups count against dictionaries mined
from the corpus itself — its commonest motifs, its commonest closing gestures,
one bucket for the rest — so the corpus supplies the vocabulary and the chant
supplies the usage.

The reference is the mean block over all 2,187 chants, group by group — no
curated exemplar, no tunable weights. And because blocks are sums of durations
and counts, they add: a season's blocks, summed and divided by their count,
are the season's mean profile in the same 225 slots. The corpus repository's
year-shaped aggregates are built on that closure; only the per-chant half
ships (see [What the census is not](#what-the-census-is-not)).

## Distance is cosine per field group

Never over the flat 225. Cosine on the whole vector is dominated by the
121-float `melodic` block and by sheer magnitude, so a long Tract would
neighbour other long chants for being long. Per-group cosine asks about
**shape within each dimension**, and `by: "all"` is the equal-weight mean of
those — every dimension one vote, no tunable weights.

Ties break to the lower id, so the same question always has the same answer.

## Profile and typicality

Each group's `typicality` is its cosine against the corpus mean for that group:
1.0 is "uses this dimension exactly as the corpus does on average," lower means
"unlike the rest."

The two numbers above are a fair illustration. _Ab occultis meis_ is a mode-2
Gradual whose `modal` typicality is 0.986 — modally it is a typical mode-2
chant — while its `melodic` typicality is 0.694, because its interval
vocabulary is its own. One chant can be conventional in one dimension and
distinctive in another, which is the reason the groups are kept apart.

Typicality is always measured against the **whole shipped corpus**, never the
filtered pool: `before` restricts who may be a neighbour, it does not move
the mean.

## Balance — distance and deviance

```js
balance: { distance: 0.1029, deviantGroups: ["degreeHist", "melodic", "formulas"] }
```

`distance` is 1 minus the mean typicality across all groups: 0 is a chant at
the corpus mean, 1 has nothing in common with it.

`deviantGroups` names where a chant is unusual **relative to its own mean**,
most deviant first — not against an absolute threshold. The question it answers
is "given how typical this chant is overall, where does it depart from
itself?", which is what makes the answer legible for a chant that is unusual
everywhere or nowhere.

## Neighbors, and `by`

```js
tonus.census({ id: "gregobase:1210", k: 3 });
// Ab occultis meis (Graduale, mode 2) →
//   Justus ut palma   Graduale, mode 2
//   Requiem           Graduale, mode 2
//   Domine refugium   Graduale, mode 2
```

Nothing tells the census what genre or mode a chant is. It recovers them from
melodic shape alone — which is the readiest evidence that the blocks describe
something real.

`by` changes what _near_ means:

```js
tonus.census({ id: "gregobase:1210", k: 3, by: "cadenceFinal" });
// chants that CLOSE the same way — crossing genre and mode freely
```

Asked on `all`, a mode-2 Gradual finds mode-2 Graduals. Asked on
`cadenceFinal`, it finds an Alleluia, an Introit and a Communion in modes 1
and 4 that happen to end with the same gesture. Both answers are correct; they
are answers to different questions.

`k` bounds the result (default 8, `0` returns none, larger than the corpus
returns all 2,186 others).

## A set of chants — `ids`

Pass `ids` instead of `id` and the census answers for a whole group: every
Gradual, one mode, a feast's propers, whatever a query returned.

```js
const graduals = tonus.cantus({ office: "gr" }).map((c) => c.id);
tonus.census({ ids: graduals });
// 240 chants → distance 0.035, deviant on degreeHist and cadenceFinal
```

The profile is the **centroid** of the members' blocks, read against the corpus
exactly as one chant's block is. So the question does not change — only how
many chants are asking it. `ids` on the result names the members; a single
`census({ id })` returns a one-entry `ids`, so the shape never forks.

**A set's neighbours are what resemble it from outside.** No member of the set
is one, mirroring how a chant is never its own neighbour: asking what a group is
near is not asking what is in it.

Give `id` or `ids`, never both and never neither. Duplicates dedupe, so a member
cannot weight itself twice.

> **A set reads as more typical than any chant in it.** That is the arithmetic,
> not an error: averaging keeps what the members share and cancels what is
> peculiar to each, so the centroid sits nearer the corpus mean than its
> nearest member. Twenty mode-3 chants average to 0.026 from the centre while
> the closest of them individually sits at 0.043. Compare sets with sets.

## The era view

```js
tonus.census({ id: "gregobase:1210", before: 1100 });
```

Restricts neighbours to chants a manuscript of the 11th century or earlier
already holds — 1,790 of the 2,186 candidates. This is the same rule as
[`cantus({ before })`](chant.md#the-repertoire-as-of-a-date--the-era-view),
through the same admissibility door: **evidence, not existence**, so a chant
with no dated witness is excluded rather than assumed old.

The seed chant itself is never filtered — you asked about it by name.

## What the census is not

It is not a similarity search over Gregorian chant at large. The blocks
describe the chants tonus ships, which is the assignment-driven corpus: what
some day of the calendar calls for. A melody's neighbours are its neighbours
_within that repertoire_.

It is also not the whole census. The corpus pipeline builds year-shaped
aggregates too — what a season sings, how usage weights a chant across the
Metonic cycle — and those stay in the corpus repository as analysis data. A
chant's own profile is a property of the chant, so it ships; the year-shaped
aggregates are an observatory, and they do not.
