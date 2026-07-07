# tonus — Documentation Standards

This document owns the whole documentation model: the three levels, the
centralized bibliography, and the one voice as well as the prose rules that
follow. CODE-STANDARDS.md governs the code itself and cross-references here.

## The model — three levels, one voice

Documentation is a **three-level ladder**; each level is lighter than the one
below and links down into it. A reader starts at the top and drills as far as
they want; the code is the bottom of the well.

| Level               | Surface                | Depth    | Holds                                                                                                    |
| ------------------- | ---------------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| **1. Interactive**  | the docs site (future) | lightest | common API calls, run-it-live, limited context                                                           |
| **2. Official API** | `docs/*.md`            | medium   | API focus (options, examples, interfaces) + high-level theory that links to the bibliography and to code |
| **3. Code**         | `src/`                 | full     | how it is computed, why, and from what source: full theory, editorial decisions, provenance              |

Only the **deepest** material lives in code:
step-by-step derivations, the provenance of each figure, calibration values,
recorded editorial decisions. (What belongs _in the code_ is CODE-STANDARDS.md
§ Comments.)

**The bibliography is centralized.** `BIBLIOGRAPHY.md` is the single source of
truth for citations, and it carries the full citation: author, title,
translator, place, publisher, year, and URL. Each entry has a stable kebab key
(`carroll-chironomy`, `rockstro-grove`). Code cites by bracketed key
(`[biblio: key]`); docs pages link to the entry's anchor and keep a short
`## Sources` pointer listing the keys they use. Nothing outside `BIBLIOGRAPHY.md`
restates a full reference; there are no per-page source lists.

**One voice, three volumes.** All three levels are the same author at different
lengths, not three personalities. The voice is the rubric of a chant book (the
rules below): present indicative, rules stated plainly with the exception
following the rule, no advocacy (a decision is stated, not defended), bold marks
a term at its definition once, italics carry Latin and titles. What changes
across levels is volume and register, not voice:

- **L1 (interactive)** — terse, inviting: a label on an instrument. One line,
  present tense, no theory.
- **L2 (API docs)** — the rubric proper: the reference states _what is_; Theory
  & Context states _why and whence_ (scholarly register, no meta-narration).
- **L3 (code)** — a scholar's marginalia: the same restraint, now allowed to
  explain fully. Explains; still does not advocate — "corrected to the Protus
  descent (the mode-2 seed was a copy of mode 5)," not "elegantly fixed a bug."

## The rules

**1. Open with the office of the thing.** The first sentence of a page or
section states what the function does, in the present indicative. It does
not inventory features.

> _Not:_ "The tuning engine: historical temperaments, the Guidonian gamut,
> the eight modes, and psalm tones."
> _But:_ "`tonus.temperamentum` builds a tuning context. Every pitch in
> tonus is resolved through one."

**2. One rule per sentence; the exception follows the rule.** Compound
qualifications are split into rule, then exception, each in its own
sentence.

> _Not:_ "The proper falls back to the Commune when a feast lacks its own,
> unless it is a Sunday, in which case the season's formulary is used first."
> _But:_ "A feast uses its own proper. When it has none, the season's
> formulary is tried, then the Commune Sanctorum."

**3. Show before tell.** A section introduces functionality with working
code and its actual result, then explains what returned. Values shown in
examples are real outputs, not invented ones.

**4. Types appear where their method appears.** The type block follows the
example that produces it. There is no end-of-page type dump.

**5. No advocacy.** The words _deliberately, honest(ly), simply, powerful,
rich, comprehensive, beautiful_ — and their relatives — do not appear in
reference prose. A decision is stated, not defended. Defenses live in
Theory & Context.

**6. Bold marks a term at its definition, once.** Bold is not used for
emphasis. Italics carry Latin and titles.

**7. Em dashes are rationed.** Prefer parentheses or a new sentence for
appositives; at most one
dash per paragraph, never chained.

**8. Long is acceptable; disoriented is not.** Every page opens with a
short table of contents after its first paragraph. Headings are entries in
that order.

**9. Headings name activities, not types.** H1 is the page. H2 is a thing
the reader does or a body of rules (`## Pitches — nota`, `## Theory &
Context`). H3 subdivides an H2. A type never receives its own H2.

**10. Tables carry data; prose carries rules.** Corpora, presets, grade
orders, and correspondences belong in tables. A rule of behavior is never
expressed only as a table row.

**11. Enumerations are tables.** A union of codes is data: show it as a
table with its meanings (the grade table, the season table, the genre
codes). Interfaces remain code blocks; a pure code list never appears as
TypeScript.

**12. The three registers of a page.** The reference states what is.
Theory & Context states why and whence. Sources points to whom, a short list
of bibliography keys, not full citations (those live in `BIBLIOGRAPHY.md`).
Content that argues belongs to the second; content that cites belongs to the third.

## The page template

```
# <Topic>

<Opening paragraph: the office of the engine, its place among the others,
its independence or dependencies. Rubrical register.>

<TOC: bulleted links, one per H2.>

## <Activity> — `method`     (one per method or coherent group)
   <rule prose> → <example with real output> → <type block> → <exceptions>

## Theory & Context
   ### <subtopics>            (scholarly register permitted; no meta-narration)

## Sources
   <one line: the bibliography keys this page draws on, linking to BIBLIOGRAPHY.md>
```

## Application notes

The API register (key language = value register, see CODE-STANDARDS.md) governs
names; this document governs prose. The two meet in rule 6: a Latin term is
bolded and glossed at first use, then used without apology.
