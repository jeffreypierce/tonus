import { describe, test } from "node:test";
import assert from "node:assert/strict";
import tonus from "../dist/index.js";
import { joinStrokes, segmentGlyphs } from "../dist/engines/score/emitters/strokes.js";

const rows = (neume) => tonus.notatio(tonus.cantus({ gabc: `(c4) a(${neume})` })[0]).tabula;
const strokes = (neume) => joinStrokes(rows(neume));
const slurs = (neume) => {
  const { svg } = tonus.inscriptio(tonus.notatio(tonus.cantus({ gabc: `(c4) a(${neume})` })[0]), { notation: "moderna" });
  return (svg.match(/class="slur"/g) ?? []).length;
};

describe("joined strokes (moderna rule 1)", () => {
  test("a ligature is one stroke", () => {
    for (const lig of ["gh", "hg", "fgf", "dcd", "ghj", "fgfg", "fgfgf"]) {
      assert.equal(strokes(lig).length, 1, lig);
    }
  });

  test("detached marks are strokes of their own", () => {
    assert.deepEqual(strokes("evDC"), [[0], [1], [2]], "a climacus's inclinata are separate");
    assert.deepEqual(strokes("hvhv"), [[0], [1]], "a bivirga is two virgae");
  });

  test("a liquescent ends its glyph and a quilisma begins one", () => {
    assert.deepEqual(segmentGlyphs(rows("fe~g")), [[0, 1], [2]]);
    assert.deepEqual(segmentGlyphs(rows("fgwh")), [[0], [1, 2]]);
  });

  test("a run past the longest ligature breaks", () => {
    assert.deepEqual(strokes("hgfgh"), [[0, 1], [2, 3, 4]], "clivis, then scandicus");
  });
});

describe("pressus and stropha (moderna rule 3)", () => {
  test("glyphs meeting on one pitch are one stroke: the pressus", () => {
    assert.deepEqual(strokes("ffe"), [[0, 1, 2]]);
    assert.deepEqual(strokes("hjjg"), [[0, 1, 2, 3]]);
    assert.deepEqual(strokes("ffoe"), [[0, 1, 2]]);
  });

  test("single notes on one pitch stay apart: the stropha group", () => {
    assert.deepEqual(strokes("ff"), [[0], [1]]);
    assert.deepEqual(strokes("jsjs"), [[0], [1]]);
    assert.deepEqual(strokes("hsss"), [[0], [1], [2]]);
  });

  test("moderna slurs the strokes, not the figure", () => {
    assert.equal(slurs("evDC"), 0, "no slur over a climacus");
    assert.equal(slurs("jsjs"), 0, "no slur over a bistropha");
    assert.equal(slurs("ffe"), 1, "one slur over a pressus");
    assert.equal(slurs("hgfgh"), 2);
  });
});

describe("moderna spacing and the liquescent (rules 1 and 5)", () => {
  const render = (neume) => tonus.inscriptio(
    tonus.notatio(tonus.cantus({ gabc: `(c4) a(${neume})` })[0]), { notation: "moderna" });
  const gaps = (neume) => {
    const xs = render(neume).geometry.map((g) => g.x);
    return xs.slice(1).map((x, i) => Number((x - xs[i]).toFixed(2)));
  };

  test("tight inside a stroke, plain between detached marks, a gap between figures", () => {
    const [inStroke, betweenFigures] = gaps("gh/hg").filter((_, i) => i !== 2);
    assert.ok(inStroke < betweenFigures, `${inStroke} < ${betweenFigures}`);
    const [, detached] = gaps("hvGF");
    assert.ok(inStroke < detached && detached < betweenFigures, "an inclinatum sits between the two");
  });

  test("a liquescent takes a down stem, nothing else does", () => {
    const stems = (neume) => (render(neume).svg.match(/class="stem"/g) ?? []).length;
    assert.equal(stems("fe~"), 1);
    assert.equal(stems("hsss<"), 1);
    assert.equal(stems("fgf"), 0);
  });
});

describe("the moderna slur", () => {
  test("each end sits just above its own note", () => {
    // The slur once hung both ends at the first note's height: a rising
    // stroke ran into its top note, a falling one left a tail over nothing.
    for (const neume of ["gh", "ghj", "hg", "dcd", "fgf", "hjjg"]) {
      const { svg, geometry } = tonus.inscriptio(
        tonus.notatio(tonus.cantus({ gabc: `(c4) a(${neume})` })[0]), { notation: "moderna", scale: "large" });
      const m = /<path class="slur" d="M ([-\d.]+) ([-\d.]+) C (?:[-\d.]+ ){4}([-\d.]+) ([-\d.]+) /.exec(svg);
      assert.ok(m, `${neume}: a slur`);
      const [x0, y0, x1, y1] = m.slice(1).map(Number);
      const first = geometry[0], last = geometry[geometry.length - 1];
      assert.ok(Math.abs(x0 - first.x) < 0.1 && Math.abs(x1 - last.x) < 0.1, `${neume}: ends on the end heads`);
      for (const [y, head] of [[y0, first], [y1, last]]) {
        const above = head.y - y;
        assert.ok(above > 4 && above < 30, `${neume}: end ${above.toFixed(1)}px above its head`);
      }
    }
  });
});

describe("quadrata draws the same glyphs", () => {
  const xs = (neume) => tonus.inscriptio(tonus.notatio(tonus.cantus({ gabc: `(c4) a(${neume})` })[0])).geometry.map((g) => g.x);

  test("the glyphs of one figure stand apart", () => {
    // Ruled 2026-10-21: glyphs apart, the pressus included. hgf is a clivis
    // and a punctum; the punctum no longer abuts the clivis.
    const [, c1, p] = xs("hgf");
    const [a0, a1] = xs("hg");
    assert.ok(p - c1 > a1 - a0, `the punctum stands off: ${(p - c1).toFixed(2)} > ${(a1 - a0).toFixed(2)}`);
    const [p0, p1] = xs("ffe");
    const [s0, s1] = xs("ff");
    assert.equal((p1 - p0).toFixed(2), (s1 - s0).toFixed(2), "a pressus breathes as a stropha pair does");
  });

  test("a run past the longest ligature is drawn as its glyphs", () => {
    const svg = tonus.inscriptio(tonus.notatio(tonus.cantus({ gabc: "(c4) a(hgfgh)" })[0])).svg;
    assert.ok((svg.match(/class="stem"/g) ?? []).length >= 1, "the clivis takes its stem");
  });
});

describe("the separators, drawn", () => {
  const qx = (neume) => tonus.inscriptio(tonus.notatio(tonus.cantus({ gabc: `(c4) a(${neume})` })[0])).geometry.map((g) => g.x);
  const gap = (neume) => { const [a, b] = qx(neume); return b - a; };

  test("quadrata spaces each separator as gregorio does", () => {
    // ! cuts the glyph but stays in the figure: closer than /.
    assert.ok(gap("f!h") < gap("f/h"), "! is tighter than /");
    assert.ok(gap("f/0h") < gap("f/h") && gap("f/h") < gap("f//h"), "/0 < / < //");
    assert.ok(gap("f/[3]h") > gap("f//h"), "/[3] is three units");
    assert.ok(gap("f/[-1]h") < gap("f/0h"), "a negative space pulls back");
  });

  test("@ fuses; ! cuts; neither slurs across !", () => {
    assert.deepEqual(segmentGlyphs(rows("go@hv")), [[0, 1]], "a fused oriscus and virga are one glyph");
    assert.deepEqual(segmentGlyphs(rows("fg!hi")), [[0, 1], [2, 3]], "two pes");
    assert.deepEqual(strokes("f!fe"), [[0], [1, 2]], "no pressus across ! (ruling C)");
  });
});

