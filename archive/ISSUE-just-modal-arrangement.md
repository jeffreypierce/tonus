# ISSUE — Ptolemaic ratios are major-arranged, applied degree-per-degree to every mode

Found 2026-07-02 while probing for docs examples (after fixing the octave-
fold bug in midiToHz, regression-tested in temper.test.mjs).

## The behavior

The Ptolemaic presets store seven cumulative ratios in a major-style
arrangement (`1/1, 9/8, 5/4, 4/3, 3/2, 5/3, 15/8` for intense) and
`expandDiatonicSteps` lays them degree-by-degree onto the current mode's
`scalePcs`. In mode 1 (Dorian, final D) the third degree F therefore gets
5/4 — a pure MAJOR third above the final (F4 = 366.7 Hz) — where Dorian's
third degree is minor (Pythagorean 32/27 ≈ 294¢; the just minor third would
be 6/5 ≈ 316¢). Interval qualities shift like this in every mode whose step
pattern differs from major.

## Why not silently fixed

How a just tetrachord division should be arranged onto each mode's
tone/semitone pattern is a scholarly decision, not a bug fix:

- Option A — rotate the step *sizes* (9/8, 10/9, 16/15 for intense) to
  match each mode's T/S pattern. Which size goes on which T is exactly the
  tetrachord-division question Ptolemy's shades answer; a choice per mode
  must be sourced or declared editorial.
- Option B — keep the current behavior and document it: "the seven degrees
  receive the intense ratios in scale order, regardless of modal quality."
  Defensible as a system, but the third/sixth degrees stop matching their
  modal qualities, and D–F at 5/4 will surprise anyone reading the docs
  against a monochord.
- Option C — arrange the just ratios by *interval quality against the
  final* (minor third degree gets 6/5, major gets 5/4, etc.). Musically
  intuitive; needs a rule for the ambiguous degrees (seconds, sixths,
  sevenths) and a source note.

## Status

**RESOLVED 2026-07-03 — Option A (fixed-gamut / octave-species).**

The genus ratios tune one fixed natural gamut (C D E F G A B), measured from
C; each mode is an octave species read from its final. Implemented by mapping
the 7 preset ratios onto the fixed `NATURAL_PCS = [0,2,4,5,7,9,11]` in
`expandDiatonicSteps` (scale.ts) instead of onto the mode's `scalePcs`; the
existing `normalizeToRoot(rootPc)` then handles the modal rotation. This
aligns the tuning layer with how `gamut.ts` and the modes' `species` field
already treat modes as species of one collection.

Consequences, all intended and now documented in docs/tuning.md:

- Each mode gets its authentic third/seventh quality (Dorian D–F minor,
  Lydian F–A major, Mixolydian G–F ♭7) — no more 5/4 forced on every final.
- The syntonic wolf is preserved: D–A = 40/27 (~680¢), not 3/2. Honest for a
  fixed just intonation; the old per-mode behavior effectively hid it.

Option C (arrange by interval quality against each final) was declined for the
Ptolemy presets: it requires ratios Ptolemy never specified (6/5 minor thirds,
invented answers for ambiguous degrees) and would attribute a modern just
intonation to Ptolemy — a sourcing dishonesty. If wanted later, it belongs as
a separately-named editorial `scale`, not under a Ptolemy tuning.

Tests: rewrote the 6 that encoded the old degree-per-mode behavior to assert
the true invariants (C-relative purity, the D–A wolf, per-mode qualities) and
added a regression guard. Pythagorean/meantone unaffected (built from the
fifth, mode-independent).
