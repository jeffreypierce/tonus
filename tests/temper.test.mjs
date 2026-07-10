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

  test("every builtin tuning ascends monotonically through the octave", () => {
    // Regression: the diatonic-steps builder folded all ratios to [1,2),
    // which placed C an octave high in the Ptolemaic presets (C4 above A4).
    const names = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"];
    const tunings = ["pythagorean", "meantone", "equal",
      "ptolemy-intense", "ptolemy-soft", "ptolemy-equable"];
    for (const tuning of tunings) {
      const t = buildTemper({ tuning });
      const hz = names.map((n) => t.nota(n).hz);
      for (let i = 1; i < hz.length; i++) {
        assert.ok(hz[i] > hz[i - 1],
          `${tuning}: ${names[i]} (${hz[i]}) <= ${names[i - 1]} (${hz[i - 1]})`);
      }
      assert.ok(Math.abs(hz[7] / hz[0] - 2) < 1e-9,
        `${tuning}: octave does not double`);
    }
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

  test("an unknown tuning name throws with guidance (the builder contract)", () => {
    // A label with no scale would otherwise resolve a silent Pythagorean under
    // a custom name — the plausible-looking answer the error contract forbids.
    // A custom NAME is legitimate when it arrives WITH a scale:
    assert.throws(() => buildTemper({ tuning: "my-custom-tuning" }), /Unknown tuning/);
    const t = buildTemper({ tuning: "my-custom-tuning", scale: ["9/8", "5/4", "4/3", "3/2", "5/3", "15/8", "2/1"] });
    assert.equal(t.tuning, "my-custom-tuning");
  });
});

describe("ptolemaic tunings", () => {
  // The diatonic-genus presets tune ONE fixed natural gamut (C D E F G A B);
  // a mode is an octave species of it (Option A — see docs/tuning.md). So the
  // genus ratios are measured against C (pc 0), not re-derived per mode. The
  // wolf that results (D–A is a grave fifth, not 3/2) is the true, intended
  // behaviour of syntonic just intonation, not a defect.

  test("ptolemy-intense tunes a pure major third 5/4 above the gamut's C", () => {
    const t = buildTemper({ tuning: "ptolemy-intense", mode: 1 });
    // C=pc0, E=pc4 → the intense diatonic's defining pure third.
    const third = t.ratios[4] / t.ratios[0];
    assert.ok(Math.abs(third - 5 / 4) < 0.001, `expected 5/4, got ${third}`);
  });

  test("ptolemy-intense preserves the syntonic wolf: D–A is 40/27, not 3/2", () => {
    const t = buildTemper({ tuning: "ptolemy-intense", mode: 1 });
    // D=pc2 (9/8), A=pc9 (5/3) → 5/3 ÷ 9/8 = 40/27 ≈ 680¢, the grave fifth.
    const dToA = t.ratios[9] / t.ratios[2];
    assert.ok(Math.abs(dToA - 40 / 27) < 0.001, `expected 40/27, got ${dToA}`);
    // C–G, by contrast, is a pure fifth.
    const cToG = t.ratios[7] / t.ratios[0];
    assert.ok(Math.abs(cToG - 3 / 2) < 0.001, `C–G expected 3/2, got ${cToG}`);
  });

  test("ptolemy-intense gives each mode its own third quality (octave species)", () => {
    // Dorian's third (D–F) is minor; Lydian's (F–A) is major — both read from
    // the one fixed gamut, no per-mode re-tuning.
    const dorian = buildTemper({ tuning: "ptolemy-intense", mode: 1 });
    const dToF = 1200 * Math.log2(dorian.ratios[5] / dorian.ratios[2]);
    assert.ok(dToF < 350, `Dorian third should be minor, got ${Math.round(dToF)}¢`);

    const lydian = buildTemper({ tuning: "ptolemy-intense", mode: 5 });
    const fToA = 1200 * Math.log2(lydian.ratios[9] / lydian.ratios[5]);
    assert.ok(fToA > 350, `Lydian third should be major, got ${Math.round(fToA)}¢`);
  });

  test("ptolemy-soft uses its septimal 8/7 whole tone above the gamut's C", () => {
    const t = buildTemper({ tuning: "ptolemy-soft", mode: 1 });
    // C=pc0, D=pc2 → the soft diatonic's first step is 8/7.
    const second = t.ratios[2] / t.ratios[0];
    assert.ok(Math.abs(second - 8 / 7) < 0.001, `expected 8/7, got ${second}`);
  });

  test("ptolemy-equable uses its 12/11 neutral second above the gamut's C", () => {
    const t = buildTemper({ tuning: "ptolemy-equable", mode: 1 });
    const second = t.ratios[2] / t.ratios[0];
    assert.ok(Math.abs(second - 12 / 11) < 0.001, `expected 12/11, got ${second}`);
  });

  test("all three genera keep a pure fourth 4/3 (C–F) on the fixed gamut", () => {
    for (const name of ["ptolemy-intense", "ptolemy-soft", "ptolemy-equable"]) {
      const t = buildTemper({ tuning: name, mode: 1 });
      // C=pc0, F=pc5 → the tetrachord boundary, a pure 4/3 in every genus.
      const fourth = t.ratios[5] / t.ratios[0];
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
    // The classic syntonic difference is the THIRD ABOVE C: just 5/4 (386¢)
    // vs pythagorean 81/64 (408¢) — one comma apart. (D–F is the wrong probe:
    // both systems tune D = 9/8 and F = 4/3, so that third is 32/27 in each;
    // the old assertion only "passed" while the chain misspelled F as E♯.)
    const justE = just.ratios[4] / just.ratios[0];
    const pythE = pyth.ratios[4] / pyth.ratios[0];
    assert.ok(Math.abs(justE - pythE) > 0.01, "should differ from pythagorean");
    assert.ok(Math.abs(justE * (justE < 1 ? 2 : 1) - 5 / 4) < 1e-9, "just E is 5/4 above C");
  });

  test("ptolemy-intense gives each mode its authentic interval qualities", () => {
    // Regression guard for the octave-species fix: the genus ratios must NOT
    // be laid degree-per-mode (which would force a 5/4 major third onto every
    // final). Each mode's third/seventh come from its position in the gamut.
    const deg = (t, finalPc, pc) => {
      let c = (1200 * Math.log2(t.ratios[pc] / t.ratios[finalPc])) % 1200;
      return ((c % 1200) + 1200) % 1200;
    };
    const dorian = buildTemper({ tuning: "ptolemy-intense", mode: 1 });
    assert.ok(deg(dorian, 2, 5) < 350, "Dorian third (D–F) is minor");   // 294¢
    const phrygian = buildTemper({ tuning: "ptolemy-intense", mode: 3 });
    assert.ok(deg(phrygian, 4, 7) < 350, "Phrygian third (E–G) is minor"); // 316¢
    const mixolydian = buildTemper({ tuning: "ptolemy-intense", mode: 7 });
    assert.ok(deg(mixolydian, 7, 5) < 1050, "Mixolydian seventh (G–F) is minor"); // 996¢
    const lydian = buildTemper({ tuning: "ptolemy-intense", mode: 5 });
    assert.ok(deg(lydian, 5, 9) > 350, "Lydian third (F–A) is major");    // 386¢
  });
});

describe("intervallum", () => {
  const t = buildTemper({ mode: 1 });

  test("classifies an ascending perfect fifth", () => {
    const iv = t.intervallum("D4", "A4");
    assert.equal(iv.class, "P5");
    assert.equal(iv.direction, "up");
    assert.equal(iv.semitones, 7);
    assert.equal(iv.nomen, "Quinta");
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
    // In ptolemy-intense/mode 1 the tenor A sits a grave fifth (40/27) above
    // the D finalis, not a pure 3/2 — the syntonic wolf (see docs/tuning.md).
    const r = t.ratio("40/27");
    assert.ok(r.step !== null);
    assert.equal(r.step.role, "tenor");
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

  test("Step nomen (Guidonian compound) is string or null", () => {
    const t = buildTemper({ mode: 1 });
    const step = t.gradus("D4");
    assert.ok(step.nomen === null || typeof step.nomen === "string");
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
    assert.equal(note.rhythmicShape, undefined);
    assert.equal(note.rhythmicIndex, undefined);
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

  test("hand loci follow the canonical Guidonian spiral", () => {
    // Anchors of the spiral: Γ at the thumb tip, the finger bases (C–F index→
    // little), and the upper octave (confirmed against the design plate). If the
    // linear-fill bug ever returns, these move.
    const at = (spn) => t.gradus(spn).hand;
    assert.deepEqual(at("G2"), { finger: "thumb", region: "tip" });  // Γ Gammaut
    assert.deepEqual(at("C3"), { finger: "index", region: "base" }); // C Cefaut
    assert.deepEqual(at("F3"), { finger: "pinky", region: "base" }); // F Fefaut
    assert.deepEqual(at("G4"), { finger: "index", region: "mid" });  // g (the finalis)
    assert.deepEqual(at("E5"), { finger: "middle", region: "super" }); // ee, floats above
    // wrist/palm no longer exist anywhere in the gamut.
    for (const spn of ["G2","A2","B2","C3","D3","E3","F3","G3","A3","C4","D4","E4","F4","G4"]) {
      const f = t.gradus(spn).hand?.finger;
      assert.ok(f !== "wrist" && f !== "palm", `${spn} still on ${f}`);
    }
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
    assert.equal(mode.nomen, "Protus Authenticus");
    assert.equal(mode.final, 2);
    assert.equal(mode.tenor, 9);
  });

  test("all 8 modes have distinct names", () => {
    const t = buildTemper({ mode: 1 });
    const names = new Set();
    for (let m = 1; m <= 8; m++) {
      names.add(t.modus(m).nomen);
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

  test("tunes the finalis and tenor through the temperamentum", () => {
    const m = buildTemper({ mode: 3 }).modus(3);
    // Deuterus: final Mi = E4, tenor C4.
    assert.equal(m.finalis.pitch.spn, "E4");
    assert.equal(m.finalis.step.role, "finalis");
    assert.equal(m.reciting.pitch.spn, "C4");
    assert.equal(m.reciting.step.role, "tenor");
  });

  test("the temperament reaches the tuned mode data", () => {
    const pyth = buildTemper({ mode: 3, tuning: "pythagorean" }).modus(3);
    const equal = buildTemper({ mode: 3, tuning: "equal" }).modus(3);
    // Same note name, different tuned frequency.
    assert.equal(pyth.finalis.pitch.spn, equal.finalis.pitch.spn);
    assert.notEqual(pyth.finalis.pitch.hz, equal.finalis.pitch.hz);
  });

  test("ambitusNotes walk the mode's diatonic range", () => {
    const m = buildTemper({ mode: 3 }).modus(3);
    // Deuterus authentic: E4 up to E5, diatonic.
    const spns = m.ambitusNotes.map((n) => n.pitch.spn);
    assert.equal(spns[0], "E4");
    assert.equal(spns.at(-1), "E5");
    // Every note is in the mode's scale (a Guidonian step with a degree).
    for (const n of m.ambitusNotes) assert.ok(n.step.degree >= 1 && n.step.degree <= 7);
  });

  test("keeps the raw ModeData fields (Modus extends ModeData)", () => {
    const m = buildTemper({ mode: 1 }).modus(1);
    assert.equal(m.nomen, "Protus Authenticus");
    assert.equal(m.final, 2); // raw pc still present
    assert.ok(Array.isArray(m.cadences)); // diatonic cadence figures untouched
  });
});

describe("tonus", () => {
  test("returns psalm tone intonatio, mediatio, and terminatio as Notes", () => {
    const t = buildTemper({ mode: 1 });
    const tone = t.tonus();
    assert.equal(tone.mode, 1);
    assert.ok(tone.intonatio.length > 0);
    assert.ok(tone.mediatio.length > 0);
    assert.ok(tone.terminatio.length > 0);
    assert.ok(typeof tone.intonatio[0].hz === "number");
  });

  test("throws when mode is auto", () => {
    const t = buildTemper();
    assert.throws(() => t.tonus(), /explicit mode/);
  });
});

describe("the Pythagorean chain spelling (E♭–G♯)", () => {
  // Regression: an ascending-only chain from C once spelled F as E♯ — a wolf
  // ut–fa of 521.5¢ — and b molle as A♯, which broke the heji baseline and
  // contradicted harmonia's own pure F.
  test("ut–fa is a pure fourth (F is F, not E♯)", () => {
    const t = buildTemper({ tuning: "pythagorean" });
    const ratio = t.nota("F4").hz / t.nota("C4").hz;
    assert.ok(Math.abs(ratio - 4 / 3) < 1e-9, `C–F = ${ratio}, expected 4/3`);
  });

  test("b molle sits on the flat side of the chain", () => {
    const t = buildTemper({ tuning: "pythagorean" });
    // B♭ a pure fourth over F (chain …E♭–B♭–F–C…): offset ≈ −9.78¢ from ET.
    const bb = t.nota(70); // B♭4 as MIDI (integer stays 12-TET? no — nota resolves through the tuning)
    assert.ok(Math.abs(bb.offset - -9.78) < 0.05, `B♭ offset ${bb.offset}, expected ≈ −9.78 (flat side)`);
  });
});

describe("the ratio table contract (fold regression)", () => {
  // Regression: after the E♭–G♯ respell, the normalized table came out
  // octave-scrambled (A read 0.75, ratio() never matched a step) until the
  // build folds every pitch class into [1, 2) above the root.
  test("ratios sit in [1, 2) and cents ascend per pitch class", () => {
    const t = buildTemper({ root: 0 });
    for (const r of t.ratios) assert.ok(r >= 1 && r < 2, `ratio ${r}`);
    for (let i = 1; i < 12; i++) assert.ok(t.cents[i] > t.cents[i - 1], `cents[${i}]`);
  });

  test("ratio('3/2') lands on the tenor of mode 1", () => {
    const t = buildTemper({ mode: 1 });
    const r = t.ratio("3/2");
    assert.equal(r.step?.nomen, "Alamire");
    assert.equal(r.step?.degree, 5);
    assert.equal(r.step?.role, "tenor");
    assert.equal(t.nota("A4").ratio, 1.5);
  });
});
