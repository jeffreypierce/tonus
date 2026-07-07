import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { classifyRhythmicType } from "../dist/engines/score/ir.js";
import { buildScore } from "../dist/engines/score/api.js";

// The classifier reads only the beat shapes, so build beats from an A/T string.
const beats = (s) => [...s].map((c) => ({ shape: c === "A" ? "arsic" : "thetic", noteCount: 1 }));
const typeOf = (s) => classifyRhythmicType(beats(s));

describe("classifyRhythmicType", () => {
  test("IV — developed simple rhythm: A–T", () => {
    assert.equal(typeOf("AT"), "IV");
  });

  test("V — compound rhythm: two or more arses to one thesis", () => {
    assert.equal(typeOf("AAT"), "V");
    assert.equal(typeOf("AAAT"), "V");
  });

  test("VI — compound rhythm: one arsis to two or more theses", () => {
    assert.equal(typeOf("ATT"), "VI");
    assert.equal(typeOf("ATTT"), "VI");
  });

  test("VII — regular alternation A–T–A–T", () => {
    assert.equal(typeOf("ATAT"), "VII");
    assert.equal(typeOf("ATATAT"), "VII");
  });

  test("VIII — contraction: an irregular thesis→arsis seam (Suñol overlap)", () => {
    // A–T–A–A: alternation broken by a second arsis → a contraction, not VII.
    assert.equal(typeOf("ATAA"), "VIII");
    // A–A–T–A–T: the run of arses before the first seam is not strict alternation.
    assert.equal(typeOf("AATAT"), "VIII");
  });

  test("null — shapes that fit no type", () => {
    assert.equal(typeOf("A"), null);      // a lone beat: no chaining
    assert.equal(typeOf("AA"), null);     // all arsic, never resolves
    assert.equal(typeOf("TA"), null);     // an incise never begins thetic
    assert.equal(typeOf(""), null);       // empty
  });

  test("a single A–T seam that is not strict alternation is VIII, not VII", () => {
    // ATAT is VII (strict); a 2-beat AT is IV; but ATA (odd, ends arsic) has an
    // interior seam and is not a clean alternation of length ≥4 → VIII.
    assert.equal(typeOf("ATA"), "VIII");
  });
});

// Integration: the field is populated end-to-end on a built Score, and the beat
// sequence is exposed alongside it.
function makeChant(gabc, mode = "1") {
  return {
    id: "test:1", incipit: "Test", gabc, office: "or", genus: "Ordinarium",
    mode, modus: "Modus I", pages: [], source: { book: "Test", year: null, editor: null },
  };
}

describe("rhythmicType on the Score", () => {
  test("every phrase carries a beats sequence and a rhythmicType field", () => {
    const score = buildScore(makeChant("(c4) Pu(g)er(gh) na(hj)tus(j) est(j) (::)", "7"));
    assert.ok(score.phrases.length > 0);
    for (const phrase of score.phrases) {
      assert.ok(Array.isArray(phrase.beats));
      // rhythmicType is one of the known labels or null
      assert.ok(["IV", "V", "VI", "VII", "VIII", null].includes(phrase.rhythmicType));
      // the beats reconstruct from the same per-note stamps
      const noteCount = phrase.syllables.reduce((n, s) => n + s.notes.length, 0);
      const beatNotes = phrase.beats.reduce((n, b) => n + b.noteCount, 0);
      if (phrase.beats.length > 0) assert.equal(beatNotes, noteCount);
    }
  });
});
