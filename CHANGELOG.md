# Changelog

All notable changes to tonus. Newest first.

## Unreleased

Rendering, mostly — a day of looking at real chant on a real page and fixing
what the page showed.

### Added

- **A third analysis track: `"prosodia"`** — how the melody treats the word.
  One tent per word (the hairpin's top edge), its apex over the accented
  syllable, the landing at the peak in the liturgical red — filled for arsic
  (struck), an open ring for thetic (deferred). Below it a fence on a rail:
  a stem per spoken syllable, a flat dash for a syllable recited on the tenor,
  and a block per melisma — as wide as its real extent, as tall as its note
  count, connected melismas joining into one ridge. It rides first in the
  stack, directly under the lyric line it reads, and the site's vestigia strip
  and tracks key carry it. Shaped across eight lab rounds
  (`working/review/diagram-word-track-01…08.html`).
- **The rubrica reservation, amended.** Ruled 2026-07-29 as the mode line's
  alone, the liturgical red now belongs to the claims: the tonarium's mode
  line and the prosodia's accent dots. The precedent is the score's own text
  apparatus — the dropcap and annotations were always rubricated, and in the
  books red is the word's colour.

### Changed — breaking

- **The layout options are `width` and `scale`.** `padding`, `noteScale`,
  `systemGap`, and `custos` are gone. Nothing ever set them — not the docs site,
  not the 28 lab plates, not the 13 stress pieces — so they were surface without
  use. They are now constants chosen to look right at every scale, and the
  custos appears whenever a system wraps, which is what a chant book does.

  `scale` replaces `staffHeight`: `"small"`, `"normal"` (default), `"large"`, or
  a staff height in px for fitting a known column. A caller decides how big the
  chant should be, not how tall its staff is in pixels.

  ```js
  inscriptio(score, { width: 900, scale: "large" })
  ```

  The page margin deliberately does NOT scale with it — a margin belongs to the
  page, not the notation, and scaling it gave a large chant *less* usable width
  than a small one (89% of a 900px canvas against 93%). The air between systems
  does scale, since flat 24px held the system pitch at 135px whether the staff
  was 30 or 56.

- **`inscriptio`'s look options are one `theme` object.** `fonts`, `noteColor`,
  `staffLineColor`, and `rubricaColor` are replaced by
  `theme: { fonts, colors }`. These travel
  together — a caller setting a lyric face is usually setting a whole look — and
  a house style is worth naming once and passing everywhere.

  ```js
  // before
  inscriptio(score, { fonts: { lyric: "Junicode" }, rubricaColor: "#801", staffHeight: 48 })
  // after
  inscriptio(score, { scale: 48, theme: {
    fonts: { lyric: "Junicode" }, colors: { rubrica: "#801" },
  } })
  ```

  `fonts` keeps its four roles unchanged, `dropcap` among them: a book's
  initial is very often not its lyric face, and the two stay separate.

### Added

- **A note knows the diphthong it belongs to.** `Context.diphthong` and
  `ChantTabulaRow.diphthong` report the pair a sung vowel is part of — `ae` ·
  `oe` · `au`, and `ui` in the cui/hui stems — or null. `vowel` is unchanged: it
  stays the NUCLEUS, the single vowel a singer sustains, because that is what
  the analysis passes key on. The pair rides beside it for anyone rendering the
  off-glide.

  It has to come from here, because **only the syllabifier can tell a diphthong
  from a hiatus: the accent decides.** `cae` is one syllable — nucleus `a`,
  gliding toward `e`; `sa-é` is two, the same letters with the accent on the
  second and no glide at all. Downstream, given only the lyric, the two are
  indistinguishable. A scan for the letter pair also misreads `quae`, where `qu`
  is a consonantal glide: the nucleus is `u`, and the `ae` is not the sung pair.
  Over the Graduale that is 71 distinct syllables — 1,526 sung notes — a naive
  reading gets wrong, and 192 syllables over the whole corpus. The detection
  reuses the syllabifier's own `DIPHTHONGS` set, so the word means the same
  thing here as it does when a word is split.

- **The ink is themable from CSS.** Colours now reach the SVG as custom
  properties with the render's own value as the fallback —
  `fill="var(--tonus-note, #111)"` — so a host stylesheet can retheme a drawn
  chant without re-rendering it, while a file opened on its own still shows the
  ink it was drawn with. Three properties: `--tonus-note`, `--tonus-staff-line`,
  `--tonus-rubrica`. The emitter already carried semantic classes (`note`,
  `lyric`, `dropcap`, `custos`, `episema`, `divisio`, `clef`, `mora`, `ictus`)
  but an inline `fill` beats any stylesheet rule, so none of them could be
  styled. `scale` deliberately stays outside the theme for the same reason it
  cannot be a CSS property: line breaking consumes it long before a stylesheet
  sees the output.

### Fixed

- **An accidental was emitted as a sounding note.** GABC's `fx` means "F is flat
  from here" — a mark drawn on the staff, not a pitch to sing. The parser set the
  state correctly and then fell through and pushed a note anyway, so `A(fxfg)`
  returned three notes for two and duplicated the pitch. 1337 markers across 426
  Graduale chants: 0.97% of every note in the book was a phantom, at a wrong
  pitch, inventing a unison before each one and inflating every count, interval
  and analysis downstream.

  The SIGN still draws, and now on the note that follows it — where the books
  print it. That needed a new field: `accidentalSign` is what to draw, separate
  from `accidental`, which is the note's own alteration. In `fe(jx)cit(ih)` the
  flat is printed before the I while it governs J; the emitter had been reading
  the alteration and so drew nothing once the phantom was gone.

- **A written flat could come back spelled as a sharp.** Pitch spelling was
  derived from the pitch class alone, against a preferred-flat set that omitted
  pc 1 and pc 6 — so a GABC `x` (a flat) landing on those degrees returned
  `C#`/`F#` rather than `Db`/`Gb`, and reported `accidental: +1` for a source
  that wrote a flat. The pitch was always right; only the spelling and its sign
  were wrong. `toPitch` now takes an optional spelling preference and `notatio`
  passes what the source wrote. The Graduale writes only the bmolle (1821 B-flats
  and no sharps at all), so the corpus never reached the gap.

- **Moderna honoured no note colour at all.** It hardcoded `#111` in seventeen
  places while quadrata threaded the option, so a caller theming the ink saw one
  species change and the other not.

- **`staffHeight` means the same thing in both species.** Moderna's staff was
  a hardcoded constant, so the option moved quadrata and did nothing here: a
  request of 30, 40 or 60 left moderna at 7.4px every time. Every geometric
  constant now derives from it through one metrics factory.
- **The canvas is the width you asked for.** It was `max(systemMaxX)` —
  whatever the widest system happened to reach — so a requested 900 came back
  915, 986, 1074, 1203 by chant, and a host applying `max-width` shrank each
  differently. That is why the same page showed one chant's notation a third
  smaller than the next's.
- **Lyrics count toward a system's extent.** A syllable is centred on its
  note, so half of a final wide syllable always hung past the canvas and was
  cut off. The layout already tracked the lyric's right edge for its collision
  check; the width calculation never asked.
- **The custos is a custos.** It was drawn as a shrunken punctum on the
  authority of a comment saying no custos glyph was baked — Bravura's have
  been baked all along. The real glyph is a hooked note whose stem points
  toward the pitch it announces. It also floated 41px past the last note,
  having been placed after the divisio's trailing air; and it is now
  suppressed after a full stop, where drawing it put two marks in one place
  and read as a heavy double barline.
- **Analysis tracks scale with the staff in moderna**, and a track that SPANS
  notes now reaches their ink rather than their anchors — the emitters had
  measured the ink all along and the mapping dropped it.
- **Capitals are measured as capitals.** The lyric width estimate was a flat
  per-character average, and chant sets its opening word in capitals; "CAn"
  was estimated at 22.9px against a real 27.9, so opening syllables collided
  with what followed.

### Changed

- **More air.** Syllable and word spacing widened in both species, the
  staff-to-lyric gap from 21px to 28, and moderna's note advance retuned so a
  chant takes about one system more than quadrata rather than twice as many.

## 0.4.5 — 2026-08-04

The rubric true-up, the era view, and a long pass of making the library say
what it means. The 2026-07-27 review found the Kyriale selection chain leaking
past its own gates; the fixes landed with regression tests, the corpus pipeline
was corrected and regenerated behind them, and the calendar's and the corpus's
`before` arguments were reconciled into one composable view. The shelf widened,
the office settled on one cursus, the cadence catalogue was re-mined over the
sung corpus, and a new verb — `census` — measures every chant against the
corpus that holds it.

Then the tidying, most of it prompted by things that turned out to be measured
rather than assumed. The salicus took Cardine's correction and, in the process,
stopped being confused with the Solesmes ictus — two nearly disjoint sets under
one name. The cadence catalogue learned its own denominator and joined itself
once instead of per consumer. The appendix roughly doubled and was renamed to
follow the register rule. The corpus ledger stopped needing three numbers to
say how much chant there is. And the Apel formula matcher came out: what
shipped could not use the catalogue it shipped with, and saying so was better
than leaving a public field that answered `null`.

`docs/` is a published site now, which is where 0.5 is headed.

### Removed

- **BREAKING — `Score.formulas` and the Apel centonization matcher are out.**
  The catalogue of standard phrases, the per-phrase matcher, `FormulaMatch`,
  `Formula`, `FormulaSlot`, and `formulaeFor` are gone from the library. What
  shipped was one mode's alphabet (mode-5 Graduals) behind a matcher whose
  per-phrase window structurally could not fire on 40 of its 53 formulae —
  Apel tabulates a chant as a sequence across a whole respond, and matching at
  that scale is a different algorithm that was never built. The honest state
  was a public field that answered `null` for nearly every chant, and an
  appendix of research the library could not yet use.
  The census keeps its `formulas` field group: those four floats are baked
  upstream in tonus-corpus and describe the corpus as measured, whatever tonus
  does with them. The transcriptions, photographs, tooling and verification
  reports are kept in the workshop, not deleted — the reading of Apel stands on
  its own, and the pipeline is there if the matcher is ever built properly.

### Changed

- **BREAKING — the shelf reports ONE number, and the Kyriale leaves it.**
  `corpus()` reported `count` (book listings, a chant in two books counted
  twice) beside `distinct` (chants), which made the headline figure depend on
  how many books happened to print the same melody — a reader had to know that
  to read either. Now `count` is **how many chants tonus holds**, each counted
  once, and `listings` is the shelf's length; `listings - count` is the
  overlap. `genera` and `modes` sum to `count`, describing the same population
  the headline does.
  The Kyriale is no longer an eleventh book. There is no Kyriale in GregoBase:
  `ky` and `gr` are the same source, partitioned by the extractor so the
  ordinary can be routed to per-ordinary codes, so listing it beside its parent
  counted the Graduale twice and its `total: null` read as "unmeasured" when
  there was no separate book to measure. `ky` is not a `ChantSource` and not a
  row in the shelf — which is 10 books, 2,187 chants, 2,767 listings.
  Nothing became unreachable. `ordinarium({ feast })` is untouched, and the
  ordinary is now queryable directly: **`cantus({ ordinary: "ky" })`** returns
  all 31 Kyries, composes with the other filters, and the Kyriale's
  bibliographic record still rides every one of its chants. A plain search does
  not sweep the ordinary in — you ask for a Kyrie rather than stumbling onto
  one.
- **BEHAVIOUR — the salicus takes Cardine's correction, and stops being
  confused with the Solesmes ictus.** Two changes, each ruled and each
  measured separately over the sung corpus (2,887 chants, 28,498 phrases).
  The second — redefining what counts as a salicus at all — was ratified on
  its own terms, since it decides what the word denotes everywhere in tonus,
  not just how one note is weighted.
  **Detection.** A salicus is "at least three ascending notes in which the
  next-to-last is an oriscus" [biblio: cardine-semiology, ch. 16]. tonus had
  been calling any ascending run with the editorial ictus a salicus — 2,795
  groups, of which **36 (1.3%) actually carried an oriscus** — while missing
  188 of the corpus's 226 real salici, which classified as `scandicus`. Two
  nearly disjoint sets under one name. Now: `salicus` 2,795 → **226**, exactly
  the chants that meet Cardine's definition; `scandicus` 498 → 2,501, and the
  4-and-5-note ictus ascents (566) join `compound`. An ictus-marked ascent
  with no oriscus is a scandicus that Solesmes marked for rhythm, and the mark
  is still readable on `context.ictus`.
  **Weighting.** The printed editions lengthen the oriscus; the manuscripts
  show the principal note is the one immediately following it. The 1.3×
  prolongation moves from the next-to-last note to the **summit** — which is
  the last note at any length, since the oriscus is next-to-last by
  definition, so the 4- and 5-note forms need no separate rule. The salicus
  stays arsic: tension toward the summit is the arsic gesture, so Cardine
  strengthens that rule rather than contradicting it.
  **Downstream:** 208 of 28,498 phrases (0.73%) change `rhythmicType`,
  overwhelmingly toward VIII. This is the one point where tonus's rhythmic
  layer departs from Mocquereau and Suñol, and `ir.ts` now says so at its
  header.
  **The limit, stated plainly:** tonus sees only what the transcription marks.
  Bevenot's own example — the mode-6 _Requiem_ introit's fa-sol-la — carries
  the ictus and no oriscus in GregoBase, so it still reads as a scandicus. He
  is reading the manuscripts; the corpus is a printed edition that resolved
  the oriscus away. Recovering those wants the sources, not a looser rule.
- **The tonarium's cadence label says how typical a close is, not which
  family it belongs to.** The bracket read `"2,0,-2 @0"` — the family's name,
  which a reader could not weigh. It now reads `"×2.1"`: the family's share
  within this chant's mode over its share of the corpus at large. Measured
  across four books the figure spans ×0.46 to ×10.56, median ×2.22; a lift
  below 1.0 prints too, since an atypical close is information. A mode-less
  chant, or a family with fewer than ten occurrences in the chant's mode,
  falls back to the plain corpus share. The key is not lost — each cadence
  now draws inside a group carrying `data-cadentia`, the join back to
  `CADENTIAE` and the provenance a margin gloss can print.
- **BREAKING — five appendix tables renamed to match the register rule.**
  `TEMPUS_NAME` → `TEMPORA`, `GRADE_NAME` → `GRADUS`, and the internal
  `OFFICE_LABELS` / `ORDINARY_LABELS` / `MODE_LABELS` → `OFFICIA` /
  `ORDINARIA` / `MODI`, the last three now public. The house rule is that
  Latin names carry Latin content and English names carry codes or English;
  the appendix had three spellings of "code → display string" and five tables
  whose Latin values sat under English names. Names now follow the register of
  their values, so `SEASON_LABEL` ("Advent") and `TEMPORA` ("Tempus
  Adventus") are distinguishable by name rather than by memory. Only the two
  `cal` tables were public before; the rest is new surface.
- **`officium` throws on an unrecognised `hora`.** It returned `[]`, which
  read as "no chants at this hour" rather than "there is no such hour" — the
  same silent-nothing the unknown-query-key guard beside it already refused.

### Added

- **Every shelved book reports what it HOLDS.** The Nocturnale was the last
  one answering `full: null`, which read as "not yet measured" — but the tally
  had existed all along in its own extract. It holds **1,564** chants against
  the 470 tonus ships, and it shares nothing: `unique` is all of them. That is
  a measurement, not a gap. The crosswalk pairing a nocturnale chant with a
  GregoBase twin is enrichment, a route to metadata, not a claim that two books
  print the same chant, so counting those as shared would invent a
  relationship. The shelf now holds 10,156 chants before the cut.
- **Three genera that are reported but not shipped now have names.**
  `Improperia` (the Good Friday Reproaches), `Antiphona Mariana` (Marian
  antiphons outside the office cycle) and `Supplicatio` (litanies) appear in a
  book's pre-cut `full` tally, where they had been printing as bare codes —
  `genus: "su"` — while every other row carried a Latin genus. Being outside
  the cut is not a reason to be nameless in a table tonus publishes.
- **The cadence catalogue carries its own denominator, and joins itself.**
  Every `CadentiaFamilia` gains `share` — its occurrences over ALL 28,481
  phrase-ends, not over the 58.7% that cleared the table's floor, which would
  have flattered every family in it. `CADENTIAE_POPULATION` ships beside it
  with the same total per mode digit, so a family's **lift** in a mode is one
  division: `(modes[m] / byMode[m]) / share`. The ratio itself is not baked —
  export the vocabulary, not the arithmetic.
  A `Cadence` now carries `finality`, the share of ITS family's corpus
  occurrences that land at a final close, joined once in `notatio` instead of
  by every caller rebuilding the index. It rides the cadence while `familia`
  still does not, because the two differ in kind: the signature already IS the
  family's name, but how often that family closes cannot be read off it — of
  the 55 families landing on the final, 31 do not close, and their finality
  spans 0.054 to 1.000. Detection stays pure; the corpus table meets detected
  data in the score builder, where `MODES` already does.
  Both cadence catalogues are now documented as what they are — _tradita_
  (the treatises' figures, final cadences only) and _inventa_ (the corpus
  tally, any target, and so the only account of medial closes) — with the
  measured coverage of each and a worked lift example that was run before it
  was printed.
- **The appendix widened, so callers stop transcribing the library's own
  vocabulary.** `HORAE` (the eight canonical hours, Matins first — the order
  is the content, and `officium`'s validation reads the same list, so the two
  cannot drift), `OFFICIA`, `ORDINARIA`, `MODI`, `SOURCES` (the book codes
  `cantus({ source })` takes, with their bibliographic records), and
  `CENSUS_GROUPS` / `CENSUS_ORDER` — the census field groups and the block
  index, so asking whether a chant is censused stops needing a `try/catch`.
  A table is admitted when a caller would otherwise type it out, because a
  transcribed copy drifts and fails as wrong answers rather than as an error.
  The appendix is now grouped by engine.
- **The census distance rule is documented as a contract.** Similarity is
  cosine per field group, never over the flat 225; `by: "all"` is the
  equal-weight mean. Grouping is userland, so a caller pooling blocks is
  computing a distance and must reproduce the rule or silently disagree with
  `census()`. `census.md` now states it for callers with the three ways to get
  a plausible wrong answer, and a worked example — pooling the 178 Communions
  — that was run before it was printed, and reproduces `census()` exactly.
- **The analysis tracks ship with `inscriptio`.** `tracks: ["chironomia"]`
  draws the conducting hand's wave — arsic crests, thetic
  troughs, pick-up loops, Pierik letters. `tracks: ["tonarium"]`
  draws the melodic lane: the four maneriae rails, the melody
  compressed to its ambitus, the mode line in rubrica (solid inflection,
  dashed transposition). A cadence is the melody's own ending re-inked
  at full strength — the same curve at the same width — landing on a
  terminal node (filled when the family's measured finality in CADENTIAE
  closes, open when it suspends), labelled beneath by its signature on a
  light end-ticked bracket spanning the figure. One governing ink system
  runs through both tracks: one black graded by stratum opacity (rubrica
  is the mode line's alone), and one nib law — velocity as stroke
  width — for every pressure-bearing line. Either track rides either
  species, and both may ride one score: they stack in a fixed order, the
  chironomia above the tonarium, whichever order they are asked for. The
  two-register principle — the rhythmic band under the square notation,
  the melodic band under the transcription — is the house default, not a
  rule the renderer enforces. Confidence is
  opacity; claims under 0.45 draw nothing. The tracks consume the same
  note anchors the geometry contract exports — the score's own ink is
  untouched, and the geometry is unchanged with tracks on.
- **The duae species share one lyric setting and one opening.**
  Quadrata's staff→lyric gap now equals moderna's (21px at the default
  staff height, scaling with it), and both species default the lyric
  weight to 518; an explicit `fonts.lyric.weight` still overrides.
  Moderna now honours the front matter (`title`, `rubric`,
  `annotation: "auto"`) as quadrata does; the official opening of a
  tonus score is the incipit as `title` plus the auto genus/mode mark,
  with no dropcap.
- **The era view composes end to end.** `festum({ date, before })` stamps
  the view year on the returned `Feast` (`feast.before`), and every day
  verb — `proprium`, `ordinarium`, `officium` — serves the
  same view without being told the year twice; an own `before`
  overrides. Previously the day verbs' types promised `before`/`century`/
  `cursus` (they extend `CantusQuery`) while the implementations diverged
  three ways: `proprium` threw "unknown query key," `officium` and
  `ordinarium` silently ignored them.
- One admissibility rule for every door: `engines/chant/attest.ts`, a leaf
  module shared by `cantus`, the day verbs, and the census. One spelling
  at the door — `before`, a year.
- Under a view, `ordinarium` **re-picks** over the admissible pool (the
  Kyriale offers ranked alternatives by design); `proprium` and `officium`
  degrade to silence — the corpus cut's evidence law.
- **The shelf widens to eleven books.** Four more marked Solesmes office
  books join — Antiphonale Monasticum Solesmense (`ams`), Psalterium
  Monasticum (`psm`), Cantus selecti (`cse`), Chants of the Church
  (`cot`) — admitted by the stated rule: Solesmes and rhythmically marked.
  The shipped corpus is 2,887 rows over 2,187 distinct chants.
- **`tonus.census({ id })`** — one chant measured against the corpus that
  holds it: a per-group profile with typicality, `balance` (distance and
  deviant groups), and nearest neighbours by per-group cosine (`k`, `by`,
  `before`). One block of 225 float32s per shipped chant; see
  `docs/census.md`.
- **`corpus()` with no argument returns the whole shelf** — the rollup
  plus every book's ledger — and every book carries `full`, the pre-cut
  tally: the ledger of the cut, auditable rather than asserted.
- **`CADENTIAE` joins the appendix** (with `CadentiaFamilia`): the
  corpus-grounded cadence catalogue, mined from every phrase-end in the
  sung corpus — the same population the census counts — keyed by shape
  and arrival.
- Test suites: `tests/ordinarium.test.mjs` (the selection chain end to
  end) and `tests/era-view.test.mjs` (the view's whole contract).

### Removed

- **The `rite` option.** tonus assembles one cursus, the Benedictine: the
  Roman office table carried no chant at all on 63.4% of its days, and its
  little-hours psalmody had no other consumer, so `rite: "romanum"`
  returned a cursus nobody sang. A stale `rite` key now throws
  (`officium` rejects unknown keys) rather than being silently ignored.
- **`matutinum` as a separate verb.** Matins is an hour of `officium`
  (`hora: "matutinum"`), returned flat like every other hour; the
  three-nocturn ordo shape remains unmodelled.
- **`century`.** It was `before: N * 100` in different clothes; the two
  spellings converged on the one that is a year.

### Fixed

- **"Requiescant in pace" was the dismissal on every green feria** (~20
  days/year): `isRequiem` missed the bare "Requiescant" incipit AND the
  last-resort appendix return was ungated. The same hole handed ferias an
  ad libitum Gloria. The appendix now never reaches a day whose rubric
  does not admit it; the Requiem stays reachable via
  `ordinarium({ mass: 102 })`.
- **The Gloria follows the day's rank rubric, not its season**: ferias
  print none; a I-class feast inside Advent (Immaculate Conception) keeps
  hers. The "Benedicamus Domino as in Mass II" borrow the book directs is
  now real — ferias and penitential Sundays sing Mass II's dismissal.
- **The paschal rubric is a time, not a rank**: removed from the solemn
  set (an Eastertide Tuesday no longer leads with an appendix Kyrie;
  Easter keeps Lux et origo every year), and BVM outranks paschal in
  `rubricForDay`, so Cum jubilo is reachable in Eastertide.
- **Credo V was never sung**: the off-year rotation's parity was coupled
  to the two-year bias (2 divides 6). The off-years now advance their own
  cycle — all six credos are heard across twelve years.
- The leftover masses-1–9 preference on high feasts (precedence measuring
  what the rubric should) — deleted; it defeated the appendix solemnity
  boost on the class feasts it was built for and pinned high BVM feasts to
  mass IX.
- `centuryOf` off-by-one at exact century multiples: `before: 1100` now
  admits the closed 11th century, as its own doc always claimed.
- "Kyrie XVII C" refiled from a synthetic mass 100 to mass 17 (corpus-side
  incipit parsing read the variant letter C as roman 100) — it now rotates
  as Mass XVII's sibling printing.

### Data

- Regenerated from the corrected pipeline: `office-roman` (canticle
  antiphons split positionally — the last SURVIVOR of matching is no
  longer promoted to the Benedictus/Magnificat slot), `office-monastic`
  (464 days; rubric-year variant files excluded from the merge; stub
  redirects followed to their actual targets), `office-ferial` (honestly
  monastic rows only; the tier-then-book tiebreak; Matins 94 → 98 of 128),
  `commune-office` (rubric-variant sections no longer blended; the Introit
  genre-cap hole closed), `kyriale`.

## 0.3.0

The vox-ectomy. The voice engine (`vox`, `chorus`, the formant tables,
personae, consortia, liquescentia coda tables, spectrum, accordatio) leaves
the public library for orreliquum, the private instrument it was always
being built toward. tonus returns to what it is: theory, calendar, chant,
notation, and the heavens — the algorithms, publishable and citable.

### Added

- **`accent` on `ChantTabulaRow`** — a boolean marking whether a note's
  syllable bears the Latin tonic word-accent. The value already existed inside
  the parse (`detectVowelAccent` drives articulation stress); it is now surfaced
  as data on the tabula, so downstream analysis can read accent placement
  without re-deriving it. Threaded `ParsedNote → Context → ChantTabulaRow`.

### Removed

- **`tonus.vox()` and `tonus.chorus()`** and every voice type
  (`Vox`, `VoxInput`, `VoxParams`, `Vowel`, `Formant`, `Locus`, `Latinitas`,
  `Persona`, `PersonaName`, `Coda`, `TuningLike`, `Chorus`, `ChorusOpts`,
  `Dispersio`, `ConsortiumName`, `Voces`). The namespace holds fourteen
  verbs again. `docs/voice.md` emigrates with the code.
- Voice test suites (`voice-vox`, `voice-chorus`, `voice-features`,
  `voice-spectrum`) move with their subject.

### Unchanged

- `harmonia`'s planetary voices (`VoicedPitch`, `VoicedBody`, the Greek
  vowel tables) are its own and remain.
- Every other engine, table, and contract.

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
