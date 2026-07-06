# tonus — Documentation Standards

How tonus documentation is written. The model is the rubric of a chant book:
rules stated plainly, in order, with the exception following the rule. The
docs may be long; they may not be loud.

This governs prose across all three documentation levels (interactive, API
docs, code comments — see CODE-STANDARDS.md § Documentation). The voice is one;
the volume changes by level. These rules are that voice.

## The rules

**1. Open with the office of the thing.** The first sentence of a page or
section states what the function does, in the present indicative. It does
not inventory features.

> *Not:* "The tuning engine: historical temperaments, the Guidonian gamut,
> the eight modes, and psalm tones."
> *But:* "`tonus.temperamentum` builds a tuning context. Every pitch in
> tonus is resolved through one."

**2. One rule per sentence; the exception follows the rule.** Compound
qualifications are split into rule, then exception, each in its own
sentence.

> *Not:* "Gloria is omitted in penitential seasons (though Maundy Thursday
> historically keeps it — a known simplification)."
> *But:* "The Gloria is omitted in Advent, Septuagesima, and Lent. Maundy
> Thursday keeps it; tonus does not yet model this."

**3. Show before tell.** A section introduces functionality with working
code and its actual result, then explains what returned. Values shown in
examples are real outputs, not invented ones.

**4. Types appear where their method appears.** The type block follows the
example that produces it. There is no end-of-page type dump.

**5. No advocacy.** The words *deliberately, honest(ly), simply, powerful,
rich, comprehensive, beautiful* — and their relatives — do not appear in
reference prose. A decision is stated, not defended. Defenses live in
Theory & Context.

**6. Bold marks a term at its definition, once.** Bold is not used for
emphasis. Italics carry Latin and titles.

**7. Em dashes are rationed.** Prefer parentheses or a new sentence for
appositives (established in the 2026-07 simplification pass); at most one
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
Theory & Context states why and whence. Sources states from whom. Content
that argues belongs to the second; content that cites belongs to the third.

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
```

## Application notes

The API register (key language = value register, see CODE-STANDARDS.md) governs
names; this document governs prose. The two meet in rule 6: a Latin term is
bolded and glossed at first use, then used without apology.
