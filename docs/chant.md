# Chant — `cantus` · `proprium` · `ordinarium` · `officium` · `psalmus`

The chant corpora: four Solesmes books extracted from
[GregoBase](https://gregobase.selapa.net/), plus the Divinum Officium propers,
office, and psalter. All melodies are GABC-encoded with page-level provenance.

| Source | Book | Chants |
| --- | --- | --- |
| `gr` | Graduale Romanum (1961) | 1,344 |
| `lu` | Liber Usualis (1961) | 2,377 |
| `la` | Liber Antiphonarius (1960) | 1,422 |
| `lh` | Liber Hymnarius (1983) | 361 |

## `tonus.cantus(query?) -> Chant[]`

Cross-corpus chant retrieval. Also accepts raw GABC input via the `gabc`
field — when present, the corpus is bypassed and a single user `Chant` is
returned. GABC input may be a notation body or a full GABC file (headers +
`%%` + body); header values for `name`, `mode`, and `office-part` are
extracted automatically. The `incipit`, `mode`, and `office` query fields
override header values.

```js
tonus.cantus({ mode: 1, office: "an", source: "gr" });
tonus.cantus({ mode: [1, 2], office: ["an", "hy"] });
tonus.cantus({ id: "gregobase:1234" });

// raw GABC body
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

## `tonus.proprium(query?) -> Chant[]`

Mass proper retrieval: Introitus, Graduale, Alleluia/Tractus, Offertorium,
Communio. A feast acts as a focused filter when provided.

```js
tonus.proprium({ office: "in" });
tonus.proprium({ feast: feasts, office: "gr" });
```

**Coverage:** 926 entries (523 Sancti + 403 Tempora). When a feast has no
dedicated proper for a slot, the Commune Sanctorum proper is used as fallback
(31 commune sets, 387 feast→commune mappings).

## `tonus.ordinarium(query?) -> OrdinaryChant[]`

Mass ordinary retrieval from the Kyriale. A feast drives mass selection when
provided; `mass` pins a specific kyriale number directly.

```js
tonus.ordinarium({ ordinary: "ky" });
tonus.ordinarium({ feast: feasts });
tonus.ordinarium({ mass: 9, ordinary: "gl" });
```

The Gloria is omitted in the penitential seasons (Advent, Septuagesima,
Lent), and the **Triduum returns no ordinary at all** — Good Friday has no
Mass, and the Vigil's ordinary belongs to Easter. A pinned `mass` number
overrides the Triduum rule. (Maundy Thursday's Gloria is a known
simplification, logged as future work.)

## `tonus.officium(query?) -> Chant[]`

Divine Office hour retrieval. Returns chants for a canonical hour; a feast
acts as a filter. When no hour is specified, returns chants for all
available hours.

```js
tonus.officium({ hour: "laudes" });
tonus.officium({ feast: feasts, hour: "vesperae" });
```

| Hour | Content |
| --- | --- |
| `matutinum` | Invitatory, antiphons, hymn, responsories |
| `laudes` | Antiphons, Benedictus antiphon, hymn |
| `tertia` / `sexta` / `nona` | Responsory breve |
| `vesperae` | Antiphons, Magnificat antiphon, hymn |
| `prima`, `completorium` | Not yet extracted — return empty |

## `tonus.psalmus(query?) -> Chant[]`

Psalm and canticle retrieval as intoned `Chant[]`: GABC-encoded psalm verses
sung to a psalm tone (modes 1–8 plus the tonus peregrinus). `differentia`
specifies the cadential variant; `intonation` controls whether the opening
formula is included. Canticles are addressed by name: `benedictus`,
`magnificat`, `nunc dimittis`, `te deum`, `benedicite`.

```js
tonus.psalmus({ psalm: 109, mode: 1 });
tonus.psalmus({ psalm: 109, verse: "1a", mode: 2, differentia: "6F" });
tonus.psalmus({ psalm: "benedictus", mode: 8, intonation: false });
```

## Types

```ts
type ChantSource = "gr" | "lu" | "la" | "lh";

type OfficeCode =
  | "an" | "al" | "ca" | "co" | "gr" | "hy" | "in" | "of"
  | "ps" | "re" | "rb" | "se" | "tr" | "tp" | "or";

type OrdinaryCode = "ky" | "gl" | "cr" | "sa" | "ag" | "be" | "it";
// Kyrie, Gloria, Credo, Sanctus, Agnus, Benedicamus, Ite

type CanonicalHour =
  | "matutinum" | "laudes" | "prima" | "tertia"
  | "sexta" | "nona" | "vesperae" | "completorium";

interface Chant {
  id: string;
  incipit: string;
  gabc: string;
  office: OfficeCode;
  officeLabel: string;
  mode: string | null;
  modeLabel: string | null;
  pages: { page: string; sequence: number; extent: number }[];
  source: {
    book: string;
    year: number | null;
    editor: string | null;
    code?: ChantSource | "user";
  };
}

interface OrdinaryChant extends Chant {
  ordinary: OrdinaryCode;
  ordinaryLabel: string;
  mass: number;
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

interface PropriumQuery extends CantusQuery {
  feast?: Feast | Feast[];
}

interface OrdinariumQuery extends CantusQuery {
  feast?: Feast | Feast[];
  ordinary?: OrdinaryCode;
  mass?: number;
}

interface OfficiumQuery extends CantusQuery {
  feast?: Feast | Feast[];
  hour?: CanonicalHour;
}

interface PsalmusQuery {
  psalm?: number | string;
  verse?: string;
  mode?: number;
  differentia?: string;  // differentia code, e.g. "6F", "4e"
  intonation?: boolean;  // include opening intonation formula, default true
}
```

## Theory & Context

### The Solesmes restoration

The melodies in tonus are not medieval manuscripts — they are the Solesmes
restoration: the editions produced by the monks of Saint-Pierre de Solesmes
from the mid-19th century onward, comparing hundreds of early neumed
manuscripts (St. Gall, Laon, and the wider paleographic corpus assembled in
the *Paléographie musicale*) to recover readings the intervening centuries
of squared, abbreviated "Medicean" chant had corrupted. That work, under
Dom Pothier and then Dom Mocquereau, became the Vatican Edition (1908) and
matured through the 20th-century books tonus draws on:

| Corpus | Book | Edition |
| --- | --- | --- |
| `gr` | Graduale Romanum | Solesmes: Desclée, 1961 |
| `lu` | Liber Usualis | Solesmes: Desclée, 1961 |
| `la` | Liber Antiphonarius | Solesmes, 1960 |
| `lh` | Liber Hymnarius | Solesmes, 1983 |

The 1961 Graduale is the last complete edition of the Mass repertoire
before the post-conciliar reforms — the mature restoration, with the
Solesmes rhythmic signs, covering the full Tridentine cycle that the
calendar in [calendar.md](calendar.md) expects. The honest caveat: every
reading reflects the restoration's editorial judgment, scholarly but
synthetic — no single medieval church sang precisely these books. They are,
however, the only comprehensive machine-readable representation of the
Gregorian repertoire, and the best available proxy for it.

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
vocabulary listed under `NeumeShape` in [tuning.md](tuning.md#neume-and-interval).
Additional marks carry the Solesmes performance layer: episemas (`_`, `'`),
the quilisma (`w`), liquescents, dots, and the divisio hierarchy (`,`
`;` `:` `::`) that the score engine reads as phrase punctuation
([score.md](score.md#theory--context)). Because the encoding is textual,
lyrics and neumes stay aligned syllable by syllable — which is what lets
`tonus.notatio` reconstruct syllables, neumes, and prosody without images.

### The Mass: proper and ordinary

Two layers of chant make up a sung Mass, and tonus separates them exactly
as the books do:

- **The proper** (`tonus.proprium`) — the five processional and
  interlectionary chants whose *texts change with the day*: Introitus,
  Graduale, Alleluia (or Tractus in penitential seasons), Offertorium,
  Communio. When a feast lacks its own proper, the rite supplies one from
  the Commune Sanctorum — the shared formularies for classes of saints —
  which is why `proprium` falls back to commune sets.
- **The ordinary** (`tonus.ordinarium`) — the five (plus dismissal) fixed
  texts sung at every Mass: Kyrie, Gloria, Credo, Sanctus, Agnus Dei,
  Ite/Benedicamus. Their melodies live in the **Kyriale**: eighteen
  numbered mass-settings plus ad libitum chants, each conventionally
  assigned to a class of day (Lux et origo for Paschaltide, Orbis factor
  for ordinary Sundays, the Missa de Angelis everywhere). Feast-aware mass
  selection follows those assignments.

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
peregrinus** with its two tenors (sung to *In exitu Israel*). Each tone has
a fixed anatomy: an **intonation** (the opening rise, sung for the first
verse), recitation on the **tenor**, a **mediant** cadence at the verse's
colon, recitation again, and a **termination** cadence. Terminations come
in variants — the **differentiae** (`"6F"`, `"4e"`, …) — whose purpose is
practical: to end the verse on a pitch that leads smoothly back into the
antiphon's opening. The tones and differentiae in tonus follow the
Graduale Romanum appendix (Toni Communes), keyed by the same codes
Divinum Officium uses. The gamut-level mechanics (tenor and finalis per
mode) are on the tuning page ([tuning.md](tuning.md#modedata)).

## Sources

- **GregoBase** — <https://gregobase.selapa.net/>. Chant corpora extracted
  by book (GregoBase source IDs 2, 3, 48, 15):
  - *Graduale sacrosanctæ Romanæ ecclesiæ de tempore et de sanctis*
    (Graduale Romanum). Solesmes: Desclée, 1961 — 1,344 chants (`gr`).
  - *Liber Usualis Missæ et Officii pro dominicis et festis cum cantu
    Gregoriano*. Solesmes: Desclée, 1961 — 2,377 chants (`lu`).
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
