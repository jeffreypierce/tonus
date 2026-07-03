# Heavens — `tonus.caelum` · `tonus.harmonia`

Two layers, deliberately paired: an accurate ephemeris (JPL Keplerian
elements, Standish 1992/DE430, 3000 BC – 3000 AD) heard through the
historical doctrines of the harmony of the spheres. The doctrina
derivations are worked in full in [Theory & Context](#theory--context)
below.

## `tonus.caelum(query?) -> Cosmos | Cosmos[]`

Planetary ephemeris. Returns a sky snapshot with positional data for the
classical solar-system bodies and angular aspects between them: heliocentric
and geocentric positions, apparent magnitude, phase, elongation, zodiac
sign, and speed.

Single moment (returns `Cosmos`):

```js
tonus.caelum(); // now
tonus.caelum({ date: new Date("2026-12-25") });
tonus.caelum({ feast: feasts[0] });
tonus.caelum({ bodies: ["Sun", "Moon", "Jupiter"] });
```

Time range (returns `Cosmos[]`):

```js
tonus.caelum({ from: new Date("2026-12-25"), to: new Date("2026-12-31") });
tonus.caelum({ from: jan1, to: dec31, step: 7 }); // weekly snapshots
```

**Return type:** `Cosmos` for single-moment queries, `Cosmos[]` for ranges —
TypeScript narrows automatically on the presence of `from`/`to`.

**Range semantics:** snapshots at `from.getTime() + n * step * 86400000 ms`
while `<= to.getTime()`. Throws if `to < from`, `step <= 0`, or the range
would produce more than 10,000 frames.

When `bodies` is omitted, all 8 are returned. Aspects are computed only
between requested bodies. When `feast` is provided, its date is used
(an explicit `date` takes precedence).

```ts
interface CosmosQuery {
  date?: Date;
  feast?: Feast;
  from?: Date;
  to?: Date;
  step?: number;      // days, default 1
  bodies?: BodyName[];
  orbLimit?: number;  // max orb for aspect detection, degrees (default 8)
}

type BodyName =
  | "Sun" | "Moon" | "Mercury" | "Venus"
  | "Earth" | "Mars" | "Jupiter" | "Saturn";

interface Cosmos {
  date: Date;
  bodies: Body[];
  aspects: Aspect[];
}

interface Body {
  name: BodyName;
  nomen: string;   // Latin name ("Sol", "Luna", "Iuppiter", …)
  symbol: string;  // Unicode symbol ("☉", "☾", "♃", …)
  helio: HelioPos;
  geo: GeoPos;
  speed: number;      // deg/day (negative = retrograde)
  retrograde: boolean;
  magnitude: number;
  elongation: number; // deg from Sun (geocentric)
  phase: number;      // 0–1 illuminated fraction
  apparentDiameter: number | { equ: number; pol: number }; // arcsec
  zodiac: number;     // sign 0–11 (Aries=0 … Pisces=11)
  sign: string;       // "Aries", "Taurus", …
  distEarthRadii?: number; // Moon only
}

interface HelioPos {
  lon: number;  // ecliptic longitude, deg (0–360)
  lat: number;  // ecliptic latitude, deg
  dist: number; // distance from Sun, AU
}

interface GeoPos {
  lon: number;
  lat: number;
  dist: number;
  equatorial: {
    ra: number;  // right ascension, deg
    dec: number; // declination, deg
    dist: number;
  };
}
```

### Aspect

Aspects are pure geometric data — angular relationships between geocentric
body longitudes. Five classical aspects are detected: conjunction (0°),
sextile (60°), square (90°), trine (120°), opposition (180°). Strength is a
linear falloff from 1 (exact) to 0 (at the orb limit).

```ts
interface Aspect {
  type: "conjunction" | "opposition" | "trine" | "square" | "sextile";
  bodies: [string, string];
  angle: number;    // exact separation, deg
  orb: number;      // degrees from exact aspect angle
  strength: number; // 0–1
}
```

## `tonus.harmonia(cosmos, opts?) -> Harmony`

Voices the sky through a planetary-harmony doctrina. Pure data — no methods.
Every voiced body carries a Greek planetary vowel; every aspect's interval
carries a consonance classification.

```js
const sky = tonus.caelum();
tonus.harmonia(sky);                          // Boethius + pythagorean default
tonus.harmonia(sky, { doctrina: "ptolemy" }); // Ptolemy doctrine
tonus.harmonia(sky, { temperamentum: tonus.temperamentum("ptolemy-intense") });

// Time-range analysis with per-cosmos frames
const range = tonus.caelum({ from, to });
const h = tonus.harmonia(range); // h.frames is populated
```

```ts
interface HarmoniaOpts {
  temperamentum?: Temperamentum; // default: pythagorean A440
  doctrina?: Author;             // default: "boethius"
}

type Author = "pythagoras" | "boethius" | "pliny" | "ptolemy";
```

**Doctrines** (derivations in [Theory & Context](#theory--context)):

| Author | Source | Span | Notable |
| --- | --- | --- | --- |
| `"pythagoras"` | via Plato, *Republic* X | 1 octave | Disjunct diatonic tetrachords (B durum); includes Fixed Stars |
| `"boethius"` | *De institutione musica* | major 7th | Conjunct diatonic tetrachords (B molle); medieval default |
| `"pliny"` | *Naturalis historia* II.xx | 1 octave | Chromatic Dorian (distance-based); Earth = proslambanomenos |
| `"ptolemy"` | *Harmonics* III | 2 octaves | Fixed tones of the Greater Perfect System |

Sphere pitches are computed directly from the doctrina's pure ratios
(anchored at the temperamentum's A4), so historical coherence holds:
`temperamentum("ptolemy-intense")` + `harmonia({ doctrina: "ptolemy" })`
gives pure Ptolemaic intervals throughout — Sun→Jupiter a pure 3/2,
Sun→Saturn a pure 2/1. The temperamentum's scale governs pitch naming and
the imprint.

```ts
interface Harmony {
  doctrina: Author;
  doctrinaName: string; // "Anicius Manlius Severinus Boethius"
  date: Date;           // first cosmos's date
  bodies: VoicedBody[];
  aspects: VoicedAspect[];
  frames?: Frame[];     // only when input was an array of cosmos

  tabula: HarmonyTabulaRow[]; // flat iterable view
  imprint: Imprint;           // shared analytical fingerprint — see score.md
}

interface VoicedPitch {
  pitch: Pitch;
  performance: Performance;
}

interface VoicedBody extends Body {
  nota: VoicedPitch;
  presence: number;  // 0–1 (visibility + brightness)
  motion: number;    // 0–1 (normalized speed)
  greekName: string; // position in the Greek tonal system
  vowel: PlanetVowel;
}

interface VoicedAspect extends Aspect {
  interval: Interval; // carries consonance classification
}

interface Frame {
  date: Date;
  bodies: VoicedBody[];
  aspects: VoicedAspect[];
}
```

Each `VoicedBody` has a `nota` (velocity scaled by the body's presence) and
a `vowel`. Aspects receive an `interval` whose consonance is classified
P1/P5/P8 → perfect, m3/M3/m6/M6 → imperfect, else → dissonant.

Bodies not mapped in `PLANET_VOWELS` (Earth, Fixed Stars) are **not**
voiced; Pliny's Earth-as-proslambanomenos is dropped in v1 as a consequence.

### Planetary vowels

Each classical planet maps to one of the seven Greek vowels. Source: Godwin,
*The Mystery of the Seven Vowels* (1991), drawing on Porphyry, Marcus
Gnosticus, Demetrius, Nicomachus, Eusebius, and Barthélemy of Edessa. The
Moon→Saturn ordering follows Nicomachus (*Excerpta ex Nicomacho* 6).

| Body | Greek | Name | Phonetic |
| --- | --- | --- | --- |
| Moon | Α / α | Alpha | a |
| Mercury | Ε / ε | Epsilon | e |
| Venus | Η / η | Eta | e |
| Sun | Ι / ι | Iota | i |
| Mars | Ο / ο | Omicron | o |
| Jupiter | Υ / υ | Upsilon | u |
| Saturn | Ω / ω | Omega | o |

```ts
interface PlanetVowel {
  greek: string;      // "Α"
  greekLower: string; // "α"
  name: string;       // "Alpha"
  modern: string;     // "A"
  phonetic: "a" | "e" | "i" | "o" | "u";
  ipa: string;
}
```

### Tabula

`harmony.tabula` — one row per voiced body, the flat iteration surface
(chant scores expose the same idea per note; see
[score.md](score.md#tabula)).

```ts
interface HarmonyTabulaRow {
  bodyIndex: number;
  name: BodyName;
  nomen: string;
  greekName: string;

  midi: number;
  pc: number;
  oct: number;
  spn: string;
  hz: number;

  presence: number; // 0–1
  motion: number;   // 0–1
  velocity: number; // 0–127 MIDI byte

  vowelGreek: string;
  vowelPhonetic: string;
  vowelName: string;

  zodiac: number; // 0–11
  sign: string;
  retrograde: boolean;
  elongation: number; // deg from Sun
  magnitude: number;

  aspectCount: number; // aspects this body participates in
}
```

## Theory & Context

The planetary ratio data in `engines/harmonia/data/doctrines.ts` is
reconstructed from primary and secondary source texts: each author's system
is expressed as Pythagorean ratios relative to the mese (Sun) and verified
computationally for internal consistency — correct interval closure, octave
completion, and cents values. The full derivations follow.

### Source texts

Four books by Joscelyn Godwin provided the primary and secondary source
material:

1. **Godwin, _Harmonies of Heaven and Earth_ (1987)** — Part Three ("The
   Music of the Spheres") contains the critical taxonomy of planetary scale
   types (A, B, C) and Godwin's own synthetic analysis. This was the primary
   guide for understanding each system's logic and structural intent.
   Chapters consulted: §2 (Type A), §4 (Type B), §6 (Type C), §7
   (Eriugena/Anselmi), §8 (Kepler).

2. **Godwin, _The Harmony of the Spheres_ (1993)** — A sourcebook of 52
   primary source translations from Plato through the 19th century. This
   provided direct access to the words of Boethius, Nicomachus, Pliny,
   Ptolemy, and others in English translation. Used to verify specific
   ratio claims and Greek tone-name assignments.

### General method

For each author:

1. **Identify the system type** from Godwin's taxonomy (A, B, or C).
2. **Determine the structural framework**: which Greek tonal system is
   being used (conjunct tetrachords, disjunct tetrachords, Greater Perfect
   System), and what span is covered.
3. **Map bodies to Greek tone-names** using the source text's explicit
   assignments.
4. **Derive ratios** from the Greek tone-names using standard Pythagorean
   interval arithmetic:
   - Whole tone (T) = 9:8
   - Pythagorean semitone / leimma (S) = 256:243
   - Perfect fourth (P4) = 4:3
   - Perfect fifth (P5) = 3:2
   - Octave (P8) = 2:1
   - Chromatic incomposite = 19683:16384 (completes a chromatic tetrachord
     to a P4)
5. **Normalize** all ratios relative to the mese (Sun = 1:1), expressing
   pitches below as ratios less than 1 and above as ratios greater than 1.
6. **Verify** computationally: check that the total span matches the
   expected value (seventh, octave, or two octaves) and that each interval
   step produces the correct cent value.

The same Pythagorean interval arithmetic is laid out from the tuning side
in [tuning.md](tuning.md#theory--context).

### Pythagoras

**Source**: Attributed to the Pythagorean school. Primary transmission via
Nicomachus of Gerasa (_Manual of Harmonics_, c. 100 AD) and Plato
(_Republic_ X, 617b, the Myth of Er). Godwin discusses this in _Harmonies
of Heaven and Earth_ §4 (Type B scales) and _Harmony of the Spheres_ Ch. 3
(Nicomachus).

**System**: Two disjunct diatonic tetrachords plus one added tone, spanning
an octave. This is the standard Pythagorean diatonic system: the tetrachord
meson and tetrachord diezeugmenon are separated by a tone of disjunction at
the mese.

**Tetrachord structure** (ascending): S, T, T — each tetrachord spans a
perfect fourth.

**Derivation**:

Starting from mese (Sun = 1/1) and building outward:

Below the mese (descending through tetrachord meson):

- Mars = 1 step below (T) = 8/9
- Jupiter = 2 steps below (T + T) = 64/81
- Saturn = 3 steps below (T + T + S) = 64/81 × 243/256 = 3/4

Above the mese (ascending: tone of disjunction, then tetrachord
diezeugmenon):

- Venus = 1 step above (T, disjunction) = 9/8
- Mercury = 2 steps above (T + S) = 9/8 × 256/243 = 32/27
- Moon = 3 steps above (T + S + T) = 32/27 × 9/8 = 4/3
- Fixed Stars = 4 steps above (T + S + T + T) = 4/3 × 9/8 = 3/2

**Verification**:

- Saturn to Fixed Stars: (3/2) / (3/4) = 2/1 = octave ✓
- Total span: 1200.00 cents ✓
- Venus at 9/8 = B natural (paramese) — this is the disjunct / B durum
  form ✓

**Note**: The Fixed Stars are included as an eighth voice in the doctrina
data (`FixedStars`, ratio 3/2, nete diezeugmenon). The `caelum` engine has
no Fixed Stars `Body`, and `FixedStars` has no classical vowel mapping, so
the voice completes the octave structure in the data but is never voiced
by `harmonia` (see the note under [`tonus.harmonia`](#tonusharmoniacosmos-opts---harmony)).

### Boethius

**Source**: Boethius, _De Institutione Musica_ I.27 (c. 524 AD),
transmitting Nicomachus of Gerasa. Godwin discusses this in _Harmonies of
Heaven and Earth_ §4 and provides the scale in Example 3 of Part Three.

**System**: Two conjunct diatonic tetrachords spanning a seventh. The
tetrachord meson and tetrachord synemmenon share the mese as their junction
point. No tone of disjunction — the tetrachords are joined.

**Tetrachord structure** (ascending): S, T, T — same intervals as
Pythagoras, but the upper tetrachord begins a semitone above the mese
instead of a tone.

**Derivation**:

Below the mese (identical to Pythagoras — same tetrachord meson):

- Mars = 8/9
- Jupiter = 64/81
- Saturn = 3/4

Above the mese (tetrachord synemmenon, conjunct):

- Venus = 1 step above (S) = 256/243
- Mercury = 2 steps above (S + T) = 256/243 × 9/8 = 32/27
- Moon = 3 steps above (S + T + T) = 32/27 × 9/8 = 4/3

**Verification**:

- Saturn to Moon: (4/3) / (3/4) = 16/9. Cents: 996.09 = minor seventh ✓
- Venus at 256/243 = Bb (trite synemmenon) — this is the conjunct /
  B molle form ✓
- No octave closure — span is a seventh, not an octave. This is correct
  and expected.

**Critical distinction from Pythagoras**: The only difference is Venus.
Pythagoras Venus = 9/8 (whole tone above Sun). Boethius Venus = 256/243
(semitone above Sun). This single pitch is the difference between the
disjunct and conjunct systems — the origin of the B durum / B molle
distinction that runs through all of medieval music theory.

### Pliny

**Source**: Pliny the Elder, _Naturalis Historia_ II.xx (c. 77 AD). Godwin
discusses this in _Harmonies of Heaven and Earth_ §2 (Type A scales) and
provides the scale in Example 1 of Part Three. The corrected version
follows Censorinus and Theon of Smyrna (octave closure), with Reinach's
hypothesis about the enharmonic-to-chromatic transcription error noted but
not applied.

**System**: Chromatic Dorian, Type A (distance-based). Two conjunct
chromatic tetrachords plus a proslambanomenos (added tone at the bottom).
Nine tones spanning one octave.

**Chromatic tetrachord structure** (ascending): S, S, incomposite — where
S = 256/243 (Pythagorean semitone) and the incomposite completes the
tetrachord to a perfect fourth.

**Incomposite interval derivation**:
A perfect fourth (4/3) minus two semitones (256/243 each):
(4/3) / (256/243)² = (4/3) × (243/256)² = (4 × 59049) / (3 × 65536) =
236196 / 196608 = 19683/16384

Verification: 19683/16384 = 1.201355... → 317.60 cents. Two semitones =
180.45 cents. Total: 180.45 + 317.60 = 498.04 cents = perfect fourth ✓

**Derivation**:

The intervals between adjacent spheres, ascending from Earth:

- Earth to Moon: T (9/8)
- Moon to Mercury: S (256/243)
- Mercury to Venus: S (256/243)
- Venus to Sun: incomposite (19683/16384)
- Sun to Mars: S (256/243)
- Mars to Jupiter: S (256/243)
- Jupiter to Saturn: incomposite (19683/16384)

Expressed as ratios from Sun (= 1/1):

- Earth = 1 / (19683/16384 × 256/243 × 256/243 × 9/8) = 2/3
- Moon = 1 / (19683/16384 × 256/243 × 256/243) = 3/4
- Mercury = 1 / (19683/16384 × 256/243) = 64/81
- Venus = 1 / (19683/16384) = 16384/19683
- Sun = 1/1
- Mars = 256/243
- Jupiter = 256/243 × 256/243 = 65536/59049
- Saturn = 256/243 × 256/243 × 19683/16384 = 4/3

**Verification**:

- Earth to Saturn: (4/3) / (2/3) = 2/1 = octave ✓
- Total span: 1200.00 cents ✓
- Sun sits at hypate meson, not at the Greek "mese" position — Sun is at
  the junction of the two tetrachords, structurally central but with a
  different Greek name ✓
- Saturn reaches mese — the highest planet gets the structural center of
  the Greek system ✓

**Note on Earth and boundary tones**: Pliny's system includes Earth as the
proslambanomenos (lowest added tone). This is unique among the four v1
authors — all others exclude Earth from the voiced bodies. Earth has no
classical vowel mapping, so it is not voiced in v1; Pliny's
Earth-as-proslambanomenos is dropped as a consequence (see the note under
[`tonus.harmonia`](#tonusharmoniacosmos-opts---harmony)).

### Ptolemy

**Source**: Ptolemy, _Harmonics_ III (fragmentary final chapter, c. 150 AD)
and the Canobus inscription recording Ptolemy's mathematical principles.
Godwin discusses this in _Harmonies of Heaven and Earth_ §6 (Type C scales)
and provides the scale in Example 5 of Part Three. Cross-referenced with
the proportional numbers from the Canobus inscription as reported by
Godwin.

**System**: Fixed tones of the Greater Perfect System, Type C. The planets
map to the seven immovable boundary tones that remain constant regardless
of whether the movable tones between them are tuned in diatonic, chromatic,
or enharmonic genus. Two-octave span.

**The Greater Perfect System fixed tones** (ascending):

- proslambanomenos (A)
- hypate hypaton (B)
- hypate meson (E)
- mese (A')
- paramese (B')
- nete diezeugmenon (E')
- nete hyperbolaion (A'')

These are connected by perfect fourths and fifths — the structural skeleton
of all Greek music.

**Derivation**:

From mese (Sun = 1/1):

- Moon = proslambanomenos = one octave below = 1/2
- Mercury = hypate hypaton = whole tone above proslambanomenos =
  1/2 × 9/8 = 9/16
- Venus = hypate meson = perfect fourth below mese = 3/4
- Sun = mese = 1/1
- Mars = paramese = whole tone above mese = 9/8
- Jupiter = nete diezeugmenon = perfect fifth above mese = 3/2
- Saturn = nete hyperbolaion = octave above mese = 2/1

**Verification**:

- Moon to Saturn: (2/1) / (1/2) = 4/1 = two octaves ✓
- Total span: 2400.00 cents ✓
- All intervals from mese are standard Pythagorean consonances or the
  whole tone:
  - Saturn: octave (1200c) ✓
  - Jupiter: fifth (702c) ✓
  - Mars: whole tone (204c) ✓
  - Venus: fourth below (-498c) ✓
  - Mercury: minor seventh below (-996c) ✓
  - Moon: octave below (-1200c) ✓

**Aspect-consonance mapping** (unique to Ptolemy):
The intervals between specific planet pairs reflect astrological
compatibility:

- Saturn–Sun = octave (consonant) → astrological tradition: Saturn's
  influence is not inherently hostile to the Sun
- Jupiter–Sun = fifth (perfect consonance) → Jupiter is the "greater
  benefic"
- Mars–Sun = tone (dissonant) → Mars is the "lesser malefic"
- Venus–Sun = fourth (consonance) → Venus is the "lesser benefic"
- Mercury–Sun = seventh (dissonant) → Mercury is ambivalent, traditionally
  takes on the nature of its companions

This mapping is documented in the data file but not encoded as ratios — it
emerges from the ratios themselves when intervals are computed between
voiced bodies.

### Computational verification

All ratios were verified with plain arithmetic before the data file was
written:

1. Each body's ratio computed as a decimal
2. Specific ratios verified against known Pythagorean fractions (e.g.,
   3/4, 64/81, 256/243)
3. Cents value for each body relative to the mese: `1200 × log₂(ratio)`
4. Total span in cents verified against the expected value
5. For Pliny, two semitones plus the incomposite interval verified to sum
   to a perfect fourth
6. For Pythagoras, octave closure verified (Saturn to Fixed Stars =
   exactly 2:1)
7. For Boethius, the span verified as a minor seventh (996 cents), not an
   octave

No external tools or libraries — pure arithmetic on the ratio pairs.

### Decisions and ambiguities

**Boethius vs Nicomachus**: Boethius transmits Nicomachus's system. The
data file is attributed to Boethius because he is the medieval authority
and the name users will reach for. The source text field acknowledges the
Nicomachean origin.

**Pliny's octave closure**: The original Pliny (as reported by later Latin
writers) may not close at the octave. Censorinus and Theon of Smyrna
provide the corrected version that does. Reinach further hypothesized that
the original was in the enharmonic genus (with quarter-tones) and was
mistranscribed into the chromatic genus. We use the corrected chromatic
form as the most widely cited version and the one Godwin presents as
standard.

**Pliny's mese position**: In Pliny's system, the Sun sits at "hypate
meson" — the boundary between the two tetrachords — not at the Greek "mese"
(which falls on Saturn). The `mese` field on the `AuthorSystem` interface
is set to `"Sun"` regardless, because the Sun is the _structural_ center of
the system for the purposes of the harmonia engine (the body around which
presence and influence are measured). The `greekName` field on each voice
preserves the actual Greek position.

**Ptolemy's fixed tones**: Multiple manuscript traditions give slightly
different assignments. We follow the version presented in Godwin's
_Harmonies of Heaven and Earth_ §6, which matches the Canobus inscription's
proportional numbers when read as frequency ratios (not string-lengths).
Carl von Jan's emendation (reading as string-lengths and reversing)
produces the same intervals in reverse order; Anatolius's inversion is
noted but not used.

**Pythagoras's Fixed Stars**: The eighth voice is present in the doctrina
data as `FixedStars` (ratio 3/2), preserving the octave structure of the
source system. Because the `caelum` engine has no Fixed Stars `Body` and no
classical vowel maps to it, `harmonia` leaves it unvoiced — the structural
tone exists in the data, not in the sounding output.

**Voice ordering**: The `voices` array is ordered by sphere (outermost
first), not by pitch. For Boethius and Pythagoras, sphere order happens to
equal descending pitch order (Saturn is lowest, Moon is highest). For
Ptolemy, sphere order is Saturn (highest pitch) first, then descending. For
Pliny, sphere order starts with Saturn and descends to Earth. The engine
sorts by ratio for scale views.

## Sources

- Godwin, Joscelyn. *Harmonies of Heaven and Earth: The Spiritual Dimension
  of Music from Antiquity to the Avant-Garde*. London: Thames & Hudson,
  1987 — planetary scale taxonomy (Types A/B/C) and per-author analyses.
- Godwin, Joscelyn, ed. *The Harmony of the Spheres: A Sourcebook of the
  Pythagorean Tradition in Music*. Rochester, VT: Inner Traditions, 1993 —
  primary-source translations used to verify ratio and tone-name claims.
- Godwin, Joscelyn. *The Mystery of the Seven Vowels in Theory and
  Practice*. Grand Rapids: Phanes Press, 1991 — planetary vowel
  attestations; Moon→Saturn vowel order after Nicomachus.
- Boethius. *De institutione musica* I.27 (c. 524) — conjunct diatonic
  planetary scale, transmitting Nicomachus; the medieval standard.
- Nicomachus of Gerasa. *Manual of Harmonics* (c. 100) and *Excerpta ex
  Nicomacho* — planetary tone assignments and vowel order.
- Plato. *Republic* X, 617b (Myth of Er) — the Sirens of the spheres.
- Pliny the Elder. *Naturalis historia* II.xx (c. 77) — distance-based
  chromatic planetary scale; octave closure per Censorinus and Theon of
  Smyrna.
- Ptolemy. *Harmonics* III and the Canobic Inscription (c. 150) — Greater
  Perfect System tone assignments and aspect–consonance mapping.
- Vowel–planet attestations: Porphyry, Marcus Gnosticus, Demetrius of
  Phaleron, Eusebius of Caesarea, Barthélemy of Edessa (via Godwin 1991).
- Standish, E. M. "Keplerian Elements for Approximate Positions of the
  Major Planets." JPL Solar System Dynamics, 1992 (updated for DE430).
  <https://ssd.jpl.nasa.gov/planets/approx_pos.html>.
