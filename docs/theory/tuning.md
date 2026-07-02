# Tuning Systems

What the `tuning:` presets in [`tonus.temperamentum`](../api/temperamentum.md)
actually are — the ratios, the history, and when to choose each. The theme
running through all of them: **you cannot have pure fifths, pure thirds, and
closed octaves at once.** Every tuning is a decision about which purity to
keep and which to sacrifice.

## Why chant cares

Gregorian chant is monophonic: a single unaccompanied line. Melodic
intervals are heard one after another, not stacked, so the ear tracks the
*melodic* quality of seconds, thirds, and fourths against a remembered
tonal center — there are no chords to beat against. This is why the Middle
Ages could live comfortably inside Pythagorean intonation, whose fifths and
fourths are perfect and whose thirds are bright and wide: in a melodic
idiom, a wide third is expressive color, not an out-of-tune triad.

The moment polyphony and organs arrive, sustained thirds start to beat, and
tuning history becomes a slow negotiation away from pure fifths toward pure
thirds — meantone — and finally to the great compromise of equal
temperament, where nothing is pure and everything is usable.

## The commas

Two small intervals drive everything:

- **Pythagorean comma** (~23.46 ¢): twelve pure fifths overshoot seven
  octaves by this much. `(3/2)¹² ≈ 129.75` vs `2⁷ = 128`. Any tuning built
  from pure fifths cannot close the circle.
- **Syntonic comma** (81/80, ~21.51 ¢): the gap between the Pythagorean
  third (81/64, four stacked fifths) and the pure third (5/4). This is the
  comma that meantone "means to" distribute — `comma: "1/4"` narrows each
  fifth by a quarter of it.

## The presets

### `"pythagorean"` — the medieval default

All intervals derive from the pure fifth 3/2 and the octave. Whole tone
9/8 (~204 ¢); diatonic semitone (*limma*) 256/243 (~90 ¢); major third
81/64 (~408 ¢ — a full syntonic comma wider than pure).

This is the tuning of medieval theory from Boethius through the Guidonian
gamut: the monochord divisions taught in every treatise are Pythagorean.
For unaccompanied chant it is simply *correct* — melodic fifths and fourths
are perfect, the narrow limma gives half-steps a keen, leading quality, and
the wide third never has to serve as a consonance. tonus makes it the
default for the same reason the Middle Ages did.

```js
tonus.temperamentum(); // pythagorean, A4 = 440
```

### `"meantone"` — the Renaissance compromise

Quarter-comma meantone (`comma: "1/4"`, the default) narrows every fifth by
¼ syntonic comma so that four of them stack to a **pure major third** (5/4).
Fifths beat gently (~697 ¢ instead of 702 ¢); most thirds are perfect;
and somewhere around G♯–E♭ lurks the *wolf* — the leftover fifth, wide by
~36 ¢, that gave the system its keyboard limits.

Historically this is the sound of the 16th–17th century organ and the
polyphonic choir. For tonus it matters when you want chant heard as the
Renaissance heard it — or accompanied. `comma` accepts other fractions
(`"1/3"` gives pure minor thirds, `"1/6"` leans toward the baroque
well-temperaments).

```js
tonus.temperamentum({ tuning: "meantone", comma: "1/4" });
```

### The three Ptolemaic diatonics — antiquity's just intonations

Ptolemy (*Harmonics* I.15–16, 2nd c.) catalogued tetrachord divisions by
their ratio "shades" (χρόαι). tonus implements his three diatonics, which
between them cover just, septimal, and neutral intonation:

- **`"ptolemy-intense"`** (*syntonon*) — the tense diatonic: tetrachord
  steps 9/8 · 10/9 · 16/15. This is **classical just intonation**: pure
  major thirds (5/4), pure minor thirds (6/5), and two sizes of whole tone.
  Renaissance theorists (Zarlino) later canonized exactly this division as
  the "natural" scale. Choose it when you want maximally consonant vertical
  sonorities — including coherence with the Ptolemy doctrina in
  [`harmonia`](../api/heavens.md).
- **`"ptolemy-soft"`** (*malakon*) — the soft diatonic: 8/7 · 10/9 · 21/20.
  Septimal — the 7th harmonic enters, giving a large, relaxed whole tone
  (8/7, ~231 ¢) and a distinctive dark color foreign to the later Western
  canon.
- **`"ptolemy-equable"`** (*homalon*) — the equable diatonic:
  10/9 · 11/10 · 12/11. Undecimal — nearly equal steps around ~150–182 ¢,
  producing *neutral* seconds and thirds (between major and minor). Its
  sound-world is closer to some Near-Eastern practice than to anything in
  the Latin tradition; Ptolemy himself presents it as an outlier.

```js
tonus.temperamentum({ tuning: "ptolemy-intense" });
```

### `"equal"` — the modern baseline

Twelve identical semitones of 100 ¢; every fifth 2 ¢ narrow, every major
third 14 ¢ wide, nothing pure, nothing unusable. Anachronistic for chant by
some seven centuries, but indispensable as a reference point and for
interoperating with modern instruments and MIDI defaults.

```js
tonus.temperamentum({ tuning: "equal", a4: 415 }); // equal at baroque pitch
```

### Custom scales and Scala files

Any 7- or 12-step scale can be supplied as ratios or cents, or as a
[Scala `.scl`](https://www.huygens-fokker.org/scala/scl_format.html) file —
the standard exchange format of the microtonal community, giving access to
thousands of historical and experimental tunings.

```js
tonus.temperamentum({ scale: ["1/1", "9/8", "5/4", "4/3", "3/2", "5/3", "15/8"] });
tonus.temperamentum({ scale: sclFileString }); // name taken from the file
```

## The scale degrees compared

Cents from the root, C-major degrees:

| Degree | Pythagorean | ¼-comma meantone | Ptolemy intense | Equal |
| --- | --- | --- | --- | --- |
| C | 0 | 0 | 0 | 0 |
| D | 204 | 193 | 204 | 200 |
| E | 408 | 386 | 386 | 400 |
| F | 498 | 503 | 498 | 500 |
| G | 702 | 697 | 702 | 700 |
| A | 906 | 890 | 884 | 900 |
| B | 1110 | 1083 | 1088 | 1100 |

Read the E column: 408 (bright Pythagorean ditone) → 386 (pure 5/4, both
meantone and Ptolemy) → 400 (the equal-tempered average). That one number
is most of Western tuning history.

## Choosing

| You want… | Use |
| --- | --- |
| Chant as the medieval theorists tuned it | `"pythagorean"` (default) |
| Chant with Renaissance-era accompaniment | `"meantone"` |
| Maximal vertical consonance / harmonia coherence | `"ptolemy-intense"` |
| Septimal or neutral-interval color | `"ptolemy-soft"` / `"ptolemy-equable"` |
| Modern-instrument interop | `"equal"` |
| Anything else | `scale:` with ratios, cents, or a Scala file |

## Sources

- Boethius, *De institutione musica* — the medieval transmission of
  Pythagorean interval math.
- Ptolemy, *Harmonics* I.15–16 — the diatonic shades.
- J. Murray Barbour, *Tuning and Temperament: A Historical Survey* (1951) —
  the standard survey of the meantone and equal-temperament transitions.
- Scala scale archive, Huygens-Fokker Foundation.

See also [doctrines.md](doctrines.md) for the planetary-scale derivations,
which use the same Pythagorean interval arithmetic.
