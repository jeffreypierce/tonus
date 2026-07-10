# tonus

**tonus** is a library for the music of the medieval Church and the cosmology
that surrounded it. It reconstructs the chant repertoire and the intellectual
world it lived in, from the tuning of a single pitch to the harmony the ancients
ascribed to the planets.

It treats this repertoire as musical and historical material to be measured,
queried, and understood, and it takes no theological position and asks none of
its users. What it models is the sound and its structure.

Everything is computed locally and deterministically: the same question always
returns the same answer, from data that ships inside the package, with no network
calls and no runtime dependencies.

## What it holds

- **Pitch and tuning.** The medieval pitch world: Pythagorean and meantone
  temperaments, just intonation and custom scales, the Guidonian gamut and hand,
  hexachords and their mutations, and interval analysis by name.
- **The eight modes.** Each church mode with its final, dominant, ambitus, and
  ethos, and the psalm tones that go with them.
- **The liturgical calendar.** The Tridentine calendar of any year, resolved
  against Easter (by the Julian or the Gregorian computus), with each feast's
  authentic rank, grade, and season.
- **The chant repertoire.** Roughly eight and a half thousand chants across six
  books (five Solesmes editions and the Roman Matins repertoire), in
  [GABC](https://gregorio-project.github.io/) notation: Mass propers, the Kyriale,
  the Office hours, the psalter, and the Matins nocturns, retrievable by feast,
  season, mode, or office.
- **Rhythm and notation.** GABC parsed into phrases, syllables, and tuned notes,
  shaped by the Solesmes arsis/thesis rhythm, with an analytic fingerprint of a
  chant's melodic character, and drawn to a square-note or modern staff.
- **The voice.** The acoustics of the singing voice: the vowel formants,
  spectrum, and brightness of a voice set by vocal size, age, and effort, with
  regional Latin colour and seeded ensembles of many singers.
- **The harmony of the spheres.** An ephemeris of the classical planets, voiced
  as tuned pitch after Boethius, Nicomachus, Pliny, and Ptolemy.

## The ideas behind it

For Boethius, whose *De institutione musica* carried Greek theory into the Latin
Middle Ages, music was a branch of number. It stood in the quadrivium beside
arithmetic, geometry, and astronomy, and it reached from the audible up to the
inaudible: the sounding music of voices and instruments (*musica instrumentalis*),
the concord of body and soul (*musica humana*), and the harmony of the turning
cosmos (*musica mundana*). The true *musicus* judged all three by reason; the
singer who merely performed ranked below him. This is the frame the chant
repertoire was composed and copied inside of, where pitch was ratio, the modes a
received order, and the heavens audible proportion.

The thousand years since have been spent codifying and recovering that world. The
monks of Solesmes reconstructed a rhythm the notation had stopped recording;
Rockstro, Apel, and Hiley catalogued the modes and the repertoire; acousticians
measured the voice Boethius could only reason about. tonus stands on that
scholarship and takes the old claims literally enough to compute them.

That is the library's single idea, applied throughout. It rebuilds pitch as the
ratios chant was tuned in, not the equal temperament that came later. It reads the
calendar as the retrieval index it was for a millennium. It commits to one reading
of the rhythm, the Solesmes arsis and thesis (an interpretation among several),
rather than pretending the sources agree. And it computes *musica mundana* as real
pitch, voicing the planets after the theorists who first heard it there. Where the
sources run out or contradict one another, tonus makes an editorial call and
records it in the code. It reunites what Boethius set apart: the music one hears,
and the music one can only reckon.

## Sources

tonus is built on primary and scholarly sources, and it names them wherever it
makes a choice. The chant and calendar data are the Solesmes editions, by way of
[GregoBase](https://gregobase.selapa.net/),
[Divinum Officium](https://divinumofficium.com/), and the community *Nocturnale
Romanum*. The rhythm follows Mocquereau, Gajard, Suñol, and Daniel Saulnier; the
modes and cadences follow Rockstro's *Grove* article, Niedermeyer & d'Ortigue,
and Apel; the tuning follows Boethius's *De institutione musica* and Ptolemy's
*Harmonics*; the notation is engraved in Daniel Spreadbury's
[Bravura](https://github.com/steinbergmedia/bravura), the reference font for the
SMuFL standard; the planetary doctrines follow Godwin's sourcebooks of the
Pythagorean tradition; and the voice model follows Sundberg's acoustics of
singing.

Every figure is cited in the code beside what it explains. Where the sources
disagree, tonus records the editorial call it made in the same place. The complete
list is [BIBLIOGRAPHY.md](BIBLIOGRAPHY.md).

## Example

```sh
npm install tonus
```

```js
import tonus from "tonus";

// Build a tuning: Pythagorean, set to mode 1.
const t = tonus.temperamentum({ mode: 1 });
t.nota("D4");          // 293.33 Hz, the final of mode 1, through pure fifths
t.gradus("D4");        // "Delasolre": RE of the natural hexachord, the finalis

// Ask the calendar for a day, then pull the chant that belongs to it.
const [feast]   = tonus.festum({ date: new Date("2026-12-25") });
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

The **[documentation index](docs/index.md)** is the technical center: the full
API, the conventions, the error contract, and the code standards. From there,
one page per engine, in dependency order:
[tuning](docs/tuning.md), [calendar](docs/calendar.md), [chant](docs/chant.md),
[score](docs/score.md), [voice](docs/voice.md), and [heavens](docs/heavens.md).

## Install and run

ESM only. Node ≥ 20; works in the browser through a bundler. No runtime
dependencies. About 8,500 chants and the full 642-entry calendar ship in the
package (9.0 MB unpacked, 2.3 MB packed).

```sh
npm test          # builds and runs the suite (node --test)
```

The data files in `src/data/` are generated by a separate extraction pipeline
(tonus-corpus). Edits happen there, not here.

## License

[MIT](LICENSE). Chant and liturgical data derive from GregoBase and Divinum
Officium; see [BIBLIOGRAPHY.md](BIBLIOGRAPHY.md) for full attribution.
