# Chant

The chant engines retrieve the sung repertoire. `cantus` searches the
corpora at large and parses raw GABC; `proprium` supplies the Mass propers
of a feast; `ordinarium` the Kyriale settings appropriate to it;
`officium` the chants of the canonical hours; `psalmus` psalm and canticle
verses intoned to the psalm tones. Every melody is GABC-encoded and
carries page-level provenance back to its book.

- [Chant](#chant)
  - [The corpora](#the-corpora)
    - [The shelf is the books](#the-shelf-is-the-books)
  - [The books — `corpus`](#the-books--corpus)
    - [What the book holds — `full`](#what-the-book-holds--full)
  - [Retrieval — `cantus`](#retrieval--cantus)
    - [Reaching the ordinary — `ordinary`](#reaching-the-ordinary--ordinary)
    - [On chant ids](#on-chant-ids)
  - [The repertoire as of a date — the era view](#the-repertoire-as-of-a-date--the-era-view)
  - [The Mass propers — `proprium`](#the-mass-propers--proprium)
  - [The ordinary — `ordinarium`](#the-ordinary--ordinarium)
  - [The Office — `officium`](#the-office--officium)
    - [One cursus, the Benedictine](#one-cursus-the-benedictine)
  - [Psalms — `psalmus`](#psalms--psalmus)
  - [Theory \& Context](#theory--context)
    - [The Solesmes restoration](#the-solesmes-restoration)
    - [GABC: neumes as text](#gabc-neumes-as-text)
    - [The Mass: proper and ordinary](#the-mass-proper-and-ordinary)
    - [The Office: the daily cursus](#the-office-the-daily-cursus)
    - [Psalm tones](#psalm-tones)

## The corpora

Six Solesmes books, extracted from
[GregoBase](https://gregobase.selapa.net/), joined by the Divinum Officium
propers, office, and psalter, plus the Nocturnale Romanum for the night office:

| Source | Book                    | Edition        | Chants |
| ------ | ----------------------- | -------------- | ------ |
| `gr`   | Graduale Romanum        | Solesmes, 1961 | 1,373  |
| `lu`   | The Liber Usualis       | Solesmes, 1961 | 2,446  |
| `la`   | Liber antiphonarius     | Solesmes, 1960 | 2,506  |
| `lh`   | Liber Hymnarius         | Solesmes, 1983 | 361    |
| `am`   | Antiphonale Monasticum  | Solesmes, 1934 | 1,448  |
| `psm`  | Psalterium Monasticum   | Solesmes, 1981 | 60     |
| `nr`   | Nocturnale Romanum      | Sandhofe, 2002 | 1,549  |

**7,825 chants in all**, the Mass ordinary among them (120 settings, reached by
[`ordinary`](#reaching-the-ordinary--ordinary) rather than by book). That is the
books themselves: tonus carries what they print, whether or not the calendar
reaches it.

The seven books list 9,743 rows for those 7,825 chants: a melody printed in two
books is stored once and listed under each, with each book's own page citation.

`am` and `psm` are the monastic (Benedictine) books; the rest are
Roman. Every book here bears the rhythmic markings the score engine reads; that
is the admission rule. `nr` is the night-office repertoire (responsories,
antiphons) from the
[Nocturnale Romanum](https://github.com/Nocturnale-Romanum/nocturnale-romanum)
community restitution, admitted because it carries those marks too.

### The shelf is the books

The corpus was **assignment-driven** until 2026-08-31: a chant shipped only when
some day of the liturgical year called for it, and 10,156 book chants became
2,187. That gate is gone. The shelf now carries the books whole.

The reason is that the gate answered four questions with one silence. A chant
absent from the shelf might be genuinely superseded repertoire, or printed in an
edition the calendar does not address, or proper to a sanctorale the calendar
does not enumerate, or simply missed by the matcher that places texts on days —
and nothing downstream could tell those apart, because the chant was not there
to ask about. Worse, the population every `census` measurement was taken against
was itself the product of that gate, so "how typical is this chant" quietly meant
"how typical among the chants one rite happened to call for".

Whether a day calls for a chant is now a question for the day verbs — `festum`,
`proprium`, `officium` — which answer it directly and say what their tables
hold. It is not a filter on the shelf. `cantus` and `corpus` ask what the books
print; that a chant has no day to be sung on is a fact about the calendar, not a
reason it should be unfindable.

## The books — `corpus`

`corpus(code)` returns one book's bibliographic identity and a breakdown of what
it holds: how many chants, in what genres, in what modes. `corpus({ book })` is
the same question in the query form every other verb uses; both spellings return
one answer.

`corpus()` with no argument returns **the whole shelf**, the rollup plus every
book's ledger:

```js
tonus.corpus();
// { count: 7825,      // chants tonus holds, each counted once
//   listings: 9743,   // rows on the shelf — a chant in two books appears twice
//   total: 9796,     // what the books hold, before dedup
//   genera: [ { office: "an", genus: "Antiphona", count: 3963 }, … ],
//   modes:  [ { mode: "1", modus: "Modus I", count: 1505 }, … ],
//   books:  [ …7 Corpus entries, in registry order ] }
```

**`count` is the number of chants**, the one to quote. `listings` is how long
the shelf is: a melody printed in several books is stored once and listed under
each, so the shelf runs longer than the repertory. The breakdowns describe the
same population `count` does, so `genera` and `modes` sum to it.

```js
tonus.corpus("am");
// { code: "am", book: "Antiphonale Monasticum", fullTitle: null,
//   edition: "Pro Diurnis Horis", year: 1934, editor: "Solesmes",
//   scanSource: "Scans courtesy of Corpus Christi Watershed", count: 1448,
//   genera: [ { office: "an", genus: "Antiphona", count: 1045 }, … ],
//   modes:  [ { mode: "1", modus: "Modus I", count: 320 }, …,
//             { mode: null, modus: null, count: 63 } ] }
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
  full: { total: number; genera: GenusCount[]; modes: ModeCount[] } | null; // the pre-cut tally (below); null if unmeasured
}
```

### What the book holds — `full`

Every `Corpus` carries `full`: what the book holds in GregoBase's catalogue, in
the same genera/modes shape as the shipped counts.

```js
const am = tonus.corpus("am");
am.count;             // 1448 — chants tonus lists under the Antiphonale
am.full.total;        // 1456 — what GregoBase catalogues for the book
am.genera[0];         // { office: "an", genus: "Antiphona", count: 1045 }
am.full.genera[0];    // { office: "an", genus: "Antiphona", count: 1049 }
```

The two now sit close, because the shelf carries the book rather than a
selection from it. What remains between them is what the extractor drops for
reasons of its own — a chant GregoBase marks as a duplicate of another, or one
whose GABC will not parse — not a liturgical judgement.

Only the extractor can measure `full`. By the time tonus loads, its record is
one per chant, so the catalogue tally is read from an artifact rather than
derived. Every shelved book reports one, including the Nocturnale, whose tally
comes from its own extract rather than from GregoBase.

The metadata is drawn from GregoBase's own catalogue. The `genera` list is the
office distribution (descending by count); `modes` counts modes I–VIII, with a
final `mode: null` bucket for chants outside the eight modes (psalm tones and the
like) so the counts reconcile with `count`.

**Overlap.** tonus stores one copy of each chant — the Liber Usualis owns the
record where several books print it — but LISTS it under every book that does,
so `count` is what a book prints rather than what it happens to store. `total` is the full pre-dedup count, `unique` the
chants a book alone has, and `shared` how many it holds in common with each other
book (by GregoBase chant id). These reveal, for instance, that the Liber Usualis
is largely the Graduale and the Antiphonarius bound together (it shares hundreds
of chants with each), while the Antiphonale Monasticum is almost entirely its own.

The Nocturnale (`nr`) is compared differently, because it has no GregoBase
catalogue: its counts come from its own extract, and it shares **nothing**, so
`unique` is all 1,549 chants it holds. That is a measurement, not a gap. The
nocturnale–GregoBase crosswalk is a route to metadata, not a claim that the two
books print the same chant, so it does not count as sharing.

The `null` those fields can still carry means **unmeasured**, distinct from a
measured zero, so a consumer never mistakes "not compared" for "shares
nothing".

## Retrieval — `cantus`

`cantus(query)` searches across the corpora by id, incipit, mode, genre,
and source. Results sort by incipit (or by `mode` or `id`, as `sort` asks);
`limit` and `offset` page through them.

A query must name something to find. An empty query throws, and so does one
whose every filter is empty (`{ sort: "id" }`, `{ incipit: "" }`): no search
ran, and the whole shelf is [`corpus()`](#the-books--corpus). An unknown key
throws, and so does a value outside its vocabulary (`sort`, `cursus`, an
`ordinary` code).

```js
tonus.cantus({ mode: 1, office: "an", source: "am", limit: 1 });
```

```js
[
  {
    id: "gregobase:8739",
    incipit: "Ad Jesum autem",
    gabc: "(c4) AD(d) Je(d)sum(f') au(d)tem(dc) *() cum(f) ve(g)nís(f_h)sent,(h.) (;)…",
    office: "an",
    mode: "1",
    books: ["am"],
    pages: [{ page: "570", sequence: 1, extent: 1 }],
    source: {
      book: "Antiphonale Monasticum",
      fullTitle: null,
      edition: "Pro Diurnis Horis",
      year: 1934,
      editor: "Solesmes",
      scanSource: "Scans courtesy of Corpus Christi Watershed",
      code: "am",
    },
    genus: "Antiphona",
    modus: "Modus I",
    cantusId: null,
  },
];
```

The Graduale is the Mass book and prints few antiphons (45 in all), so the
same query against `source: "gr"` returns 8.

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
| `an`     | Antiphona | `hy`     | Hymnus       | `se`     | Sequentia          |
| `al`     | Alleluia  | `in`     | Introitus    | `tr`     | Tractus            |
| `ca`     | Canticum  | `of`     | Offertorium  | `tp`     | Tropa              |
| `co`     | Communio  | `ps`     | Psalmus      | `or`     | Toni Communes      |
| `gr`     | Graduale  | `re`     | Responsorium | `ky`     | Kyriale            |
| `im`     | Improperia| `rb`     | Responsorium Breve | `va` | Varia             |
| `ap`     | Antiphona ad psalmum | `av` | Antiphona votiva | `ae` | Antiphona in evangelio |
| `pa`     | Prosa     | `su`     | Supplicatio  |          |                    |

The labels are GregoBase's own vocabulary (`$txt['usage']`), not tonus's
gloss. Three were corrected in 0.10.0: `tp` reads **Tropa** (it had said
"Tonus Peregrinus"), `or` reads **Toni Communes** (it had said "Ordinarium"),
and `pa` reads **Prosa**. `ky` is the Mass ordinary's roll-up genus — the
part itself rides `ordinary` (`ke`, `gl`, `cr`, …), and `va` is the
catch-all for a chant whose office-part tonus does not recognise.

`ap`, `av` and `ae` are not GregoBase's. They name the finer antiphon
classes the Roman books distinguish (to a psalm, votive, to the Gospel), and
no book tonus ships marks them yet. A source that has them supplies them.

```ts
interface Chant {
  id: string; // "gregobase:1210", "nocturnale:E1F2R3" — see below
  incipit: string;
  gabc: string;
  office: OfficeCode; // genre code
  genus: string; // Latin genre name, "Antiphona", "Introitus" …
  mode: string | null; // raw from source: "1"–"8", differentia forms ("2d", "8g"), "p"/"d"/"e" …
  modus: string | null; // Latin mode name, "Modus I"–"Modus VIII"; "1T" reads "Modus I transpositus"
  cantusId?: string | null; // Cantus Database id, where one is known — see below
  books: (ChantSource | "user" | "ky")[]; // every book that prints it
  pages: { page: string; sequence: number; extent: number }[]; // the presented book's

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
  ordinary?: OrdinaryCode | OrdinaryCode[]; // a part of the Mass ordinary
  before?: number; // only chants ATTESTED by this year (the era view)
  cursus?: "monastic" | "secular"; // transmission; `both` satisfies either
  limit?: number;
  offset?: number;
  sort?: "incipit" | "mode" | "id";
}
```

`cantusId` links a chant to the [Cantus Database](https://cantusdatabase.org).
On the Gregorian books it is the id the attestation data was read from (the
era view's `before`), which is a text match against Cantus, not a citation
printed in the book. Where a source names its own id, the record carries that
one. About 6,100 of the shelf's chants have one. A chant parsed from raw GABC,
or a psalm verse pointed at request time, reports `null`. Every chant tonus
returns sets the field; it is optional only on a `Chant` a caller builds by
hand.

### Reaching the ordinary — `ordinary`

The Mass ordinary is addressable but not shelved. `ordinary` is the door:

```js
tonus.cantus({ ordinary: "ke" });            // all 31 Kyries
tonus.cantus({ ordinary: "gl", mode: 4 });   // mode-4 Glorias
tonus.cantus({ ordinary: ["as", "va"] });    // the sprinkle antiphons
```

The Kyriale is a **partition of the Graduale**, so it is not a `source` and not
a row in the shelf. It stays nameable by `id` and by the part of the Mass it
belongs to.

It is not a book, but it is **printed in** books, and it says which: every
ordinary chant carries `books: ["lu", "gr"]` and the Graduale's and the Liber
Usualis's pages, so it can be cited like anything else on the shelf.

```js
tonus.cantus({ id: "gregobase:31", source: "gr" })[0].pages; // [{ page: "28*", … }]
tonus.cantus({ id: "gregobase:31", source: "lu" })[0].pages; // [{ page: "37",  … }]
```

`source` stays `ky` when no book is named — the note a singer holding the
Kyriale would want — and `ky` is still absent from the book registry.

A plain search does not sweep it in: `{ mode: 5 }` returns the shelf. Ask for a
Kyrie and you get Kyries.

For the setting a given DAY calls for, [`ordinarium`](#the-ordinary--ordinarium)
is the verb, and it applies the Kyriale's own rubrics. This is flat retrieval.

### On chant ids

An id's prefix names **the catalogue the identifier came from**, not the book
the chant is printed in, and not a claim about who the melody belongs to. A
chant carrying `gregobase:1210` is a Solesmes book chant that GregoBase happens
to have catalogued; the corpus is assembled from seven books, and GregoBase is
one source among several.

The prefix is therefore **not a namespace you can query against**. GregoBase
holds 18,148 chants; tonus ships 6,160 of them (34%), the ones the six
Solesmes books on the shelf print, so an id copied from the GregoBase site may
return `[]` here. That is not a lookup failure; it means none of the books on
the shelf prints that chant. The two prefixes in the
shipped corpus are `gregobase:` (6,160) and `nocturnale:` (1,549), the latter
carrying the Nocturnale's own alphanumeric keys rather than numbers.

Within tonus an id is exactly one chant. A melody printed in several books is
stored once, under the record `cantus({ id })` returns, so `id` is a stable key
to a chant rather than to a printing.

Four ids are both a shelf chant and a Kyriale entry: the Asperges me, its two
ad libitum settings, and the Vidi aquam, which the Liber Usualis prints as
antiphons and the Kyriale as the sprinkling rite. `cantus({ id })` returns the
shelf's record (`office: "an"`); under `ordinary` the same id returns the
Kyriale's (`ordinary: "as"` or `"va"`).

## The repertoire as of a date — the era view

`before: 1098` keeps only chants a manuscript of the 10th century or earlier
already holds. This is **evidence, not existence**: the dates come from
CANTUS's manuscript index, a terminus ante quem, so the filter answers "what
is attested by then," never "what existed then." A chant with no dated
witness is excluded rather than assumed old. CANTUS dates only to the century,
so a year admits the centuries that have CLOSED before it (`before: 1098` →
through the 900s).

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
own logic: `ordinarium` **re-picks**, because the Kyriale offers ranked
alternatives by design, so the rotation runs over the admissible pool and
the day still sings. `proprium` and `officium` have no pool
of alternatives, so an excluded chant **falls silent**. A `before` given to a
day verb directly overrides the feast's view; an invalid one throws at every
door.

## The Mass propers — `proprium`

`proprium(query)` retrieves the chants whose texts change with the day:
Introitus, Graduale, Alleluia or Tractus, Offertorium, Communio, in the order
they are sung. A feast narrows the result to its own propers. Handed the whole
list `festum` returns for a day, it sings the day's principal feast (the first
for each date), not every celebration the calendar finds.

The other `cantus` filters refine the result and read it as `cantus` does:
`source` is a book the chant is printed in, and the chant is presented as that
book. A `sort` reorders; without one the sung order stands. `gabc` and
`ordinary` belong to `cantus` alone and throw here, as an empty query does.

```js
const [feast] = tonus.festum({ date: new Date("2026-12-25") });
tonus.proprium({ feast, office: "in" });
// Puer natus est — Introitus, Modus VII, Liber Usualis p. 408
```

Coverage is 689 proper formularies. When a feast has no dedicated proper for a
slot, the Commune Sanctorum (formularies for classes of saints) supplies it
through 48 commune sets and 254 feast-to-commune mappings.

```ts
interface PropriumQuery extends Omit<CantusQuery, "gabc" | "ordinary"> {
  feast?: Feast | Feast[];
}
```

## The ordinary — `ordinarium`

`ordinarium(query)` retrieves the fixed chants of the Mass from the
Kyriale. A feast drives mass selection through its `masses` list, the
masses the day's Kyriale RUBRIC appoints, derived as described in
[calendar.md](calendar.md#the-days-feasts--festum); `mass` pins one of the
eighteen numbered Masses directly, and `section` asks for a part of the book:
`mass` (Masses I–XVIII), `credo` (Credo I–VI), `sprinkling` (Asperges me,
Vidi aquam), `ad-libitum` (the Cantus ad libitum) or `requiem` (the Missa pro
defunctis). Only the `mass` section carries a mass number; every other entry
reads `mass: 0`. Where the rubric names several masses, the year rotates
through them (same feast, same year → same answer, every time), and sibling
printings under one number (Mass XVII prints Kyrie A/B/C) rotate with it.
Mass I's two dismissals do not rotate: the double-alleluia Ite Ia belongs to
the Easter octave (Easter Day through Low Saturday), and Ite Ib to the rest of
Paschaltide. Slots resolve independently, which the book
licenses outright ("chants from one Mass may be used together with those
from others") with one exception, the book's own: **"the Ferial Masses
excepted."** Under a ferial rubric the sung ordinary is not gathered from
several masses; only the dismissal travels.

```js
const [easter] = tonus.festum({ date: new Date("2026-04-05") });
tonus.ordinarium({ feast: easter });
// ke  Kyrie I       (mass 1) — Lux et origo, Paschal time, every year
// gl  Gloria I      (mass 1)
// cr  Credo I       (mass 0) — the credo rotates on its own cycle
// sa  Sanctus I     (mass 1)
// ag  Agnus Dei I   (mass 1)
// it  Ite Ia        (mass 1) — the octave's double alleluia
// va  Vidi aquam    (mass 0) — the Paschaltide sprinkling antiphon rides along
```

The **Gloria follows the day's rank rubric, not its season**: the ferial
masses print none (XVI, XVIII) and the penitential-Sunday mass none (XVII),
while a I-class feast inside Advent or Lent (the Immaculate Conception)
keeps its Gloria. At a Gloria-less Mass the dismissal is the Benedicamus
Domino, and a mass with no dismissal of its own borrows one exactly as the
book directs: "Benedicamus Domino **as in Mass II**," so a green feria
sings Mass XVI whole with the Mass II Benedicamus. The ad libitum appendix
is a **solemnity boost**, reachable only under the festal rubrics (it takes
its turn in the rotation once every _n + 1_ years); it never reaches a
penitential day or a feria, and the Requiem settings stay out of every
calendar-driven pick (reachable by `ordinarium({ section: "requiem" })` only). The
Triduum returns no ordinary at all: Good Friday has no Mass, and the
Vigil's ordinary belongs to Easter. A pinned `mass` overrides the Triduum
rule and the rotation both.

**Maundy Thursday** (In Cena Domini) is the Triduum's exception: it keeps a
full Mass with the Gloria, its ordinary fixed to Mass I (Lux et origo).

The Kyriale's era rule bounds the settings at 1324 (_Docta Sanctorum
Patrum_), by the centuries the book's own editors print beside each part. A
part dated after it is not sung, and its slot borrows from another mass. The
rule reaches the Credos too: Credo III (17th century) and Credo IV (15th) are
outside it, so the credo cycle runs through I, II, V and VI.

The sprinkle rite (aspersion before the principal Sunday Mass) is appended on
Sundays only, selected by season: **Vidi aquam** (`va`) in Paschaltide,
**Asperges me** (`as`) otherwise.

```js
tonus.ordinarium({ ordinary: "ke" }); // every Kyrie
tonus.ordinarium({ ordinary: ["ke", "gl"] }); // every Kyrie and Gloria
tonus.ordinarium({ mass: 9, ordinary: "gl" }); // Gloria of Cum jubilo
tonus.ordinarium({ section: "ad-libitum", ordinary: "ke" }); // the eleven ad libitum Kyries
```

The other `cantus` filters (`id`, `incipit`, `mode`, `source`, `before`,
`cursus`) refine the result on both paths, the feast's and the book's, and
`limit` and `offset` window it last, over what the filters kept. Without a
feast the book's order stands; `sort` reorders. `gabc` throws here, as an
empty query does.

| `ordinary` | `ordinarium`                                  |
| ---------- | --------------------------------------------- |
| `ke`       | Kyrie eleison                                 |
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
  mass: number; // 1–18, or 0 outside the numbered Masses
  section: "mass" | "credo" | "sprinkling" | "ad-libitum" | "requiem";
}

interface OrdinariumQuery extends Omit<CantusQuery, "gabc"> {
  feast?: Feast | Feast[];
  ordinary?: OrdinaryCode | OrdinaryCode[];
  mass?: number; // 1–18
  section?: "mass" | "credo" | "sprinkling" | "ad-libitum" | "requiem";
}
```

## The Office — `officium`

`officium(query)` retrieves the chants of a canonical hour; a feast acts
as a filter. Without an hour, every available hour returns. Every hour comes
back in the order it is sung; `sort` reorders. Handed the whole list `festum`
returns for a day, it sings the day's principal feast only, so Christmas does
not merge with the Advent feria the calendar also finds. The other `cantus`
filters refine the hour as they refine `proprium`.

```js
const christmas = tonus.festum({ date: new Date("2026-12-25") });
tonus.officium({ feast: christmas, hora: "laudes" });
// 7 chants: the Lauds antiphons (Quem vidistis pastores, Genuit
// puerpera, …) and the hymn A solis ortus
```

| Hour                        | Content                                                                      |
| --------------------------- | ---------------------------------------------------------------------------- |
| `matutinum`                 | Invitatory, antiphons, hymn, responsories                                    |
| `laudes`                    | Antiphons, Benedictus antiphon, hymn                                         |
| `tertia` / `sexta` / `nona` | The gradual psalms (Terce 119–121, Sext 122–124, None 125–127; Sunday and Monday take portions of Ps 118) + responsory breve |
| `vesperae`                  | Antiphons, Magnificat antiphon, hymn                                         |
| `prima`                     | The Prime ordo (sung parts) — see below                                      |
| `completorium`              | The full Compline ordo — see below                                           |

**Prime and Compline are ordos, not chant sets.** These two hours are
almost invariable: the same
sequence each day, varying only by season. They are assembled from a small
seasonal ordo. With no feast, each resolves for the
[default epoch](index.md#dates). Both open with _Deus in adjutorium_ in the
ferial tone. The monastic Compline has no Gospel canticle. The _Gloria Patri_
that closes each psalm is not emitted.

The Sacred Triduum strips Compline to its psalms: no opening, hymn,
responsory or Marian antiphon, and in their place the antiphon _Christus
factus est_.

**Matins is returned flat.** The night office answers like any other hour,
its responsories drawn from the Nocturnale Romanum (`nr`). But the
three-nocturn, twelve-psalm division is not modelled: the chants are right,
their grouping into nocturns is not expressed.

```js
tonus.officium({ feast: christmas, hora: "completorium" });
// Deus in adiutorium (Tonus ferialis) → Ps 4, 90, 133 → Te lucis
// → In manus tuas → Alma Redemptoris (simple tone)
```

```ts
interface OfficiumQuery extends Omit<CantusQuery, "gabc" | "ordinary"> {
  feast?: Feast | Feast[];
  hora?: CanonicalHour;
}
```

The eight hours ship as [`HORAE`](index.md#the-appendix), Matins first. Read
them from there rather than transcribing them, and an unrecognised `hora`
throws rather than matching nothing, so a misspelling cannot read as an empty
hour.

```js
import { HORAE } from "tonus";
// ["matutinum", "laudes", "prima", "tertia", "sexta", "nona",
//  "vesperae", "completorium"]

tonus.officium({ hora: "vespers" });  // throws: unknown hora "vespers"
```

### One cursus, the Benedictine

tonus assembles a single office (the monastic cursus) with no option to
choose another. The chants come from the Antiphonale Monasticum (`am`) and its
companions; the psalmody follows the Benedictine distribution, the little
hours take the gradual psalms (Terce 119–121, Sext 122–124, None 125–127),
with Sunday and Monday walking their portions of Ps 118 instead; Prime walks
Pss 1–19 across the week (Sunday opens Ps 118); and Compline is the fixed
three, 4, 90 and 133.

```js
const [benedict] = tonus.festum({ date: new Date("2026-03-21") });
tonus.officium({ feast: benedict, hora: "vesperae" });
// the monastic Vespers antiphons, sourced from the Antiphonale Monasticum
```

## Psalms — `psalmus`

`psalmus(query)` returns psalm and canticle verses as intoned chant:
GABC pointed to a psalm tone, modes 1–8 or the tonus peregrinus (mode 0).
`differentia` selects the cadential variant. The intonation opens the first
verse of the run only, except in the Benedictus and the Magnificat, where
every verse takes it; `intonatio: true` asks for it on every verse and
`false` on none. A flex (†) in the first half-verse is sung as the tone's
flex: the voice drops on the flex member's last syllable. The breviary's other
marks (+, a joined verse's number) are not sung.
`inDirectum` recites a verse straight through to the termination with no
mediant, as a psalm sung without an antiphon; `solemn` uses a tone's
ornamented mediant where it has one. Canticles are addressed by name:
`benedictus`, `magnificat`, `nunc dimittis`, `benedicite`. (The Te Deum
is not psalmody: it carries its own melody and is not addressable here.)

```js
tonus.psalmus({ psalm: 109, verse: "1a", mode: 1 });
```

```js
[
  {
    incipit: "Dixit Dóminus Dómino meo:",
    modus: "Modus I",
    gabc: "(c4) Di(f)xit(h) Dó(j)mi(h)nus(h) Dó(h)mi(j)no(h) me(g)o:(h)(:) Se(h)de(h) a(j) dex(h)tris(g) me(h)is:(g)(::)",
  },
];
```

The cadences are pointed by syllable count: each takes as many syllables from
the end of its half-verse as the tone has notes. The books point them to the
word accents, and where the last word is a proparoxytone the two differ.

```js
tonus.psalmus({ psalm: 109, mode: 2, differentia: "2D" });
tonus.psalmus({ psalm: "benedictus", mode: 8, intonatio: false });
tonus.psalmus({ psalm: 109, mode: 2, differentia: "6F" }); // throws: tone 2 has no differentia "6F"
```

An empty query, an unknown mode, and a differentia the tone does not carry
throw.

The tones and their differentiae follow the Graduale Romanum appendix; the
tone's anatomy as tuned pitches is available from
[`temperamentum.tonus()`](tuning.md#psalm-tones--tonus).

```ts
interface PsalmusQuery {
  psalm?: number | string;
  verse?: string;
  mode?: number; // 1–8, or 0 for the tonus peregrinus
  differentia?: string; // differentia code, e.g. "6F", "4e"
  intonatio?: boolean; // every verse (true), none (false); absent: by the rubric
  inDirectum?: boolean; // recite straight through, no mediant
  solemn?: boolean; // use the ornamented solemn mediant where the tone has one
}
```

## Theory & Context

### The Solesmes restoration

The melodies in tonus are the Solesmes editions: the scholarly restoration
produced from the mid-19th century onward and matured into the books listed
under [The corpora](#the-corpora). The 1961 Graduale, the last complete edition
before the post-conciliar reforms, covers the full Tridentine cycle the
calendar in [calendar.md](calendar.md) expects.

Every reading reflects editorial judgment (no single medieval church sang
precisely these books), and the Solesmes books are a complete, internally
consistent edition of the Tridentine cycle, available machine-readable through
GregoBase.

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
neumes, and metrics without images.

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
  (Lux et origo for Paschaltide, Orbis factor for Sundays throughout the
  year). Feast-aware mass selection follows the assignments the Kyriale's
  rubrics make, bounded by its era rule.

### The Office: the daily cursus

The Divine Office (`tonus.officium`) supplies the eight canonical hours
that structure the liturgical day: Matutinum (the night office), Laudes
at dawn, the little hours of Prima, Tertia, Sexta, and Nona, Vesperae at
evening, and Completorium before sleep. The backbone of every hour is
psalmody: psalms and canticles framed by antiphons, with hymns and
responsories proper to the hour and the day. The eight-hour cursus is a
medieval inheritance intact in the Tridentine books.

### Psalm tones

Psalm verses are not through-composed; they are _intoned_ on recitation
formulas (`tonus.psalmus`): one tone per mode, plus the wandering
**tonus peregrinus** (sung to _In exitu Israel_). In the books its two
halves recite on different pitches; the tone table here gives it a single
tenor.
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

Sources for this page are in the central [bibliography](https://github.com/jeffreypierce/tonus/blob/main/BIBLIOGRAPHY.md):
`gregobase` (the six Solesmes books: `gr`, `lu`, `la`, `lh`, `am`, `psm`), `nocturnale-romanum` (`nr`), `divinum-officium`,
`graduale-toni-communes`, `bloomfield-compline`, `gregorio-gabc`, `apel-chant`,
`hiley-plainchant`, `saulnier-guide`.
