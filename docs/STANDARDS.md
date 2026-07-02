# tonus — Code Standards

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

| Thing | Convention | Example |
|---|---|---|
| Public API function | noun or short verb | `cantus`, `festum`, `temperamentum`, `ordo` |
| Engine function | camelCase verb | `getFeast`, `buildScore`, `detectAspects` |
| Internal helper | camelCase | `resolveMasses`, `computeSpeed` |
| Type / interface | PascalCase | `Feast`, `Body`, `ChantMetrics` |
| Type union | PascalCase | `Season`, `CanonicalHour`, `BodyName` |
| Constant map/array | SCREAMING_SNAKE | `ORBITAL_ELEMENTS`, `SEASON_LABELS` |
| Module-level cache | `_camelCase` | `_byId`, `_calCache` |
| Options interface | noun + `Opts` | `CaelumQuery`, `TemperOpts` |

---

## Two API layers

**Engine functions** (in `src/engines/`) are internal. They follow the `getX` / `buildX` naming pattern and are never exported from `src/index.ts`.

**Public API functions** are what users call. They are nouns or short verbs (`cantus()`, `festum()`, `temperamentum()`, `notatio()`), follow the query/builder contract, and are assembled in `src/index.ts`.

**Builder engines** expose their public surface through `api.ts`. **Query engines** expose theirs through a file named after the engine's primary domain (e.g. `calendar.ts`, `chant.ts`, `planet/planet.ts`). The `api.ts` pattern is reserved for engines that compose multiple internal modules into a returned context object with methods.

---

## Public API contract

**Query functions** return arrays, never throw:
```ts
tonus.cantus({ mode: 1 })   // → Chant[], [] on no match
tonus.festum({ date })       // → Feast[], [] on no match
```

**Builder functions** return context objects, throw on invalid input:
```ts
tonus.temperamentum({ tuning: "pythagorean" })  // → Temperamentum
tonus.ordo(chant)                         // → Score
```

`Score` and `Temper` are the only types with methods — this is spec-mandated, not a general pattern.

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
  if (!_byId) _byId = new Map(GR.map(c => [c.id, c]));
  return _byId;
}
```

**Computed caches** — cache by key:
```ts
const _calCache = new Map<number, Map<string, CalEntry[]>>();
```

---

## Comments

Only where logic is non-obvious. No docstrings on self-evident functions.

Use inline trailing comments for interface fields:
```ts
interface Note {
  midi: number;   // MIDI note number
  pc: number;     // pitch class 0–11
  acc: number;    // -1 flat, 0 natural, 1 sharp
}
```

---

## Error handling

**Query functions** return `[]` on no match, never throw:
```ts
tonus.cantus({ mode: 99 })   // → []
tonus.festum({ date })        // → [] if no feast found
```

**Builder functions** throw on invalid input. Context objects carry an `errors` field for parse-level issues:
```ts
const score = tonus.ordo(chant);
score.errors  // → ParseError[] from GABC parse
```

Callers check `.errors` before using the result. Downstream methods on a context object with errors should fail gracefully (return empty/null results, not throw).

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

- No classes (except `Score` and `Temper` — spec-mandated context objects)
- No default exports except `src/index.ts`
- No `any` except in JS interop
- No helper abstractions for one-off operations
- No backwards-compatibility shims
- No comments that restate the function signature
- No `SCREAMING_CACHE` — use `_camelCase` for all module-level caches
