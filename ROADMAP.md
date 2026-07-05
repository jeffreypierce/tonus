# Roadmap

Where tonus is headed. tonus models and renders the music of the Latin Middle
Ages — its pitch system, calendar, chant repertoire, and cosmology. The releases
so far complete the *analysis* core; the horizons ahead are about *rendering*,
*exploring*, and *understanding* that material more deeply.

**Practice.** Each horizon is developed on its own long-lived branch
(`feat/…`) and merged to `main` at version milestones. Versioning is SemVer:
`0.1.x` for additive changes, `0.2.0` for the first breaking change, `1.0.0` when
the public API is declared stable.

## Released

| Version | What |
| --- | --- |
| **0.1.0** | Core: tuning (`temperamentum`), calendar (`festum`/`pascha`), chant (`cantus`/`proprium`/`ordinarium`/`officium`/`psalmus`), score (`notatio` → MIDI/MusicXML), heavens (`caelum`/`harmonia`). |
| **0.1.1** | Prime and Compline office hours — the seasonal ordos, assembled from existing corpus chants. |
| **0.1.2** | Little-hours psalmody (Terce, Sext, None) — Ps 118 in course, from the extracted Divinum Officium Tridentine scheme. The Divine Office is now complete across all eight hours. |

## Horizon 1 — SVG rendering

Engraved square-note chant scores, self-contained (inline SMuFL paths, no font
dependency). A single-line renderer already exists on `feat/svg-emitter`; this
grows it into a full engraving system. *Detailed design: `working/plan-svg.md`.*

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

A documentation site that doesn't *describe* the library — it **runs** it, live
in the browser. tonus is dependency-free ESM and deterministic, so every value on
every page is computed on load, never transcribed; the site can't drift from the
code. *Detailed design: `working/plan-docs-site.md`.*

- **v1 — The site that runs the library.** Strong page layout and interaction;
  tuning, sky, and score builders with live data display. Shared state walked down
  the engine pipeline; state lives in the URL (shareable, deterministic).
- **v2 — Charts & diagrams.** The monochord, cents ruler, Guidonian hand, and the
  geocentric wheel — the medieval tuning and cosmology images, drawn live.
- **v3 — Web Audio.** Pitched playback (hear a tuning, play a score). Flagged as
  *maybe-defer* — weigh against scope and self-containment; decide when we get
  there.

## Horizon 3 — Cadence detection

Detect chant cadence data — where phrases resolve, the cadence formula, the
melodic approach — as pure data on the score. **Foundational:** it's the
prerequisite for chironomy (SVG v4) and enables downstream analysis. Sequenced
early. *Detailed design: `working/plan-cadence.md`.*

- **v1 — Cadence data.** Per-chant cadence detection surfaced on the score/tabula,
  following the pure-data convention (detection returns data; interpretation is a
  separate layer). Extends the existing `Prosody.cadence*` fields from *counting*
  cadences to *identifying* them.

> **Footnote — chant generation.** With mode, melodic, and cadence data in hand,
> generating "authentic" GABC becomes possible: pass in text, choose ambitus /
> conformance / melisma levels, get plausible chant for study. This would live as
> a *downstream* project, not inside tonus — though tonus may grow to expose more
> data or methods to support it. Noted here as motivation for the cadence data
> store; not a planned tonus feature.

## On the horizon, elsewhere

- **Hildegard corpus.** A [tonus-corpus](https://github.com/jeffreypierce/tonus-corpus)
  concern: extracting Hildegard von Bingen's chant once the `hildegabc` critical
  edition is ready. It would likely surface in tonus as a new `hildegardis()`
  method — composer-specific retrieval, the first single-composer collection.
- **Out of scope.** NABC / St. Gall notation; polyphony and organum.
