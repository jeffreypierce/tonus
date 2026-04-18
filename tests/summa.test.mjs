import { describe, test } from "node:test";
import assert from "node:assert/strict";
import tonus from "../dist/index.js";

const KYRIE_GABC = "(c4) Ky(g)ri(h)e(g.) (,) e(h)le(ih)i(g)son.(f.) (::)";
const SANCTUS_GABC = "(c4) Sán(g)ctus,(h) (,) Sán(h)ctus,(ig) (,) Sán(g)ctus.(f.) (::)";

function chant(gabc, mode = "1") {
  return tonus.cantus({ gabc, mode, incipit: "Test" })[0];
}

describe("summa (single score)", () => {
  test("returns a Residue with phrase/note/syllable counts", () => {
    const score = tonus.cantio(chant(KYRIE_GABC));
    const r = tonus.summa(score);
    assert.equal(r.scoreCount, 1);
    assert.ok(r.phraseCount > 0);
    assert.ok(r.noteCount > 0);
    assert.ok(r.syllableCount > 0);
    assert.equal(r.chants.length, 1);
  });

  test("includes noteRange and ambitus", () => {
    const score = tonus.cantio(chant(KYRIE_GABC));
    const r = tonus.summa(score);
    assert.ok(r.noteRange);
    assert.ok(r.noteRange.min < r.noteRange.max);
    assert.equal(r.ambitus, r.noteRange.span);
  });

  test("pcDistribution sums to ~1", () => {
    const score = tonus.cantio(chant(KYRIE_GABC));
    const r = tonus.summa(score);
    const total = Object.values(r.pcDistribution).reduce((s, v) => s + v, 0);
    assert.ok(Math.abs(total - 1) < 0.001);
  });

  test("attractors are tuned Pitches", () => {
    const score = tonus.cantio(chant(KYRIE_GABC));
    const r = tonus.summa(score);
    assert.ok(r.attractors.length > 0);
    for (const a of r.attractors) {
      assert.ok(typeof a.pc === "number");
      assert.ok(typeof a.weight === "number");
      assert.ok(a.pitch);
      assert.ok(typeof a.pitch.hz === "number" && a.pitch.hz > 0);
      assert.ok(typeof a.pitch.midi === "number");
    }
  });

  test("attractors sorted by weight descending", () => {
    const score = tonus.cantio(chant(KYRIE_GABC));
    const r = tonus.summa(score);
    for (let i = 1; i < r.attractors.length; i++) {
      assert.ok(r.attractors[i - 1].weight >= r.attractors[i].weight);
    }
  });

  test("vowelAttractors produced for multi-vowel lyrics", () => {
    const score = tonus.cantio(chant(KYRIE_GABC));
    const r = tonus.summa(score);
    assert.ok(r.vowelAttractors.length > 0);
    for (const v of r.vowelAttractors) {
      assert.ok(["a", "e", "i", "o", "u"].includes(v.vowel));
      assert.ok(typeof v.weight === "number" && v.weight > 0);
      assert.ok(typeof v.pc === "number");
    }
  });

  test("resolves mode from chant", () => {
    const score = tonus.cantio(chant(KYRIE_GABC, "1"));
    const r = tonus.summa(score);
    assert.equal(r.mode, 1);
    assert.ok(r.modalConformance !== null);
  });
});

describe("summa (multi-score)", () => {
  test("aggregates counts across multiple scores", () => {
    const s1 = tonus.cantio(chant(KYRIE_GABC));
    const s2 = tonus.cantio(chant(SANCTUS_GABC));
    const single = tonus.summa(s1);
    const combined = tonus.summa([s1, s2]);
    assert.equal(combined.scoreCount, 2);
    assert.ok(combined.noteCount > single.noteCount);
    assert.ok(combined.phraseCount > single.phraseCount);
    assert.equal(combined.chants.length, 2);
  });

  test("inconsistent modes yield null modalConformance", () => {
    const s1 = tonus.cantio(chant(KYRIE_GABC, "1"));
    const s2 = tonus.cantio(chant(SANCTUS_GABC, "5"));
    const r = tonus.summa([s1, s2]);
    assert.equal(r.mode, null);
    assert.equal(r.modalConformance, null);
  });

  test("explicit mode option overrides inference", () => {
    const score = tonus.cantio(chant(KYRIE_GABC, "1"));
    const r = tonus.summa(score, { mode: 3 });
    assert.equal(r.mode, 3);
  });
});
