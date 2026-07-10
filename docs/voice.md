# Voice

`tonus.vox` builds a singing voice as data. A voice is a small set of parameters
(vocal-tract size, age, tiredness, effort, the carrying ring, and Latin region)
that resolve into formant bands and, under a fundamental, a harmonic spectrum.
`tonus.chorus` gathers many voices into a seeded ensemble whose small tuning and
timing scatter is computed, not authored. The engine produces formant and spectrum
data for analysis; it makes no sound.

The voice engine stands on its own. Its formants can be tuned to a tonus
temperament, so a voice is analysed in the same tuning as the chant it carries.

- [The singer — `vox`](#the-singer--vox)
- [Vowels and formants — `formantes`, `iter`](#vowels-and-formants--formantes-iter)
- [Spectrum and brightness — `spectrum`, `claritas`](#spectrum-and-brightness--spectrum-claritas)
- [Liquescents — `liquescentia`](#liquescents--liquescentia)
- [The ensemble — `chorus`](#the-ensemble--chorus)
- [Theory & Context](#theory--context)
- [Sources](#sources)

## The singer — `vox`

`tonus.vox(persona?, overrides?)` builds one voice. It takes a **persona** (a named
voice part) or a bare parameter bundle, plus optional overrides, and returns a
`Vox` whose methods read a formant table built once at construction.

```js
const tenor = tonus.vox("tenor");
tenor.params;
// { tract: 1.02, aetas: 0.35, fatigatio: 0, cantoris: 0.7, nisus: 0.5,
//   latinitas: "romana" }
```

The seven personae are parameter bundles; an unset axis falls to the neutral
centre. Their tracts follow a register table, and `cantoris`/`nisus` give each part
its carrying and weight tendencies.

| Persona       | Character                                    |
| ------------- | -------------------------------------------- |
| `bassus`      | the bass; longest tract, the drone floor     |
| `baritonus`   | the baritone                                 |
| `tenor`       | the chant workhorse; strongest carrying ring |
| `contratenor` | the falsettist; heady, light                 |
| `altus`       | the alto, a woman's voice                    |
| `superius`    | the highest adult voice; open, carrying      |
| `puer`        | the boy treble; bright, young                |

The parameter set is the whole configuration surface. Each axis is a real physical
cause, and each moves only the numbers it physically should.

```ts
interface VoxParams {
  tract: number;      // vocal-tract length scale, the size axis.
                      // ~0.80 child, ~0.90 woman, 1.00 tenor, ~1.25 deep bass
  aetas: number;      // age 0..1 (chorister → elder): jitter, drift, looser Q
  fatigatio: number;  // tiredness 0..1: steeper spectral tilt, looser Q
  cantoris: number;   // carrying ring 0..1, the singer's formant (~2.9 kHz)
  nisus: number;      // vocal effort/weight 0..1: flute-light … pressed
  latinitas: Latinitas; // "romana" | "germanica" | "gallica"
}
```

`latinitas` colours the vowels by pronunciation region — `romana` (Solesmes, the
default), `germanica`, or `gallica`. It shifts a vowel's mouth position by a small
offset, regional colour rather than a different vowel.

`vox` throws on an unknown persona name.

## Vowels and formants — `formantes`, `iter`

`vox.formantes(vowel)` returns the five formant bands of a vowel: the resonant
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

`vox.iter(a, b, t)` walks the path between two vowels, returning the formants at
the point `t` of the way from `a` to `b`. It interpolates the mouth position, not
the formants directly, so every midpoint is a real vowel shape.

```js
tenor.iter("a", "i", 0.5).map((f) => Math.round(f.freqHz));
// [ 545, 1895, 2940, 3496, 4134 ] — halfway from "a" toward "i"
```

To tune the voice to a temperament, pass a lattice to `formantes` — an array of
target frequencies in Hz, or an `(hz) => hz` snapping function. Each formant
centre is drawn toward the nearest lattice frequency, the way a soprano tunes a
formant onto a harmonic to carry. A temperament's gamut supplies the lattice;
the optional `vis` weights the pull, from 0 (phonetic truth) to 1 (fully
tuned), and defaults to 1.

```js
const temper = tonus.temperamentum({ tuning: "pythagorean" });
const lattice = temper.gamut({ span: [48, 108] }).map((p) => p.hz);

tenor.formantes("a", { ad: lattice }).map((f) => Math.round(f.freqHz));
// [ 782, 1320, 2781, 3129, 3960 ] — locked onto the Pythagorean lattice
tenor.formantes("a", { ad: lattice, vis: 0.5 }); // half-way toward the tuning
```

`formantes` and `iter` throw on an argument that is not one of `a e i o u`.

## Spectrum and brightness — `spectrum`, `claritas`

`vox.spectrum(f0, vowel, nHarmonics?)` voices a fundamental through the vowel: it
returns the amplitude of each harmonic of `f0`, filtered by the formant envelope
and the carrying ring. These are the harmonic amplitudes of the sung vowel, ready
for spectral analysis.

```js
tenor.spectrum(146.83, "a", 6); // D3, first six harmonics
// [ 0.005, 0.002, 0.002, 0.004, 0.029, 0.005 ]
//   the 5th harmonic (≈734 Hz) rides near a formant, so it dominates
```

`vox.claritas(f0, vowel)` is the spectral centroid of that spectrum: the
amplitude-weighted mean frequency, the standard acoustic measure of brightness. It
is a reading, not a setting, and rises as effort (`nisus`) or the carrying ring
(`cantoris`) push energy into the upper harmonics.

```js
tenor.claritas(146.83, "i"); //  597.5 Hz — energy sits in the low first formant
tenor.claritas(146.83, "a"); // 1454.8 Hz — energy spread up through F1 and F2

tonus.vox("puer").claritas(293.66, "a");   // 1683.3 — a short tract lifts the envelope
tonus.vox("bassus").claritas(146.83, "a"); // 1261.8 — a long tract sinks it
```

`spectrum` and `claritas` default to 40 harmonics when the count is omitted.

## Liquescents — `liquescentia`

A liquescent note is a vowel melting into a nasal, lateral, or glide, the thing a
*cephalicus* marks in the notation. `vox.liquescentia(vowel, coda, depth?)` returns
the formant target the vowel bends toward as the note closes.

```js
tenor.formantes("a").map((f) => Math.round(f.freqHz));
// [ 773, 1305, 2719, 3231, 3979 ]  — the plain vowel

tenor.liquescentia("a", "m").map((f) => Math.round(f.freqHz));
// [ 556, 1018, 2719, 3231, 3979 ]  — "a" closing to [m]: F1 and F2 drop
```

The five codas are `m`, `n` (nasals), `l` (lateral), `j`, `w` (glides). `depth`
runs from 0 (the plain vowel) to 1 (the full coda articulation), and defaults to
1. The targets are built on the vowel's own formants, so the melt is relative to
whatever vowel precedes the coda.

The melt is a formant target — the renderer's side of the per-note contract.
A downstream synth voices the note at its tuned pitch and sweeps the vowel's
bands toward the melt as the note closes:

```js
const t    = tonus.temperamentum({ mode: 1 });
const f0   = t.nota("D4").hz;                 // 293.33 Hz, the final of mode 1
const from = tenor.formantes("a");            // the open vowel …
const melt = tenor.liquescentia("a", "m");    // … and its [m] target at f0
```

`liquescentia` throws on an unknown coda.

## The ensemble — `chorus`

`tonus.chorus(consortium?, opts?)` builds an ensemble. It takes a named
**consortium** or an options bag with a custom roster, plus an explicit `seed` and
any parameter overrides applied to every cantor, and returns a `Chorus`.

```js
const schola = tonus.chorus("schola");
schola.size; // 7 — four tenors and three baritones
```

The five consortia are rosters of `[persona, count]` pairs. `schola` is the
default: a monastic-size body of tenors and baritones.

| Consortium | Roster                                    |
| ---------- | ----------------------------------------- |
| `schola`   | 4 tenors, 3 baritones, the default body   |
| `pueri`    | 6 boy trebles, the choir-school sound     |
| `duo`      | 1 tenor, 1 bass, intimate                 |
| `cantor`   | 1 tenor, the soloist                      |
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
cantor's parameters (the envelope of his deviation) and the seed only places him
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

### Physiology is continuous

The engine's design premise is that voice character is continuous physical cause,
not a menu. Vocal-tract length is one axis, age another, effort another; a persona
is only a preset bundle of their values, special-cased nowhere in the code. The
base voice itself is a blend across the tract axis — boy treble, woman, man — not a
switch, so a requested tract of 0.9 is a real interpolated tube. This keeps every
intermediate voice reachable.

### Measured and invented

The engine marks what it can defend. The vowel formant tables and the source law
are grounded in the acoustics literature, and the liquescent coda targets follow
Stevens' consonant formants. The ensemble scatter magnitudes are of the order
Ternström measured in real choirs. The specific per-parameter couplings on top of
that — how much a tired voice widens its scatter, how effort shifts the spectral
tilt — are proposed articulatory intuitions, labelled as invented in the code
rather than dressed as measurement.

### Determinism

The voice engine obeys the library's determinism contract. No `Math.random`
appears anywhere; the ensemble's scatter comes from a seeded generator, so the
same seed and inputs always return byte-identical output. A choir, once seeded,
sounds like itself forever.

## Sources

[biblio: sundberg-singing], [biblio: peterson-barney], [biblio: stevens-acoustic-phonetics],
[biblio: ternstrom-choir], [biblio: copeman-latin].
