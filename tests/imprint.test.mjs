import { describe, test } from "node:test";
import assert from "node:assert/strict";
import tonus from "../dist/index.js";

const KYRIE_GABC = "(c4) Ky(g)ri(h)e(g.) (,) e(h)le(ih)i(g)son.(f.) (::)";

function chant(gabc, mode = "1") {
  return tonus.cantus({ gabc, mode, incipit: "Test" })[0];
}

describe("score.prosody", () => {
  test("counts phrases, notes, syllables", () => {
    const score = tonus.cantio(chant(KYRIE_GABC));
    assert.ok(score.prosody.phraseCount > 0);
    assert.ok(score.prosody.noteCount > 0);
    assert.ok(score.prosody.syllableCount > 0);
  });

  test("includes noteRange and ambitus", () => {
    const score = tonus.cantio(chant(KYRIE_GABC));
    const { noteRange, ambitus } = score.prosody;
    assert.ok(noteRange);
    assert.ok(noteRange.min < noteRange.max);
    assert.equal(ambitus, noteRange.span);
  });

  test("rhythmicProfile arsic + thetic equals noteCount", () => {
    const score = tonus.cantio(chant(KYRIE_GABC));
    const { rhythmicProfile, noteCount } = score.prosody;
    assert.equal(rhythmicProfile.arsic + rhythmicProfile.thetic, noteCount);
    assert.ok(rhythmicProfile.maxGroupSize >= 1);
    assert.ok(rhythmicProfile.avgGroupSize > 0);
    assert.ok(rhythmicProfile.avgGroupSize <= rhythmicProfile.maxGroupSize);
  });

  test("cadence distribution and weight reflect divisios", () => {
    const score = tonus.cantio(chant(KYRIE_GABC));
    assert.equal(score.prosody.cadenceDistribution.comma, 1);
    assert.equal(score.prosody.cadenceDistribution.doubleBar, 1);
    assert.ok(score.prosody.cadenceWeight > 0);
  });
});

describe("score.imprint", () => {
  test("pcDistribution sums to ~1", () => {
    const score = tonus.cantio(chant(KYRIE_GABC));
    const total = Object.values(score.imprint.pcDistribution).reduce((s, v) => s + v, 0);
    assert.ok(Math.abs(total - 1) < 0.001);
  });

  test("attractors are tuned Pitches sorted by weight descending", () => {
    const score = tonus.cantio(chant(KYRIE_GABC));
    const { attractors } = score.imprint;
    assert.ok(attractors.length > 0);
    for (const a of attractors) {
      assert.ok(typeof a.pc === "number");
      assert.ok(typeof a.weight === "number");
      assert.ok(a.pitch);
      assert.ok(typeof a.pitch.hz === "number" && a.pitch.hz > 0);
      assert.ok(typeof a.pitch.midi === "number");
    }
    for (let i = 1; i < attractors.length; i++) {
      assert.ok(attractors[i - 1].weight >= attractors[i].weight);
    }
  });

  test("vowelAttractors carry tuned Pitches (not bare pc)", () => {
    const score = tonus.cantio(chant(KYRIE_GABC));
    const { vowelAttractors } = score.imprint;
    assert.ok(vowelAttractors.length > 0);
    for (const v of vowelAttractors) {
      assert.ok(["a", "e", "i", "o", "u"].includes(v.vowel));
      assert.ok(typeof v.weight === "number" && v.weight > 0);
      assert.ok(v.pitch);
      assert.ok(typeof v.pitch.hz === "number" && v.pitch.hz > 0);
    }
  });

  test("modalAffinity has 8 entries sorted descending", () => {
    const score = tonus.cantio(chant(KYRIE_GABC));
    const { modalAffinity } = score.imprint;
    assert.equal(modalAffinity.length, 8);
    for (let i = 1; i < 8; i++) {
      assert.ok(modalAffinity[i - 1].score >= modalAffinity[i].score);
    }
    const modes = new Set(modalAffinity.map((m) => m.mode));
    assert.equal(modes.size, 8);
  });

  test("modalConformance derivable from modalAffinity by declared mode", () => {
    const score = tonus.cantio(chant(KYRIE_GABC, "1"));
    const declared = parseInt(score.chant.mode ?? "", 10);
    const match = score.imprint.modalAffinity.find((m) => m.mode === declared);
    assert.ok(match);
    assert.ok(typeof match.score === "number" && match.score >= 0);
  });
});
