# Bibliography

The single source of truth for the sources tonus is built from. Every entry has
a stable **key** in `code font` at its head. Code cites a source by that key in a
bracket — `[biblio: carroll-chironomy]` — and the documentation links to the
entry's anchor. Nothing else restates a full citation; the editorial reason a
source is used lives at the code it informs.

Page scans of the accompaniment treatises behind the cadence figures
(`niedermeyer-ortigue`, `bragers-treatise`) are kept out of the repo, at
`~/Documents/tonus-sources/`.

## Data corpora

- `gregobase` — **GregoBase**: chant corpora in GABC, by book (the four
  Solesmes editions: Graduale Romanum 1961, Liber Usualis 1961, Liber
  Antiphonarius 1960, Liber Hymnarius 1983).
- `divinum-officium` — **Divinum Officium**: liturgical calendar (642 entries),
  Mass propers, Office hours, Psalterium.
- `graduale-toni-communes` — **Graduale Romanum appendix (Toni Communes)**:
  psalm tones and differentiae, including tonus peregrinus.
- `versus-psalmorum` — **Versus Psalmorum et Canticorum (Solesmes, No. 839)**:
  psalm-verse formulas.
- `bloomfield-compline` — **Bloomfield, _Compline_** (github.com/bbloomf/compline,
  public domain): reference dates & chants for the traditional Roman Compline ordo.

## Chant rhythm (score engine)

- `carroll-chironomy` — **Carroll, _The Technique of Gregorian Chironomy_
  (1955)**: seven rhythmic types, three melodic rules, chironomy.
- `carroll-applied` — **Carroll, _An Applied Course in Gregorian Chant_ (1956)**:
  compound beats, ictus placement.
- `gajard-rhythm` — **Gajard, _The Rhythm of Plainsong_ (1945)**: arsis/thesis
  synthesis.
- `mocquereau-nombre` — **Mocquereau, _Le nombre musical grégorien_ (1908–1927)**:
  the Solesmes school's foundation.
- `cardine-semiology` — **Cardine, "Semiology and the Interpretation of
  Gregorian Chant"**: the semiological approach.
- `desrocquettes-values` — **Desrocquettes, "Gregorian Musical Values"**:
  Solesmes rhythmic values.
- `niedermeyer-ortigue` — **Niedermeyer & d'Ortigue, _Gregorian Accompaniment_
  (trans. Goodrich)**: the per-mode cadence figures.
- `bragers-treatise` — **Bragers, _A Short Treatise on Gregorian Accompaniment_
  (1934)**: cadence figures, cross-check.
- `homan-cadence` — **Homan, _Cadence in Gregorian Chant_ (1961)**: analytic
  study of cadences.
- `murray-accentual` — **Murray, "Accentual Cadences in Gregorian Chant" (1958)**:
  spondaic and dactylic verbal cadences.
- `sunol-textbook` — **Suñol, _Textbook of Gregorian Chant According to the
  Solesmes Method_ (1930)**: modes, dominants, psalmody, the Solesmes rhythm
  doctrine.
- `apel-chant` — **Apel, _Gregorian Chant_ (1958)**: analytic study of the
  repertoire.
- `hiley-plainchant` — **Hiley, _Western Plainchant_ (1993)**: the standard
  reference.
- `treitler-voice-pen` — **Treitler, _With Voice and Pen_ (2003)**: orality and
  notation.
- `saulnier-guide` — **Saulnier, _Gregorian Chant: A Guide_**: chant introduction.
- `pierik-spirit` — **Pierik, _The Spirit of Gregorian Chant_ (1939) and
  _Gregorian Chant Analyzed and Studied_ (1951)**: chant interpretation.
- `burkard-manual` — **Burkard, _Manual of Plain Chant_ (1906)**: plainchant
  instruction.
- `kelly-capturing` — **Kelly, _Capturing Music: The Story of Notation_ (2014)**:
  notation history.

## Tuning and music theory (temperamentum engine)

- `boethius-institutione` — **Boethius, _De institutione musica_**: Pythagorean
  interval math; also the Boethius doctrina.
- `ptolemy-harmonics` — **Ptolemy, _Harmonics_ I.15–16**: the three diatonic
  shades; _Harmonics_ III for the doctrina.
- `atkinson-nexus` — **Atkinson, _The Critical Nexus_ (2009)**: tone-system,
  mode, and notation.
- `reisenweaver-guido` — **Reisenweaver, "Guido of Arezzo" (2012)**: Guido's
  pedagogy.
- `schulter-harmony` — **Schulter, medieval.org harmony FAQs**: Pythagorean
  tuning; hexachords and solmization.
- `rockstro-grove` — **Rockstro, "Modes, The Ecclesiastical" (Grove, 1st ed.)**:
  the church modes, their dominants and modulations in rank order.
- `powers-wiering-mode` — **Powers/Wiering et al., "Mode" (Grove Music Online,
  2001), §§I–III**: medieval modal theory.
- `liber-usualis` — **Liber Usualis introduction and rubrics (Desclée, 1961)**:
  interpretation rules.
- `scala-format` — **Scala scale archive / `.scl` format** (Huygens-Fokker
  Foundation): custom tuning input.
- `guidonian-gamut` — **Guidonian gamut, solmization, and the eight-mode
  system**: as standardized in medieval theory.

## Musica universalis (harmonia engine)

- `godwin-harmonies` — **Godwin, _Harmonies of Heaven and Earth_ (1987)**:
  planetary scale taxonomy and analyses.
- `godwin-spheres` — **Godwin (ed.), _The Harmony of the Spheres_ (1993)**:
  primary-source translations.
- `godwin-vowels` — **Godwin, _The Mystery of the Seven Vowels_ (1991)**:
  planetary vowel attestations.
- `doctrina-primaries` — **Nicomachus, Plato, Pliny, Ptolemy**: the doctrina
  primaries (with the vowel attestations: Porphyry, Marcus Gnosticus, Demetrius,
  Eusebius, Barthélemy of Edessa).

## Astronomy and computus

- `standish-jpl` — **Standish, "Keplerian Elements for Approximate Positions of
  the Major Planets" (JPL, 1992/DE430)**: orbital elements.
- `schlyter-positions` — **Schlyter, "Computing planetary positions"
  (Stjärnhimlen)**: position computation tutorial.
- `computus` — **Gauss/Butcher computus; Julian 19-year cycle**: Easter
  reckoning.
