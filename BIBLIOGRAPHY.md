# Bibliography

The single source of truth for the sources tonus is built from. Every entry has
a stable **key** in `code font` at its head, then a full citation, then — after
the em-dash — the editorial reason tonus uses it. Code cites a source by that key
in a bracket — `[biblio: carroll-chironomy]` — and the documentation links to the
entry's anchor. Nothing outside this file restates a full citation.

Page scans of the accompaniment treatises behind the cadence figures
(`niedermeyer-ortigue`, `bragers-treatise`) are kept out of the repo, at
`~/Documents/tonus-sources/`.

## Data corpora

- `gregobase` — **GregoBase.** <https://gregobase.selapa.net/>. Chant corpora in
  GABC, extracted by book (GregoBase source IDs 2, 3, 48, 15):
  - _Graduale sacrosanctæ Romanæ ecclesiæ de tempore et de sanctis_ (Graduale
    Romanum). Ed. Solesmes. Tournai: Desclée, 1961 — 1,344 chants (`gr`).
  - _Liber Usualis Missæ et Officii pro dominicis et festis cum cantu
    Gregoriano_. Ed. Solesmes. Tournai: Desclée, 1961 — 2,377 chants (`lu`).
  - _Liber antiphonarius pro diurnis horis_ (Antiphonale Romanum). Solesmes,
    1960 — 1,422 chants (`la`).
  - _Liber Hymnarius cum invitatoriis & aliquibus responsoriis_. Solesmes, 1983
    — 361 chants (`lh`).
- `divinum-officium` — **Divinum Officium.** The 1570–1962 Roman Breviary and
  Missal in machine-readable form. <https://github.com/DivinumOfficium/divinum-officium>;
  <https://divinumofficium.com/> — the liturgical calendar (642 entries), Mass
  propers (926), Office hours (929 days), and the Psalterium (2,612 psalm + 579
  canticle verses, Vulgate), plus the feast names, ranks (`ritus`), and Tempora
  stem structure the seasons follow.
- `graduale-toni-communes` — **Graduale Romanum appendix (Toni Communes).** Psalm
  tones and differentiae, including the tonus peregrinus.
- `versus-psalmorum` — **_Versus Psalmorum et Canticorum_ (No. 839).** Solesmes.
  The psalm-verse formulas for the tones.
- `bloomfield-compline` — **Bloomfield, _Compline_.** <https://github.com/bbloomf/compline>
  (public domain). Reference dates and chants for the traditional Roman Compline
  ordo.

## Chant rhythm (score engine)

- `carroll-chironomy` — **Carroll, Joseph Robert. _The Technique of Gregorian
  Chironomy_. Toledo, OH: Gregorian Institute of America, 1955.** Seven rhythmic
  types, three melodic rules, chironomy.
- `carroll-applied` — **Carroll, Joseph Robert. _An Applied Course in Gregorian
  Chant_. Toledo, OH: Gregorian Institute of America, 1956.** Compound beats,
  ictus placement.
- `gajard-rhythm` — **Gajard, Joseph (trans. Aldhelm Dean). _The Rhythm of
  Plainsong According to the Solesmes School_. New York: J. Fischer & Bro.,
  1945.** The arsis/thesis synthesis.
- `mocquereau-nombre` — **Mocquereau, André. _Le nombre musical grégorien_,
  1908–1927.** The Solesmes school's foundation.
- `cardine-semiology` — **Cardine, Eugène. "Semiology and the Interpretation of
  Gregorian Chant." Trans. Virginia A. Schubert; from the Festschrift for Joseph
  Lennards.** The semiological approach the `restrained` pondus style reflects.
- `desrocquettes-values` — **Desrocquettes, Jean Hébert. "Gregorian Musical
  Values."** The Solesmes school's rhythmic values, from Mocquereau's collaborator.
- `niedermeyer-ortigue` — **Niedermeyer, Louis, and Joseph d'Ortigue. _Gregorian
  Accompaniment: A Theoretical and Practical Treatise upon the Accompaniment of
  Plainsong_. Trans. Wallace Goodrich. New York: Novello, Ewer & Co.** The
  per-mode cadence figures and the modal ethos epithets.
- `bragers-treatise` — **Bragers, Achille P. _A Short Treatise on Gregorian
  Accompaniment_. New York: J. Fischer & Bro., 1934.** Cadence figures, cross-check.
- `homan-cadence` — **Homan, Frederic W. _Cadence in Gregorian Chant_. Ph.D.
  diss., Indiana University, 1961.** The analytic study of chant cadences.
- `murray-accentual` — **Murray, Gregory. "Accentual Cadences in Gregorian
  Chant." _The Downside Review_, 1958.** The spondaic and dactylic verbal cadences.
- `sunol-textbook` — **Suñol, Dom Gregory. _Textbook of Gregorian Chant According
  to the Solesmes Method_. Trans. from the 6th French ed. Tournai: Desclée,
  1930.** Modes, dominants, psalmody, and the Solesmes rhythm doctrine.
- `apel-chant` — **Apel, Willi. _Gregorian Chant_. Bloomington: Indiana
  University Press, 1958.** The analytic study of the repertoire.
- `hiley-plainchant` — **Hiley, David. _Western Plainchant: A Handbook_. Oxford:
  Clarendon Press, 1993.** The standard modern reference.
- `treitler-voice-pen` — **Treitler, Leo. _With Voice and Pen: Coming to Know
  Medieval Song and How It Was Made_. Oxford: Oxford University Press, 2003.**
  Orality and notation.
- `saulnier-guide` — **Saulnier, Daniel. _Gregorian Chant: A Guide_. CMAA
  edition.** Chant introduction.
- `pierik-spirit` — **Pierik, Marie. _The Spirit of Gregorian Chant_. Milwaukee:
  Bruce, 1939; and _Gregorian Chant Analyzed and Studied_. St. Meinrad, IN:
  Grail, 1951.** Chant interpretation.
- `burkard-manual` — **Burkard, Dom Sisbert. _Manual of Plain Chant_. 1906.**
  Plainchant instruction.
- `kelly-capturing` — **Kelly, Thomas Forrest. _Capturing Music: The Story of
  Notation_. New York: W. W. Norton, 2014.** Notation history.
- `gregorio-gabc` — **The Gregorio project.** <https://gregorio-project.github.io/>.
  The GABC plain-text chant notation the corpora are encoded in and the parser reads.

## Tuning and music theory (temperamentum engine)

- `boethius-institutione` — **Boethius. _De institutione musica_ (c. 524),
  esp. I.27.** The medieval transmission of Pythagorean interval math; also the
  Boethius doctrina (conjunct diatonic planetary scale, transmitting Nicomachus).
- `ptolemy-harmonics` — **Ptolemy. _Harmonics_ I.15–16 (the three diatonic
  shades) and III with the Canobic Inscription (c. 150).** The tetrachord genera
  for the tuning presets; the Greater Perfect System tone assignments and
  aspect–consonance mapping for the doctrina.
- `atkinson-nexus` — **Atkinson, Charles M. _The Critical Nexus: Tone-System,
  Mode, and Notation in Early Medieval Music_. New York: Oxford University Press,
  2009.** Tone-system, mode, and notation.
- `reisenweaver-guido` — **Reisenweaver, Anna. "Guido of Arezzo and His Influence
  on Music Learning." _Musical Offerings_ 3, no. 1 (2012).** Guido's pedagogy.
- `schulter-harmony` — **Schulter, Margo. Medieval Music & Arts Foundation harmony
  FAQs:** "Pythagorean Tuning and Medieval Polyphony"
  (<https://www.medieval.org/emfaq/harmony/pyth.html>) and "Hexachords,
  solmization, and musica ficta" (<https://www.medieval.org/emfaq/harmony/hex.html>).
  Pythagorean tuning; hexachords and solmization; the consonance taxonomy.
- `rockstro-grove` — **Rockstro, W. S. "Modes, The Ecclesiastical." In _A
  Dictionary of Music and Musicians_ (Grove, 1st ed.).**
  <https://en.wikisource.org/wiki/A_Dictionary_of_Music_and_Musicians/Modes,_The_Ecclesiastical>.
  The church modes, their dominants and modulations in rank order.
- `powers-wiering-mode` — **Powers, Harold S., and Frans Wiering, et al. "Mode."
  _Grove Music Online_, 2001, §§I–III.**
  <https://doi.org/10.1093/gmo/9781561592630.article.43718>. Medieval modal theory.
- `liber-usualis` — **_The Liber Usualis, with Introduction and Rubrics in
  English_. Ed. the Benedictines of Solesmes. Tournai: Desclée, 1961.** The
  introduction's "Rules for Interpretation" and rubrics — the original design
  source for the GABC parser and rhythm model: the notation and neume taxonomy,
  the three ictus rules, accidental scope, bar-line/breathing semantics, psalmody
  structure, and Latin diction. (A structured extract is kept at
  `~/Documents/Projects/Liber_Parsed/`. The book itself is also a chant corpus
  source — see `gregobase`.)
- `scala-format` — **Scala scale archive and `.scl` format. Manuel Op de Coul,
  Huygens-Fokker Foundation.** <https://www.huygens-fokker.org/scala/scl_format.html>.
  Custom tuning input.
- `guidonian-gamut` — **Guido of Arezzo's gamut and solmization, and the
  eight-mode system, as standardized in medieval theory** (gamut, hexachords,
  modes, psalm tones).
- `wikipedia-tuning` — **Wikipedia:** [Pythagorean tuning](https://en.wikipedia.org/wiki/Pythagorean_tuning),
  [Meantone temperament](https://en.wikipedia.org/wiki/Meantone_temperament),
  [Gregorian mode](https://en.wikipedia.org/wiki/Gregorian_mode). General-reference
  orientation for the temperaments and the modal system.

## Musica universalis (harmonia engine)

- `godwin-harmonies` — **Godwin, Joscelyn. _Harmonies of Heaven and Earth: The
  Spiritual Dimension of Music from Antiquity to the Avant-Garde_. London: Thames
  & Hudson, 1987.** Planetary scale taxonomy (Types A/B/C) and per-author analyses.
- `godwin-spheres` — **Godwin, Joscelyn, ed. _The Harmony of the Spheres: A
  Sourcebook of the Pythagorean Tradition in Music_. Rochester, VT: Inner
  Traditions, 1993.** Primary-source translations used to verify ratio and
  tone-name claims.
- `godwin-vowels` — **Godwin, Joscelyn. _The Mystery of the Seven Vowels in Theory
  and Practice_. Grand Rapids: Phanes Press, 1991.** Planetary vowel attestations;
  the Moon→Saturn vowel order after Nicomachus.
- `doctrina-primaries` — **The doctrina primary sources:** Nicomachus of Gerasa,
  _Manual of Harmonics_ (c. 100) and _Excerpta ex Nicomacho_; Plato, _Republic_
  X, 617b (Myth of Er); Pliny the Elder, _Naturalis historia_ II.xx (c. 77, with
  octave closure per Censorinus and Theon of Smyrna); Ptolemy, _Harmonics_ III.
  With the vowel–planet attestations: Porphyry, Marcus Gnosticus, Demetrius of
  Phaleron, Eusebius of Caesarea, Barthélemy of Edessa (via `godwin-vowels`).

## Astronomy and computus

- `standish-jpl` — **Standish, E. M. "Keplerian Elements for Approximate
  Positions of the Major Planets." JPL Solar System Dynamics, 1992 (updated for
  DE430).** <https://ssd.jpl.nasa.gov/planets/approx_pos.html>. The orbital
  element tables.
- `schlyter-positions` — **Schlyter, Paul. "Computing planetary positions — a
  tutorial with worked examples." Stjärnhimlen.**
  <https://www.stjarnhimlen.se/comp/tutorial.html>. The Sun and Moon position
  formulae.
- `computus` — **Easter computus: the Gregorian algorithm (Gauss/Butcher) and,
  before 1583, the classical 19-year Julian cycle with Julian→Gregorian day-number
  conversion.** See [Computus](https://en.wikipedia.org/wiki/Computus).
- `wikipedia-calendar` — **Wikipedia:** [Tridentine calendar](https://en.wikipedia.org/wiki/Tridentine_calendar),
  [Ranking of liturgical days in the Roman Rite](https://en.wikipedia.org/wiki/Ranking_of_liturgical_days_in_the_Roman_Rite).
  General-reference background for the era and the grade precedence.
