# CLAUDE.md — orientation for tonus

tonus is a per-chant, deterministic TypeScript/ESM library modelling Gregorian
chant, tuning, the liturgical calendar, and cosmology. This file orients an agent
working in the repo; the detailed rules live in the standards docs below.

## The two boundaries (read these before adding anything)

- **Analysis boundary** — tonus computes what is derivable from **one chant or one
  moment** with received theory, deterministically. Corpus-scale analysis and
  editorial judgment (thresholds calibrated across many chants, family
  vocabularies, "genus average" baselines) do **not** belong here — they live in
  `tonus-enodatio` (sibling repo) and re-enter only as generated data with
  provenance. The library never runs a census; it cites one.
- **Rendering boundary** — `score` (via `notatio`) analyzes; `inscriptio` draws.
  Rendering is a standalone function taking a `Score`, not a method on one. tonus
  inks the score; analysis *tracks* (overlays above/below the staff) live
  downstream, built on the geometry contract `inscriptio` returns. One emitter
  format: SVG.

Both are stated in full in `.claude/standards/CODE-STANDARDS.md` → *Boundaries*.

## Standards docs — the source of truth

The two standards live in `.claude/standards/` (agent-facing, tracked, off the
public doc surface):

- **`.claude/standards/CODE-STANDARDS.md`** — TypeScript/ESM rules, naming, the
  two API layers, the query/builder contract (query = returns `[]` on no-match but
  **throws on a malformed query**; builder = throws on invalid input), data
  patterns, comment doctrine ("the code is authoritative").
- **`.claude/standards/DOCS-STANDARDS.md`** — the two-level documentation ladder
  (`docs/*.md` → code), the centralized bibliography, and the one-voice register.
  Read it before writing prose at any level, including code comments.
- **`BIBLIOGRAPHY.md`** — the keyed bibliography; cite as `[biblio: key]`.

## Register in one line

Public API methods are **Latin nouns of action** (`cantus`, `festum`, `notatio`,
`inscriptio`). Latin keys carry authentic Latin content (`nomen`, `modus`,
`genus`); English keys carry machine codes/data (`mode`, `season`, `date`).
Engine internals are English (`getFeast`, `buildScore`). Output data is English.

## Build & test

- `npm run build` — `tsc` + copies `psalms.json` to `dist/`.
- `npm test` — builds, then runs `node --test tests/*.test.mjs`. **Tests import
  from `dist/`, never `src/`** — always build before testing (the test script
  does).
- `npx tsc --noEmit` — typecheck without emit.
- Green tests **and** clean `tsc` at every commit. (Current floor: 457 tests.)

## The corpus pipeline (sibling repo)

The chant/calendar data in `src/data/*.ts` is **generated** by `tonus-corpus`
(`~/Developer/tonus-corpus`, private) — extractors read GregoBase + Divinum
Officium + the Nocturnale Romanum, then `scripts/sync-to-tonus.mjs` copies
`output/*.ts` → `src/data/`. Do not hand-edit generated data files; fix the
extractor and re-sync. Hand-built editorial tables (masses, tones, compline,
prime) live beside the engine that owns them, not in `src/data/`.

## Git & release

- Feature work on `feat/*` branches; merge to `main` with `--no-ff`.
- Commit messages end with the `Co-Authored-By: Claude` trailer.
- Versioning is 0.x, so **minor** is the breaking position. `npm publish` is a
  manual passkey flow — the registry can lag the git tags; check `npm view tonus
  version` before assuming a version shipped.
