# Changelog

All notable changes to tonus. Newest first.

## 0.2.0

The "wrap-up" release — tonus as a finished library. Rendering becomes a first-
class engine, the per-chant analysis chart is completed, a synthetic voice
joins, and the emitter surface is settled on one format.

### Added

- **`inscriptio(score, opts?)`** — the standalone SVG renderer. Draws a `Score`
  and returns `{ svg, geometry }`. Two notation species, each with its own
  spacing pass: `"quadrata"` (square-note, SMuFL glyphs baked inline) and
  `"moderna"` (modern round-note transcription — treble-8 clef, engraved slurs,
  after the Lomer practice). A multi-system **layout engine** (`width`,
  `systemGap`, `custos`, `until`), **front matter** (`title`, `rubric` /
  `annotation: "auto"`, `dropcap`, `rubrica`), and a `highlight` hook.
- **The geometry contract** — `geometry: NoteGeometry[]`, one entry per note in
  tabula order (system, x, y, systemY). A public API: downstream analysis tracks
  build on it instead of scraping the SVG.
- **The intonation channel** — `accidentals: "standard" | "heji" | "cents"`.
  HEJI comma accidentals are baselined on the Pythagorean chain (tonus's default
  tuning), so a Pythagorean chant renders clean and syntonic-comma arrows bloom
  only under a just preset; meantone is not just, so `heji` throws under it.
  `cents` labels signed deviations against `"pythagorean"` (default) or `"et"`.
- **Score metrics** on `prosody`: interval statistics (histogram, maxLeap,
  leapRate, step/skip/leap `motus`), `tessitura`, the melodic `arcus`
  (initial/peak/final + arch index), `melismaCadential`; and conveniences
  `phrase.noteCount` / `phrase.syllableCount` / `syllable.melisma`.
- **`vox` and `chorus`** — a synthetic singing voice as formant and spectrum
  data, and seeded ensembles.

### Changed

- **Corpus double-escape fixed.** Every `gabc` field stored its non-ASCII as a
  literal `\uXXXX` escape, which had silently disabled accent detection across
  the whole corpus — so note weights, prosody, rhythm, and imprint were computed
  accent-blind. The extractor now decodes correctly; **computed accent weights
  shift corpus-wide** as a result. A guard test asserts no gabc carries an escape.
- **`cantus({})` throws.** An empty or unknown-key chant query is a caller bug,
  not an empty result; it throws with guidance (matching the `festum` contract).
- NABC pipes stripped from the corpus (`(notes|nabc)` → `(notes)`), with a
  corpus-wide guard test.

### Removed

- **The MusicXML and MIDI emitters** (`score.musicxml()`, `score.midi()`).
  tonus emits one format now: SVG. Microtuning still lives on the tabula
  (`bend`/`hz`/`offset`) for a Web-Audio player to read directly — microtonally
  exact, which MIDI never was.

## 0.1.8

- **Roman Matins.** `matutinum({ feast })` assembles the structured Roman night
  office — the nocturns with their great responsories — from the community
  *Nocturnale Romanum* (new `nr` chant source, 1,564 chants). Sanctorale feasts
  draw Matins from their commune; coverage is the sanctorale and Advent today
  (see COVERAGE.md). A separate accessor; the flat `officium` path is unchanged.

## 0.1.7

- **`corpus(code)`** — metadata and analytics for a corpus book. Returns its
  bibliographic identity (title, full Latin title, edition, year, editor, scan
  attribution — drawn from GregoBase's catalogue) plus a breakdown of its
  contents: genre distribution, mode distribution (I–VIII with a null bucket),
  and cross-book **overlap** — the book's full pre-dedup `total`, its `unique`
  count, and how many chants it `shared` with each other book. The overlap shows,
  e.g., that the Liber Usualis is largely the Graduale and Antiphonarius combined,
  while the Antiphonale Monasticum is nearly its own repertoire.
- The `*_SOURCE` objects now carry `fullTitle`, `edition`, and `scanSource`.

## 0.1.6

- **The monastic Office.** `officium({ rite: "monasticum" })` assembles the
  Benedictine cursus — the little hours, Lauds, Vespers, Compline, and Prime —
  from the Antiphonale Monasticum, with the monastic psalm distribution
  (Compline is Ps 4, 90, 133). The Roman rite is the default; the two share a
  calendar. Monastic Matins is served flat (its nocturn structure is future
  work). Also adds the Antiphonale Monasticum (1934) as a retrievable chant
  source: `cantus({ source: "am" })`, 1,429 chants.
- **Guidonian hand** corrected to the canonical counter-clockwise spiral (it had
  filled linearly). The `Finger`/`Region` types are tightened (`wrist`/`palm`
  removed, `super` added).
- **Double mora** (`..`) now lengthens correctly, and `Note.context` /
  the tabula row carry `mora: 0 | 1 | 2` (was a `doubleEpisema` boolean) so the
  single/double distinction is available for scoring.
- **f-clef** pitch mapping fixed (f3/f4 were a third off).
- Internal: generated corpus data separated from hand-authored tables;
  `office-psalms` → `office-psalms-roman`.

## 0.1.5

- **Rhythmic types** (`phrase.rhythmicType`, `phrase.beats`) — Le Guennant/Carroll
  incise classification IV–VIII over the compound-beat sequence, with Type VIII
  (contraction) after Suñol. The `beats` sequence is the shared derivation the
  chironomy renderer will read.

## 0.1.4

- **Modulation detection** (`score.modulations`) — where the tonal centre leans
  away from the home mode, calibrated against Suñol.
- **Richer modal affinity** — degree-, ictus-, and cadence-weighted, with ranked
  initials after Rockstro.
- **`modus()`** tunes its finalis, tenor, and ambitus through the temperamentum.

## 0.1.3

- **Cadence detection** (`score.cadences`) — per-mode melodic cadence figures,
  after Niedermeyer & d'Ortigue.
- Psalm tones _in directum_ and solemn mediants.
- Suñol-derived neum timing (salicus, oriscus).
- The Latin modal ethos.

## 0.1.2

- **Little-hours psalmody** (Terce, Sext, None) — Ps 118 in course, from the
  extracted Divinum Officium Tridentine scheme. The Divine Office is now complete
  across all eight hours.

## 0.1.1

- **Prime and Compline** office hours — the seasonal ordos, assembled from
  existing corpus chants.

## 0.1.0

- Core release: tuning (`temperamentum`), calendar (`festum`/`pascha`), chant
  (`cantus`/`proprium`/`ordinarium`/`officium`/`psalmus`), score
  (`notatio` → MIDI/MusicXML), heavens (`caelum`/`harmonia`).
