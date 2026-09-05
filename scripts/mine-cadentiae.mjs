// ---------------------------------------------------------------------------
// scripts/mine-cadentiae — the full-corpus phrase-end tally behind CADENTIAE
// ---------------------------------------------------------------------------
// Walks the SUNG corpus, deduped by chant id — the same chants data/census.ts
// blocks (CENSUS_ORDER), which is what "the table and the census count the same
// chants" means — and keys every phrase end with THE shared key function
// (cadenceKeys, engines/score/cadence.ts): no second key parser. Tallies both
// levels, genus and species, with counts and final-close counts per mode.
//
// Run from repo root, after a build:  node scripts/mine-cadentiae.mjs
// Then bake:                          node scripts/bake-cadentiae.mjs
//
// Emits working/qa-sweep/cadentiae-tally.json — every genus and species, no
// floor; the bake applies the floor. The engine fingerprint rides the artifact
// so the bake can say whether the engine moved since the mine.
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { engineFingerprint } from "./engine-fingerprint.mjs";
import t from "../dist/index.js";
import { CENSUS_ORDER } from "../dist/data/census.js";
import { buildScore, cadenceKeys } from "../dist/engines/score/api.js";

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dir, "../working/qa-sweep");
const OUT = resolve(OUT_DIR, "cadentiae-tally.json");

const genera = new Map(); // genus key -> { motion, degree, n, F, modes, closes, species: Map }
const byMode = {};
let ends = 0, chants = 0, failed = 0;

const bump = (rec, m, isFinal) => {
  rec.n++;
  rec.modes[m] = (rec.modes[m] ?? 0) + 1;
  if (isFinal) {
    rec.F++;
    rec.closes[m] = (rec.closes[m] ?? 0) + 1;
  }
};

for (const id of CENSUS_ORDER) {
  const ch = t.cantus({ id })[0];
  if (!ch) continue;
  let sc;
  try { sc = buildScore(ch); } catch { failed++; continue; }
  chants++;
  // The mode DIGIT. Labels carry differentiae ("8g", "1a2"); first digit in
  // 1..8, else "?".
  const m = String(ch.mode ?? "").match(/[1-8]/)?.[0] ?? "?";
  for (const e of cadenceKeys(sc.tabula)) {
    ends++;
    byMode[m] = (byMode[m] ?? 0) + 1;
    let g = genera.get(e.genus);
    if (!g) {
      genera.set(e.genus, (g = {
        motion: e.motion, degree: e.degree, n: 0, F: 0, modes: {}, closes: {}, species: new Map(),
      }));
    }
    bump(g, m, e.isFinal);
    let s = g.species.get(e.species);
    if (!s) g.species.set(e.species, (s = { tail: e.tail, n: 0, F: 0, modes: {}, closes: {} }));
    bump(s, m, e.isFinal);
  }
}

const byCount = (a, b) => b.n - a.n || (a.key < b.key ? -1 : 1);
const out = {
  engineFingerprint: engineFingerprint(),
  population: "sung corpus, deduped by chant id (data/census.ts CENSUS_ORDER)",
  key: "letter steps from the sounded final; interior repeats collapsed, the landing's kept; tail 3",
  chants, failed, ends, byMode,
  genera: [...genera.entries()]
    .map(([key, g]) => ({
      key, motion: g.motion, degree: g.degree, n: g.n, F: g.F, modes: g.modes, closes: g.closes,
      species: [...g.species.entries()]
        .map(([key, s]) => ({ key, tail: s.tail, n: s.n, F: s.F, modes: s.modes, closes: s.closes }))
        .sort(byCount),
    }))
    .sort(byCount),
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT, JSON.stringify(out));
const species = out.genera.reduce((a, g) => a + g.species.length, 0);
console.log(`chants ${chants} (failed ${failed}), ends ${ends}, genera ${out.genera.length}, species ${species} -> ${OUT}`);
