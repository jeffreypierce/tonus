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
