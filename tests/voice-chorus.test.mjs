import test from "node:test";
import assert from "node:assert/strict";
import tonus from "../dist/index.js";

test("chorus: the schola is the default monastic body", () => {
  const c = tonus.chorus("schola", { seed: 991 });
  assert.equal(c.size, 7); // 4 tenors + 3 baritones
});

test("chorus: an unknown consortium throws with guidance", () => {
  assert.throws(() => tonus.chorus("nope"), /unknown consortium/);
});

test("chorus: a custom roster builds", () => {
  const c = tonus.chorus({ voces: [["tenor", 4], ["bassus", 3]], seed: 1 });
  assert.equal(c.size, 7);
});

test("chorus: cantor(i) returns a Vox with that character", () => {
  const c = tonus.chorus("schola", { seed: 991 });
  const singer = c.cantor(3);
  assert.equal(singer.formantes("e").length, 5);
});

test("chorus: out-of-range cantor throws", () => {
  const c = tonus.chorus("duo", { seed: 1 });
  assert.throws(() => c.cantor(9), /no cantor 9/);
});

test("chorus: dispersio reports one deviation sheet per cantor", () => {
  const d = tonus.chorus("schola", { seed: 991 }).dispersio();
  assert.equal(d.length, 7);
  for (const row of d) {
    assert.equal(typeof row.detuneCents, "number");
    assert.equal(typeof row.timingMs, "number");
  }
});

test("chorus: two identical seeds produce byte-identical choirs", () => {
  const a = tonus.chorus("schola", { seed: 991 });
  const b = tonus.chorus("schola", { seed: 991 });
  assert.deepEqual(a.dispersio(), b.dispersio());
  assert.deepEqual(a.spectrum(196, "e"), b.spectrum(196, "e"));
});

test("chorus: different seeds produce different choirs", () => {
  const a = tonus.chorus("schola", { seed: 1 }).dispersio();
  const b = tonus.chorus("schola", { seed: 2 }).dispersio();
  assert.notDeepEqual(a, b);
});

test("chorus: the summed spectrum has the requested length", () => {
  const s = tonus.chorus("schola", { seed: 991 }).spectrum(196, "e", 40);
  assert.equal(s.length, 40);
  assert.ok(s[0] > 0);
});

test("chorus: per-cantor formant tables, one per singer", () => {
  const f = tonus.chorus("schola", { seed: 991 }).formantes("a");
  assert.equal(f.length, 7);
  assert.equal(f[0].length, 5);
});
