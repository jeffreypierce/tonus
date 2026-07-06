# Plan 3 — Season System Redesign: Temporale Aligned to Stems

**Status: FINALIZED — Option B chosen by Jeffrey 2026-07-02.**
Runs AFTER plan-1 (docs reorg), TOGETHER with plan-2 (rank) in one session
(same files touched). Do rank first, then this.

## Context

Companion to plan-2. Same goal: make the calendar's **season** model coherent
and medievally faithful, reconciled with the cal data.

## What the trace found (verified against current code 2026-07-02)

**Two different temporale representations that don't cleanly agree:**

1. **`findSeason` codes** (`calendar.ts:80-112`) — 7 season codes computed
   *purely from anchor dates*, never from cal data:
   `Season = "ad" | "ct" | "lt" | "ea" | "ap" | "ot" | "sg"` (`types.ts:6`).
   Labels (`SEASON_LABELS`, `types.ts:11`): Advent, Christmastide, Lent,
   Eastertide, Time after Pentecost, Time after Epiphany, Septuagesima.

2. **Cal-data Tempora stems** (`src/data/cal.ts`) — a *different*
   segmentation, one prefix per liturgical block (verified counts):
   `Adv` (28), `Nat` (2), `Epi` (42), `Quadp` (21, pre-Lent/Septuagesima),
   `Quad` (**63**, Lent — note: 63, not 42 as an earlier draft said),
   `Pasc` (55), `Pent` (168). Resolved in `resolveTemporaStem`
   (`date.ts:132+`) against the anchors.

**The mismatch:**
- Data separates `Nat` from `Epi`; `findSeason` folds Christmas→Baptism
  (Jan 13) into `ct` and post-Epiphany into `ot`.
- `findSeason` splits `ot` from `ap` — but `selectMasses` collapses `ap→ot`
  via `normSeason` (`calendar.ts:119`). **Verified: the split does ZERO work
  in mass selection.** Only Mass 11 (Orbis factor) is `ot`-only, and the
  collapse matches it to after-Pentecost feasts anyway (medievally the
  Sundays-per-annum mass serves both, so the collapse is accidentally
  defensible — but under this plan the choice becomes explicit).
- `sg` and `Quadp` are two names for the same pre-Lent block.

**Season consumers (verified):**
- `getFeast` filter — `calendar.ts:231` (`query.season`).
- `selectMasses` — `calendar.ts:127` (with the `ap→ot` collapse);
  `masses.ts` season arrays use `ad/ct/lt/ea/ot/ap`.
- **Gloria omission** — `ordinary.ts:126`:
  `["ad","lt"].includes(feast.season)`. **Bug: Septuagesima also omits the
  Gloria historically; `sg` is not checked.**
- **Sprinkle rite** — `ordinary.ts:160`: `season === "ea"` → *Vidi aquam*,
  else *Asperges*. Correct.
- Display — `SEASON_LABELS`; tests assert `ea`/`ct` filtering
  (`cal.test.mjs:41,56,86`).

**Anchors (verified):** Christmastide ends at Baptism (Jan 13);
`septuagesima = easter − 63`; `ot` runs Baptism → Septuagesima.

## Decision (settled): Option B — align Season to the data's temporale blocks

Season codes become one-to-one with the Tempora stems. `findSeason` and the
data then agree by construction; the Septuagesima Gloria bug disappears
naturally because pre-Lent is its own block with its own rules.

**New Season union** (lowercase stem names — self-documenting, greppable
against data):

```ts
type Season = "adv" | "nat" | "epi" | "quadp" | "quad" | "pasc" | "pent";
```

| Code | Label | Block | Old code(s) |
| --- | --- | --- | --- |
| adv | Advent | Advent I → Dec 24 | ad |
| nat | Christmastide | Christmas → (boundary, see below) | ct (part) |
| epi | Time after Epiphany | (boundary) → Septuagesima | ct (part) + ot |
| quadp | Septuagesima | Septuagesima Sunday → Ash Wed eve | sg |
| quad | Lent | Ash Wed → Holy Saturday | lt |
| pasc | Paschaltide | Easter → (through Pentecost octave?) | ea |
| pent | Time after Pentecost | (after Pasc) → Advent I | ap |

## Prerequisite inside this plan: the stem↔date correspondence table

Before touching code, build the exact correspondence and resolve two
boundaries **from the data itself** (`resolveTemporaStem` + entry IDs), then
lock `findSeason`'s anchors to match:

1. **nat/epi boundary.** Old `ct` ran to Baptism (Jan 13); the data has only
   2 `Nat` entries and 42 `Epi` entries. Determine where `Epi` actually
   begins in the data (Epiphany? day after Baptism?) and align `findSeason`
   to the DATA, not the old code. Document the choice in docs/calendar.md.
2. **pasc/pent boundary.** Does `Pasc` (55 entries) run through the Pentecost
   octave (Trinity eve) or end at Pentecost? Align to the data; the sprinkle
   rule (Vidi aquam) should cover exactly the paschal span.

Deliverable: a comment block in `calendar.ts` (or `date.ts`) recording the
correspondence, plus boundary tests below.

## Design

### `src/engines/cal/types.ts`
- Replace the `Season` union and `SEASON_LABELS` with the 7 block codes +
  labels above.

### `src/engines/cal/calendar.ts`
- `findSeason`: recompute boundaries to match the stems (keep UTC anchor
  math). For Tempora entries the stem itself is authoritative — prefer
  deriving season directly from the stem when present, with `findSeason`
  as the date-based answer for arbitrary dates/sanctorale; assert the two
  agree for every Tempora entry (test below).
- `selectMasses`: **delete `normSeason`** — the ap/ot collapse is replaced
  by explicit season arrays in masses.ts.

### `src/data/masses.ts`
- Re-map season arrays: `ad→adv`, `ct→nat` (and/or `epi` per the boundary
  decision — audit each mass), `lt→quad`, `ea→pasc`, `ot→epi`, `ap→pent`.
- Masses that carried `ot` without `ap` but were matched to after-Pentecost
  via the collapse (e.g. Mass 11 Orbis factor) now list **both** `epi` and
  `pent` explicitly, unless review decides otherwise. Where does `quadp`
  belong? Medievally pre-Lent uses the ferial/simple ordinary (Gloria-less);
  audit which masses should list it (likely those that listed `lt`, minus
  any Lent-specific ones — decide per mass, note reasoning in the diff).
- This edit lands in the same pass as plan-2's ranks→gradus conversion:
  **touch each mass entry once** with both changes.

### `src/engines/chant/ordinary.ts`
- Gloria omission (line 126) → named predicate over penitential seasons:
  `["adv", "quadp", "quad"].includes(feast.season)`. **Fixes the
  Septuagesima bug.**
- Sprinkle (line 160): `season === "pasc"` → *Vidi aquam*.
- **Alleluia suppression** (Septuagesima → Easter, the "burying of the
  Alleluia"): IN SCOPE if the ordinary/score layer has a natural hook
  (i.e., an existing alleluia element to gate on `quadp`/`quad`); if it
  requires new propers plumbing, log it as a follow-up instead. Surface
  which case it is before implementing.

### Tests — `tests/cal.test.mjs`
- Update season-filter assertions (`ea`→`pasc`, `ct`→`nat`) at lines
  41/56/86.
- Boundary tests: Advent I, Dec 24/25, Epiphany ± the nat/epi boundary,
  Septuagesima Sunday, Shrove Tue/Ash Wed, Holy Saturday/Easter, the
  pasc/pent boundary, day before Advent I.
- Stem↔season agreement: for every Tempora entry, season derived from stem
  === `findSeason(date)`.
- Gloria omitted in adv/quadp/quad; present in nat/epi/pasc/pent (rank
  permitting); Vidi aquam only in pasc.

### Docs — `docs/calendar.md` (post-reorg path from plan-1)
- Season section: the 7-block model, the correspondence table, the boundary
  decisions and their medieval basis (temporale explanation lives in
  `## Theory & Context`).

## Explicitly out of scope (logged, not lost)

- **Passiontide** (last 2 weeks of Lent — veiling, Vexilla Regis): add later
  as a date predicate over `quad`; the block model doesn't need an 8th code.
- **Ember days / vigils** as season-modeled objects (they remain feast
  entries; Ember ferias already rank as `feria-major` under plan-2).
- Corpus regen (stems already in data).

## Verification

- `npm test` green incl. `TZ=Asia/Tokyo`.
- All boundary dates land in the right season (list above).
- Gloria omitted across all three penitential seasons; Vidi aquam only pasc.
- `grep -rn '"ad"\|"ct"\|"lt"\|"ea"\|"ot"\|"ap"\|"sg"' src tests` → no stale
  old codes (mind false positives from unrelated strings).
- `grep -n normSeason src` → empty.
- Mass selection spot check: an after-Pentecost Sunday and an after-Epiphany
  Sunday both resolve non-empty, sensible `masses[]` (Orbis factor present
  where expected).
