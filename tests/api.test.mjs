import { describe, test } from "node:test";
import assert from "node:assert/strict";
import tonus from "../dist/index.js";
import { toMidi } from "../dist/engines/score/emitters/_archive/midi.js";
import { toMusicXML } from "../dist/engines/score/emitters/_archive/musicxml.js";

describe("tonus namespace", () => {
  test("festum returns feasts for a date", () => {
    const feasts = tonus.festum({ date: new Date(2026, 11, 25) });
    assert.ok(feasts.length > 0);
    assert.equal(feasts[0].name, "In Nativitate Domini");
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
    const t = tonus.temper({ tuning: "pythagorean", mode: 1 });
    const note = t.nota("D4");
    assert.equal(note.midi, 62);
    assert.ok(note.hz > 0);
  });

  test("proprium returns proper chants for a feast", () => {
    const feasts = tonus.festum({ date: new Date(2026, 11, 25) });
    const propers = tonus.proprium({ feast: feasts });
    assert.ok(propers.length > 0);
  });

  test("ordinarium returns kyriale chants", () => {
    const chants = tonus.ordinarium({ mass: 8, ordinary: "ky" });
    assert.ok(chants.length > 0);
  });

  test("ordo builds a score from a chant; archive emitters still produce output", () => {
    const [chant] = tonus.cantus({ gabc: "(c4) Ky(g)ri(h)e(g.) (::)" });
    const score = tonus.cantio(chant);
    assert.ok(score.phrases.length > 0);
    assert.ok(score.prosody.noteCount > 0);
    const midi = toMidi(score, { format: "file" });
    assert.ok(midi.bytes instanceof Uint8Array);
    const xml = toMusicXML(score);
    assert.ok(xml.xml.includes("score-partwise"));
  });

  test("pondus and accentus return interpretation profiles", () => {
    const p = tonus.pondus("strict");
    const a = tonus.accentus("solemn");
    assert.equal(p.style, "strict");
    assert.equal(a.style, "solemn");
  });

  test("full pipeline: feast → proprium → ordo → midi", () => {
    const feasts = tonus.festum({ date: new Date(2026, 11, 25) });
    const propers = tonus.proprium({ feast: feasts, office: "in" });
    assert.ok(propers.length > 0);
    const score = tonus.cantio(propers[0]);
    const midi = toMidi(score, { tempoBpm: 120, format: "file" });
    assert.ok(midi.bytes instanceof Uint8Array);
    assert.ok(midi.bytes.length > 0);
  });
});
