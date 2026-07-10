import { describe, test } from "node:test";
import assert from "node:assert/strict";
import tonus from "../dist/index.js";
import { buildPlates } from "../scripts/lab-plates.mjs";

// The render-regression smoke: every lab plate must render. The same battery
// backs the visual gallery (npm run lab); a new rendering feature earns a
// plate there and is exercised here for free.
describe("the render lab battery", () => {
  const plates = buildPlates(tonus); // reference-only fonts: runs anywhere
  for (const plate of plates) {
    test(plate.title, () => {
      const { svg, geometry } = plate.render();
      assert.ok(svg.startsWith("<svg"), "renders an svg");
      assert.ok(svg.length > 500, "svg has substance");
      assert.ok(Array.isArray(geometry) && geometry.length > 0, "geometry rides along");
    });
  }

  test("the battery is deterministic (same plate twice, byte-identical)", () => {
    const a = plates[0].render().svg;
    const b = plates[0].render().svg;
    assert.equal(a, b);
  });
});
