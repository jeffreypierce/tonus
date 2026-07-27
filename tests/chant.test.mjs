import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { getChants, getCorpus } from "../dist/engines/chant/chant.js";
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

  test("serves the Kyriale as a corpus book (source ky) — the ordinary is countable", () => {
    const ky = getChants({ source: "ky" });
    assert.equal(ky.length, 120, `expected the full Kyriale, got ${ky.length}`);
    for (const c of ky) {
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
    const viaBook = getChants({ source: "ky" }).find((c) => c.id === viaOrdo.id);
    assert.ok(viaBook, `${viaOrdo.id} is reachable as a book record too`);
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

  test("overlap is null (unmeasured) for a non-GregoBase book, not a false zero", () => {
    // nr (Nocturnale) is outside GregoBase, so its overlap was never measured.
    // It must report null — distinct from a measured "shares nothing" ([]/0).
    const nr = getCorpus("nr");
    assert.equal(nr.total, null);
    assert.equal(nr.unique, null);
    assert.equal(nr.shared, null);
    assert.ok(nr.count > 0, "count is still real (chants tonus stores)");
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
    const chants = getHour({ feast: feasts, hora: "laudes", rite: "monasticum" });
    assert.ok(chants.length > 0);
  });

  test("returns office chants for vesperae", () => {
    const feasts = getFeast({ date: new Date("2026-12-25") });
    const chants = getHour({ feast: feasts, hora: "vesperae" });
    assert.ok(chants.length > 0);
  });

  test("little hours march through Ps 118 (Terce 33–80, Sext 81–128, None 129–176)", () => {
    const [f] = getFeast({ date: new Date("2026-12-25") });
    const p118Range = (hora) => {
      const verses = getHour({ feast: f, hora })
        .filter((c) => c.id.startsWith("psalm:118:"))
        .map((c) => parseInt(c.id.split(":")[2], 10));
      return [Math.min(...verses), Math.max(...verses)];
    };
    assert.deepEqual(p118Range("tertia"), [33, 80]);
    assert.deepEqual(p118Range("sexta"), [81, 128]);
    assert.deepEqual(p118Range("nona"), [129, 176]);
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
  test("rite defaults to romanum (no change to existing callers)", () => {
    const feasts = getFeast({ date: new Date("2026-12-25") });
    const def = getHour({ feast: feasts, hora: "vesperae" });
    const roman = getHour({ feast: feasts, hora: "vesperae", rite: "romanum" });
    assert.deepEqual(def.map((c) => c.id), roman.map((c) => c.id));
  });

  test("monastic Compline uses the three-psalm scheme (4, 90, 133)", () => {
    const [f] = getFeast({ date: new Date("2026-12-25") });
    const psalms = (rite) =>
      getHour({ feast: f, hora: "completorium", rite })
        .filter((c) => c.id.startsWith("psalm:"))
        .map((c) => parseInt(c.id.split(":")[1], 10));
    const monastic = [...new Set(psalms("monasticum"))];
    // Monastic Compline is Ps 4, 90, 133 — no Ps 30 (which the Roman rite adds).
    assert.deepEqual(monastic, [4, 90, 133]);
    assert.ok(psalms("romanum").includes(30), "Roman Compline keeps Ps 30");
  });

  test("monastic office chants come from the Antiphonale Monasticum", () => {
    // A feast with monastic Vespers antiphons; assert they resolve monastic-first.
    const survey = getHour({ hora: "vesperae", rite: "monasticum" });
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
    const matins = getHour({ feast: henry, hora: "matutinum", rite: "monasticum" });
    assert.ok(
      matins.some((c) => c.office === "re"),
      "Matins sings the commune's great responsories",
    );
    assert.ok(
      matins.some((c) => c.office === "an"),
      "…alongside antiphons",
    );
    const lauds = getHour({ feast: henry, hora: "laudes", rite: "monasticum" });
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

  test("Compline uses the exact psalm scheme: 4, 30(2-6), 90, 133", () => {
    const c = complineFor("2026-08-15");
    const byPsalm = {};
    for (const v of c.filter((x) => x.id.startsWith("psalm:"))) {
      const p = v.id.split(":")[1];
      byPsalm[p] = (byPsalm[p] ?? 0) + 1;
    }
    // Ps 30 is only vv. 2–6 (6 rows incl. the split v.3), NOT the whole psalm.
    assert.equal(byPsalm["30"], 6, "Ps 30 is vv. 2–6 only");
    assert.equal(byPsalm["4"], 10, "Ps 4 whole");
    assert.equal(byPsalm["90"], 16, "Ps 90 whole");
    assert.equal(byPsalm["133"], 4, "Ps 133 whole");
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

  test("Prime psalmody varies by weekday (DO Tridentine scheme)", () => {
    const psalmsOn = (date) => {
      const c = primeFor(date);
      return [...new Set(
        c.filter((x) => x.id.startsWith("psalm:")).map((x) => x.id.split(":")[1]),
      )].sort((a, b) => a - b);
    };
    // Sunday (2026-12-06) uses Ps 117; Friday (2026-12-11) uses Ps 21.
    assert.deepEqual(psalmsOn("2026-12-06"), ["53", "117", "118"], "Sunday: 53,117,118");
    assert.deepEqual(psalmsOn("2026-12-11"), ["21", "53", "118"], "Friday: 53,21,118");
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

describe("getChants — attestation filters", () => {
  test("before/century narrow the corpus to what a manuscript already held", () => {
    const all = getChants({ source: "am" }).length;
    const early = getChants({ source: "am", before: 1098 }).length;
    assert.ok(early > 0, "some AM chants are attested by 1098");
    assert.ok(early < all, `before should narrow (${early} vs ${all})`);
  });

  test("a year admits only centuries that CLOSED before it", () => {
    // CANTUS dates a manuscript to its century, so 1098 must not admit the
    // whole 11th century — a book dated "11th c." may postdate 1098.
    assert.equal(
      getChants({ before: 1098 }).length,
      getChants({ century: 10 }).length,
      "before:1098 should admit through the 900s, not the 1000s",
    );
    // At an exact century multiple the boundary century has just CLOSED: by
    // 1100 the 11th century (1000–1099) is wholly attested, so it is admitted.
    // (An earlier version pinned this to century 10, encoding an off-by-one
    // that made every round-number `before` refuse the century it had closed.)
    assert.equal(getChants({ before: 1100 }).length, getChants({ century: 11 }).length);
  });

  test("later cutoffs are supersets of earlier ones", () => {
    const a = getChants({ before: 1000 }).length;
    const b = getChants({ before: 1200 }).length;
    const c = getChants({ before: 1600 }).length;
    assert.ok(a < b && b < c, `monotonic: ${a} < ${b} < ${c}`);
  });

  test("cursus filters, and `both` satisfies either ask", () => {
    const mon = getChants({ cursus: "monastic" });
    assert.ok(mon.length > 0);
    // Nothing secular-only may appear in a monastic ask.
    for (const c of mon.slice(0, 50)) {
      assert.notEqual(c.id, undefined);
    }
    assert.ok(getChants({ cursus: "secular" }).length > 0);
  });

  test("an undated chant is excluded, not assumed old", () => {
    // Silence is not evidence of age: a chant CANTUS cannot date must not slip
    // into an early-repertoire query. Asserted directly: even an UNBOUNDED
    // cutoff admits only what the manuscript index can date, so the undated
    // remainder of a book never appears. (The old form compared sizes against
    // gr+nr — a proxy that broke the moment `before: 1000` correctly admitted
    // the closed 900s.)
    const early = getChants({ before: 1000 });
    assert.ok(early.length > 0);
    const grAll = getChants({ source: "gr" }).length;
    const grDated = getChants({ source: "gr", before: 30000 }).length;
    assert.ok(grDated > 0, "some GR chants are dated");
    assert.ok(
      grDated < grAll,
      `undated GR chants stay out at any cutoff (${grDated} dated of ${grAll})`,
    );
  });

  test("id no longer short-circuits the other filters", () => {
    // getChants({source, id}) once ignored `source` entirely and reported a chant
    // from any book as belonging to the asked-for one.
    const nr = getChants({ source: "nr" })[0];
    assert.equal(getChants({ source: "gr", id: nr.id }).length, 0);
    assert.equal(getChants({ source: "nr", id: nr.id }).length, 1);
  });
});
