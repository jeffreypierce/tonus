# Bibliography

Sources used in building tonus — data corpora, primary and secondary texts,
and algorithms. Entries marked ▸ are digital projects the data was extracted
from; the printed books they digitize are listed beneath them.

## Chant corpora

▸ **GregoBase** — a database of Gregorian chant scores in GABC notation.
  <https://gregobase.selapa.net/>. Chant corpora extracted by book
  (GregoBase source IDs 2, 3, 48, 15):

- *Graduale sacrosanctæ Romanæ ecclesiæ de tempore et de sanctis* (Graduale
  Romanum). Solesmes: Desclée, 1961. — 1,344 chants (`gr`).
- *Liber Usualis Missæ et Officii pro dominicis et festis cum cantu
  Gregoriano*. Solesmes: Desclée, 1961. — 2,377 chants (`lu`).
- *Liber antiphonarius pro diurnis horis* (Antiphonale Romanum). Solesmes,
  1960. — 1,422 chants (`la`).
- *Liber Hymnarius cum invitatoriis & aliquibus responsoriis*. Solesmes,
  1983. — 361 chants (`lh`).

## Liturgical texts and calendar

▸ **Divinum Officium** — the 1570–1962 Roman Breviary and Missal in
  machine-readable form. <https://divinumofficium.com/> /
  <https://github.com/DivinumOfficium/divinum-officium>. Extracted:
  liturgical calendar with feast names and ranks (642 entries, Sancti +
  Tempora), Mass propers (926 entries), Office hours (929 days), and the
  Psalterium (2,612 psalm + 579 canticle verses, Vulgate).

- Psalm tones and differentiae follow the Graduale Romanum appendix
  (Toni Communes), including the tonus peregrinus.

## Musica universalis (harmonia engine)

Secondary syntheses (taxonomy, ratio derivations, vowel attestations):

- Godwin, Joscelyn. *Harmonies of Heaven and Earth: The Spiritual Dimension
  of Music from Antiquity to the Avant-Garde*. London: Thames & Hudson,
  1987. — Part Three ("The Music of the Spheres"): planetary scale
  taxonomy (Types A/B/C) and per-author analyses.
- Godwin, Joscelyn, ed. *The Harmony of the Spheres: A Sourcebook of the
  Pythagorean Tradition in Music*. Rochester, VT: Inner Traditions, 1993.
  — Primary-source translations used to verify ratio and tone-name claims.
- Godwin, Joscelyn. *The Mystery of the Seven Vowels in Theory and
  Practice*. Grand Rapids: Phanes Press, 1991. — Planetary vowel
  attestations; the Moon→Saturn vowel order follows Nicomachus.

Primary sources underlying the four doctrinae (as translated/analyzed in
Godwin; see `docs/authors.md` for full derivations):

- Boethius. *De institutione musica* I.27 (c. 524) — conjunct diatonic
  planetary scale, transmitting Nicomachus; the medieval standard.
- Nicomachus of Gerasa. *Manual of Harmonics* (Harmonicum enchiridion,
  c. 100) and *Excerpta ex Nicomacho* — planetary tone assignments and
  vowel order.
- Plato. *Republic* X, 617b (Myth of Er) — the Sirens of the spheres.
- Pliny the Elder. *Naturalis historia* II.xx (c. 77) — distance-based
  chromatic planetary scale; octave closure per Censorinus and Theon of
  Smyrna.
- Ptolemy. *Harmonics* III and the Canobic Inscription (c. 150) — Greater
  Perfect System tone assignments and aspect–consonance mapping.
- Vowel–planet attestations: Porphyry, Marcus Gnosticus, Demetrius of
  Phaleron, Eusebius of Caesarea, Barthélemy of Edessa (via Godwin 1991).

## Music theory (temperamentum and score engines)

- Guido of Arezzo's gamut and solmization (Gammaut–Ela, ut–la,
  hexachordum durum/naturale/molle) as standardized in medieval theory.
- The eight-mode system (Protus/Deuterus/Tritus/Tetrardus,
  authentic/plagal) with finalis, tenor, and ambitus.
- Solesmes neume nomenclature and the arsis/thesis rhythm model
  (see `docs/theory/solesmes-rhythm.md`); after the school of Dom André
  Mocquereau, *Le nombre musical grégorien*, 1908–1927.
- Scala scale-file format (.scl), Manuel Op de Coul,
  <https://www.huygens-fokker.org/scala/scl_format.html> — for custom
  tuning input.

## Astronomy (planet engine)

- Standish, E. M. "Keplerian Elements for Approximate Positions of the
  Major Planets." JPL Solar System Dynamics, 1992 (updated for DE430).
  <https://ssd.jpl.nasa.gov/planets/approx_pos.html> — orbital elements,
  two validity ranges per body (3000 BC–3000 AD; 1800–2050 AD), with
  outer-planet perturbation terms.
- Gregorian Easter: Gauss/Butcher computus. Julian Easter (pre-1583):
  classical 19-year cycle computus with Julian→Gregorian day-number
  conversion.

---

*Sources the author consulted that are not machine-detectable from the
repository should be added here.*
