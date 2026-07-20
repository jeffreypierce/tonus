import { describe, test } from "node:test";
import assert from "node:assert/strict";
import tonus from "../dist/index.js";
import { buildScore } from "../dist/engines/score/api.js";
import { detectModulations } from "../dist/engines/score/modulation.js";

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

describe("detectModulations", () => {
  test("Christus resurgens (mode 8) leans toward mode 3, as Suñol describes", () => {
    // Suñol's own worked example: this chant modulates internally through the
    // Deuterus (mode 3) region. The detector should flag mode-3 passages.
    const chant = tonus
      .cantus({ incipit: "Christus resurgens" })
      .find((c) => c.mode === "8");
    assert.ok(chant, "Christus resurgens (mode 8) is in the corpus");
    const score = tonus.notatio(chant, {
      temperamentum: tonus.temperamentum({ mode: 8 }),
    });
    assert.ok(score.modulations.length > 0, "at least one modulation detected");
    assert.ok(
      score.modulations.some((m) => m.toMode === 3),
      "a modulation toward mode 3 (Deuterus), per Suñol",
    );
  });

  test("each modulation is a well-formed span", () => {
    const chant = tonus
      .cantus({ incipit: "Christus resurgens" })
      .find((c) => c.mode === "8");
    const score = tonus.notatio(chant, {
      temperamentum: tonus.temperamentum({ mode: 8 }),
    });
    for (const m of score.modulations) {
      assert.ok(m.endPhrase >= m.startPhrase); // a span, not inverted
      assert.ok(m.toMode >= 1 && m.toMode <= 8);
      assert.notEqual(m.toMode, 8); // never "modulates" to the home mode
      assert.ok(m.confidence > 0 && m.confidence <= 1);
    }
  });

  test("Christus resurgens reads as genuine modulation, not transposition", () => {
    // It closes on its own final; its deuterus excursion is internal.
    const chant = tonus
      .cantus({ incipit: "Christus resurgens" })
      .find((c) => c.mode === "8");
    const score = tonus.notatio(chant, {
      temperamentum: tonus.temperamentum({ mode: 8 }),
    });
    for (const m of score.modulations) assert.equal(m.kind, "modulation");
  });

  test("Exaltabo te (the transposed mode-2 introit) reads as transposition", () => {
    // The textbook affinal case: notated a fifth up, it never closes on D —
    // the foreign frame is global, so its spans are transposition, not
    // modulation.
    const chant = tonus
      .cantus({ source: "gr" })
      .find((c) => c.id === "gregobase:648");
    assert.ok(chant, "Exaltabo te (gregobase:648) is in the corpus");
    const score = tonus.notatio(chant);
    assert.ok(score.modulations.length > 0);
    assert.ok(
      score.modulations.some((m) => m.kind === "transposition"),
      "the dominant foreign frame is flagged as transposition",
    );
  });

  test("a firmly mode-1 phrase modulates nowhere", () => {
    // Centred on the mode-1 poles — the final D and the tenor A — so no foreign
    // mode outscores home.
    const score = buildScore(makeChant("(c4) a(d) b(a) c(g) d(a) e(d.) (::)", "1"));
    assert.equal(score.modulations.length, 0);
  });

  test("no mode: no modulations (graceful degradation)", () => {
    const score = buildScore(makeChant("(c4) a(f) b(g) c(a.) (::)", "1"));
    // detectModulations with no home mode returns nothing.
    assert.deepEqual(detectModulations(score.phrases, undefined), []);
  });

  test("consecutive phrases leaning to the same mode merge into one span", () => {
    const chant = tonus
      .cantus({ incipit: "Christus resurgens" })
      .find((c) => c.mode === "8");
    const score = tonus.notatio(chant, {
      temperamentum: tonus.temperamentum({ mode: 8 }),
    });
    // No two modulations should be adjacent with the same target (they'd merge).
    const sorted = [...score.modulations].sort((a, b) => a.startPhrase - b.startPhrase);
    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const cur = sorted[i];
      const adjacentSameMode =
        cur.startPhrase === prev.endPhrase + 1 && cur.toMode === prev.toMode;
      assert.ok(!adjacentSameMode, "adjacent same-mode spans must be merged");
    }
  });
});
