# tonus

**tonus** is a library for the music of the medieval Church and the cosmology
that surrounded it. It knows the pitch system chant was sung in, the eight modes
it was composed in, the calendar it was indexed by, the thousands of chants
themselves, the Solesmes rhythm that shapes them, a synthetic singing voice to
carry them, and the old idea that the planets sound a music of their own.

It is a research and analysis library, not a performance tool: it treats this
repertoire as musical and historical material to be measured and understood. It
takes no theological position and asks none of its users. What it models is the
sound and its structure.

Everything is computed locally and deterministically — the same question always
returns the same answer, from data that ships inside the package, with no network
calls and no runtime dependencies.

## What it holds

- **Pitch and tuning** — the medieval pitch world: Pythagorean and meantone
  temperaments, just intonation and custom scales, the Guidonian gamut and hand,
  hexachords and their mutations, and interval analysis by name.
- **The eight modes** — each church mode with its final, dominant, ambitus, and
  ethos, and the psalm tones that go with them.
- **The liturgical calendar** — the Tridentine calendar of any year, resolved
  against Easter (by the medieval or the Gregorian computus), with each feast's
  authentic rank, grade, and season.
- **The chant repertoire** — roughly eight and a half thousand chants across six
  books (five Solesmes editions and the Roman Matins repertoire), in
  [GABC](https://gregorio-project.github.io/) notation: Mass propers, the Kyriale,
  the Office hours, the psalter, and the Matins nocturns.
- **Rhythm and notation** — GABC parsed into phrases, syllables, and tuned
  notes, shaped by the Solesmes arsis/thesis rhythm, with an analytic fingerprint
  of a chant's melodic character, and drawn to a square-note or modern staff.
- **The voice** — a synthetic singing voice defined as formant and spectrum data:
  vowels, vocal size and age, brightness and effort, regional Latin colour, and
  seeded ensembles of many singers.
- **The harmony of the spheres** — an ephemeris of the classical planets, voiced
  as tuned pitch after Boethius, Nicomachus, Pliny, and Ptolemy.

## The ideas behind it

**Tuning came first.** Before equal temperament flattened everything, a pitch was
a ratio, not a piano key. tonus builds each pitch from those ratios — pure fifths
for the Pythagorean world chant lived in, tempered fifths for the Renaissance,
just thirds, or a scale you supply. Every other part of the library resolves its
pitches through this one, so a chant can be heard in the tuning of its own age.

**The modes are the grammar.** A chant is not in a key; it is in a mode — a scale
with a home note (the *final*), a reciting note (the *dominant*), a range, and a
received character. The modes organize the melodies, the psalm tones, and the way
a phrase leans toward its cadence.

**The calendar is a catalogue.** This music was transmitted and indexed by the
liturgical year for a thousand years. In tonus the calendar is a retrieval key
and the feast a filter: you ask for a day, and the chants that belong to it come
back. The scaffolding is how the music was kept, not the point of keeping it.

**Rhythm is an interpretation.** The Solesmes school read the old neumes as a free
rhythm of rising *arsis* and settling *thesis*, grouped in twos and threes. tonus
implements that reading — classifying each neume, placing the rhythmic ictus, and
tracing the shape a chironomist's hand would draw.

**The spheres really rang.** From Pythagoras to Kepler, learned people held that
the planets, spaced like a tuned string, sound intervals no ear can hear. tonus
takes those doctrines literally enough to compute them: it places the planets for
a given moment and voices each as a pitch, following whichever ancient author you
name.

## A taste

```sh
npm install tonus
```

```js
import tonus from "tonus";

// Build a tuning — Pythagorean, the world chant was sung in, set to mode 1.
const t = tonus.temperamentum({ mode: 1 });
t.nota("D4");          // 293.33 Hz — the final of mode 1, through pure fifths
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

Every engine is small, deterministic, and composable; the objects one returns
(`feast`, `t`) pass straight back into the next as filters.

## Sources

tonus is built on primary and scholarly sources, and it says so wherever it makes
a choice. The chant and calendar data come from
[GregoBase](https://gregobase.selapa.net/), [Divinum
Officium](https://divinumofficium.com/), and the community *Nocturnale Romanum*,
all from the Solesmes editions. The rhythm follows Mocquereau, Gajard, and Suñol;
the modes and cadences follow Grove, Niedermeyer & d'Ortigue, and Apel; the
tuning follows Boethius and Ptolemy; the planetary doctrines follow Godwin's
sourcebooks of the Pythagorean tradition; the synthetic voice follows Sundberg's
acoustics of singing. Every figure, and every place where the sources disagree
and tonus makes an editorial call, is cited in the code beside what it explains
and gathered in **[BIBLIOGRAPHY.md](BIBLIOGRAPHY.md)**.

## Documentation

The **[documentation index](docs/index.md)** is the technical center: the full
API, the conventions, the error contract, and the code and documentation
standards. From there, one page per engine, in dependency order —
[tuning](docs/tuning.md), [calendar](docs/calendar.md), [chant](docs/chant.md),
[score](docs/score.md), [voice](docs/voice.md), and [heavens](docs/heavens.md).

The docs are the middle of a three-level ladder: each API page links down into
the code, where the full theory, provenance, and editorial reasoning live in
comments beside what they explain. Read as deep as you care to.

## Install and run

ESM only. Node ≥ 20; works in the browser through a bundler. No runtime
dependencies. About 8,500 chants and the full 642-entry calendar ship in the
package — 9.1 MB unpacked, 2.2 MB packed.

```sh
npm test          # builds and runs the suite (node --test)
```

The data files in `src/data/` are generated by a separate extraction pipeline
(tonus-corpus). Edits happen there, not here.

## License

[MIT](LICENSE). Chant and liturgical data derive from GregoBase and Divinum
Officium; see [BIBLIOGRAPHY.md](BIBLIOGRAPHY.md) for full attribution.
