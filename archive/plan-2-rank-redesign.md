# Plan 2 — Rank System Redesign: Calendar Dignity

**Status: FINALIZED — all open questions resolved with Jeffrey 2026-07-02.**
Runs AFTER plan-1 (docs reorg), TOGETHER with plan-3 (season) in one session —
they touch the same files (`types.ts`, `calendar.ts`, `ordinary.ts`,
`masses.ts`, `cal.test.mjs`).

## Context

The liturgical calendar grew three overlapping rank fields incrementally, and
they now duplicate and *contradict* each other. This plan makes sense of them
for both the code (mass selection needs an orderable dignity) and the
project's medieval goals.

**What the trace found** (verified against current code 2026-07-02):

| Field | Role today | Problem |
| --- | --- | --- |
| `rank` (0–4 number) | **LOGIC** — sort/priority (`calendar.ts:74,174,246`), `FeastQuery` filter (`234`), mass eligibility `mass.ranks.includes` (`selectMasses`, `129`), and an ordinal threshold `rank <= 2` (`ordinary.ts:59`) | Derived from DO's *1960-flavored* numeric rank; its 4-bucket collapse is **medievally incoherent** — lumps Duplex with Feria major, splits Semiduplex across buckets. Disagrees with `ritus`. |
| `rankLabel` (string) | **DEAD** — written at `calendar.ts:143/148`, read by nothing except the `ritus: entry.ritus ?? rankLabel` fallback at `149`, which never fires (all 642 entries have `ritus`) | Pure redundancy; 1:1 with the number via `RANK_LABELS`. |
| `ritus` (string) | **DISPLAY** — asserted by tests, medievally authentic (from the default Tridentine DO line), **19 distinct values (verified)** | Free-text; not orderable in code. Derived from a different rubric layer than the number, so the two disagree. |

Also verified: **rank 0 ("Triduum Sacrum") is unreachable** — no data entry
uses it. (Root cause discovered: DO labels the Triduum "Feria privilegiata
Duplex I classis", a privileged *feria*, so it never mapped to the feast
buckets.) The `?? "Feria"` fallback at `calendar.ts:143` guards the
`RANK_LABELS` lookup against an out-of-range rank, not missing ritus.

## Decisions (all settled with Jeffrey)

1. **`ritus` is the single source of truth.** Delete dead `rankLabel` +
   `RANK_LABELS`.
2. **Classis-primary precedence ordering** (not solemnity-primary): in
   occurrence rules, first-class beats non-first-class regardless of the
   duplex/semiduplex axis — a plain Duplex feast never displaces a Lent
   Sunday (Semiduplex I classis). The 14-grade table below is FINAL.
3. **`masses.ts` references grades by `Gradus` NAME** (self-documenting,
   survives future reordering), not by number.
4. **Keep a derived numeric `rank`** on `Feast` (ordinal over `GRADUS_ORDER`)
   for cheap sorting/filtering. Three fields, now non-redundant:
   `ritus` (authentic source) → `gradus` (canonical typed grade) → `rank`
   (derived ordinal).

## The canonical grade table (FINAL — classis-primary, high → low)

Decoded from the actual data (who carries each ritus string):

| # | Gradus | ritus strings that reduce here | Who it is |
| --- | --- | --- | --- |
| 1 | `triduum` | "Feria privilegiata Duplex I classis" | Maundy Thu, Good Fri, Holy Sat (Quad6-4/5/6) |
| 2 | `duplex-i` | "Duplex I classis", "Duplex I classis cum Octava communi", "…cum Octava privilegiata I/II/III ordinis" | Christmas, Easter, Pentecost… |
| 3 | `duplex-majus-i` | "Duplex majus I classis" | Low Sunday (Pasc1-0) |
| 4 | `semiduplex-i` | "Semiduplex I classis" | Lent Sundays I–V, Palm Sunday, Easter/Pentecost octave weekdays |
| 5 | `feria-privilegiata` | "Feria privilegiata" | Ash Wed (Quadp3-3), Holy Week Mon–Wed |
| 6 | `duplex-ii` | "Duplex II classis", "Duplex II classis cum Octava simplici" | |
| 7 | `semiduplex-ii` | "Semiduplex II classis" | Advent II–IV Sundays, Corpus octave days |
| 8 | `duplex-majus` | "Duplex majus" | |
| 9 | `duplex` | "Duplex" | |
| 10 | `semiduplex` | "Semiduplex" | ordinary Sundays + semiduplex feasts |
| 11 | `simplex` | "Simplex" | |
| 12 | `feria-major` | "Feria major" | Advent/Lent ferias, Ember days |
| 13 | `vigilia` | "Vigilia" | |
| 14 | `feria` | "Feria" | |

This covers **all 19 verified ritus strings** exactly once. Notes recorded at
decision time: #3 vs #4 are both effectively undisplaceable (order between
them chosen as above); privileged ferias (#5) yield to no feast; Simplex above
Feria major is correct under the old rubrics (a Simplex feast wins the office
on a Lenten feria, feria commemorated). The original draft's table put the
Triduum below Simplex — that bug is what this table fixes.

## Design

### `src/engines/cal/types.ts`
- **Delete** `RANK_LABELS` and the `rankLabel` field on `Feast`.
- Add `type Gradus = "triduum" | "duplex-i" | "duplex-majus-i" |
  "semiduplex-i" | "feria-privilegiata" | "duplex-ii" | "semiduplex-ii" |
  "duplex-majus" | "duplex" | "semiduplex" | "simplex" | "feria-major" |
  "vigilia" | "feria"` with an ordered `GRADUS_ORDER: Gradus[]` (the table
  above) and a `GRADUS_LABEL` map (canonical Latin display string per grade).
- Add a `RITUS_TO_GRADUS` reduction — an **ordered, most-specific-first
  matcher** (not plain `includes`): "Feria privilegiata Duplex I classis"
  must match before "Feria privilegiata" AND before "Duplex I classis";
  "Duplex majus I classis" before "Duplex majus" before "Duplex";
  "Semiduplex I/II classis" before "Semiduplex". Safest: exact-match table
  over all 19 strings, with the ordered-prefix matcher only as fallback for
  future data.
- Redefine `Rank` as the derived ordinal 1..14
  (`GRADUS_ORDER.indexOf(gradus) + 1`).
- `Feast` gains `gradus: Gradus`; keeps `ritus` (authentic string) and
  `rank` (derived number).

### `src/engines/cal/calendar.ts`
- `calEntryToFeast`: compute `gradus = reduceRitus(entry.ritus)`, then
  `rank = gradusRank(gradus)`. Remove the `rankLabel` line and the dead
  fallbacks (ritus is present in all 642 entries; if a future entry lacks
  it, reduce from `entry.rank` as an explicit, logged fallback).
- Sorts at `74/174/246` and the filter at `234` keep working on the derived
  number (lower = higher dignity, unchanged convention).

### `src/data/masses.ts`
- Convert every `ranks: number[]` (18 masses + 2 AD_LIB) to **grade-based
  eligibility by `Gradus` name** — either explicit `gradus: Gradus[]` arrays
  or `{ minGradus, maxGradus }` inclusive ranges over `GRADUS_ORDER`
  (implementer's choice; ranges likely cleaner since the old arrays were
  contiguous buckets). Re-derive each mass's intent from the old 0–4 buckets,
  then **verify against representative feasts** (below). Update the
  `ranks (0–4)` comment.

### `src/engines/chant/ordinary.ts`
- The `rank <= 2` threshold at line 59: first determine which feasts it
  currently selects (old ranks 1–2), then re-express as a named predicate —
  e.g. `isHighFeast(feast)` ≙ gradus at or above `duplex-ii` (ordinals 1–6).
  Confirm the before/after feast sets match intent during review; the goal
  is intent-preserving, not blind numeric translation.

### `src/data/cal.ts` / tonus-corpus
- Data unchanged (ritus already present). The numeric `rank` in `CalEntry`
  becomes **advisory/legacy** — the engine derives its own from ritus.
  A later corpus pass may drop it; out of scope here (avoids data regen).

### Tests — `tests/cal.test.mjs`
- Update `.rank` assertions to the new 1–14 scale (Christmas "Duplex I
  classis cum Octava…" → gradus `duplex-i`, rank 2 — note the Triduum now
  holds rank 1). Sort tie-break test still holds (lower = higher priority).
- Add: exact reduction of all 19 ritus strings → expected gradus (table-
  driven test); compounds reduce correctly ("…cum Octava communi" →
  `duplex-i`, "Feria privilegiata Duplex I classis" → `triduum`); every
  feast's `gradus` is a valid enum; `rank` strictly monotone with
  `GRADUS_ORDER`.
- Add: mass selection resolves non-empty `masses[]` for Christmas, a Duplex,
  a Semiduplex, a feria, AND Good Friday (guards the masses.ts re-map and
  the new top grade).

### Docs — `docs/calendar.md` (post-reorg path from plan-1)
- Replace the rank/rankLabel/ritus section with the new model:
  `ritus` (authentic) → `gradus` (canonical typed grade, ordered) → `rank`
  (derived ordinal). Include the 14-grade table with the "who it is" column
  — it doubles as the medieval-basis explanation for Theory & Context.

## Verification

- `npm test` green (all existing + new), incl. `TZ=Asia/Tokyo`.
- `grep -rn "rankLabel\|RANK_LABELS" src tests docs` → empty.
- Every feast: `gradus` valid; `rank` monotone with grade order.
- Reduction table covers all 19 ritus strings; assert no feast falls through
  to a fallback.
- Mass selection non-empty for Christmas / Duplex / Semiduplex / feria /
  Good Friday (before-and-after spot check).
- `ordinary.ts` high-feast preference fires for the same feast set as before
  (or a deliberately-documented delta).

## Scope

Pure engine + data change; no corpus regen. Executes in the same session as
plan-3 (season) — do rank first, season second, one combined test/verify
pass at the end.
