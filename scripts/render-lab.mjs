#!/usr/bin/env node
// ---------------------------------------------------------------------------
// scripts/render-lab — write the visual render gallery (npm run lab)
// ---------------------------------------------------------------------------
// Renders every plate in scripts/lab-plates.mjs to working/review/svg-lab.html.
// Keep that file open in a browser (file://…/working/review/svg-lab.html) and
// refresh after each `npm run lab` — the eyeball half of the render tests.
//
// Faces: Crimson Pro arrives via a Google Fonts <link> (view-time fetch);
// Junicode embeds from a local clone when one is found — set JUNICODE_DIR or
// keep the clone as a sibling of tonus (~/Developer/Junicode-font).
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildPlates, JUNICODE } from "./lab-plates.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const tonus = (await import(join(root, "dist/index.js"))).default;

// ── Junicode discovery ──
const CANDIDATES = [
  process.env.JUNICODE_DIR && join(process.env.JUNICODE_DIR, "webfiles/JunicodeVF-Roman.woff2"),
  join(root, "../Junicode-font/webfiles/JunicodeVF-Roman.woff2"),
].filter(Boolean);
const junicodePath = CANDIDATES.find((p) => existsSync(p)) ?? null;
const junicode = junicodePath
  ? { base64: readFileSync(junicodePath).toString("base64"), format: "woff2" }
  : null;
if (!junicode) {
  console.warn("Junicode not found (JUNICODE_DIR or ../Junicode-font); plates fall back to references.");
}

const plates = buildPlates(tonus, junicode ? { junicode } : {});
const results = plates.map((p) => {
  try {
    return { ...p, svg: p.render().svg, err: null };
  } catch (e) {
    return { ...p, svg: null, err: e.message };
  }
});

const fontFace = junicode
  ? `@font-face { font-family: "${JUNICODE}"; font-weight: 300 700; src: url(data:font/woff2;base64,${junicode.base64}) format("woff2"); }`
  : "";

// ── The wardrobe — Junicode's alternates, rendered live by the browser ──
// Pure CSS on the embedded variable font (axes via font-variation-settings,
// features via font-feature-settings). Nothing here touches tonus — it's a
// specimen sheet for choosing which settings the fonts option should carry.
const SPEC = "Quem quaeritis in sepulchro? Resurrexit sicut dixit · 1462";
const wardrobeRows = [
  ["Crimson Pro", `font-family:'Crimson Pro',serif`, "the house face — also a garalde, hence the resemblance"],
  ["Junicode plain", `font-family:'${JUNICODE}',serif`, "Fell-types base, no settings"],
  ["wght 300", `font-family:'${JUNICODE}';font-variation-settings:'wght' 300`, "light"],
  ["wght 700", `font-family:'${JUNICODE}';font-variation-settings:'wght' 700`, "bold"],
  ["wdth 75", `font-family:'${JUNICODE}';font-variation-settings:'wdth' 75`, "condensed"],
  ["wdth 125", `font-family:'${JUNICODE}';font-variation-settings:'wdth' 125`, "expanded"],
  ["ENLA 100", `font-family:'${JUNICODE}';font-variation-settings:'ENLA' 100`, "enlarged minuscules — the versal look, lowercase grown toward cap height"],
  ["smcp", `font-family:'${JUNICODE}';font-feature-settings:'smcp'`, "small caps"],
  ["hist", `font-family:'${JUNICODE}';font-feature-settings:'hist'`, "historical forms — long ſ"],
  ["ss01", `font-family:'${JUNICODE}';font-feature-settings:'ss01'`, "stylistic set 1"],
  ["ss02", `font-family:'${JUNICODE}';font-feature-settings:'ss02'`, "stylistic set 2 (insular candidates)"],
  ["ss03", `font-family:'${JUNICODE}';font-feature-settings:'ss03'`, "stylistic set 3"],
  ["ss04", `font-family:'${JUNICODE}';font-feature-settings:'ss04'`, "stylistic set 4"],
  ["dlig", `font-family:'${JUNICODE}';font-feature-settings:'dlig'`, "discretionary ligatures"],
  ["onum", `font-family:'${JUNICODE}';font-feature-settings:'onum'`, "oldstyle figures — watch the 1462"],
];
const wardrobe = junicode
  ? `<h2>0 · Junicode — the wardrobe</h2>
<p class="note">browser-rendered specimen on the embedded variable font — axes and features the SVG <code>fonts</code> option could carry; only rows that differ from plain earn a place in a plate</p>
<div class="plate"><table class="ward">
${wardrobeRows.map(([label, css, note]) => `<tr><td class="ward-label">${label}</td><td class="ward-spec" style="${css}">${SPEC}</td><td class="ward-note">${note}</td></tr>`).join("\n")}
</table></div>`
  : "";

const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>tonus svg lab</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300..700;1,300..700&display=swap" rel="stylesheet">
<style>
  ${fontFace}
  body { font: 14px/1.5 -apple-system, sans-serif; margin: 2rem auto; max-width: 1080px; color: #222; }
  h1 { font-size: 1.3rem; } h2 { font-size: 1rem; margin: 2.2rem 0 .2rem; }
  .note { color: #777; margin: 0 0 .6rem; font-size: .85rem; }
  .plate { background: #fffef9; border: 1px solid #e5e0d0; border-radius: 6px; padding: 14px; overflow-x: auto; }
  .err { color: #9E2B25; font-family: ui-monospace, monospace; }
  .stamp { color: #999; font-size: .8rem; margin-top: 3rem; }
  .ward { border-collapse: collapse; width: 100%; }
  .ward td { padding: .35rem .8rem .35rem 0; border-bottom: 1px solid #eee8d8; vertical-align: baseline; }
  .ward-label { font-family: ui-monospace, monospace; font-size: .78rem; color: #9E2B25; white-space: nowrap; }
  .ward-spec { font-size: 21px; }
  .ward-note { color: #999; font-size: .78rem; }
</style></head><body>
<h1>tonus — svg render lab</h1>
<p class="note">npm run lab · refresh this tab after each round · faces: Crimson Pro (house) + Junicode${junicode ? " (embedded)" : " (reference only — clone not found)"}</p>
${wardrobe}
${results.map((c, i) => `<h2>${i + 1} · ${c.title}</h2><p class="note">${c.note}</p><div class="plate">${c.err ? `<span class="err">THROWS: ${c.err}</span>` : c.svg}</div>`).join("\n")}
<p class="stamp">tonus ${JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version} · ${results.filter((c) => !c.err).length}/${results.length} plates rendered</p>
</body></html>`;

const out = join(root, "working/review/svg-lab.html");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`${results.filter((c) => !c.err).length}/${results.length} plates → ${out}`);
for (const c of results.filter((c) => c.err)) console.error("THROWS:", c.title, "—", c.err);
if (results.some((c) => c.err)) process.exit(1);
