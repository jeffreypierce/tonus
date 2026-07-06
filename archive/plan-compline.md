# Compline (completorium) — ordo, referencing existing corpus chants

**Status: PLAN for a future session (not started). Build on a `feat/compline`
branch, off the release path.**

## Context

tonus models `completorium` in the `CanonicalHour` type but never returns it:
`hour.ts:78` omits it from the hour list, the `OfficeDay` structure has no
Compline fields, and the DO extraction skipped it (Compline is fixed/seasonal,
not per-feast, so it doesn't fit the feast-keyed office data). So Compline is a
real gap.

bbloomf's **compline** repo (`~/Developer/compline`, **Unlicense / public
domain**) is a complete traditional-Roman Compline: seasonal Te lucis, seasonal
In manus tuas, the four fixed psalms (4, 30, 90, 133), Nunc dimittis, chapter,
versicles, and the four Marian antiphons with solemn/simple tones.

**Key finding (investigated 2026-07-04):** these chants are *already in tonus's
corpus* — Te lucis, In manus tuas, and Nunc dimittis in `la.ts`/`lu.ts`/`gr.ts`;
the four Marian antiphons (both tones) in `lu.ts`; the four psalms fully covered
by `tonus.psalmus()`; Deus in adjutorium / Adjutorium nostrum in `lu.ts`. So this
is **not a GABC import** — it is an **ordo** problem: the structured knowledge of
which existing chant, in which order, for which season. bbloomf is the reference
for that *structure*, not a data source we copy from. **No GABC is copied.**

Decisions (with user): reference existing chant IDs (no import); plan now, build
later on a `feat/compline` branch, off the release path.

## Shape

Compline is nearly invariable — the same ordo every night, varying only by
**season** (a `Season` already on every `Feast`) and a couple of tone choices.
So the model is a small seasonal ordo table + `officium` wiring, not per-feast
data.

### 1. The ordo data — `src/data/compline.ts` (via tonus-corpus)

Per the "data comes from tonus-corpus" rule: add a corpus step that emits
`compline.ts`. But its *content* is an editorial ordo (chant-ID references +
seasonal rules), not a DO/GregoBase extraction — so the corpus step is a small
authored generator (or a checked-in table the corpus copies), documented as a
third source. Shape:

```ts
// Fixed spine (same every night) — references to existing gregobase: IDs.
export const COMPLINE_ORDINARY = {
  opening: ["gregobase:…Jube", "gregobase:…Adjutorium"],  // + Deus in adjutorium
  psalms: [4, 30, 90, 133],        // Vulgate numbers → tonus.psalmus()
  hymn: "te-lucis",                // resolved per season (below)
  chapterVersicle: "gregobase:…",  // In manus tuas responsory (per season)
  canticle: "gregobase:…NuncDim",  // + its antiphon
  // Nunc dimittis antiphon, blessing, etc.
};

// Seasonal overrides — Season code → the chant that varies.
export const COMPLINE_SEASONAL: Record<Season, {
  teLucis: string;        // gregobase id for this season's Te lucis tone
  inManusTuas: string;    // seasonal responsory
}> = { … };

// Marian antiphon by season (the classic fixed rotation — sourced, not bbloomf):
//   Advent → Candlemas: Alma Redemptoris   (lu 1851 simple / 2238 solemn)
//   Candlemas → Holy Week: Ave Regina       (lu 2153 / 2602)
//   Easter → Pentecost:  Regina caeli       (lu 2290 / 1976)
//   Pentecost → Advent:  Salve Regina       (lu 2435 / 717)
```

The mapping table (season → concrete `gregobase:` IDs) is the real deliverable;
build it by matching bbloomf's seasonal files to tonus's `la.ts` seasonal Te
lucis / In manus tuas entries and the `lu.ts` Marian antiphons (candidates
already located during investigation).

### 2. Wire `officium({ hora: "completorium" })`

- `hour.ts`: add `completorium` to the iteration list (line ~78) and a branch in
  `chantsForFeastHour` that assembles the ordo — resolve the fixed spine + the
  feast's `season` overrides + the Marian antiphon for that season, returning the
  chants in liturgical order. Reuse `resolveChant`/`resolveChants`.
- The psalms come via `tonus.psalmus({ psalm })` for 4/30/90/133 — decide whether
  `officium` inlines them or leaves psalms to `psalmus` (Compline is the one hour
  where returning the psalms makes sense, since they're fixed).
- Marian-antiphon season boundaries: implement the four-way rotation from the
  feast's date/season (Candlemas and Holy-Week cutoffs need date logic, not just
  the `Season` stem — check what `Feast` exposes; may need a small helper).

### 3. Provenance + docs

- `BIBLIOGRAPHY.md`: add bbloomf/compline as the ordo reference (public domain),
  and note the Marian-antiphon rotation is the standard Roman rule.
- `docs/chant.md`: document `hora: "completorium"` — what it returns, that
  Compline is fixed+seasonal, the Marian rotation.

## Verification

- `tonus.officium({ feast, hora: "completorium" })` returns the ordo chants in
  order for a given night; spot-check across seasons (Advent → Alma, Eastertide →
  Regina caeli, summer → Salve Regina).
- The returned chant IDs all resolve to real corpus entries (no dangling refs).
- Season-boundary tests: a feast just before/after Candlemas, Pentecost, Advent I
  flips the Marian antiphon correctly.
- `npm test` green; no new GABC data added (assert the ordo references only
  existing IDs).

## Open questions to resolve during build

- **Exact seasonal Te lucis / In manus tuas ID mapping** — match bbloomf's 17
  Te lucis season files + In manus tuas variants to `la.ts` entries (some are
  feast-specific in `la.ts`: Regis, Sacred Heart, Transfiguration — decide which
  tonus surfaces vs. the plain seasonal set).
- **Where the ordo table physically lives** — a tonus-corpus generator emitting
  `compline.ts`, vs. a documented hand-authored exception (it references IDs, not
  extracted chant text, so it's arguably editorial ordo, not "corpus data").
  Recommend: authored table in tonus-corpus `scripts/` emitting `compline.ts`, so
  the "generated, not hand-edited in tonus" rule holds.
- **Do the fixed psalms belong in the officium() return?** Leaning yes for
  Compline specifically (they're invariable), but that's a small API-shape call.

---

## FOLLOW-UP (decided 2026-07-05): corpus-extract the DO psalm scheme

Prime & Compline shipped hand-authored (structure + psalm scheme). The ordo
**structure** (which chants, order, seasonal/Marian/weekday RULES) is editorial
and rightly stays hand-authored in tonus, like masses.ts. But the **psalm
assignments** are transcribed by hand from DO source and could drift:

- DO encodes them authoritatively in
  `divinum-officium/web/www/horas/Latin/Psalterium/Psalmi/Psalmi minor.txt`,
  section `[Tridentinum]` (the traditional pre-1911 Roman scheme — the
  medieval-continuous one tonus wants; NOT the Pius X 1911 reform).
- Compline: `Completorium = 4, 30(2-6), 90, 133`
- Prime `[Tridentinum]` weekday table:
    Dominica  = 53, 117, 118(1-16), 118(17-32)
    Feria II  = 53, 23,  118(1-16), 118(17-32)
    Feria III = 53, 24,  ...
    Feria IV  = 53, 25,  ...
    Feria V   = 53, 22,  ...
    Feria VI  = 53, 21,  ...
    Sabbato   = 53,      118(1-16), 118(17-32)
    Festis    = 53,      118(1-16), 118(17-32)

TODO: a tonus-corpus step parses `Psalmi minor.txt` [Tridentinum] → emits the
per-hour/per-day psalm scheme (psalm + verse range) as data; tonus's ordo tables
reference it instead of the hand-copied numbers. Verse ranges already supported
via getPsalmRange() in psalm.ts. Also revisit whether the seasonal Capitulum
(Prima Special.txt, season-keyed short chapters) should be surfaced.
