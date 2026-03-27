import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildTemper } from "../dist/engines/temper/api.js";

describe("buildTemper", () => {
  test("defaults to pythagorean tuning with A4=440", () => {
    const t = buildTemper();
    assert.equal(t.tuning, "pythagorean");
    assert.equal(t.a4, 440);
    assert.equal(t.mode, "auto");
  });

  test("accepts a tuning string shorthand", () => {
    const t = buildTemper("meantone");
    assert.equal(t.tuning, "meantone");
  });

  test("accepts meantone with comma fraction", () => {
    const t = buildTemper({ tuning: "meantone", comma: "1/4" });
    assert.equal(t.tuning, "meantone");
    assert.equal(t.comma, 0.25);
  });

  test("produces 12 ratios and 12 cent values", () => {
    const t = buildTemper();
    assert.equal(t.ratios.length, 12);
    assert.equal(t.cents.length, 12);
  });
});

describe("nota", () => {
  const t = buildTemper({ mode: 1 });

  test("resolves a MIDI number to a Note with hz and pitch bend", () => {
    const note = t.nota(60);
    assert.equal(note.midi, 60);
    assert.equal(note.pc, 0);
    assert.equal(note.oct, 4);
    assert.ok(typeof note.hz === "number" && note.hz > 200);
    assert.ok(typeof note.bend === "number");
  });

  test("resolves a scientific pitch name string to a Note", () => {
    const note = t.nota("D4");
    assert.equal(note.midi, 62);
    assert.equal(note.spn, "D4");
  });

  test("resolves a solfege input to a Note", () => {
    const note = t.nota({ solfege: "RE" });
    assert.equal(note.pc, 2);
  });
});

describe("gradus", () => {
  const t = buildTemper({ mode: 1 });

  test("returns Step with Guidonian name and hexachord", () => {
    const step = t.gradus("D4");
    assert.ok(step.name !== null);
    assert.ok(step.hexachord !== null);
  });

  test("returns modal degree and role for a finalis pitch", () => {
    const step = t.gradus("D4");
    assert.equal(step.degree, 1);
    assert.equal(step.role, "finalis");
  });
});

describe("neuma", () => {
  const t = buildTemper({ mode: 1 });

  test("classifies a two-note ascending group as pes", () => {
    const neume = t.neuma([60, 62]);
    assert.equal(neume.shape, "pes");
    assert.equal(neume.notes.length, 2);
  });

  test("classifies a three-note up-down group as torculus", () => {
    const neume = t.neuma([60, 64, 62]);
    assert.equal(neume.shape, "torculus");
  });
});

describe("gamut", () => {
  test("returns diatonic notes within the mode ambitus", () => {
    const t = buildTemper({ mode: 1 });
    const notes = t.gamut();
    assert.ok(notes.length > 0);
    const pcs = new Set(notes.map((n) => n.pc));
    assert.ok(pcs.has(2)); // D — mode 1 finalis
  });
});

describe("modus", () => {
  test("returns ModeData for mode 1 with correct finalis and tenor", () => {
    const t = buildTemper({ mode: 1 });
    const mode = t.modus(1);
    assert.equal(mode.mode, 1);
    assert.equal(mode.name, "Protus Authenticus");
    assert.equal(mode.final, 2);
    assert.equal(mode.tenor, 9);
  });
});

describe("tonus", () => {
  test("returns psalm tone intonation, mediant, and termination as Notes", () => {
    const t = buildTemper({ mode: 1 });
    const tone = t.tonus();
    assert.equal(tone.mode, 1);
    assert.ok(tone.intonation.length > 0);
    assert.ok(tone.mediant.length > 0);
    assert.ok(tone.termination.length > 0);
    assert.ok(typeof tone.intonation[0].hz === "number");
  });

  test("throws when mode is auto", () => {
    const t = buildTemper();
    assert.throws(() => t.tonus(), /explicit mode/);
  });
});
