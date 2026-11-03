#!/usr/bin/env node
// ---------------------------------------------------------------------------
// gate-boundary.mjs — the rendering boundary's import rule and the entry map
// ---------------------------------------------------------------------------
// CODE-STANDARDS states the rendering boundary in prose: `score` analyzes,
// `inscriptio` draws. A paragraph cannot fail a build; this can, for the part
// of the boundary an import graph shows.
//
// Two checks, both cheap:
//
// 1. THE DRAWER'S DOOR. No module other than `engines/score/inscriptio.ts` and
//    the emitters themselves imports from `emitters/` directly. The root
//    index reaches the drawing code, but only through `inscriptio`; analysis
//    passes and the other engines never name an emitter. Every import form
//    counts: static `import … from`, `export … from`, a bare `import "…"`,
//    and a dynamic `import("…")`, in either quote.
//
// 2. THE ENTRY MAP. Every subpath in package.json `exports` has a source
//    module behind it, and every root-level entry module is exported. An entry
//    added without a map is invisible to consumers; a map pointing at nothing
//    is a broken import that only shows up downstream, which is how a vendored
//    site tree goes stale without anyone noticing.
//
// Not a warning. A missing boundary is a design change, and a design change
// should have to be typed on purpose.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");

/** Files permitted to reach into the emitters. */
const DRAWERS = new Set(["engines/score/inscriptio.ts"]);
const EMITTER_DIR = "engines/score/emitters/";

const failures = [];

// ── walk every .ts under src ──
function walk(dir, rel = "") {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...walk(join(dir, e.name), r));
    else if (e.name.endsWith(".ts")) out.push(r);
  }
  return out;
}
const files = walk(SRC);

// ── 1. the rendering boundary ──
for (const rel of files) {
  if (rel.startsWith(EMITTER_DIR) || DRAWERS.has(rel)) continue;
  const src = readFileSync(join(SRC, rel), "utf8");
  const SPECIFIER =
    /\bfrom\s*["']([^"']+)["']|\bimport\s*\(\s*["']([^"']+)["']|^\s*import\s+["']([^"']+)["']/gm;
  for (const m of src.matchAll(SPECIFIER)) {
    const spec = m[1] ?? m[2] ?? m[3];
    if (spec.includes("emitters/")) {
      failures.push(
        `${rel} imports "${spec}" — only ${[...DRAWERS].join(", ")} and the ` +
        `emitters themselves may reach into emitters/. If this import is right, ` +
        `the rendering boundary moved and DRAWERS here should say so.`,
      );
    }
  }
}

// ── 2. the entry map ──
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const mapped = new Set(
  Object.keys(pkg.exports ?? {}).filter((k) => k !== ".").map((k) => k.replace(/^\.\//, "")),
);
for (const name of mapped) {
  if (!existsSync(join(SRC, `${name}.ts`))) {
    failures.push(`package.json exports "./${name}" but src/${name}.ts does not exist.`);
  }
}
const entries = files.filter((f) => !f.includes("/") && f !== "index.ts").map((f) => f.slice(0, -3));
for (const name of entries) {
  if (!mapped.has(name)) {
    failures.push(
      `src/${name}.ts looks like an entry module but package.json exports has no "./${name}" — ` +
      `a consumer cannot import it.`,
    );
  }
}

if (failures.length) {
  console.error("gate-boundary: FAILED\n");
  for (const f of failures) console.error("  • " + f + "\n");
  process.exit(1);
}
console.log(
  `gate-boundary: ok — ${files.length} modules checked, ` +
  `${entries.length} entries mapped (${entries.join(", ")}).`,
);
