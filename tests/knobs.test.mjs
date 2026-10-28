import { describe, test } from "node:test";
import assert from "node:assert/strict";
import tonus from "../dist/index.js";
import { knobProfiles, hasKnobs } from "../dist/engines/score/knobs.js";
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

  test("tenor is not on any knob", () => {
    const { phrasing } = knobProfiles({ pondus: 1, modulatio: 1, cadentia: 1, expressio: 1 });
    assert.equal(phrasing.tenor, undefined);
  });

  test("hasKnobs reads a number, not a style name", () => {
    assert.equal(hasKnobs({ pondus: 0.3 }), true);
    assert.equal(hasKnobs({}), false);
    assert.equal(hasKnobs(undefined), false);
  });

  test("buildScore at 0.5 matches the presets; cadentia widens the close; expressio widens the range", () => {
    const a = buildScore(chant, { pondus: "balanced", accentus: "lyrical" });
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

  test("modalitas is the mode's bend on the phrasing: 0 removes it, 1 doubles it", () => {
    const none = buildScore(chant, { modalitas: 0 });
    const half = buildScore(chant, { modalitas: 0.5 });
    const full = buildScore(chant, { modalitas: 1 });
    const plain = buildScore(chant, { pondus: 0.5 });   // a knob given, modalitas left out: 0.5
    assert.deepEqual(velocities(half), velocities(plain));
    assert.notDeepEqual(velocities(none), velocities(half));
    assert.notDeepEqual(velocities(full), velocities(half));
  });

  test("a knob outside 0..1, or NaN, throws", () => {
    assert.throws(() => buildScore(chant, { modulatio: NaN }), /modulatio/);
    assert.throws(() => buildScore(chant, { cadentia: 1.5 }), /cadentia/);
    assert.throws(() => buildScore(chant, { pondus: -0.1 }), /pondus/);
  });

  test("a knob beside a preset throws", () => {
    assert.throws(() => buildScore(chant, { pondus: "strict", cadentia: 0.5 }), /mixed/);
    assert.throws(() => buildScore(chant, { accentus: "solemn", expressio: 0.5 }), /mixed/);
  });

  test("a style name for pondus still works when no knob is given", () => {
    const s = buildScore(chant, { pondus: "expressive" });
    assert.ok(s.tabula.length > 0);
  });
});
