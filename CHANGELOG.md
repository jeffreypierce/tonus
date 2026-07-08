# Changelog

All notable changes to tonus. Newest first.

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
