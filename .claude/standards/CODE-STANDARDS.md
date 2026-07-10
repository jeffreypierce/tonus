# tonus — Code Standards

## Code standards

- **The two API layers.** Engine functions (`getX` / `buildX`, in `src/engines/`)
  are internal and never exported; the public API is the Latin nouns assembled in
  `src/index.ts`. Only `Score` and `Temperamentum` are classes with methods,
  spec-mandated rather than a pattern to copy.
- **The two boundaries.** tonus computes what is derivable from one chant or one
  moment with received theory (the analysis boundary); corpus-scale census and
  editorial calibration live in the sibling `tonus-enodatio` and re-enter only as
  generated data with provenance. And `score` analyzes while `inscriptio` draws
  (the rendering boundary): rendering is a standalone function taking a `Score`,
  and analysis tracks live downstream.
- **The query/builder contract.** A no-match is `[]`; a malformed query throws.
  Builders throw on invalid input and carry an `errors` field for parse-level
  issues.
- **Naming and register.** Public methods are Latin nouns; Latin keys carry
  authentic Latin content, English keys carry machine codes and data; engine
  internals and outputs are English. Types are PascalCase, constant maps
  SCREAMING_SNAKE, module caches `_camelCase`.
- **Data patterns.** Large corpora are typed `const` arrays; indices and caches
  build lazily on first access, never at load. Generated data lives in `src/data/`
  and is never hand-edited; hand-built editorial tables live beside the engine
  that owns them.
- **Comments carry the reasoning.** Theory, provenance, and editorial decisions
  sit in the code next to what they explain: module headers for a file's doctrine,
  inline blocks at specific non-obvious choices. A comment never restates a
  signature.
- **Tests.** `node:test` + `node:assert/strict`, one file per public method,
  importing from `dist/` not `src/`. Green tests and clean `tsc` at every commit.

---

## TypeScript

- **ESM only** — `type: "module"`, `.js` extensions on all imports (even `.ts` source files)
- **`module: "NodeNext"`** — no `require()`, no CommonJS
- **Strict mode** — no implicit any, no unchecked indexing
- Use `type` imports for type-only imports:
  ```ts
  import type { Feast } from "./types.js";
  import { getFeast } from "./calendar.js";
  ```

---

## File structure

Every source file opens with a one-line header:

```ts
// ---------------------------------------------------------------------------
// engines/cal/calendar — feast resolution from the liturgical calendar
// ---------------------------------------------------------------------------
```

Divide files into logical sections with short dividers:

```ts
// ── Helpers ──
// ── Public API ──
```

Typical module layout:

1. Imports
2. Constants and caches
3. Internal helpers (unexported)
4. Public functions (exported)

---

## Naming

| Thing                            | Convention      | Example                                        |
| -------------------------------- | --------------- | ---------------------------------------------- |
| Public API function              | Latin noun      | `cantus`, `festum`, `temperamentum`, `notatio` |
| Public field, Latin content      | Latin key       | `nomen`, `ritus`, `tempus`, `genus`, `modus`   |
| Public field, machine code/datum | English key     | `season`, `grade`, `mode`, `date`, `masses`    |
| Engine function                  | camelCase verb  | `getFeast`, `buildScore`, `detectAspects`      |
| Internal helper                  | camelCase       | `resolveMasses`, `computeSpeed`                |
| Type / interface                 | PascalCase      | `Feast`, `Body`, `ChantMetrics`                |
| Type union                       | PascalCase      | `Season`, `CanonicalHour`, `BodyName`          |
| Constant map/array               | SCREAMING_SNAKE | `ORBITAL_ELEMENTS`, `SEASON_LABELS`            |
| Module-level cache               | `_camelCase`    | `_byId`, `_calCache`                           |
| Options interface                | noun + `Opts`   | `CaelumQuery`, `TemperamentumOpts`             |

---

## Two API layers

**Engine functions** (in `src/engines/`) are internal. They follow the `getX` / `buildX` naming pattern and are never exported from `src/index.ts`.

**Public API functions** are what users call. They are Latin nouns (`cantus()`, `festum()`, `temperamentum()`, `notatio()`), follow the query/builder contract, and are assembled in `src/index.ts`.

**Builder engines** expose their public surface through `api.ts`. **Query engines** expose theirs through a file named after the engine's primary domain (e.g. `calendar.ts`, `chant.ts`, `planet/planet.ts`). The `api.ts` pattern is reserved for engines that compose multiple internal modules into a returned context object with methods.

---

## Boundaries

Two lines mark what belongs in the library at all. When a feature is proposed,
it is measured against these before anything else.

**The analysis boundary — tonus computes one chant, one moment.** Everything
derivable from a single chant (or a single instant) with received theory,
deterministically, belongs here: prosody, imprint, cadences, modulations,
rhythmic types, the ephemeris and harmonia, temperament interval analysis.
Anything that requires the **corpus** or an **editorial judgment** — family
vocabularies, thresholds calibrated across many chants, "genus average"
baselines — does **not** live in tonus. It lives in `tonus-enodatio` (the
corpus observatory, a sibling repo pinned to a tonus version) and re-enters tonus
only as **generated data tables with provenance headers** — the corpus-data
separation pattern (`src/data/` holds generated data; hand-built editorial tables
live beside the engine that owns them). The library never runs a census; it cites
one. A curated figure taken _from a treatise_ (not from a census) is received
theory and may be hand-authored here, with its `[biblio:]` citation.

**The rendering boundary — `score` analyzes, `inscriptio` draws.** Rendering is
not a property of an analysis result; it is a standalone function that _takes_ a
`Score`. tonus inks **the score itself** — both notation species, layout, lyrics,
declarative highlighting — and nothing else. Analysis _tracks_ (chironomy waves,
tonarium lanes, anything drawn above or below the staff systems) are downstream
components in the publication, built on the geometry contract `inscriptio`
returns. One emitter format: SVG. The crisp rule: `inscriptio` inks the score;
anything outside the staff systems is a track, and tracks live downstream.

---

## Public API contract

**Query functions** return arrays. A _no-match_ returns `[]` — an empty result is
data, never an error. But a _malformed query_ — an empty `{}` or an unknown key —
is a caller bug, not a search that found nothing, and throws with guidance:

```ts
tonus.cantus({ mode: 1 }); // → Chant[], [] on no match
tonus.cantus({ mode: 99 }); // → [] (a real search, no results)
tonus.cantus({}); // throws — an empty query is a mistake, not "everything"
tonus.festum({ nonsense: 1 }); // throws — unknown key, likely a typo
```

The distinction: `[]` means "I searched and found nothing"; a throw means "I
can't tell what you asked for." Silently resolving a malformed query to a
plausible-looking answer hides the bug.

**Builder functions** return context objects, throw on invalid input:

```ts
tonus.temperamentum({ tuning: "pythagorean" }); // → Temperamentum
tonus.notatio(chant); // → Score
```

`Score` and `Temperamentum` are the only types with methods — this is spec-mandated, not a general pattern.

---

## Data patterns

**Large corpus → typed `.ts` const array** (preferred — compile-time type safety):

```ts
export const GR: Chant[] = [ ... ];
```

**Lazy indices** — build on first access, not at load time:

```ts
let _byId: Map<string, Chant> | null = null;
function byId(): Map<string, Chant> {
  if (!_byId) _byId = new Map(GR.map((c) => [c.id, c]));
  return _byId;
}
```

**Computed caches** — cache by key:

```ts
const _calCache = new Map<number, Map<string, CalEntry[]>>();
```

---

## Comments — the code is authoritative

The code is the authoritative source for **how a thing is calculated, why, and
from what source.** The theory behind an algorithm, the editorial decisions, and
the provenance of data (which treatise a figure came from, why a value was
chosen) live in the code, next to the code they explain — not in a separate
document that drifts. Two forms, by weight:

- **Module-header doc-comments** carry the big-picture theory or doctrine for a
  file — e.g. the Solesmes arsis/thesis model atop the rhythm classifier, the
  derivation methodology atop a data module.
- **Inline blocks** sit at specific non-obvious decisions — e.g. the Grove
  ordering rationale next to the `modulations` data, the margin calibration next
  to the modulation threshold.

Data files carry the provenance of their data next to the data. Judgment governs
which detail goes where.

This is not license to comment the self-evident (`i++ // increment`). It is the
_reasoning and sourcing_ a maintainer or curious reader needs, at the code. A
comment still never merely restates a signature.

Cite sources by key into the central bibliography (see Documentation):

```ts
// Cadence figures, after Niedermeyer & d'Ortigue [biblio: niedermeyer-ortigue],
// cross-checked against Bragers [biblio: bragers-treatise].
```

Use inline trailing comments for interface fields:

```ts
interface Note {
  midi: number;
  pc: number; // pitch class
  acc: number; // -1 flat, 0 natural, 1 sharp
}
```

---

## Documentation

Code is level 2 of a two-level documentation ladder (`docs/*.md` → code), the top
level linking down into it; code is the bottom of the well, holding the deepest
material. The `## Comments` rules above are how that plays out in `src/`. The
whole model — the two levels, the centralized bibliography, and the
one-voice-two-volumes register — is owned by **`DOCS-STANDARDS.md`**. Read it
before writing prose at any level, including code comments.

---

## Error handling

**Query functions** return `[]` on no match. A malformed query (empty `{}` or an
unknown key) throws with guidance — see _Public API contract_ above for the
no-match-vs-caller-bug distinction:

```ts
tonus.cantus({ mode: 99 }); // → [] (searched, found nothing)
tonus.festum({ date }); // → [] if no feast found
tonus.festum({ month: 12 }); // throws — unknown key
```

**Builder functions** throw on invalid input. Context objects carry an `errors` field for parse-level issues:

```ts
const score = tonus.notatio(chant);
score.errors; // → ParseError[] from GABC parse
```

Callers check `.errors` before using the result. Downstream methods on a context object with errors should fail soft: return empty/null results, not throw.

TypeScript handles type-level mistakes at compile time — no runtime guards needed for wrong argument types.

---

## Tests

- `node:test` + `node:assert/strict` — no test framework
- Import from `../../dist/index.js`, never from source
- One test file per public API function
- Name tests as full sentences
- Test the public API, not engine internals

```mjs
import test from "node:test";
import assert from "node:assert/strict";
import tonus from "../../dist/index.js";

test("cantus: returns chants for mode 1", () => {
  const chants = tonus.cantus({ mode: 1 });
  assert.ok(chants.length > 0);
});
```

---

## What not to do

- No classes (except `Score` and `Temperamentum` — spec-mandated context objects)
- No default exports except `src/index.ts`
- No `any` except in JS interop
- No helper abstractions for one-off operations
- No backwards-compatibility shims
- No comments that restate the function signature
- No `SCREAMING_CACHE` — use `_camelCase` for all module-level caches
