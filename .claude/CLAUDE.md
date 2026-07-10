# CLAUDE.md — orientation for tonus

**The layout law.** ALL standing agent instruction lives in `.claude/` — this
file (auto-loaded) and `standards/`. Never create or resurrect root-level
instruction files (`CLAUDE.md`, `AGENTS.md`, `.cursorrules`, …): the root
belongs to humans (README, docs/, CHANGELOG, BIBLIOGRAPHY, COVERAGE, LICENSE).
`working/` is Jeffrey's gitignored workshop — specs, plans, and PROMPT files
there are session fuel, not standing instructions; don't migrate them here.

tonus is a per-chant, deterministic TypeScript/ESM library modelling Gregorian
chant, tuning, the liturgical calendar, and cosmology. This file orients an
agent working in the repo; the detailed rules live in the standards docs below.

## The two boundaries (read these before adding anything)

- **Analysis boundary** — tonus computes what is derivable from **one chant or
  one moment** with received theory, deterministically. Corpus-scale analysis
  and editorial judgment (thresholds calibrated across many chants, family
  vocabularies, "genus average" baselines) do **not** belong here — they live
  in `tonus-enodatio` (sibling repo) and re-enter only as generated data with
  provenance. The library never runs a census; it cites one.
- **Rendering boundary** — `score` (via `notatio`) analyzes; `inscriptio`
  draws. Rendering is a standalone function taking a `Score`, not a method on
  one. tonus inks the score; analysis *tracks* (overlays above/below the
  staff) live downstream, built on the geometry contract `inscriptio` returns.
  One emitter format: SVG.

Both are stated in full in `.claude/standards/CODE-STANDARDS.md` → *Boundaries*.

## Standards docs — the source of truth

- **`.claude/standards/CODE-STANDARDS.md`** — TypeScript/ESM rules, naming,
  the two API layers, the query/builder contract (query = returns `[]` on
  no-match but **throws on a malformed query**; builder = throws on invalid
  input), data patterns, comment doctrine ("the code is authoritative").
- **`.claude/standards/DOCS-STANDARDS.md`** — the two-level documentation
  ladder (`docs/*.md` → code), the centralized bibliography, and the one-voice
  register. Read it before writing prose at any level, including code comments.
- **`BIBLIOGRAPHY.md`** — the keyed bibliography; cite as `[biblio: key]`.

## Register in one line

Public API methods are **Latin nouns of action** (`cantus`, `festum`,
`notatio`, `inscriptio`). Latin keys carry authentic Latin content (`nomen`,
`modus`, `genus`); English keys carry machine codes/data (`mode`, `season`,
`date`). Engine internals are English (`getFeast`, `buildScore`). Output data
is English. Option keys are addresses (may be Latin); their values are codes.

## Build & test

- `npm run build` — `tsc` + copies `psalms.json` / `smufl-glyphs.json` to `dist/`.
- `npm test` — builds, then runs `node --test tests/*.test.mjs`. **Tests
  import from `dist/`, never `src/`** — always build before testing (the test
  script does).
- `npx tsc --noEmit` — typecheck without emit.
- `npm run lab` — regenerates the visual render gallery at
  `working/review/svg-lab.html` from `scripts/lab-plates.mjs` (Jeffrey keeps it
  open in a browser and refreshes). The same plate battery runs headlessly in
  `tests/render-lab.test.mjs` — a new rendering feature earns a plate, and the
  suite exercises it for free. Junicode resolves from `../Junicode-font` or
  `JUNICODE_DIR`.
- Green tests **and** clean `tsc` at every commit. (Current floor: 507 tests.)

## Fonts (license discipline)

tonus bundles NO font files, ever. The `fonts` option emits font-family
references; a slot's `embed` carries the CALLER's bytes into the SVG. Bravura
music glyphs are baked (SIL OFL). Junicode is OFL (safe to embed/bake).
Pfeffer and MyFonts/Kaer faces are license-restricted: reference-only unless
Jeffrey's permissions say otherwise.

## The corpus pipeline (sibling repo)

The chant/calendar data in `src/data/*.ts` is **generated** by `tonus-corpus`
(`~/Developer/tonus-corpus`, private) — extractors read GregoBase + Divinum
Officium + the Nocturnale Romanum, then `scripts/sync-to-tonus.mjs` copies
`output/*.ts` → `src/data/`. Do not hand-edit generated data files; fix the
extractor and re-sync. Hand-built editorial tables (masses, tones, compline,
prime) live beside the engine that owns them, not in `src/data/`.

## Git & release

- Feature work on `feat/*` branches; merge to `main` with `--no-ff`.
- **No AI co-author trailers.** Commit messages carry no `Co-Authored-By:
  Claude` (or similar) lines — Jeffrey's preference, matching general
  consensus. Plain, descriptive messages only.
- Versioning is 0.x, so **minor** is the breaking position. `npm publish` is a
  manual passkey flow — the registry can lag the git tags; check
  `npm view tonus version` before assuming a version shipped.
- **License: PolyForm Noncommercial 1.0.0 from 0.2.0** (0.1.x remain MIT).
  Before the 0.2.0 push, the LICENSE text must be verified against
  polyformproject.org (it was transcribed offline). Publish is gated on that.
