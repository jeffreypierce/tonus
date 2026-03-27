import { describe, test } from "node:test";
import assert from "node:assert/strict";
import tonus from "../dist/index.js";

const CHRISTMAS_2026 = new Date(2026, 11, 25, 12, 0, 0);

describe("caelum", () => {
  test("returns all 8 bodies by default", () => {
    const sky = tonus.caelum({ date: CHRISTMAS_2026 });
    assert.equal(sky.bodies.length, 8);
    const names = sky.bodies.map((b) => b.name);
    assert.deepEqual(names.sort(), [
      "Earth", "Jupiter", "Mars", "Mercury", "Moon", "Saturn", "Sun", "Venus",
    ]);
  });

  test("each body has a Latin nomen", () => {
    const sky = tonus.caelum({ date: CHRISTMAS_2026 });
    const sun = sky.bodies.find((b) => b.name === "Sun");
    const moon = sky.bodies.find((b) => b.name === "Moon");
    const jupiter = sky.bodies.find((b) => b.name === "Jupiter");
    assert.equal(sun.nomen, "Sol");
    assert.equal(moon.nomen, "Luna");
    assert.equal(jupiter.nomen, "Iuppiter");
  });

  test("bodies have expected positional fields", () => {
    const sky = tonus.caelum({ date: CHRISTMAS_2026 });
    for (const body of sky.bodies) {
      assert.ok(typeof body.geo.lon === "number");
      assert.ok(typeof body.geo.lat === "number");
      assert.ok(typeof body.helio.lon === "number");
      assert.ok(typeof body.speed === "number");
      assert.ok(typeof body.zodiac === "number");
      assert.ok(body.zodiac >= 0 && body.zodiac <= 11);
    }
  });

  test("Sun has elongation 0 and phase 1", () => {
    const sky = tonus.caelum({ date: CHRISTMAS_2026 });
    const sun = sky.bodies.find((b) => b.name === "Sun");
    assert.equal(sun.elongation, 0);
    assert.equal(sun.phase, 1);
  });

  test("Moon has distEarthRadii", () => {
    const sky = tonus.caelum({ date: CHRISTMAS_2026 });
    const moon = sky.bodies.find((b) => b.name === "Moon");
    assert.ok(typeof moon.distEarthRadii === "number");
    assert.ok(moon.distEarthRadii > 50 && moon.distEarthRadii < 70);
  });

  test("filters bodies by name", () => {
    const sky = tonus.caelum({ date: CHRISTMAS_2026, bodies: ["Sun", "Moon"] });
    assert.equal(sky.bodies.length, 2);
    assert.deepEqual(
      sky.bodies.map((b) => b.name).sort(),
      ["Moon", "Sun"],
    );
  });

  test("detects aspects between bodies", () => {
    const sky = tonus.caelum({ date: CHRISTMAS_2026 });
    assert.ok(Array.isArray(sky.aspects));
    for (const asp of sky.aspects) {
      assert.ok(["conjunction", "opposition", "trine", "square", "sextile"].includes(asp.type));
      assert.equal(asp.bodies.length, 2);
      assert.ok(asp.strength >= 0 && asp.strength <= 1);
    }
  });

  test("defaults to current date when no date provided", () => {
    const sky = tonus.caelum();
    assert.ok(sky.date instanceof Date);
    assert.equal(sky.bodies.length, 8);
  });
});
