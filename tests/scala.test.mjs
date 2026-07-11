import { describe, test } from "node:test";
import assert from "node:assert/strict";
import tonus from "../dist/index.js";
import { parseScala } from "../dist/engines/temper/scale.js";

const MEANTONE_SCL = `! meanquar.scl
!
1/4-comma meantone scale. Pietro Aaron's temperament (1523)
 12
!
 76.04900
 193.15686
 310.26471
 5/4
 503.42157
 579.47057
 696.57843
 25/16
 889.73529
 1006.84314
 1082.89214
 2/1
`;

describe("parseScala", () => {
  test("parses a standard 12-note Scala file", () => {
    const result = parseScala(MEANTONE_SCL);
    assert.equal(result.name, "1/4-comma meantone scale. Pietro Aaron's temperament (1523)");
    assert.equal(result.steps.length, 12);
  });

  test("skips comment lines", () => {
    const scl = "! comment\nTest\n3\n! inline comment\n100.0\n3/2\n2/1\n";
    const result = parseScala(scl);
    assert.equal(result.steps.length, 3);
  });

  test("handles zero-note scale", () => {
    const scl = "Empty\n0\n";
    const result = parseScala(scl);
    assert.equal(result.name, "Empty");
    assert.equal(result.steps.length, 0);
  });

  test("throws on mismatched count", () => {
    const scl = "Bad\n5\n100.0\n200.0\n";
    assert.throws(() => parseScala(scl), /declares 5.*only 2/);
  });

  test("preserves trailing text on pitch lines for parseStep to handle", () => {
    const scl = "Test\n2\n100.0 cents\n2/1 octave\n";
    const result = parseScala(scl);
    assert.equal(result.steps.length, 2);
    assert.ok(result.steps[0].includes("100.0"));
    assert.ok(result.steps[1].includes("2/1"));
  });
});

describe("parseStep (Scala convention)", () => {
  test("period means cents: 100.0 → ratio for 100 cents", () => {
    const t = tonus.temperamentum({ scale: ["100.0", "200.0", "300.0", "400.0", "500.0", "600.0", "700.0", "800.0", "900.0", "1000.0", "1100.0", "1200.0"] });
    // Equal temperament via cents — all intervals should be ~100 cents apart
    for (let i = 1; i < t.cents.length; i++) {
      const diff = t.cents[i] - t.cents[i - 1];
      assert.ok(Math.abs(diff - 100) < 0.01, `interval ${i} is ${diff} cents, expected ~100`);
    }
  });

  test("slash means ratio: 3/2 → 1.5", () => {
    const t = tonus.temperamentum({ scale: ["3/2", "3/2", "3/2", "3/2", "3/2", "3/2", "3/2", "3/2", "3/2", "3/2", "3/2", "2/1"] });
    assert.ok(t.ratios.length === 12);
  });

  test("bare integer means ratio: 2 = 2/1", () => {
    const t = tonus.temperamentum({ scale: ["9/8", "5/4", "4/3", "3/2", "5/3", "15/8", "2", "2", "2", "2", "2", "2"] });
    assert.ok(t.ratios.length === 12);
  });

  test("period without trailing digits still means cents: 408.", () => {
    const scl = "Test\n1\n408.\n";
    const result = parseScala(scl);
    assert.equal(result.steps.length, 1);
    assert.equal(result.steps[0], "408.");
  });
});

describe("temper with Scala file", () => {
  test("accepts a Scala file string and extracts the tuning name", () => {
    const t = tonus.temperamentum({ scale: MEANTONE_SCL });
    assert.equal(t.tuning, "1/4-comma meantone scale. Pietro Aaron's temperament (1523)");
    assert.equal(t.ratios.length, 12);
    assert.equal(t.cents.length, 12);
  });

  test("explicit tuning name overrides Scala file description", () => {
    const t = tonus.temperamentum({ tuning: "aaron", scale: MEANTONE_SCL });
    assert.equal(t.tuning, "aaron");
  });

  test("Scala file produces valid hz values via nota", () => {
    const t = tonus.temperamentum({ scale: MEANTONE_SCL, mode: 1 });
    const a4 = t.nota("A4");
    assert.ok(Math.abs(a4.hz - 440) < 0.1);
    const d4 = t.nota("D4");
    assert.ok(d4.hz > 0);
  });

  test("Scala file with 7 notes expands to 12 via diatonic fill", () => {
    const scl = "Just 7\n7\n9/8\n5/4\n4/3\n3/2\n5/3\n15/8\n2/1\n";
    const t = tonus.temperamentum({ scale: scl, mode: 1 });
    assert.equal(t.ratios.length, 12);
  });
});

describe("temper with scale array", () => {
  test("array of 12 cent strings works", () => {
    const steps = Array.from({ length: 12 }, (_, i) => `${(i + 1) * 100}.0`);
    const t = tonus.temperamentum({ scale: steps });
    assert.equal(t.tuning, "custom");
    assert.equal(t.ratios.length, 12);
  });

  test("array of 7 ratio strings expands to 12", () => {
    const t = tonus.temperamentum({ scale: ["9/8", "5/4", "4/3", "3/2", "5/3", "15/8", "2/1"], mode: 1 });
    assert.equal(t.ratios.length, 12);
  });
});

describe("step conventions (silent-mistuning regression)", () => {
  // A degree list begins at 1/1; a Scala list ends at 2/1. Both are accepted
  // and normalized; ambiguous input throws. A standard .scl once landed
  // off-by-one — every pc mistuned — because its steps filled the 1/1 slot.
  const JUST = ["1/1", "9/8", "5/4", "4/3", "3/2", "5/3", "15/8"];
  const JUST_SCALA = ["9/8", "5/4", "4/3", "3/2", "5/3", "15/8", "2/1"];

  test("a .scl file agrees with the builtin it describes, every pitch", () => {
    const viaScl = tonus.temperamentum({ scale: MEANTONE_SCL, root: 0 });
    const builtin = tonus.temperamentum({ tuning: "meantone", root: 0 });
    for (let midi = 48; midi <= 72; midi++) {
      const dev = 1200 * Math.log2(viaScl.nota(midi).hz / builtin.nota(midi).hz);
      assert.ok(Math.abs(dev) < 1e-4, `midi ${midi} deviates ${dev}¢`);
    }
  });

  test("both 7-step conventions produce the identical temperament", () => {
    const a = tonus.temperamentum({ scale: JUST, mode: 1 });
    const b = tonus.temperamentum({ scale: JUST_SCALA, mode: 1 });
    assert.deepEqual(a.ratios, b.ratios);
  });

  test("7-step rotation is exact: the fixed gamut yields each mode's species", () => {
    const t = tonus.temperamentum({ scale: JUST, mode: 1 });
    const cents = (x, y) => 1200 * Math.log2(t.nota(y).hz / t.nota(x).hz);
    assert.ok(Math.abs(cents("D4", "F4") - 294.135) < 0.01);  // 32/27
    assert.ok(Math.abs(cents("D4", "A4") - 680.449) < 0.01);  // 40/27 — the honest wolf
    const t8 = tonus.temperamentum({ scale: JUST, mode: 8 });
    const c8 = (x, y) => 1200 * Math.log2(t8.nota(y).hz / t8.nota(x).hz);
    assert.ok(Math.abs(c8("G4", "B4") - 386.314) < 0.01);     // pure 5/4
  });

  test("a scale with neither anchor throws rather than guessing", () => {
    assert.throws(
      () => tonus.temperamentum({ scale: ["9/8", "5/4", "4/3", "3/2", "5/3", "15/8", "17/9"] }),
      /begin at 1\/1 .* or end at 2\/1/,
    );
  });
});
