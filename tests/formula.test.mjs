import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { detectFormulas } from "../dist/engines/score/formula.js";
import { MODES } from "../dist/engines/temper/data/modes.js";

// Build a minimal phrase whose notes carry the step data the matcher reads. The
// matcher expresses each note as an octave-aware diatonic step relative to the
// final's register, from note.pitch.midi against the mode's scalePcs — so the
// fixture derives a coherent midi (octave 4) from each pc.
function phraseFromPcs(pcs) {
  return {
    syllables: [
      { notes: pcs.map((pc) => ({ step: { pc, role: null }, pitch: { pc, midi: 60 + pc } })) },
    ],
    divisio: undefined,
    beats: [],
    rhythmicType: null,
  };
}

const mode5 = MODES.get(5); // final F (pc 5), scale F G A B C D E

describe("detectFormulas", () => {
  test("returns a match entry per phrase, with the step skeleton", () => {
    const phrases = [phraseFromPcs([5, 7, 9, 7, 5])]; // F G A G F
    const out = detectFormulas(phrases, mode5, "gr");
    assert.equal(out.length, 1);
    assert.equal(out[0].phraseIndex, 0);
    // Steps are relative to F (0): F G A G F → 0 1 2 1 0.
    assert.deepEqual(out[0].steps, [0, 1, 2, 1, 0]);
  });

  test("with no mode, every phrase degrades to a null match", () => {
    const out = detectFormulas([phraseFromPcs([5, 7, 9])], undefined, "gr");
    assert.equal(out[0].formula, null);
    assert.equal(out[0].steps.length, 0);
  });

  test("with no catalogue for the genre×mode, formula is null but steps compute", () => {
    // "gr:5" is not populated yet → null match, but the skeleton is still there.
    const out = detectFormulas([phraseFromPcs([5, 7, 9, 7, 5])], mode5, "gr");
    assert.equal(out[0].formula, null);
    assert.ok(out[0].steps.length > 0);
  });

  test("matches a catalogue formula with melismatic-filling tolerance", async () => {
    // Inject a tiny catalogue to exercise the matcher independent of the real
    // Apel data: a formula F-G-A-G-F (steps 0 1 2 1 0) in slot "termination".
    const { FORMULAE } = await import("../dist/engines/score/data/formulas.js");
    FORMULAE["gr:5"] = [{ id: "TEST1", slot: "termination", steps: [0, 1, 2, 1, 0] }];
    try {
      // A phrase that realises the formula with an extra passing note (melisma):
      // F G A A G F → skeleton F G A G F → matches TEST1 in full.
      const out = detectFormulas([phraseFromPcs([5, 7, 9, 9, 7, 5])], mode5, "gr");
      assert.equal(out[0].formula, "TEST1");
      assert.equal(out[0].slot, "termination");
      assert.equal(out[0].confidence, 1);
    } finally {
      delete FORMULAE["gr:5"];
    }
  });

  test("a phrase that does not realise any formula stays null", async () => {
    const { FORMULAE } = await import("../dist/engines/score/data/formulas.js");
    FORMULAE["gr:5"] = [{ id: "TEST1", slot: "termination", steps: [0, 1, 2, 1, 0] }];
    try {
      // A descending run bearing no resemblance to the ascending-arch formula.
      const out = detectFormulas([phraseFromPcs([5, 4, 2, 0])], mode5, "gr");
      assert.equal(out[0].formula, null);
    } finally {
      delete FORMULAE["gr:5"];
    }
  });
});
