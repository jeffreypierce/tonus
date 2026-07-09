# Voice

`tonus.vox` builds a singing voice as data. A voice is a bank of physical sliders
(vocal-tract length, age, effort, brightness) that resolve into formant bands and,
under a fundamental, a harmonic spectrum. `tonus.chorus` gathers many voices into
a seeded ensemble whose small tuning and timing scatter is computed, not authored.
The engine emits numbers for a synthesizer to sound; it produces no audio itself.

The voice engine depends on nothing else in tonus. It can be tuned to a
temperament through [accordatio](#tuning-the-formants--accordatio), but it does so
by consuming a plain array of frequencies, so neither engine imports the other.

- [The singer — `vox`](#the-singer--vox)
- [Vowels and formants — `formantes`, `locus`, `iter`](#vowels-and-formants--formantes-locus-iter)
- [Spectrum and brightness — `spectrum`, `claritas`](#spectrum-and-brightness--spectrum-claritas)
- [Liquescents — `liquescentia`](#liquescents--liquescentia)
- [Tuning the formants — accordatio](#tuning-the-formants--accordatio)
- [Regional Latin — latinitas](#regional-latin--latinitas)
- [The ensemble — `chorus`](#the-ensemble--chorus)
- [Theory & Context](#theory--context)
- [Sources](#sources)

## The singer — `vox`

`tonus.vox(persona?, overrides?)` builds one voice. It takes a **persona** — a
named voice part — or the `vetus` modifier, or a bare slider bundle, plus optional
overrides, and returns a `Vox` whose methods read a formant table built once at
construction.

```js
const tenor = tonus.vox("tenor");
tenor.params;
// { tract: 1.02, aetas: 0.35, fatigatio: 0, cantoris: 0.7, nisus: 0.5,
//   latinitas: "romana" }
```

The seven personae are slider bundles; an unset axis falls to the neutral centre.
Their tracts follow a register table, and `cantoris`/`nisus` give each part its
carrying and weight tendencies.

| Persona       | Character                                    |
| ------------- | -------------------------------------------- |
| `bassus`      | the drone floor; longest tract               |
| `baritonus`   | low male                                     |
| `tenor`       | the chant workhorse; strongest carrying ring |
| `contratenor` | the falsettist; heady, light                 |
| `altus`       | high male                                    |
| `superius`    | the highest adult voice; open, carrying      |
| `puer`        | the boy treble; bright, young                |

`vetus` is a **modifier**, not a base. It composes onto any part by raising age
and letting fatigue creep, so it is passed as an override:

```js
const oldTenor = tonus.vox("tenor", { aetas: 0.85, fatigatio: 0.25 });
```

The slider bank is the whole configuration surface. Each axis is a real physical
cause, and each moves only the numbers it physically should.

```ts
interface VoxParams {
  tract: number;      // vocal-tract length scale — the gender/size axis.
                      // ~0.80 child, 1.00 alto/tenor, ~1.25 deep bass
  aetas: number;      // age 0..1 (chorister → elder): jitter, drift, looser Q
  fatigatio: number;  // tiredness 0..1: steeper spectral tilt, looser Q
  cantoris: number;   // singer's-formant strength 0..1 (the ~2.9 kHz ring)
  nisus: number;      // vocal effort/weight 0..1: flute-light … pressed
  latinitas: Latinitas; // "romana" | "germanica" | "gallica"
}
```

`vox` throws on an unknown persona name.

## Vowels and formants — `formantes`, `locus`, `iter`

`vox.formantes(vowel)` returns the five formant bands of a vowel — the resonant
peaks that make an `a` an `a`.

```js
tenor.formantes("a");
// [ { freqHz: 773,  q: 9.7,  gain: 1     },
//   { freqHz: 1305, q: 12.9, gain: 0.539 },
//   { freqHz: 2719, q: 20.2, gain: 0.2   },
//   { freqHz: 3231, q: 19.3, gain: 0.079 },
//   { freqHz: 3979, q: 19.3, gain: 0.016 } ]
```

```ts
interface Formant {
  freqHz: number;
  q: number;    // resonance sharpness (centre ÷ bandwidth)
  gain: number; // linear, not dB
}
```

The five cardinal vowels sit on a plane. `vox.locus(vowel)` gives a vowel's
coordinate; `a` is at the centre and `e`/`i`/`o`/`u` at the edge-midpoints, so the
space is a diamond, not a square.

```js
tenor.locus("a"); // { u: 0.5, v: 0.5 }
tenor.locus("i"); // { u: 1,   v: 0.5 }
```

Because the plane is continuous, `formantes` also reads an arbitrary point, and
`vox.iter(a, b, t)` walks the path between two vowels. It interpolates the mouth
position, not the formants directly, so every midpoint is a real vowel shape.

```js
tenor.iter("a", "i", 0.5).map((f) => Math.round(f.freqHz));
// [ 545, 1895, 2940, 3496, 4134 ] — halfway from "a" toward "i"
```

```ts
interface Locus { u: number; v: number; }
```

`locus` and `iter` throw on an argument that is not one of `a e i o u`.

## Spectrum and brightness — `spectrum`, `claritas`

`vox.spectrum(f0, vowel, nHarmonics?)` voices a fundamental through the vowel: it
returns the amplitude of each harmonic of `f0`, filtered by the formant envelope
and the singer's-formant ring. This is the input an additive synthesizer reads.

```js
tenor.spectrum(146.83, "a", 6); // D3, first six harmonics
// [ 0.005, 0.002, 0.002, 0.004, 0.029, 0.005 ]
//   the 5th harmonic (≈734 Hz) rides near a formant, so it dominates
```

`vox.claritas(f0, vowel)` reads brightness as an **output**, never a knob: the
spectral centroid, the amplitude-weighted mean frequency of that spectrum. It
rises when effort or the singer's ring rise, because the physics did.

```js
tenor.claritas(146.83, "i"); //  597.5 Hz — a dark, close vowel
tenor.claritas(146.83, "a"); // 1454.8 Hz — open and bright

tonus.vox("puer").claritas(293.66, "a");   // 1683.3 — a bright young voice at D4
tonus.vox("bassus").claritas(146.83, "a"); // 1261.8 — the same vowel, sunk
```

`spectrum` and `claritas` default to 40 harmonics when the count is omitted.

## Liquescents — `liquescentia`

A liquescent note is a vowel melting into a nasal, lateral, or glide — what a
*cephalicus* is in the notation. `vox.liquescentia(vowel, coda, depth?)` returns
the formant target the vowel bends toward as the note closes.

```js
tenor.formantes("a").map((f) => Math.round(f.freqHz));
// [ 773, 1305, 2719, 3231, 3979 ]  — the plain vowel

tenor.liquescentia("a", "m").map((f) => Math.round(f.freqHz));
// [ 657, 1044, 2719, 3231, 3979 ]  — "a" closing to [m]: F1 and F2 drop
```

The five codas are `m`, `n` (nasals), `l` (lateral), `j`, `w` (glides). `depth`
runs from 0 (the plain vowel) to 1 (the full coda articulation), and defaults to
1. The targets are built on the vowel's own formants, so the melt is relative to
whatever vowel precedes the coda.

`liquescentia` throws on an unknown coda.

## Tuning the formants — accordatio

The classical soprano tunes a formant onto a harmonic to carry over an orchestra.
Passing an **accordatio** option to `formantes` does the same: it pulls each
formant centre toward the nearest frequency in a tuning lattice, weighted by `vis`
from 0 (phonetic truth) to 1 (fully lattice-locked).

```js
// A plain array of allowed frequencies, or a snapping function.
const lattice = [220, 261.6, 293.7, 329.6, 392, 440, 523.3];
tenor.formantes("a", { ad: lattice, vis: 0.5 });
```

```ts
type Lattice = number[] | ((hz: number) => number);
interface AccordatioOpts { ad: Lattice; vis: number; }
```

The lattice can be a chord's harmonics or a temperament's own pitch lattice. A
[`temperamentum`](tuning.md) can produce the frequencies and the voice can consume
them, with neither engine importing the other.

## Regional Latin — latinitas

The `latinitas` slider colours the vowels by pronunciation region: `romana` (the
Solesmes reference), `germanica`, or `gallica`. Each shifts a vowel's position on
the plane by a small offset, so the same `e` sits a little more open or fronted.

```js
tonus.vox("tenor", { latinitas: "romana"    }).formantes("e").slice(0, 2);
// F1/F2 ≈ 461 / 2200 Hz
tonus.vox("tenor", { latinitas: "germanica" }).formantes("e").slice(0, 2);
// F1/F2 ≈ 450 / 2220 Hz — brighter, more fronted
```

The shifts are regional colour, not different vowels; `romana` is the identity.

## The ensemble — `chorus`

`tonus.chorus(consortium?, opts?)` builds an ensemble. It takes a named
**consortium** or an options bag with a custom roster, plus an explicit `seed` and
any slider overrides applied to every cantor, and returns a `Chorus`.

```js
const schola = tonus.chorus("schola");
schola.size; // 7 — four tenors and three baritones
```

The five consortia are rosters of `[persona, count]` pairs. `schola` is the
default: a monastic-size body of tenors and baritones.

| Consortium | Roster                                    |
| ---------- | ----------------------------------------- |
| `schola`   | 4 tenors, 3 baritones — the default body  |
| `pueri`    | 6 boy trebles — the choir-school sound    |
| `duo`      | 1 tenor, 1 bass — intimate                |
| `cantor`   | 1 tenor — the soloist                     |
| `mixtum`   | 2 each of puer, altus, tenor, bass        |

Each cantor is a full `Vox`, reached by index, with his character baked in.
`chorus.dispersio()` reports every cantor's computed deviation from the nominal
voice: a few cents of tuning scatter and a few milliseconds of onset laziness or
eagerness. An older or more tired voice drifts wider; a boy treble rushes.

```js
schola.dispersio();
// [ { index: 0, persona: "tenor",     detuneCents: -3.18, timingMs:  2.70 },
//   { index: 1, persona: "tenor",     detuneCents: -3.81, timingMs: -0.89 },
//   …
//   { index: 4, persona: "baritonus", detuneCents:  2.29, timingMs:  0.05 }, … ]
```

The scatter is **seeded**, not random: the character is computed from each
cantor's sliders (the envelope of his deviation) and the seed only places him
within that envelope. Two identical seeds produce byte-identical choirs.

```js
const a = tonus.chorus("schola", { seed: 42 }).dispersio();
const b = tonus.chorus("schola", { seed: 42 }).dispersio();
// a and b are identical

// A custom roster, seeded.
tonus.chorus({ voces: [["puer", 3], ["tenor", 2]], seed: 7 }).size; // 5
```

`chorus.spectrum(f0, vowel)` sums the ensemble: each cantor sings at his own
detuned fundamental, and the harmonic amplitudes fold together into the chorused
tone a single voice cannot make.

```js
schola.spectrum(146.83, "a", 4); // [ 0.04, 0.02, 0.02, 0.04 ]
tenor.spectrum(146.83, "a", 4);  // [ 0.01, 0,    0,    0    ] — one voice
```

```ts
interface Dispersio {
  index: number;
  persona: string;
  detuneCents: number; // tuning scatter
  timingMs: number;    // onset laziness (+) or eagerness (−)
}
interface ChorusOpts extends Partial<VoxParams> {
  seed?: number;
  voces?: [PersonaName, number][]; // a custom roster
}
```

`chorus` throws on an unknown consortium or persona, or an empty roster, and
`chorus.cantor(i)` throws on an index outside the ensemble.

## Theory & Context

### The source–filter model

A voiced sound is a source filtered by a tube. The vocal folds make a
harmonically dense buzz — the **source** — and the vocal tract shapes it into vowels by
resonating at particular frequencies, the **formants**. tonus follows this model
directly: `spectrum` multiplies a glottal source (a spectral tilt set by `nisus`
and `fatigatio`) by the formant envelope (a sum of resonant peaks) plus the
singer's-formant cluster near 2.9 kHz that lets a schola fill a stone room without
volume. The formant targets are authored after Sundberg's measurements, cross-read
against the Peterson–Barney corner-vowel corpus.

### Physiology is a slider

The engine's design premise is that voice character is continuous physical cause,
not a menu. Vocal-tract length is one axis, age another, effort another; a persona
is only a preset bundle of their values, special-cased nowhere in the code. The
base voice itself is a blend across the tract axis — boy treble, adult female,
adult male — not a switch, so a requested tract of 0.9 is a real interpolated
tube. This keeps every intermediate voice reachable.

### Measured and invented

The engine marks what it can defend. The formant tables and the source law are
grounded in the acoustics literature. The ensemble scatter magnitudes are of the
order Ternström measured in real choirs. The specific per-slider couplings on top
of that — how much a tired voice widens its scatter, how a coda bends a formant —
are proposed articulatory intuitions, labelled as invented in the code rather than
dressed as measurement.

### Determinism

The voice engine obeys the library's determinism contract. No `Math.random`
appears anywhere; the ensemble's scatter comes from a seeded generator, so the
same seed and inputs always return byte-identical output. A choir, once seeded,
sounds like itself forever.

## Sources

[biblio: sundberg-singing], [biblio: peterson-barney], [biblio: ternstrom-choir],
[biblio: copeman-latin].
