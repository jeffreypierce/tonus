import { describe, test } from "node:test";
import assert from "node:assert/strict";
import tonus from "../dist/index.js";
import { toMidi } from "../dist/engines/score/emitters/_archive/midi.js";
import { toMusicXML } from "../dist/engines/score/emitters/_archive/musicxml.js";

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
    const chants = tonus.ordinarium({ mass: 8, ordinary: "ky" });
    assert.ok(chants.length > 0);
  });

  test("ordinarium is empty for the Triduum (no Mass-ordinary cycle)", () => {
    const goodFriday = tonus.festum({ date: new Date("2026-04-03") });
    assert.equal(goodFriday[0].grade, "triduum");
    assert.deepEqual(tonus.ordinarium({ feast: goodFriday[0] }), []);
    // A pinned mass still works (e.g. the Vigil borrowing Lux et origo):
    const pinned = tonus.ordinarium({ feast: goodFriday[0], mass: 1, ordinary: "ky" });
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
    assert.deepEqual(codes, ["ky", "gl", "sa", "ag", "it"]);
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

  test("ordo builds a score from a chant; archive emitters still produce output", () => {
    const [chant] = tonus.cantus({ gabc: "(c4) Ky(g)ri(h)e(g.) (::)" });
    const score = tonus.notatio(chant);
    assert.ok(score.phrases.length > 0);
    assert.ok(score.prosody.noteCount > 0);
    const midi = toMidi(score, { format: "file" });
    assert.ok(midi.bytes instanceof Uint8Array);
    const xml = toMusicXML(score);
    assert.ok(xml.xml.includes("score-partwise"));
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

  test("full pipeline: feast → proprium → ordo → midi", () => {
    const feasts = tonus.festum({ date: new Date("2026-12-25") });
    const propers = tonus.proprium({ feast: feasts, office: "in" });
    assert.ok(propers.length > 0);
    const score = tonus.notatio(propers[0]);
    const midi = toMidi(score, { tempoBpm: 120, format: "file" });
    assert.ok(midi.bytes instanceof Uint8Array);
    assert.ok(midi.bytes.length > 0);
  });
});
