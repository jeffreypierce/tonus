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

describe("moderna spacing (rule 1)", () => {
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
});
