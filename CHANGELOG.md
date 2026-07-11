# Changelog

All notable changes to tonus. Newest first.

## 0.2.0

Rendering becomes a standalone engine (`inscriptio`), the per-chant analysis
chart is completed, a voice engine is added, and the emitter surface settles on
one format (SVG).

### Added

- **`inscriptio(score, opts?)`** — the standalone SVG renderer. Draws a `Score`
  and returns `{ svg, geometry }`. Two notation species, each with its own
  spacing pass: `"quadrata"` (square-note, SMuFL glyphs baked inline) and
  `"moderna"` (modern round-note transcription — treble-8 clef, engraved slurs,
  after the Lomer practice). A multi-system **layout engine** (`width`,
  `systemGap`, `custos`) and **front matter** (`title`, `rubric` /
  `annotation: "auto"`, `dropcap`, `rubricaColor`).
- **The geometry contract** — `geometry: NoteGeometry[]`, one entry per note in
  tabula order (system, x, y, systemY). A public API: downstream analysis tracks
  build on it instead of scraping the SVG.
- **The intonation channel** — `accidentals: "standard" | "heji" | "cents"`, a
  **moderna** overlay. HEJI comma accidentals are baselined on the Pythagorean
  chain (tonus's default tuning), so a Pythagorean chant renders clean and
  syntonic-comma arrows bloom only under a just preset; meantone is not just, so
  `heji` throws under it. `cents` labels signed deviations against `"pythagorean"`
  (default) or `"et"`. Square notation (`quadrata`) carries only the accidentals
  GABC itself expresses (flat / natural / sharp) — the HEJI and cents overlays are
  modern analytical marks, so quadrata throws when asked for them.
- **Score metrics** on `prosody`: interval statistics (histogram, maxLeap,
  leapRate, step/skip/leap `motus`), `tessitura`, the melodic `arcus`
  (initial/peak/final + arch index), `melismaCadential`; and conveniences
  `phrase.noteCount` / `phrase.syllableCount` / `syllable.melisma`.
- **`vox` and `chorus`** — a singing voice modelled as formant and spectrum
  data, and seeded ensembles. `formantes` tunes to a temperament directly:
  `tenor.formantes("a", temper, vis?)` — `vis` weights the pull, 0 (phonetic
  truth) to 1 (fully tuned, the default).
- **The appendix.** The export law is settled: verbs live on the namespace,
  return values are plain data, and the named exports are canonical constant
  tables only — `SEASON_LABEL`, `TEMPUS_NAME`, `GRADE_ORDER`, `GRADE_NAME`,
  `MODES`, `TONES` (types `PsalmTone`/`Differentia` ride with their table).
  The grade helper functions (`gradeOrder`, `compareGrade`, `ritusToGrade`)
  retire from the surface: `gradeOrder(g)` is `GRADE_ORDER.indexOf(g)`.
- **`docs/` ships in the package** — the documentation renders from the
  installed tarball, pinned to the version it describes.
- **GABC lyric markup decodes.** The angle-bracket text tags — excluded since
  the MIDI-only days — are parsed at intake: `<sp>` specials become real
  characters (℣ ℟ † ǽ œ, the raised *), style tags (`<i>`, `<b>`, `<sc>`,
  `<c>` rubric color, `<e>` elision) survive as styled `runs` on `Syllable`
  and the tabula row, and both notation species draw them as `<tspan>`s.
  Layout hints (`<clear>`, `<nlba>`, centering braces) and `\pageref`
  cross-references vanish. Before this, quadrata printed `<sp>V/</sp>` as
  literal lyric text and syllable widths were measured tags-and-all.
- **Per-role text faces** — `inscriptio`'s `fonts` option assigns a face to
  the `dropcap`, `title`, `annotation`, and `lyric` roles (family, optional
  weight, optional size scale). By default the SVG carries references and
  the host page supplies the face; a slot may instead `embed` the caller's
  own font bytes (base64) into the SVG's `<style>` for a self-contained
  file. tonus bundles no font files either way.

### Changed

- **License: PolyForm Noncommercial 1.0.0** (was MIT through 0.1.x, which
  remain MIT). Free for any noncommercial purpose; commercial use by
  arrangement with the author.
- **Corpus double-escape fixed.** Every `gabc` field stored its non-ASCII as a
  literal `\uXXXX` escape, which had silently disabled accent detection across
  the whole corpus — so note weights, prosody, rhythm, and imprint were computed
  accent-blind. The extractor now decodes correctly; **computed accent weights
  shift corpus-wide** as a result. A guard test asserts no gabc carries an escape.
- **`cantus({})` throws.** An empty or unknown-key chant query is a caller bug,
  not an empty result; it throws with guidance (matching the `festum` contract).
- NABC pipes stripped from the corpus (`(notes|nabc)` → `(notes)`), with a
  corpus-wide guard test.

### Fixed (pre-release review)

- **The Pythagorean chain is the medieval dodecachord (E♭–G♯).** The chain had
  stacked twelve fifths ascending from C, spelling F as E♯ — a 521.5¢ wolf
  ut–fa — and b molle as A♯, so `temperamentum` disagreed with `harmonia`'s own
  pure F. The naturals now sit F–B with b molle and E♭ on the flat side, the
  ficta sharps on the sharp side; the heji/cents baseline derives from the same
  chain constant, so a flatted chant under the default tuning renders clean
  (it had thrown).
- **Quadrata figure grouping is phrase-aware.** A single-syllable phrase
  followed by another phrase merged figures across the divisio, silently
  dropping the second lyric and the divisio itself. An accidental inflecting
  any note of a ligature now prints before the whole figure (Solesmes
  practice) instead of vanishing on non-initial notes.
- **Canticles by name resolve their own texts.** `magnificat` and
  `nunc dimittis` pointed at the wrong psalter rows (one returned the Symbolum
  Athanasium); `te deum` is withdrawn — the Te Deum is not psalmody.
- **Formula step-skeletons count Apel's degrees.** Octave-aware relative to the
  final's register: the mode-5 tenor reads +4, where the old ±half-octave fold
  read −3. (Cadence figures keep their deliberate local-contour fold.)
- **The register doctrine at the seams.** `Matins.nomen` / `Matins.ritus`
  (were `name` / `rank`), `PsalmTone.nomen`, and `rubricaColor` (was `rubrica`,
  a Latin key that took a CSS color string).
- **The error contract enforced across the surface.** `notatio`, `festum`,
  `caelum`, `matutinum`, `harmonia`, `proprium`, `temperamentum`, and `vox`
  throw with guidance on junk input instead of raw TypeErrors or silent
  fallbacks; a bare `chorus()` sings (the schola is the default); `psalmus`
  no longer stamps the wall-clock year into `source.year` (determinism);
  `iter` honours the `latinitas` shift; a user-GABC `office-part` header
  normalizes to its OfficeCode.

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
- **Modal affinity** — degree-, ictus-, and cadence-weighted, with ranked
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
