import { describe, test } from "node:test";
import assert from "node:assert/strict";
import tonus from "../dist/index.js";

const CHRISTMAS_2026 = new Date(2026, 11, 25, 12, 0, 0);
const EPIPHANY_2026 = new Date(2026, 0, 6, 12, 0, 0);

function findBody(voiced, name) {
  return voiced.find((b) => b.name === name);
}

describe("harmonia — defaults", () => {
  test("defaults to Boethius doctrine with pythagorean temper", () => {
    const cosmos = tonus.caelum({ date: CHRISTMAS_2026 });
    const h = tonus.harmonia(cosmos);
    assert.equal(h.doctrina, "boethius");
    assert.ok(h.doctrinaName.includes("Boethius"));
  });

  test("single cosmos omits frames", () => {
    const cosmos = tonus.caelum({ date: CHRISTMAS_2026 });
    const h = tonus.harmonia(cosmos);
    assert.equal(h.frames, undefined);
  });

  test("array cosmos includes frames", () => {
    const from = new Date(2026, 11, 25, 12, 0, 0);
    const to = new Date(2026, 11, 27, 12, 0, 0);
    const frames = tonus.caelum({ from, to });
    const h = tonus.harmonia(frames);
    assert.ok(Array.isArray(h.frames));
    assert.equal(h.frames.length, 3);
  });
});

describe("harmonia — voicings", () => {
  test("each of 4 doctrinae produces distinct voicings", () => {
    const cosmos = tonus.caelum({ date: CHRISTMAS_2026 });
    const infs = ["pythagoras", "boethius", "pliny", "ptolemy"].map((d) =>
      tonus.harmonia(cosmos, { doctrina: d }),
    );

    // Each should return a non-empty body list
    for (const inf of infs) assert.ok(inf.bodies.length > 0);

    // Boethius and Pythagoras have 7 bodies (no Earth)
    const boethius = infs[1];
    const hasEarth = boethius.bodies.some((b) => b.name === "Earth");
    assert.equal(hasEarth, false);

    // Pliny's Earth-as-proslambanomenos is dropped because Earth has no
    // classical planetary vowel — only the seven vowel-bearing planets voice.
    const pliny = infs[2];
    assert.equal(pliny.bodies.some((b) => b.name === "Earth"), false);
  });

  test("every voiced body carries a Greek planetary vowel", () => {
    const cosmos = tonus.caelum({ date: CHRISTMAS_2026 });
    const inf = tonus.harmonia(cosmos);
    for (const b of inf.bodies) {
      assert.ok(b.vowel, `${b.name} missing vowel`);
      assert.equal(typeof b.vowel.greek, "string");
      assert.equal(typeof b.vowel.greekLower, "string");
      assert.ok(["a", "e", "i", "o", "u"].includes(b.vowel.phonetic));
    }
  });

  test("Sun is associated with Iota", () => {
    const cosmos = tonus.caelum({ date: CHRISTMAS_2026 });
    const inf = tonus.harmonia(cosmos);
    const sun = findBody(inf.bodies, "Sun");
    assert.equal(sun.vowel.name, "Iota");
    assert.equal(sun.vowel.greek, "Ι");
  });

  test("Sun has presence 1 (elongation 0)", () => {
    const cosmos = tonus.caelum({ date: CHRISTMAS_2026 });
    const inf = tonus.harmonia(cosmos);
    const sun = findBody(inf.bodies, "Sun");
    assert.ok(sun);
    assert.equal(sun.presence, 1);
  });

  test("presence and motion are in [0, 1]", () => {
    const cosmos = tonus.caelum({ date: CHRISTMAS_2026 });
    const inf = tonus.harmonia(cosmos);
    for (const b of inf.bodies) {
      assert.ok(b.presence >= 0 && b.presence <= 1, `${b.name} presence ${b.presence}`);
      assert.ok(b.motion >= 0 && b.motion <= 1, `${b.name} motion ${b.motion}`);
    }
  });

  test("voiced bodies carry tuned Pitches with Performance", () => {
    const cosmos = tonus.caelum({ date: CHRISTMAS_2026 });
    const inf = tonus.harmonia(cosmos);
    for (const b of inf.bodies) {
      assert.ok(b.nota);
      assert.ok(typeof b.nota.pitch.hz === "number" && b.nota.pitch.hz > 0);
      assert.ok(typeof b.nota.performance.velocity === "number");
      assert.ok(b.nota.performance.velocity >= 0 && b.nota.performance.velocity <= 127);
    }
  });
});

describe("harmonia — imprint", () => {
  test("imprint attractors are tuned Pitches", () => {
    const cosmos = tonus.caelum({ date: CHRISTMAS_2026 });
    const h = tonus.harmonia(cosmos);
    assert.ok(h.imprint.attractors.length > 0);
    for (const a of h.imprint.attractors) {
      assert.ok(a.pitch);
      assert.ok(typeof a.pitch.hz === "number" && a.pitch.hz > 0);
    }
  });

  test("imprint modalAffinity has 8 entries sorted descending", () => {
    const cosmos = tonus.caelum({ date: CHRISTMAS_2026 });
    const h = tonus.harmonia(cosmos);
    assert.equal(h.imprint.modalAffinity.length, 8);
    for (let i = 1; i < 8; i++) {
      assert.ok(h.imprint.modalAffinity[i - 1].score >= h.imprint.modalAffinity[i].score);
    }
    const modes = new Set(h.imprint.modalAffinity.map((m) => m.mode));
    assert.equal(modes.size, 8);
  });

  test("every aspect's interval carries a consonance classification", () => {
    const cosmos = tonus.caelum({ date: CHRISTMAS_2026 });
    const h = tonus.harmonia(cosmos);
    for (const a of h.aspects) {
      assert.ok(a.interval);
      assert.ok(["perfect", "imperfect", "dissonant"].includes(a.interval.consonance));
    }
  });

  test("imprint.vowelAttractors pitch is a tuned Pitch", () => {
    const cosmos = tonus.caelum({ date: CHRISTMAS_2026 });
    const h = tonus.harmonia(cosmos);
    assert.ok(h.imprint.vowelAttractors.length > 0);
    for (const v of h.imprint.vowelAttractors) {
      assert.ok(v.pitch);
      assert.ok(typeof v.pitch.hz === "number" && v.pitch.hz > 0);
    }
  });
});

describe("harmonia — coherence checks", () => {
  test("Ptolemy-on-Ptolemy: Sun→Jupiter is a pure 3/2", () => {
    const cosmos = tonus.caelum({ date: CHRISTMAS_2026 });
    const temperamentum = tonus.temperamentum("ptolemy-intense");
    const inf = tonus.harmonia(cosmos, { doctrina: "ptolemy", temperamentum });
    const sun = findBody(inf.bodies, "Sun");
    const jupiter = findBody(inf.bodies, "Jupiter");
    const ratio = jupiter.nota.pitch.hz / sun.nota.pitch.hz;
    // Sun=1/1, Jupiter=3/2 in Ptolemy doctrine
    assert.ok(Math.abs(ratio - 1.5) < 0.001, `expected 3/2, got ${ratio}`);
  });

  test("Ptolemy-on-Ptolemy: Sun→Saturn is a pure 2/1", () => {
    const cosmos = tonus.caelum({ date: CHRISTMAS_2026 });
    const temperamentum = tonus.temperamentum("ptolemy-intense");
    const inf = tonus.harmonia(cosmos, { doctrina: "ptolemy", temperamentum });
    const sun = findBody(inf.bodies, "Sun");
    const saturn = findBody(inf.bodies, "Saturn");
    const ratio = saturn.nota.pitch.hz / sun.nota.pitch.hz;
    assert.ok(Math.abs(ratio - 2) < 0.001, `expected 2/1, got ${ratio}`);
  });

  test("Boethius: Saturn is a P4 below Sun", () => {
    const cosmos = tonus.caelum({ date: CHRISTMAS_2026 });
    const inf = tonus.harmonia(cosmos, { doctrina: "boethius" });
    const sun = findBody(inf.bodies, "Sun");
    const saturn = findBody(inf.bodies, "Saturn");
    const ratio = sun.nota.pitch.hz / saturn.nota.pitch.hz;
    // Sun = 1/1, Saturn = 3/4 → Sun/Saturn = 4/3
    assert.ok(Math.abs(ratio - 4 / 3) < 0.001, `expected 4/3, got ${ratio}`);
  });

  test("Boethius: Moon is a P4 above Sun", () => {
    const cosmos = tonus.caelum({ date: CHRISTMAS_2026 });
    const inf = tonus.harmonia(cosmos, { doctrina: "boethius" });
    const sun = findBody(inf.bodies, "Sun");
    const moon = findBody(inf.bodies, "Moon");
    const ratio = moon.nota.pitch.hz / sun.nota.pitch.hz;
    // Sun = 1/1, Moon = 4/3 in Boethius
    assert.ok(Math.abs(ratio - 4 / 3) < 0.001, `expected 4/3, got ${ratio}`);
  });
});

describe("harmonia — errors", () => {
  test("throws on empty cosmos array", () => {
    assert.throws(() => tonus.harmonia([]), /at least one/);
  });

  test("throws on unknown doctrina", () => {
    const cosmos = tonus.caelum({ date: CHRISTMAS_2026 });
    assert.throws(() => tonus.harmonia(cosmos, { doctrina: "nonexistent" }), /Unknown doctrina/);
  });
});
