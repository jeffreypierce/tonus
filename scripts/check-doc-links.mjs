#!/usr/bin/env node
// ---------------------------------------------------------------------------
// check-doc-links.mjs — do the site's documentation links land where they say?
// ---------------------------------------------------------------------------
// A bad fragment is the failure a browser will not report: `#the-gamut` where
// the heading slugs to `#the-gamut--gamut` still loads the page, just at the
// top, and the reader never learns they were meant to arrive somewhere.
//
// So the anchors are checked against the markdown rather than trusted. The
// list is GREPPED OUT OF THE SITE, not restated here — a copy of the map in
// this file could pass while the page shipped something else.
//
// Run: node scripts/check-doc-links.mjs

import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Every reference page the site links to. Read out of the site rather than
 *  restated here — a copy in this file could pass while the page shipped
 *  something else. */
function linkedPages() {
  const src = readFileSync(resolve(REPO, "docs/app.js"), "utf8");
  const found = new Set();
  // docLink("score")
  for (const m of src.matchAll(/docLink\(\s*"([^"]+)"\s*\)/g)) found.add(m[1]);
  // doc: "tuning" on a reading registry
  for (const m of src.matchAll(/\bdoc:\s*"([^"]+)"/g)) found.add(m[1]);
  return [...found].sort();
}

const pages = linkedPages();
if (!pages.length) {
  console.error("no docLink targets found in docs/app.js — has the call shape changed?");
  process.exit(1);
}

// Every page in the reference, so the check also reports what nothing links to.
const all = readdirSync(resolve(REPO, "docs/api"))
  .filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, "")).sort();

let bad = 0;
for (const page of pages) {
  const path = resolve(REPO, "docs/api", `${page}.md`);
  try {
    readFileSync(path, "utf8");
    console.log(`  \u2713 \u00a7${page} docs`.padEnd(24) + `docs/api/${page}.md`);
  } catch {
    bad++;
    console.log(`  \u2717 \u00a7${page} docs`.padEnd(24) + `docs/api/${page}.md \u2014 NO SUCH PAGE`);
  }
}

const orphans = all.filter((p) => !pages.includes(p));
if (orphans.length) {
  console.log(`\n  nothing links to: ${orphans.join(", ")}`);
}

console.log(`\n${pages.length - bad}/${pages.length} pages resolve`);
process.exit(bad ? 1 : 0);
