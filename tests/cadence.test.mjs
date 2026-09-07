import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildScore } from "../dist/engines/score/api.js";
import {
  detectCadences, cadenceKeys, letterPosition, collapseTail, motionOf, TAIL,
} from "../dist/engines/score/cadence.js";
import { CADENTIAE, CADENTIAE_FLOOR, cadentiaGenus, cadentiaSpecies } from "../dist/data/cadentiae.js";

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

describe("the cadence key", () => {
  test("letter position: seven per octave, accidentals do not move it", () => {
    assert.equal(letterPosition("C4"), 28);
    assert.equal(letterPosition("D4"), 29);
    assert.equal(letterPosition("Bb3"), letterPosition("B3"));
    assert.equal(letterPosition("C5") - letterPosition("C4"), 7);
    assert.equal(letterPosition("nope"), null);
  });

  test("interior repeats collapse; the landing's repeat is kept once", () => {
    assert.deepEqual(collapseTail([4, 4, 5, 4]), [4, 5, 4]); // G G A G is G A G
    assert.deepEqual(collapseTail([5, 4, 4]), [5, 4, 4]); // A G G stays a repeat
    assert.deepEqual(collapseTail([5, 4, 4, 4]), [5, 4, 4]); // ...once
    assert.deepEqual(collapseTail([4]), [4]);
  });

  test("motion reads the last interval in letter steps", () => {
    assert.equal(motionOf([1, 0]), "cadens");
    assert.equal(motionOf([-1, 0]), "surgens");
    assert.equal(motionOf([2, 0]), "translabens");
    assert.equal(motionOf([-2, 0]), "transcendens");
    assert.equal(motionOf([3, 0]), "desiliens");
    assert.equal(motionOf([-3, 0]), "exsiliens");
    assert.equal(motionOf([1, 0, 0]), "insistens");
    assert.equal(motionOf([0]), "sola");
  });

  test("the species is the last TAIL collapsed notes from the sounded final", () => {
    assert.equal(TAIL, 3);
    // f g f e d in mode 1, final D: positions 2 3 2 1 0 — species is the
    // last three, "2,1,0"; genus "cadens @0".
    const score = buildScore(makeChant(MODE1_FINAL, "1"));
    const last = score.cadences.at(-1);
    assert.equal(last.species, "2,1,0");
    assert.deepEqual(last.tail, [2, 1, 0]);
    assert.equal(last.genus, "cadens @0");
    assert.equal(last.motion, "cadens");
    assert.equal(last.nomen, "cadens finalis");
    assert.equal(last.degree, 0);
  });

  test("the same gesture keys the same on any final", () => {
    // F E onto E (deuterus) and E D onto D (protus): one step down onto the
    // final, one species — where the semitone key split them.
    const deut = buildScore(makeChant("(c4) sol(g) fa(f) mi(e.) (::)", "3")).cadences.at(-1);
    const prot = buildScore(makeChant("(c4) fa(f) mi(e) re(d.) (::)", "1")).cadences.at(-1);
    assert.equal(deut.species, prot.species);
    assert.equal(deut.species, "2,1,0");
  });

  test("a chromatic inflection keys like its letter", () => {
    // B-flat and B-natural are one degree: the tail is the same species.
    const flat = buildScore(makeChant("(c4) a(h) b(ixi) a(h.) (::)", "1")).cadences.at(-1);
    const nat = buildScore(makeChant("(c4) a(h) b(i) a(h.) (::)", "1")).cadences.at(-1);
    assert.equal(flat.species, nat.species);
  });

  test("cadenceKeys is the shared function: flat rows in, one event per phrase end", () => {
    const score = buildScore(makeChant(MODE1_MEDIAL, "1"));
    const events = cadenceKeys(score.tabula);
    assert.equal(events.length, 2);
    assert.deepEqual(events.map((e) => e.species), score.cadences.map((c) => c.species));
    assert.deepEqual(events.map((e) => e.isFinal), [false, true]);
  });

  test("a one-note phrase is a cadence: a landing with no gesture", () => {
    const score = buildScore(makeChant("(c4) one(d.) (;) clos(e) ing(d.) (::)", "1"));
    const first = score.cadences[0];
    assert.equal(first.species, "0");
    assert.equal(first.genus, "sola @0");
    assert.equal(first.motion, "sola");
    assert.equal(first.nomen, "sola finalis");
  });
});

describe("detectCadences", () => {
  test("final :: cadence lands on the finalis", () => {
    const score = buildScore(makeChant(MODE1_FINAL, "1"));
    const last = score.cadences.at(-1);
    assert.equal(last.divisio, "::"); // divisio finalis — the final cadence
    assert.equal(last.target, "finalis");
    assert.equal(last.approach, "descending");
    assert.equal(last.pcs.at(-1), 2); // resolves on D (pc 2)
    assert.equal(last.steps.at(-1), 0); // ...which is the final: step 0
    assert.ok(last.confidence >= 0.9);
  });

  test("interior divisio on the tenor classifies as a medial tenor cadence", () => {
    const score = buildScore(makeChant(MODE1_MEDIAL, "1"));
    const medial = score.cadences.find((c) => c.divisio === ";");
    assert.ok(medial, "a cadence exists at the semicolon");
    assert.equal(medial.target, "tenor");
    assert.equal(medial.pcs.at(-1), 9); // rests on A (pc 9), the mode-1 tenor
    assert.equal(medial.steps.at(-1), 0); // step 0 relative to the tenor target
    // In letter steps from the sounded final that A sits a fourth BELOW D —
    // the degree is signed and not octave-reduced, so it reads -3, not +4.
    assert.equal(medial.degree, -3);
    assert.equal(medial.genus, "insistens @-3");
    assert.equal(medial.nomen, "insistens tenor");
  });

  test("the reiterated final is a repeat, not a step", () => {
    // e d d — mi-re landing on the final and repeating it. The landing's
    // repeat survives collapsing, so this is "insistens @0", not "cadens @0".
    const score = buildScore(makeChant("(c4) mi(e) re(d) peat(d.) (::)", "1"));
    const last = score.cadences.at(-1);
    assert.equal(last.species, "1,0,0");
    assert.equal(last.genus, "insistens @0");
    assert.deepEqual(last.steps, [1, 0, 0]);
  });

  test("a step up from the note below", () => {
    const score = buildScore(makeChant("(c4) ca(d) den(c) za(d.) (::)", "1"));
    const last = score.cadences.at(-1);
    assert.equal(last.target, "finalis");
    assert.deepEqual(last.steps, [0, -1, 0]);
    assert.equal(last.species, "0,-1,0");
    assert.equal(last.genus, "surgens @0");
  });

  test("one cadence per phrase-ending divisio", () => {
    const score = buildScore(makeChant(MODE1_MEDIAL, "1"));
    const divisioPhrases = score.phrases.filter((p) => p.divisio).length;
    assert.equal(score.cadences.length, divisioPhrases);
  });

  test("no mode: still classifies target/approach and keys, but steps stay empty", () => {
    const score = buildScore(makeChant(MODE1_FINAL, "1"));
    const cadences = detectCadences(score.phrases, undefined);
    assert.equal(cadences.length, score.cadences.length);
    for (const c of cadences) {
      assert.ok(["finalis", "tenor", "other"].includes(c.target));
      assert.ok(["descending", "ascending", "unison"].includes(c.approach));
      assert.deepEqual(c.steps, []);
      assert.equal(c.finality, null); // the join is the builder's
    }
    // The key needs no mode.
    assert.equal(cadences.at(-1).species, score.cadences.at(-1).species);
  });

  test("the builder joins finality and confidence from the catalogue", () => {
    const score = buildScore(makeChant(MODE1_FINAL, "1"));
    const last = score.cadences.at(-1);
    const species = cadentiaSpecies(last.species);
    assert.ok(species, "the protus descent is a tabled species");
    assert.equal(last.finality, species.finality);
    // Detector-fresh: 0.6 for a landing on the finalis; +0.4 for a tabled species.
    assert.equal(detectCadences(score.phrases, undefined).at(-1).confidence, 0.6);
    assert.equal(last.confidence, 1);
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

  test("does not perturb the existing metrics cadence counting", () => {
    const score = buildScore(makeChant(MODE1_FINAL, "1"));
    // Metrics still counts divisio bars independently of the detector.
    assert.equal(score.metrics.cadenceDistribution.doubleBar, 1);
    assert.ok(score.metrics.cadenceWeight >= 1.5);
  });
});

describe("CADENTIAE — one table, two levels", () => {
  test("every species sits under the genus its own tail names", () => {
    for (const g of CADENTIAE) {
      assert.ok(g.n >= CADENTIAE_FLOOR);
      assert.equal(g.key, `${g.motion} @${g.degree}`);
      for (const s of g.species) {
        assert.ok(s.n >= CADENTIAE_FLOOR);
        assert.equal(s.key, s.tail.join(","));
        assert.equal(s.tail.at(-1), g.degree);
        assert.equal(motionOf(s.tail), g.motion);
        assert.ok(s.tail.length <= TAIL);
        assert.equal(cadentiaSpecies(s.key), s);
      }
      assert.equal(cadentiaGenus(g.key), g);
    }
    assert.equal(cadentiaGenus("none such"), undefined);
  });

  test("the commonest close in mode VIII is not rare", () => {
    // The complaint that started the re-key: F E F G onto G printed "rara"
    // because its four-note semitone spelling was one of 73 under the floor.
    // In letter steps from G it is -1 -2 -1 0; the tail is "-2,-1,0", a
    // tabled species of "surgens @0", the fourth genus of mode 8.
    const score = buildScore(makeChant("(c4) f(f) e(e) f(f) g(g.) (::)", "8"));
    const last = score.cadences.at(-1);
    assert.equal(last.species, "-2,-1,0");
    assert.equal(last.genus, "surgens @0");
    assert.ok(cadentiaSpecies(last.species), "tabled as a species");
    assert.ok((cadentiaGenus(last.genus).modes["8"] ?? 0) > 500);
  });
});
