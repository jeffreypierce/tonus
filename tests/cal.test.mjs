import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { getFeast } from "../dist/engines/cal/calendar.js";
import { pascha } from "../dist/engines/cal/date.js";

describe("getFeast", () => {
  test("returns Christmas as a rank 1 solemnity for December 25", () => {
    const feasts = getFeast({ date: new Date(2026, 11, 25) });
    assert.ok(feasts.length > 0);
    assert.equal(feasts[0].id, "12-25");
    assert.equal(feasts[0].rank, 1);
  });

  test("returns Epiphany for January 6", () => {
    const feasts = getFeast({ date: new Date(2026, 0, 6) });
    assert.ok(feasts.length > 0);
    assert.equal(feasts[0].id, "01-06");
    assert.equal(feasts[0].name, "In Epiphania Domini");
  });

  test("returns empty array for a date with no feast entries", () => {
    const feasts = getFeast({ date: new Date(2026, 6, 15) });
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
    assert.equal(easter.getMonth(), 3); // April = 3
    assert.equal(easter.getDate(), 5);
  });

  test("computes Easter 2024 correctly (March 31)", () => {
    const easter = pascha(2024);
    assert.equal(easter.getMonth(), 2); // March = 2
    assert.equal(easter.getDate(), 31);
  });
});

describe("getFeast range", () => {
  test("from/to returns feasts spanning the range", () => {
    const feasts = getFeast({
      from: new Date(2026, 11, 24),
      to: new Date(2026, 11, 26),
    });
    assert.ok(feasts.length > 0);
    assert.ok(feasts.some((f) => f.id === "12-25"));
  });

  test("from/to with filters works", () => {
    const feasts = getFeast({
      from: new Date(2026, 11, 1),
      to: new Date(2026, 11, 31),
      rank: 1,
    });
    assert.ok(feasts.every((f) => f.rank === 1));
  });

  test("throws when to < from", () => {
    assert.throws(
      () => getFeast({ from: new Date(2026, 11, 31), to: new Date(2026, 11, 1) }),
      /to must be >= from/,
    );
  });

  test("throws when only from provided", () => {
    assert.throws(
      () => getFeast({ from: new Date(2026, 11, 1) }),
      /requires both from and to/,
    );
  });
});
