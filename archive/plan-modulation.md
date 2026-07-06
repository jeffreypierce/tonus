# Plan — Modulation detection

**Status: PLAN. Not built.** Branch: `feat/modulation`.

## What it is

Suñol (Solesmes *Textbook*, Part Two Ch. I) makes the point at length: a chant
**modulates constantly** — a "foreign" dominant is introduced that pulls the
melody toward a new tonic/cadence, then it resolves back (or moves on). He works
two examples: *Christus resurgens* (mode 8, modulating internally through mode
3→4) and *Statuit ei Dominus* (mode 1 → mode 2 transposed).

tonus has the *data* for this but detects nothing. `ModeData.modulations`
(`temper/data/modes.ts`) already lists, per mode:
- `regular` — principal tonal centers (the mode's own final/tenor plus the
  degrees it regularly touches),
- `conceded` — permitted secondary centers,
- `initials` — valid opening pitches.

Today that's consumed only by `imprint.ts` (modal affinity — a **global**
judgment of which mode a chant's pitch distribution favors). Modulation
detection is the **local, temporal** version: *where within the chant* does the
tonal center shift, and to what.

## Sibling to cadence detection

This is the same shape as `score/cadence.ts`: a pure detection pass over the
phrase tree, producing pure data on the score (`score.modulations`?), following
the detection-returns-data convention. Reuse:
- the phrase/window walk (`phraseFinalWindow` is a model),
- `note.step.pc` / `note.step.degree` / `note.step.role`,
- `ModeData.modulations` as the catalog of where each mode may go,
- the imprint's pc-distribution idea, but computed **per phrase/section** rather
  than over the whole chant.

## What v1 should produce

A modulation is a **span** (unlike a cadence, which is a point): the melody
leans on a foreign center for a stretch, then leaves it. So the output is likely
a `Modulation[]` with, per event:
- the span (start/end phrase or note index),
- the center it modulated *to* (a pitch class / degree, ideally named as another
  mode's final or tenor),
- strength/confidence (how strongly the pitch distribution over the span favors
  the foreign center vs. the home mode),
- the mechanism if identifiable (foreign dominant introduced, cadence on a
  conceded degree, transposition).

## Segmentation — DECIDED (per-phrase affinity, merge runs)

The approach for v1, reusing `imprint.ts`'s `computeModalAffinity` (a pure
function of a pc-distribution, so it runs on any window):

1. Compute each **phrase's** local pc-distribution (per-phrase pc counting).
2. Run `computeModalAffinity` on each → each phrase's ranked mode preference.
3. Home mode = the chant's overall winner (global affinity / declared mode).
4. Flag phrases where a **non-home** mode wins by a margin (the calibration knob).
5. **Merge consecutive** flagged phrases with the same foreign winner into a
   **span** → one `Modulation` (start/end phrase, target mode, confidence=margin).

Distribution-based, spans fall out of the merge, target names as "mode N" free.
The **margin threshold** is the one calibration — tune against Suñol's worked
examples. Phrase-level granularity for v1 (mid-phrase modulation is a later
refinement).

## Remaining open questions

- **"To what" naming.** A foreign center is most useful named as *mode N's final/
  tenor* or as a psalm-tone-style shift, not a bare pc. Needs the mode table's
  final/tenor reverse-lookup.
- **Transposition vs. modulation.** Suñol himself is cautious about "transposed
  modes" (chants ending on la/si♭/do). Distinguish a genuine internal modulation
  from a whole-chant transposition — the latter is a global fact, the former
  local.
- **Data shape / surface.** `score.modulations: Modulation[]` parallel to
  `score.cadences`? A per-phrase field? How (if at all) it stamps the tabula.
- **Verification.** Suñol gives named worked examples — *Christus resurgens*,
  *Statuit ei Dominus* — check the detector against those if they're in the
  corpus (or transcribe the incipits).

## Apel — as a source, narrowly

Apel's *Gregorian Chant* (1958, already in the bibliography) can **validate what
counts as a modulation target** — his structural-pitch analysis (which degrees a
mode's melodies actually dwell on and cadence to) is a cross-check on the
`ModeData.modulations.regular/conceded` data, the same way Suñol validated the
dominants. Use it at that level: a source for the target catalogue, not a new
mechanism.

Apel's **melodic-type / formula-family (centonization) classification** — "this
Gradual is assembled from these standard mode-2 phrases" — is a **separate
feature**, not modulation. It's corpus-wide melodic-pattern matching, not
tonal-centre tracking. Scoped on its own in `working/plan-melodic-types.md`.

## Not v1

Harmonic/functional analysis of the modulation; anything requiring the accentual
or textual model; melodic-formula/centonization analysis (its own plan). Keep
modulation v1 pitch-distribution + catalog based, like the imprint and cadence
passes.
