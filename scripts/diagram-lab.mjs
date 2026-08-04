#!/usr/bin/env node
// ---------------------------------------------------------------------------
// diagram-lab.mjs — render the site's diagrams to a page you can look at
// ---------------------------------------------------------------------------
// The diagrams are DOM components, so this shims just enough of document to
// build them in node and serialize the SVG. Same instrument as render-lab for
// the score plates: regenerate, refresh the tab, judge with your eyes.
//
// Junicode resolves from ../Junicode-font or JUNICODE_DIR and is embedded when
// found, so the page shows the real face rather than a fallback serif.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const root = resolve(HERE, "..");

// ── the DOM shim ──
const NS = "http://www.w3.org/2000/svg";
const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ESC[c]);
const VOID = new Set();

class El {
  constructor(tag) { this.tag = tag; this.attrs = {}; this.kids = []; this.text = null; this.html = null; }
  set className(v) { this.attrs.class = v; }
  set tabIndex(v) { this.attrs.tabindex = String(v); }
  set innerHTML(v) { this.html = (this.html ?? "") + v; }
  get innerHTML() { return this.html ?? ""; }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return this.attrs[k] ?? null; }
  appendChild(c) { this.kids.push(c); return c; }
  addEventListener() { /* inert in the lab */ }
  set textContent(v) { this.text = v; }
  get outerHTML() {
    const a = Object.entries(this.attrs).map(([k, v]) => ` ${k}="${esc(v)}"`).join("");
    if (VOID.has(this.tag)) return `<${this.tag}${a}/>`;
    const inner = (this.text != null ? esc(this.text) : "") + (this.html ?? "") +
      this.kids.map((k) => k.outerHTML).join("");
    return `<${this.tag}${a}>${inner}</${this.tag}>`;
  }
}
globalThis.document = {
  createElementNS: (_ns, tag) => new El(tag),
  createElement: (tag) => new El(tag),
};

// ── the library and the diagrams ──
const tonus = (await import(join(root, "dist/index.js"))).default;
const { annulus, annulusTabula } = await import(join(root, "docs/diagrams/annulus.js"));
const { chorda, regula, chordaTabula } = await import(join(root, "docs/diagrams/chorda.js"));
const { hand, handTabula } = await import(join(root, "docs/diagrams/hand.js"));
const { rota, rotaTabula, rotaAspectTabula } = await import(join(root, "docs/diagrams/rota.js"));

// ── Junicode, embedded when a clone is around ──
const juniPath = [
  process.env.JUNICODE_DIR && join(process.env.JUNICODE_DIR, "webfiles/JunicodeVF-Roman.woff2"),
  join(root, "../Junicode-font/webfiles/JunicodeVF-Roman.woff2"),
].filter(Boolean).find((p) => existsSync(p));
const juniCss = juniPath
  ? `@font-face{font-family:"Junicode";font-weight:300 700;src:url(data:font/woff2;base64,${
      readFileSync(juniPath).toString("base64")}) format("woff2-variations");}`
  : "";
if (!juniPath) console.warn("Junicode not found (JUNICODE_DIR or ../Junicode-font) — falling back.");

// ── the battery ──
const YEAR = 991;
const plates = [
  {
    title: "annulus — the year 991",
    note: "the default epoch: Guido's era. The standing day (1 June) is the one rubricated mark; " +
      "penitential seasons are the fainter stratum, not a second colour.",
    build: () => {
      const o = { year: YEAR, day: new Date(Date.UTC(991, 5, 1)), selected: "pentecost" };
      return [annulus(tonus, o), annulusTabula(tonus, o)];
    },
  },
  {
    title: "annulus — Easter selected",
    note: "selection is opacity, not colour: the chosen anchor takes the full stratum and the larger type step.",
    build: () => {
      const o = { year: YEAR, day: new Date(Date.UTC(991, 3, 10)), selected: "easter" };
      return [annulus(tonus, o), annulusTabula(tonus, o)];
    },
  },
  {
    title: "annulus — 2026, computed for a different year",
    note: "the same diagram, no transcription: pascha(2026) moves every anchor.",
    build: () => {
      const o = { year: 2026, selected: "easter" };
      return [annulus(tonus, o), annulusTabula(tonus, o)];
    },
  },
  {
    title: "chorda — the monochord, mode 7",
    note: "one string, stopped where a ratio divides it — the whole string sounds the finalis, " +
      "half of it the octave, so the drawn span is that sounding half. The divisions bunch " +
      "toward the octave because pitch and length are reciprocal, not proportional: the " +
      "spacing IS the arithmetic. The tenor (diapente, 2/3) is selected.",
    build: () => {
      const o = { mode: 7 };
      return [chorda(tonus, o), chordaTabula(tonus, o)];
    },
  },
  {
    title: "regula — the same scale in cents",
    note: "the scale laid out evenly against the equal-tempered grid. Where a mark sits off " +
      "its grid line is where Pythagorean tuning and the piano part company.",
    build: () => {
      const o = { mode: 7 };
      return [regula(tonus, o), chordaTabula(tonus, o)];
    },
  },
  {
    title: "manus — the Guidonian hand, mode 1",
    note: "twenty joints, each holding one step of the gamut, read in a spiral: thumb tip, down " +
      "the thumb, across the finger bases, up the little finger, back across the tips. The " +
      "finalis and tenor of the mode read darker; the syllable under each joint is how THIS " +
      "hexachord names it. Only the hand's shape is drawn here — every pitch, name, hexachord " +
      "and mutation comes from gradus().",
    build: () => {
      const o = { mode: 1, onSelect: () => {} };
      return [hand(tonus, o), handTabula(tonus, o)];
    },
  },
  {
    title: "manus — the same hand read in mode 7",
    note: "the drawing does not change; the reading does. The finalis moves to G, the tenor to D, " +
      "and the whole hand shifts into the hard hexachord — which is what the hand was for.",
    build: () => {
      const o = { mode: 7, onSelect: () => {} };
      return [hand(tonus, o), handTabula(tonus, o)];
    },
  },
  {
    title: "chorda — mode 1, for comparison",
    note: "the same instrument for a different mode: the finalis moves to D and every " +
      "division with it. Nothing here is transcribed per-mode.",
    build: () => {
      const o = { mode: 1 };
      return [chorda(tonus, o), chordaTabula(tonus, o)];
    },
  },
];

plates.push(
  {
    title: "rota — the wheel of the spheres",
    note: "seven planets at their true longitudes for the default epoch, each on its own sphere " +
      "in the Chaldean order — and that order IS the scale order: Luna sounds D5 at the centre, " +
      "Saturn E4 at the rim. The lines are aspects, drawn at the weight of their strength; " +
      "tonus names the interval each one sounds.",
    build: () => {
      const o = { selected: "Sun", onSelect: () => {} };
      return [rota(tonus, o), rotaTabula(tonus, o)];
    },
  },
  {
    title: "rota — the chords the sky is playing",
    note: "the same moment's aspects as a table. A trine is a third, a square a tritone: the " +
      "angle, its strength, and the interval it sounds all come from harmonia.",
    build: () => [rotaAspectTabula(tonus, {})],
  },
);

const results = plates.map((p) => {
  try {
    const parts = p.build();
    return { ...p, svg: (Array.isArray(parts) ? parts : [parts]).map((e) => e.outerHTML).join("") };
  }
  catch (err) { return { ...p, err }; }
});

const html = `<meta charset="utf-8">
<title>tonus — diagram lab</title>
<style>
${juniCss}
:root{--ink:#111;--paper:#FDFDFC;--rule:#DDDAD3;--label:#6E6A61;--rubrica:#9E2B25;
  --serif:Junicode,'Crimson Pro',Georgia,serif;--mono:ui-monospace,Menlo,'IBM Plex Mono',monospace;}
*{box-sizing:border-box}
body{margin:0;padding:40px 32px 80px;background:var(--paper);color:var(--ink);font-family:var(--serif);}
h1{font-size:26px;font-weight:500;margin:0 0 4px;letter-spacing:.01em}
.sub{font-family:var(--mono);font-size:11px;color:var(--label);margin:0 0 36px;letter-spacing:.06em;text-transform:uppercase}
.plate{border-top:1px solid var(--rule);padding:28px 0 8px;margin:0}
.plate h2{font-size:17px;font-weight:500;margin:0 0 6px}
.plate .note{font-size:13.5px;color:var(--label);margin:0 0 18px;max-width:62ch;line-height:1.5}
.plate svg{max-width:100%;height:auto;display:block}
.body{display:grid;grid-template-columns:minmax(320px,1fr) minmax(300px,420px);gap:36px;align-items:start}
@media(max-width:900px){.body{grid-template-columns:1fr}}
table.tabula{border-collapse:collapse;width:100%;font-size:13.5px}
table.tabula th{font-family:var(--mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase;white-space:nowrap;
  color:var(--label);text-align:left;font-weight:400;padding:0 10px 6px 0;border-bottom:1px solid var(--rule)}
table.tabula td{padding:5px 10px 5px 0;border-bottom:1px solid var(--rule);vertical-align:baseline}
table.tabula td:nth-child(3){white-space:nowrap}
table.tabula tr.sel td{background:rgba(17,17,17,.05)}
table.tabula .mono{font-family:var(--mono);font-size:11px}
table.tabula .num{text-align:right;font-variant-numeric:tabular-nums}
table.tabula .gloss{color:var(--label);font-size:11px;margin-left:.5em}
table.tabula caption{font-family:var(--mono);font-size:9px;letter-spacing:.1em;text-transform:uppercase;
  color:var(--label);text-align:left;padding-bottom:10px}
.err{font-family:var(--mono);font-size:12px;color:var(--rubrica);white-space:pre-wrap}
.stamp{margin-top:48px;font-family:var(--mono);font-size:11px;color:var(--label)}
</style>
<h1>diagram lab</h1>
<p class="sub">npm run diagrams · refresh after each round${juniPath ? " · Junicode embedded" : " · Junicode missing"}</p>
${results.map((r) => `<section class="plate">
  <h2>${esc(r.title)}</h2>
  <p class="note">${esc(r.note)}</p>
  ${r.err ? `<pre class="err">${esc(r.err.stack || r.err.message)}</pre>` : `<div class="body">${r.svg}</div>`}
</section>`).join("\n")}
<p class="stamp">tonus ${JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version} · ${
  results.filter((r) => !r.err).length}/${results.length} plates rendered</p>
`;

const out = join(root, "working/review/diagram-lab.html");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
console.log(`wrote ${out} — ${results.filter((r) => !r.err).length}/${results.length} plates`);
for (const r of results) if (r.err) console.error(`  ✗ ${r.title}: ${r.err.message}`);
if (results.some((r) => r.err)) process.exit(1);
