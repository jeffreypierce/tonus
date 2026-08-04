#!/usr/bin/env node
// ---------------------------------------------------------------------------
// bake-data.mjs — inline the JSON payloads into the emitted data modules
// ---------------------------------------------------------------------------
// Six data modules read their payload off the filesystem at import time:
//
//   import { readFileSync } from "node:fs";
//   const data = JSON.parse(readFileSync(resolve(__dir, "…json"), "utf8"));
//
// That is fine in node and fatal anywhere else — a browser cannot resolve
// node:fs, so importing tonus fails before it does anything. The library is
// dependency-free ESM and deterministic; there is no reason it should not run
// in a browser, and the only thing stopping it is how these six files load.
//
// So after tsc, this replaces the read with the parsed JSON itself. The module
// becomes plain data: no imports, no filesystem, identical exports. Node keeps
// working exactly as before; the browser starts working.
//
// The .json files are still copied to dist (consumers may want them), and the
// TypeScript sources are untouched — this rewrites emitted output only.

import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(HERE, "..", "dist", "data");

/** `import … from "node:…"` lines, and the __dir/readFileSync preamble. */
const NODE_IMPORT = /^import\s+\{[^}]*\}\s+from\s+"node:(?:fs|path|url)";?\s*$/gm;
const DIR_CONST = /^const __dir = dirname\(fileURLToPath\(import\.meta\.url\)\);?\s*$/gm;
// The emitted form, which varies: `const X =` or `export const X =`, and an
// optional property taken off the parsed object (`.byChant`, `.map`, `.table`).
const READ_CALL =
  /((?:export\s+)?const\s+\w+\s*=\s*)JSON\.parse\(\s*readFileSync\(\s*resolve\(__dir,\s*"([^"]+)"\)\s*,\s*"utf8"\)\s*,?\s*\)((?:\.\w+)*)\s*;/g;

let baked = 0;
let bytes = 0;

const files = (await readFile(join(HERE, "..", "package.json"), "utf8"), [
  "smufl-glyphs.js", "psalms.js", "office-ferial.js",
  "commune-office.js", "seasonal-respbreve.js", "attestation.js",
]);

for (const name of files) {
  const path = join(DIST, name);
  if (!existsSync(path)) continue;
  let src = await readFile(path, "utf8");
  if (!/node:(fs|path|url)/.test(src)) continue;   // already baked

  const reads = [...src.matchAll(READ_CALL)];
  if (!reads.length) {
    console.error(`bake-data: ${name} imports node builtins but has no readFileSync — ` +
      `the pattern changed, so this cannot bake it safely.`);
    process.exit(1);
  }

  for (const [whole, head, json, accessor] of reads) {
    const payload = await readFile(join(DIST, json), "utf8");
    // Keep the accessor: the module exports a slice of the file, not all of it.
    src = src.replace(whole, `${head}(${payload.trim()})${accessor};`);
    bytes += payload.length;
  }
  src = src.replace(NODE_IMPORT, "").replace(DIR_CONST, "");
  // Collapse the blank run the removed preamble leaves behind.
  src = src.replace(/^\n{2,}/, "").replace(/\n{3,}/g, "\n\n");

  if (/node:(fs|path|url)/.test(src)) {
    console.error(`bake-data: ${name} still references a node builtin after baking.`);
    process.exit(1);
  }
  await writeFile(path, src);
  baked++;
}

// The whole point: nothing under dist/ may import a node builtin.
const { execSync } = await import("node:child_process");
const leaking = execSync(
  `grep -rl 'node:' ${resolve(HERE, "..", "dist")} 2>/dev/null | grep '\\.js$' || true`,
).toString().trim();
if (leaking) {
  console.error("bake-data: node builtins still reachable from dist:\n" +
    leaking.split("\n").map((l) => `  ${l}`).join("\n"));
  process.exit(1);
}

console.log(`baked ${baked} data modules (${(bytes / 1024).toFixed(0)}KB inlined) — ` +
  `dist imports no node builtins`);
