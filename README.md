# tonus

**tonus** is a JavaScript library for medieval music theory and chant
analysis. It carries the Gregorian repertoire and the concepts it was built on.

It tunes to scales medieval singers would have used, tells you which chants
belong to which day and returns analysis and notation, and calculates the
_music of the spheres_ proposed by Pythagoras, Boethius, and more as real
intervals.

**[Interactive demo](https://orreliquum.com/)**

Everything is computed locally and deterministically: the same question always
returns the same answer, from data that ships inside the package, with no network
calls and no runtime dependencies.

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

// Turn the chant into tuned, rhythmicized notes, then draw it.
const score = tonus.notatio(introit, { temperamentum: t });
const { svg, geometry } = tonus.inscriptio(score, { width: 680 });

// And voice the Christmas sky as pitch, after Boethius.
const harmony = tonus.harmonia(tonus.caelum({ date: feast.date }));
```

The objects each call returns (`feast`, `t`) pass straight back into the next as
filters.

## The API

Fourteen methods, each named for what it returns.

| Method                        | Returns                                                           |
| ----------------------------- | ----------------------------------------------------------------- |
| `festum({ date })`            | the feasts of a day, with rank, grade, and season                 |
| `pascha(year)`                | Easter and the movable feasts reckoned from it                    |
| `cantus({ … })`               | chants by id, incipit, mode, office, or source                    |
| `proprium({ feast, office })` | the Mass propers for a feast                                      |
| `ordinarium({ … })`           | the Kyriale — the Mass ordinary settings                          |
| `officium({ feast, hora })`   | an Office hour, psalms and antiphons in order                     |
| `psalmus({ psalm })`          | a psalm, pointed for its tone                                     |
| `corpus()`                    | what ships: counts by book, genus, and mode                       |
| `census({ id })`              | one chant measured against the corpus                             |
| `temperamentum({ … })`        | a tuning — `nota`, `gradus`, `modus`, `intervallum`               |
| `notatio(chant)`              | GABC parsed to phrases, syllables, and tuned notes                |
| `inscriptio(score)`           | `{ svg, geometry }` — the score drawn, and where each note landed |
| `caelum({ date })`            | the classical planets at a moment                                 |
| `harmonia(caelum)`            | those positions voiced as pitch                                   |

**Tuning** covers Pythagorean and meantone temperaments, just intonation and
custom scales, the Guidonian gamut and hand, hexachords and their mutations,
and intervals named as the treatises name them. Each of the eight modes carries
its final, dominant, ambitus, and ethos, with its psalm tones.

**The calendar** is Tridentine, resolved against Easter by
the Julian or the Gregorian computus.

**The repertoire** is 7,840 chants across seven books, six Solesmes editions and
the _Nocturnale Romanum_ night office in
[GABC](https://gregorio-project.github.io/) notation: Mass propers, the Kyriale,
the Office hours, the psalter, and the Matins nocturns.

**Scores** are shaped by the Solesmes arsis/thesis rhythm, fingerprinted for
melodic character, and drawn to a square-note or modern staff.

## Concepts

Boethius treated music as a branch of number theory, and divided it into the
audible and the inaudible: instruments and voices, body and soul, the turning
cosmos. Chant
was composed inside that frame: pitch was ratio, the modes a received order,
the heavens harmonic proportion. tonus takes those claims literally enough to
compute them, which is why tuning is ratio arithmetic, why the calendar is a
retrieval index, and why there is an ephemeris in a chant library at all.

Where the sources run out or contradict one another, tonus makes an editorial
call and records it in the code.

## Documentation

The **[documentation index](docs/api/index.md)** is the technical center: the full
API, the conventions, the error contract, and the code standards. From there,
one page per engine, in dependency order:
[tuning](docs/api/tuning.md), [calendar](docs/api/calendar.md), [chant](docs/api/chant.md),
[score](docs/api/score.md), [heavens](docs/api/heavens.md), and
[census](docs/api/census.md).

## Install and run

ESM only. Node ≥ 20; works in the browser through a bundler. No runtime
dependencies. The chants and the 650-entry calendar ship in the package.

```sh
npm test          # builds and runs the suite (node --test)
```

The data files in `src/data/` are generated by a separate extraction pipeline
(tonus-corpus). Edits happen there, not here.

## Sources

The chant and calendar data are the Solesmes editions, by way of
[GregoBase](https://gregobase.selapa.net/),
[Divinum Officium](https://divinumofficium.com/), and the community _Nocturnale
Romanum_. The notation is engraved in Daniel Spreadbury's
[Bravura](https://github.com/steinbergmedia/bravura), the reference font for the
SMuFL standard. Behind the rest stand Mocquereau and Suñol on rhythm, Rockstro
and Apel on the modes, Boethius and Ptolemy on tuning, and Godwin on the
Pythagorean planets.

Every figure is cited in the code beside what it explains, and
[BIBLIOGRAPHY.md](BIBLIOGRAPHY.md) is the complete list.

## License

[PolyForm Noncommercial 1.0.0](LICENSE): free to use, study, modify, and
share for any noncommercial purpose — personal projects, research,
education, art, religious observance. Commercial use requires permission
from the author. Versions through 0.1.x were published under MIT and
remain so. Chant and liturgical data derive from GregoBase and Divinum
Officium; see [BIBLIOGRAPHY.md](BIBLIOGRAPHY.md) for full attribution.
