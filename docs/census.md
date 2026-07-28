# Census

`census` measures one chant against the corpus that holds it: how ordinary it
is, where it is unusual, and what it is near.

- [Census](#census)
  - [The verb](#the-verb)
  - [What a block holds](#what-a-block-holds)
  - [Distance is cosine per field group](#distance-is-cosine-per-field-group)
  - [Profile and typicality](#profile-and-typicality)
  - [Balance — distance and deviance](#balance--distance-and-deviance)
  - [Neighbors, and `by`](#neighbors-and-by)
  - [The era view](#the-era-view)
  - [What the census is not](#what-the-census-is-not)

## The verb

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
  id: string;      // the chant to census
  k?: number;      // how many neighbours, default 8; 0 returns none
  by?: CensusBy;   // which field group similarity is measured on, default "all"
  before?: number; // restrict neighbours to chants attested by this year
}
```

The census covers the **2,187 chants tonus ships** — the same population
`cantus({ id })` addresses, one block per chant. An id with no block throws
rather than returning an empty answer, because a silent nothing reads as "this
chant is unlike everything," which is a different claim.

## What a block holds

The corpus pipeline censuses every shipped chant into 225 float32s, grouped by
what they describe:

| group | floats | what it measures |
| --- | ---: | --- |
| `modal` | 12 | affinity to each of the eight modes, the final's and tenor's pitch-class, ambitus |
| `degreeHist` | 15 | how long the melody dwells on each scale degree, final-relative |
| `melodic` | 121 | the interval bigram table — which step follows which |
| `trigram` | 16 | three-note motifs, against the corpus's commonest |
| `cadenceFinal` | 16 | how the chant closes, keyed by cadence signature |
| `cadenceMedial` | 16 | how its interior phrases land |
| `chironomy` | 6 | the melodic arc in quarters, phrase length, melisma density |
| `textual` | 7 | vowel distribution by sung duration, accent rate, melisma mean |
| `formulas` | 4 | centonization hits against the formulary |

Four more fields ride in the block and are **not** similarity dimensions:
`flags` (a bitfield), `attest` (dating — that is what `before` reads),
`extras`, and `reserve`. `by` will not accept them.

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

The two numbers above are a fair illustration. *Ab occultis meis* is a mode-2
Gradual whose `modal` typicality is 0.986 — modally it is an ordinary mode-2
chant — while its `melodic` typicality is 0.694, because its interval
vocabulary is its own. One chant can be conventional in one dimension and
distinctive in another, which is the reason the groups are kept apart.

Typicality is always measured against the **whole shipped corpus**, never the
filtered pool: `before` restricts who may be a neighbour, it does not rewrite
what "ordinary" means.

## Balance — distance and deviance

```js
balance: { distance: 0.1029, deviantGroups: ["degreeHist", "melodic", "formulas"] }
```

`distance` is 1 minus the mean typicality across all groups: 0 is the most
ordinary chant imaginable, 1 has nothing in common with the corpus mean.

`deviantGroups` names where a chant is unusual **relative to its own mean**,
most deviant first — not against an absolute threshold. The question it answers
is "given how ordinary this chant is overall, where does it depart from
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

`by` changes what *near* means:

```js
tonus.census({ id: "gregobase:1210", k: 3, by: "cadenceFinal" });
// chants that CLOSE the same way — crossing genre and mode freely
```

Asked on `all`, a mode-2 Gradual finds mode-2 Graduals. Asked on
`cadenceFinal`, it finds an Alleluia, an Introit and a Communion in modes 1, 3
and 4 that happen to end with the same gesture. Both answers are correct; they
are answers to different questions.

`k` bounds the result (default 8, `0` returns none, larger than the corpus
returns all 2,186 others).

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
*within that repertoire*.

It is also not the whole census. The corpus pipeline builds year-shaped
aggregates too — what a season sings, how usage weights a chant across the
Metonic cycle — and those stay in the corpus repository as analysis data. A
chant's own profile is a property of the chant, so it ships; the year-shaped
aggregates are an observatory, and they do not.
