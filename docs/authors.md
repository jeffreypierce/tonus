# doctrines.ts — Derivation Methodology

## Overview

This document describes the sources, reasoning, and verification methods used to derive the planetary ratio data in `engines/harmonia/data/doctrines.ts`. Each author's system was reconstructed from primary and secondary source texts, expressed as Pythagorean ratios relative to the mese (Sun), and verified computationally for internal consistency (correct interval closure, octave completion, and cents values).

---

## Source Texts

Four books by Joscelyn Godwin provided the primary and secondary source material:

1. **Godwin, _Harmonies of Heaven and Earth_ (1987)** — Part Three ("The Music of the Spheres") contains the critical taxonomy of planetary scale types (A, B, C) and Godwin's own synthetic analysis. This was the primary guide for understanding each system's logic and structural intent. Chapters consulted: §2 (Type A), §4 (Type B), §6 (Type C), §7 (Eriugena/Anselmi), §8 (Kepler). The EPUB was extracted and the full text of Part Three was read and cross-referenced.

2. **Godwin, _The Harmony of the Spheres_ (1993)** — A sourcebook of 52 primary source translations from Plato through the 19th century. This provided direct access to the words of Boethius, Nicomachus, Pliny, Ptolemy, and others in English translation. Used to verify specific ratio claims and Greek tone-name assignments.

---

## General Method

For each author:

1. **Identify the system type** from Godwin's taxonomy (A, B, or C).
2. **Determine the structural framework**: which Greek tonal system is being used (conjunct tetrachords, disjunct tetrachords, Greater Perfect System), and what span is covered.
3. **Map bodies to Greek tone-names** using the source text's explicit assignments.
4. **Derive ratios** from the Greek tone-names using standard Pythagorean interval arithmetic:
   - Whole tone (T) = 9:8
   - Pythagorean semitone / leimma (S) = 256:243
   - Perfect fourth (P4) = 4:3
   - Perfect fifth (P5) = 3:2
   - Octave (P8) = 2:1
   - Chromatic incomposite = 19683:16384 (completes a chromatic tetrachord to a P4)
5. **Normalize** all ratios relative to the mese (Sun = 1:1), expressing pitches below as ratios less than 1 and above as ratios greater than 1.
6. **Verify** computationally: check that the total span matches the expected value (seventh, octave, or two octaves) and that each interval step produces the correct cent value.

---

## Per-Author Derivation

### Pythagoras

**Source**: Attributed to the Pythagorean school. Primary transmission via Nicomachus of Gerasa (_Manual of Harmonics_, c. 100 AD) and Plato (_Republic_ X, 617b, the Myth of Er). Godwin discusses this in _Harmonies of Heaven and Earth_ §4 (Type B scales) and _Harmony of the Spheres_ Ch. 3 (Nicomachus).

**System**: Two disjunct diatonic tetrachords plus one added tone, spanning an octave. This is the standard Pythagorean diatonic system: the tetrachord meson and tetrachord diezeugmenon are separated by a tone of disjunction at the mese.

**Tetrachord structure** (ascending): S, T, T — each tetrachord spans a perfect fourth.

**Derivation**:

Starting from mese (Sun = 1/1) and building outward:

Below the mese (descending through tetrachord meson):

- Mars = 1 step below (T) = 8/9
- Jupiter = 2 steps below (T + T) = 64/81
- Saturn = 3 steps below (T + T + S) = 64/81 × 243/256 = 3/4

Above the mese (ascending: tone of disjunction, then tetrachord diezeugmenon):

- Venus = 1 step above (T, disjunction) = 9/8
- Mercury = 2 steps above (T + S) = 9/8 × 256/243 = 32/27
- Moon = 3 steps above (T + S + T) = 32/27 × 9/8 = 4/3
- Fixed Stars = 4 steps above (T + S + T + T) = 4/3 × 9/8 = 3/2

**Verification**:

- Saturn to Fixed Stars: (3/2) / (3/4) = 2/1 = octave ✓
- Total span: 1200.00 cents ✓
- Venus at 9/8 = B natural (paramese) — this is the disjunct / B durum form ✓

**Note**: The Fixed Stars are included as an eighth voice. In the `caelum` engine, there is no "Fixed Stars" body — this voice will need either a synthetic body or a fixed boundary treatment.

---

### Boethius

**Source**: Boethius, _De Institutione Musica_ I.27 (c. 524 AD), transmitting Nicomachus of Gerasa. Godwin discusses this in _Harmonies of Heaven and Earth_ §4 and provides the scale in Example 3 of Part Three.

**System**: Two conjunct diatonic tetrachords spanning a seventh. The tetrachord meson and tetrachord synemmenon share the mese as their junction point. No tone of disjunction — the tetrachords are joined.

**Tetrachord structure** (ascending): S, T, T — same intervals as Pythagoras, but the upper tetrachord begins a semitone above the mese instead of a tone.

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
- Venus at 256/243 = Bb (trite synemmenon) — this is the conjunct / B molle form ✓
- No octave closure — span is a seventh, not an octave. This is correct and expected.

**Critical distinction from Pythagoras**: The only difference is Venus. Pythagoras Venus = 9/8 (whole tone above Sun). Boethius Venus = 256/243 (semitone above Sun). This single pitch is the difference between the disjunct and conjunct systems — the origin of the B durum / B molle distinction that runs through all of medieval music theory.

---

### Pliny

**Source**: Pliny the Elder, _Naturalis Historia_ II.xx (c. 77 AD). Godwin discusses this in _Harmonies of Heaven and Earth_ §2 (Type A scales) and provides the scale in Example 1 of Part Three. The corrected version follows Censorinus and Theon of Smyrna (octave closure), with Reinach's hypothesis about the enharmonic-to-chromatic transcription error noted but not applied.

**System**: Chromatic Dorian, Type A (distance-based). Two conjunct chromatic tetrachords plus a proslambanomenos (added tone at the bottom). Nine tones spanning one octave.

**Chromatic tetrachord structure** (ascending): S, S, incomposite — where S = 256/243 (Pythagorean semitone) and the incomposite completes the tetrachord to a perfect fourth.

**Incomposite interval derivation**:
A perfect fourth (4/3) minus two semitones (256/243 each):
(4/3) / (256/243)² = (4/3) × (243/256)² = (4 × 59049) / (3 × 65536) = 236196 / 196608 = 19683/16384

Verification: 19683/16384 = 1.201355... → 317.60 cents. Two semitones = 180.45 cents. Total: 180.45 + 317.60 = 498.04 cents = perfect fourth ✓

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
- Sun sits at hypate meson, not at the Greek "mese" position — Sun is at the junction of the two tetrachords, structurally central but with a different Greek name ✓
- Saturn reaches mese — the highest planet gets the structural center of the Greek system ✓

**Note on Earth and boundary tones**: Pliny's system includes Earth as the proslambanomenos (lowest added tone). This is unique among the four v1 authors — all others exclude Earth from the voiced bodies. In the `caelum` engine, Earth has placeholder appearance values (magnitude 0, elongation 0). The harmonia engine will need to assign Earth a fixed presence of 1 and motion of 0 as a boundary tone.

---

### Ptolemy

**Source**: Ptolemy, _Harmonics_ III (fragmentary final chapter, c. 150 AD) and the Canobus inscription recording Ptolemy's mathematical principles. Godwin discusses this in _Harmonies of Heaven and Earth_ §6 (Type C scales) and provides the scale in Example 5 of Part Three. Cross-referenced with the proportional numbers from the Canobus inscription as reported by Godwin.

**System**: Fixed tones of the Greater Perfect System, Type C. The planets map to the seven immovable boundary tones that remain constant regardless of whether the movable tones between them are tuned in diatonic, chromatic, or enharmonic genus. Two-octave span.

**The Greater Perfect System fixed tones** (ascending):

- proslambanomenos (A)
- hypate hypaton (B)
- hypate meson (E)
- mese (A')
- paramese (B')
- nete diezeugmenon (E')
- nete hyperbolaion (A'')

These are connected by perfect fourths and fifths — the structural skeleton of all Greek music.

**Derivation**:

From mese (Sun = 1/1):

- Moon = proslambanomenos = one octave below = 1/2
- Mercury = hypate hypaton = whole tone above proslambanomenos = 1/2 × 9/8 = 9/16
- Venus = hypate meson = perfect fourth below mese = 3/4
- Sun = mese = 1/1
- Mars = paramese = whole tone above mese = 9/8
- Jupiter = nete diezeugmenon = perfect fifth above mese = 3/2
- Saturn = nete hyperbolaion = octave above mese = 2/1

**Verification**:

- Moon to Saturn: (2/1) / (1/2) = 4/1 = two octaves ✓
- Total span: 2400.00 cents ✓
- All intervals from mese are standard Pythagorean consonances or the whole tone:
  - Saturn: octave (1200c) ✓
  - Jupiter: fifth (702c) ✓
  - Mars: whole tone (204c) ✓
  - Venus: fourth below (-498c) ✓
  - Mercury: minor seventh below (-996c) ✓
  - Moon: octave below (-1200c) ✓

**Aspect-consonance mapping** (unique to Ptolemy):
The intervals between specific planet pairs reflect astrological compatibility:

- Saturn–Sun = octave (consonant) → astrological tradition: Saturn's influence is not inherently hostile to the Sun
- Jupiter–Sun = fifth (perfect consonance) → Jupiter is the "greater benefic"
- Mars–Sun = tone (dissonant) → Mars is the "lesser malefic"
- Venus–Sun = fourth (consonance) → Venus is the "lesser benefic"
- Mercury–Sun = seventh (dissonant) → Mercury is ambivalent, traditionally takes on the nature of its companions

This mapping is documented in the data file but not encoded as ratios — it emerges from the ratios themselves when intervals are computed between voiced bodies.

---

## Computational Verification

All ratios were verified using Node.js arithmetic before the data file was written. The verification script:

1. Computed each body's ratio as a decimal
2. Verified specific ratios against known Pythagorean fractions (e.g., 3/4, 64/81, 256/243)
3. Computed the cents value for each body relative to the mese: `1200 × log₂(ratio)`
4. Computed the total span in cents and verified against the expected value
5. For Pliny, verified that two semitones plus the incomposite interval sum to a perfect fourth
6. For Pythagoras, verified octave closure (Saturn to Fixed Stars = exactly 2:1)
7. For Boethius, verified the span is a minor seventh (996 cents), not an octave

No external tools or libraries were used — all verification was pure arithmetic on the ratio pairs.

---

## Decisions and Ambiguities

**Boethius vs Nicomachus**: Boethius transmits Nicomachus's system. The data file is attributed to Boethius because he is the medieval authority and the name users will reach for. The source text field acknowledges the Nicomachean origin.

**Pliny's octave closure**: The original Pliny (as reported by later Latin writers) may not close at the octave. Censorinus and Theon of Smyrna provide the corrected version that does. Reinach further hypothesized that the original was in the enharmonic genus (with quarter-tones) and was mistranscribed into the chromatic genus. We use the corrected chromatic form as the most widely cited version and the one Godwin presents as standard.

**Pliny's mese position**: In Pliny's system, the Sun sits at "hypate meson" — the boundary between the two tetrachords — not at the Greek "mese" (which falls on Saturn). The `mese` field on the `AuthorSystem` interface is set to `"Sun"` regardless, because the Sun is the _structural_ center of the system for the purposes of the harmonia engine (the body around which presence and influence are measured). The `greekName` field on each voice preserves the actual Greek position.

**Ptolemy's fixed tones**: Multiple manuscript traditions give slightly different assignments. We follow the version presented in Godwin's _Harmonies of Heaven and Earth_ §6, which matches the Canobus inscription's proportional numbers when read as frequency ratios (not string-lengths). Carl von Jan's emendation (reading as string-lengths and reversing) produces the same intervals in reverse order; Anatolius's inversion is noted in the analysis document but not used.

**Pythagoras's Fixed Stars**: The eighth body (Fixed Stars) has no corresponding `Body` in the `caelum` engine. Implementation options: exclude it (reducing Pythagoras to 7 voices like Boethius), add a synthetic body, or treat it as a fixed boundary tone with no presence/motion data. This decision is deferred to the harmonia engine implementation.

**Voice ordering**: The `voices` array is ordered by sphere (outermost first), not by pitch. For Boethius and Pythagoras, sphere order happens to equal descending pitch order (Saturn is lowest, Moon is highest). For Ptolemy, sphere order is Saturn (highest pitch) first, then descending. For Pliny, sphere order starts with Saturn and descends to Earth. The engine should sort by ratio for scale views.
