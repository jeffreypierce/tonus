# Census

`census` measures one chant against the corpus that holds it: how typical it
is, where it is unusual, and what it is near. It reads the blocks the corpus
pipeline baked and does arithmetic over them; it mines nothing. The chant can
be one tonus ships, named by `id`, or any notated score, measured by the same
formula the bake ran.

- [Censusing a chant — `census`](#censusing-a-chant--census)
- [Reading the profile — `profile`](#reading-the-profile--profile)
  - [What a block holds](#what-a-block-holds)
  - [How a block is measured](#how-a-block-is-measured)
  - [Typicality](#typicality)
- [Measuring balance — `balance`](#measuring-balance--balance)
- [Finding neighbors — `by` and `k`](#finding-neighbors--by-and-k)
  - [Ties](#ties)
- [Restricting to an era — `before`](#restricting-to-an-era--before)
- [Censusing a composed chant — `score`](#censusing-a-composed-chant--score)
- [Pooling blocks — the distance rule](#pooling-blocks--the-distance-rule)
  - [Reading the numbers](#reading-the-numbers)
  - [Worked example: pooling a genus](#worked-example-pooling-a-genus)
- [Theory & Context](#theory--context)
- [Sources](#sources)

## Censusing a chant — `census`

```js
tonus.census({ id: "gregobase:1210" }); // Ab occultis meis, Graduale, mode 2
```

One call returns the profile, the balance and the neighbors:

```js
{
  id: "gregobase:1210",
  by: "all",
  profile: {
    modal:         { values: [...12],  typicality: 0.99 },
    degreeHist:    { values: [...15],  typicality: 0.61 },
    melodic:       { values: [...121], typicality: 0.68 },
    trigram:       { values: [...16],  typicality: 0.99 },
    cadenceFinal:  { values: [...16],  typicality: 0.09 },
    cadenceMedial: { values: [...16],  typicality: 0.89 },
    chironomy:     { values: [...6],   typicality: 0.99 },
    textual:       { values: [...7],   typicality: 0.98 },
  },
  balance: {
    distance: 0.222,
    deviantGroups: ["cadenceFinal", "degreeHist", "melodic"],
  },
  neighbors: [
    { id: "gregobase:1261", similarity: 0.999 }, // Requiem, Graduale, mode 2
    …
  ],
}
```

```ts
interface CensusQuery {
  id?: string; // a censused chant, or…
  score?: Score; // …any notated chant (exactly one of the two)
  k?: number; // how many neighbors, default 8; 0 returns none
  by?: CensusBy; // the field group similarity is measured on, default "all"
  before?: number; // restrict neighbors to chants attested by this year
}

interface Census {
  id: string;
  by: CensusBy;
  profile: Record<CensusGroup, { values: number[]; typicality: number }>;
  balance: { distance: number; deviantGroups: CensusGroup[] };
  neighbors: { id: string; similarity: number }[];
}
```

The census covers **7,718 of the 7,825 chants tonus ships**, one block per
chant. The 107 without a block are the _Toni Communes_ (office `or`): the
recitation formulas, among them 46 _Benedicamus Domino_ settings. A formula is
one gesture set to many texts, so a block per setting would weight the corpus
mean toward a tone. `cantus` still finds them; [`CENSUS_ORDER`](index.md#the-appendix)
lists every censused id.

An id with no block throws. An empty answer would read as "this chant is unlike
everything," which is a different claim. A chant outside the corpus is
censused by its score instead; see [censusing a composed
chant](#censusing-a-composed-chant--score).

`census` throws on an unknown query key, an unknown field group, a `k` that is
not a non-negative integer, and a query with both or neither of `id` and
`score`.

## Reading the profile — `profile`

`profile` holds, for each field group, the chant's own values and their
typicality against the corpus mean.

### What a block holds

The corpus pipeline censuses every censused chant into 221 float32s, grouped by
what they describe:

| group           | floats | slots                                                                                                   |
| --------------- | -----: | ------------------------------------------------------------------------------------------------------- |
| `modal`         |     12 | affinity to each of the eight modes (normalized to sum to 1), final pitch class, tenor pitch class (−1 when none), ambitus in semitones, margin of the leading affinity over the second |
| `degreeHist`    |     15 | time spent on each scale degree, final-relative and octave-aware, by duration                           |
| `melodic`       |    121 | the step-bigram table: which diatonic step follows which, steps clipped to ±5                           |
| `trigram`       |     16 | three-step motifs, against the corpus's fifteen commonest; slot sixteen is every other motif            |
| `cadenceFinal`  |     16 | the chant's closing cadence, by genus, against the fifteen commonest                                    |
| `cadenceMedial` |     16 | its interior phrase-ends, by the same genus vocabulary                                                  |
| `chironomy`     |      6 | mean pitch above the final in each quarter of the chant, notes per phrase, notes per syllable           |
| `textual`       |      7 | the five vowels by sung duration, accented share of sung duration, cadential melisma (mean notes on each phrase's final syllable) |

Four more fields ride in the block and are not similarity dimensions: `flags`
(a bitfield), `attest` (dating, which is what `before` reads), `extras`, and
`reserve`. `by` does not accept them.

The trigram and cadence keys are in
[`CENSUS_DICTIONARIES`](index.md#the-appendix), commonest first.

### How a block is measured

Every number in a block reads off one `notatio()` parse at its default options,
the same parse `score` returns, so the census agrees with the library about
what a chant is. Each float is a named measurement, not a learned one: time
spent on the subfinal, how often a rising second follows a falling third.

Five groups are distributions summing to 1 (`degreeHist`, `melodic`,
`trigram`, `cadenceFinal`, `cadenceMedial`). They say where the melody's time
or motion goes, not how much of it there is. The other three mix normalized
slots with raw scalars: `modal` carries the final, the tenor and the ambitus;
`chironomy` carries notes per phrase and notes per syllable; `textual` carries
the cadential melisma. Those scalars are not bounded by 1, and they set most
of their group's length (see [typicality](#typicality)).

The trigram and cadence groups count against dictionaries mined from the
corpus itself, so the corpus supplies the vocabulary and the chant supplies
the usage.

The reference is the mean block over all 7,718 censused chants, group by group.
Each chant's slots are already per-chant figures (a distribution or a scalar),
so the mean is an unweighted average of chant profiles: every chant one vote,
whatever its length. It is not the distribution of the pooled durations or
counts. A season's blocks, averaged the same way, give the mean profile of its
chants, not the profile of its notes taken together.

### Typicality

Each group's `typicality` is its cosine against the corpus mean for that
group. 1.0 is "in the same proportions as the corpus average"; lower is
"unlike the rest."

For a distribution group the reading is direct. _Ab occultis meis_ has
`melodic` typicality 0.68 and `degreeHist` 0.61: its step vocabulary and the
degrees it dwells on are its own. Its `cadenceFinal` typicality is 0.09, because
its final close falls in a genus few chants end with.

For the three mixed groups the scalars dominate. Across the corpus the eight
mode affinities hold about 0.1% of the `modal` group's squared length; the
ambitus holds about two thirds of it, and the final and tenor pitch classes the
rest. Notes per phrase holds about four fifths of `chironomy`, and the
cadential melisma about the same share of `textual`. A `modal` typicality of
0.99 therefore says that the chant's final, tenor and ambitus stand in the
corpus's proportions. It says almost nothing about its modal affinity. This is
a known limitation of the baked block layout, recorded in [Theory &
Context](#the-scalar-slots).

Typicality is always measured against the whole censused corpus, never the
filtered pool: `before` restricts who may be a neighbor and leaves the mean
where it is.

## Measuring balance — `balance`

```js
tonus.census({ id: "gregobase:1210", k: 0 }).balance;
// { distance: 0.222, deviantGroups: ["cadenceFinal", "degreeHist", "melodic"] }
```

`distance` is 1 minus the mean typicality across the eight groups. 0 is a chant
at the corpus mean; 1 has nothing in common with it.

`deviantGroups` names the groups whose typicality falls below the chant's own
mean typicality, most deviant first. The measure is relative to the chant, not
an absolute threshold, so it names where a chant departs from itself whether it
is unusual everywhere or nowhere. Equal typicalities order by group name.

## Finding neighbors — `by` and `k`

```js
tonus.census({ id: "gregobase:1210", k: 3 }).neighbors;
// [
//   { id: "gregobase:1261", similarity: 0.999 }, // Requiem          Graduale, mode 2
//   { id: "gregobase:34",   similarity: 0.997 }, // Justus ut palma  Graduale, mode 2
//   { id: "gregobase:834",  similarity: 0.991 }, // Angelis suis     Graduale, mode 2
// ]
```

`neighbors` are the nearest censused chants, nearest first. A chant is never
its own neighbor. The census is told neither genre nor mode; the three nearest
to a mode-2 Gradual are mode-2 Graduals.

`by` changes what _near_ means. On `"all"` (the default) similarity is the
equal-weight mean of the eight per-group cosines. On a group name it is that
group's cosine alone:

```js
tonus.census({ id: "gregobase:1210", k: 3, by: "cadenceFinal" }).neighbors;
// [
//   { id: "gregobase:1",   similarity: 1 }, // Laudem Domini   Alleluia, mode 1
//   { id: "gregobase:10",  similarity: 1 }, // Quid bonum      Alleluia, mode 3
//   { id: "gregobase:101", similarity: 1 }, // Loquebantur     Alleluia, mode 1
// ]
```

Asked on `cadenceFinal`, the Gradual finds Alleluias in other modes that close
in the same genus. The two answers are answers to different questions.

`k` bounds the result. The default is 8; `0` returns none; a `k` larger than
the corpus returns all 7,717 others.

### Ties

Equal similarities order by id, compared as strings (so `gregobase:10` comes
before `gregobase:9`). The order inside a tie class is that rule, not a
ranking. On a narrow group ties are large: `cadenceFinal` is one close per
chant, so its similarity is nearly always 1 or 0. The three neighbors above are
the first three ids of the 234 chants that tie at 1, and 7,122 chants tie at 0.

## Restricting to an era — `before`

```js
tonus.census({ id: "gregobase:1210", k: 10000, before: 1100 }).neighbors.length;
// 5449 (of 7,717 without the filter)
```

`before` restricts neighbors to chants a manuscript dated before that year
already holds. It is the rule of
[`cantus({ before })`](chant.md#the-repertoire-as-of-a-date--the-era-view),
through the same admissibility test: evidence, not existence. A chant with no
dated witness is excluded rather than assumed old.

The filter runs before ranking, so `k` stays satisfiable, and a filtered list
is not a subset of the unfiltered one: chants ranked out by later material rise
into it. The seed chant itself is never filtered, and typicality is unaffected.

## Censusing a composed chant — `score`

```js
tonus.census({ score: tonus.notatio(composed), k: 3 });
```

A block is a function of one parse. The corpus ran that function over every
censused chant, and tonus carries the same function, so a score the corpus never
saw is measured as one it did: the same eight groups, counted against the same
two dictionaries, compared with the same corpus mean, with neighbors drawn from
the same blocks. `by`, `k` and `before` mean what they mean for an id. The test
suite holds the function to every shipped block, bit for bit.

The function reads the chant at `notatio`'s defaults. The census re-reads
`score.chant` with no options, so knobs or a `temperamentum` passed to
`notatio` do not move the answer, and a shipped chant's score censuses exactly
as its id does.

The answer's `id` is `score.chant.id`. A score whose chant has no id throws,
because a census has to say what it measured.

## Pooling blocks — the distance rule

The census answers about one chant at a time. Grouping ("all Communions," "this
season," "this manuscript") is the caller's. A caller who pools blocks computes
a distance, and a distance computed by another rule disagrees with `census()`
without any error. The rule:

1. Cosine per field group, never over the flat 221.
2. `by: "all"` is the equal-weight mean of the per-group cosines: every group
   one vote, no tunable weights.
3. Two all-zero vectors have cosine 1 (they agree about a dimension both leave
   empty); one all-zero vector against a non-zero one has cosine 0.
4. Ties order by id, compared as strings.

Cosine over the flat 221 is decided by magnitude. The unnormalized scalars
(ambitus, final and tenor pitch class, notes per phrase) carry nearly all of the
flat vector's length, and the five distribution groups together hold under 1%
of it. A flat cosine therefore compares ranges and phrase lengths. Per-group
cosine asks about shape within each group, though inside the three mixed groups
the same scalars still lead (see [typicality](#typicality)).

[`CENSUS_GROUPS`](index.md#the-appendix) gives the group names, offsets and
widths, and [`CENSUS_ORDER`](index.md#the-appendix) every censused id.

### Reading the numbers

Similarity is not comparable across `by` values. A 0.94 on `cadenceFinal` and a
0.94 on `melodic` are not the same amount of alike: the groups have different
widths and different natural spreads. Rank within one `by`; never threshold
across two.

A centroid is pooled per group, then compared per group. Averaging the flat
221 and taking one cosine is the mistake rule 1 excludes.

### Worked example: pooling a genus

This reproduces the rule in full, and gives the numbers `census()` would give
for a pooled set:

```js
import tonus, { CENSUS_GROUPS, CENSUS_ORDER } from "tonus";

const GROUPS = Object.keys(CENSUS_GROUPS);

const cosine = (a, b) => {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]; na += a[i] ** 2; nb += b[i] ** 2;
  }
  if (!na && !nb) return 1; // both empty: they agree
  if (!na || !nb) return 0; // one empty: nothing shared
  return dot / Math.sqrt(na * nb);
};

// Pool a set of chants into a centroid, per group, never the flat 221.
function centroid(ids) {
  const sums = Object.fromEntries(
    GROUPS.map((g) => [g, new Array(CENSUS_GROUPS[g].count).fill(0)]),
  );
  for (const id of ids) {
    const { profile } = tonus.census({ id, k: 0 }); // k: 0, profile only
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

// Every censused Communion, pooled: which Communion is most a Communion?
const ids = CENSUS_ORDER.filter((id) => tonus.cantus({ id })[0]?.office === "co");
const c = centroid(ids); // 247 chants
const ranked = ids
  .map((id) => ({ id, s: similarity(id, c) }))
  .sort((a, b) => b.s.all - a.s.all);

// 0.947  Quinque prudentes
// 0.945  Cum invocarem te
// 0.944  Dominus firmamentum
//   …
// 0.732  Exiit sermo
// 0.728  Surrexit Dominus et apparuit
```

The per-group breakdown shows where the answer comes from. _Quinque prudentes_
stands at 0.998 on `textual`, 0.995 on `trigram` and 0.989 on `chironomy`; its
lowest group is `cadenceMedial`, at 0.802. It uses the Communions' common
motifs and ends as they end, and its interior phrases land less as theirs do.

Pooled and compared over the flat 221 instead, the same 247 chants give a
different winner (_Dominus Jesus_), and the field compresses: the top ten span
0.988 to 0.982 and the median is 0.959, where per group the top ten span 0.947
to 0.936 and the median is 0.879. The compression is the magnitude effect
under rule 1: the flat cosine is mostly comparing ambitus and phrase length.

## Theory & Context

### What the census is not

It is not a similarity search over Gregorian chant at large. The blocks
describe the chants tonus ships, which is the shelf: the Solesmes books and the
_Nocturnale Romanum_ as they print, whether or not a day of the calendar calls
for them. A melody's neighbors are its neighbors within that repertoire.

The census is cited, not run. The blocks, the two dictionaries and the
attestation dates are generated by the corpus pipeline and ship as data with
provenance; the library computes only per-chant arithmetic over them, the
analysis boundary that keeps corpus-scale calibration out of tonus.

### The scalar slots

The block layout puts raw scalars beside normalized slots inside three groups.
In `modal` the ambitus (around 13 semitones) and the two pitch classes (0 to
11) outweigh eight affinities that sum to 1; in `chironomy` notes per phrase
(around 16) outweighs the quarter means; in `textual` the cadential melisma
outweighs the vowel shares. Cosine on such a group mostly measures its largest
scalar. The per-group rule keeps that effect inside its group, and `by: "all"`
gives it one vote of eight, but the typicality of `modal`, `chironomy` and
`textual` is not a reading of the slots their names suggest. The remedy is a
change to the block itself (scaled or separated scalars), which is a re-bake in
the corpus pipeline, not arithmetic tonus can do over the shipped blocks.

### Why the formulas stand outside

The _Toni Communes_ are the recitation formulas the books print: tones for
_Benedicamus Domino_, the _Gloria Patri_, _Deus in adjutorium_, the prayers,
the Gospel and the Preface. Each is a fixed melodic gesture applied to many
texts or ranks. Counting each setting as a chant would make one gesture many votes in
the corpus mean and fill the neighbor lists with near-copies of each other.

## Sources

Sources for this page are in the central [bibliography](https://github.com/jeffreypierce/tonus/blob/main/BIBLIOGRAPHY.md):
`gregobase`, `nocturnale-romanum`, `graduale-toni-communes`.
