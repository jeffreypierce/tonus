import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { getChants, getCorpus } from "../dist/engines/chant/chant.js";
import { getPropers } from "../dist/engines/chant/propers.js";
import { getOrdinary } from "../dist/engines/chant/ordinary.js";
import { getHour } from "../dist/engines/chant/hour.js";
import { getPsalm } from "../dist/engines/chant/psalm.js";
import { getFeast } from "../dist/engines/cal/calendar.js";
import { OFFICIA } from "../dist/engines/chant/types.js";

// Every part of the Mass ordinary — the doors to the Kyriale, which is
// addressable but not shelved.
const ORDINARY_CODES = ["ky", "gl", "cr", "sa", "ag", "be", "it", "as", "va"];

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

  test("serves the Antiphonale Monasticum (source am)", () => {
    const am = getChants({ source: "am" });
    // Post-cut the corpus is assignment-driven, so a book ships what the liturgy
    // asks of it, not its full contents: AM contributes 467 of its 1,429 chants.
    assert.ok(am.length > 300, `expected AM's shipped chants, got ${am.length}`);
    for (const c of am) {
      assert.equal(c.source.code, "am");
      assert.equal(c.source.book, "Antiphonale Monasticum");
    }
    // AM is an antiphonary — antiphons dominate.
    const antiphons = am.filter((c) => c.office === "an");
    assert.ok(antiphons.length > am.length / 2);
  });

  test("serves the Kyriale by `ordinary`, not as a book — the ordinary is countable", () => {
    // The Kyriale is a PARTITION of the Graduale, not a book of its own (there
    // is no Kyriale in GregoBase — the extractor splits one source), so it is
    // not a `source` and not a row in the shelf. It is still sung repertoire,
    // so it stays addressable: by id, and by the part of the Mass it belongs to.
    // Not a source any more — and an unrecognised source VALUE returns [],
    // the same as any other, since only a malformed KEY is a caller bug.
    assert.deepEqual(getChants({ source: "ky" }), []);
    const ky = ORDINARY_CODES.flatMap((code) => getChants({ ordinary: code }));
    assert.equal(ky.length, 120, `expected the full Kyriale, got ${ky.length}`);
    for (const c of ky) {
      // The bibliographic record survives — a chant still says which book it is
      // printed in, and a singer would be holding the Kyriale.
      assert.equal(c.source.code, "ky");
      assert.equal(c.office, "or"); // office register: all ordinaries are "or"
      assert.equal(c.genus, "Ordinarium");
      assert.ok(c.ordinary, `${c.id}: the per-ordinary code rides \`ordinary\``);
      assert.ok(c.ordinarium, `${c.id}: the Latin name rides \`ordinarium\``);
      assert.ok(c.gabc.length > 0);
    }
    // The per-ordinary identity survives into the book: every part is present.
    const parts = new Set(ky.map((c) => c.ordinary));
    for (const code of ["ky", "gl", "cr", "sa", "ag", "it", "as", "va"]) {
      assert.ok(parts.has(code), `kyriale carries ordinary "${code}"`);
    }
  });

  // Which setting a day draws is year-dependent (ordinarium steps through the
  // masses the day permits), so this asserts the IDENTITY property — one record
  // whichever door it comes through — without pinning a particular Kyrie. The
  // fixture used to name "Kyrie IV", which quietly encoded the selector reading
  // the Kyriale's printing order instead of the day's own ranking.
  test("a kyriale chant is one identity whether reached by book or by ordinarium", () => {
    const feast = getFeast({ date: new Date(Date.UTC(2026, 3, 5)) }); // Easter
    const viaOrdo = getOrdinary({ feast }).find((c) => c.ordinary === "ky");
    assert.ok(viaOrdo, "Easter's ordinarium serves a Kyrie");
    const viaBook = getChants({ id: viaOrdo.id })[0];
    assert.ok(viaBook, `${viaOrdo.id} is reachable by id too`);
    assert.deepEqual(viaOrdo, viaBook);
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

  test("throws on an empty or unknown-key query (not a silent empty result)", () => {
    // A real search that finds nothing returns []; a malformed query is a bug.
    assert.throws(() => getChants({}), /empty query/);
    assert.throws(() => getChants({ mdoe: 1 }), /unknown query key/);
  });

  test("respects limit and offset for pagination", () => {
    const page1 = getChants({ mode: 1, limit: 3, offset: 0 });
    const page2 = getChants({ mode: 1, limit: 3, offset: 3 });
    assert.equal(page1.length, 3);
    assert.equal(page2.length, 3);
    assert.notEqual(page1[0].id, page2[0].id);
  });
});

describe("getCorpus", () => {
  test("returns book metadata for a corpus code", () => {
    const am = getCorpus("am");
    assert.equal(am.code, "am");
    assert.equal(am.book, "Antiphonale Monasticum");
    assert.equal(am.year, 1934);
    assert.equal(am.editor, "Solesmes");
    assert.equal(am.edition, "Pro Diurnis Horis"); // GregoBase description, normalized
    // `count` is what tonus SHIPS from the book; `total` is what the book holds.
    // The cut separated the two — before it they were the same number.
    assert.ok(am.count > 300, `am.count = ${am.count}`);
    assert.ok(am.total > am.count, "the book holds more than tonus ships");
  });

  test("the query form and the bare code are the same question", () => {
    // corpus("am") came first; corpus({ book }) matches every other verb. Both
    // must stay one answer, or the two spellings drift into two behaviours.
    assert.deepEqual(getCorpus({ book: "am" }), getCorpus("am"));
  });

  test("corpus() with no argument returns the whole shelf", () => {
    // This used to throw `Unknown corpus code: "undefined"` — the commonest
    // question about a corpus was the one thing the verb could not answer.
    const L = getCorpus();
    assert.equal(L.books.length, 10, "every registered book is in the ledger");
    assert.ok(L.count > 0 && L.listings > 0 && L.total > 0);
    // `count` leads and means chants — each one once, the ordinary included.
    // `listings` is the shelf's length, where a melody printed in two books
    // appears under both, so it exceeds count by exactly the overlap.
    assert.ok(L.listings > L.count, "the shelf lists more rows than there are chants");
    const nameable = new Set([
      ...L.books.flatMap((b) => getChants({ source: b.code })),
      ...ORDINARY_CODES.flatMap((code) => getChants({ ordinary: code })),
    ].map((c) => c.id));
    assert.equal(L.count, nameable.size, "count is every chant tonus can name, deduped");
    assert.ok(L.total > L.count, "the books hold more than tonus ships");
    assert.ok(L.total > L.count, "the books hold more than tonus ships");
  });

  test("every genus the ledger prints has a name, shipped or not", () => {
    // A row printing its own code where every other row prints a Latin genus
    // is the ledger showing its plumbing. This caught `su`, `im` and `pa`:
    // genera tonus does not ship but DOES report, because they appear in a
    // book's pre-cut `full` tally. Being outside the cut is not a reason to
    // be nameless in a table tonus publishes.
    const L = getCorpus();
    const check = (rows, where) => {
      for (const g of rows) {
        assert.ok(OFFICIA[g.office], `${where}: office "${g.office}" has no label`);
        assert.notEqual(g.genus, g.office, `${where}: "${g.office}" prints as its own code`);
      }
    };
    check(L.genera, "shelf");
    for (const b of L.books) {
      check(b.genera, `${b.code} shipped`);
      if (b.full) check(b.full.genera, `${b.code} full`);
    }
  });

  test("the rollup reconciles with its parts", () => {
    const L = getCorpus();
    // Books sum to LISTINGS, not to count — a chant in two books is one chant
    // but two rows, and that is the whole difference between the two numbers.
    assert.equal(L.books.reduce((n, b) => n + b.count, 0), L.listings, "books sum to listings");
    // The breakdowns describe the same population the headline does.
    assert.equal(L.genera.reduce((n, g) => n + g.count, 0), L.count, "genera sum to count");
    assert.equal(L.modes.reduce((n, m) => n + m.count, 0), L.count, "modes sum to count");
    assert.equal(
      L.books.reduce((n, b) => n + (b.full?.total ?? 0), 0),
      L.total,
      "measured book totals sum to the shelf total",
    );
  });

  test("`full` is the ledger of the cut — what was there to keep", () => {
    const am = getCorpus("am");
    assert.ok(am.full, "am is a GregoBase book, so its full tally is measured");
    assert.equal(am.full.total, am.total, "full.total agrees with the overlap total");
    assert.ok(am.full.total > am.count, "the book held more than tonus kept");
    // Same shape as the shipped tallies, so the two are comparable row for row.
    assert.equal(am.full.genera.reduce((n, g) => n + g.count, 0), am.full.total);
    assert.equal(am.full.modes.reduce((n, m) => n + m.count, 0), am.full.total);
    assert.equal(am.full.genera[0].office, "an", "an antiphonary, before the cut too");
  });

  test("no book ships more than it holds", () => {
    for (const b of getCorpus().books) {
      if (!b.full) continue;
      assert.ok(b.count <= b.full.total, `${b.code}: ships ${b.count} of ${b.full.total}`);
    }
  });

  test("every shelved book reports what it HOLDS, including the one outside GregoBase", () => {
    // nr was the last book reporting `full: null`, which read as "not yet
    // measured" — but the tally existed all along in the Nocturnale extract.
    // A shelf where one row cannot answer the question makes the cut
    // unauditable for that book, which is the whole point of `full`.
    for (const book of getCorpus().books) {
      assert.ok(book.full, `${book.code} reports no full tally`);
      assert.ok(book.full.total >= book.count,
        `${book.code}: holds ${book.full.total} but ships ${book.count}`);
    }
    const nr = getCorpus("nr");
    assert.equal(nr.full.total, 1564, "the full Nocturnale, before the cut");
  });

  test("an unknown query key throws instead of being ignored", () => {
    assert.throws(() => getCorpus({ source: "am" }), /unknown query key\(s\) "source"/);
  });

  test("exposes the full Latin title where GregoBase has one", () => {
    // gr's description contains "Ecclesiae" → full title; am's does not → null.
    assert.match(getCorpus("gr").fullTitle, /Ecclesiae/);
    assert.equal(getCorpus("am").fullTitle, null);
  });

  test("genera are the office distribution, descending by count", () => {
    const am = getCorpus("am");
    assert.equal(am.genera[0].office, "an"); // an antiphonary — antiphons dominate
    assert.equal(am.genera[0].genus, "Antiphona");
    for (let i = 1; i < am.genera.length; i++) {
      assert.ok(am.genera[i - 1].count >= am.genera[i].count, "descending");
    }
  });

  test("mode counts reconcile with the total (the other/none bucket)", () => {
    for (const code of ["gr", "lu", "la", "lh", "am"]) {
      const c = getCorpus(code);
      const sum = c.modes.reduce((s, m) => s + m.count, 0);
      assert.equal(sum, c.count, `${code}: modes sum to count`);
    }
  });

  test("overlap: full total ≥ stored count, and unique ≤ total", () => {
    const la = getCorpus("la");
    // The stored (deduped) count is ≤ what the book actually holds.
    assert.ok(la.total >= la.count, "full total is at least the deduped count");
    // Unique chants are a subset of the total; the rest are shared with ≥1 book.
    assert.ok(la.unique <= la.total);
    assert.ok(la.shared.length > 0 && la.unique < la.total, "LA shares with others");
    // shared is descending by count.
    for (let i = 1; i < la.shared.length; i++) {
      assert.ok(la.shared[i - 1].count >= la.shared[i].count, "descending");
    }
  });

  test("overlap: LU is the omnibus (shares heavily with GR and LA); AM is nearly its own", () => {
    const lu = getCorpus("lu");
    const shareOf = (c, code) => c.shared.find((s) => s.code === code)?.count ?? 0;
    assert.ok(shareOf(lu, "la") > 500, "LU overlaps LA heavily");
    assert.ok(shareOf(lu, "gr") > 500, "LU overlaps GR heavily");
    const am = getCorpus("am");
    assert.ok(am.unique > am.total * 0.9, "AM is >90% its own repertoire");
  });

  test("nr shares nothing, and that is MEASURED rather than unknown", () => {
    // The distinction null vs [] carries real weight here. nr is outside
    // GregoBase, so its overlap could not be computed from chant-id sets and
    // was null; it is now measured from the Nocturnale's own extract, and the
    // answer is that it shares nothing. The crosswalk to GregoBase source 23
    // is ENRICHMENT — a twin for metadata — not a claim that two books print
    // the same chant, so counting those as shared would invent a relationship.
    const nr = getCorpus("nr");
    assert.equal(nr.total, 1564);
    assert.equal(nr.unique, 1564, "every chant it holds is its own");
    assert.deepEqual(nr.shared, [], "measured as sharing nothing, not unmeasured");
    assert.ok(nr.count > 0 && nr.count < nr.total, "it ships a cut of what it holds");
  });

  test("unknown code throws (message lists the known codes)", () => {
    assert.throws(() => getCorpus("zz"), /Unknown corpus code/);
    assert.throws(() => getCorpus("zz"), /nr/); // derived list includes nr now
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
    // The corpus ships the Roman MASS and the Benedictine OFFICE, so an office
    // hour is asked for in the rite that has chants behind it.
    const chants = getHour({ feast: feasts, hora: "laudes" });
    assert.ok(chants.length > 0);
  });

  test("returns office chants for vesperae", () => {
    const feasts = getFeast({ date: new Date("2026-12-25") });
    const chants = getHour({ feast: feasts, hora: "vesperae" });
    assert.ok(chants.length > 0);
  });

  // This once asserted the ROMAN pattern ("little hours march through Ps 118:
  // Terce 33–80, …"), from when a `rite` option defaulted to romanum. tonus
  // sings one cursus, and the Benedictine little hours take the gradual psalms
  // (RB ch. 18: Terce 119–121, Sext 122–124, None 125–127) on an ordinary
  // weekday, not sections of Ps 118. Same test, the surviving rite's numbers.
  test("little hours take the gradual psalms (Terce 119–121, Sext 122–124, None 125–127)", () => {
    const [f] = getFeast({ date: new Date("2026-12-25") });
    const psalmsAt = (hora) => [...new Set(
      getHour({ feast: f, hora })
        .filter((c) => c.id.startsWith("psalm:"))
        .map((c) => parseInt(c.id.split(":")[1], 10)),
    )].sort((a, b) => a - b);
    assert.deepEqual(psalmsAt("tertia"), [119, 120, 121]);
    assert.deepEqual(psalmsAt("sexta"), [122, 123, 124]);
    assert.deepEqual(psalmsAt("nona"), [125, 126, 127]);
  });

  test("little hours keep the per-feast responsory after the psalms", () => {
    const [f] = getFeast({ date: new Date("2026-12-25") });
    const c = getHour({ feast: f, hora: "tertia" });
    assert.ok(c.some((x) => x.id.startsWith("psalm:")), "has psalmody");
    assert.ok(c.some((x) => !x.id.startsWith("psalm:")), "has the responsory");
    assert.ok(c[0].id.startsWith("psalm:"), "opens with a psalm");
    assert.ok(!c[c.length - 1].id.startsWith("psalm:"), "ends with the responsory");
  });

  test("no-feast little-hours survey returns responsories only, no psalm explosion", () => {
    const c = getHour({ hora: "tertia" });
    assert.ok(c.length > 0);
    assert.equal(c.filter((x) => x.id.startsWith("psalm:")).length, 0,
      "the all-days survey has no per-day psalmody");
  });
});

describe("getHour — the monastic rite", () => {
  // The `rite` option is gone — one cursus, nothing to choose — so the
  // "defaults to romanum" test went with it. What it really guarded was that
  // the untold call and the explicit call agree; that is now a tautology.
  test("a removed option fails loudly — officium rejects rite", () => {
    const [f] = getFeast({ date: new Date("2026-12-25") });
    // The cut left `rite` accepted-but-meaningless: a caller asking for the
    // Roman cursus silently received the monastic one. Guard the guard.
    assert.throws(
      () => getHour({ feast: f, hora: "vesperae", rite: "romanum" }),
      /unknown query key\(s\) "rite"/,
    );
    assert.ok(getHour({ feast: f, hora: "vesperae" }).length > 0, "valid call still answers");
  });

  test("Compline uses the monastic three-psalm scheme (4, 90, 133)", () => {
    const [f] = getFeast({ date: new Date("2026-12-25") });
    const psalms = [...new Set(
      getHour({ feast: f, hora: "completorium" })
        .filter((c) => c.id.startsWith("psalm:"))
        .map((c) => parseInt(c.id.split(":")[1], 10)),
    )];
    // Ps 4, 90, 133 — no Ps 30, which only the cut Roman scheme added.
    assert.deepEqual(psalms, [4, 90, 133]);
  });

  test("monastic office chants come from the Antiphonale Monasticum", () => {
    // A feast with monastic Vespers antiphons; assert they resolve monastic-first.
    const survey = getHour({ hora: "vesperae" });
    const antiphons = survey.filter((c) => c.office === "an");
    assert.ok(antiphons.length > 0, "monastic Vespers survey returns antiphons");

    // This once asserted "never lu" outright. That held only while the Office
    // had no COMMUNE fallback: a saint with no proper antiphons sang nothing, so
    // every antiphon came from the monastic propers. Now a saint's day resolves
    // by category, and a handful of commune texts exist ONLY in the Liber
    // Usualis — "Ecce sacerdos magnus" as an ANTIPHON is in lu alone (am has no
    // setting; the other witnesses are a gradual and responsories, which the
    // genre cap correctly refuses). Singing the right text from the wrong book
    // beats silence, so the guard is now proportional, not absolute.
    const fromLu = antiphons.filter((c) => c.source.code === "lu");
    assert.ok(
      fromLu.length / antiphons.length < 0.05,
      `too many monastic antiphons from LU (${fromLu.length}/${antiphons.length}) — ` +
      `the AM-first book preference has regressed: ${fromLu.map((c) => c.incipit).join(", ")}`,
    );
  });

  test("the commune fills a saint's office when the day has no proper antiphons", () => {
    // The Mass has always resolved proper → seasonal → commune (propers.ts);
    // the Office has the same fallback — and it fills EVERY slot type the
    // commune table ships, not just the antiphons. S. Henrici (2026-07-15)
    // is served by his commune: Matins must carry responsories and Lauds a
    // hymn, or the mined commune data is sitting silent on the shelf again.
    // (An earlier form of this test surveyed antiphon provenance and passed
    // verbatim with the fallback deleted.)
    const [henry] = getFeast({ date: new Date(Date.UTC(2026, 6, 15)) });
    const matins = getHour({ feast: henry, hora: "matutinum" });
    assert.ok(
      matins.some((c) => c.office === "re"),
      "Matins sings the commune's great responsories",
    );
    assert.ok(
      matins.some((c) => c.office === "an"),
      "…alongside antiphons",
    );
    const lauds = getHour({ feast: henry, hora: "laudes" });
    assert.ok(
      lauds.some((c) => c.office === "hy"),
      "Lauds sings the commune's hymn when the day has none of its own",
    );
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

  test("Compline uses the exact psalm scheme: 4, 90, 133 — whole psalms", () => {
    const c = complineFor("2026-08-15");
    const byPsalm = {};
    for (const v of c.filter((x) => x.id.startsWith("psalm:"))) {
      const p = v.id.split(":")[1];
      byPsalm[p] = (byPsalm[p] ?? 0) + 1;
    }
    // Ps 30 vv. 2–6 was the ROMAN scheme's partial psalm and went with that
    // scheme. The monastic three are sung whole, so the verse counts are the
    // psalms' own lengths — which is the real assertion here: no truncation.
    assert.equal(byPsalm["30"], undefined, "no Ps 30 — that was the Roman scheme");
    assert.equal(byPsalm["4"], 10, "Ps 4 entire");
    assert.equal(byPsalm["90"], 16, "Ps 90 entire");
    assert.equal(byPsalm["133"], 4, "Ps 133 entire");
    assert.ok(!byPsalm["31"], "no stray psalms");
  });

  test("concurrent feasts collapse to a single Compline ordo (no doubling)", () => {
    // 2026-12-06 is both the 2nd Sunday of Advent and St Nicholas.
    const feasts = getFeast({ date: new Date("2026-12-06") });
    assert.ok(feasts.length >= 2, "the test date has concurrent feasts");
    const c = getHour({ feast: feasts, hora: "completorium" });
    assert.equal(c.filter((x) => !x.id.startsWith("psalm:")).length, 5,
      "the seasonal ordo appears once, not once per feast");
  });
});

describe("getHour — prima (Prime)", () => {
  const primeFor = (date) =>
    getHour({ feast: getFeast({ date: new Date(date) }), hora: "prima" });
  const propers = (chants) => chants.filter((c) => !c.id.startsWith("psalm:"));
  const incipits = (chants) => propers(chants).map((c) => c.incipit);

  test("assembles the sung ordo: opening, hymn, psalms, short responsory", () => {
    const c = primeFor("2026-08-15");
    const psalmVerses = c.filter((x) => x.id.startsWith("psalm:"));
    assert.ok(psalmVerses.length > 20, "the fixed psalms are included");
    const names = incipits(c).join(" | ");
    assert.ok(names.includes("Deus in adjutorium"), "opening");
    assert.ok(/[JI]am lucis/.test(names), "hymn Iam lucis");
    assert.ok(names.includes("Christe Fili Dei"), "short responsory");
  });

  test("preserves liturgical order (opening first, not incipit-sorted)", () => {
    const c = primeFor("2026-08-15");
    assert.equal(c[0].incipit, "Deus in adjutorium");
    const names = incipits(c);
    assert.ok(names.indexOf(names.find((n) => /lucis/.test(n))) <
      names.indexOf(names.find((n) => /Christe Fili/.test(n))),
      "hymn precedes the responsory");
  });

  test("short responsory follows the season", () => {
    assert.ok(incipits(primeFor("2026-12-06")).some((n) => n.includes("Adventus")));
    assert.ok(incipits(primeFor("2026-04-06")).some((n) => n.includes("Paschali")));
    assert.ok(incipits(primeFor("2026-08-15")).some((n) => n.includes("per Annum")));
  });

  test("every ordo chant resolves (no dangling ids)", () => {
    for (const chant of primeFor("2026-08-15")) {
      assert.ok(chant.gabc && chant.gabc.length > 0, `${chant.incipit} has gabc`);
    }
  });

  test("no-feast prima resolves to the default epoch", () => {
    const c = getHour({ hora: "prima" });
    assert.ok(c.length > 0);
    assert.equal(c[0].incipit, "Deus in adjutorium");
  });

  test("Prime psalmody varies by weekday (DO monastic scheme)", () => {
    const psalmsOn = (date) => {
      const c = primeFor(date);
      return [...new Set(
        c.filter((x) => x.id.startsWith("psalm:")).map((x) => Number(x.id.split(":")[1])),
      )].sort((a, b) => a - b);
    };
    // Anchored to the Benedictine scheme, not the Tridentine: Sunday keeps
    // Ps 118; the weekdays walk Pss 1–19 (RB ch. 18) instead of repeating
    // 53 + 118 daily. The POINT of the test — that Prime is weekday-varied
    // at all — is unchanged.
    assert.deepEqual(psalmsOn("2026-12-06"), [118], "Sunday: Ps 118");
    assert.deepEqual(psalmsOn("2026-12-11"), [15, 16, 17], "Friday: Ps 15,16,17");
  });

  test("Prime takes only the first two sections of Ps 118 (not all 176)", () => {
    const c = primeFor("2026-12-06");
    const p118 = c.filter((x) => x.id.startsWith("psalm:118:"));
    // 118(1-16) + 118(17-32) = 32 verses.
    assert.equal(p118.length, 32, "Ps 118 vv. 1–32 only");
  });
});

describe("getPsalm", () => {
  test("returns intoned GABC for psalm 109 in mode 1", () => {
    const chants = getPsalm({ psalm: 109, mode: 1 });
    assert.ok(chants.length > 0);
    assert.equal(chants[0].office, "ps");
    assert.ok(chants[0].gabc.startsWith("(c4)"));
  });

  test("in directum recites straight through, with no mediant bar", () => {
    const [normal] = getPsalm({ psalm: 109, mode: 1 });
    const [direct] = getPsalm({ psalm: 109, mode: 1, inDirectum: true });
    // The normal tone splits the verse at the mediant "(:) "; in directum
    // recites the whole verse to the termination as one phrase.
    assert.ok(normal.gabc.includes("(:) "));
    assert.ok(!direct.gabc.includes("(:) "));
    assert.ok(direct.gabc.endsWith("(::)"));
  });
});

describe("corpus data integrity", () => {
  const BOOKS = ["gr", "lu", "la", "lh", "am", "nr"];
  const allChants = BOOKS.flatMap((source) => getChants({ source, limit: 100000 }));

  test("no gabc field carries a literal \\uXXXX escape (the double-escape guard)", () => {
    // The extractor once JSON-sliced instead of JSON-parsing the DB gabc, so
    // non-ASCII was stored as six literal characters (é) rather than the
    // decoded glyph — which made detectVowelAccent dead across the corpus.
    // This asserts the decode holds: real accents, never the escape sequence.
    const offenders = allChants.filter((c) => /\\u[0-9a-fA-F]{4}/.test(c.gabc ?? ""));
    assert.equal(
      offenders.length,
      0,
      `gabc must not contain literal \\uXXXX escapes; ${offenders.length} do` +
        (offenders[0] ? ` (first: ${offenders[0].id})` : ""),
    );
  });

  test("accented syllables are real characters, so accent detection can fire", () => {
    // At least one chant carries a genuine accented vowel in its gabc lyric text
    // — proving the decode produced á/é/… rather than the escape sequence.
    assert.ok(
      allChants.some((c) => /[áéíóúǽæœ]/i.test(c.gabc ?? "")),
      "corpus should contain decoded accented characters",
    );
  });

  test("no gabc field carries a NABC pipe (the neume layer is stripped)", () => {
    // A note group is `(notes)` — never `(notes|nabc)`. The pipe is the St-Gall
    // NABC layer, which tonus does not model; the extractor strips it.
    const offenders = allChants.filter((c) => (c.gabc ?? "").includes("|"));
    assert.equal(
      offenders.length,
      0,
      `gabc must not contain a NABC pipe; ${offenders.length} do` +
        (offenders[0] ? ` (first: ${offenders[0].id})` : ""),
    );
  });
});

describe("canticles by name (number-map regression)", () => {
  // Regression: the name map once pointed magnificat at the Symbolum
  // Athanasium and nunc dimittis at an empty row.
  test("each canticle resolves to its own text", () => {
    const cases = [
      ["benedictus", "Benedíctus"],
      ["magnificat", "Magníficat"],
      ["nunc dimittis", "Nunc dimíttis"],
      ["benedicite", "Benedícite"],
    ];
    for (const [name, incipitStart] of cases) {
      const rows = getPsalm({ psalm: name, mode: 8 });
      assert.ok(rows.length > 0, `${name} returns verses`);
      assert.ok(
        rows[0].incipit.startsWith(incipitStart),
        `${name} → "${rows[0].incipit}" should start "${incipitStart}"`,
      );
    }
  });

  test("psalmus is deterministic — no wall-clock in the source", () => {
    assert.equal(getPsalm({ psalm: 109, mode: 1 })[0].source.year, null);
  });
});

describe("user GABC office-part header (contract regression)", () => {
  test("a Latin genre name normalizes to its OfficeCode", () => {
    const [c] = getChants({ gabc: "name: Test;\noffice-part: Introitus;\n%%\n(c4) A(g)" });
    assert.equal(c.office, "in");
    assert.equal(c.genus, "Introitus");
  });
  test("any casing normalizes; an unknown value falls to or", () => {
    const [a] = getChants({ gabc: "office-part: antiphona;\n%%\n(c4) A(g)" });
    assert.equal(a.office, "an");
    const [u] = getChants({ gabc: "office-part: Varia;\n%%\n(c4) A(g)" });
    assert.equal(u.office, "or");
  });
});

describe("getChants — the id fast path", () => {
  test("id no longer short-circuits the other filters", () => {
    // getChants({source, id}) once ignored `source` entirely and reported a chant
    // from any book as belonging to the asked-for one.
    const nr = getChants({ source: "nr" })[0];
    assert.equal(getChants({ source: "gr", id: nr.id }).length, 0);
    assert.equal(getChants({ source: "nr", id: nr.id }).length, 1);
  });
});
