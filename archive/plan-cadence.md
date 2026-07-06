# Plan — Cadence detection

**Status: STUB. Detailed design to come when this horizon is picked up.**
See `ROADMAP.md` (Horizon 3) for where this sits.

## Why it's foundational

Cadence detection is a prerequisite for two other things:

1. **Chironomy diagrams** (SVG v4) — Carroll/Pierik's reclining figure-8 arcs need
   to know where phrases resolve; cadence points anchor the chironomic shape.
2. **Chant generation** (downstream, elsewhere) — generating "authentic" GABC
   needs a model of how chant phrases cadence; the cadence data store is the seed.

## What v1 should produce

Detect and expose per-chant cadence data: where phrases come to rest, the
cadence *type/formula* (mode-specific cadential figures), and the melodic
approach. Pure data on the `Score`/tabula, following the pure-data convention
(detection returns data; interpretation is a separate layer — see the existing
arsis/thesis classifier in `src/engines/score/ir.ts` as the pattern).

## Starting points (already in the codebase)

- `docs/score.md` §"Modeled and not" lists cadence formulas as explicitly
  deferred — this is that work.
- `working/solesmes-rhythm-notes.md` — the treatise notes (Carroll, Gajard, the
  seven rhythmic types) that inform cadence + chironomy.
- The compound-beat/ictus classifier (`ir.ts`) is the precedent for a
  detection pass over the phrase tree.
- `Prosody.cadenceWeight` / `cadenceDistribution` already exist on the score —
  cadence *counting* is there; this adds cadence *identification*.

## Open questions (for the real plan)

- Data shape: cadence events on `phrases`, or a parallel `cadences[]` on the
  score? How they surface on the tabula.
- Mode-specific cadence formula catalog — sourced from where (Solesmes / the
  treatises)?
- Relationship to the existing `Prosody.cadence*` fields — extend or complement.
