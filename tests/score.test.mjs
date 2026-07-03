import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildScore } from "../dist/engines/score/api.js";
import { toMidi } from "../dist/engines/score/emitters/_archive/midi.js";
import { toMusicXML } from "../dist/engines/score/emitters/_archive/musicxml.js";

const KYRIE_GABC = "(c4) Ky(g)ri(h)e(g.) (,) e(h)le(ih)i(g)son.(f.) (::)";

function makeChant(gabc, mode = "1") {
  return {
    id: "test:1",
    incipit: "Test",
    gabc,
    office: "or",
    genus: "Ordinarium",
    mode,
    modus: "Modus I",
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

  test("assigns rhythmicShape and rhythmicIndex to notes", () => {
    const score = buildScore(makeChant(KYRIE_GABC));
    const notes = score.phrases[0].syllables.flatMap((s) => s.notes);
    assert.ok(notes.length > 0);
    for (const n of notes) {
      assert.ok(n.performance.rhythmicShape === "arsic" || n.performance.rhythmicShape === "thetic");
      assert.ok(typeof n.performance.rhythmicIndex === "number" && n.performance.rhythmicIndex >= 1);
    }
  });

  test("compound beat: all notes between ictuses share rhythmicShape; rhythmicIndex runs 1..N", () => {
    const score = buildScore(makeChant(KYRIE_GABC));
    // Classification runs per phrase — partition per phrase, then by ictus.
    for (const phrase of score.phrases) {
      const notes = phrase.syllables.flatMap((s) => s.notes);
      const groups = [];
      let current = [];
      for (const n of notes) {
        if (n.context.ictus) {
          if (current.length > 0) groups.push(current);
          current = [n];
        } else {
          current.push(n);
        }
      }
      if (current.length > 0) groups.push(current);

      for (const group of groups) {
        const shape = group[0].performance.rhythmicShape;
        for (let i = 0; i < group.length; i++) {
          assert.equal(group[i].performance.rhythmicShape, shape);
          assert.equal(group[i].performance.rhythmicIndex, i + 1);
        }
      }
    }
  });

  test("rhythmicShape: post-apex groups classify thetic", () => {
    // Kyrie eleison: rising Ky-ri-e to apex, then descending e-le-i-son
    const score = buildScore(makeChant(KYRIE_GABC));
    const allNotes = score.phrases.flatMap((p) => p.syllables.flatMap((s) => s.notes));
    // The last note of the phrase is on the descent and should be thetic
    const last = allNotes[allNotes.length - 1];
    assert.equal(last.performance.rhythmicShape, "thetic");
  });

  test("salicus (ascending 3 with ictus on middle note) classifies as salicus neume and is always arsic", () => {
    // Three ascending notes where the middle has an ictus mark (')
    const gabc = "(c4) Sa(gi'k) (::)";
    const score = buildScore(makeChant(gabc));
    const syl = score.phrases[0].syllables[0];
    assert.equal(syl.neume.type, "salicus");
    for (const n of syl.notes) {
      assert.equal(n.performance.rhythmicShape, "arsic");
    }
  });

  test("doubly-dotted clivis is always thetic", () => {
    // Two descending notes with double episema (..) on the first note
    const gabc = "(c4) Cli(h..g) (::)";
    const score = buildScore(makeChant(gabc));
    const syl = score.phrases[0].syllables[0];
    assert.equal(syl.neume.type, "clivis");
    assert.ok(syl.notes.some((n) => n.context.doubleEpisema));
    for (const n of syl.notes) {
      assert.equal(n.performance.rhythmicShape, "thetic");
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

describe("pondus and accentus options", () => {
  test("pondus style changes note articulation", () => {
    const balanced = buildScore(makeChant(KYRIE_GABC));
    const strict = buildScore(makeChant(KYRIE_GABC), { pondus: "strict" });
    const durations = (s) =>
      s.phrases.flatMap((p) => p.syllables.flatMap((sy) => sy.notes.map((n) => n.performance.duration)));
    assert.notDeepEqual(durations(strict), durations(balanced));
  });

  test("accentus opts shape the tabula", () => {
    const plain = buildScore(makeChant(KYRIE_GABC));
    const solemn = buildScore(makeChant(KYRIE_GABC), { accentus: "solemn" });
    assert.equal(plain.tabula.length, solemn.tabula.length);
    const velocities = (s) => s.tabula.map((r) => r.velocity);
    assert.notDeepEqual(velocities(solemn), velocities(plain));
  });

  test("accentus overrides are honored", () => {
    const base = buildScore(makeChant(KYRIE_GABC), { accentus: "lyrical" });
    const flat = buildScore(makeChant(KYRIE_GABC), {
      accentus: { style: "lyrical", overrides: { curve: 0 } },
    });
    assert.ok(Array.isArray(flat.tabula));
    const velocities = (s) => s.tabula.map((r) => r.velocity);
    assert.notDeepEqual(velocities(flat), velocities(base));
  });
});

describe("archived emitters (not on v1 Score API)", () => {
  const score = buildScore(makeChant(KYRIE_GABC));

  test("toMidi produces bytes", () => {
    const midi = toMidi(score, { tempoBpm: 120, format: "file" });
    assert.ok(midi.bytes instanceof Uint8Array);
    assert.ok(midi.bytes.length > 0);
  });

  test("toMusicXML produces a score-partwise document", () => {
    const out = toMusicXML(score);
    assert.ok(typeof out.xml === "string");
    assert.ok(out.xml.includes("score-partwise"));
    assert.ok(out.xml.includes("tonus"));
  });
});

describe("score.tabula property", () => {
  const score = buildScore(makeChant(KYRIE_GABC));

  test("tabula is an array with one row per note", () => {
    assert.ok(Array.isArray(score.tabula));
    assert.equal(score.tabula.length, score.prosody.noteCount);
  });

  test("tabula rows carry pitch + rhythm + lyric data", () => {
    const row = score.tabula[0];
    assert.ok(typeof row.midi === "number");
    assert.ok(typeof row.pc === "number");
    assert.ok(typeof row.hz === "number");
    assert.ok(["arsic", "thetic"].includes(row.rhythmicShape));
    assert.equal(typeof row.lyric, "string");
  });
});
