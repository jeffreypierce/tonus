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

describe("getHour — completorium (Compline)", () => {
  const complineFor = (date) =>
    getHour({ feast: getFeast({ date: new Date(date) }), hora: "completorium" });

  const propers = (chants) => chants.filter((c) => !c.id.startsWith("psalm:"));
  const incipits = (chants) => propers(chants).map((c) => c.incipit);

  test("assembles the full ordo: opening, 4 psalms, hymn, responsory, canticle, Marian", () => {
    const c = complineFor("2026-12-06"); // Advent
    // The four fixed psalms (4, 30, 90, 133) contribute many verses.
    const psalmVerses = c.filter((x) => x.id.startsWith("psalm:"));
    assert.ok(psalmVerses.length > 20, "the four fixed psalms are included");
    const names = incipits(c).join(" | ");
    assert.ok(names.includes("Deus in adjutorium"), "opening");
    assert.ok(names.includes("Te lucis"), "hymn");
    assert.ok(names.includes("In manus tuas"), "short responsory");
    assert.ok(names.includes("Nunc dimittis"), "gospel canticle");
  });

  test("preserves liturgical order (not sorted by incipit)", () => {
    const c = complineFor("2026-12-06");
    // First item is the opening versicle, not an alphabetically-first antiphon.
    assert.equal(c[0].incipit, "Deus in adjutorium");
    const names = incipits(c);
    // Te lucis (hymn) precedes Nunc dimittis (canticle) precedes the Marian.
    assert.ok(names.indexOf("Te lucis ante terminum (In Adventu)") <
      names.indexOf("Nunc dimittis"));
  });

  test("Marian antiphon rotates by season and the Candlemas date boundary", () => {
    const marian = (date) => {
      const names = incipits(complineFor(date));
      return names.find((n) => /Alma|Ave Regina|Regina caeli|Salve/.test(n));
    };
    assert.match(marian("2026-12-06"), /Alma/, "Advent → Alma");
    assert.match(marian("2026-02-01"), /Alma/, "before Candlemas → Alma");
    assert.match(marian("2026-02-10"), /Ave Regina/, "after Candlemas → Ave Regina");
    assert.match(marian("2026-04-06"), /Regina caeli/, "Eastertide → Regina caeli");
    assert.match(marian("2026-08-15"), /Salve/, "after Pentecost → Salve Regina");
  });

  test("hymn and responsory follow the season", () => {
    assert.ok(incipits(complineFor("2026-12-06")).some((n) => n.includes("In Adventu")));
    assert.ok(incipits(complineFor("2026-04-06")).some((n) => n.includes("Paschali")));
  });

  test("every ordo chant resolves (no dangling ids)", () => {
    const c = complineFor("2026-08-15");
    assert.ok(c.length > 0);
    for (const chant of c) {
      assert.ok(chant.gabc && chant.gabc.length > 0, `${chant.incipit} has gabc`);
    }
  });

  test("no-feast completorium resolves to the default epoch", () => {
    const c = getHour({ hora: "completorium" });
    assert.ok(c.length > 0, "returns the default-epoch Compline ordo");
    assert.equal(c[0].incipit, "Deus in adjutorium");
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
