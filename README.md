# tonus

**tonus** is a JavaScript library for medieval music theory and chant
analysis. It carries the Gregorian repertoire and the theory it was built on:
it resolves what any day calls for, tunes chant in the ratios it was sung in,
parses and draws the notation, voices the planets as pitch, and measures each
chant against the rest.

Everything is computed locally and deterministically: the same question always
returns the same answer, from data that ships inside the package, with no network
calls and no runtime dependencies.

## What it covers

- **Pitch and tuning.** The medieval pitch world: Pythagorean and meantone
  temperaments, just intonation and custom scales, the Guidonian gamut and hand,
  hexachords and their mutations, and interval analysis by name.
- **The eight modes.** Each church mode with its final, dominant, ambitus, and
  ethos, and the psalm tones that go with them.
- **The liturgical calendar.** The Tridentine calendar of any year, resolved
  against Easter (by the Julian or the Gregorian computus), with each feast's
  rank, grade, and season.
- **The chant repertoire.** About 2,200 chants across ten books (nine Solesmes
  editions and the Nocturnale Romanum night office), in
  [GABC](https://gregorio-project.github.io/) notation: Mass propers, the Kyriale,
  the Office hours, the psalter, and the Matins nocturns, retrievable by feast,
  season, mode, or office.
- **Rhythm and notation.** GABC parsed into phrases, syllables, and tuned notes,
  shaped by the Solesmes arsis/thesis rhythm, with an analytic fingerprint of a
  chant's melodic character, and drawn to a square-note or modern staff.
- **The harmony of the spheres.** An ephemeris of the classical planets, voiced
  as tuned pitch after Boethius, Nicomachus, Pliny, and Ptolemy.
- **The census.** Every shipped chant measured against the corpus that holds
  it: how typical it is, where it is unusual, and its nearest neighbours by
  melodic shape.

## The ideas behind it

Boethius's _De institutione musica_ carried Greek theory into the Latin
Middle Ages, and it treats music as a branch of number, beside arithmetic,
geometry, and astronomy. Its music runs from the audible to the inaudible:
voices and instruments (_musica instrumentalis_), body and soul (_musica
humana_), the turning cosmos (_musica mundana_). Chant was composed and
copied inside that frame: pitch was ratio, the modes a received order, the
heavens harmonic proportion.

tonus takes those claims literally enough to compute them. It tunes pitch in
the Pythagorean ratios of the treatises. It reads the calendar as the
retrieval index it was for a millennium. It follows the Solesmes rhythm of
arsis and thesis. And it computes _musica mundana_ as sounding pitch. Where
the sources run out or contradict one another, tonus makes an editorial call
and records it in the code.

tonus is an instrument for study. It treats this repertoire as musical and
historical material to be measured, queried, and understood; what it models is
the sound and its structure.

## Sources

tonus is built on primary and scholarly sources, and it names them wherever it
makes a choice. The chant and calendar data are the Solesmes editions, by way of
[GregoBase](https://gregobase.selapa.net/),
[Divinum Officium](https://divinumofficium.com/), and the community _Nocturnale
Romanum_. The rhythm follows Mocquereau, Gajard, Suñol, and Daniel Saulnier; the
modes and cadences follow Rockstro's _Grove_ article, Niedermeyer & d'Ortigue,
and Apel; the tuning follows Boethius's _De institutione musica_ and Ptolemy's
_Harmonics_; the notation is engraved in Daniel Spreadbury's
[Bravura](https://github.com/steinbergmedia/bravura), the reference font for the
SMuFL standard; the planetary doctrines follow Godwin's sourcebooks of the
Pythagorean tradition.

Every figure is cited in the code beside what it explains. The complete list is
[BIBLIOGRAPHY.md](BIBLIOGRAPHY.md).

## Example

```sh
npm install tonus
```

```js
import tonus from "tonus";

// Build a tuning: Pythagorean, set to mode 1.
const t = tonus.temperamentum({ mode: 1 });
t.nota("D4"); // 293.33 Hz, the final of mode 1, through pure fifths
t.gradus("D4"); // "Delasolre": RE of the natural hexachord, the finalis

// Ask the calendar for a day, then pull the chant that belongs to it.
const [feast] = tonus.festum({ date: new Date("2026-12-25") });
// → "In Nativitate Domini", a Duplex I classis feast of Christmastide
const [introit] = tonus.proprium({ feast, office: "in" });
// → "Puer natus est", mode 7, from the Liber Usualis

// Turn the chant into tuned, rhythmicized notes.
const score = tonus.notatio(introit, { temperamentum: t });

// And voice the Christmas sky as pitch, after Boethius.
const harmony = tonus.harmonia(tonus.caelum({ date: feast.date }));
```

The objects each call returns (`feast`, `t`) pass straight back into the next as
filters.

## Documentation

The **[documentation index](docs/api/index.md)** is the technical center: the full
API, the conventions, the error contract, and the code standards. From there,
one page per engine, in dependency order:
[tuning](docs/api/tuning.md), [calendar](docs/api/calendar.md), [chant](docs/api/chant.md),
[score](docs/api/score.md), [heavens](docs/api/heavens.md), and
[census](docs/api/census.md).

## Install and run

ESM only. Node ≥ 20; works in the browser through a bundler. No runtime
dependencies. About 2,200 chants and the 650-entry calendar ship in the
package.

```sh
npm test          # builds and runs the suite (node --test)
```

The data files in `src/data/` are generated by a separate extraction pipeline
(tonus-corpus). Edits happen there, not here.

## License

[PolyForm Noncommercial 1.0.0](LICENSE): free to use, study, modify, and
share for any noncommercial purpose — personal projects, research,
education, art, religious observance. Commercial use requires permission
from the author. Versions through 0.1.x were published under MIT and
remain so. Chant and liturgical data derive from GregoBase and Divinum
Officium; see [BIBLIOGRAPHY.md](BIBLIOGRAPHY.md) for full attribution.
