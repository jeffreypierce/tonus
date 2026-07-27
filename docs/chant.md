# Chant

The chant engines retrieve the sung repertoire. `cantus` searches the
corpora at large and parses raw GABC; `proprium` supplies the Mass propers
of a feast; `ordinarium` the Kyriale settings appropriate to it;
`officium` the chants of the canonical hours; `psalmus` psalm and canticle
verses intoned to the psalm tones. Every melody is GABC-encoded and
carries page-level provenance back to its book.

- [Chant](#chant)
  - [The corpora](#the-corpora)
  - [The books — `corpus`](#the-books--corpus)
  - [Retrieval — `cantus`](#retrieval--cantus)
  - [The Mass propers — `proprium`](#the-mass-propers--proprium)
  - [The ordinary — `ordinarium`](#the-ordinary--ordinarium)
  - [The Office — `officium`](#the-office--officium)
  - [Matins nocturns — `matutinum`](#matins-nocturns--matutinum)
  - [Psalms — `psalmus`](#psalms--psalmus)
  - [Theory \& Context](#theory--context)
    - [The Solesmes restoration](#the-solesmes-restoration)
    - [GABC: neumes as text](#gabc-neumes-as-text)
    - [The Mass: proper and ordinary](#the-mass-proper-and-ordinary)
    - [The Office: the daily cursus](#the-office-the-daily-cursus)
    - [Psalm tones](#psalm-tones)

## The corpora

Five Solesmes books, extracted from
[GregoBase](https://gregobase.selapa.net/), joined by the Divinum Officium
propers, office, and psalter, plus the Nocturnale Romanum for the night office:

| Source | Book                   | Edition             | Chants |
| ------ | ---------------------- | ------------------- | ------ |
| `gr`   | Graduale Romanum       | Solesmes, 1961      | 1,344  |
| `lu`   | Liber Usualis          | Solesmes, 1961      | 2,377  |
| `la`   | Liber Antiphonarius    | Solesmes, 1960      | 1,422  |
| `lh`   | Liber Hymnarius        | Solesmes, 1983      | 361    |
| `am`   | Antiphonale Monasticum | Solesmes, 1934      | 1,429  |
| `nr`   | Nocturnale Romanum     | Sandhofe, 2002      | 1,564  |

The first four are the Roman repertoire; `am` is the monastic (Benedictine)
antiphonary — the 1934 Solesmes edition, which carries the same rhythmic markings
the score engine reads. `nr` is the Roman Matins repertoire (responsories,
antiphons) from the [Nocturnale Romanum](https://github.com/Nocturnale-Romanum/nocturnale-romanum)
community restitution — the source behind `matutinum`; see [Matins nocturns](#matins-nocturns--matutinum).

## The books — `corpus`

`corpus(code)` returns one book's bibliographic identity and a breakdown of what
it holds — how many chants, in what genres, in what modes.

```js
tonus.corpus("am");
// { code: "am", book: "Antiphonale Monasticum", fullTitle: null,
//   edition: "Pro Diurnis Horis", year: 1934, editor: "Solesmes",
//   scanSource: "Scans courtesy of Corpus Christi Watershed", count: 1429,
//   genera: [ { office: "an", genus: "Antiphona", count: 1045 }, … ],
//   modes:  [ { mode: "1", modus: "Modus I", count: 319 }, …,
//             { mode: null, modus: null, count: 58 } ] }
```

```ts
interface Corpus {
  code: ChantSource;
  book: string;                // short title
  fullTitle: string | null;    // full Latin title, where the edition records one
  edition: string | null;      // edition note, else null
  year: number | null;
  editor: string | null;
  scanSource: string | null;   // scan attribution
  count: number;               // chants tonus stores (after dedup)
  total: number | null;        // chants the book holds (before dedup); null if unmeasured
  unique: number | null;       // chants in this book alone; null if unmeasured
  shared: { code: ChantSource; count: number }[] | null; // shared per book, desc; null if unmeasured
  genera: { office: OfficeCode; genus: string; count: number }[]; // descending
  modes:  { mode: string | null; modus: string | null; count: number }[];
}
```

The metadata is drawn from GregoBase's own catalogue. The `genera` list is the
office distribution (descending by count); `modes` counts modes I–VIII, with a
final `mode: null` bucket for chants outside the eight modes (psalm tones and the
like) so the counts reconcile with `count`.

**Overlap.** tonus keeps one copy of each chant (the Liber Usualis is the primary
source; the Antiphonarius and Hymnarius fill gaps), so a book's stored `count`
undercounts what it holds. `total` is the full pre-dedup count, `unique` the
chants a book alone has, and `shared` how many it holds in common with each other
book (by GregoBase chant id). These reveal, for instance, that the Liber Usualis
is largely the Graduale and the Antiphonarius bound together (it shares hundreds
of chants with each), while the Antiphonale Monasticum is almost entirely its own.

Overlap is measured only for the GregoBase-sourced books. The Nocturnale (`nr`)
comes from a separate source, so its overlap is **unmeasured**: `total`, `unique`,
and `shared` are `null`, distinct from a measured zero, so a consumer never
mistakes "not compared" for "shares nothing".

## Retrieval — `cantus`

`cantus(query?)` searches across the corpora by id, incipit, mode, genre,
and source. Results sort by rank, then incipit; `limit` and `offset` page
through them.

```js
tonus.cantus({ mode: 1, office: "an", source: "gr", limit: 1 });
```

```js
[
  {
    id: "gregobase:1238",
    incipit: "Adoramus te Christe (Ant)",
    gabc: "(c4) A(c)do(d)rá(ixdh'!iv)mus(h) te…",
    office: "an",
    genus: "Antiphona",
    mode: "1",
    modus: "Modus I",
    pages: [{ page: "239A", sequence: 1, extent: 1 }],
    source: {
      book: "Graduale Romanum",
      year: 1961,
      editor: "Solesmes",
      code: "gr",
    },
  },
];
```

`cantus` also accepts raw GABC through the `gabc` field. The corpus is
bypassed and a single user `Chant` returns. The input may be a notation
body or a full GABC file (headers, `%%`, body); header values for `name`,
`mode`, and `office-part` are read automatically, and the `incipit`,
`mode`, and `office` query fields override them.

```js
// notation body
tonus.cantus({
  gabc: "(c4) Sán(g)ctus(h) Sán(g)ctus(h)",
  incipit: "Sanctus",
  mode: 1,
});

// full GABC file
tonus.cantus({
  gabc: "name: Sanctus;\nmode: 1;\n%%\n(c4) Sán(g)ctus(h) Sán(g)ctus(h)",
});
```

The `office` field is the genre code; `genus` carries the genre's Latin
name:

| `office` | `genus`   | `office` | `genus`      | `office` | `genus`            |
| -------- | --------- | -------- | ------------ | -------- | ------------------ |
| `an`     | Antiphona | `hy`     | Hymnus       | `rb`     | Responsorium Breve |
| `al`     | Alleluia  | `in`     | Introitus    | `se`     | Sequentia          |
| `ca`     | Canticum  | `of`     | Offertorium  | `tr`     | Tractus            |
| `co`     | Communio  | `ps`     | Psalmus      | `tp`     | Tonus Peregrinus   |
| `gr`     | Graduale  | `re`     | Responsorium | `or`     | Ordinarium         |

```ts
interface Chant {
  id: string;
  incipit: string;
  gabc: string;
  office: OfficeCode; // genre code
  genus: string; // Latin genre name, "Antiphona", "Introitus" …
  mode: string | null; // raw from source: "1"–"8", differentia forms ("2d", "8g"), "p"/"d"/"e" …
  modus: string | null; // Latin mode name, "Modus I"–"Modus VIII"
  pages: { page: string; sequence: number; extent: number }[];
  source: {
    book: string;
    year: number | null;
    editor: string | null;
    code?: ChantSource | "user";
    fullTitle?: string; // the book's full Latin title
    edition?: string;
    scanSource?: string; // scan attribution (GregoBase catalogue)
  };
}

interface CantusQuery {
  id?: string | string[];
  gabc?: string;
  incipit?: string;
  mode?: number | string | (number | string)[];
  office?: OfficeCode | OfficeCode[];
  source?: ChantSource | ChantSource[];
  before?: number; // only chants ATTESTED by this year (the era view)
  century?: number; // the same cutoff, spelled as a century (10 = the 900s)
  cursus?: "monastic" | "secular"; // transmission; `both` satisfies either
  limit?: number;
  offset?: number;
  sort?: "incipit" | "mode" | "id";
}
```

## The repertoire as of a date — the era view

`before: 1098` keeps only chants a manuscript of the 11th century or earlier
already holds. This is **evidence, not existence**: the dates come from
CANTUS's manuscript index, a terminus ante quem, so the filter answers "what
is attested by then," never "what existed then" — and a chant with no dated
witness is excluded rather than assumed old, because silence is not evidence
of age. CANTUS dates only to the century, so a year admits the centuries
that have CLOSED before it (`before: 1098` → through the 900s), and
`century: N` is exactly `before: N * 100` — one cutoff, two spellings.

The view is the analogue of
[`festum({ before })`](calendar.md#the-day-as-of-a-year--before) over the
calendar, and the two **compose**: a feast resolved under a view carries it,
and every day verb serves the same view unasked.

```js
const [easter] = tonus.festum({ date: new Date("2026-04-05"), before: 1100 });
tonus.proprium({ feast: easter }); // only propers attested by 1100
tonus.ordinarium({ feast: easter }); // the ordinary the view attests
```

What happens to a slot the view excludes differs by verb, on the rubric's
own logic: `ordinarium` **re-picks** — the Kyriale offers ranked
alternatives by design, so the rotation runs over the admissible pool and
the day still sings. `proprium`, `officium`, and `matutinum` have no pool
of alternatives, so an excluded chant **falls silent** — an empty slot
under a view is evidence speaking, not data missing. A `before`/`century`
given to a day verb directly overrides the feast's view; an invalid one
throws at every door.

## The Mass propers — `proprium`

`proprium(query?)` retrieves the chants whose texts change with the day:
Introitus, Graduale, Alleluia or Tractus, Offertorium, Communio. A feast
narrows the result to its own propers.

```js
const [feast] = tonus.festum({ date: new Date("2026-12-25") });
tonus.proprium({ feast, office: "in" });
// Puer natus est — Introitus, Modus VII, Liber Usualis p. 408
```

Coverage is 689 proper formularies. When a feast has no dedicated proper for a
slot, the Commune Sanctorum (formularies for classes of saints) supplies it
through 31 commune sets and 254 feast-to-commune mappings.

```ts
interface PropriumQuery extends CantusQuery {
  feast?: Feast | Feast[];
}
```

## The ordinary — `ordinarium`

`ordinarium(query?)` retrieves the fixed chants of the Mass from the
Kyriale. A feast drives mass selection through its `masses` list — the
masses the day's Kyriale RUBRIC appoints, derived as described in
[calendar.md](calendar.md#the-days-feasts--festum); `mass` pins a kyriale
number directly. Where the rubric names several masses, the year rotates
through them (same feast, same year → same answer, every time), and sibling
printings under one number (Mass I prints two dismissals; Mass XVII prints
Kyrie A/B/C) rotate with it. Slots resolve independently, which the book
licenses outright — "chants from one Mass may be used together with those
from others" — with one exception, the book's own: **"the Ferial Masses
excepted."** Under a ferial rubric the sung ordinary is not gathered from
several masses; only the dismissal travels.

```js
const [easter] = tonus.festum({ date: new Date("2026-04-05") });
tonus.ordinarium({ feast: easter });
// ky  Kyrie I       (mass 1) — Lux et origo, Paschal time, every year
// gl  Gloria I      (mass 1)
// cr  Credo III     (mass 3) — the credo rotates on its own cycle
// sa  Sanctus I     (mass 1)
// ag  Agnus Dei I   (mass 1)
// it  Ite Ia        (mass 1)
// va  Vidi aquam    (mass 0) — the Paschaltide sprinkling antiphon rides along
```

The **Gloria follows the day's rank rubric, not its season**: the ferial
masses print none (XVI, XVIII) and the penitential-Sunday mass none (XVII),
while a I-class feast inside Advent or Lent — the Immaculate Conception —
keeps its Gloria. At a Gloria-less Mass the dismissal is the Benedicamus
Domino, and a mass with no dismissal of its own borrows one exactly as the
book directs: "Benedicamus Domino **as in Mass II**" — so a green feria
sings Mass XVI whole with the Mass II Benedicamus. The ad libitum appendix
is a **solemnity boost**, reachable only under the festal rubrics (it takes
its turn in the rotation once every _n + 1_ years); it never reaches a
penitential day or a feria, and the Requiem settings stay out of every
calendar-driven pick (reachable by `ordinarium({ mass: 102 })` only). The
Triduum returns no ordinary at all: Good Friday has no Mass, and the
Vigil's ordinary belongs to Easter. A pinned `mass` overrides the Triduum
rule and the rotation both.

**Maundy Thursday** (In Cena Domini) is the Triduum's exception: it keeps a
full Mass with the Gloria, its ordinary fixed to Mass I (Lux et origo).

The sprinkle rite (aspersion before the principal Sunday Mass) is appended
and selected by season: **Vidi aquam** (`va`) in Paschaltide, **Asperges
me** (`as`) otherwise.

```js
tonus.ordinarium({ ordinary: "ky" }); // every Kyrie
tonus.ordinarium({ mass: 9, ordinary: "gl" }); // Gloria of Cum jubilo
```

| `ordinary` | `ordinarium`                                  |
| ---------- | --------------------------------------------- |
| `ky`       | Kyrie eleison                                 |
| `gl`       | Gloria                                        |
| `cr`       | Credo                                         |
| `sa`       | Sanctus                                       |
| `ag`       | Agnus Dei                                     |
| `be`       | Benedicamus                                   |
| `it`       | Ite missa est                                 |
| `as`       | Asperges (sprinkle rite, outside Paschaltide) |
| `va`       | Vidi aquam (sprinkle rite, Paschaltide)       |

```ts
interface OrdinaryChant extends Chant {
  ordinary: OrdinaryCode; // movement code
  ordinarium: string; // Latin movement name, "Kyrie eleison" …
  mass: number;
}

interface OrdinariumQuery extends CantusQuery {
  feast?: Feast | Feast[];
  ordinary?: OrdinaryCode;
  mass?: number;
}
```

## The Office — `officium`

`officium(query?)` retrieves the chants of a canonical hour; a feast acts
as a filter. Without an hour, every available hour returns.

```js
const christmas = tonus.festum({ date: new Date("2026-12-25") });
tonus.officium({ feast: christmas, hora: "laudes" });
// 7 chants, beginning: A solis ortus cardine (Hymnus)
```

| Hour                        | Content                                                                      |
| --------------------------- | ---------------------------------------------------------------------------- |
| `matutinum`                 | Invitatory, antiphons, hymn, responsories                                    |
| `laudes`                    | Antiphons, Benedictus antiphon, hymn                                         |
| `tertia` / `sexta` / `nona` | Ps 118 in course (Terce 33–80, Sext 81–128, None 129–176) + responsory breve |
| `vesperae`                  | Antiphons, Magnificat antiphon, hymn                                         |
| `prima`                     | The Prime ordo (sung parts) — see below                                      |
| `completorium`              | The full Compline ordo — see below                                           |

**Prime and Compline are ordos, not chant sets.** These two hours are
almost invariable: the same
sequence each day, varying only by season. They are assembled from a small
seasonal ordo and returned in liturgical order. With no feast, each resolves
for the [default epoch](index.md#dates).

```js
tonus.officium({ feast: christmas, hora: "completorium" });
// Deus in adjutorium → Ps 4, 30, 90, 133 → Te lucis → In manus tuas
// → Nunc dimittis → Alma Redemptoris (simple tone)
```

```ts
interface OfficiumQuery extends CantusQuery {
  feast?: Feast | Feast[];
  hora?: CanonicalHour;
  rite?: "romanum" | "monasticum"; // default "romanum"
}
```

### The monastic rite

`rite: "monasticum"` assembles the Benedictine cursus instead of the Roman.
The chants come from the Antiphonale Monasticum (`am` source); the psalmody
follows the monastic distribution (the little hours vary across the psalter by
weekday, and Compline is the three psalms 4, 90, 133 — the Roman rite adds Ps 30).
The two rites share a calendar, so the same feast query returns each rite's
proper office.

```js
tonus.officium({ feast: benedict, hora: "vesperae", rite: "monasticum" });
// the monastic Vespers antiphons, sourced from the Antiphonale Monasticum
```

Matins is served flat (its antiphons and responsories, no nocturn grouping); the
monastic three-nocturn / twelve-psalm structure is not yet modeled. A monastic
feast absent from the Roman calendar is reachable by its `feastId` but not by a
date query. For the Roman night office with its nocturn structure, see
`matutinum` below.

## Matins nocturns — `matutinum`

`officium({ hora: "matutinum" })` returns Matins as a flat chant list.
`matutinum(query?)` instead returns the night office as a `Matins` object.
Both rites are served, in different shapes — read `structured` before
trusting `nocturns`. The Roman rite is assembled nocturn-by-nocturn from
the Nocturnale (`structured: true`); the monastic rite comes from the flat
office-monastic table, so it returns the right chants in ONE nocturn
(`structured: false`) — the Benedictine three-nocturn / twelve-psalm
division is not modelled. It is a separate accessor — the flat `officium`
path is unchanged.

```js
const advent1 = tonus.festum({ date: new Date("2026-11-29") }); // Dominica I Adventus
const m = tonus.matutinum({ feast: advent1 });
// m.nocturns[0].responsories[0].incipit === "Aspiciens a longe"
// three nocturns of three responsories — the opening of the liturgical year
```

```ts
interface Matins {
  feastId: string;              // the tonus feast id resolved
  nomen: string;                // Latin name, e.g. "Dominica I Adventus"
  ritus: string;                // "I. classis - Semiduplex", "Feria", …
  structured: boolean;          // true = real nocturn division (Roman only)
  invitatorium: Chant | null;   // opens the hour, before the first nocturn
  hymnus: Chant | null;         // the Matins hymn, after the invitatory
  nocturns: Nocturn[];          // one (simple) or three (festal)
  redirectedFrom: string | null; // feast/commune the chants were borrowed from
}
interface Nocturn {
  n: number;                    // 1–3
  responsories: Chant[];        // the nocturn's great responsories, in order
  antiphons: Chant[];           // its antiphons, where present
}
```

The chants and structure come from the **Nocturnale Romanum** (`nr` source), the
only machine-readable Roman Matins — a community restitution built on Holger
Peter Sandhofe's 2002 edition, Hartker-derived, carrying episema/quilisma/mora
rhythmic markings. Every responsory resolves to full GABC.

A sanctorale feast with no proper Matins draws it from its commune, recorded
in `redirectedFrom` (`CONP` Common of a Confessor, `APEX` Common of Apostles, …):

```js
tonus.matutinum({ feast: tonus.festum({ date: new Date("2026-07-15") }) });
// S. Henrici — three nocturns via CONP; m.redirectedFrom === "CONP"
```

**Coverage.** The bridge from the Nocturnale's feast ids to the tonus calendar
covers the sanctorale (all months) and Advent today; the other temporal
seasons (Nativity, Lent, Passiontide, Paschaltide, after Pentecost) are not yet
mapped. A feast with no match in the queried rite's table returns `null`.
Note the Roman office's chants were largely cut from the shipped corpus
(the corpus is assignment-driven, Roman Mass + Benedictine Office), so
Roman Matins resolves only the chants kept for other reasons — degrading
to silence by the same evidence law as everywhere else.

## Psalms — `psalmus`

`psalmus(query?)` returns psalm and canticle verses as intoned chant:
GABC pointed to a psalm tone, modes 1–8 or the tonus peregrinus (mode 0).
`differentia` selects the cadential variant; `intonatio` controls whether
the opening formula is included, as it is for a psalm's first verse.
`inDirectum` recites a verse straight through to the termination with no
mediant, as a psalm sung without an antiphon; `solemn` uses a tone's
ornamented mediant where it has one. Canticles are addressed by name:
`benedictus`, `magnificat`, `nunc dimittis`, `benedicite`. (The Te Deum
is not psalmody — it carries its own melody and is not addressable here.)

```js
tonus.psalmus({ psalm: 109, verse: "1a", mode: 1 });
```

```js
[
  {
    incipit: "Dixit Dóminus Dómino meo:",
    modus: "Modus I",
    gabc: "(c4) (f)Di(h)xit (j)Dó(h)mi(h)nus (h)Dó(j)mi(h)no (g)me(h)o:(:) …",
  },
];
```

```js
tonus.psalmus({ psalm: 109, mode: 2, differentia: "6F" });
tonus.psalmus({ psalm: "benedictus", mode: 8, intonatio: false });
```

The tones and their differentiae follow the Graduale Romanum appendix; the
tone's anatomy as tuned pitches is available from
[`temperamentum.tonus()`](tuning.md#psalm-tones--tonus).

```ts
interface PsalmusQuery {
  psalm?: number | string;
  verse?: string;
  mode?: number;
  differentia?: string; // differentia code, e.g. "6F", "4e"
  intonatio?: boolean; // include opening intonation formula, default true
  inDirectum?: boolean; // recite straight through, no mediant
  solemn?: boolean; // use the ornamented solemn mediant where the tone has one
}
```

## Theory & Context

### The Solesmes restoration

The melodies in tonus are not medieval manuscripts. They are the Solesmes
editions, the scholarly restoration produced from the mid-19th century
onward and matured into the books listed under
[The corpora](#the-corpora). The 1961 Graduale, the last complete edition
before the post-conciliar reforms, covers the full Tridentine cycle the
calendar in [calendar.md](calendar.md) expects.

Every reading reflects editorial judgment (no single medieval church
sang precisely these books), but the Solesmes editions are the only
machine-readable representation of the whole Gregorian repertoire, and
the best available proxy for it.

### GABC: neumes as text

All melodies are encoded in GABC, the plain-text notation of the
[Gregorio](https://gregorio-project.github.io/) project: lyric syllables
each followed by a parenthesized note group, with pitch letters (`a`–`m`)
read against a clef declaration such as `(c4)`.

```
(c4) Pu(g)er(gh) na(hj)tus(j) est(j)
```

Melodic shapes are implicit in the letter groupings and define the neume
vocabulary in [tuning.md](tuning.md#neumes--neuma). Other marks carry the
Solesmes performance layer (episemas, the quilisma, liquescents, dots,
and divisiones) which the score engine reads into performance data and
phrase punctuation ([score.md](score.md#the-tabula)).

Because the encoding is textual, lyrics and neumes stay aligned syllable
by syllable, which is what lets `tonus.notatio` reconstruct syllables,
neumes, and prosody without images.

### The Mass: proper and ordinary

Two layers of chant make up a sung Mass, and tonus separates them exactly
as the books do:

- **The proper** (`tonus.proprium`) supplies the five processional and
  interlectionary chants whose texts change with the day: Introitus,
  Graduale, Alleluia (or Tractus in penitential seasons), Offertorium,
  Communio. When a feast lacks its own proper, the rite supplies one from
  the Commune Sanctorum, the shared formularies for classes of saints;
  this is why `proprium` falls back to commune sets.
- **The ordinary** (`tonus.ordinarium`) supplies the fixed texts sung at
  every Mass: Kyrie, Gloria, Credo, Sanctus, Agnus Dei, Ite or Benedicamus.
  Their melodies live in the **Kyriale**, eighteen numbered mass-settings
  plus ad libitum chants, each conventionally assigned to a class of day
  (Lux et origo for Paschaltide, Orbis factor for ordinary Sundays, the
  Missa de Angelis everywhere). Feast-aware mass selection follows those
  assignments.

### The Office: the daily cursus

The Divine Office (`tonus.officium`) supplies the eight canonical hours
that structure the liturgical day: Matutinum (the night office), Laudes
at dawn, the little hours of Prima, Tertia, Sexta, and Nona, Vesperae at
evening, and Completorium before sleep. The backbone of every hour is
psalmody: psalms and canticles framed by antiphons, with hymns and
responsories proper to the hour and the day. The eight-hour cursus is a
medieval inheritance intact in the Tridentine books; a 13th-century
cantor would recognize it immediately.

### Psalm tones

Psalm verses are not through-composed; they are _intoned_ on recitation
formulas (`tonus.psalmus`): one tone per mode, plus the wandering
**tonus peregrinus** with its two tenors (sung to _In exitu Israel_).
Each tone has a fixed anatomy: an **intonatio** (the opening rise, sung
for the first verse), recitation on the **tenor**, a **mediatio** cadence
at the verse's colon, recitation again, and a **terminatio** cadence.

Terminations come in variants, the **differentiae** (`"6F"`, `"4e"`, …),
whose purpose is practical: ending the verse on a pitch that leads
smoothly back into the antiphon's opening. The tones and differentiae in
tonus follow the Graduale Romanum appendix (Toni Communes), keyed by the
same codes Divinum Officium uses. The gamut-level mechanics, tenor and
finalis per mode, are on the tuning page
([tuning.md](tuning.md#modes--modus)).

## Sources

Sources for this page are in the central [bibliography](../BIBLIOGRAPHY.md):
`gregobase` (the five Solesmes books), `nocturnale-romanum`, `divinum-officium`,
`graduale-toni-communes`, `gregorio-gabc`, `versus-psalmorum`, `apel-chant`,
`hiley-plainchant`, `treitler-voice-pen`, `saulnier-guide`, `pierik-spirit`,
`burkard-manual`, `kelly-capturing`.
