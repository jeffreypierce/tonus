import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { getChants } from "../dist/engines/chant/chant.js";
import { getPropers } from "../dist/engines/chant/propers.js";
import { getOrdinary } from "../dist/engines/chant/ordinary.js";
import { getHour } from "../dist/engines/chant/hour.js";
import { getPsalm } from "../dist/engines/chant/psalm.js";
import { getFeast } from "../dist/engines/cal/calendar.js";

describe("getChants", () => {
  test("returns chants filtered by mode", () => {
    const chants = getChants({ mode: 1, limit: 5 });
    assert.ok(chants.length > 0);
    for (const c of chants) assert.equal(c.mode, "1");
  });

  test("returns chants filtered by office code", () => {
    const chants = getChants({ office: "an", limit: 5 });
    assert.ok(chants.length > 0);
    for (const c of chants) assert.equal(c.office, "an");
  });

  test("returns chants filtered by source", () => {
    const chants = getChants({ source: "gr", limit: 5 });
    assert.ok(chants.length > 0);
    for (const c of chants) assert.equal(c.source.code, "gr");
  });

  test("accepts array values for mode, office, and source", () => {
    const chants = getChants({ mode: [1, 2], office: ["an", "hy"], limit: 10 });
    assert.ok(chants.length > 0);
    for (const c of chants) {
      assert.ok(c.mode === "1" || c.mode === "2");
      assert.ok(c.office === "an" || c.office === "hy");
    }
  });

  test("searches by incipit substring", () => {
    const chants = getChants({ incipit: "Sanctus", limit: 5 });
    assert.ok(chants.length > 0);
    for (const c of chants) assert.ok(c.incipit.toLowerCase().includes("sanctus"));
  });

  test("looks up a chant by exact id", () => {
    const chants = getChants({ id: "gregobase:1" });
    assert.equal(chants.length, 1);
    assert.equal(chants[0].id, "gregobase:1");
  });

  test("returns empty array for no match", () => {
    const chants = getChants({ id: "nonexistent:99999" });
    assert.equal(chants.length, 0);
  });

  test("respects limit and offset for pagination", () => {
    const page1 = getChants({ mode: 1, limit: 3, offset: 0 });
    const page2 = getChants({ mode: 1, limit: 3, offset: 3 });
    assert.equal(page1.length, 3);
    assert.equal(page2.length, 3);
    assert.notEqual(page1[0].id, page2[0].id);
  });
});

describe("getPropers", () => {
  test("returns proper chants for a feast", () => {
    const feasts = getFeast({ date: new Date("2026-12-25") });
    const propers = getPropers({ feast: feasts });
    assert.ok(propers.length > 0);
  });

  test("filters propers by office code", () => {
    const propers = getPropers({ office: "in", limit: 5 });
    assert.ok(propers.length > 0);
    for (const c of propers) assert.equal(c.office, "in");
  });
});

describe("getOrdinary", () => {
  test("returns kyriale chants for a specific mass number", () => {
    const chants = getOrdinary({ mass: 8 });
    assert.ok(chants.length > 0);
    for (const c of chants) assert.equal(c.mass, 8);
  });

  test("returns kyriale chants filtered by ordinary code", () => {
    const chants = getOrdinary({ ordinary: "ky" });
    assert.ok(chants.length > 0);
    for (const c of chants) assert.equal(c.ordinary, "ky");
  });
});

describe("getHour", () => {
  test("returns office chants for laudes", () => {
    const feasts = getFeast({ date: new Date("2026-12-25") });
    const chants = getHour({ feast: feasts, hora: "laudes" });
    assert.ok(chants.length > 0);
  });

  test("returns office chants for vesperae", () => {
    const feasts = getFeast({ date: new Date("2026-12-25") });
    const chants = getHour({ feast: feasts, hora: "vesperae" });
    assert.ok(chants.length > 0);
  });
});

describe("getPsalm", () => {
  test("returns intoned GABC for psalm 109 in mode 1", () => {
    const chants = getPsalm({ psalm: 109, mode: 1 });
    assert.ok(chants.length > 0);
    assert.equal(chants[0].office, "ps");
    assert.ok(chants[0].gabc.startsWith("(c4)"));
  });
});
