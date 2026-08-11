#!/usr/bin/env node
// ---------------------------------------------------------------------------
// scripts/bake-prosody-stats — the Census reading's percentile curves
// ---------------------------------------------------------------------------
// Bakes docs/data/prosody-stats.js: every chant with gabc (the censused
// 2,187) → notatio → prosody, sorted into 101-point quantile curves for the
// whole corpus and per genus (genus groups kept only at n >= 20). Site data
// for a site figure — the comb reads its percentiles from this file, and the
// site has no fetch, so it ships as a frozen const and is imported like any
// module.
//
// The file also carries the DIES curves — the Calendarium Census comb's
// day-native metrics (chants sung, notes sung, mean melisma, mean census
// distance, scatter), 101 points over the 365 days of the library's own
// year, for the whole year and per RANK (the day's own kind, where the
// chant's comb has genus). rankOf() below must match the site's copy.
//
// And the census profile's TYPICALITY curves, one per
// group. The subheader's deviant branch fires on corpus rarity — "is this
// chant in the bottom five percent for this group" — not on raw distance.
// Raw distance was measured 2026-08-11 and rejected: cadenceFinal typicality
// is bimodal (a quarter of the corpus sits below 0.10), so (1 − t) made
// "unlike the corpus in how it closes" the headline of 685 of 2,187 chants —
// 31%, a phrase that would almost never change. Rarity spreads the branch
// across all eight groups and caps the commonest headline at ~6%.
//
// Re-run after anything that moves prosody or the census — a notation fix, a
// corpus change, a census re-bake — from the repo root:
//
//   node scripts/bake-prosody-stats.mjs
//
// It reads the BUILT library, so build first if src has moved.

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import tonus from "../dist/index.js";
import { ORDINARIA } from "../dist/engines/chant/types.js";

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dir, "../docs/data/prosody-stats.js");

// Genus groups below this count say nothing stable about their kind.
const FLOOR = 20;
const POINTS = 101;
const METRICS = ["melismaRatio", "leapRate", "ambitus", "tessitura",
  "noteCount", "phraseCount", "melismaCadential"];
const CENSUS_GROUPS = ["modal", "degreeHist", "melodic", "trigram",
  "cadenceFinal", "cadenceMedial", "chironomy", "textual"];

// ── the population: every chant with gabc ──
// The shelf, plus the Kyriale — which cantus() only surrenders by `ordinary`,
// deliberately (see chant.ts: you ask for a Kyrie, you do not stumble onto
// one). Here it is asked for, part by part.
const seen = new Map();
for (const c of tonus.cantus({ limit: 100000 })) if (c.gabc) seen.set(c.id, c);
for (const code of Object.keys(ORDINARIA))
  for (const c of tonus.cantus({ ordinary: code, limit: 9999 }))
    if (c.gabc) seen.set(c.id, c);
const chants = [...seen.values()];

// ── prosody per chant ──
const rows = [];
let failed = 0;
for (const c of chants) {
  try {
    const p = tonus.notatio(c).prosody;
    rows.push({
      office: c.office, id: c.id,
      melismaRatio: p.melismaRatio, leapRate: p.intervals?.leapRate,
      ambitus: p.ambitus, tessitura: p.tessitura,
      noteCount: p.noteCount, phraseCount: p.phraseCount,
      melismaCadential: p.melismaCadential,
    });
  } catch { failed++; }
}

// ── 101-point quantile curves, linearly interpolated ──
const quantiles = (values) => {
  const s = [...values].sort((a, b) => a - b);
  if (!s.length) return null;
  const out = [];
  for (let p = 0; p < POINTS; p++) {
    const x = (p / (POINTS - 1)) * (s.length - 1);
    const i = Math.floor(x), f = x - i;
    const v = f ? s[i] * (1 - f) + s[i + 1] * f : s[i];
    out.push(Math.round(v * 1000) / 1000);
  }
  return out;
};

const groupOf = (rowsIn) => {
  const curves = {};
  for (const m of METRICS) {
    const vs = rowsIn.map((r) => r[m]).filter((v) => v != null && Number.isFinite(v));
    const c = quantiles(vs);
    if (c) curves[m] = c;
  }
  return { n: rowsIn.length, curves };
};

const groups = { all: groupOf(rows) };
const byOffice = {};
for (const r of rows) (byOffice[r.office] ??= []).push(r);
for (const [k, v] of Object.entries(byOffice))
  if (v.length >= FLOOR) groups[k] = groupOf(v);

// ── the typicality curves: census profile[group].typicality per chant ──
const profiles = [];
for (const r of rows) {
  try { profiles.push(tonus.census({ id: r.id, k: 0 }).profile); } catch {}
}
const typicality = { n: profiles.length, groups: {} };
for (const g of CENSUS_GROUPS) {
  const vs = profiles.map((p) => p[g]?.typicality).filter(Number.isFinite);
  const c = quantiles(vs);
  if (c) typicality.groups[g] = c.map((v) => Math.round(v * 10000) / 10000);
}

// ── the dies curves: the day-native metrics, over one year ──
// A day's rank, bucketed from festum.ritus. Test the narrower phrase first —
// "Duplex II classis" would otherwise be swallowed by "duplex". THE SITE
// CARRIES A COPY of this function (diagrams/census.js); change both or the
// day reads its rank against the wrong curve.
const rankOf = (ritus) => {
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

const DIES_YEAR = 991;   // the library's own default year
const DIES_METRICS = ["chants", "notes", "melisma", "distance", "scatter"];
const OFFICES = [
  (f) => tonus.proprium({ feast: f }),
  (f) => tonus.ordinarium({ feast: f }),
  (f) => tonus.officium({ feast: f, hora: "matutinum" }),
  (f) => tonus.officium({ feast: f, hora: "laudes" }),
  (f) => tonus.officium({ feast: f, hora: "vesperae" }),
];

// Memoised per chant — the same antiphon returns day after day, so the year
// costs one corpus pass, not 365 of them.
const prosodyOf = new Map(rows.map((r) => [r.id, r]));
const distanceOf = new Map();
const chantDistance = (id) => {
  if (!distanceOf.has(id)) {
    try { distanceOf.set(id, tonus.census({ id, k: 0 }).balance.distance); }
    catch { distanceOf.set(id, null); }
  }
  return distanceOf.get(id);
};

const dayRows = [];
for (let d = 0; d < 365; d++) {
  const date = new Date(Date.UTC(DIES_YEAR, 0, 1 + d));
  const [feast] = tonus.festum({ date });
  if (!feast) continue;
  const seenDay = new Set();
  const day = [];
  for (const of_ of OFFICES) {
    let cs = [];
    try { cs = of_(feast).filter((c) => c.gabc); } catch { cs = []; }
    for (const c of cs) if (!seenDay.has(c.id) && seenDay.add(c.id)) day.push(c);
  }
  if (!day.length) continue;
  const ps = day.map((c) => prosodyOf.get(c.id)).filter(Boolean);
  const ds = day.map((c) => chantDistance(c.id)).filter(Number.isFinite);
  const mean = (vs) => vs.reduce((a, b) => a + b, 0) / vs.length;
  const mDist = ds.length ? mean(ds) : null;
  dayRows.push({
    rank: rankOf(feast.ritus),
    chants: day.length,
    notes: ps.reduce((a, p) => a + (p.noteCount ?? 0), 0),
    melisma: ps.length ? mean(ps.map((p) => p.melismaRatio).filter(Number.isFinite)) : null,
    distance: mDist,
    scatter: ds.length > 1 && mDist != null
      ? Math.sqrt(mean(ds.map((v) => (v - mDist) ** 2))) : null,
  });
}

const diesGroupOf = (rs) => {
  const curves = {};
  for (const m of DIES_METRICS) {
    const vs = rs.map((r) => r[m]).filter((v) => v != null && Number.isFinite(v));
    const c = quantiles(vs);
    if (c) curves[m] = c;
  }
  return { n: rs.length, curves };
};
const diesGroups = { all: diesGroupOf(dayRows) };
const byRank = {};
for (const r of dayRows) (byRank[r.rank] ??= []).push(r);
for (const [k, v] of Object.entries(byRank))
  if (v.length >= FLOOR) diesGroups[k] = diesGroupOf(v);
const dies = { year: DIES_YEAR, n: dayRows.length, metrics: DIES_METRICS,
  groups: diesGroups };

// ── the module ──
const stats = { metrics: METRICS, n: rows.length, groups, typicality, dies };
const body = `// ---------------------------------------------------------------------------
// docs/data/prosody-stats — the Census reading's percentile curves
// ---------------------------------------------------------------------------
// GENERATED by scripts/bake-prosody-stats.mjs — do not edit by hand.
//
// 101-point quantile curves over the ${rows.length} chants with gabc: the
// prosody metrics for the comb (whole corpus + per genus at n >= ${FLOOR}),
// the census typicality per group for the subheader's deviant branch, and
// the day-native dies curves (year ${DIES_YEAR}, whole year + per rank).
// A value's percentile is its mid-rank position on the curve.

export default Object.freeze(${JSON.stringify(stats)});
`;
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, body);
console.log(`bake-prosody-stats: ${rows.length} chants (${failed} failed), ` +
  `groups ${Object.keys(groups).join(" ")}, ` +
  `typicality n=${typicality.n}, ` +
  `dies ${dies.n} days [${Object.keys(diesGroups).join(" ")}], ` +
  `${(body.length / 1024).toFixed(1)} KB → ${OUT}`);
