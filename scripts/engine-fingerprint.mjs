// ---------------------------------------------------------------------------
// scripts/engine-fingerprint — has the engine moved under a mined table?
// ---------------------------------------------------------------------------
// Some shipped data is MINED: computed by running the engine over the corpus,
// then baked. Those tables go stale silently. CADENTIAE did exactly that: it
// was baked before the Latin syllable-splitter refinements (14676de), and since
// syllable boundaries move phrase ends, 46 event keys and nine of the families
// the catalogue then held had drifted. Nothing failed. The table described a
// corpus the engine no longer produced, and only a re-mine found it.
//
// So each mining artifact records the fingerprint of the engine that made it,
// and the bake compares. This does NOT say the data is wrong — it says the code
// that produced it changed, which is the question nobody was asking.
//
// A git SHA would be the obvious fingerprint and the wrong one: it moves on
// every commit, so it would warn constantly and be ignored within a week. This
// hashes the CONTENTS of the files that decide a mined value. They are not
// listed by hand: a hand list missed the pitch, step, neume, articulation,
// ictus and lyric modules the tabula reads through. The set is the transitive
// closure of relative imports from ROOTS (the parse, the shared key function,
// the flat rows the miners walk, the IR), less generated data under src/data/
// (a mined table must not fingerprint itself) and type-only imports (erased
// at build).
// Touch a doc comment in one and it fires, which is the acceptable end of the
// trade; touch anything outside the closure and it stays quiet.
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Where the closure starts: the modules a mined value is computed by. */
const ROOTS = [
  "src/engines/score/parse.ts",     // GABC → notes (parseGABC, which buildScore runs first)
  "src/engines/score/cadence.ts",   // cadenceKeys — THE shared key function
  "src/engines/score/tabula.ts",    // the flat rows the miners walk
  "src/engines/score/ir.ts",        // phrases, syllables, rhythm
];

/** Relative value imports of one module (`import type` is erased, so skipped). */
function valueImports(abs) {
  const src = readFileSync(abs, "utf8");
  const out = [];
  const IMPORT =
    /^\s*(?:import|export)\s+(type\s+)?(?:[^;]*?\s+from\s+)?["'](\.{1,2}\/[^"']+)["']/gm;
  for (const m of src.matchAll(IMPORT)) {
    if (m[1]) continue;
    out.push(resolve(dirname(abs), m[2].replace(/\.js$/, ".ts")));
  }
  return out;
}

/** The sources a mined value depends on, sorted so the hash order is fixed. */
export function engineSources() {
  const seen = new Set();
  const queue = ROOTS.map((r) => resolve(ROOT, r));
  while (queue.length) {
    const abs = queue.pop();
    if (seen.has(abs)) continue;
    if (!existsSync(abs)) {
      throw new Error(`engine-fingerprint: ${relative(ROOT, abs)} is imported but missing`);
    }
    seen.add(abs);
    for (const dep of valueImports(abs)) {
      if (relative(ROOT, dep).startsWith("src/data/")) continue;
      queue.push(dep);
    }
  }
  return [...seen].map((abs) => relative(ROOT, abs)).sort();
}

/**
 * A short content hash over the closure. Stable across unrelated commits,
 * different the moment one of them changes.
 */
export function engineFingerprint() {
  const h = createHash("sha256");
  for (const rel of engineSources()) {
    h.update(rel);
    h.update(readFileSync(resolve(ROOT, rel)));
  }
  return h.digest("hex").slice(0, 16);
}

/**
 * Compare an artifact's recorded fingerprint against the engine as it stands.
 * Returns a warning string, or null when they agree (or when the artifact
 * predates fingerprinting, which is not itself an error).
 */
export function checkFingerprint(recorded, label) {
  const now = engineFingerprint();
  if (!recorded) {
    return `${label} carries no engine fingerprint — re-mine to start tracking it`;
  }
  if (recorded !== now) {
    return `${label} was mined by engine ${recorded}, but the engine is now ${now}. ` +
      `The score engine changed since this was mined, so the table may describe a ` +
      `corpus it no longer produces. Re-mine to be sure.`;
  }
  return null;
}
