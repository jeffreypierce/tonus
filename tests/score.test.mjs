import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildScore, buildPondus, buildAccentus } from "../dist/engines/score/api.js";

const KYRIE_GABC = "(c4) Ky(g)ri(h)e(g.) (,) e(h)le(ih)i(g)son.(f.) (::)";

function makeChant(gabc, mode = "1") {
  return {
    id: "test:1",
    incipit: "Test",
    gabc,
    office: "or",
    officeLabel: "Ordinarium",
    mode,
    modeLabel: "Mode I",
    pages: [],
    source: { book: "Test", year: null, editor: null },
  };
}

describe("buildScore", () => {
  test("parses simple GABC into phrases with notes", () => {
    const score = buildScore(makeChant(KYRIE_GABC));
    assert.ok(score.phrases.length > 0);
    assert.ok(score.phrases[0].syllables.length > 0);
    assert.ok(score.phrases[0].syllables[0].notes.length > 0);
  });

  test("resolves notes through temper with hz and pitch bend", () => {
    const score = buildScore(makeChant(KYRIE_GABC));
    const note = score.phrases[0].syllables[0].notes[0];
    assert.ok(typeof note.pitch.midi === "number");
    assert.ok(typeof note.pitch.hz === "number" && note.pitch.hz > 0);
    assert.ok(typeof note.pitch.bend === "number");
    assert.ok(typeof note.pitch.spn === "string");
  });

  test("assigns arsis and thesis gesture counts to notes", () => {
    const score = buildScore(makeChant(KYRIE_GABC));
    const notes = score.phrases[0].syllables.flatMap((s) => s.notes);
    assert.ok(notes.length > 0);
    for (const n of notes) {
      assert.ok(typeof n.performance.arsis === "number" && n.performance.arsis >= 1);
      assert.ok(typeof n.performance.thesis === "number" && n.performance.thesis >= 1);
    }
  });

  test("classifies neume shapes on syllables", () => {
    const score = buildScore(makeChant(KYRIE_GABC));
    for (const phrase of score.phrases) {
      for (const syl of phrase.syllables) {
        assert.ok(typeof syl.neume.type === "string");
      }
    }
  });

  test("note.context.vowel is populated from lyric", () => {
    const score = buildScore(makeChant(KYRIE_GABC));
    const notes = score.phrases[0].syllables.flatMap((s) => s.notes);
    // Every note has a vowel string (may be empty for punctuation-only syllables)
    for (const n of notes) {
      assert.equal(typeof n.context.vowel, "string");
    }
    // At least one note has a non-empty vowel (e.g. "y" in "Ky", "e" in "ri(h)", etc.)
    assert.ok(notes.some((n) => n.context.vowel.length > 0));
  });

  test("note has all 4 sub-objects (pitch, step, performance, context)", () => {
    const score = buildScore(makeChant(KYRIE_GABC));
    const note = score.phrases[0].syllables[0].notes[0];
    assert.ok(note.pitch);
    assert.ok(note.step);
    assert.ok(note.performance);
    assert.ok(note.context);
  });

  test("detects ictus from notation marks", () => {
    const gabc = "(c4) A(g.)B(h)C(g.) (::)";
    const score = buildScore(makeChant(gabc));
    const notes = score.phrases[0].syllables.flatMap((s) => s.notes);
    const ictusNotes = notes.filter((n) => n.context.ictus);
    assert.ok(ictusNotes.length > 0);
  });

  test("handles GABC with header and body", () => {
    const gabc = "name: Test;\nmode: 1;\n%%\n(c4) A(g) (::)";
    const score = buildScore(makeChant(gabc));
    assert.ok(score.phrases.length > 0);
  });

  test("returns parse errors for empty input", () => {
    const score = buildScore(makeChant(""));
    assert.ok(score.errors.length > 0);
  });
});

describe("buildPondus", () => {
  test("defaults to balanced style", () => {
    const p = buildPondus();
    assert.equal(p.style, "balanced");
    assert.ok(p.profile.weights);
  });

  test("accepts expressive style", () => {
    const p = buildPondus("expressive");
    assert.equal(p.style, "expressive");
  });

  test("accepts strict style", () => {
    const p = buildPondus("strict");
    assert.equal(p.style, "strict");
  });
});

describe("buildAccentus", () => {
  test("defaults to lyrical style", () => {
    const a = buildAccentus();
    assert.equal(a.style, "lyrical");
    assert.ok(typeof a.profile.curve === "number");
  });

  test("accepts solemn style", () => {
    const a = buildAccentus("solemn");
    assert.equal(a.style, "solemn");
  });
});

describe("emitters", () => {
  const score = buildScore(makeChant(KYRIE_GABC));

  test("midi returns a Uint8Array", () => {
    const midi = score.midi({ bpm: 120 });
    assert.ok(midi instanceof Uint8Array);
    assert.ok(midi.length > 0);
  });

  test("musicxml returns a string containing score-partwise", () => {
    const xml = score.musicxml();
    assert.ok(typeof xml === "string");
    assert.ok(xml.includes("score-partwise"));
    assert.ok(xml.includes("tonus"));
  });
});
