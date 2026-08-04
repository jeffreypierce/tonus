// ---------------------------------------------------------------------------
// scripts/engine-fingerprint — has the engine moved under a mined table?
// ---------------------------------------------------------------------------
// Some shipped data is MINED: computed by running the engine over the corpus,
// then baked. Those tables go stale silently. CADENTIAE did exactly that — it
// was baked before the Latin syllable-splitter refinements (14676de), and since
// syllable boundaries move phrase ends, 46 event keys and 9 of 122 families had
// drifted. Nothing failed. The table simply described a corpus the engine no
// longer produced, and only a re-mine found it.
//
// So each mining artifact records the fingerprint of the engine that made it,
// and the bake compares. This does NOT say the data is wrong — it says the code
// that produced it changed, which is the question nobody was asking.
//
// A git SHA would be the obvious fingerprint and the wrong one: it moves on
// every commit, so it would warn constantly and be ignored within a week. This
// hashes the CONTENTS of the files that actually decide a mined value — the
// parse, the IR (which is where syllabification lands), the tabula the miners
// read, and the shared key function. Touch a doc comment in one and it fires,
// which is the acceptable end of the trade; touch anything else in the repo and
// it stays quiet.
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** The sources a mined value depends on, in a fixed order. */
export const ENGINE_SOURCES = [
  "src/engines/score/parse.ts",     // GABC → notes
  "src/engines/score/ir.ts",        // phrases, syllables, rhythm
  "src/engines/score/cadence.ts",   // cadenceKeys — THE shared key function
  "src/engines/score/tabula.ts",    // the flat rows the miners walk
  "src/engines/chant/syllabify.ts", // the splitter that moved last time
];

/**
 * A short content hash over those sources. Stable across unrelated commits,
 * different the moment one of them changes.
 */
export function engineFingerprint() {
  const h = createHash("sha256");
  for (const rel of ENGINE_SOURCES) {
    const abs = resolve(ROOT, rel);
    if (!existsSync(abs)) {
      throw new Error(`engine-fingerprint: ${rel} is missing — update ENGINE_SOURCES`);
    }
    h.update(rel);
    h.update(readFileSync(abs));
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
