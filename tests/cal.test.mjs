import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { getFeast, getPascha } from "../dist/engines/cal/calendar.js";
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

  test("throws on an unknown query key instead of silently returning the epoch", () => {
    // A natural-but-wrong guess must fail loudly, not resolve a plausible default.
    assert.throws(() => getFeast({ month: 12, day: 25 }), /unknown query key/);
    // A valid key mixed with an unknown one still throws.
    assert.throws(() => getFeast({ date: new Date("2026-12-25"), foo: 1 }), /unknown query key/);
  });

  test("throws on a bare Date rather than reading it as no query at all", () => {
    // A Date has no own enumerable keys, so an unguarded `festum(date)` reads
    // as "no query" and returns the DEFAULT EPOCH — a plausible wrong answer
    // for whatever date was meant, which is the failure the guard above exists
    // to prevent.
    // Christmas 991 is Julian Dec 25 — proleptic-Gregorian Dec 30.
    const christmas = new Date(Date.UTC(991, 11, 30));
    assert.throws(() => getFeast(christmas), /festum\(\{ date \}\)/);
    // The query form is the one that answers.
    assert.equal(getFeast({ date: christmas })[0].nomen, "In Nativitate Domini");
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

describe("the calendar has no silent days", () => {
  // Five dates of 2026 once resolved to NOTHING — festum() returned [] and the
  // whole day fell out of every walk: Pasc6-5 (a redirect-headed DO file
  // gen-cal skipped), the November tail (the post-Pentecost season is elastic
  // and its surplus weeks resume the omitted post-Epiphany Sundays), and
  // Dec 30 (an octave day with no saint, carried by the date-stemmed Nat30).
  test("every day of 2026 and 2027 resolves at least one entry", () => {
    for (const year of [2026, 2027]) {
      for (let i = 0; i < 365; i++) {
        const d = new Date(Date.UTC(year, 0, 1 + i));
        const feasts = getFeast({ date: d });
        assert.ok(
          feasts.length > 0,
          `${d.toISOString().slice(0, 10)} resolves to no feast at all`,
        );
      }
    }
  });

  test("the five 2026 holes, by name", () => {
    const at = (iso) => getFeast({ date: new Date(iso + "T00:00:00Z") });
    assert.ok(at("2026-05-22").some((f) => f.id === "Pasc6-5"), "Friday after the Octave of Ascension");
    assert.ok(at("2026-11-18").length > 0, "Wednesday of the resumed 6th Epiphany week");
    assert.ok(at("2026-11-27").length > 0, "Friday of the last week after Pentecost");
    assert.ok(at("2026-11-28").length > 0, "Saturday before Advent");
    // 2026's Sunday within the octave falls Dec 27, so its office is said on
    // Dec 30; in 2024 (Sunday Dec 29) Dec 30 is the plain octave day.
    assert.ok(at("2026-12-30").some((f) => f.id === "Nat1-0"), "Dec 30, 2026 carries the Sunday within the octave");
    const dec30 = at("2024-12-30").find((f) => f.id === "Nat30");
    assert.ok(dec30, "Dec 30, 2024 carries the octave day (Nat30)");
    assert.equal(dec30.grade, "semiduplex", "a day within the Christmas octave is semiduplex");
  });

  test("Dominica ultima anchors to Advent; the surplus Sundays resume Epiphany's", () => {
    // 2026: Pentecost May 24, Advent Nov 29 — 26 Sundays after Pentecost.
    // The 24th and 25th resume Epi5 and Epi6; the last sings Dominica XXIV.
    // Presence, not primacy: a sanctoral feast may outrank the Sunday, but
    // the Sunday must be ON the day for the concurrence to happen at all.
    const ids = (iso) =>
      getFeast({ date: new Date(iso + "T00:00:00Z") }).map((f) => f.id);
    assert.ok(ids("2026-11-08").includes("Epi5-0"), "24th Sunday = resumed 5th after Epiphany");
    assert.ok(ids("2026-11-15").includes("Epi6-0"), "25th Sunday = resumed 6th after Epiphany");
    assert.ok(ids("2026-11-22").includes("Pent24-0"), "the last Sunday is Dominica XXIV");
    assert.ok(!ids("2026-11-08").includes("Pent24-0"), "the ultima does not ALSO sit at Pentecost+24 weeks");
    // In a year with exactly 24 Sundays, Pent24 sits where linear placement
    // put it — covered by the no-silent-days scan above.
  });

  test("a season ends in its own year, and holds the day that reported it", () => {
    // Tempus post Pentecosten once ended at NEXT year's Advent, which made the
    // season sixteen months long — 547 days in 991 against a true 176. Nothing
    // read seasonEnd, so nothing caught it until the site printed the day's
    // place in its season under the feast's name.
    const utc = (d) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    const day = 86400000;

    for (const year of [991, 1000, 2024]) {
      for (let i = 0; i < 366; i++) {
        const date = new Date(Date.UTC(year, 0, 1 + i));
        if (date.getUTCFullYear() !== year) break;
        const [feast] = getFeast({ date });
        if (!feast) continue;

        const start = utc(new Date(feast.seasonStart));
        const end = utc(new Date(feast.seasonEnd));
        const where = `${date.toISOString().slice(0, 10)} (${feast.tempus})`;

        assert.ok(start <= utc(date) && utc(date) <= end,
          `${where}: the day sits inside the season it names`);
        // A liturgical season is bounded by the year that carries it; the
        // longest, after Pentecost, still runs well under nine months.
        assert.ok((end - start) / day + 1 <= 250,
          `${where}: season spans ${(end - start) / day + 1} days`);
      }
    }
  });
});

describe("precedence (Divino Afflatu, simplified)", () => {
  const ids = (iso) => getFeast({ date: new Date(iso) }).map((f) => f.id);

  test("the excluding days lead a I-class feast falling on them", () => {
    assert.deepEqual(ids("2028-03-19"), ["Quad3-0", "03-19"], "St Joseph on Lent III");
    assert.deepEqual(ids("1978-03-19"), ["Quad6-0", "03-19"], "St Joseph on Palm Sunday");
    assert.deepEqual(ids("2029-03-25"), ["Quad6-0", "03-25"], "Annunciation on Palm Sunday");
    assert.equal(ids("2035-03-25")[0], "Pasc0-0", "Annunciation on Easter Sunday");
  });

  test("on a tie of grade the temporale leads", () => {
    assert.deepEqual(ids("2038-06-24"), ["Pent01-4", "06-24"], "Corpus Christi and St John Baptist");
  });

  test("an ordinary Sunday yields to I and II class only", () => {
    assert.equal(ids("2026-01-25")[0], "Epi3-0", "Conversion of St Paul (Duplex majus) follows the Sunday");
    assert.equal(ids("2008-11-02")[0], "Epi4-0", "All Souls on a Sunday follows it (no transfer)");
    assert.equal(ids("2024-12-29")[0], "Nat1-0", "St Thomas Becket (Duplex) follows the Sunday");
  });

  test("a greater Sunday of the II class yields only to a I-class feast", () => {
    assert.equal(ids("2025-12-21")[0], "Adv4-0", "St Thomas (II class) follows Advent IV");
    assert.equal(ids("2024-12-08")[0], "12-08", "the Immaculate Conception (I class) leads Advent II");
  });
});

describe("temporale placement", () => {
  const ids = (iso) => getFeast({ date: new Date(iso) }).map((f) => f.id);
  const dateOf = (id, from, to) =>
    getFeast({ from: new Date(from), to: new Date(to) })
      .filter((f) => f.id === id)
      .map((f) => f.date.toISOString().slice(0, 10));

  test("the Holy Name is the Sunday of Jan 2–5, else Jan 2", () => {
    assert.deepEqual(dateOf("Nat2-0", "2023-01-01", "2023-01-13"), ["2023-01-02"]);
    assert.deepEqual(dateOf("Nat2-0", "2024-01-01", "2024-01-13"), ["2024-01-02"]);
    assert.deepEqual(dateOf("Nat2-0", "2026-01-01", "2026-01-13"), ["2026-01-04"]);
    assert.deepEqual(dateOf("Nat2-0", "2029-01-01", "2029-01-13"), ["2029-01-02"]);
    assert.deepEqual(dateOf("Nat2-0", "2030-01-01", "2030-01-13"), ["2030-01-02"]);
    assert.ok(!ids("2030-01-06").includes("Nat2-0"), "never on the Epiphany");
  });

  test("the Sunday within the Christmas octave stays inside the octave", () => {
    // Christmas 2022 is a Sunday: no Sunday within the octave, office on Dec 30.
    assert.deepEqual(dateOf("Nat1-0", "2022-12-25", "2023-01-08"), ["2022-12-30"]);
    assert.deepEqual(dateOf("Nat1-0", "2024-12-25", "2025-01-08"), ["2024-12-29"]);
    assert.ok(!ids("2023-01-01").includes("Nat1-0"));
  });

  test("Advent IV ends on Christmas Eve", () => {
    assert.deepEqual(ids("2026-12-25"), ["12-25"]);
  });

  test("the January Epiphany weeks end at Septuagesima", () => {
    assert.ok(!ids("2008-02-10").some((id) => id.startsWith("Epi")), "Lent I 2008 carries no Epiphany Sunday");
  });

  test("in a leap year the feasts of Feb 24–28 move a day", () => {
    assert.ok(!ids("2028-02-24").includes("02-24"));
    assert.ok(ids("2028-02-25").includes("02-24"), "St Matthias on the 25th");
    assert.ok(ids("2028-02-28").includes("02-27"));
    assert.ok(ids("2027-02-24").includes("02-24"), "a common year keeps the 24th");
    // 1900 is not a Gregorian leap year; 1500 is a Julian one, so St Matthias
    // keeps Julian Feb 25 — Gregorian March 6.
    assert.ok(ids("1900-02-24").includes("02-24"));
    assert.ok(ids("1500-03-06").includes("02-24"));
  });

  test("no day of 1900–2100 is empty or carries two temporale entries", () => {
    const temporale = (id) => !/^\d\d-\d\d$/.test(id);
    const d = new Date(Date.UTC(1900, 0, 1));
    for (; d.getUTCFullYear() <= 2100; d.setUTCDate(d.getUTCDate() + 1)) {
      const day = getFeast({ date: d }).map((f) => f.id);
      const iso = d.toISOString().slice(0, 10);
      assert.ok(day.length > 0, `${iso} is empty`);
      assert.ok(day.filter(temporale).length <= 1, `${iso}: ${day.join(", ")}`);
    }
  });
});

describe("dates before the reform", () => {
  const ids = (iso) => getFeast({ date: new Date(iso) }).map((f) => f.id);

  test("the fixed feasts keep their Julian dates", () => {
    // 1350: Julian March 25 is Gregorian April 2, Maundy Thursday.
    assert.deepEqual(ids("1350-04-02"), ["Quad6-4", "03-25"]);
    assert.ok(!ids("1350-03-25").includes("03-25"));
    assert.equal(getFeast({ date: new Date("1351-01-02") })[0].id, "12-25");
    assert.equal(getPascha(1350).christmas.toISOString().slice(0, 10), "1351-01-02");
  });

  test("the reform's ten skipped days keep no fixed feast", () => {
    // Julian Oct 4 1582 (St Francis) is Gregorian Oct 14; the next day is
    // Gregorian Oct 15 (St Teresa). Feasts of Oct 5–14 have no day in 1582.
    assert.ok(ids("1582-10-14").includes("10-04"));
    assert.ok(ids("1582-10-15").includes("10-15"));
    const oct1582 = getFeast({ from: new Date("1582-09-01"), to: new Date("1582-11-30") }).map((f) => f.id);
    assert.ok(!oct1582.includes("10-07") && !oct1582.includes("10-13"));
  });

  test("no day of 900–1700 is empty or has two temporale entries", () => {
    const temporale = (id) => !/^\d\d-\d\d$/.test(id);
    const d = new Date(Date.UTC(900, 0, 1));
    for (; d.getUTCFullYear() <= 1700; d.setUTCDate(d.getUTCDate() + 1)) {
      const day = getFeast({ date: d }).map((f) => f.id);
      const iso = d.toISOString().slice(0, 10);
      assert.ok(day.length > 0, `${iso} is empty`);
      assert.ok(day.filter(temporale).length <= 1, `${iso}: ${day.join(", ")}`);
    }
  });
});

describe("the era view's later saints and temporale", () => {
  const range = (from, to, before) =>
    getFeast({ from: new Date(from), to: new Date(to), ...(before ? { before } : {}) }).map((f) => f.id);

  test("Angela Merici (canonized 1807) is not kept in 1500", () => {
    assert.ok(range("1500-06-05", "1500-06-15").includes("06-01"));
    assert.ok(!range("1500-06-05", "1500-06-15", 1500).includes("06-01"));
  });

  test("Francis of Assisi enters at his canonization; Corpus Christi at 1264", () => {
    assert.ok(range("1250-10-05", "1250-10-15", 1250).includes("10-04"));
    assert.ok(!range("1220-10-05", "1220-10-15", 1220).includes("10-04"));
    assert.ok(range("1300-05-20", "1300-06-30", 1300).includes("Pent01-4"));
    assert.ok(!range("1250-05-20", "1250-06-30", 1250).includes("Pent01-4"));
    assert.ok(!range("1250-05-20", "1250-06-30", 1250).includes("Pent01-5"), "its octave goes with it");
  });

  test("the default epoch no longer resolves to Angela Merici", () => {
    assert.ok(!getFeast().some((f) => f.id === "06-01"));
  });
});

describe("feast flags", () => {
  const feast = (iso, id) => getFeast({ date: new Date(iso) }).find((f) => f.id === id);

  test("marian marks Our Lady's feasts, not her kin's", () => {
    assert.equal(feast("2026-02-02", "02-02").marian, true);
    assert.equal(feast("2026-03-25", "03-25").marian, true);
    assert.deepEqual(feast("2026-03-25", "03-25").masses, [9, 10]);
    assert.equal(feast("2026-03-19", "03-19").marian, false);
    assert.equal(feast("2026-07-26", "07-26").marian, false);
    assert.equal(feast("2026-08-16", "08-16").marian, false);
  });

  test("apostolic marks SS Philip and James on May 1", () => {
    assert.equal(feast("2026-05-01", "05-01").apostolic, true);
    assert.equal(feast("2026-06-28", "06-28").apostolic, false, "06-28 is St Irenaeus");
  });
});

describe("query guards", () => {
  test("from/to must be valid Dates", () => {
    assert.throws(() => getFeast({ from: "2026-01-01", to: new Date("2026-01-02") }), /from must be a Date/);
    assert.throws(() => getFeast({ from: new Date("2026-01-01"), to: new Date("nope") }), /to must be a Date/);
  });

  test("date and from/to are exclusive; nomen must be non-empty", () => {
    assert.throws(() => getFeast({ date: new Date("2026-01-01"), from: new Date("2026-01-01") }), /not both/);
    assert.throws(() => getFeast({ nomen: "" }), /nomen/);
  });

  test("pascha: small years are years, not 1900s; year < 1 and non-numbers throw", () => {
    assert.equal(getPascha(33).easter.getUTCFullYear(), 33);
    assert.equal(pascha(33).getUTCFullYear(), 33);
    assert.throws(() => getPascha(0), RangeError);
    assert.throws(() => getPascha(-5), RangeError);
    assert.throws(() => getPascha("2026"), TypeError);
  });

  test("baptism is the Sunday after the Epiphany, the Holy Family's", () => {
    const p = getPascha(2023); // Jan 7, 2023 is a Saturday; Jan 8 the Sunday
    assert.equal(p.baptism.toISOString().slice(0, 10), "2023-01-08");
    const p2 = getPascha(2024); // Jan 7, 2024 is itself a Sunday
    assert.equal(p2.baptism.toISOString().slice(0, 10), "2024-01-07");
    assert.ok(getFeast({ date: p2.baptism }).some((f) => f.id === "Epi1-0"));
  });
});
