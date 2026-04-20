# Solesmes Rhythm Theory

This document records the Solesmes chant rhythm theory as it informs tonus, with citations to primary sources. It covers what the code implements, what it approximates, and what it deliberately omits — and why.

## Primary sources

Three books form the basis of the model. Citations elsewhere in this doc point back to pages in these.

**Carroll, Joseph Robert. *The Technique of Gregorian Chironomy*. Toledo, OH: Gregorian Institute of America, 1955.**
The canonical source for Carroll/Le Guennant's seven rhythmic types (pp. 22–25), the three melodic rules (Ch. 4), conventional overrides like salicus and doubly-dotted clivis (Ch. 5–6), and the reclining figure-8 chironomic curve.

**Gajard, Joseph (trans. Aldhelm Dean). *The Rhythm of Plainsong According to the Solesmes School*. New York: J. Fischer & Bro., 1945.**
Transcribed from Dom Gajard's 1935 lectures. The core exposition of the three-stage synthesis: elementary rhythm → compound beat → composite rhythm (pp. 19–35). Establishes that arsis and thesis are qualities of motion, not positions, and that the ictus is a measuring point with no inherent intensity.

**Carroll, Joseph Robert. *An Applied Course in Gregorian Chant*. Toledo, OH: Gregorian Institute of America, 1956.**
Student textbook. Covers notation, compound-beat formation, and ictus placement rules (pp. 81–119). Stops short of the seven types — those are treated as advanced Le Guennant material in the *Chironomy* book.

**Williams, Richard. "What the heck are arsis and thesis?" Musica Sacra forum, 2011.**
Short forum explainer. Useful as a plain-English gloss on the core concept but not a primary citation for any specific rule.

## Core model

### Arsis and thesis are qualities of motion

The central claim that reshaped the [Performance type](../../src/engines/score/types.ts) in tonus:

> Arsis and thesis are not position counters on individual notes. They are qualities of a *compound beat* — the group of notes between one ictus and the next. Every note in a compound beat shares the group's quality. (Gajard pp. 19–23; Carroll *Chironomy* Ch. 2)

- **Arsic** (ἄρσις, "raising"): rising, active, impulse toward the melodic apex.
- **Thetic** (θέσις, "setting down"): resting, retractive, falling from apex.

Gajard is insistent that these are not strong/weak distinctions (pp. 22–25). The ictus has "no intensity of itself." The rising/falling character is about *movement and direction*, not loudness. This is why the tonus model puts the categorical shape on `Performance.rhythmicShape` rather than making it a velocity signal.

### Three-stage rhythmic synthesis

Gajard pp. 19–35 organizes chant rhythm in three levels:

1. **Elementary rhythm (fundamental rhythmic cell):** one arsis → one thesis. The thesis carries the ictus. Exclusively thetic.
2. **Compound beat:** the junction of two elementary cells on the ictus. The shared ictus becomes both arsic (for the cell starting) and thetic (for the cell ending). This is where tonus's groups live.
3. **Composite rhythm (the incise):** compound beats chained into a larger arc. The whole is what Carroll's seven rhythmic types classify.

Tonus models levels 2 and 3. Level 1 is implicit in the `rhythmicIndex` per-note counter.

### The ictus

The ictus is a *measuring point*, not an accent (Gajard pp. 22–24, Carroll *Applied Course* pp. 81–82). It marks where one compound beat ends and the next begins. Gajard is emphatic that singers who "strike ictic notes as with a hammer" are doing Solesmes badly — the translator's foreword explicitly warns against this (Gajard p. 4).

In tonus, ictus is detected during parse from GABC marks (`'` and `_` in [parse.ts](../../src/engines/score/parse.ts)) and additional signals like episemas and dotted notes. The [ictus placement rules](../../src/engines/score/parse.ts) follow Carroll *Applied Course* Ch. 1 §49, pp. 82–83.

## Classification: three melodic rules

The compound-beat classifier in [ir.ts](../../src/engines/score/ir.ts) applies Carroll *Chironomy* Ch. 4's three rules in priority order:

**Rule 1 — Incise unity (apex):** Ictuses leading up to the melodic apex of an incise are arsic. Ictuses after the apex are thetic. The apex is the highest-pitched ictus in the incise.

**Rule 2 — Relative ictus pitch:** An ictus higher in pitch than the preceding ictus tends arsic. Lower tends thetic.

**Rule 3 — Neume slope:** When rules 1 and 2 are inconclusive, use the direction of the compound beat's notes. Rising → arsic. Falling → thetic.

**Defaults and tie-breakers:**
- The first compound beat of an incise is arsic. Carroll p. 43: an incise never begins with thesis. ("Were we to attribute an arsic quality to te, this would set a precedent for a chain of four consecutive arses leading to a simple binary cadence…")
- When all rules are inconclusive, alternate from the previous group's shape.

## Conventional overrides

Carroll *Chironomy* Ch. 5–6 documents cases where the melodic rules are overridden by convention. Tonus implements two:

**Salicus → always arsic.** The salicus is an ascending three-note group where the middle note carries an ictus mark (distinguishing it from the scandicus, which has no middle ictus). GABC marks it with `'` on the middle note. Carroll treats the salicus's entire group as inherently arsic regardless of melodic position.

**Doubly-dotted clivis → always thetic.** A clivis (two-note descending neume) where either note has a double episema (`..` in GABC). Carroll treats it as a cadential figure with inherently thetic quality.

Both are implemented by tagging the group with its constituent neume types and double-episema presence, then overriding in `classifyGroup` before the melodic rules apply.

**Deferred conventional overrides:**
- **Textual rules** (Carroll Ch. 5): word-accent biases arsic, word-final biases thetic. Requires aligning syllable accent positions with ictus positions. Well-defined but not yet implemented.
- **Cadence formulas**: mode-specific patterns (e.g., mode 1 cadence on re-do-re). Requires a pattern library per mode and sliding-window matching. The three base rules handle most cadences correctly via slope anyway.

## The seven rhythmic types

Carroll *Chironomy* pp. 22–25 presents Auguste Le Guennant's taxonomy of seven rhythmic types, which describe how compound beats chain into incises. Carroll credits the system to Le Guennant's *Précis de rythmique grégorienne*.

**Notation convention (Carroll p. 22):** lowercase `a`/`t` = non-ictic single-note arsis/thesis (the "elementary" form); uppercase `A`/`T` = full compound-beat arsis/thesis.

| Type | Sequence | Structure | Carroll's name | Example (Carroll) |
|------|----------|-----------|----------------|-------------------|
| I | `a–t` | 1 + 1 (both non-ictic) | Fundamental rhythmic cell | p. 22 |
| II | `a–T` | 1 + 2 (binary thesis) | Fundamental cell, binary thesis | p. 22 |
| III | `a–T` | 1 + 3 (ternary thesis) | Fundamental cell, ternary thesis | p. 23 |
| IV | `A–T` | compound + compound | Developed simple rhythm | *Sanctus X*, p. 25 |
| V | `A–A–T` (extensible) | 2+ arses → 1 thesis | Compound rhythm | *Communion Qui meditabitur* (shows `A A A T`), p. 25 |
| VI | `A–T–T` | 1 arsis → 2+ theses | Compound rhythm | *Sanctus XI*, p. 25 |
| VII | `A–T–A–T` | Regular alternation | Compound rhythm | *Introit Exsurge*, p. 26 |
| VIII | nested | Meta-type (overlap) | Compound rhythm | *Gradual Omnes*, p. 26 |

Carroll's own words on Type VIII (p. 24): *"Overlapping of various combinations to form units larger than those in Types I to VII."* The diagram shows nested brackets — Type V and Type VI grouped under a Type VIII span. It's a meta-type where smaller types chain or nest into a larger rhythmic unit.

**On the "three arses" ceiling:** Sometimes quoted as a hard rule. It isn't. Carroll p. 43 rejects three arses in a row on form/balance grounds *for short incises*. But p. 55 explicitly allows four or more: *"We do not mean to imply that four arses would be an impossible combination. Indeed, we shall see later that even greater groupings are conceivable."* Three is a practical ceiling for short incises; longer incises admit four or more. No absolute maximum.

## What tonus models vs. what it doesn't

### Modeled

- **Compound-beat shape classification** (arsic/thetic) via Carroll's three rules + two conventional overrides. See [ir.ts](../../src/engines/score/ir.ts).
- **Per-note rhythmic index** within the compound beat. Enables future chironomy diagram rendering.
- **Types IV–VII** are candidates for implementation in summa as a corpus-level metric. They're pure sequence analysis over the already-classified groups.

### Not modeled, with reasons

- **Types I–III.** These use *non-ictic* single-note arses — the arsis is an anacrusis *inside* the compound beat, not a separate group. Our partitioning puts compound-beat boundaries at ictuses, so Types I–III are sub-surface skeletons we can't surface at the incise-classification level. Carroll himself notes (p. 24) that "Rhythms I, II and III are never found in isolated, actual form in chant." They're structural substrates, not labels we assign to observable incises.
- **Type VIII.** Requires hierarchical detection of nested types — two or more smaller types chained under a larger span. Out of scope for corpus-level metrics; would need a different grouping model.
- **Textual rules.** Well-defined (word-accent → arsic, word-final → thetic) but require syllable-accent alignment work.
- **Cadence formulas.** Mode-specific patterns requiring a per-mode pattern library.
- **Chironomic curve rendering.** The reclining figure-8 Carroll describes (Ch. 8). The data is there (`rhythmicShape` + `rhythmicIndex`); the rendering is a separate project.

### What counts as an incise

In tonus, phrases and incises are the same thing. The GABC parser in [ir.ts](../../src/engines/score/ir.ts) splits phrases at every divisio — including quarter-bar commas (`,`), ticks (`` ` ``), semicolons (`;`), colons (`:`), and double bars (`::`). This matches the Solesmes definition of an incise as the unit bounded by a quarter-bar or larger division (Gajard p. 35; Carroll *Applied Course* p. 76 on bar meanings). So "phrase-level apex" in tonus code equals "incise-level apex" in Carroll's terms.

## Citation conventions

When citing in code comments or docs, use these short forms:

- *Carroll, Chironomy* — the 1955 book. Page numbers refer to the original pagination, which matches the PDF at [churchmusicassociation.org](https://media.churchmusicassociation.org/books/chironomy.pdf).
- *Gajard, Rhythm of Plainsong* — the 1945 English translation.
- *Carroll, Applied Course* — the 1956 student textbook.

## Appendix: glossary

- **Ambitus** — the melodic range of a piece or mode.
- **Anacrusis** — upbeat; a non-ictic arsis before the first ictus.
- **Apex** — highest-pitched ictus in an incise.
- **Chironomy** — the art of directing chant with the hand, tracing reclining figure-8 curves.
- **Clivis** — two-note descending neume.
- **Composite rhythm** — Gajard's third stage: a chain of compound beats forming an incise.
- **Compound beat** — the group of notes between one ictus and the next.
- **Divisio** — a bar in Gregorian notation: quarter-bar (`,`), half-bar (`;`), full bar (`:`), double bar (`::`). Signs of punctuation, not measure.
- **Episema** — a lengthening mark. Horizontal (`.`) is expressive; vertical is the Solesmes ictus sign.
- **Fundamental rhythmic cell** — Gajard's first stage: one arsis + one thesis.
- **Ictus** — rhythmic measuring point marking compound-beat boundaries. Not an accent.
- **Incise** — the smallest melodic unit bounded by a divisio (quarter-bar or larger).
- **Neume** — a group of notes written as a single figure and sung without break.
- **Salicus** — ascending three-note neume with ictus on the middle note; always arsic.
- **Scandicus** — ascending three-note neume without middle ictus; classified by melodic rules.
