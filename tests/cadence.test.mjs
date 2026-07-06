import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildScore } from "../dist/engines/score/api.js";
import { detectCadences } from "../dist/engines/score/cadence.js";

function makeChant(gabc, mode = "1") {
  return {
    id: "test:1",
    incipit: "Test",
    gabc,
    office: "or",
    genus: "Ordinarium",
    mode,
    modus: "Modus I",
    pages: [],
    source: { book: "Test", year: null, editor: null },
  };
}

// A mode-1 phrase closing with the protus final descent F–E–D onto the
// finalis (D), ended by a divisio finalis.
const MODE1_FINAL = "(c4) test(f) end(g) ing(f) da(e) fi(d.) (::)";

// A mode-1 phrase resting on the tenor (A) at an interior divisio, then
// closing on the finalis.
const MODE1_MEDIAL =
  "(c4) re(d) ci(f) ting(a) tone(a.) (;) and(g) close(f) here(d.) (::)";

describe("detectCadences", () => {
  test("final :: cadence lands on the finalis and matches the mode figure", () => {
    const score = buildScore(makeChant(MODE1_FINAL, "1"));
    const last = score.cadences.at(-1);
    assert.equal(last.divisio, "::");
    assert.equal(last.kind, "final");
    assert.equal(last.target, "finalis");
    assert.equal(last.approach, "descending");
    // f g f e d → the ending E-D is mi-re, a Protus final cadence.
    assert.equal(last.formula, "mi-re");
    assert.equal(last.pcs.at(-1), 2); // resolves on D (pc 2)
    assert.equal(last.steps.at(-1), 0); // ...which is the final: step 0
    assert.ok(last.confidence >= 0.9);
  });

  test("interior divisio on the tenor classifies as a medial tenor cadence", () => {
    const score = buildScore(makeChant(MODE1_MEDIAL, "1"));
    const medial = score.cadences.find((c) => c.divisio === ";");
    assert.ok(medial, "a cadence exists at the semicolon");
    assert.equal(medial.kind, "medial");
    assert.equal(medial.target, "tenor");
    assert.equal(medial.pcs.at(-1), 9); // rests on A (pc 9), the mode-1 tenor
    assert.equal(medial.steps.at(-1), 0); // step 0 relative to the tenor target
  });

  test("a step below the final matches ut-re (signed steps)", () => {
    // d c d → final, the note below (ut), final: steps 0,-1,0. The ending
    // ut-re is the Protus figure that lands via the note below.
    const score = buildScore(makeChant("(c4) ca(d) den(c) za(d.) (::)", "1"));
    const last = score.cadences.at(-1);
    assert.equal(last.target, "finalis");
    assert.deepEqual(last.steps, [0, -1, 0]);
    assert.equal(last.formula, "ut-re");
    assert.ok(last.confidence >= 0.9);
  });

  test("prefers the longest full figure over a shorter suffix", () => {
    // Deuterus (mode 3, final Mi=E): g f e is sol-fa-mi. Its tail f-e is also
    // the fa-mi figure, but the more specific 3-note figure should win.
    const score = buildScore(makeChant("(c4) sol(g) fa(f) mi(e.) (::)", "3"));
    const last = score.cadences.at(-1);
    assert.deepEqual(last.steps, [2, 1, 0]);
    assert.equal(last.formula, "sol-fa-mi");
  });

  test("a repeated final still matches the figure fully", () => {
    // e d d — mi-re landing on the final, then repeating it. The repeat must
    // not weaken the match; steps stay raw as evidence.
    const score = buildScore(makeChant("(c4) mi(e) re(d) peat(d.) (::)", "1"));
    const last = score.cadences.at(-1);
    assert.deepEqual(last.steps, [1, 0, 0]);
    assert.equal(last.formula, "mi-re");
    assert.equal(last.confidence, 1);
  });

  test("one cadence per phrase-ending divisio", () => {
    const score = buildScore(makeChant(MODE1_MEDIAL, "1"));
    const divisioPhrases = score.phrases.filter((p) => p.divisio).length;
    assert.equal(score.cadences.length, divisioPhrases);
  });

  test("no catalog: still classifies target/kind/approach, but names no figure", () => {
    // detectCadences with no ModeData — the graceful-degradation path. Note
    // target/kind/approach come from per-note data already on the tree, so
    // they survive; only figure-naming needs the catalog.
    const score = buildScore(makeChant(MODE1_FINAL, "1"));
    const cadences = detectCadences(score.phrases, undefined);
    assert.equal(cadences.length, score.cadences.length);
    for (const c of cadences) {
      assert.equal(c.formula, null); // no catalog → no named figure
      assert.ok(["finalis", "tenor", "other"].includes(c.target));
      assert.ok(["medial", "final"].includes(c.kind));
      assert.ok(["descending", "ascending", "unison"].includes(c.approach));
    }
    // The final cadence still knows it landed on the finalis, just unnamed.
    assert.equal(cadences.at(-1).target, "finalis");
    assert.equal(cadences.at(-1).formula, null);
  });

  test("tabula cadenceRef points back to the cadence for its constituent notes", () => {
    // A phrase long enough that its opening notes fall outside the cadence
    // window (which is the last several notes before the divisio).
    const long = "(c4) lon(d) ger(f) me(g) lo(a) dy(g) that(f) walks(g) a(a) while(g) " +
      "then(f) ca(f) den(e) ces(d.) (::)";
    const score = buildScore(makeChant(long, "1"));
    const refRows = score.tabula.filter((r) => r.cadenceRef !== null);
    assert.ok(refRows.length > 0);
    // The final row is the resolution note; its ref must index a real cadence.
    const finalRow = score.tabula.at(-1);
    assert.equal(typeof finalRow.cadenceRef, "number");
    const cad = score.cadences[finalRow.cadenceRef];
    assert.equal(cad.phraseIndex, finalRow.phraseIndex);
    // The opening note is outside the cadence window, so carries no ref.
    assert.equal(score.tabula[0].cadenceRef, null);
  });

  test("does not perturb the existing prosody cadence counting", () => {
    const score = buildScore(makeChant(MODE1_FINAL, "1"));
    // Prosody still counts divisio bars independently of the new detector.
    assert.equal(score.prosody.cadenceDistribution.doubleBar, 1);
    assert.ok(score.prosody.cadenceWeight >= 1.5);
  });
});
