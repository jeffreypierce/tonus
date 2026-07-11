#!/usr/bin/env node
// ---------------------------------------------------------------------------
// scripts/render-stress — write the stress gallery (npm run stress)
// ---------------------------------------------------------------------------
// Renders every piece in scripts/stress-pieces.mjs to
// working/review/svg-stress.html — real corpus chants, one per genus, full
// dress. Same viewing habit as the lab: keep the file open, refresh after
// each round. Junicode embeds page-level from the local clone when found.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildStressPieces, JUNICODE } from "./stress-pieces.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tonus = (await import(join(root, "dist/index.js"))).default;

// ── Junicode discovery (as the lab) ──
const CANDIDATES = [
  process.env.JUNICODE_DIR && join(process.env.JUNICODE_DIR, "webfiles/JunicodeVF-Roman.woff2"),
  join(root, "../Junicode-font/webfiles/JunicodeVF-Roman.woff2"),
].filter(Boolean);
const junicodePath = CANDIDATES.find((p) => existsSync(p)) ?? null;
const junicode = junicodePath ? readFileSync(junicodePath).toString("base64") : null;
if (!junicode) {
  console.warn("Junicode not found (JUNICODE_DIR or ../Junicode-font); text falls back through the stack.");
}

const pieces = buildStressPieces(tonus);
const results = pieces.map((p) => {
  try {
    return { ...p, svg: p.render().svg, err: null };
  } catch (e) {
    return { ...p, svg: null, err: e.message };
  }
});

const fontFace = junicode
  ? `@font-face { font-family: "${JUNICODE}"; font-weight: 300 700; src: url(data:font/woff2;base64,${junicode}) format("woff2"); }`
  : "";

const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>tonus svg stress</title>
<style>
  ${fontFace}
  body { font: 14px/1.5 -apple-system, sans-serif; margin: 2rem auto; max-width: 1080px; color: #222; }
  h1 { font-size: 1.3rem; } h2 { font-size: 1rem; margin: 2.2rem 0 .2rem; }
  .note { color: #777; margin: 0 0 .6rem; font-size: .85rem; }
  .plate { background: #fffef9; border: 1px solid #e5e0d0; border-radius: 6px; padding: 14px; overflow-x: auto; }
  .err { color: #9E2B25; font-family: ui-monospace, monospace; }
  .stamp { color: #999; font-size: .8rem; margin-top: 3rem; }
</style></head><body>
<h1>tonus — svg stress gallery</h1>
<p class="note">npm run stress · one real piece per genus, full dress · Junicode${junicode ? " (page-embedded)" : " (reference only — clone not found)"}</p>
${results.map((c, i) => `<h2>${i + 1} · ${c.title}</h2><p class="note">${c.note}</p><div class="plate">${c.err ? `<span class="err">THROWS: ${c.err}</span>` : c.svg}</div>`).join("\n")}
<p class="stamp">tonus ${JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version} · ${results.filter((c) => !c.err).length}/${results.length} pieces rendered</p>
</body></html>`;

const out = join(root, "working/review/svg-stress.html");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`${results.filter((c) => !c.err).length}/${results.length} pieces → ${out}`);
for (const c of results.filter((c) => c.err)) console.error("THROWS:", c.title, "—", c.err);
if (results.some((c) => c.err)) process.exit(1);
