import { describe, test } from "node:test";
import assert from "node:assert/strict";
import tonus, { SIGNS, SIGNA } from "../dist/index.js";

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

describe("caelum range", () => {
  const FROM = new Date(2026, 11, 25);
  const TO = new Date(2026, 11, 31);

  test("returns Cosmos[] when from/to provided", () => {
    const frames = tonus.caelum({ from: FROM, to: TO });
    assert.ok(Array.isArray(frames));
    assert.equal(frames.length, 7); // 25, 26, 27, 28, 29, 30, 31
  });

  test("step of 7 days produces weekly snapshots", () => {
    const frames = tonus.caelum({
      from: new Date(2026, 0, 1),
      to: new Date(2026, 1, 1),
      step: 7,
    });
    assert.ok(frames.length >= 4 && frames.length <= 5);
  });

  test("single date returns Cosmos not array", () => {
    const sky = tonus.caelum({ date: FROM });
    assert.ok(!Array.isArray(sky));
    assert.ok(sky.bodies);
  });

  test("throws when to < from", () => {
    assert.throws(() => tonus.caelum({ from: TO, to: FROM }), /to must be >= from/);
  });

  test("throws when step <= 0", () => {
    assert.throws(() => tonus.caelum({ from: FROM, to: TO, step: 0 }), /step must be > 0/);
  });

  test("throws when range too large", () => {
    assert.throws(
      () => tonus.caelum({ from: new Date(2026, 0, 1), to: new Date(2060, 0, 1), step: 1 }),
      /max 10000/,
    );
  });

  test("throws when only from provided", () => {
    assert.throws(() => tonus.caelum({ from: FROM }), /requires both from and to/);
  });
});

describe("caelum — the sign is geocentric", () => {
  test("every body's sign agrees with its own geo.lon", () => {
    // A sign placement says where a body APPEARS from here: "Mars in
    // Sagittarius" has no meaning in any other frame. The planet builder read
    // the heliocentric longitude while the Sun's and Moon's read the
    // geocentric one, so a planet's reported sign contradicted its own
    // position — Mercury in Aries while appearing in Taurus.
    const cosmos = tonus.caelum();
    assert.ok(cosmos.bodies.length > 0, "the sky has bodies");
    // Earth is the exception, and rightly: seen from Earth it has no apparent
    // longitude, so its own sign is heliocentric — where it stands, not where
    // it appears.
    for (const b of cosmos.bodies.filter((x) => x.name !== "Earth")) {
      const sector = Math.floor((((b.geo.lon % 360) + 360) % 360) / 30) % 12;
      assert.equal(b.zodiac, sector,
        `${b.name}: zodiac ${b.zodiac} vs geo.lon ${b.geo.lon.toFixed(1)} (sector ${sector})`);
      assert.equal(b.sign, SIGNS[sector], `${b.name}: sign follows the sector`);
    }
  });

  test("every body carries the Latin beside the code", () => {
    // The register rule: English keys carry machine codes, Latin keys carry
    // Latin. A body already does this with name/nomen (Jupiter/Iuppiter); the
    // sign was the one place the zodiac stayed English on both sides.
    for (const b of tonus.caelum().bodies) {
      assert.equal(typeof b.signum, "string", `${b.name} has a signum`);
      assert.equal(SIGNA[b.zodiac], b.signum, `${b.name}: signum follows the sector`);
    }
    // Eight are already their own Latin nominative; four differ.
    const differ = SIGNS.map((s, i) => [s, SIGNA[i]]).filter(([a, b]) => a !== b);
    assert.deepEqual(differ, [["Scorpio", "Scorpius"], ["Capricorn", "Capricornus"]]);
  });
});

