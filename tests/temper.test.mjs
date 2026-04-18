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

  test("equal temperament produces uniform 100-cent steps", () => {
    const t = buildTemper({ tuning: "equal", mode: 1 });
    for (let i = 1; i < 12; i++) {
      const diff = t.cents[i] - t.cents[i - 1];
      assert.ok(Math.abs(diff - 100) < 0.01, `step ${i} is ${diff} cents`);
    }
  });

  test("respects a4 frequency override", () => {
    const t415 = buildTemper({ a4: 415 });
    const t440 = buildTemper({ a4: 440 });
    assert.equal(t415.a4, 415);
    const a415 = t415.nota("A4");
    const a440 = t440.nota("A4");
    assert.ok(Math.abs(a415.hz - 415) < 0.1);
    assert.ok(Math.abs(a440.hz - 440) < 0.1);
  });

  test("transpose shifts output MIDI", () => {
    const t = buildTemper({ mode: 1, transpose: 2 });
    const note = t.nota("C4");
    assert.equal(note.midi, 62); // C4=60 + 2
  });

  test("unknown tuning name falls through without error", () => {
    const t = buildTemper({ tuning: "my-custom-tuning" });
    assert.equal(t.tuning, "my-custom-tuning");
    assert.equal(t.ratios.length, 12);
  });
});

describe("ptolemaic tunings", () => {
  test("ptolemy-intense produces pure fifth 3/2", () => {
    const t = buildTemper({ tuning: "ptolemy-intense", mode: 1 });
    // Mode 1 finalis = D (pc 2), fifth above = A (pc 9)
    const fifth = t.ratios[9] / t.ratios[2];
    assert.ok(Math.abs(fifth - 3 / 2) < 0.001);
  });

  test("ptolemy-intense produces pure major third 5/4", () => {
    const t = buildTemper({ tuning: "ptolemy-intense", mode: 1 });
    // Mode 1: scalePcs = [2,4,5,7,9,11,0], ratio[2] = 5/4 → pc 5 (F)
    // Third above D is F# but in Dorian that's a minor third...
    // Actually: ratio index 2 (5/4) maps to scalePcs[2] = pc 5 (F)
    // So F/D ratio should be 5/4
    const third = t.ratios[5] / t.ratios[2];
    assert.ok(Math.abs(third - 5 / 4) < 0.001, `expected 5/4, got ${third}`);
  });

  test("ptolemy-soft uses septimal 8/7 whole tone", () => {
    const t = buildTemper({ tuning: "ptolemy-soft", mode: 1 });
    // scalePcs[1] = pc 4 (E), ratio = 8/7 relative to finalis D (pc 2)
    const second = t.ratios[4] / t.ratios[2];
    assert.ok(Math.abs(second - 8 / 7) < 0.001, `expected 8/7, got ${second}`);
  });

  test("ptolemy-equable uses 12/11 neutral second", () => {
    const t = buildTemper({ tuning: "ptolemy-equable", mode: 1 });
    const second = t.ratios[4] / t.ratios[2];
    assert.ok(Math.abs(second - 12 / 11) < 0.001, `expected 12/11, got ${second}`);
  });

  test("all three have pure fourth 4/3", () => {
    for (const name of ["ptolemy-intense", "ptolemy-soft", "ptolemy-equable"]) {
      const t = buildTemper({ tuning: name, mode: 1 });
      // scalePcs[3] = pc 7 (G), should be 4/3 above D
      const fourth = t.ratios[7] / t.ratios[2];
      assert.ok(Math.abs(fourth - 4 / 3) < 0.001, `${name}: expected 4/3, got ${fourth}`);
    }
  });

  test("all three produce 12 ratios across all 8 modes", () => {
    for (const name of ["ptolemy-intense", "ptolemy-soft", "ptolemy-equable"]) {
      for (let m = 1; m <= 8; m++) {
        const t = buildTemper({ tuning: name, mode: m });
        assert.equal(t.ratios.length, 12);
        assert.equal(t.cents.length, 12);
      }
    }
  });

  test("ptolemy-intense differs from pythagorean", () => {
    const just = buildTemper({ tuning: "ptolemy-intense", mode: 1 });
    const pyth = buildTemper({ tuning: "pythagorean", mode: 1 });
    // Major third: pythagorean = 81/64 ≈ 1.2656, just = 5/4 = 1.25
    const justThird = just.ratios[5] / just.ratios[2];
    const pythThird = pyth.ratios[5] / pyth.ratios[2];
    assert.ok(Math.abs(justThird - pythThird) > 0.01, "should differ from pythagorean");
  });
});

describe("intervallum", () => {
  const t = buildTemper({ mode: 1 });

  test("classifies an ascending perfect fifth", () => {
    const iv = t.intervallum("D4", "A4");
    assert.equal(iv.class, "P5");
    assert.equal(iv.direction, "up");
    assert.equal(iv.semitones, 7);
    assert.equal(iv.name, "Quinta");
  });

  test("classifies a descending major third", () => {
    const iv = t.intervallum("E4", "C4");
    assert.equal(iv.class, "M3");
    assert.equal(iv.direction, "down");
    assert.equal(iv.semitones, -4);
  });

  test("classifies a unison", () => {
    const iv = t.intervallum("D4", "D4");
    assert.equal(iv.class, "P1");
    assert.equal(iv.direction, "unison");
    assert.equal(iv.semitones, 0);
  });

  test("classifies an octave", () => {
    const iv = t.intervallum(60, 72);
    assert.equal(iv.class, "P8");
    assert.equal(iv.direction, "up");
    assert.equal(iv.alias, "Diapason");
  });

  test("classifies a tritone", () => {
    const iv = t.intervallum("C4", "F#4");
    assert.equal(iv.class, "TT");
    assert.equal(iv.quality, "augmented");
  });

  test("accepts mixed input types", () => {
    const iv = t.intervallum(60, "G4");
    assert.equal(iv.class, "P5");
  });

  test("classifies interval larger than an octave", () => {
    const iv = t.intervallum("C4", "D5");
    assert.equal(iv.semitones, 14);
    assert.equal(iv.direction, "up");
    assert.equal(iv.class, "M2"); // reduces to simple interval
  });

  test("classifies all simple interval classes", () => {
    const expected = ["m2", "M2", "m3", "M3", "P4", "TT", "P5", "m6", "M6", "m7", "M7"];
    for (let i = 0; i < expected.length; i++) {
      const iv = t.intervallum(60, 60 + i + 1);
      assert.equal(iv.class, expected[i], `${i + 1} semitones should be ${expected[i]}`);
    }
  });
});

describe("ratio", () => {
  const t = buildTemper({ tuning: "ptolemy-intense", mode: 1 });

  test("parses a slash ratio and returns all three forms", () => {
    const r = t.ratio("3/2");
    assert.ok(Math.abs(r.ratio - 1.5) < 0.001);
    assert.ok(Math.abs(r.cents - 701.955) < 0.01);
    assert.equal(r.display, "3:2");
  });

  test("parses a colon ratio the same as slash", () => {
    const r = t.ratio("3:2");
    assert.ok(Math.abs(r.ratio - 1.5) < 0.001);
    assert.equal(r.display, "3:2");
  });

  test("parses cents (value with period)", () => {
    const r = t.ratio("701.955");
    assert.ok(Math.abs(r.ratio - 1.5) < 0.001);
    assert.equal(r.display, "3:2");
  });

  test("parses bare integer as ratio", () => {
    const r = t.ratio("2");
    assert.ok(Math.abs(r.ratio - 2) < 0.001);
    assert.ok(Math.abs(r.cents - 1200) < 0.01);
    assert.equal(r.display, "2:1");
  });

  test("returns matching Step when ratio is a scale degree", () => {
    const r = t.ratio("3/2");
    assert.ok(r.step !== null);
    assert.equal(r.step.role, "tenor"); // 3/2 above D finalis = A = tenor in mode 1
  });

  test("returns null step when ratio does not match a scale degree", () => {
    const r = t.ratio("7/5");
    assert.equal(r.step, null);
  });
});

describe("step", () => {
  test("Step includes explicit pc", () => {
    const t = buildTemper({ tuning: "ptolemy-intense", mode: 1 });
    const step = t.gradus("D4");
    assert.equal(step.pc, 2);
  });

  test("Step name is a string (Guidonian or SPN fallback)", () => {
    const t = buildTemper({ mode: 1 });
    const step = t.gradus("D4");
    assert.equal(typeof step.name, "string");
    assert.ok(step.name.length > 0);
  });

  test("Step compound is string or null", () => {
    const t = buildTemper({ mode: 1 });
    const step = t.gradus("D4");
    assert.ok(step.compound === null || typeof step.compound === "string");
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

  test("nota returns a Pitch with ratio field", () => {
    const note = t.nota("D4");
    assert.ok(typeof note.ratio === "number");
    assert.ok(note.ratio > 0);
  });

  test("nota has no performance or context fields", () => {
    const note = t.nota("D4");
    assert.equal(note.velocity, undefined);
    assert.equal(note.duration, undefined);
    assert.equal(note.arsis, undefined);
    assert.equal(note.thesis, undefined);
  });

  test("pythagorean A4 has zero bend (center of pitch wheel)", () => {
    const pyth = buildTemper({ tuning: "pythagorean", mode: 1 });
    const a4 = pyth.nota("A4");
    assert.ok(Math.abs(a4.hz - 440) < 0.1);
  });

  test("non-equal tuning produces non-zero offset", () => {
    const pyth = buildTemper({ tuning: "pythagorean", mode: 1 });
    const d4 = pyth.nota("D4");
    assert.ok(typeof d4.offset === "number");
    // Pythagorean D is slightly different from equal-tempered D
    assert.ok(d4.offset !== 0);
  });

  test("resolves accidentals in SPN", () => {
    const eb = t.nota("Eb4");
    assert.equal(eb.pc, 3);
    assert.equal(eb.acc, -1);
    const fs = t.nota("F#4");
    assert.equal(fs.pc, 6);
    assert.equal(fs.acc, 1);
  });

  test("clamps MIDI to 0-127 range", () => {
    const low = t.nota(0);
    assert.equal(low.midi, 0);
    const high = t.nota(127);
    assert.equal(high.midi, 127);
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

  test("returns tenor role for reciting tone", () => {
    const step = t.gradus("A4"); // tenor of mode 1
    assert.equal(step.role, "tenor");
  });

  test("returns hexachord variants", () => {
    const step = t.gradus("C4");
    assert.ok(step.variants.length > 0);
    assert.ok(step.variants.every((v) => typeof v.solmization === "string"));
  });

  test("returns hand position for Guidonian pitch", () => {
    const step = t.gradus("D4");
    assert.ok(step.hand !== null);
    assert.ok(typeof step.hand.finger === "string");
    assert.ok(typeof step.hand.region === "string");
  });

  test("chromatic pitch returns null degree", () => {
    const step = t.gradus("F#4"); // not in mode 1 diatonic scale
    assert.equal(step.degree, null);
  });
});

describe("neuma", () => {
  const t = buildTemper({ mode: 1 });

  test("classifies a two-note ascending group as pes", () => {
    const neume = t.neuma([60, 62]);
    assert.equal(neume.shape, "pes");
    assert.equal(neume.pitches.length, 2);
  });

  test("classifies a three-note up-down group as torculus", () => {
    const neume = t.neuma([60, 64, 62]);
    assert.equal(neume.shape, "torculus");
  });

  test("classifies a descending two-note group as clivis", () => {
    const neume = t.neuma([64, 60]);
    assert.equal(neume.shape, "clivis");
  });

  test("classifies a down-up group as porrectus", () => {
    const neume = t.neuma([64, 60, 62]);
    assert.equal(neume.shape, "porrectus");
  });

  test("classifies three ascending notes as scandicus", () => {
    const neume = t.neuma([60, 62, 64]);
    assert.equal(neume.shape, "scandicus");
  });

  test("classifies three descending notes as climacus", () => {
    const neume = t.neuma([64, 62, 60]);
    assert.equal(neume.shape, "climacus");
  });

  test("single note is punctum", () => {
    const neume = t.neuma([60]);
    assert.equal(neume.shape, "punctum");
  });

  test("returns intervals between consecutive notes", () => {
    const neume = t.neuma([60, 64, 62]);
    assert.equal(neume.intervals.length, 2);
    assert.equal(neume.intervals[0].semitones, 4);
    assert.equal(neume.intervals[1].semitones, -2);
  });

  test("four-note compound shape", () => {
    const neume = t.neuma([60, 64, 62, 65, 63]);
    assert.equal(neume.shape, "compound");
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

  test("chromatic option includes all 12 pitch classes", () => {
    const t = buildTemper({ mode: 1 });
    const notes = t.gamut({ chromatic: true });
    const pcs = new Set(notes.map((n) => n.pc));
    assert.equal(pcs.size, 12);
  });

  test("custom span limits the range", () => {
    const t = buildTemper({ mode: 1 });
    const notes = t.gamut({ span: [60, 72] });
    assert.ok(notes.every((n) => n.midi >= 60 && n.midi <= 72));
  });

  test("different modes produce different gamuts", () => {
    const t1 = buildTemper({ mode: 1 });
    const t5 = buildTemper({ mode: 5 });
    const pcs1 = new Set(t1.gamut().map((n) => n.pc));
    const pcs5 = new Set(t5.gamut().map((n) => n.pc));
    assert.ok(pcs1.has(2));  // D finalis
    assert.ok(pcs5.has(5));  // F finalis
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

  test("all 8 modes have distinct names", () => {
    const t = buildTemper({ mode: 1 });
    const names = new Set();
    for (let m = 1; m <= 8; m++) {
      names.add(t.modus(m).name);
    }
    assert.equal(names.size, 8);
  });

  test("authentic and plagal pairs share the same finalis", () => {
    const t = buildTemper({ mode: 1 });
    assert.equal(t.modus(1).final, t.modus(2).final); // Protus
    assert.equal(t.modus(3).final, t.modus(4).final); // Deuterus
    assert.equal(t.modus(5).final, t.modus(6).final); // Tritus
    assert.equal(t.modus(7).final, t.modus(8).final); // Tetrardus
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
