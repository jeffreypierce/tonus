# Plan 1 — Tonus Docs Unification & Reorganization

**Status: FINALIZED — ready to execute. Runs FIRST (before plan-2/plan-3).**
Verified against the repo 2026-07-02: layout, line counts, link targets, and
voice issues all confirmed as described below.

## Context

The monolithic `docs/API.md` was split into per-engine pages under
`docs/api/`, with a parallel `docs/theory/` directory. Problems:

1. **Theory/API split is artificial** — each API page already opens with
   theory-flavored context while the standalone theory files cover the same
   engines from another angle; readers hop between two files per engine and
   the two drift.
2. **Three inconsistent voices** — `calendar.md` is confident/direct;
   `doctrines.md` opens with dry file-framing ("# doctrines.ts — Derivation
   Methodology / This document describes…"); `solesmes-rhythm.md` opens with
   scholarly meta-narration ("This document records…").
3. **Layout** — content files at root, reference pages in a conventional
   flat `docs/`, the internal liturgical review out of the tree, and a
   gitignored working space.

**Goal:** one page per engine (reference + scholarly background + its own
sources), consistent two-register voice, clean root/docs/working split.

## Decisions (all settled)

**Voice**
- Reference prose stays **practical and direct** (the `calendar.md`
  register — declarative lead, no "This document…" preamble).
- `## Theory & Context` sections may be **more scholarly** (the register
  `doctrines.md`/`solesmes-rhythm.md` already use, minus file-framing).

**Structure**
- Fold each theory file into its engine's reference page as a
  `## Theory & Context` section; **delete `docs/theory/`**.
- Section order per page: reference first → `## Theory & Context` →
  `## Sources`.
- **Name the tuning page `tuning.md`, not `temperamentum.md`** — the other
  pages use English topic names. (The API method it documents stays
  `tonus.temperamentum`.)
- `chant.md` grows a full Theory & Context (Solesmes restoration, GABC
  encoding, Mass proper/ordinary + Office cursus, psalm-tone mechanics).

**Layout**
- **Root content files (stay at root, no merging):** `README.md`,
  `BIBLIOGRAPHY.md`, `STANDARDS.md`.
- **Reference pages flatten from `docs/api/` to `docs/`** directly:
  `docs/{calendar,chant,tuning,score,heavens}.md` + `docs/index.md`
  (the current `docs/api/README.md`, renamed to avoid a folder-README that
  competes with root README). Root README + BIBLIOGRAPHY link into `docs/`.
- **README vs docs/index.md — split the job, no duplication.** README is
  the front door (pitch, install, ONE quick-start example, a short
  `## Documentation` section linking to `docs/index.md`). It does **not**
  repeat the full method table. `docs/index.md` is the reference hub: the
  canonical ten-verb method table (→ per-engine pages), the shared
  conventions, and the error/determinism contracts. The current README's
  "What's inside" method table moves to `docs/index.md`; README keeps only a
  one-line-per-engine teaser at most, or just the link.
- **`working/` — NEW, gitignored** — internal/working/memory docs that live
  with the repo but don't ship. `REVIEW-liturgical.md` moves here.
  (Note: `working/` now already exists on disk holding these plan files —
  just add it to `.gitignore` and move the review in.)

**Bibliography**
- Each `docs/*.md` page ends with its own `## Sources`.
- Root `BIBLIOGRAPHY.md` becomes a **slim master index** — one line per
  source → the page that details it. Jeffrey supplies the complete
  bibliography separately (capture format at bottom); this plan sets up the
  structure to receive it.

## Target layout

```
README.md            (root, links into docs/)
BIBLIOGRAPHY.md      (root, slim master index → docs/*#sources)
STANDARDS.md         (root, contributor code standards — unchanged content)
docs/
  index.md           (was docs/api/README.md: method index, conventions, contracts)
  calendar.md        reference + ## Theory & Context (computus, era) + ## Sources
  chant.md           reference + ## Theory & Context (NEW: corpus/GABC/structure) + ## Sources
  tuning.md          reference (was api/temperamentum.md) + Theory (tuning.md folded) + Sources
  score.md           reference + ## Theory & Context (solesmes-rhythm folded) + ## Sources
  heavens.md         reference + ## Theory & Context (doctrines folded) + ## Sources
working/             (GITIGNORED — plan files + REVIEW-liturgical.md)
.gitignore           (+ working/)
(docs/api/ and docs/theory/ removed)
```

## Execution steps

### 1. Move & rename files

- `git mv docs/api/README.md docs/index.md`
- `git mv docs/api/calendar.md docs/calendar.md` (and chant, score, heavens)
- `git mv docs/api/temperamentum.md docs/tuning.md`
- `git rm -r docs/api` (empty after moves)
- Add `working/` to `.gitignore`; move `docs/REVIEW-liturgical.md` to
  `working/REVIEW-liturgical.md` and `git rm --cached` it (keep the file on
  disk, untracked). Verify it's gone from the index and present on disk.

### 2. Fold theory into reference pages

- **tuning.md** ← `theory/tuning.md`. tuning.md is already in-voice
  (why-chant-cares / commas / presets / comparison table / choosing). Drop
  its `# Tuning Systems` H1 and its own `## Sources`; nest the body under
  `## Theory & Context`. Remove the now-circular "see theory/tuning.md"
  pointer in the reference intro.
- **heavens.md** ← `theory/doctrines.md`. **Longest merge (264+238 lines,
  verified).** Rewrite the `# doctrines.ts — Derivation Methodology` opening
  into a prose lead. Keep per-author derivations, computational-verification,
  decisions/ambiguities. **The "no Fixed Stars body in caelum" note is
  CONFIRMED STALE** — `FixedStars` is now implemented in the harmonia engine
  (ratio 3:2). Update the stale passages (doctrines.md ~lines 71 and 236)
  during the fold. If combined length feels heavy on review, flag the
  derivation math as the trim candidate — don't cut unilaterally.
- **score.md** ← `theory/solesmes-rhythm.md`. Rewrite "This document
  records…" into a declarative lead. Keep primary-sources, core-model,
  three-rules, overrides, seven-types, modeled-vs-not. Align wording with
  the Carroll citations already inline in score.md's `Note`/`Performance`
  comment blocks.

### 3. Add Theory & Context to calendar.md and chant.md

- **calendar.md:** promote the computus explanation already in the body into
  `## Theory & Context` — dual computus (Gauss/Butcher + Julian pre-1583),
  temporale/sanctorale structure, Tridentine-vs-medieval continuity. The
  full continuity treatment was in REVIEW-liturgical.md, which is leaving the
  tree — so **summarize the continuity conclusion inline here** (it must
  survive as public-facing text) rather than linking to the now-internal
  review. Remove the `../REVIEW-liturgical.md` link.
  **Do NOT deep-rewrite the rank/season sections beyond the reorg** — plan-2
  and plan-3 rewrite them against the new model; keep this pass structural.
- **chant.md:** NEW `## Theory & Context` — Solesmes restoration (why 1961
  GR, editorial-judgment caveat), GABC encoding (neumes as text, tie to
  neume names in tuning.md), Mass structure (proper vs ordinary/Kyriale),
  Office cursus + canonical hours, psalm-tone mechanics (intonation/mediant/
  termination, differentiae, tonus peregrinus). Provenance from
  `src/data/{gr,lu,la,lh,tones}.ts` headers (verified present).

### 4. Per-page `## Sources`

Each `docs/*.md` ends with `## Sources` listing only what that page relies on
(full citation detail lives here now):
- calendar — Divinum Officium; computus refs.
- chant — GregoBase; the four Solesmes books; DO propers/office/psalter.
- tuning — Boethius *De inst. mus.*; Ptolemy *Harmonics*; Barbour *Tuning &
  Temperament*; Scala format; Guido/mode theory.
- score — Carroll, Gajard, Mocquereau.
- heavens — Godwin ×3; the four doctrina primaries; Standish/JPL.

### 5. Slim BIBLIOGRAPHY.md to a master index

One line per source → detailing page. Keep the footer note about
author-consulted sources. Await Jeffrey's complete bibliography to populate
final detail (structure ready to receive it). Example:

```
- **GregoBase** — chant corpora → [docs/chant.md](docs/chant.md#sources)
- **Divinum Officium** — calendar/propers/office/psalter → calendar.md, chant.md
- **Godwin ×3** (1987/1991/1993) — musica universalis → heavens.md
- **Standish 1992 / JPL DE430** — ephemeris → heavens.md
```

### 6. Fix all cross-references

- Root `README.md`: `docs/API.md`/`docs/api/` links → `docs/index.md`;
  the REVIEW-liturgical link → drop (now internal), replace with the inline
  era note already in README + pointer to `docs/calendar.md#theory--context`.
- Intra-`docs/` links to `../theory/*` → same-page `#theory--context`.
- `git grep -n "theory/\|docs/api/\|REVIEW-liturgical\|API\.md"` across
  tracked files → only intended hits remain.
- `STANDARDS.md`: verify its own links (it references file paths, low risk).

### 7. Voice pass

Read all five `docs/*.md` end-to-end: reference declarative/practical;
Theory scholarly but never meta-narrating ("This document…" banned). README
is the touchstone for the reference register.

## Bibliography capture format (for Jeffrey, separate track)

One block per source, plain list, any order — will be normalized:

```
- Author(s):        last, first  (or institution, e.g. "JPL Solar System Dynamics")
- Title:            book/article/dataset title (+ chapter or section if specific)
- Year:             edition or publication year
- Publisher/Venue:  publisher & city, or journal, or project/site name
- URL/DOI:          if online (Scala archive, DO repo, JPL page, GregoBase)
- Used for:         one phrase — which engine/claim it backs
```

The **"Used for"** line is the most valuable and easiest to lose — it routes
each citation to the right `docs/*#sources` page. Minimum viable: author +
title + "used for". Editions matter for the primaries (which Boethius/Ptolemy
translation, which Godwin volume).

## Critical files

- Delete after folding: `docs/theory/{tuning,doctrines,solesmes-rhythm}.md`
- Move: `docs/api/*` → `docs/*` (rename README→index, temperamentum→tuning)
- Untrack (keep on disk): `docs/REVIEW-liturgical.md` → `working/`
- New sections authored: `docs/{calendar,chant}.md`
- Edit: root `README.md`, `BIBLIOGRAPHY.md`, `.gitignore`
- Update stale claims against: `src/engines/harmonia/` (FixedStars, 3:2),
  `src/data/*.ts` headers

## Verification

- `git grep -n "theory/\|docs/api/\|REVIEW-liturgical\|docs/API\.md"` →
  only intended hits (ideally none).
- `git grep -ln "This document"` → empty (meta-narration purged).
- `git ls-files working/` → empty (working/ untracked); `ls working/` →
  REVIEW-liturgical.md present on disk.
- Each `docs/*.md` except `index.md` has one `## Theory & Context` then one
  `## Sources`, after the reference material.
- Manual read-through of all five pages for voice + flow.
- Docs-only change; `npm test` unaffected.

## Sequencing

This plan runs **first**. Plans 2 (rank) and 3 (season) run together in one
session afterward and reference `docs/calendar.md` (the post-reorg path).

## Out of scope

README finalization (voice/intro polish), the GitHub Pages demo, the final
technical-feedback writeup, npm publish.
