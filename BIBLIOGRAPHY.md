# Bibliography

The sources the library draws on: chant and calendar data, algorithms,
doctrine tables, and the references behind them. Code cites by bracketed key
(`[biblio: key]`); each docs page keeps a `## Sources` line pointing here.
Every entry carries an anchor named by its key, so a link reaches it as
`BIBLIOGRAPHY.md#key`.

## Data corpora

- `gregobase` — <a id="gregobase"></a>**GregoBase.** <https://gregobase.selapa.net/>. Chant corpora
  in GABC, extracted by book. Counts are the chants each book lists on the
  shelf, as `corpus(code).count` reports them: tonus carries the books whole,
  whether or not a day of the calendar calls for a chant, and a chant printed
  in two books is listed under each (see
  [COVERAGE.md](https://github.com/jeffreypierce/tonus/blob/main/COVERAGE.md)). Admission is Solesmes
  and the rhythmic marks the score engine reads; the 1974 Graduale, the 1990
  Gregorian Missal, and the 1983 Liber cantualis are excluded as
  post-conciliar re-editions of books already here.

  - _Graduale sacrosanctæ Romanæ ecclesiæ de tempore et de sanctis_ (Graduale
    Romanum). Ed. Solesmes. Tournai: Desclée, 1961 — 1,373 chants (`gr`).
  - _Liber Usualis Missæ et Officii pro dominicis et festis cum cantu
    Gregoriano_. Ed. Solesmes. Tournai: Desclée, 1961 — 2,446 chants (`lu`).
  - _Liber antiphonarius pro diurnis horis_ (Antiphonale Romanum). Solesmes,
    1960 — 2,506 chants (`la`).
  - _Liber Hymnarius cum invitatoriis & aliquibus responsoriis_. Solesmes, 1983
    — 361 chants (`lh`).
  - _Antiphonale Monasticum pro diurnis horis_. Solesmes, 1934 — 1,448 chants
    (`am`). The 1934 edition with the classic rhythmic marks, not the 2005–07
    restoration.
  - _Kyriale_ (from the Graduale Romanum). Solesmes, 1961 — 120 settings
    (`ky`). The eighteen numbered Masses, the ad libitum chants, and the
    Requiem.
  - _Psalterium Monasticum — Office divin selon le rit bénédictin_. Solesmes,
    1981 — 60 chants (`psm`).
- `divinum-officium` — <a id="divinum-officium"></a>**Divinum Officium.** The 1570–1962 Roman Breviary and
  Missal in machine-readable form.
  <https://github.com/DivinumOfficium/divinum-officium>;
  <https://divinumofficium.com/>. The liturgical calendar (650 entries), the
  Mass propers, the Office hours, and the Psalterium (Vulgate psalm and
  canticle verses), with the feast names, ranks (`ritus`), and Tempora stems
  the seasons follow.
- `nocturnale-romanum` — <a id="nocturnale-romanum"></a>**_Nocturnale Romanum_ — Matins of the Roman Rite.**
  Community restitution after Holger Peter Sandhofe (2002 base),
  Hartker-derived. <https://github.com/Nocturnale-Romanum/nocturnale-romanum>.
  The night-office corpus: responsories, antiphons, and hymns (1,549 chants,
  `nr`).
- `graduale-toni-communes` — <a id="graduale-toni-communes"></a>**Graduale Romanum appendix (Toni Communes).**
  The psalm tones and differentiae, including the tonus peregrinus.
- `bloomfield-compline` — <a id="bloomfield-compline"></a>**Bloomfield, _Compline_.**
  <https://github.com/bbloomf/compline> (public domain). Reference dates and
  chants for the Compline ordo.

## Chant rhythm and notation (score engine)

- `carroll-chironomy` — <a id="carroll-chironomy"></a>**Carroll, Joseph Robert. _The Technique of Gregorian
  Chironomy_. Toledo, OH: Gregorian Institute of America, 1955.** The seven
  rhythmic types, the three melodic rules, and the chironomy the track draws.
- `carroll-applied` — <a id="carroll-applied"></a>**Carroll, Joseph Robert (trans./ed., from the official
  course syllabus of the Gregorian Institute of Paris). _An Applied Course in
  Gregorian Chant_. Toledo, OH: Gregorian Institute of America, 1956.**
  Compound beats, ictus placement.
- `gajard-rhythm` — <a id="gajard-rhythm"></a>**Gajard, Joseph (trans. Aldhelm Dean). _The Rhythm of
  Plainsong According to the Solesmes School_. New York: J. Fischer & Bro.,
  1945.** The arsis/thesis synthesis.
- `mocquereau-nombre` — <a id="mocquereau-nombre"></a>**Mocquereau, André. _Le nombre musical grégorien_,
  1908–1927.** The Solesmes school's foundation.
- `cardine-semiology` — <a id="cardine-semiology"></a>**Cardine, Eugène. _Gregorian Semiology_. Trans.
  Robert M. Fowells. Solesmes.** The semiological reading of the neumes from
  the manuscripts themselves. Ch. 16 ("Salicus") is the source for tonus's one
  departure from the Mocquereau lineage: the salicus's principal note is the
  one following the oriscus, not the oriscus itself. Cited alongside it, the
  essay "Semiology and the Interpretation of Gregorian Chant" (trans. Virginia
  A. Schubert, from the Festschrift for Joseph Lennards), and Bevenot,
  "Plainsong with Dom Cardine: The Salicus" (_Sacred Music_ 115:4, pp. 15–21),
  which calls the printed middle-note reading "a trap."
- `desrocquettes-values` — <a id="desrocquettes-values"></a>**Desrocquettes, Jean Hébert. "Gregorian Musical
  Values."** The Solesmes rhythmic values, from Mocquereau's collaborator.
- `niedermeyer-ortigue` — <a id="niedermeyer-ortigue"></a>**Niedermeyer, Louis, and Joseph d'Ortigue.
  _Gregorian Accompaniment: A Theoretical and Practical Treatise upon the
  Accompaniment of Plainsong_. Trans. Wallace Goodrich. New York: Novello,
  Ewer & Co.** The per-mode cadence figures and the modal ethos epithets.
- `bragers-treatise` — <a id="bragers-treatise"></a>**Bragers, Achille P. _A Short Treatise on Gregorian
  Accompaniment_. New York: Carl Fischer, 1934.** Cadence figures,
  cross-check.
- `homan-cadence` — <a id="homan-cadence"></a>**Homan, Frederic W. _Cadence in Gregorian Chant_. Ph.D.
  diss., Indiana University, 1961.** The analytic study of chant cadences.
- `sunol-textbook` — <a id="sunol-textbook"></a>**Suñol, Dom Gregory. _Textbook of Gregorian Chant
  According to the Solesmes Method_. Trans. from the 6th French ed. Tournai:
  Desclée, 1930.** Modes, dominants, psalmody, the Solesmes rhythm doctrine,
  and the worked modulation examples the calibration reads.
- `apel-chant` — <a id="apel-chant"></a>**Apel, Willi. _Gregorian Chant_. Bloomington: Indiana
  University Press, 1958.** The analytic study of the repertoire; the
  centonization catalogue behind `score.formulas`.
- `hiley-plainchant` — <a id="hiley-plainchant"></a>**Hiley, David. _Western Plainchant: A Handbook_.
  Oxford: Clarendon Press, 1993.** The standard modern reference.
- `saulnier-guide` — <a id="saulnier-guide"></a>**Saulnier, Daniel. _Gregorian Chant: A Guide_. CMAA
  edition.** Chant introduction.
- `saulnier-modes` — <a id="saulnier-modes"></a>**Saulnier, Daniel. _The Gregorian Modes_. Solesmes:
  Éditions de Solesmes.** The Degree Summary Tables from Dom Jean Claire's
  research and the mode-by-mode Octoechos study; the source for the
  reciting-note data in `temper/data/modes.ts`.
- `pierik-spirit` — <a id="pierik-spirit"></a>**Pierik, Marie. _The Spirit of Gregorian Chant_. Boston:
  Bruce Humphries, 1939; and _Gregorian Chant Analyzed and Studied_. St.
  Meinrad, IN: Grail, 1951.** Chant interpretation; the beat letters the
  chironomia track draws.
- `gregorio-gabc` — <a id="gregorio-gabc"></a>**The Gregorio project.**
  <https://gregorio-project.github.io/>. The GABC plain-text chant notation
  the corpora are encoded in and the parser reads.
- `bravura-smufl` — <a id="bravura-smufl"></a>**Spreadbury, Daniel. _Bravura_ music font and the SMuFL
  (Standard Music Font Layout) specification. Steinberg, 2013–.**
  <https://www.smufl.org/> and <https://github.com/steinbergmedia/bravura>
  (SIL Open Font License). The reference SMuFL font; the notation glyphs the
  score engine engraves into SVG.

## Tuning and music theory (temperamentum engine)

- `boethius-institutione` — <a id="boethius-institutione"></a>**Boethius. _De institutione musica_ (c. 500–510),
  esp. I.27.** The medieval transmission of Pythagorean interval math.
- `ptolemy-harmonics` — <a id="ptolemy-harmonics"></a>**Ptolemy. _Harmonics_ I.15–16 (the three diatonic
  shades) and III with the Canobic Inscription (c. 150).** The tetrachord
  genera for the tuning presets.
- `schulter-harmony` — <a id="schulter-harmony"></a>**Schulter, Margo. Medieval Music & Arts Foundation
  harmony FAQs:** "Pythagorean Tuning and Medieval Polyphony"
  (<https://www.medieval.org/emfaq/harmony/pyth.html>) and "Hexachords,
  solmization, and musica ficta"
  (<https://www.medieval.org/emfaq/harmony/hex.html>). Pythagorean tuning;
  hexachords and solmization; the consonance taxonomy.
- `rockstro-grove` — <a id="rockstro-grove"></a>**Rockstro, W. S. "Modes, The Ecclesiastical." In _A
  Dictionary of Music and Musicians_ (Grove, 1st ed.).**
  <https://en.wikisource.org/wiki/A_Dictionary_of_Music_and_Musicians/Modes,_The_Ecclesiastical>.
  The church modes, their dominants and modulations in rank order.
- `liber-usualis` — <a id="liber-usualis"></a>**_The Liber Usualis, with Introduction and Rubrics in
  English_. Ed. the Benedictines of Solesmes. Tournai: Desclée, 1961.** The
  introduction's "Rules for Interpretation" and rubrics: the notation and
  neume taxonomy, ictus rules, accidental scope, bar-line semantics, psalmody,
  the Kyriale rubric categories, and the Latin diction the parser and rhythm
  model follow.
- `scala-format` — <a id="scala-format"></a>**Scala scale archive and `.scl` format. Manuel Op de Coul,
  Huygens-Fokker Foundation.**
  <https://www.huygens-fokker.org/scala/scl_format.html>. Custom tuning input.

## Computus

- `computus` — <a id="computus"></a>**Easter computus: the Gregorian algorithm
  in Oudin's 1940 formulation and, before 1583, the classical 19-year Julian
  cycle in Meeus's formulation, with Julian→Gregorian day-number conversion.**
  The Gregorian form as given in Tøndering, Claus, _Frequently Asked Questions
  about Calendars_, <https://www.tondering.dk/claus/cal/easter.php>; the Julian
  in Meeus, Jean, _Astronomical Algorithms_, 2nd ed. (Richmond, VA:
  Willmann-Bell, 1998), ch. 8. See also
  [Computus](https://en.wikipedia.org/wiki/Computus).
