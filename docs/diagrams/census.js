// ---------------------------------------------------------------------------
// site/diagrams/census — the subject against the corpus
// ---------------------------------------------------------------------------
// ONE READING, TWO SUBJECTS. On Canticum the subject is a chant; on
// Calendarium it is a day. Both tabs are called Census — the name lives in
// CENSUS_NOMEN and nowhere else — because they are one reading taken on two
// things, not two readings: the same comb, the same radar row, the same
// headline engine, pointed at a different subject. That is also why every
// figure here takes data in and returns a node: no figure reads `state`, the
// panels in app.js do the wiring (plan-census-tab §8), and a third subject
// would cost a fourth panel, not a fourth figure.
//
// Three figures, in a ruled order:
//   1  the percentile comb    the subject against the whole corpus AND its
//                             own kind — genus for a chant, rank for a day
//   2  the mass / day row     four chants side by side: radar on the axes
//                             they most disagree on, note weight beneath
//   3  the numbers            tabula()s, grouped by caption
//
// Percentiles come off docs/data/prosody-stats.js — baked curves, no fetch —
// and a value's percentile is its MID-RANK on the curve (ties take the middle
// of their run; between points, interpolate). pctOf below is the one lookup;
// the headline's deviant branch shares it.
//
// THE HEADLINE picks one computed conclusion for the subheader: a CONTRAST
// (a number that means one thing to the corpus and another to its own kind),
// a plain EXTREME, or a census group the chant is RARELY deviant in. The
// deviant branch fires on corpus rarity, not raw distance — raw (1 − t) made
// "unlike the corpus in how it closes" the headline of 31% of the corpus
// (measured 2026-08-11; cadenceFinal typicality is bimodal), so it now fires
// only past the 95th percentile of unlikeness, scored with the extreme
// branch's own formula at that higher bar.
//
// The reference render is working/review/diagram-census-05.html (round 05a);
// geometry is the lab's, doubled onto a grid where the ink system's STEP and
// STROKE rungs land at the size the lab tuned.

import { el } from "../components/tabs.js";
import { keySpur, marks } from "../components/key.js";
import { tabula } from "./tabula.js";
import { INK, RUBRICA, STRATUM, STROKE, STEP, HOUSE_SERIF, HOUSE_MONO, sc } from "./ink.js";
import { scoreOf } from "../components/chant-row.js";
import { massOf } from "../components/feast-index.js";
import stats from "../data/prosody-stats.js";

const NS = "http://www.w3.org/2000/svg";

// The lab's geometry, doubled onto one grid — so the ink system's STEP and
// STROKE rungs render at the size the lab tuned. Every stroke below picks a
// rung and scales it by this, never by a loose number.
const GRID = 2;
// THE WASH under a radar's polygon — ruled 2026-08-11, and deliberately
// beneath every stratum: it is not a mark, it is the shape's own shadow. The
// no-fill rule governs controls and selection; fill inside a figure is fine.
const WASH = 0.08;

/** THE tab's name, on both pages — change it here and nowhere else. */
export const CENSUS_NOMEN = "Census";

function n(tag, attrs, text) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  if (text != null) e.textContent = text;
  return e;
}

// ── the one percentile lookup ──────────────────────────────────────────────
/** Mid-rank percentile of v on a 101-point quantile curve. Ties take the
 *  middle of their run — a curve flat at a common value (phrase counts are
 *  small integers) would otherwise put every such chant at the run's first
 *  point and call the median an extreme. */
export function pctOf(curve, v) {
  if (!curve || v == null || !Number.isFinite(v)) return null;
  let lo = 0;
  while (lo <= 100 && curve[lo] < v) lo++;
  if (lo > 100) return 100;
  let hi = 100;
  while (hi >= 0 && curve[hi] > v) hi--;
  if (hi < 0) return 0;
  if (lo > hi) {
    const a = curve[hi], b = curve[lo];
    return Math.round(hi + (b > a ? (v - a) / (b - a) : 0.5) * (lo - hi));
  }
  return Math.round((lo + hi) / 2);
}

// ── vocabulary ─────────────────────────────────────────────────────────────
// English labels throughout — the Latin here is Jeffrey's, and there is none
// yet. "typical", never "ordinary": ordinary is reserved for the ordinarium.
const COMB_CHANT = [
  { key: "melismaRatio", label: "melisma", words: ["melismatic", "syllabic"] },
  { key: "ambitus", label: "ambitus", words: ["wide", "narrow"] },
  { key: "tessitura", label: "tessitura", words: ["high-lying", "low-lying"] },
  { key: "noteCount", label: "length", words: ["long", "short"] },
  { key: "phraseCount", label: "phrases", words: ["many-phrased", "few-phrased"] },
  { key: "melismaCadential", label: "cadential mel.", words: ["long-closing", "short-closing"] },
];
const COMB_DIES = [
  { key: "chants", label: "chants sung", words: ["crowded", "spare"] },
  { key: "notes", label: "notes sung", words: ["heavy", "light"] },
  { key: "melisma", label: "melisma", words: ["melismatic", "syllabic"] },
  { key: "distance", label: "distance", words: ["unusual", "typical"] },
  { key: "scatter", label: "scatter", words: ["scattered", "clustered"] },
];
const GROUP_NAME = {
  modal: "its modal behaviour", degreeHist: "its degrees",
  melodic: "its melodic turns", trigram: "its three-note figures",
  cadenceFinal: "how it closes", cadenceMedial: "how it breathes",
  chironomy: "its gesture", textual: "its text setting",
};
// THE AXES ARE FIXED — ruled 2026-08-11 ("we don't show them — why do we
// need them?"): the five he lettered, always, in this order. No pickAxes,
// no per-chant variation; every radar on the site is comparable to every
// other because they all stand on the same five spokes. The three unlettered
// groups (modal, chironomy, textual) still speak in the headline's deviant
// branch; they just don't ride the radar.
const AXES = ["degreeHist", "melodic", "trigram", "cadenceMedial", "cadenceFinal"];
const GROUP_LETTER = {
  degreeHist: "D", melodic: "M", trigram: "T",
  cadenceMedial: "MC", cadenceFinal: "FC",
};
// The letters' words, for the sigla — bare, unlike GROUP_NAME's phrases.
const GROUP_WORD = {
  degreeHist: "degrees", melodic: "melodic", trigram: "trigram",
  cadenceMedial: "medial cadence", cadenceFinal: "final cadence",
};
// What each spoke MEASURES. The letter names the axis and the word labels it,
// but neither says what is being counted, and a reader cannot tell "trigram"
// from "melodic" by name alone. These follow the group table in
// ../api/census.md — the same descriptions, shortened to a key's line.
const GROUP_GLOSS = {
  degreeHist: "how long it dwells on each scale degree",
  melodic: "which step follows which, over every pair",
  trigram: "its three-note figures, against the commonest",
  cadenceMedial: "how its interior phrases land",
  cadenceFinal: "how it closes",
};

// ── the sigla, shared by both subjects ──
const combKey = (kind) => keySpur(
  "Each measure runs 0 to 100; the marks place this chant in the corpus and among its own kind.",
  [marks.upright(), "the corpus"], [marks.ring(), kind], [marks.gap(), "the gap"]);
// THE DIRECTION IS THE THING THE KEY NEVER SAID. Each spoke is that group's
// cosine against the corpus mean (see census/types.ts: "low means the chant
// uses this dimension unlike the rest"), so a LONG spoke is typical and a
// short one is not — without that, a big shape and a small one are equally
// readable as "more" of something.
const rowKey = (intro) => keySpur(
  `One radar per chant, five axes of the census; beside this one, ${intro}. `
  + "Each spoke runs from the centre: the further out it reaches, the more "
  + "this chant behaves like the corpus in that dimension — so a wide shape "
  + "is a typical chant, and a pinched one is doing something of its own.",
  ...AXES.map((a) => [marks.text(GROUP_LETTER[a]), GROUP_WORD[a], GROUP_GLOSS[a]]),
  [marks.stem(), "note weight", "where its time is spent, by pitch"],
  [marks.finial(), "the final", "the pitch it comes to rest on"]);
const GENUS_ONE = {
  in: "an Introit", gr: "a Gradual", an: "an antiphon", of: "an Offertory",
  co: "a Communion", al: "an Alleluia", tr: "a Tract", re: "a responsory",
  hy: "a hymn", rb: "a short responsory", or: "an Ordinary chant",
};
const RANK_ONE = {
  "duplex-1": "a first-class Duplex", "duplex-2": "a second-class Duplex",
  "duplex-majus": "a greater Duplex", duplex: "a Duplex",
  semiduplex: "a Semiduplex", simplex: "a Simplex", feria: "a feria",
};
const PC_NAME = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
const ord = (v) => {
  const s = ["th", "st", "nd", "rd"], m = v % 100;
  return v + (s[(m - 20) % 10] || s[m] || s[0]);
};

/** A day's rank, bucketed from festum.ritus — the day's "own kind", where a
 *  chant has its genus. THE BAKE CARRIES A COPY of this function
 *  (scripts/bake-prosody-stats.mjs); change both or a day reads its rank
 *  against the wrong curve. Narrower phrases first: "Duplex II classis"
 *  would otherwise be swallowed by "duplex". */
export const rankOf = (ritus) => {
  const s = (ritus ?? "").toLowerCase();
  if (s.includes("duplex ii classis")) return "duplex-2";
  if (s.includes("i classis") && s.includes("duplex")) return "duplex-1";
  if (s.includes("duplex majus")) return "duplex-majus";
  if (s.includes("semiduplex")) return "semiduplex";
  if (s.includes("duplex")) return "duplex";
  if (s.includes("feria")) return "feria";
  if (s.includes("simplex")) return "simplex";
  return "aliud";
};

// ── a reading's section: the panel's own h2, the key's spur at its right ──
const section = (title, spur, ...body) =>
  el("section", { class: "panel" }, el("h2", {}, title, spur), ...body);

// ── 1 · the percentile comb ────────────────────────────────────────────────
// One hairline per metric, 0 to 100. Two marks: an ink upright for the whole
// corpus, a rubrica-ringed circle for the subject's own kind. The heavy
// segment between them is the gap, and THE GAP IS THE FINDING. A metric with
// no kind-curve (a genus under the n≥20 floor) keeps its corpus mark and
// simply has no circle — the comparison degrades to absent, not to zero.
export function comb(rows) {
  // No drawn scale — ruled 2026-08-11: the hairline runs 0 to 100 and the
  // marks' positions carry it; a numbered axis said percentile twice.
  const W = 440, padL = 82, padR = 34, rowH = 25, top = 6;
  const H = top + rows.length * rowH + 8;
  const X = (p) => padL + (p / 100) * (W - padL - padR);
  const svg = n("svg", {
    class: "census-comb", viewBox: `0 0 ${W} ${H}`, xmlns: NS,
    role: "img", "aria-label": "The subject's percentiles, against the whole"
      + " corpus and against its own kind",
  });
  rows.forEach((r, i) => {
    const y = top + i * rowH + 7;
    svg.append(n("line", { x1: padL, y1: y, x2: W - padR, y2: y,
      stroke: INK, "stroke-opacity": STRATUM.rail, "stroke-width": STROKE.hair }));
    // The metric's name is a word, so it is serif — faces have jobs.
    svg.append(n("text", { x: padL - 8, y: y + 3, "text-anchor": "end",
      "font-family": HOUSE_SERIF, "font-size": STEP.micro,
      fill: INK, "fill-opacity": STRATUM.letters }, r.label));
    if (r.genus != null && Math.abs(r.all - r.genus) > 6)
      svg.append(n("line", { x1: X(r.all), y1: y, x2: X(r.genus), y2: y,
        stroke: INK, "stroke-opacity": STRATUM.bracket, "stroke-width": STROKE.heavy }));
    svg.append(n("line", { x1: X(r.all), y1: y - 5, x2: X(r.all), y2: y + 5,
      stroke: INK, "stroke-width": STROKE.firm }));
    if (r.genus != null)
      svg.append(n("circle", { cx: X(r.genus), cy: y, r: 2.7,
        fill: "var(--paper, #FDFDFC)", stroke: RUBRICA, "stroke-width": STROKE.firm }));
    if (r.raw != null)
      // STEP.micro, optically corrected: the mono face runs large beside the
      // serif label at the same step, so the value takes the step at 0.8 —
      // a size match, not a new rung (as tracking is optical, so is this).
      svg.append(n("text", { x: W - padR + 5, y: y + 3,
        "font-family": HOUSE_MONO, "font-size": STEP.micro * 0.8,
        fill: INK, "fill-opacity": STRATUM.rail }, r.raw));
  });
  return svg;
}

// ── 2 · the row of four ────────────────────────────────────────────────────
// A radar of one says nothing (round 01's verdict); four on axes chosen by
// where they most DISAGREE is a comparison. Geometry is the lab's at twice
// the grid, so the ink system's steps land at the lab's tuned size.

function smallRadar(cell, axes, labeled, accent) {
  const W = 224, R = 66, cx = W / 2, cy = W / 2 + 2;
  const svg = n("svg", { class: "census-radar", viewBox: `0 0 ${W} ${W}`,
    xmlns: NS, role: "img",
    "aria-label": `${cell.incipit} — census typicality on ${axes.length} axes` });
  const g = n("g", { transform: `translate(${cx},${cy})` });
  svg.append(g);
  const N = axes.length;
  const ang = (i) => (i / N) * 2 * Math.PI;
  const pol = (a, r) => [r * Math.sin(a), -r * Math.cos(a)];
  g.append(n("polygon", {
    points: axes.map((_, i) => pol(ang(i), R).map((v) => v.toFixed(1)).join(",")).join(" "),
    fill: "none", stroke: INK, "stroke-opacity": STRATUM.bracket,
    "stroke-width": STROKE.hair * GRID }));
  axes.forEach((ax, i) => {
    const [x, y] = pol(ang(i), R);
    g.append(n("line", { x1: 0, y1: 0, x2: x.toFixed(1), y2: y.toFixed(1),
      stroke: INK, "stroke-opacity": STRATUM.rail, "stroke-width": STROKE.hair * GRID }));
    if (labeled) {
      const [lx, ly] = pol(ang(i), R + 16);
      // The point's LETTER — a capital, large enough to read at the row's
      // real size, tracked as capitals are.
      g.append(n("text", { x: lx.toFixed(1), y: (ly + 5).toFixed(1),
        "text-anchor": "middle", "font-family": HOUSE_SERIF,
        "font-size": STEP.body, "letter-spacing": "0.05em",
        fill: INK, "fill-opacity": STRATUM.letters },
        GROUP_LETTER[ax]));
    }
  });
  const verts = axes.map((ax, i) => pol(ang(i), R * (cell.p?.[ax] ?? 0)));
  g.append(n("polygon", {
    points: verts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join(" "),
    fill: INK, "fill-opacity": WASH,
    stroke: accent ? RUBRICA : INK, "stroke-width": STROKE.firm * GRID,
    "stroke-linejoin": "round" }));
  return svg;
}

// THE NOTE WEIGHT — twelve slots, a stem where the chant spends its time.
// Height carries the weight and nothing else: no thickness channel, no fill.
// The tallest stem is named above itself; the FINAL is named the same way —
// its letter over a rubrica triangle pointing down at its stem — which is
// what makes four modes readable side by side. When the final IS the tallest
// the rubrica naming serves for both; two labels on one stem would collide
// and say one thing twice. Absolute pitch classes, not folded to each final
// — ruled: the fact worth showing is that a mass does not share a home.
function weightChart(cell, accent) {
  const W = 224, H = 58, padX = 10, base = 50, STEM = 26;
  const svg = n("svg", { class: "census-weight", viewBox: `0 0 ${W} ${H}`,
    xmlns: NS, role: "img",
    "aria-label": `${cell.incipit} — where its weight falls, by pitch class` });
  const step = (W - padX * 2) / 12;
  const X = (pc) => padX + (pc + 0.5) * step;
  const ws = Object.entries(cell.w ?? {}).map(([k, v]) => [+k, v]);
  const max = Math.max(...ws.map(([, v]) => v), 1e-6);
  svg.append(n("line", { x1: padX, y1: base, x2: W - padX, y2: base,
    stroke: INK, "stroke-opacity": STRATUM.rail, "stroke-width": STROKE.hair * GRID }));
  let top = null;
  for (const [pc, v] of ws) {
    const h = (v / max) * STEM;
    // The RULED 2px stem, on the grid. Its width carries nothing — height
    // is the weight — so it never varies. The company sits at the wave's
    // own stratum; the subject re-inks at the label's.
    svg.append(n("line", {
      x1: sc(X(pc)), y1: base, x2: sc(X(pc)), y2: sc(base - h),
      stroke: accent ? RUBRICA : INK,
      "stroke-opacity": accent ? STRATUM.label : STRATUM.wave,
      "stroke-width": 2 * GRID,
      "stroke-linecap": "butt" }));
    if (!top || v > top[1]) top = [pc, v];
  }
  if (top && top[0] !== cell.finalPc)
    svg.append(n("text", { x: sc(X(top[0])), y: sc(base - (top[1] / max) * STEM - 6),
      "text-anchor": "middle", "font-family": HOUSE_SERIF,
      "font-size": STEP.label, fill: INK, "fill-opacity": STRATUM.letters },
      PC_NAME[top[0]]));
  if (cell.finalPc != null) {
    const h = ((cell.w?.[cell.finalPc] ?? 0) / max) * STEM;
    const x = X(cell.finalPc);
    svg.append(n("path", { d: `M ${sc(x - 4.5)} ${sc(base - h - 10)} `
      + `L ${sc(x + 4.5)} ${sc(base - h - 10)} L ${sc(x)} ${sc(base - h - 3)} Z`,
      fill: RUBRICA }));
    svg.append(n("text", { x: sc(x), y: sc(base - h - 14), "text-anchor": "middle",
      "font-family": HOUSE_SERIF, "font-size": STEP.label,
      fill: RUBRICA }, PC_NAME[cell.finalPc]));
  }
  return svg;
}

/** The row: up to four cells, each a radar over a weight chart over its name.
 *  `ipse` marks the first cell as the subject for the chant reading — the
 *  rubrica stroke alone does that work; a day has no subject and passes
 *  false. No commentary beneath: the charts are the finding, and the point
 *  letters and rubrica finals say what a sentence used to.
 *
 *  With `onSelect`, every cell but the subject is a CHOICE and loads its
 *  chant — so the names sit at --label like the chant rows' untaken
 *  choices, and hover brings one to ink. The subject is already open;
 *  clicking it would go nowhere, so it is not a button. */
function censusRow(cells, { ipse = false, onSelect } = {}) {
  const axes = AXES;
  return el("div", { class: "census-row" },
    ...cells.map((c, i) => {
      const isSubject = ipse && i === 0;
      const body = [
        smallRadar(c, axes, i === 0, isSubject),
        weightChart(c, isSubject),
        el("p", { class: "census-who" },
          c.incipit.length > 17 ? c.incipit.slice(0, 16) + "…" : c.incipit),
        el("p", { class: "census-meta" },
          [c.kind, (c.modus ?? "").replace("Modus ", "")].filter(Boolean).join(" · ")),
      ];
      return el("div", { class: isSubject ? "subject" : null },
        onSelect && !isSubject && c.chant
          ? el("button", { type: "button",
              onclick: () => onSelect(c.chant) }, ...body)
          : body);
    }),
  );
}

// ── 3 · the numbers, as tabulas ────────────────────────────────────────────
// tabula() with its gloss column — built and never used until now — one small
// table per group, titled by the tabula's own caption.
const NUM_COLS = [
  { key: "k", head: "" },
  { key: "v", head: "", mono: true, num: true, gloss: (r) => r.g ?? "" },
];
const numTable = (caption, rows) =>
  tabula(rows.filter((r) => r.v != null && r.v !== ""), NUM_COLS, { caption });

function prosodyTables(tonus, p) {
  const m = p.intervals?.motus;
  // Pitches are NAMED, not numbered — a reader of this table thinks in G2
  // and F3, and 43–52 is the library's currency, not the book's.
  const T = tonus.temperamentum({});
  const spn = (v) => (v == null ? null : (T.nota(v)?.spn ?? String(v)));
  return [
    numTable("extent", [
      { k: "notes", v: p.noteCount },
      { k: "syllables", v: p.syllableCount },
      { k: "phrases", v: p.phraseCount },
    ]),
    numTable("melisma", [
      { k: "notes to the syllable", v: sc(p.melismaRatio) },
      { k: "at the cadence", v: sc(p.melismaCadential) },
    ]),
    numTable("range", [
      { k: "ambitus", v: p.ambitus,
        g: p.noteRange ? `${spn(p.noteRange.min)}–${spn(p.noteRange.max)}` : "" },
      { k: "tessitura", v: p.tessitura == null ? null : sc(p.tessitura),
        g: "above the final" },
      { k: "the arch", v: p.arcus ? sc(p.arcus.archIndex) : null,
        g: p.arcus
          ? `${spn(p.arcus.initial)} → ${spn(p.arcus.peak)} → ${spn(p.arcus.final)}`
          : "" },
    ]),
    numTable("motion", [
      { k: "step / skip / leap", v: m ? `${m.step} / ${m.skip} / ${m.leap}` : null },
      { k: "largest leap", v: p.intervals?.maxLeap, g: "semitones" },
      { k: "leap rate", v: p.intervals?.leapRate == null
        ? null : sc(p.intervals.leapRate) },
    ]),
    numTable("rhythm", [
      { k: "arsis / thesis", v: p.rhythmicProfile
        ? `${p.rhythmicProfile.arsic} / ${p.rhythmicProfile.thetic}` : null },
      { k: "group, mean / longest", v: p.rhythmicProfile
        ? `${sc(p.rhythmicProfile.avgGroupSize)} / ${p.rhythmicProfile.maxGroupSize}` : null },
      { k: "ictus rate", v: sc(p.ictusRate) },
    ]),
    // The cadences whole: the weight, then every mark the chant closes a
    // phrase with — a zero is a count, not an absence, so all five show.
    numTable("cadences", [
      { k: "weight", v: sc(p.cadenceWeight) },
      { k: "comma", v: p.cadenceDistribution?.comma },
      { k: "tick", v: p.cadenceDistribution?.tick },
      { k: "semicolon", v: p.cadenceDistribution?.semicolon },
      { k: "colon", v: p.cadenceDistribution?.colon },
      { k: "double bar", v: p.cadenceDistribution?.doubleBar },
    ]),
  ];
}

// ── the headline ───────────────────────────────────────────────────────────
function candidates(rows, oneWord, poolWord) {
  const cands = [];
  for (const r of rows) {
    if (r.genus != null && Math.abs(r.all - r.genus) > 16) {
      const w = r.all >= 50 ? r.words[0] : r.words[1];
      const gTypical = r.genus >= 28 && r.genus <= 72;
      const gw = gTypical ? "typical" : (r.genus >= 50 ? r.words[0] : r.words[1]);
      cands.push({ score: Math.abs(r.all - r.genus) * 1.3,
        text: `${w} for the ${poolWord}, ${gw} for ${oneWord}` });
    }
    if (Math.abs(r.all - 50) > 30) {
      const w = r.all >= 50 ? r.words[0] : r.words[1];
      cands.push({ score: Math.abs(r.all - 50) * 1.4,
        text: `${w} — the ${ord(r.all)} percentile of the ${poolWord}` });
    }
  }
  return cands;
}

/** The deviant candidate: the group the subject is most RARELY deviant in.
 *  Fires only past the 95th percentile of unlikeness on the baked typicality
 *  curves — see the header for the measurement that ruled this. */
function deviantCandidate(profile) {
  if (!profile) return null;
  let best = null;
  for (const [g, v] of Object.entries(profile)) {
    const t = v?.typicality ?? v;
    if (!Number.isFinite(t)) continue;
    const rarity = 100 - (pctOf(stats.typicality?.groups?.[g], t) ?? 100);
    if (!best || rarity > best.rarity) best = { g, rarity };
  }
  if (!best || best.rarity <= 95) return null;
  return { score: (best.rarity - 50) * 1.4,
    text: `unlike the corpus in ${GROUP_NAME[best.g] ?? best.g}` };
}

const speak = (cands, fallthrough) => {
  cands.sort((a, b) => b.score - a.score);
  return cands[0]?.text ?? fallthrough;
};

// ── the chant's data ───────────────────────────────────────────────────────
function chantCombRows(prosody, office) {
  const genus = stats.groups[office];
  const rows = [];
  for (const m of COMB_CHANT) {
    const v = m.key === "melismaCadential" ? prosody.melismaCadential
      : m.key === "melismaRatio" ? prosody.melismaRatio
      : prosody[m.key];
    const all = pctOf(stats.groups.all.curves[m.key], v);
    if (all == null) continue;
    rows.push({ ...m, all, genus: genus ? pctOf(genus.curves[m.key], v) : null,
      raw: sc(v) });
  }
  return rows;
}

const flatten = (profile) => {
  const p = {};
  for (const [g, v] of Object.entries(profile ?? {}))
    if (Number.isFinite(v?.typicality ?? v)) p[g] = v?.typicality ?? v;
  return p;
};

/** A chant as a row cell: its profile, its weight, its final, its name —
 *  and the chant itself, so a click can open it. */
function cellOf(tonus, chant, profile) {
  const score = scoreOf(tonus, chant);
  if (!score) return null;
  return {
    chant, incipit: chant.incipit,
    // What a chant IS, not a shelf code — the same rule the chant rows
    // follow: an ordinary is named by its own text, which replaces its
    // genus rather than joining it.
    kind: chant.ordinarium || chant.genus,
    modus: chant.modus,
    p: profile, w: score.imprint?.pcDistribution ?? {},
    finalPc: score.prosody?.arcus ? score.prosody.arcus.final % 12 : null,
  };
}

export function censusHeadline(tonus, { chant, score }) {
  if (!chant || !score?.prosody) return "";
  const rows = chantCombRows(score.prosody, chant.office);
  const cands = candidates(rows, GENUS_ONE[chant.office] ?? "its kind", "corpus");
  try {
    const dev = deviantCandidate(tonus.census({ id: chant.id, k: 0 }).profile);
    if (dev) cands.push(dev);
  } catch { /* a chant the census cannot place still gets its metrics */ }
  return speak(cands, "close to the corpus mean throughout");
}

/** The reading, chant as subject. */
export function censusPanel(tonus, { chant, score, year, onSelect }) {
  if (!chant || !score?.prosody)
    return el("p", { class: "ghost" }, "Nothing to read.");
  const wrap = el("div", {});
  const rows = chantCombRows(score.prosody, chant.office);
  wrap.append(section("how it compares", combKey("its own genus"), comb(rows)));

  // The mass: the feast this chant is first sung at, and of its chants the
  // THREE MOST DISTANT from the subject by census profile — the row exists to
  // show disagreement, and liturgical order is an arbitrary cut that can hide
  // the interesting one. Fewer than two siblings: no row of one.
  let profile = null;
  try { profile = flatten(tonus.census({ id: chant.id, k: 0 }).profile); }
  catch { /* outside the census — the reading renders without its parts */ }
  const mass = profile ? massOf(tonus, chant, year) : null;
  if (mass && mass.siblings.length >= 2) {
    const sibs = mass.siblings.map((c) => {
      let p = null;
      try { p = flatten(tonus.census({ id: c.id, k: 0 }).profile); }
      catch { return null; }
      const gap = Object.keys(profile)
        .filter((g) => p[g] != null)
        .map((g) => Math.abs(profile[g] - p[g]));
      return { chant: c, p,
        dist: gap.length ? gap.reduce((a, b) => a + b, 0) / gap.length : 0 };
    }).filter(Boolean);
    sibs.sort((a, b) => b.dist - a.dist
      || String(a.chant.id).localeCompare(String(b.chant.id), "en", { numeric: true }));
    const cells = [cellOf(tonus, chant, profile),
      ...sibs.slice(0, 3).map((s) => cellOf(tonus, s.chant, s.p))].filter(Boolean);
    // "the feast, compared" — RULED 2026-08-11: the pool STAYS the whole
    // feast (the richer comparison; a Matins responsory may rightly top the
    // divergent set) and the title says so. The DAY tab's pool is the mass,
    // and its title keeps the word.
    // "the divergent set" — his own phrase for the row, and truer than
    // "the feast, compared": the FEAST is only the pool it is drawn from;
    // what the row shows is divergence from the subject. The card's first
    // line says the pool, so the title need not.
    if (cells.length >= 3)
      wrap.append(section("the divergent set",
        rowKey("its feast's three most unlike this chant"),
        censusRow(cells, { ipse: true, onSelect })));
  }

  // "the numbers" — English, like every census section title beside it
  // (numeri was the one Latin word in an English set; re-ruled 2026-08-11).
  // The FIELD is still .prosody — only the shown title differs.
  wrap.append(section("the numbers", null, ...prosodyTables(tonus, score.prosody)));
  return wrap;
}

// ── the day's data ─────────────────────────────────────────────────────────
// Day-native metrics — what a day has that a chant does not — percentiled
// against the year's 365 days and against the day's own RANK. Never a mean of
// radars: the day's row IS its chants, the four most deviant of them.
const distanceMemo = new Map();
function distanceOf(tonus, id) {
  if (!distanceMemo.has(id)) {
    try { distanceMemo.set(id, tonus.census({ id, k: 0 }).balance.distance); }
    catch { distanceMemo.set(id, null); }
  }
  return distanceMemo.get(id);
}

function dayMetrics(tonus, rows) {
  const chants = rows.map((r) => r.chant);
  const ps = chants.map((c) => scoreOf(tonus, c)?.prosody).filter(Boolean);
  const ds = chants.map((c) => ({ c, d: distanceOf(tonus, c.id) }))
    .filter((x) => Number.isFinite(x.d));
  const mean = (vs) => vs.reduce((a, b) => a + b, 0) / vs.length;
  const mels = ps.map((p) => p.melismaRatio).filter(Number.isFinite);
  const dist = ds.length ? mean(ds.map((x) => x.d)) : null;
  return {
    chants: chants.length,
    notes: ps.reduce((a, p) => a + (p.noteCount ?? 0), 0),
    melisma: mels.length ? mean(mels) : null,
    distance: dist,
    scatter: ds.length > 1 && dist != null
      ? Math.sqrt(mean(ds.map((x) => (x.d - dist) ** 2))) : null,
    ranked: ds.sort((a, b) => b.d - a.d
      || String(a.c.id).localeCompare(String(b.c.id), "en", { numeric: true })),
  };
}

function dayCombRows(m, rank) {
  const own = stats.dies.groups[rank];
  const rows = [];
  for (const d of COMB_DIES) {
    const all = pctOf(stats.dies.groups.all.curves[d.key], m[d.key]);
    if (all == null) continue;
    rows.push({ ...d, all, genus: own ? pctOf(own.curves[d.key], m[d.key]) : null,
      raw: m[d.key] == null ? null : sc(m[d.key]) });
  }
  return rows;
}

export function censusDiesHeadline(tonus, { feast, rows }) {
  if (!rows?.length) return "";
  const m = dayMetrics(tonus, rows);
  const rank = rankOf(feast?.ritus);
  const combRows = dayCombRows(m, rank);
  const cands = candidates(combRows, RANK_ONE[rank] ?? "its rank", "year");
  return speak(cands, "close to the year's mean throughout");
}

/** The reading, day as subject. */
export function censusDiesPanel(tonus, { feast, rows, onSelect }) {
  if (!rows?.length)
    return el("p", { class: "ghost" }, "Nothing is sung today.");
  const m = dayMetrics(tonus, rows);
  const rank = rankOf(feast?.ritus);
  const combRows = dayCombRows(m, rank);
  const wrap = el("div", {});
  wrap.append(section("how it compares", combKey("its own rank"), comb(combRows)));

  // THE MASS — ruled 2026-08-11: the day's radar row is its mass, propers
  // and ordinary, because the mass is the day's own music; the office hours
  // stay in the comb and the table. Within that pool the four most deviant
  // ride the row — the row exists to show disagreement — ranked by census
  // distance, ties on lower id. (The chant tab's row is different by rule:
  // there it is the three siblings most distant FROM THE SUBJECT.)
  const massIds = new Set(rows
    .filter((r) => r.office?.key === "proprium" || r.office?.key === "ordinarium")
    .map((r) => r.chant.id));
  const four = m.ranked.filter(({ c }) => massIds.has(c.id)).slice(0, 4)
    .map(({ c }) => {
      let p = null;
      try { p = flatten(tonus.census({ id: c.id, k: 0 }).profile); }
      catch { return null; }
      return cellOf(tonus, c, p);
    }).filter(Boolean);
  if (four.length >= 3)
    wrap.append(section("the mass, compared",
      rowKey("the four of the mass most unlike the corpus"),
      censusRow(four, { ipse: false, onSelect })));

  const far = m.ranked[0], near = m.ranked[m.ranked.length - 1];
  wrap.append(section("the day", null,
    numTable("extent", [
      { k: "chants", v: m.chants },
      { k: "notes", v: m.notes },
      { k: "melisma, mean", v: m.melisma == null ? null : sc(m.melisma) },
    ]),
    numTable("census", [
      { k: "distance, mean", v: m.distance == null ? null : sc(m.distance) },
      { k: "scatter", v: m.scatter == null ? null : sc(m.scatter) },
      far && { k: "farthest", v: sc(far.d), g: far.c.incipit },
      near && far !== near && { k: "nearest", v: sc(near.d), g: near.c.incipit },
    ].filter(Boolean)),
  ));
  return wrap;
}
