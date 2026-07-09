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

  test("VIII — contraction: an irregular seam that still resolves (ends thetic)", () => {
    // A–A–T–A–T: a run of arses before the first seam is not strict alternation,
    // but the incise resolves (ends thetic) — two rhythms overlapping at an ictus.
    assert.equal(typeOf("AATAT"), "VIII");
    // A–T–A–T–T: alternation broken by a doubled final thesis, still resolved.
    assert.equal(typeOf("ATATT"), "VIII");
  });

  test("null — shapes that fit no type", () => {
    assert.equal(typeOf("A"), null);      // a lone beat: no chaining
    assert.equal(typeOf("AA"), null);     // all arsic, never resolves
    assert.equal(typeOf("TA"), null);     // an incise never begins thetic
    assert.equal(typeOf(""), null);       // empty
  });

  test("a seam that leaves the incise hanging arsic is null, not a forced VIII", () => {
    // Contraction needs two *complete* rhythms sharing an ictus, so the whole
    // must end thetic. A–T–A ends arsic — unresolved — so it is no contraction;
    // likewise A–T–A–A. A wrong label is worse than none [biblio: carroll-chironomy].
    assert.equal(typeOf("ATA"), null);
    assert.equal(typeOf("ATAA"), null);
  });

  test("an alternation hanging arsic is null, not a forced VII", () => {
    // The same resolution gate applies to Type VII: in juxtaposition each arsis
    // begins a rhythm that a thesis must close [biblio: sunol-textbook], so
    // A–T–A–T–A opens a rhythm it never closes — the odd-length sibling of
    // A–T–A, which was already null. Even-length alternation is unaffected.
    assert.equal(typeOf("ATATA"), null);
    assert.equal(typeOf("ATATATA"), null);
    assert.equal(typeOf("ATAT"), "VII");   // still VII — the gate changes nothing resolved
    assert.equal(typeOf("AATATA"), null);  // irregular seam, hanging arsic — still null
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
