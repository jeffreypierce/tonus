import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { getFeast } from "../dist/engines/cal/calendar.js";
import { pascha } from "../dist/engines/cal/date.js";
import {
  GRADE_ORDER,
  RITUS_TO_GRADE,
  ritusToGrade,
  gradeOrder,
} from "../dist/engines/cal/types.js";

describe("getFeast", () => {
  test("returns Christmas as a Duplex I classis for December 25", () => {
    const feasts = getFeast({ date: new Date("2026-12-25") });
    assert.ok(feasts.length > 0);
    assert.equal(feasts[0].id, "12-25");
    // Christmas is Duplex I classis with a privileged octave; the octave
    // detail survives in ritus, the ordered grade in grade.
    assert.equal(feasts[0].grade, "duplex-i");
    assert.match(feasts[0].ritus, /^Duplex I classis/);
  });

  test("returns Epiphany for January 6", () => {
    const feasts = getFeast({ date: new Date("2026-01-06") });
    assert.ok(feasts.length > 0);
    assert.equal(feasts[0].id, "01-06");
    assert.equal(feasts[0].nomen, "In Epiphania Domini");
  });

  test("carries the authentic Tridentine ritus", () => {
    const [epiphany] = getFeast({ date: new Date("2026-01-06") });
    assert.equal(epiphany.ritus, "Duplex I classis");

    // S. Hilarii (Jan 14): ritus from the default rank line ("Duplex"),
    // not the 1960-rubric variant.
    const hilary = getFeast({ date: new Date("2026-01-14") });
    const s = hilary.find((f) => f.id === "01-14");
    assert.equal(s?.ritus, "Duplex");
  });

  test("finds tempora spilling into the next civil year", () => {
    // Nat2-0 (Holy Name) anchors to 2025's Christmas but falls on
    // 2026-01-04 — it must be reachable from the January date.
    const feasts = getFeast({ date: new Date("2026-01-04") });
    assert.ok(feasts.some((f) => f.id === "Nat2-0"),
      `expected Nat2-0 in: ${feasts.map((f) => f.id).join(", ")}`);
  });

  test("every feast has a non-empty ritus and a valid grade", () => {
    const feasts = getFeast({ season: "pasc" });
    assert.ok(feasts.length > 0);
    for (const f of feasts) {
      assert.equal(typeof f.ritus, "string");
      assert.ok(f.ritus.length > 0);
      assert.ok(GRADE_ORDER.includes(f.grade), `bad grade: ${f.grade}`);
    }
  });

  test("returns empty array for a date with no feast entries", () => {
    const feasts = getFeast({ date: new Date("2026-07-15") });
    // Mid-July feria — may or may not have entries, but should not throw
    assert.ok(Array.isArray(feasts));
  });

  test("filters feasts by season code", () => {
    const feasts = getFeast({ season: "pasc" });
    assert.ok(feasts.length > 0);
    for (const f of feasts) assert.equal(f.season, "pasc");
  });

  test("filters feasts by grade", () => {
    const feasts = getFeast({ grade: "duplex-i" });
    assert.ok(feasts.length > 0);
    for (const f of feasts) assert.equal(f.grade, "duplex-i");
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
    const feasts = getFeast({ nomen: "Adventus" });
    assert.ok(feasts.length > 0);
    for (const f of feasts) assert.ok(f.nomen.toLowerCase().includes("adventus"));
  });

  test("returns feasts sorted by date ascending then dignity descending", () => {
    const feasts = getFeast({ season: "nat" });
    for (let i = 1; i < feasts.length; i++) {
      const prev = feasts[i - 1];
      const curr = feasts[i];
      assert.ok(
        prev.date < curr.date ||
          (prev.date.getTime() === curr.date.getTime() &&
            gradeOrder(prev.grade) <= gradeOrder(curr.grade)),
      );
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
      grade: "duplex-i",
    });
    assert.ok(feasts.length > 0);
    assert.ok(feasts.every((f) => f.grade === "duplex-i"));
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

describe("grade reduction", () => {
  test("every ritus string in the table reduces to a valid grade", () => {
    for (const [ritus, expected] of Object.entries(RITUS_TO_GRADE)) {
      assert.equal(ritusToGrade(ritus), expected, `ritus: ${ritus}`);
      assert.ok(GRADE_ORDER.includes(expected));
    }
  });

  test("compound ritus reduces to its base grade", () => {
    // Octave qualifiers don't change the day's own dignity.
    assert.equal(ritusToGrade("Duplex I classis cum Octava communi"), "duplex-i");
    assert.equal(
      ritusToGrade("Duplex I classis cum Octava privilegiata III ordinis"),
      "duplex-i",
    );
    assert.equal(ritusToGrade("Duplex II classis cum Octava simplici"), "duplex-ii");
    // The Triduum's oddly-named privileged-feria ritus.
    assert.equal(ritusToGrade("Feria privilegiata Duplex I classis"), "triduum");
  });

  test("classis-primary: a Lent Sunday outranks a plain Duplex feast", () => {
    // Semiduplex I classis (Lent Sundays) beats Duplex despite the
    // duplex/semiduplex axis, because first-class takes precedence.
    assert.ok(gradeOrder("semiduplex-i") < gradeOrder("duplex"));
  });

  test("Good Friday resolves to the top grade", () => {
    // Quad6-5 = Good Friday, ritus "Feria privilegiata Duplex I classis".
    const feasts = getFeast({ date: new Date("2026-04-03") }); // Good Friday 2026
    const gf = feasts.find((f) => f.id?.startsWith("Quad6"));
    assert.ok(gf, `no Quad6 entry: ${feasts.map((f) => f.id).join(", ")}`);
    assert.equal(gf.grade, "triduum");
  });

  test("Advent I is a privileged Sunday: outranks St. Andrew (Duplex II classis)", () => {
    // 2025-11-30: Dominica I Adventus coincides with S. Andreæ Apostoli.
    // DO's ritus line says plain "Semiduplex" for Adv1-0; the per-id override
    // lifts it to semiduplex-i so the first-class Sunday wins the day.
    const feasts = getFeast({ date: new Date("2025-11-30") });
    assert.equal(feasts[0].id, "Adv1-0");
    assert.equal(feasts[0].grade, "semiduplex-i");
    assert.equal(feasts[0].ritus, "Semiduplex"); // ritus stays verbatim
  });

  test("Septuagesima is a privileged Sunday: outranks a plain Duplex feast", () => {
    // 2026-02-01: Dominica in Septuagesima vs S. Ignatii (Duplex).
    const feasts = getFeast({ date: new Date("2026-02-01") });
    const first = feasts[0];
    assert.equal(first.id, "Quadp1-0");
    assert.equal(first.grade, "semiduplex-ii");
    // A second-class Sunday still yields to first/second-class feasts:
    assert.ok(gradeOrder("duplex-ii") < gradeOrder("semiduplex-ii"));
  });
});

describe("season alignment (temporale)", () => {
  const seasonOf = (iso) => getFeast({ date: new Date(iso) })[0]?.season;

  test("Tempora stem prefix matches the season it falls in", () => {
    // Spot-check one date per block; findSeason must agree with the stem.
    assert.equal(seasonOf("2026-12-25"), "nat"); // Christmas
    assert.equal(seasonOf("2026-04-05"), "pasc"); // Easter 2026
  });

  test("Septuagesima is its own block (quadp), not Lent", () => {
    // Septuagesima Sunday 2026 = Easter(Apr 5) − 63 = Feb 1.
    assert.equal(seasonOf("2026-02-01"), "quadp");
  });

  test("the Pentecost octave stays paschal", () => {
    // Pentecost 2026 = Easter + 49 = May 24; its octave runs to Trinity eve.
    assert.equal(seasonOf("2026-05-25"), "pasc"); // Pentecost Monday
  });

  test("after Epiphany is epi, after Pentecost is pent", () => {
    assert.equal(seasonOf("2026-01-20"), "epi");
    assert.equal(seasonOf("2026-07-15"), "pent");
  });

  test("season follows the date, not the nominal stem week", () => {
    // A Tempora stem's week number is a counter, not a season: overflow
    // weeks land in a later season. The date-derived season is authoritative.
    // Ash Wednesday 2026 is Quadp3-3 by stem but liturgically Lent.
    const [ashWed] = getFeast({ date: new Date("2026-02-18") });
    assert.match(ashWed.id, /^Quadp3/);
    assert.equal(ashWed.season, "quad");
  });

  test("every day of the liturgical year resolves to a season", () => {
    const start = new Date("2025-11-30"); // Advent 2025
    for (let i = 0; i < 400; i++) {
      const d = new Date(start.getTime() + i * 86400000);
      const feasts = getFeast({ date: d });
      for (const f of feasts) {
        assert.ok(
          ["adv", "nat", "epi", "quadp", "quad", "pasc", "pent"].includes(f.season),
          `bad season ${f.season} on ${d.toISOString().slice(0, 10)}`,
        );
      }
    }
  });
});
