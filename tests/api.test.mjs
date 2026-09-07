import { describe, test } from "node:test";
import assert from "node:assert/strict";
import tonus from "../dist/index.js";

describe("tonus namespace", () => {
  test("festum returns feasts for a date", () => {
    const feasts = tonus.festum({ date: new Date("2026-12-25") });
    assert.ok(feasts.length > 0);
    assert.equal(feasts[0].nomen, "In Nativitate Domini");
  });

  test("festum() and caelum() default to the medieval epoch (Guido d'Arezzo, 991)", () => {
    const feasts = tonus.festum();
    assert.ok(feasts.length > 0);
    assert.equal(
      feasts[0].date.getUTCFullYear(),
      991,
      "a bare festum() resolves Guido's era, not the modern year",
    );
    // caelum() shares the same default epoch, so both describe the same day.
    const sky = tonus.caelum();
    assert.equal(sky.date.getUTCFullYear(), 991);
  });

  test("cantus returns chants by mode and office", () => {
    const chants = tonus.cantus({ mode: 1, office: "an", limit: 3 });
    assert.ok(chants.length > 0);
    assert.equal(chants[0].mode, "1");
  });

  test("cantus with gabc converts a GABC string to a Chant", () => {
    const [chant] = tonus.cantus({ gabc: "(c4) Sán(g)ctus(h) Sán(g)ctus(h) Sán(g)ctus(h.)" });
    assert.ok(chant.gabc.length > 0);
    assert.equal(chant.source.code, "user");
  });

  test("cantus with gabc accepts mode and incipit overrides", () => {
    const [chant] = tonus.cantus({ gabc: "(c4) A(g)B(h)", mode: 1, incipit: "Test" });
    assert.equal(chant.mode, "1");
    assert.equal(chant.incipit, "Test");
  });

  test("temper builds a tuning context with methods", () => {
    const t = tonus.temperamentum({ tuning: "pythagorean", mode: 1 });
    const note = t.nota("D4");
    assert.equal(note.midi, 62);
    assert.ok(note.hz > 0);
  });

  test("proprium returns proper chants for a feast", () => {
    const feasts = tonus.festum({ date: new Date("2026-12-25") });
    const propers = tonus.proprium({ feast: feasts });
    assert.ok(propers.length > 0);
  });

  test("pascha returns the movable anchors of a year", () => {
    const p = tonus.pascha(2026);
    assert.equal(p.year, 2026);
    assert.equal(p.easter.toISOString().slice(0, 10), "2026-04-05");
    assert.equal(p.goodFriday.toISOString().slice(0, 10), "2026-04-03");
    assert.equal(p.pentecost.toISOString().slice(0, 10), "2026-05-24");
    assert.equal(p.corpusChristi.toISOString().slice(0, 10), "2026-06-04");
    assert.equal(p.adventFirstSunday.toISOString().slice(0, 10), "2026-11-29");
    // Mutating the result must not poison the internal anchor cache.
    p.easter.setUTCFullYear(1999);
    assert.equal(tonus.pascha(2026).easter.toISOString().slice(0, 10), "2026-04-05");
    assert.throws(() => tonus.pascha(NaN), /finite year/);
  });

  test("ordinarium returns kyriale chants", () => {
    const chants = tonus.ordinarium({ mass: 8, ordinary: "ke" });
    assert.ok(chants.length > 0);
  });

  test("ordinarium is empty for the Triduum (no Mass-ordinary cycle)", () => {
    const goodFriday = tonus.festum({ date: new Date("2026-04-03") });
    assert.equal(goodFriday[0].grade, "triduum");
    assert.deepEqual(tonus.ordinarium({ feast: goodFriday[0] }), []);
    // A pinned mass still works (e.g. the Vigil borrowing Lux et origo):
    const pinned = tonus.ordinarium({ feast: goodFriday[0], mass: 1, ordinary: "ke" });
    assert.ok(pinned.length > 0);
  });

  test("Maundy Thursday keeps its Gloria (Triduum + Lenten exception)", () => {
    const [maundy] = tonus.festum({ date: new Date("2026-04-02") });
    assert.equal(maundy.nomen, "Feria Quinta in Cena Domini");
    assert.equal(maundy.grade, "triduum");
    assert.equal(maundy.season, "quad"); // Lent — normally omits the Gloria

    const ord = tonus.ordinarium({ feast: maundy });
    const codes = ord.map((o) => o.ordinary);
    // In Cena Domini keeps its Mass with the Gloria — no Credo, no sprinkle.
    assert.deepEqual(codes, ["ke", "gl", "sa", "ag", "it"]);
    const gloria = ord.find((o) => o.ordinary === "gl");
    assert.ok(gloria && gloria.gabc.length > 0, "Gloria must be present and sung");
    assert.equal(ord.filter((o) => o.ordinary === "cr").length, 0, "no Credo");
    assert.equal(
      ord.filter((o) => o.ordinary === "as" || o.ordinary === "va").length,
      0,
      "no sprinkle rite at the evening Mass",
    );
  });

  test("ordinarium includes the sprinkle rite: Vidi aquam in Paschaltide, Asperges otherwise", () => {
    // A Sunday in Paschaltide (2nd Sunday after Easter 2026) gets Vidi aquam.
    const paschal = tonus.festum({ date: new Date("2026-04-19") });
    assert.equal(paschal[0].season, "pasc");
    const paschalOrd = tonus.ordinarium({ feast: paschal[0] });
    const vidi = paschalOrd.filter((o) => o.ordinary === "va");
    assert.equal(vidi.length, 1, "expected exactly one Vidi aquam");
    assert.equal(vidi[0].ordinarium, "Vidi aquam");
    assert.ok(vidi[0].gabc.length > 0);
    assert.equal(
      paschalOrd.filter((o) => o.ordinary === "as").length,
      0,
      "Asperges must not appear in Paschaltide",
    );

    // A Sunday after Pentecost gets Asperges.
    const pent = tonus.festum({ date: new Date("2026-11-08") });
    assert.equal(pent[0].season, "pent");
    const pentOrd = tonus.ordinarium({ feast: pent[0] });
    const asperges = pentOrd.filter((o) => o.ordinary === "as");
    assert.equal(asperges.length, 1, "expected exactly one Asperges");
    assert.equal(asperges[0].ordinarium, "Asperges");
    assert.ok(asperges[0].gabc.length > 0);
    assert.equal(
      pentOrd.filter((o) => o.ordinary === "va").length,
      0,
      "Vidi aquam must not appear outside Paschaltide",
    );
  });

  test("interpretation reaches the tabula: two phrasings differ note-for-note", () => {
    const [chant] = tonus.cantus({ gabc: "(c4) Ky(g)ri(h)e(g.) e(f)le(g)i(h)son(g.) (::)" });
    const solemn = tonus.notatio(chant, { accentus: "solemn" });
    const flat = tonus.notatio(chant, { accentus: "recitative" });
    const vels = (s) => s.tabula.map((r) => r.velocity);
    // The accentus shapes note velocities on the tabula.
    assert.notDeepEqual(vels(solemn), vels(flat));
  });

  test("notatio accepts pondus and accentus as style strings or opts", () => {
    const [chant] = tonus.cantus({ gabc: "(c4) Ky(g)ri(h)e(g.) (::)" });
    const s1 = tonus.notatio(chant, { pondus: "strict", accentus: "solemn" });
    assert.ok(s1.phrases.length > 0);
    const s2 = tonus.notatio(chant, {
      pondus: { style: "expressive" },
      accentus: { style: "recitative" },
    });
    assert.ok(s2.phrases.length > 0);
  });

  test("full pipeline: feast → proprium → notatio", () => {
    const feasts = tonus.festum({ date: new Date("2026-12-25") });
    const propers = tonus.proprium({ feast: feasts, office: "in" });
    assert.ok(propers.length > 0);
    const score = tonus.notatio(propers[0]);
    assert.ok(score.phrases.length > 0);
    assert.ok(score.tabula.length > 0);
  });
});

describe("the appendix (the export law)", () => {
  // Verbs live on the namespace; return values are plain data; the appendix
  // exports canonical constant tables — nothing with a ().
  test("the canonical tables are exported", async () => {
    const m = await import("../dist/index.js");
    const { SEASON_LABEL, TEMPORA, GRADE_ORDER, GRADUS, MODES, TONES, CADENTIAE } = m;
    assert.equal(SEASON_LABEL.adv, "Advent");
    assert.equal(TEMPORA.adv, "Tempus Adventus");
    assert.equal(GRADE_ORDER.length, 14);
    assert.ok(GRADUS["duplex-i"]);
    assert.ok(MODES instanceof Map && MODES.get(1).nomen === "Protus Authenticus");
    assert.equal(TONES.length, 9); // eight tones + Tonus Peregrinus
    assert.equal(TONES[0].nomen, "Tonus I");
    // CADENTIAE — the corpus cadence catalogue: genera, commonest first, the
    // step onto the final leading, statistics in sane ranges.
    assert.ok(Array.isArray(CADENTIAE) && CADENTIAE.length > 40);
    assert.equal(CADENTIAE[0].key, "cadens @0");
    assert.equal(CADENTIAE[0].degree, 0);
    for (const g of CADENTIAE) {
      assert.ok(g.n >= 50 && g.finality >= 0 && g.finality <= 1);
      // The degree is SIGNED, not octave-reduced — a fifth above the final is
      // not a fourth below. Bounded generously.
      assert.ok(g.degree >= -14 && g.degree <= 14);
      for (const s of g.species) {
        assert.ok(s.n >= 50 && s.n <= g.n);
        assert.ok(s.tail.length >= 1 && s.tail.length <= 3);
      }
    }
  });

  test("CADENTIAE_POPULATION is the honest denominator", async () => {
    const { CADENTIAE, CADENTIAE_POPULATION: POP } = await import("../dist/index.js");
    // byMode must be the FULL tally, not the tabled subset — if it were summed
    // from the 122 families that cleared the floor, every share and every lift
    // taken against it would be inflated, and nothing would error.
    const sum = Object.values(POP.byMode).reduce((s, n) => s + n, 0);
    assert.equal(sum, POP.ends, "byMode does not sum to ends");
    assert.ok(POP.ends > CADENTIAE.reduce((s, f) => s + f.n, 0),
      "ends is not larger than the tabled families — it is not the full population");
    // Every mode digit, plus "?" for the mode-less.
    for (const m of ["1", "2", "3", "4", "5", "6", "7", "8", "?"]) {
      assert.ok(POP.byMode[m] > 0, `byMode is missing ${m}`);
    }
    // share is n over that denominator, to the baked 4 places.
    for (const f of CADENTIAE) {
      assert.ok(Math.abs(f.share - f.n / POP.ends) < 0.00005,
        `${f.key}: share ${f.share} != n/ends`);
    }
    // Frozen, like every other appendix table.
    assert.ok(Object.isFrozen(POP) && Object.isFrozen(POP.byMode));
  });

  test("cadentiaGenus and cadentiaSpecies are THE indexes, not second ones", async () => {
    const { CADENTIAE } = await import("../dist/index.js");
    // Not on the appendix: they are functions, and the export law admits
    // tables only. Consumers reach them through the data module.
    const { cadentiaGenus, cadentiaSpecies } = await import("../dist/data/cadentiae.js");
    for (const g of CADENTIAE) {
      assert.equal(cadentiaGenus(g.key), g, `${g.key} resolves to a different object`);
      for (const s of g.species) assert.equal(cadentiaSpecies(s.key), s);
    }
    assert.equal(cadentiaGenus("no such @99"), undefined);
    assert.equal(cadentiaSpecies("99,99,99"), undefined);
  });

  test("a cadence carries its catalogued finality, joined not re-derived", async () => {
    const { cadentiaGenus, cadentiaSpecies } = await import("../dist/data/cadentiae.js");
    let bySpecies = 0, byGenus = 0, floored = 0;
    for (const chant of tonus.cantus({ source: "gr", limit: 60 })) {
      let score;
      try { score = tonus.notatio(chant); } catch { continue; }
      for (const cad of score.cadences) {
        const species = cadentiaSpecies(cad.species);
        const genus = cadentiaGenus(cad.genus);
        if (species) {
          // The joined value must BE the species', not something recomputed
          // from the degree or target that happens to look similar.
          assert.equal(cad.finality, species.finality, `${cad.species}: species finality`);
          bySpecies++;
        } else if (genus) {
          assert.equal(cad.finality, genus.finality, `${cad.genus}: genus finality`);
          byGenus++;
        } else {
          // Below both floors there is nothing — an uncatalogued close, not a
          // close that never closes.
          assert.equal(cad.finality, null, `${cad.species} has no class but finality is set`);
          floored++;
        }
      }
    }
    assert.ok(bySpecies > 0 && byGenus > 0, `saw ${bySpecies} by species / ${byGenus} by genus / ${floored} floored`);
  });

  test("detector-fresh cadences carry null finality — the join is the builder's", async () => {
    const { detectCadences } = await import("../dist/engines/score/cadence.js");
    const { MODES } = await import("../dist/index.js");
    const score = tonus.notatio(tonus.cantus({ source: "gr", limit: 1 })[0]);
    // The detector is a pure pass: it computes the signature and stops, so the
    // corpus artifact never enters the detection path.
    const raw = detectCadences(score.phrases, MODES.get(2));
    assert.ok(raw.length > 0);
    assert.ok(raw.every((c) => c.finality === null),
      "detectCadences filled finality — the corpus join leaked into detection");
    // And the built score DID join it.
    assert.ok(score.cadences.some((c) => c.finality !== null));
  });

  test("the genus is the level at which rara means rare", async () => {
    // The re-key's promise: on the exact four-note semitone key a third of
    // live closes fell under the floor and printed "rara", the commonest
    // close in mode VIII among them. On the genus, about one in a hundred.
    const { cadentiaGenus } = await import("../dist/data/cadentiae.js");
    let seen = 0, rara = 0;
    for (const chant of tonus.cantus({ source: "gr", limit: 120 })) {
      let score;
      try { score = tonus.notatio(chant); } catch { continue; }
      for (const cad of score.cadences) {
        seen++;
        if (!cadentiaGenus(cad.genus)) rara++;
      }
    }
    assert.ok(seen > 200, `saw ${seen} cadences`);
    assert.ok(rara / seen < 0.05, `${rara} of ${seen} live closes are below the genus floor`);
  });

  test("modus(n).cadences is derived from CADENTIAE, not stored twice", async () => {
    const { CADENTIAE, CADENTIAE_POPULATION: POP } = await import("../dist/index.js");
    const set = tonus.temperamentum().modus(1).cadences;
    assert.equal(set.ends, POP.byMode["1"]);
    assert.equal(set.genera.length, 5);
    for (const g of set.genera) {
      const table = CADENTIAE.find((x) => x.key === g.key);
      assert.ok(table, `${g.key} is tabled`);
      assert.equal(g.n, table.modes["1"]);
      assert.ok(Math.abs(g.share - g.n / set.ends) < 0.0001);
      assert.ok(g.species.length >= 1 && g.species.length <= 3);
      assert.ok(["finalis", "tenor", "alia"].includes(g.role));
      assert.equal(g.nomen, `${g.motion} ${g.role === "alia" ? g.nomen.split(" ")[1] : g.role}`);
    }
    // Commonest first, and the mode's tenor in its set (measured, §5 of the plan).
    assert.ok(set.genera[0].n >= set.genera[1].n);
    assert.ok(set.genera.some((g) => g.role === "tenor"), "mode 1's tenor close makes the five");
    assert.ok(set.covered > 0.4 && set.covered < 0.7);
  });

  test("HORAE is the office order, and officium agrees with it", async () => {
    const { HORAE } = await import("../dist/index.js");
    // The order IS the content — a day's office read out of sequence is not
    // the day's office.
    assert.deepEqual([...HORAE], [
      "matutinum", "laudes", "prima", "tertia", "sexta", "nona",
      "vesperae", "completorium",
    ]);
    // The list and the check cannot drift: every entry is accepted, and a
    // plausible near-miss is refused rather than silently matching nothing.
    for (const hora of HORAE) {
      assert.ok(Array.isArray(tonus.officium({ hora })), `officium rejected ${hora}`);
    }
    assert.throws(() => tonus.officium({ hora: "vespers" }), /unknown hora/);
  });

  test("the Latin label tables carry Latin", async () => {
    const { OFFICIA, ORDINARIA, MODI } = await import("../dist/index.js");
    // The register rule read back off the values: a Latin name means Latin
    // content. If one of these ever holds "Antiphon", the name is now a lie.
    assert.equal(OFFICIA.an, "Antiphona");
    assert.equal(ORDINARIA.ke, "Kyrie eleison");
    assert.equal(MODI["1"], "Modus I");
    assert.equal(Object.keys(MODI).length, 8);
  });

  test("SOURCES is the book ledger cantus filters by", async () => {
    const { SOURCES } = await import("../dist/index.js");
    assert.equal(SOURCES.gr.book, "Graduale Romanum");
    // Every registered code is a code cantus({ source }) actually accepts —
    // this is the table a caller reads to build a book picker.
    for (const code of Object.keys(SOURCES)) {
      assert.equal(SOURCES[code].code, code, `${code} disagrees with its own record`);
      assert.ok(Array.isArray(tonus.cantus({ source: code, limit: 1 })));
    }
  });

  test("CENSUS_GROUPS and CENSUS_ORDER describe the real census", async () => {
    const { CENSUS_GROUPS, CENSUS_ORDER } = await import("../dist/index.js");
    // CENSUS_ORDER is the block index, so membership is answerable without a
    // try/catch — that is the whole reason it is public.
    assert.ok(CENSUS_ORDER.length > 0);
    const id = CENSUS_ORDER[0];
    const c = tonus.census({ id, k: 0 });
    // The group keys are the `by:` values AND the profile keys. One vocabulary.
    assert.deepEqual(
      Object.keys(c.profile).sort(),
      Object.keys(CENSUS_GROUPS).sort(),
    );
    for (const [g, { count }] of Object.entries(CENSUS_GROUPS)) {
      assert.equal(c.profile[g].values.length, count, `${g} field count disagrees`);
    }
    // A censused id resolves; an id outside the index does not.
    assert.ok(!CENSUS_ORDER.includes("gregobase:none-such"));
  });

  test("no functions ride the appendix", async () => {
    const m = await import("../dist/index.js");
    const fns = Object.entries(m)
      .filter(([k, v]) => k !== "default" && typeof v === "function")
      .map(([k]) => k);
    assert.deepEqual(fns, [], `functions leaked into the appendix: ${fns}`);
  });
});

describe("guided throws on junk input (the error contract)", () => {
  test("festum rejects a non-Date date", () => {
    assert.throws(() => tonus.festum({ date: "xmas" }), /date must be a Date/);
  });
  test("caelum rejects a non-Date date", () => {
    assert.throws(() => tonus.caelum({ date: "solstice" }), /date must be a Date/);
  });
  test("harmonia rejects a non-Cosmos input", () => {
    assert.throws(() => tonus.harmonia(null), /Cosmos/);
    assert.throws(() => tonus.harmonia({ doctrina: "freud" }), /Cosmos/);
  });
  test("notatio rejects a non-Chant input", () => {
    assert.throws(() => tonus.notatio(null), /needs a Chant/);
    assert.throws(() => tonus.notatio({ gabc: 123 }), /needs a Chant/);
    assert.throws(() => tonus.notatio("(c4) A(g)"), /needs a Chant/);
  });
  test("proprium rejects unknown query keys like festum and cantus do", () => {
    assert.throws(() => tonus.proprium({ bogus: 1 }), /unknown query key/);
  });
  test("temperamentum rejects a junk mode and a non-string tuning", () => {
    assert.throws(() => tonus.temperamentum({ mode: 99 }), /Unknown mode/);
    assert.throws(() => tonus.temperamentum({ tuning: 42 }), /tuning must be a string/);
  });
});

describe("feast filters reject non-Feast input everywhere", () => {
  test("proprium, ordinarium, officium, caelum all throw with guidance", () => {
    assert.throws(() => tonus.proprium({ feast: 42 }), /must be a Feast/);
    assert.throws(() => tonus.ordinarium({ feast: {} }), /must be a Feast/);
    assert.throws(() => tonus.officium({ feast: "adv1", hora: "laudes" }), /must be a Feast/);
    assert.throws(() => tonus.caelum({ feast: 42 }), /must be a Feast/);
  });
});
