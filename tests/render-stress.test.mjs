import { describe, test } from "node:test";
import assert from "node:assert/strict";
import tonus from "../dist/index.js";
import { buildStressPieces } from "../scripts/stress-pieces.mjs";

// The stress battery headless: one real corpus piece per genus must render
// full dress without throwing, and with no raw GABC markup surviving into
// the drawn lyrics — breadth where the lab battery has depth.
describe("render stress — a real piece from every genus renders", () => {
  const pieces = buildStressPieces(tonus);

  test("the battery covers a broad slice of the corpus", () => {
    assert.ok(pieces.length >= 10, `${pieces.length} pieces`);
  });

  for (const piece of pieces) {
    test(piece.title, () => {
      const { svg, geometry } = piece.render();
      assert.ok(svg.length > 500, "substantial SVG");
      assert.ok(geometry.length > 0, "geometry rides along");
      assert.ok(!/&lt;(sp|i|b|c|v|eu|alt|nlba|clear)&gt;/.test(svg), "no raw tag soup in the lyrics");
    });
  }
});
