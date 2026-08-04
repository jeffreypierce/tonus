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
    // Most of the corpus is in this position permanently: centonization is a
    // property of the responsorial-melismatic genres, not of chant at large.
    // An antiphon has no catalogue, so the match is null — but the skeleton is
    // still computed, because that is a fact about the melody either way.
    const out = detectFormulas([phraseFromPcs([5, 7, 9, 7, 5])], mode5, "an");
    assert.equal(out[0].formula, null);
    assert.ok(out[0].steps.length > 0);
  });

  test("matches a catalogue formula with melismatic-filling tolerance", async () => {
    // Inject a tiny catalogue to exercise the matcher independent of the real
    // Apel data: a formula F-G-A-G-F (steps 0 1 2 1 0) in slot "termination".
    const { FORMULAE } = await import("../dist/engines/score/data/formulas.js");
    // "gr:5" now SHIPS the Apel catalogue — stash and restore it, or every
    // test after this one runs against an empty one.
    const shipped = FORMULAE["gr:5"];
    FORMULAE["gr:5"] = [{ id: "TEST1", slot: "termination", steps: [0, 1, 2, 1, 0] }];
    try {
      // A phrase that realises the formula with an extra passing note (melisma):
      // F G A A G F → skeleton F G A G F → matches TEST1 in full.
      const out = detectFormulas([phraseFromPcs([5, 7, 9, 9, 7, 5])], mode5, "gr");
      assert.equal(out[0].formula, "TEST1");
      assert.equal(out[0].slot, "termination");
      assert.equal(out[0].confidence, 1);
    } finally {
      FORMULAE["gr:5"] = shipped;
    }
  });

  test("the shipped mode-5 Gradual catalogue is Apel's alphabet", async () => {
    const { FORMULAE, formulaeFor } = await import("../dist/engines/score/data/formulas.js");
    const gr5 = formulaeFor("gr", 5);
    assert.equal(gr5.length, 53, "Apel Figure 104 has 53 standard phrases");
    assert.equal(gr5, FORMULAE["gr:5"]);

    // Steps are diatonic positions relative to F, the mode-5 final. Apel's
    // staves span E (-1) to g' (+8); anything outside that is a transcription
    // slip, not a chant.
    for (const f of gr5) {
      assert.ok(f.steps.length >= 4, `${f.id} is too short to be a phrase`);
      for (const s of f.steps) {
        assert.ok(s >= -3 && s <= 8, `${f.id} has an out-of-range step ${s}`);
      }
    }
    // The slots are DERIVED from Apel's tabulation, not transcribed, so assert
    // the reading that derivation rests on: F- and G- symbols close a unit,
    // i- symbols open one.
    const slotOf = (id) => gr5.find((f) => f.id === id)?.slot;
    assert.equal(slotOf("F10"), "termination");
    assert.equal(slotOf("G1"), "termination");
    assert.equal(slotOf("i1"), "intonation");
    assert.equal(slotOf("A15"), "opening");
    // Every id is unique — a duplicate would silently shadow in the matcher.
    assert.equal(new Set(gr5.map((f) => f.id)).size, gr5.length);
  });

  test("the catalogue matches real mode-5 Graduals", async () => {
    const tonus = (await import("../dist/index.js")).default;
    const graduals = tonus.cantus({ office: "gr", mode: 5 });
    assert.ok(graduals.length > 50, "the corpus holds mode-5 Graduals to match");
    let matched = 0;
    for (const chant of graduals) {
      let score;
      try { score = tonus.notatio(chant); } catch { continue; }
      if ((score.formulas ?? []).some((f) => f.formula)) matched++;
    }
    // Centonization is the claim: a mode-5 Gradual should be ASSEMBLED from
    // this stock, so a catalogue that matched only a handful would be evidence
    // the transcription or the matcher is wrong.
    assert.ok(matched / graduals.length > 0.9,
      `only ${matched}/${graduals.length} mode-5 Graduals matched any formula`);
  });

  test("a phrase that does not realise any formula stays null", async () => {
    const { FORMULAE } = await import("../dist/engines/score/data/formulas.js");
    // "gr:5" now SHIPS the Apel catalogue — stash and restore it, or every
    // test after this one runs against an empty one.
    const shipped = FORMULAE["gr:5"];
    FORMULAE["gr:5"] = [{ id: "TEST1", slot: "termination", steps: [0, 1, 2, 1, 0] }];
    try {
      // A descending run bearing no resemblance to the ascending-arch formula.
      const out = detectFormulas([phraseFromPcs([5, 4, 2, 0])], mode5, "gr");
      assert.equal(out[0].formula, null);
    } finally {
      FORMULAE["gr:5"] = shipped;
    }
  });
});
