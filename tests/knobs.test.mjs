import { describe, test } from "node:test";
import assert from "node:assert/strict";
import tonus from "../dist/index.js";
import { knobProfiles, hasKnobs, interpretKnobs } from "../dist/engines/score/knobs.js";
import { PHRASING_PROFILES } from "../dist/engines/score/phrasing.js";
import { ARTICULATION_PROFILES } from "../dist/engines/score/articulation.js";

// The public surface is tonus.notatio; the three engine imports are the
// reference tables the knobs are checked against, not the thing under test.
const buildScore = (c, o) => tonus.notatio(c, o);

const GABC = "(c4) Ky(g)ri(h)e(g.) (,) e(h)le(ih)i(g)son.(f.) (::)";
const chant = { id: "t:1", incipit: "Test", gabc: GABC, office: "or", genus: "Ordinarium", mode: "1" };

const velocities = (s) => s.tabula.map((r) => r.velocity);
const durations = (s) => s.tabula.map((r) => r.shapedDuration);

describe("the five knobs", () => {
  test("0.5 everywhere is lyrical and balanced, number for number", () => {
    const { articulation, phrasing } = knobProfiles({ pondus: 0.5, modulatio: 0.5, cadentia: 0.5, expressio: 0.5 });
    for (const [k, v] of Object.entries(phrasing)) assert.equal(v, PHRASING_PROFILES.lyrical[k], k);
    for (const [k, v] of Object.entries(articulation)) {
      if (k === "weights") continue;
      assert.equal(v, ARTICULATION_PROFILES.balanced[k], k);
    }
    for (const [k, v] of Object.entries(articulation.weights)) assert.equal(v, ARTICULATION_PROFILES.balanced.weights[k], k);
  });

  test("0 everywhere is recitative and restrained", () => {
    const { articulation, phrasing } = knobProfiles({ pondus: 0, modulatio: 0, cadentia: 0, expressio: 0 });
    assert.equal(phrasing.curve, PHRASING_PROFILES.recitative.curve);
    assert.equal(phrasing.ritard, PHRASING_PROFILES.recitative.ritard);
    assert.equal(articulation.weightGain, ARTICULATION_PROFILES.restrained.weightGain);
  });

  test("the top goes past solemn and expressive, and each knob only moves its own numbers", () => {
    const top = knobProfiles({ pondus: 1, modulatio: 1, cadentia: 1, expressio: 1 });
    assert.ok(top.phrasing.curve > PHRASING_PROFILES.solemn.curve);
    assert.ok(top.phrasing.finisBoost > PHRASING_PROFILES.solemn.finisBoost);
    assert.ok(top.articulation.weightGain > ARTICULATION_PROFILES.expressive.weightGain);
    const onlyCadence = knobProfiles({ cadentia: 1 });
    assert.equal(onlyCadence.phrasing.curve, undefined);
    assert.ok(onlyCadence.phrasing.ritard > PHRASING_PROFILES.lyrical.ritard);
    assert.equal(onlyCadence.articulation.weights, undefined);
  });

  test("hasKnobs reads a number or an object", () => {
    assert.equal(hasKnobs({ pondus: 0.3 }), true);
    assert.equal(hasKnobs({ cadentia: { ritard: 0 } }), true);
    assert.equal(hasKnobs({}), false);
    assert.equal(hasKnobs(undefined), false);
  });

  test("buildScore at 0.5 is the reference reading; cadentia widens the close; expressio widens the range", () => {
    const a = buildScore(chant, { cadentia: {} });   // lyrical and balanced, no line moved
    const b = buildScore(chant, { pondus: 0.5, modulatio: 0.5, cadentia: 0.5, expressio: 0.5 });
    assert.deepEqual(velocities(b), velocities(a));
    assert.deepEqual(durations(b), durations(a));

    const c = buildScore(chant, { cadentia: 1 });
    const last = (s) => durations(s).at(-1);
    assert.ok(last(c) > last(b), "a wider cadence broadens the last note");

    const d = buildScore(chant, { expressio: 1 });
    const span = (s) => Math.max(...velocities(s)) - Math.min(...velocities(s));
    assert.ok(span(d) > span(b), "more expressio, more dynamic range");
  });

  test("a knob outside 0..1, or NaN, throws", () => {
    assert.throws(() => buildScore(chant, { modulatio: NaN }), /modulatio/);
    assert.throws(() => buildScore(chant, { cadentia: 1.5 }), /cadentia/);
    assert.throws(() => buildScore(chant, { pondus: -0.1 }), /pondus/);
  });

  test("an object's fields lie over the knob's reading; gradus is its level", () => {
    const rows = (o) => durations(buildScore(chant, o));
    assert.deepEqual(rows({ cadentia: { gradus: 1 } }), rows({ cadentia: 1 }));
    assert.notDeepEqual(rows({ cadentia: { gradus: 1, ritard: 0 } }), rows({ cadentia: 1 }));
    // without gradus the knob sits at 0.5, and only the field given moves
    const k = interpretKnobs({ cadentia: { ritard: 0 } });
    assert.equal(k.phrasing.ritard, 0);
    assert.equal(k.phrasing.cadence, undefined, "cadence stays lyrical's own");
  });

  test("a sign weight merges key by key over the pondus line", () => {
    const k = interpretKnobs({ pondus: { gradus: 1, weights: { liquescentDuration: -0.35 } } });
    assert.equal(k.articulation.weights.liquescentDuration, -0.35);
    assert.ok(k.articulation.weights.ictusWeight > ARTICULATION_PROFILES.expressive.weights.ictusWeight);
  });

  test("a name in both profiles is one field: ictusBoost, neumeArch, durArch set both", () => {
    const k = interpretKnobs({ pondus: { ictusBoost: 1 }, modulatio: { neumeArch: 0, durArch: 0 } });
    assert.equal(k.articulation.ictusBoost, 1);
    assert.equal(k.phrasing.ictusBoost, 1);
    for (const f of ["neumeArch", "durArch"]) {
      assert.equal(k.articulation[f], 0);
      assert.equal(k.phrasing[f], 0);
    }
  });

  test("a field under the wrong knob, an unknown field or option, or a bad value throws", () => {
    assert.throws(() => buildScore(chant, { pondus: { curve: 0 } }), /curve is a modulatio field, not pondus/);
    assert.throws(() => buildScore(chant, { cadentia: { nonsense: 1 } }), /cadentia has no field nonsense/);
    assert.throws(() => buildScore(chant, { pondus: { weights: { nonsense: 1 } } }), /no sign weight nonsense/);
    assert.throws(() => buildScore(chant, { expressio: { velSpread: NaN } }), /expressio.velSpread/);
    assert.throws(() => buildScore(chant, { modulatio: { gradus: 2 } }), /modulatio.gradus/);
    assert.throws(() => buildScore(chant, { pondus: "expressive" }), /pondus must be a number/);
    assert.throws(() => buildScore(chant, { accentus: "lyrical" }), /unknown option accentus/);
  });

  test("lean and rush: a melisma's turning points lean, its runs rush, and the cadence leans into the penultimate", () => {
    const melisma = { ...chant, gabc: "(c4) Ky(ghgfghjhgh)ri(h)e(gf) (,) e(h)le(ih)i(hg)son.(f.) (::)" };
    const rows = (o) => buildScore(melisma, o).tabula;
    const flat = rows({ modulatio: 0 });
    const full = rows({ modulatio: 1 });
    // the summit of the run (C4, index 6) is a real note: louder and longer at 1 than at 0
    assert.ok(full[6].velocity > flat[6].velocity);
    assert.ok(full[6].shapedDuration > flat[6].shapedDuration);
    // a passing note of the run (G3, index 2) is shorter at 1 than at 0
    assert.ok(full[2].shapedDuration < flat[2].shapedDuration);
    // the summit stands well above its neighbours at 1
    assert.ok(full[6].velocity > 2 * full[5].velocity || full[6].velocity > 0.6);
    // the cadence: the penultimate (G3, step to the final F) leans; the final releases
    const n = full.length;
    assert.ok(full[n - 2].velocity > flat[n - 2].velocity);
    assert.ok(full[n - 1].velocity < flat[n - 1].velocity);
    // a syllabic phrase closing by a leap is untouched by lean and rush
    const syllabic = { ...chant, gabc: "(c4) A(g)ve(h) Ma(j)ri(h)a(f) (::)" };
    const a = buildScore(syllabic, { modulatio: 0.5 }).tabula;
    const b = buildScore(syllabic, { modulatio: { lean: 0, rush: 0 } }).tabula;
    assert.deepEqual(a.map((r) => r.velocity), b.map((r) => r.velocity));
    assert.deepEqual(a.map((r) => r.shapedDuration), b.map((r) => r.shapedDuration));
    // closing by step, the same phrase does lean into its penultimate
    const stepwise = { ...chant, gabc: "(c4) A(g)ve(h) Ma(j)ri(h)a(g) (::)" };
    const c = buildScore(stepwise, { modulatio: 0.5 }).tabula;
    const d = buildScore(stepwise, { modulatio: { lean: 0, rush: 0 } }).tabula;
    assert.ok(c[c.length - 2].velocity > d[d.length - 2].velocity);
  });
});
