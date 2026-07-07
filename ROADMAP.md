# Roadmap

tonus models and renders the music of the Latin Middle
Ages — its pitch system, calendar, chant repertoire, and cosmology. The releases
so far complete the _analysis_ core; the horizons ahead are about _rendering_,
_exploring_, and _understanding_ that material more deeply.

**Practice.** Each horizon is developed on its own long-lived branch
(`feat/…`) and merged to `main` at version milestones. Versioning is SemVer:
`0.1.x` for additive changes, `0.2.0` for the first breaking change, `1.0.0` when
the public API is declared stable.

## Released

| Version   | What                                                                                                                                                                                           |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0.1.0** | Core: tuning (`temperamentum`), calendar (`festum`/`pascha`), chant (`cantus`/`proprium`/`ordinarium`/`officium`/`psalmus`), score (`notatio` → MIDI/MusicXML), heavens (`caelum`/`harmonia`). |
| **0.1.1** | Prime and Compline office hours — the seasonal ordos, assembled from existing corpus chants.                                                                                                   |
| **0.1.2** | Little-hours psalmody (Terce, Sext, None) — Ps 118 in course, from the extracted Divinum Officium Tridentine scheme. The Divine Office is now complete across all eight hours.                 |
| **0.1.3** | Cadence detection (`score.cadences` — per-mode melodic cadence figures, after Niedermeyer & d'Ortigue); psalm tones _in directum_ and solemn mediants; Suñol-derived neum timing (salicus, oriscus); the Latin modal ethos. |
| **0.1.4** | Modulation detection (`score.modulations` — where the tonal centre leans away from the home mode, calibrated against Suñol); richer modal affinity (degree-, ictus-, and cadence-weighted, with ranked initials after Rockstro); `modus()` tunes its finalis, tenor, and ambitus through the temperamentum. |

## Horizon 1 — SVG rendering

Engraved square-note chant scores, self-contained (inline SMuFL paths, no font
dependency). A single-line renderer already exists on `feat/svg-emitter`; this
grows it into a full engraving system. _Detailed design: `working/plan-svg.md`._

- **v1 — Multiline scores.** System wrapping, custos at line ends, front matter
  (dropcap, mode/genre annotation, rubrication). Good-looking, real chant pages.
- **v2 — Annotations & layout options.** Data annotations from tonus fields,
  layout controls (spacing, fonts), per-note highlighting, and the `data-*` hooks
  contract for runtime follow-along.
- **v3 — Modern notation.** A modern-notation transcription mode (5-line staff,
  noteheads, slurs) — likely a distinct method or mode if its arguments diverge
  sharply from square-note rendering.
- **v4 — Advanced diagramming.** Chironomy diagrams (Carroll/Pierik's reclining
  figure-8 arcs). **Depends on cadence detection (Horizon 3).**

## Horizon 2 — Interactive documentation

A documentation site that doesn't _describe_ the library — it **runs** it, live
in the browser. tonus is dependency-free ESM and deterministic, so every value on
every page is computed on load, never transcribed; the site can't drift from the
code. _Detailed design: `working/plan-docs-site.md`._

- **v1 — The site that runs the library.** Strong page layout and interaction;
  tuning, sky, and score builders with live data display. Shared state walked down
  the engine pipeline; state lives in the URL (shareable, deterministic).
- **v2 — Charts & diagrams.** The monochord, cents ruler, Guidonian hand, and the
  geocentric wheel — the medieval tuning and cosmology images, drawn live.
- **v3 — Web Audio.** Pitched playback (hear a tuning, play a score). Flagged as
  _maybe-defer_ — weigh against scope and self-containment; decide when we get
  there.

## Horizon 3 — Melodic analysis

Read a chant's tonal structure as pure data on the score. **Cadence detection**
(`score.cadences`, 0.1.3) and **modulation detection** (`score.modulations`,
0.1.4) now cover where each phrase resolves and where the tonal centre leans
away from the home mode — the foundation for chironomy (SVG v4) and downstream
analysis. What remains:

- **Melodic-type classification.** Apel's centonization — which recurring
  formula families a chant is assembled from. _Design: `working/plan-melodic-types.md`._
- **Accentual cadences + tenor-resting medial figures** — both awaiting a Latin
  word-accent model.
- **Modulation refinements** — distinguishing a transposed mode from a genuine
  internal modulation; finer-than-phrase granularity.

> **Footnote — chant generation.** With mode, melodic, and cadence data in hand,
> generating "authentic" GABC becomes possible: pass in text, choose ambitus /
> conformance / melisma levels, get plausible chant for study. This would live as
> a _downstream_ project, not inside tonus — though tonus may grow to expose more
> data or methods to support it. Noted here as motivation for the cadence data
> store; not a planned tonus feature.

## On the horizon, elsewhere

- **Hildegard corpus.** A [tonus-corpus](https://github.com/jeffreypierce/tonus-corpus)
  concern: extracting Hildegard von Bingen's chant once the `hildegabc` critical
  edition is ready. It would likely surface in tonus as a new `hildegardis()`
  method as composer-specific retrieval.
- **Fludd and Kepler doctrinae.** Two more planetary-harmony systems for
  `harmonia` — heliocentric frames working from monochord string-length data,
  where the four current doctrinae are geocentric and interval-based.
- **Out of scope.** NABC / St. Gall / Leon notation; polyphony and organum (for now).
