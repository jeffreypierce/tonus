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
    const openingOnB = computeModalAffinity(dist, 11);
    // The opening pitch changes which of the twin modes leads.
    assert.notEqual(openingOnB[0].mode, withoutFirst[0].mode);
    assert.equal(openingOnB[0].mode, 7);
  });

  test("a first note that is no mode's initial leaves ranking unchanged", () => {
    const dist = { 2: 0.5, 9: 0.5 };
    const base = computeModalAffinity(dist)[0].mode;
    // pc 1 (C#) is not an initial for any mode.
    assert.equal(computeModalAffinity(dist, 1)[0].mode, base);
  });
});
