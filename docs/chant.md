# Chant

The chant engines retrieve the sung repertoire. `cantus` searches the
corpora at large and parses raw GABC; `proprium` supplies the Mass propers
of a feast; `ordinarium` the Kyriale settings appropriate to it;
`officium` the chants of the canonical hours; `psalmus` psalm and canticle
verses intoned to the psalm tones. Every melody is GABC-encoded and
carries page-level provenance back to its book.

- [The corpora](#the-corpora)
- [Retrieval — `cantus`](#retrieval--cantus)
- [The Mass propers — `proprium`](#the-mass-propers--proprium)
- [The ordinary — `ordinarium`](#the-ordinary--ordinarium)
- [The Office — `officium`](#the-office--officium)
- [Psalms — `psalmus`](#psalms--psalmus)
- [Theory & Context](#theory--context)
- [Sources](#sources)

## The corpora

Four Solesmes books, extracted from
[GregoBase](https://gregobase.selapa.net/), joined by the Divinum Officium
propers, office, and psalter:

| Source | Book | Edition | Chants |
| --- | --- | --- | --- |
| `gr` | Graduale Romanum | ed. Solesmes; Tournai: Desclée, 1961 | 1,344 |
| `lu` | Liber Usualis | ed. Solesmes; Tournai: Desclée, 1961 | 2,377 |
| `la` | Liber Antiphonarius | ed. Solesmes, 1960 | 1,422 |
| `lh` | Liber Hymnarius | Solesmes, 1983 | 361 |

## Retrieval — `cantus`

`cantus(query?)` searches across the corpora by id, incipit, mode, genre,
and source. Results sort by rank, then incipit; `limit` and `offset` page
through them.

```js
tonus.cantus({ mode: 1, office: "an", source: "gr", limit: 1 });
```

```js
[{
  id: "gregobase:1238",
  incipit: "Adoramus te Christe (Ant)",
  gabc: "(c4) A(c)do(d)rá(ixdh'!iv)mus(h) te…",
  office: "an", genus: "Antiphona",
  mode: "1", modus: "Modus I",
  pages: [{ page: "239A", sequence: 1, extent: 1 }],
  source: { book: "Graduale Romanum", year: 1961, editor: "Solesmes", code: "gr" },
}]
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

| `office` | `genus` | `office` | `genus` | `office` | `genus` |
| --- | --- | --- | --- | --- | --- |
| `an` | Antiphona | `hy` | Hymnus | `rb` | Responsorium Breve |
| `al` | Alleluia | `in` | Introitus | `se` | Sequentia |
| `ca` | Canticum | `of` | Offertorium | `tr` | Tractus |
| `co` | Communio | `ps` | Psalmus | `tp` | Tonus Peregrinus |
| `gr` | Graduale | `re` | Responsorium | `or` | Ordinarium |

```ts
interface Chant {
  id: string;
  incipit: string;
  gabc: string;
  office: OfficeCode;        // genre code
  genus: string;             // Latin genre name, "Antiphona", "Introitus" …
  mode: string | null;       // raw from source: "1"–"8", "*", "†" …
  modus: string | null;      // Latin mode name, "Modus I"–"Modus VIII"
  pages: { page: string; sequence: number; extent: number }[];
  source: {
    book: string;
    year: number | null;
    editor: string | null;
    code?: ChantSource | "user";
  };
}

interface CantusQuery {
  id?: string | string[];
  gabc?: string;
  incipit?: string;
  mode?: number | string | (number | string)[];
  office?: OfficeCode | OfficeCode[];
  source?: ChantSource | ChantSource[];
  limit?: number;
  offset?: number;
  sort?: "incipit" | "mode" | "id";
}
```

## The Mass propers — `proprium`

`proprium(query?)` retrieves the chants whose texts change with the day:
Introitus, Graduale, Alleluia or Tractus, Offertorium, Communio. A feast
narrows the result to its own propers.

```js
const [feast] = tonus.festum({ date: new Date("2026-12-25") });
tonus.proprium({ feast, office: "in" });
// Puer natus est — Introitus, Modus VII, Liber Usualis p. 408
```

Coverage is 926 entries, 523 Sancti and 403 Tempora. When a feast has no
dedicated proper for a slot, the Commune Sanctorum supplies it — the
shared formularies for classes of saints — through 31 commune sets and 387
feast-to-commune mappings.

```ts
interface PropriumQuery extends CantusQuery {
  feast?: Feast | Feast[];
}
```

## The ordinary — `ordinarium`

`ordinarium(query?)` retrieves the fixed chants of the Mass from the
Kyriale. A feast drives mass selection through its `masses` list, whose
partly editorial derivation is described in
[calendar.md](calendar.md#the-days-feasts--festum); `mass` pins a kyriale
number directly. For a feast, one chant per movement returns, chosen from
the feast's masses by mode fit — so the movements may come from different
masses:

```js
const [easter] = tonus.festum({ date: new Date("2026-04-05") });
tonus.ordinarium({ feast: easter });
// ky  Kyrie IV      (mass 4)
// gl  Gloria IV     (mass 4)
// cr  Credo III     (mass 3)
// sa  Sanctus II    (mass 2)
// ag  Agnus Dei II  (mass 2)
// it  Ite IIb       (mass 2)
```

The Gloria is omitted in the penitential seasons — Advent, Septuagesima,
and Lent — and the Ite gives way to the Benedicamus. The Triduum returns
no ordinary at all: Good Friday has no Mass, and the Vigil's ordinary
belongs to Easter. A pinned `mass` overrides the Triduum rule.

**Maundy Thursday** (In Cena Domini) is the Triduum's exception: it keeps a
full Mass with the **Gloria** — sung with the bells before they fall silent
until the Easter Vigil — despite falling in Lent. Its ordinary is Ky, Gl,
Sa, Ag, Ite (no Credo, no sprinkle), drawn from Mass I (Lux et origo), the
same setting the Vigil borrows.

The sprinkle rite (aspersion before the principal Sunday Mass) is appended
and selected by season: **Vidi aquam** (`va`) in Paschaltide, **Asperges
me** (`as`) otherwise.

```js
tonus.ordinarium({ ordinary: "ky" });         // every Kyrie
tonus.ordinarium({ mass: 9, ordinary: "gl" }); // Gloria of Cum jubilo
```

| `ordinary` | `ordinarium` |
| --- | --- |
| `ky` | Kyrie eleison |
| `gl` | Gloria |
| `cr` | Credo |
| `sa` | Sanctus |
| `ag` | Agnus Dei |
| `be` | Benedicamus |
| `it` | Ite missa est |
| `as` | Asperges (sprinkle rite, outside Paschaltide) |
| `va` | Vidi aquam (sprinkle rite, Paschaltide) |

```ts
interface OrdinaryChant extends Chant {
  ordinary: OrdinaryCode;    // movement code
  ordinarium: string;        // Latin movement name, "Kyrie eleison" …
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

| Hour | Content |
| --- | --- |
| `matutinum` | Invitatory, antiphons, hymn, responsories |
| `laudes` | Antiphons, Benedictus antiphon, hymn |
| `tertia` / `sexta` / `nona` | Responsory breve |
| `vesperae` | Antiphons, Magnificat antiphon, hymn |
| `prima` | The Prime ordo (sung parts) — see below |
| `completorium` | The full Compline ordo — see below |

**Prime and Compline are ordos, not chant sets.** Unlike the other hours —
which draw a set of chants from the per-feast office tables and return them
sorted by incipit — these two hours are almost **invariable**, the same
sequence each day, varying only by season. They are assembled from a small
seasonal ordo and returned **in liturgical order** (the sequence is the
meaning, so they alone are not incipit-sorted). With no feast, each resolves
for the [default epoch](index.md#dates).

`officium({ hora: "completorium" })` returns: the opening *Deus in
adjutorium*, the fixed psalms (4, 30 vv. 2–6, 90, 133, intoned as by
`psalmus`), the seasonal hymn *Te lucis ante terminum*, the short responsory
*In manus tuas*, the canticle *Nunc dimittis*, and the seasonal **Marian
antiphon**. The
Marian antiphon follows the traditional rotation — *Alma Redemptoris Mater*
(Advent to Candlemas), *Ave Regina cælorum* (Candlemas to Holy Week), *Regina
cæli* (Paschaltide), *Salve Regina* (after Pentecost) — in the simple tone.

```js
tonus.officium({ feast: christmas, hora: "completorium" });
// Deus in adjutorium → Ps 4, 30, 90, 133 → Te lucis → In manus tuas
// → Nunc dimittis → Alma Redemptoris (simple tone)
```

`officium({ hora: "prima" })` returns Prime's **sung** parts: the opening, the
hymn *Iam lucis orto sidere*, the psalmody, and the seasonal short responsory
*Christe Fili Dei vivi*. The psalmody varies by weekday, after the traditional
(Tridentine) Roman scheme: Ps 53, then a day-proper psalm (117 on Sunday, the
21–25 rotation on ferias, none on Saturday), then the first two sections of
Ps 118 (vv. 1–16 and 17–32). Prime's recited parts — the Athanasian Creed
(*Quicumque*), the martyrology, the chapter, and the collect — are not Solesmes
chant and are not modeled.

```ts
interface OfficiumQuery extends CantusQuery {
  feast?: Feast | Feast[];
  hora?: CanonicalHour;
}
```

## Psalms — `psalmus`

`psalmus(query?)` returns psalm and canticle verses as intoned chant:
GABC pointed to a psalm tone, modes 1–8 or the tonus peregrinus (mode 0).
`differentia` selects the cadential variant; `intonatio` controls whether
the opening formula is included, as it is for a psalm's first verse.
Canticles are addressed by name: `benedictus`, `magnificat`,
`nunc dimittis`, `te deum`, `benedicite`.

```js
tonus.psalmus({ psalm: 109, verse: "1a", mode: 1 });
```

```js
[{
  incipit: "Dixit Dóminus Dómino meo:",
  modus: "Modus I",
  gabc: "(c4) (f)Di(h)xit (j)Dó(h)mi(h)nus (h)Dó(j)mi(h)no (g)me(h)o:(:) …",
}]
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
  differentia?: string;  // differentia code, e.g. "6F", "4e"
  intonatio?: boolean;   // include opening intonation formula, default true
}
```

## Theory & Context

### The Solesmes restoration

The melodies in tonus are not medieval manuscripts — they are the Solesmes
restoration: the editions produced by the monks of Saint-Pierre de
Solesmes from the mid-19th century onward, comparing hundreds of early
neumed manuscripts (St. Gall, Laon, and the wider paleographic corpus
assembled in the *Paléographie musicale*) to recover readings the
intervening centuries of squared, abbreviated "Medicean" chant had
corrupted. That work, under Dom Pothier and then Dom Mocquereau, became
the Vatican Edition (1908) and matured through the books listed under
[The corpora](#the-corpora).

The 1961 Graduale is the last complete edition of the Mass repertoire
before the post-conciliar reforms — the mature restoration, with the
Solesmes rhythmic signs, covering the full Tridentine cycle the calendar
in [calendar.md](calendar.md) expects. Every reading reflects the
restoration's editorial judgment, scholarly but synthetic; no single
medieval church sang precisely these books. They are, however, the only
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

Melodic shapes are implicit in the letter groupings — two rising letters
form a *pes*, two falling a *clivis*, and so on through the neume
vocabulary listed under `NeumeShape` in
[tuning.md](tuning.md#neumes--neuma). Additional marks carry the Solesmes
performance layer: episemas (`_`, `'`), the quilisma (`w`), liquescents,
dots, and the divisio hierarchy (`,` `;` `:` `::`) that the score engine
reads as phrase punctuation ([score.md](score.md#theory--context)).
Because the encoding is textual, lyrics and neumes stay aligned syllable
by syllable — which is what lets `tonus.notatio` reconstruct syllables,
neumes, and prosody without images.

### The Mass: proper and ordinary

Two layers of chant make up a sung Mass, and tonus separates them exactly
as the books do:

- **The proper** (`tonus.proprium`) — the five processional and
  interlectionary chants whose texts change with the day: Introitus,
  Graduale, Alleluia (or Tractus in penitential seasons), Offertorium,
  Communio. When a feast lacks its own proper, the rite supplies one from
  the Commune Sanctorum — the shared formularies for classes of saints —
  which is why `proprium` falls back to commune sets.
- **The ordinary** (`tonus.ordinarium`) — the fixed texts sung at every
  Mass: Kyrie, Gloria, Credo, Sanctus, Agnus Dei, Ite or Benedicamus.
  Their melodies live in the **Kyriale**: eighteen numbered mass-settings
  plus ad libitum chants, each conventionally assigned to a class of day
  (Lux et origo for Paschaltide, Orbis factor for ordinary Sundays, the
  Missa de Angelis everywhere). Feast-aware mass selection follows those
  assignments.

### The Office: the daily cursus

Alongside the Mass runs the Divine Office (`tonus.officium`) — the eight
canonical hours that structure the liturgical day: Matutinum (the night
office), Laudes at dawn, the little hours of Prima, Tertia, Sexta, and
Nona, Vesperae at evening, and Completorium before sleep. The backbone of
every hour is psalmody: psalms and canticles framed by antiphons, with
hymns and responsories proper to the hour and the day. The eight-hour
cursus is a medieval inheritance intact in the Tridentine books — a
13th-century cantor would recognize it immediately.

### Psalm tones

Psalm verses are not through-composed; they are *intoned* on recitation
formulas (`tonus.psalmus`) — one tone per mode, plus the wandering **tonus
peregrinus** with its two tenors (sung to *In exitu Israel*). Each tone
has a fixed anatomy: an **intonatio** (the opening rise, sung for the
first verse), recitation on the **tenor**, a **mediatio** cadence at the
verse's colon, recitation again, and a **terminatio** cadence.
Terminations come in variants — the **differentiae** (`"6F"`, `"4e"`, …) —
whose purpose is practical: to end the verse on a pitch that leads
smoothly back into the antiphon's opening. The tones and differentiae in
tonus follow the Graduale Romanum appendix (Toni Communes), keyed by the
same codes Divinum Officium uses. The gamut-level mechanics — tenor and
finalis per mode — are on the tuning page
([tuning.md](tuning.md#modes--modus)).

## Sources

- **GregoBase** — <https://gregobase.selapa.net/>. Chant corpora extracted
  by book (GregoBase source IDs 2, 3, 48, 15):
  - *Graduale sacrosanctæ Romanæ ecclesiæ de tempore et de sanctis*
    (Graduale Romanum). Ed. Solesmes. Tournai: Desclée, 1961 — 1,344
    chants (`gr`).
  - *Liber Usualis Missæ et Officii pro dominicis et festis cum cantu
    Gregoriano*. Ed. Solesmes. Tournai: Desclée, 1961 — 2,377 chants
    (`lu`).
  - *Liber antiphonarius pro diurnis horis* (Antiphonale Romanum).
    Solesmes, 1960 — 1,422 chants (`la`).
  - *Liber Hymnarius cum invitatoriis & aliquibus responsoriis*. Solesmes,
    1983 — 361 chants (`lh`).
- **Divinum Officium** — <https://divinumofficium.com/> — Mass propers
  (926 entries), Office hours (929 days), and the Psalterium (2,612 psalm +
  579 canticle verses, Vulgate).
- Psalm tones and differentiae: Graduale Romanum appendix (Toni Communes),
  including the tonus peregrinus.
- GABC notation: the Gregorio project,
  <https://gregorio-project.github.io/>.
- *Versus Psalmorum et Canticorum* (No. 839). Solesmes — the psalm-verse
  formulas for the tones.
- Apel, Willi. *Gregorian Chant*. Bloomington: Indiana University Press,
  1958 — the analytic study of the repertoire.
- Hiley, David. *Western Plainchant: A Handbook*. Oxford: Clarendon Press,
  1993 — the standard modern reference.
- Treitler, Leo. *With Voice and Pen: Coming to Know Medieval Song and How
  It Was Made*. Oxford: Oxford University Press, 2003.
- Saulnier, Daniel. *Gregorian Chant: A Guide*. CMAA edition.
- Pierik, Marie. *The Spirit of Gregorian Chant*. Milwaukee: Bruce, 1939.
- Pierik, Marie. *Gregorian Chant Analyzed and Studied*. St. Meinrad, IN:
  Grail, 1951.
- Burkard, Dom Sisbert. *Manual of Plain Chant*. 1906.
- Kelly, Thomas Forrest. *Capturing Music: The Story of Notation*. New
  York: W. W. Norton, 2014.
