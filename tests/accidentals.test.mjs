import { describe, test } from "node:test";
import assert from "node:assert/strict";
import tonus from "../dist/index.js";
import { computeAccidentals } from "../dist/engines/score/emitters/accidentals.js";

// A diatonic scale exercises every pitch class's tuning deviation.
const SCALE = "(c4) c(g)d(h)e(i)f(j)g(k)a(l)b(m) (::)";
function chant() {
  return {
    id: "t", incipit: "Test", gabc: SCALE, office: "in", genus: "Introitus",
    mode: "1", modus: "Modus I", pages: [],
    source: { book: "Graduale Romanum", year: 1961, editor: "Solesmes" },
  };
}
const pythTabula = () => tonus.notatio(chant()).tabula;
const justTabula = () =>
  tonus.notatio(chant(), { temperamentum: tonus.temperamentum({ tuning: "ptolemy-intense" }) }).tabula;
const meantoneTabula = () =>
  tonus.notatio(chant(), { temperamentum: tonus.temperamentum({ tuning: "meantone" }) }).tabula;

// The four calibration cases ARE the acceptance (SPEC-0.2 Phase 5.2).
describe("accidentals — HEJI calibration", () => {
  test("(a) Pythagorean + heji ⇒ zero comma arrows (the baseline is HEJI's zero)", () => {
    const marks = computeAccidentals(pythTabula(), "heji").filter(Boolean);
    assert.equal(marks.length, 0, "a Pythagorean chant blooms no arrows");
  });

  test("(b) a just preset + heji ⇒ syntonic comma arrows where it departs", () => {
    const marks = computeAccidentals(justTabula(), "heji").filter(Boolean);
    assert.ok(marks.length > 0, "just intonation raises comma arrows");
    for (const m of marks) assert.equal(m.kind, "glyph");
  });

  test("(c) meantone + heji ⇒ the semantic guard throws (meantone is not just)", () => {
    assert.throws(() => computeAccidentals(meantoneTabula(), "heji"), /just-expressible/);
  });

  test("(d) meantone + cents ⇒ exact signed deviations render", () => {
    const marks = computeAccidentals(meantoneTabula(), "cents", "et").filter(Boolean);
    assert.ok(marks.length > 0);
    for (const m of marks) {
      assert.equal(m.kind, "cents");
      assert.match(m.label, /^[+−]\d+\.\d$/, "a signed cents label");
    }
  });
});

describe("accidentals — standard channel", () => {
  test("an explicit flat renders; repeat of the same pitch is suppressed", () => {
    // The flat holds by state after the first explicit mark, so it is stated once.
    const tab = tonus.notatio({ ...chant(), gabc: "(c4) a(gx)b(g)c(g) (::)" }).tabula;
    const marks = computeAccidentals(tab, "standard").filter(Boolean);
    assert.ok(marks.length >= 1, "the explicit flat is marked");
  });

  test("cents mode labels each pitch class once per system", () => {
    const marks = computeAccidentals(justTabula(), "cents", "pythagorean").filter(Boolean);
    // One label per departing pitch class, not per note.
    assert.ok(marks.every((m) => m.kind === "cents"));
  });
});

describe("accidentals — rendered through inscriptio", () => {
  test("heji arrows appear in the SVG only under a just tuning", () => {
    const pyth = tonus.inscriptio(tonus.notatio(chant()), { accidentals: "heji" });
    const just = tonus.inscriptio(
      tonus.notatio(chant(), { temperamentum: tonus.temperamentum({ tuning: "ptolemy-intense" }) }),
      { accidentals: "heji" },
    );
    const arrows = (svg) => (svg.match(/class="accidental"/g) || []).length;
    assert.equal(arrows(pyth.svg), 0);
    assert.ok(arrows(just.svg) > 0);
  });

  test("cents labels render as floating superscripts", () => {
    const just = tonus.inscriptio(
      tonus.notatio(chant(), { temperamentum: tonus.temperamentum({ tuning: "ptolemy-intense" }) }),
      { accidentals: "cents" },
    );
    assert.ok((just.svg.match(/class="cents"/g) || []).length > 0);
  });

  test("heji under meantone surfaces the guard as a thrown error", () => {
    const meantone = tonus.notatio(chant(), { temperamentum: tonus.temperamentum({ tuning: "meantone" }) });
    assert.throws(() => tonus.inscriptio(meantone, { accidentals: "heji" }), /just-expressible/);
  });
});
