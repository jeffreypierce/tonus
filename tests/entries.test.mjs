// The entry modules — that they resolve, and that they are the same library.
//
// Self-referencing imports ("tonus/inscriptio" from inside tonus) go through
// package.json `exports`, so this exercises the MAP a consumer uses, not the
// dist path a relative import would reach. A broken map fails here rather than
// in someone's build.
//
// The identity assertions are the point. A subpath that re-exported a COPY of a
// verb would look right in every other test and be wrong in the one way that
// matters: two module instances, two closures over the corpus, and a caller
// mixing entries would silently hold two libraries.
import test from "node:test";
import assert from "node:assert/strict";

import tonus from "tonus";
import { inscriptio } from "tonus/inscriptio";
import { census, CENSUS_GROUPS, CENSUS_ORDER, CENSUS_BLOCK_FLOATS } from "tonus/census";
import { cantus, corpus, SOURCES, HORAE, OFFICIA, ORDINARIA, MODI } from "tonus/corpus";

test("the entries resolve through package.json exports", () => {
  assert.equal(typeof inscriptio, "function");
  assert.equal(typeof census, "function");
  assert.equal(typeof cantus, "function");
  assert.equal(typeof corpus, "function");
});

test("a subpath verb IS the root verb, not a copy", () => {
  assert.equal(inscriptio, tonus.inscriptio);
  assert.equal(census, tonus.census);
  assert.equal(cantus, tonus.cantus);
  assert.equal(corpus, tonus.corpus);
});

test("a subpath constant IS the root constant", async () => {
  const root = await import("tonus");
  assert.equal(SOURCES, root.SOURCES);
  assert.equal(HORAE, root.HORAE);
  assert.equal(OFFICIA, root.OFFICIA);
  assert.equal(ORDINARIA, root.ORDINARIA);
  assert.equal(MODI, root.MODI);
  assert.equal(CENSUS_GROUPS, root.CENSUS_GROUPS);
  assert.equal(CENSUS_ORDER, root.CENSUS_ORDER);
});

test("the entries carry constants the root never exported", () => {
  // CENSUS_BLOCK_FLOATS is the block stride. It is NOT the sum of the
  // similarity groups, and the difference is the reason it is worth exporting:
  // flags rides at offset 0, and attest / extras / reserve ride past the last
  // group. A caller who derives the stride by measuring CENSUS_GROUPS — the
  // obvious move, and the one this export exists to stop — lands on 210 and
  // decodes every block after the first at the wrong offset.
  assert.equal(CENSUS_BLOCK_FLOATS, 221);
  const groupExtent = Object.values(CENSUS_GROUPS).reduce(
    (n, g) => Math.max(n, g.offset + g.count),
    0,
  );
  assert.equal(groupExtent, 210, "the eight similarity groups end at 210");
  assert.equal(
    CENSUS_BLOCK_FLOATS - groupExtent,
    11,
    "eleven floats ride the block without being similarity dimensions",
  );
});

test("the geometry contract holds across the entry seam", () => {
  // tonus/corpus finds it, the root notates it, tonus/inscriptio draws it, and
  // geometry[i] is still tabula[i]. This is the invariant the split must not
  // cost: it is what a downstream playhead and every hit target read.
  const [chant] = cantus({ incipit: "Puer natus est", limit: 1 });
  const score = tonus.notatio(chant);
  const { svg, geometry } = inscriptio(score, { width: 680 });
  assert.ok(svg.startsWith("<svg"), "inscriptio returns an svg document");
  assert.equal(geometry.length, score.tabula.length);
});

test("census reaches the same chant the shelf handed over", () => {
  const [chant] = cantus({ incipit: "Puer natus est", limit: 1 });
  assert.ok(CENSUS_ORDER.includes(chant.id));
  const result = census({ id: chant.id, k: 3 });
  assert.equal(result.id, chant.id);
  assert.equal(result.neighbors.length, 3);
});
