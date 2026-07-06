import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildScore } from "../dist/engines/score/api.js";

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

  test("a 4+ note salicus has its ictus on the second-to-last ascending note", () => {
    // Four ascending notes with the ictus on the penultimate (Suñol).
    const syl = buildScore(makeChant("(c4) Sa(fgh'i) (::)")).phrases[0].syllables[0];
    assert.equal(syl.neume.type, "salicus");
    // The plain 4-note ascent without that ictus is not a salicus.
    const plain = buildScore(makeChant("(c4) Sa(fghi) (::)")).phrases[0].syllables[0];
    assert.notEqual(plain.neume.type, "salicus");
  });

  test("the salicus ictus note is prolonged", () => {
    const [f, g, a] = buildScore(makeChant("(c4) Sa(fg'h) (::)")).phrases[0].syllables[0].notes;
    // The middle (ictus) note is longer than either neighbour.
    assert.ok(g.performance.duration > f.performance.duration);
    assert.ok(g.performance.duration > a.performance.duration);
    // A plain scandicus does not prolong its middle note.
    const plainG = buildScore(makeChant("(c4) Sa(fgh) (::)")).phrases[0].syllables[0].notes[1];
    assert.ok(g.performance.duration > plainG.performance.duration);
  });

  test("oriscus is flagged and taken slightly faster", () => {
    // Oriscus (o) on the middle note of a moving figure.
    const row = buildScore(makeChant("(c4) O(g ho g.) (::)")).tabula.find((r) => r.oriscus);
    assert.ok(row, "an oriscus is flagged on the tabula");
    // The oriscus note is shorter than the same note without the oriscus mark.
    const plain = buildScore(makeChant("(c4) O(g h g.) (::)")).tabula[1];
    assert.ok(row.duration < plain.duration);
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

describe("score emitters", () => {
  const score = buildScore(makeChant(KYRIE_GABC));

  test("score.midi() produces SMF bytes", () => {
    const bytes = score.midi({ tempoBpm: 120 });
    assert.ok(bytes instanceof Uint8Array);
    assert.ok(bytes.length > 0);
    assert.deepEqual([...bytes.slice(0, 4)], [0x4d, 0x54, 0x68, 0x64]); // "MThd"
  });

  test("score.midi({ format: 'both' }) returns json and bytes", () => {
    const out = score.midi({ format: "both" });
    assert.ok(out.bytes instanceof Uint8Array);
    assert.ok(out.json.tracks[0].events.length > 0);
  });

  test("score.musicxml() produces a score-partwise document", () => {
    const out = score.musicxml();
    assert.ok(typeof out.xml === "string");
    assert.ok(out.xml.includes("score-partwise"));
    assert.ok(out.xml.includes("tonus"));
  });

  const countSlurs = (xml) => ({
    start: (xml.match(/slur type="start"/g) || []).length,
    stop: (xml.match(/slur type="stop"/g) || []).length,
  });

  test("musicxml slurs each neume figure within a syllable", () => {
    // Ky(gh!gg): a pes (gh) then a second figure (gg), split by the ! marker.
    const xml = buildScore(makeChant("(c4) Ky(gh!gg)ri(h)e(g.) (::)")).musicxml().xml;
    const s = countSlurs(xml);
    assert.equal(s.start, 2, "one slur per neume figure");
    assert.equal(s.stop, 2);
  });

  test("musicxml slurs a whole multi-note neume as one figure", () => {
    // A torculus (ghg) is a single figure → exactly one slur.
    const xml = buildScore(makeChant("(c4) Ky(ghg)ri(h)e(g.) (::)")).musicxml().xml;
    assert.deepEqual(countSlurs(xml), { start: 1, stop: 1 });
  });

  test("musicxml does not slur single-note neumes", () => {
    // Every syllable is one note → no slurs at all.
    const xml = buildScore(makeChant("(c4) al(g)le(h)lu(g)ia(f.) (::)")).musicxml().xml;
    assert.deepEqual(countSlurs(xml), { start: 0, stop: 0 });
  });

  test("musicxml keeps the lyric on the syllable, not each figure", () => {
    // Ky has two figures but one lyric; ri and e one each → three <text> only.
    const xml = buildScore(makeChant("(c4) Ky(gh!gg)ri(h)e(g.) (::)")).musicxml().xml;
    assert.equal((xml.match(/<text>/g) || []).length, 3);
  });

  test("tabula exposes neumeGroup and per-figure neumeIndex", () => {
    const rows = buildScore(makeChant("(c4) Ky(gh!gg)ri(h)e(g.) (::)")).tabula;
    const syl0 = rows.filter((r) => r.syllableIndex === 0);
    assert.deepEqual(syl0.map((r) => r.neumeGroup), [0, 0, 1, 1]);
    assert.deepEqual(syl0.map((r) => r.neumeIndex), [0, 1, 0, 1]);
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
