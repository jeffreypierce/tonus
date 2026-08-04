# Bibliography

The sources the library draws on: chant and calendar data, algorithms,
doctrine tables, and the references behind them. Code cites by bracketed key
(`[biblio: key]`); each docs page keeps a `## Sources` line pointing here.

## Data corpora

- `gregobase` — **GregoBase.** <https://gregobase.selapa.net/>. Chant corpora
  in GABC, extracted by book. Counts are the chants tonus ships: the corpus is
  assignment-driven, so a book contributes the chants some day of the calendar
  calls for (see COVERAGE.md). Admission is Solesmes and the rhythmic marks
  the score engine reads; the 1974 Graduale, the 1990 Gregorian Missal, and
  the 1983 Liber cantualis are excluded as post-conciliar re-editions of books
  already here.

  - _Graduale sacrosanctæ Romanæ ecclesiæ de tempore et de sanctis_ (Graduale
    Romanum). Ed. Solesmes. Tournai: Desclée, 1961 — 780 chants (`gr`).
  - _Liber Usualis Missæ et Officii pro dominicis et festis cum cantu
    Gregoriano_. Ed. Solesmes. Tournai: Desclée, 1961 — 707 chants (`lu`).
  - _Liber antiphonarius pro diurnis horis_ (Antiphonale Romanum). Solesmes,
    1960 — 160 chants (`la`).
  - _Liber Hymnarius cum invitatoriis & aliquibus responsoriis_. Solesmes, 1983
    — 25 chants (`lh`).
  - _Antiphonale Monasticum pro diurnis horis_. Solesmes, 1934 — 576 chants
    (`am`). The 1934 edition with the classic rhythmic marks, not the 2005–07
    restoration.
  - _Kyriale_ (from the Graduale Romanum). Solesmes, 1961 — 120 settings
    (`ky`). The eighteen numbered Masses, the ad libitum chants, and the
    Requiem.
  - _Antiphonale Monasticum Solesmense — Proprium Sanctorum_, the offices
    proper to the Solesmes congregation. Solesmes, 1935 — 11 chants (`ams`).
  - _Psalterium Monasticum — Office divin selon le rit bénédictin_. Solesmes,
    1981 — 11 chants (`psm`).
  - _Cantus selecti ad benedictionem Sanctissimi Sacramenti_. Solesmes, 1957 —
    11 chants (`cse`).
  - _Chants of the Church — Selected Gregorian Chants_, compiled by the monks
    of Solesmes. 1956 — 16 chants (`cot`).
- `divinum-officium` — **Divinum Officium.** The 1570–1962 Roman Breviary and
  Missal in machine-readable form.
  <https://github.com/DivinumOfficium/divinum-officium>;
  <https://divinumofficium.com/>. The liturgical calendar (650 entries), the
  Mass propers, the Office hours, and the Psalterium (Vulgate psalm and
  canticle verses), with the feast names, ranks (`ritus`), and Tempora stems
  the seasons follow.
- `nocturnale-romanum` — **_Nocturnale Romanum_ — Matins of the Roman Rite.**
  Community restitution after Holger Peter Sandhofe (2002 base),
  Hartker-derived. <https://github.com/Nocturnale-Romanum/nocturnale-romanum>.
  The night-office corpus: responsories, antiphons, and hymns (470 chants,
  `nr`).
- `graduale-toni-communes` — **Graduale Romanum appendix (Toni Communes).**
  The psalm tones and differentiae, including the tonus peregrinus.
- `bloomfield-compline` — **Bloomfield, _Compline_.**
  <https://github.com/bbloomf/compline> (public domain). Reference dates and
  chants for the Compline ordo.

## Chant rhythm and notation (score engine)

- `carroll-chironomy` — **Carroll, Joseph Robert. _The Technique of Gregorian
  Chironomy_. Toledo, OH: Gregorian Institute of America, 1955.** The seven
  rhythmic types, the three melodic rules, and the chironomy the track draws.
- `carroll-applied` — **Carroll, Joseph Robert (trans./ed., from the official
  course syllabus of the Gregorian Institute of Paris). _An Applied Course in
  Gregorian Chant_. Toledo, OH: Gregorian Institute of America, 1956.**
  Compound beats, ictus placement.
- `gajard-rhythm` — **Gajard, Joseph (trans. Aldhelm Dean). _The Rhythm of
  Plainsong According to the Solesmes School_. New York: J. Fischer & Bro.,
  1945.** The arsis/thesis synthesis.
- `mocquereau-nombre` — **Mocquereau, André. _Le nombre musical grégorien_,
  1908–1927.** The Solesmes school's foundation.
- `cardine-semiology` — **Cardine, Eugène. "Semiology and the Interpretation
  of Gregorian Chant." Trans. Virginia A. Schubert; from the Festschrift for
  Joseph Lennards.** The semiological approach to neume interpretation.
- `desrocquettes-values` — **Desrocquettes, Jean Hébert. "Gregorian Musical
  Values."** The Solesmes rhythmic values, from Mocquereau's collaborator.
- `niedermeyer-ortigue` — **Niedermeyer, Louis, and Joseph d'Ortigue.
  _Gregorian Accompaniment: A Theoretical and Practical Treatise upon the
  Accompaniment of Plainsong_. Trans. Wallace Goodrich. New York: Novello,
  Ewer & Co.** The per-mode cadence figures and the modal ethos epithets.
- `bragers-treatise` — **Bragers, Achille P. _A Short Treatise on Gregorian
  Accompaniment_. New York: Carl Fischer, 1934.** Cadence figures,
  cross-check.
- `homan-cadence` — **Homan, Frederic W. _Cadence in Gregorian Chant_. Ph.D.
  diss., Indiana University, 1961.** The analytic study of chant cadences.
- `sunol-textbook` — **Suñol, Dom Gregory. _Textbook of Gregorian Chant
  According to the Solesmes Method_. Trans. from the 6th French ed. Tournai:
  Desclée, 1930.** Modes, dominants, psalmody, the Solesmes rhythm doctrine,
  and the worked modulation examples the calibration reads.
- `apel-chant` — **Apel, Willi. _Gregorian Chant_. Bloomington: Indiana
  University Press, 1958.** The analytic study of the repertoire; the
  centonization catalogue behind `score.formulas`.
- `hiley-plainchant` — **Hiley, David. _Western Plainchant: A Handbook_.
  Oxford: Clarendon Press, 1993.** The standard modern reference.
- `saulnier-guide` — **Saulnier, Daniel. _Gregorian Chant: A Guide_. CMAA
  edition.** Chant introduction.
- `saulnier-modes` — **Saulnier, Daniel. _The Gregorian Modes_. Solesmes:
  Éditions de Solesmes.** The Degree Summary Tables from Dom Jean Claire's
  research and the mode-by-mode Octoechos study; the source for the
  reciting-note data in `temper/data/modes.ts`.
- `pierik-spirit` — **Pierik, Marie. _The Spirit of Gregorian Chant_. Boston:
  Bruce Humphries, 1939; and _Gregorian Chant Analyzed and Studied_. St.
  Meinrad, IN: Grail, 1951.** Chant interpretation; the beat letters the
  chironomia track draws.
- `gregorio-gabc` — **The Gregorio project.**
  <https://gregorio-project.github.io/>. The GABC plain-text chant notation
  the corpora are encoded in and the parser reads.
- `bravura-smufl` — **Spreadbury, Daniel. _Bravura_ music font and the SMuFL
  (Standard Music Font Layout) specification. Steinberg, 2013–.**
  <https://www.smufl.org/> and <https://github.com/steinbergmedia/bravura>
  (SIL Open Font License). The reference SMuFL font; the notation glyphs the
  score engine engraves into SVG.

## Tuning and music theory (temperamentum engine)

- `boethius-institutione` — **Boethius. _De institutione musica_ (c. 500–510),
  esp. I.27.** The medieval transmission of Pythagorean interval math; also
  the Boethius doctrina (conjunct diatonic planetary scale, transmitting
  Nicomachus).
- `ptolemy-harmonics` — **Ptolemy. _Harmonics_ I.15–16 (the three diatonic
  shades) and III with the Canobic Inscription (c. 150).** The tetrachord
  genera for the tuning presets; the Greater Perfect System tone assignments
  and aspect–consonance mapping for the doctrina.
- `schulter-harmony` — **Schulter, Margo. Medieval Music & Arts Foundation
  harmony FAQs:** "Pythagorean Tuning and Medieval Polyphony"
  (<https://www.medieval.org/emfaq/harmony/pyth.html>) and "Hexachords,
  solmization, and musica ficta"
  (<https://www.medieval.org/emfaq/harmony/hex.html>). Pythagorean tuning;
  hexachords and solmization; the consonance taxonomy.
- `rockstro-grove` — **Rockstro, W. S. "Modes, The Ecclesiastical." In _A
  Dictionary of Music and Musicians_ (Grove, 1st ed.).**
  <https://en.wikisource.org/wiki/A_Dictionary_of_Music_and_Musicians/Modes,_The_Ecclesiastical>.
  The church modes, their dominants and modulations in rank order.
- `liber-usualis` — **_The Liber Usualis, with Introduction and Rubrics in
  English_. Ed. the Benedictines of Solesmes. Tournai: Desclée, 1961.** The
  introduction's "Rules for Interpretation" and rubrics: the notation and
  neume taxonomy, ictus rules, accidental scope, bar-line semantics, psalmody,
  the Kyriale rubric categories, and the Latin diction the parser and rhythm
  model follow.
- `scala-format` — **Scala scale archive and `.scl` format. Manuel Op de Coul,
  Huygens-Fokker Foundation.**
  <https://www.huygens-fokker.org/scala/scl_format.html>. Custom tuning input.

## Musica universalis (harmonia engine)

- `godwin-harmonies` — **Godwin, Joscelyn. _Harmonies of Heaven and Earth: The
  Spiritual Dimension of Music from Antiquity to the Avant-Garde_. London:
  Thames & Hudson, 1987.** Planetary scale taxonomy (Types A/B/C) and
  per-author analyses.
- `godwin-spheres` — **Godwin, Joscelyn, ed. _The Harmony of the Spheres: A
  Sourcebook of the Pythagorean Tradition in Music_. Rochester, VT: Inner
  Traditions, 1993.** Primary-source translations used to verify ratio and
  tone-name claims.
- `godwin-vowels` — **Godwin, Joscelyn. _The Mystery of the Seven Vowels in
  Theory and Practice_. Grand Rapids: Phanes Press, 1991.** Planetary vowel
  attestations; the Moon→Saturn vowel order after Nicomachus.
- `doctrina-primaries` — **The doctrina primary sources:** Nicomachus of
  Gerasa, _Manual of Harmonics_ (c. 100) and _Excerpta ex Nicomacho_; Plato,
  _Republic_ X, 617b (Myth of Er); Pliny the Elder, _Naturalis historia_ II.xx
  (c. 77, with octave closure per Censorinus and Theon of Smyrna); Ptolemy,
  _Harmonics_ III. With the vowel–planet attestations: Porphyry, Marcus
  Gnosticus, Demetrius of Phaleron, Eusebius of Caesarea, Barthélemy of Edessa
  (via `godwin-vowels`).

## Astronomy and computus

- `standish-jpl` — **Standish, E. M. "Keplerian Elements for Approximate
  Positions of the Major Planets." JPL Solar System Dynamics, 1992 (updated
  for DE430).** <https://ssd.jpl.nasa.gov/planets/approx_pos.html>. The
  orbital element tables.
- `schlyter-positions` — **Schlyter, Paul. "Computing planetary positions — a
  tutorial with worked examples." Stjärnhimlen.**
  <https://www.stjarnhimlen.se/comp/tutorial.html>. The Sun and Moon position
  formulae.
- `computus` — **Easter computus: the Gregorian algorithm (Gauss/Butcher) and,
  before 1583, the classical 19-year Julian cycle with Julian→Gregorian
  day-number conversion.** See
  [Computus](https://en.wikipedia.org/wiki/Computus).
