import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { computeModalAffinity } from "../dist/engines/temper/modality.js";

describe("computeModalAffinity", () => {
  test("ranks all eight modes, best fit first", () => {
    const affinity = computeModalAffinity({ 2: 0.5, 9: 0.3, 5: 0.2 });
    assert.equal(affinity.length, 8);
    for (let i = 1; i < affinity.length; i++) {
      assert.ok(affinity[i - 1].score >= affinity[i].score);
    }
  });

  test("weights the finalis above the tenor above modulation degrees", () => {
    // Mode 1: final D (pc 2), tenor A (pc 9). All weight on the final should
    // score mode 1 higher than all weight on a lesser mode-1 degree does.
    const onFinal = computeModalAffinity({ 2: 1 }).find((a) => a.mode === 1).score;
    const onTenor = computeModalAffinity({ 9: 1 }).find((a) => a.mode === 1).score;
    assert.ok(onFinal > onTenor);
  });

  test("the ranked initials bonus separates an authentic mode from its plagal twin", () => {
    // Modes 7 and 8 share the finalis G. B (pc 11) is a mode-7 initial but not a
    // mode-8 one, so opening on B should tip an otherwise-tied distribution to 7.
    const dist = { 7: 0.3, 2: 0.3, 11: 0.2, 0: 0.2 };
    const withoutFirst = computeModalAffinity(dist);
    const openingOnB = computeModalAffinity(dist, { firstNotePc: 11 });
    // The opening pitch changes which of the twin modes leads.
    assert.notEqual(openingOnB[0].mode, withoutFirst[0].mode);
    assert.equal(openingOnB[0].mode, 7);
  });

  test("a first note that is no mode's initial leaves ranking unchanged", () => {
    const dist = { 2: 0.5, 9: 0.5 };
    const base = computeModalAffinity(dist)[0].mode;
    // pc 1 (C#) is not an initial for any mode.
    assert.equal(computeModalAffinity(dist, { firstNotePc: 1 })[0].mode, base);
  });

  test("landing on a mode's final boosts it (the last-note determinant)", () => {
    // A flat distribution across D and A; ending on D (pc 2) should lift the
    // protus modes (final D) above the rest.
    const dist = { 2: 0.3, 9: 0.3, 5: 0.2, 0: 0.2 };
    const noEnd = computeModalAffinity(dist).find((a) => a.mode === 1).score;
    const endOnD = computeModalAffinity(dist, { lastNotePc: 2 });
    assert.ok([1, 2].includes(endOnD[0].mode), "a protus mode leads when the chant ends on D");
    assert.ok(endOnD.find((a) => a.mode === 1).score > noEnd, "the final-note bonus raises the score");
  });

  test("tessitura separates an authentic mode from its plagal twin on a shared final", () => {
    // Modes 1 & 2 share final D (pc 2). A high tessitura (~4 semitones above the
    // final) favours the authentic mode 1; a low one (~1.7) favours plagal mode 2.
    const dist = { 2: 0.4, 9: 0.3, 5: 0.3 };
    const high = computeModalAffinity(dist, { lastNotePc: 2, tessitura: 4.0 });
    const low = computeModalAffinity(dist, { lastNotePc: 2, tessitura: 1.7 });
    assert.equal(high[0].mode, 1, "high tessitura → authentic (mode 1)");
    assert.equal(low[0].mode, 2, "low tessitura → plagal (mode 2)");
  });
});
