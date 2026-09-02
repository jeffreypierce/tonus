# Census

`census` measures one chant against the corpus that holds it: how typical it
is, where it is unusual, and what it is near.

- [Census](#census)
  - [The method](#the-method)
  - [What a block holds](#what-a-block-holds)
  - [How the measurement works](#how-the-measurement-works)
  - [Distance is cosine per field group](#distance-is-cosine-per-field-group)
  - [Profile and typicality](#profile-and-typicality)
  - [Balance — distance and deviance](#balance--distance-and-deviance)
  - [Neighbors, and `by`](#neighbors-and-by)
  - [The era view](#the-era-view)
  - [What the census is not](#what-the-census-is-not)

## The method

```js
tonus.census({ id: "gregobase:1210" });
```

Everything comes back in one call: profile, balance, neighbors.

```js
{
  id: "gregobase:1210",
  by: "all",
  profile: {
    modal:         { values: [...12], typicality: 0.99 },
    degreeHist:    { values: [...15], typicality: … },
    melodic:       { values: [...121], typicality: 0.70 },
    trigram:       { values: [...16], typicality: … },
    cadenceFinal:  { values: [...16], typicality: … },
    cadenceMedial: { values: [...16], typicality: … },
    chironomy:     { values: [...6],  typicality: … },
    textual:       { values: [...7],  typicality: … },
  },
  balance: {
    distance: 0.091,
    deviantGroups: ["degreeHist", "melodic"],
  },
  neighbors: [
    { id: "gregobase:34", similarity: 0.999 },
    …
  ],
}
```

```ts
interface CensusQuery {
  id: string; // the chant to census
  k?: number; // how many neighbors, default 8; 0 returns none
  by?: CensusBy; // which field group similarity is measured on, default "all"
  before?: number; // restrict neighbors to chants attested by this year
}
```

The census covers **7,718 of the 7,825 chants tonus ships**, one block per
chant. The hundred and seven without one are the *Toni Communes* — office `or`,
the recitation formulas — and they are left out on purpose: eleven *Benedicamus
Domino* settings are one gesture, not eleven chants, and censusing them would
invent a distribution out of a tone. They stay on the shelf; `cantus` finds
them. They are simply not what typicality is measured against.

That population is now the books themselves. Until 2026-08-31 it was the 2,187
the calendar reached, which meant every typicality figure below was quietly
measured against one rite's selection rather than against the repertory. An id
with no block throws
rather than returning an empty answer, because a silent nothing reads as "this
chant is unlike everything," which is a different claim.

## What a block holds

The corpus pipeline censuses every shipped chant into 221 float32s, grouped by
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

Four more fields ride in the block and are **not** similarity dimensions:
`flags` (a bitfield), `attest` (dating, which is what `before` reads),
`extras`, and `reserve`. `by` will not accept them.

## How the measurement works

Every number in a block reads off a single `notatio()` parse (the same parse
`score` gives you), so the census can never disagree with the library about
what a chant is.

Each float is a named measurement, not a learned one: time spent on the
subfinal, how often a rising second follows a falling third. When the census
calls two chants near, the profile says in what respect.

Most groups are normalized to sum to one, so a group holds a distribution:
where the melody's time goes, not how much of it there is. Length is not a
similarity. The trigram and cadence groups count against dictionaries mined
from the corpus itself (its commonest motifs, its commonest closing gestures,
one bucket for the rest), so the corpus supplies the vocabulary and the chant
supplies the usage.

The reference is the mean block over all 7,718 chants, group by group. Because
blocks are sums of durations and counts, they add: a season's blocks, summed and
divided by their count, are the season's mean profile in the same 221 slots.

## Distance is cosine per field group

**This is a contract, not an implementation note.** The census answers about
one chant at a time. Grouping ("all Communions," "this season," "this
manuscript") is yours to do. The moment you pool blocks yourself you are
computing a distance, and if you compute it differently from the rule below
your numbers will not agree with `census()`'s. Nothing will error.

The rule, in three lines:

1. Cosine **per field group**, never over the flat 221.
2. `by: "all"` is the **equal-weight mean** of the per-group cosines: every
   dimension one vote, no tunable weights.
3. Ties break to the lower id, so the same question always has the same answer.

Cosine on the whole vector is dominated by the 121-float `melodic` block and by
sheer magnitude, so a long Tract would neighbor other long chants for being
long. Per-group cosine asks about **shape within each dimension**.

[`CENSUS_GROUPS`](index.md#the-appendix) gives you the group names and their
field counts, and [`CENSUS_ORDER`](index.md#the-appendix) every censused id,
so you can pool a set without guessing at either.

### Reading the numbers

**Similarity is not comparable across `by` values.** A 0.94 on `cadenceFinal`
and a 0.94 on `melodic` are not the same amount of alike: the groups have
different widths and different natural spreads. Rank within one `by`; never
threshold across two.

**A centroid must be pooled per group, then compared per group.** Averaging the
flat 221 and taking one cosine is the exact mistake rule 1 exists to prevent.
Pooling the 178 Communions both ways gives different winners, and the flat
version collapses the top of the field into a tie around 0.99 where the
per-group version spreads from about 0.85 down to 0.65. That compression comes
from one wide block outvoting the other eight.

**`before` filters before ranking.** It restricts the candidate pool, then
ranks, so `k` stays satisfiable, and a filtered list is *not* a subset of the
unfiltered one. Chants that were ranked out by later material rise into it.
Typicality is unaffected: it is always measured against the whole shipped
corpus (see [Profile and typicality](#profile-and-typicality)).

### Worked example — pooling a genus

Reproducing the rule in full. This gives the same numbers `census()` gives,
which is the point of printing it:

```js
import tonus, { CENSUS_GROUPS, CENSUS_ORDER } from "tonus";

const GROUPS = Object.keys(CENSUS_GROUPS);

const cosine = (a, b) => {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]; na += a[i] ** 2; nb += b[i] ** 2;
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
};

// Pool a set of chants into a centroid — per group, never the flat 221.
function centroid(ids) {
  const sums = Object.fromEntries(
    GROUPS.map((g) => [g, new Array(CENSUS_GROUPS[g].count).fill(0)]),
  );
  for (const id of ids) {
    const { profile } = tonus.census({ id, k: 0 });   // k: 0 — profile only
    for (const g of GROUPS) profile[g].values.forEach((v, i) => { sums[g][i] += v; });
  }
  for (const g of GROUPS) sums[g] = sums[g].map((v) => v / ids.length);
  return sums;
}

// Compare against it the same way: cosine per group, then the mean for `all`.
function similarity(id, c) {
  const { profile } = tonus.census({ id, k: 0 });
  const per = Object.fromEntries(GROUPS.map((g) => [g, cosine(profile[g].values, c[g])]));
  per.all = GROUPS.reduce((s, g) => s + per[g], 0) / GROUPS.length;
  return per;
}

// Every censused Communion, pooled — then: which Communion is most a Communion?
const ids = CENSUS_ORDER.filter((id) => tonus.cantus({ id })[0]?.office === "co");
const c = centroid(ids);                              // 178 chants
const ranked = ids
  .map((id) => ({ id, s: similarity(id, c) }))
  .sort((a, b) => b.s.all - a.s.all);

// 0.953  Quinque prudentes
// 0.951  Domus mea
// 0.944  Joseph fili David
//   …
// 0.746  Exiit sermo
// 0.735  Tollite hostias
```

The per-group breakdown is where the answer becomes legible. _Quinque
prudentes_ leads on `textual`, `cadenceMedial` and `trigram`, at about 0.99 on
each (it sets its text and turns its phrases the way Communions do), while its
`cadenceFinal` is only about 0.82, so the one thing it does unlike a typical
Communion is end. A chant is typical of its genus in some dimensions and not
others.

## Profile and typicality

Each group's `typicality` is its cosine against the corpus mean for that group:
1.0 is "uses this dimension exactly as the corpus does on average," lower means
"unlike the rest."

The two numbers above are a fair illustration. _Ab occultis meis_ is a mode-2
Gradual whose `modal` typicality is about 0.99, so modally it is a typical
mode-2 chant. Its `melodic` typicality is about 0.70, because its
interval
vocabulary is its own. One chant can be conventional in one dimension and
distinctive in another, which is the reason the groups are kept apart.

Typicality is always measured against the **whole shipped corpus**, never the
filtered pool: `before` restricts who may be a neighbor, it does not move
the mean.

## Balance — distance and deviance

```js
balance: { distance: 0.091, deviantGroups: ["degreeHist", "melodic"] }
```

`distance` is 1 minus the mean typicality across all groups: 0 is a chant at
the corpus mean, 1 has nothing in common with it.

`deviantGroups` names where a chant is unusual **relative to its own mean**,
most deviant first, not against an absolute threshold. The question it answers
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
melodic shape alone.

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

## The era view

```js
tonus.census({ id: "gregobase:1210", before: 1100 });
```

Restricts neighbors to chants a manuscript of the 11th century or earlier
already holds, 1,790 of the 2,186 candidates. This is the same rule as
[`cantus({ before })`](chant.md#the-repertoire-as-of-a-date--the-era-view),
through the same admissibility door: **evidence, not existence**, so a chant
with no dated witness is excluded rather than assumed old.

The seed chant itself is never filtered, because you asked about it by name.

## What the census is not

It is not a similarity search over Gregorian chant at large. The blocks
describe the chants tonus ships, which is the assignment-driven corpus: what
some day of the calendar calls for. A melody's neighbors are its neighbors
_within that repertoire_.
