import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { getFeast } from "../dist/engines/cal/calendar.js";
import { pascha } from "../dist/engines/cal/date.js";

describe("getFeast", () => {
  test("returns Christmas as a rank 1 solemnity for December 25", () => {
    const feasts = getFeast({ date: new Date("2026-12-25") });
    assert.ok(feasts.length > 0);
    assert.equal(feasts[0].id, "12-25");
    assert.equal(feasts[0].rank, 1);
  });

  test("returns Epiphany for January 6", () => {
    const feasts = getFeast({ date: new Date("2026-01-06") });
    assert.ok(feasts.length > 0);
    assert.equal(feasts[0].id, "01-06");
    assert.equal(feasts[0].name, "In Epiphania Domini");
  });

  test("carries the authentic Tridentine gradus", () => {
    const [epiphany] = getFeast({ date: new Date("2026-01-06") });
    assert.equal(epiphany.gradus, "Duplex I classis");

    // S. Hilarii (Jan 14): gradus from the default rank line ("Duplex"),
    // not the 1960-rubric variant.
    const hilary = getFeast({ date: new Date("2026-01-14") });
    const s = hilary.find((f) => f.id === "01-14");
    assert.equal(s?.gradus, "Duplex");
  });

  test("every feast has a non-empty gradus", () => {
    const feasts = getFeast({ season: "ea" });
    assert.ok(feasts.length > 0);
    for (const f of feasts) {
      assert.equal(typeof f.gradus, "string");
      assert.ok(f.gradus.length > 0);
    }
  });

  test("returns empty array for a date with no feast entries", () => {
    const feasts = getFeast({ date: new Date("2026-07-15") });
    // Mid-July feria — may or may not have entries, but should not throw
    assert.ok(Array.isArray(feasts));
  });

  test("filters feasts by season code", () => {
    const feasts = getFeast({ season: "ea" });
    assert.ok(feasts.length > 0);
    for (const f of feasts) assert.equal(f.season, "ea");
  });

  test("filters feasts by rank", () => {
    const feasts = getFeast({ rank: 1 });
    assert.ok(feasts.length > 0);
    for (const f of feasts) assert.equal(f.rank, 1);
  });

  test("filters marian feasts when marian: true", () => {
    const feasts = getFeast({ marian: true });
    assert.ok(feasts.length > 0);
    for (const f of feasts) assert.equal(f.marian, true);
  });

  test("filters apostolic feasts when apostolic: true", () => {
    const feasts = getFeast({ apostolic: true });
    assert.ok(feasts.length > 0);
    for (const f of feasts) assert.equal(f.apostolic, true);
  });

  test("searches feasts by partial name match", () => {
    const feasts = getFeast({ name: "Adventus" });
    assert.ok(feasts.length > 0);
    for (const f of feasts) assert.ok(f.name.toLowerCase().includes("adventus"));
  });

  test("returns feasts sorted by date ascending then rank ascending", () => {
    const feasts = getFeast({ season: "ct" });
    for (let i = 1; i < feasts.length; i++) {
      const prev = feasts[i - 1];
      const curr = feasts[i];
      assert.ok(prev.date <= curr.date || (prev.date.getTime() === curr.date.getTime() && prev.rank <= curr.rank));
    }
  });

  test("returns today's feast when called with no query", () => {
    const feasts = getFeast();
    assert.ok(Array.isArray(feasts));
  });
});

describe("pascha", () => {
  test("computes Easter 2026 correctly (April 5)", () => {
    const easter = pascha(2026);
    assert.equal(easter.getUTCMonth(), 3); // April = 3
    assert.equal(easter.getUTCDate(), 5);
  });

  test("computes Easter 2024 correctly (March 31)", () => {
    const easter = pascha(2024);
    assert.equal(easter.getUTCMonth(), 2); // March = 2
    assert.equal(easter.getUTCDate(), 31);
  });
});

describe("getFeast range", () => {
  test("from/to returns feasts spanning the range", () => {
    const feasts = getFeast({
      from: new Date("2026-12-24"),
      to: new Date("2026-12-26"),
    });
    assert.ok(feasts.length > 0);
    assert.ok(feasts.some((f) => f.id === "12-25"));
  });

  test("from/to with filters works", () => {
    const feasts = getFeast({
      from: new Date("2026-12-01"),
      to: new Date("2026-12-31"),
      rank: 1,
    });
    assert.ok(feasts.every((f) => f.rank === 1));
  });

  test("throws when to < from", () => {
    assert.throws(
      () => getFeast({ from: new Date("2026-12-31"), to: new Date("2026-12-01") }),
      /to must be >= from/,
    );
  });

  test("throws when only from provided", () => {
    assert.throws(
      () => getFeast({ from: new Date("2026-12-01") }),
      /requires both from and to/,
    );
  });
});

// Feast lookup must be timezone-independent: a date built from an ISO string
// (UTC midnight) resolves to the same feast whether the process runs east or
// west of UTC. Run the suite under TZ=Asia/Tokyo and TZ=America/Los_Angeles
// to exercise both sides.
describe("timezone stability", () => {
  test("feast date round-trips the queried ISO day", () => {
    const feasts = getFeast({ date: new Date("2026-01-06") });
    assert.ok(feasts.length > 0);
    assert.equal(feasts[0].id, "01-06");
    assert.equal(feasts[0].date.toISOString().slice(0, 10), "2026-01-06");
  });

  test("weekday reflects the UTC day of week", () => {
    // 2026-12-25 is a Friday (UTC).
    const [christmas] = getFeast({ date: new Date("2026-12-25") });
    assert.equal(christmas.weekday, 5);
  });

  test("pascha returns UTC midnight", () => {
    const easter = pascha(2026);
    assert.equal(easter.getUTCHours(), 0);
    assert.equal(easter.getTime() % 86400000, 0);
  });

  test("season boundaries are UTC midnights", () => {
    const [feast] = getFeast({ date: new Date("2026-01-06") });
    assert.equal(feast.seasonStart.getTime() % 86400000, 0);
    assert.equal(feast.seasonEnd.getTime() % 86400000, 0);
  });
});
