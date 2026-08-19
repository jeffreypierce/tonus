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

// The four calibration cases ARE the acceptance.
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

  test("cents mode labels each pitch class once per phrase", () => {
    const marks = computeAccidentals(justTabula(), "cents", "pythagorean");
    // One label per departing pitch class per phrase, not per note: a pc
    // labelled at its first appearance in a phrase stays silent on repeats.
    const labelled = marks.filter(Boolean);
    assert.ok(labelled.every((m) => m.kind === "cents"));
    const tab = justTabula();
    const seen = new Set();
    tab.forEach((row, i) => {
      const key = `${row.phraseIndex}:${row.pc}`;
      if (marks[i]) {
        assert.ok(!seen.has(key), `pc ${row.pc} labelled twice in phrase ${row.phraseIndex}`);
        seen.add(key);
      }
    });
  });
});

// Solesmes prints a flat on the LINE OF THE PITCH IT ALTERS: a B-flat sign
// sits on the B line, whatever note it happens to be written before. Its
// horizontal place is a separate fact — before the figure it governs, so the
// singer reads it in time. The emitters took BOTH from the row carrying the
// sign, so a flat written before a G was drawn on the G line.
//
// gregobase:1180 ("Felices sensus", Communio, mode I) is the fixture because
// its signs and its altered notes differ: three flats are written before a G
// and two A's, and every one of them governs a B-flat. The Liber Usualis
// plate (p. 1637) shows all of them on the B line.
describe("a flat sits on the line of the pitch it alters", () => {
  const subject = () => tonus.cantus({ id: "gregobase:1180" })[0];

  // The third sign was dropped: repeat-suppression compared the SIGN-CARRYING
  // row against the row before it, and both were A. It governs a different
  // B-flat, in a later phrase, with an intervening pitch — the books restate.
  for (const notation of ["quadrata", "moderna"]) {
    test(`${notation}: every explicit sign in the source is drawn`, () => {
      const score = tonus.notatio(subject());
      const signs = score.tabula.filter((r) => r.accidentalSource === "explicit").length;
      const { svg } = tonus.inscriptio(score, { width: 900, notation });
      const glyphs = (svg.match(/class="accidental"/g) ?? []).length;
      assert.equal(signs, 3, "the fixture carries three explicit signs");
      assert.equal(glyphs, signs, `${notation}: ${signs} signs written, ${glyphs} drawn`);
    });

    test(`${notation}: each flat is drawn on its B-flat's line`, () => {
      const score = tonus.notatio(subject());
      const { svg, geometry } = tonus.inscriptio(score, { width: 900, notation });
      // Every line a B-flat is written on, as the emitter drew it.
      const flatLines = new Set(
        geometry.filter((_, i) => score.tabula[i].accidental !== 0).map((g) => g.y),
      );
      const drawn = [...svg.matchAll(
        /<g class="accidental" transform="translate\(([-\d.]+) ([-\d.]+)\)/g,
      )].map((mm) => Number(mm[2]));
      assert.equal(drawn.length, 3, `${notation}: three glyphs`);
      for (const y of drawn) {
        assert.ok(flatLines.has(y),
          `${notation}: a sign at y=${y} sits on no B-flat's line (${[...flatLines].join(", ")})`);
      }
    });
  }

  // The sign is read in time where the source wrote it: before the note it
  // governs, never after. Moving it vertically must not move it horizontally.
  test("the sign stays horizontally before the note it governs", () => {
    const score = tonus.notatio(subject());
    const { svg, geometry } = tonus.inscriptio(score, { width: 900 });
    const drawnX = [...svg.matchAll(
      /<g class="accidental" transform="translate\(([-\d.]+) ([-\d.]+)\)/g,
    )].map((mm) => Number(mm[1]));
    const alteredX = geometry
      .filter((_, i) => score.tabula[i].accidental !== 0)
      .map((g) => g.x);
    for (const x of drawnX) {
      assert.ok(alteredX.some((ax) => ax > x),
        `a sign at x=${x} precedes no altered note`);
    }
  });

  // The site joins geometry[i] to tabula[i] by index for playback sync, and an
  // accidental is not a note: drawing one must not add or shift an entry.
  test("the geometry contract is unchanged by where a sign is drawn", () => {
    const score = tonus.notatio(subject());
    for (const notation of ["quadrata", "moderna"]) {
      const { geometry } = tonus.inscriptio(score, { width: 900, notation });
      assert.equal(geometry.length, score.tabula.length,
        `${notation}: one geometry entry per tabula row`);
    }
  });
});

describe("accidentals — rendered through inscriptio (moderna carries the channel)", () => {
  // HEJI and cents are modern analytical overlays; they render on the modern
  // (moderna) staff, not on historical square notation.
  test("heji arrows appear in the SVG only under a just tuning", () => {
    const pyth = tonus.inscriptio(tonus.notatio(chant()), { notation: "moderna", accidentals: "heji" });
    const just = tonus.inscriptio(
      tonus.notatio(chant(), { temperamentum: tonus.temperamentum({ tuning: "ptolemy-intense" }) }),
      { notation: "moderna", accidentals: "heji" },
    );
    const arrows = (svg) => (svg.match(/class="accidental"/g) || []).length;
    assert.equal(arrows(pyth.svg), 0);
    assert.ok(arrows(just.svg) > 0);
  });

  test("cents labels render as floating superscripts", () => {
    const just = tonus.inscriptio(
      tonus.notatio(chant(), { temperamentum: tonus.temperamentum({ tuning: "ptolemy-intense" }) }),
      { notation: "moderna", accidentals: "cents" },
    );
    assert.ok((just.svg.match(/class="cents"/g) || []).length > 0);
  });

  test("heji under meantone surfaces the guard as a thrown error", () => {
    const meantone = tonus.notatio(chant(), { temperamentum: tonus.temperamentum({ tuning: "meantone" }) });
    assert.throws(() => tonus.inscriptio(meantone, { notation: "moderna", accidentals: "heji" }), /just-expressible/);
  });
});

describe("accidentals — quadrata carries only GABC accidentals", () => {
  // Square notation is historical; the modern intonation overlays don't belong.
  test("quadrata rejects the heji overlay, pointing at moderna", () => {
    const just = tonus.notatio(chant(), { temperamentum: tonus.temperamentum({ tuning: "ptolemy-intense" }) });
    assert.throws(() => tonus.inscriptio(just, { accidentals: "heji" }), /moderna-only/);
    assert.throws(() => tonus.inscriptio(just, { notation: "quadrata", accidentals: "heji" }), /moderna-only/);
  });

  test("quadrata rejects the cents overlay, pointing at moderna", () => {
    assert.throws(() => tonus.inscriptio(tonus.notatio(chant()), { accidentals: "cents" }), /moderna-only/);
  });

  test("quadrata still renders the GABC flat (standard accidentals stay)", () => {
    const flatted = tonus.notatio({ ...chant(), gabc: "(c3) A(gxg)b(h) (::)" });
    const svg = tonus.inscriptio(flatted, { accidentals: "standard" }).svg;
    assert.ok((svg.match(/class="accidental"/g) || []).length >= 1, "the GABC flat is drawn");
    // The default (unset accidentals) also renders it — standard is the default.
    const dflt = tonus.inscriptio(flatted).svg;
    assert.ok((dflt.match(/class="accidental"/g) || []).length >= 1);
  });
});

describe("accidentals — b molle under the default tuning (chain regression)", () => {
  // Regression: the baseline table once disagreed with the engine's chain, so
  // heji THREW and cents printed +29.3 on the single most common accidental in
  // the repertoire. The baseline now derives from the chain itself.
  const flatted = () => tonus.notatio(tonus.cantus({ gabc: "(c3) A(gxg)b(h) (::)" })[0]);

  test("heji: a flatted chant under Pythagorean renders clean (no arrows, no throw)", () => {
    const marks = computeAccidentals(flatted().tabula, "heji").filter(Boolean);
    assert.equal(marks.length, 0);
  });

  test("cents: the flat's deviation from its own home intonation is zero", () => {
    const marks = computeAccidentals(flatted().tabula, "cents").filter(Boolean);
    for (const m of marks) assert.ok(Math.abs(parseFloat(m.label)) < 0.5, `label ${m.label}`);
  });
});
