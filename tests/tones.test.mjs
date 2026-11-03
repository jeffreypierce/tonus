import { describe, test } from "node:test";
import assert from "node:assert/strict";
import tonus from "../dist/index.js";
import { MODES, TONES } from "../dist/index.js";

// The psalm-tone table against the two things it must agree with: the modes'
// tenors, and its own differentia codes, whose letter names the last note.
const LETTER = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
const pc = (m) => ((m % 12) + 12) % 12;

describe("TONES — the Toni Communes", () => {
  test("each tone recites on its mode's tenor", () => {
    for (let n = 1; n <= 8; n++) {
      const tone = TONES.find((t) => t.mode === n);
      assert.equal(pc(tone.tenor), MODES.get(n).tenor, `tone ${n}`);
    }
  });

  test("every termination ends on the note its differentia names", () => {
    for (const tone of TONES) {
      for (const d of tone.differentiae) {
        const m = /^[1-8]([A-Ga-g])/.exec(d.code);
        if (!m) continue; // the peregrinus' "per" names no note
        // A starred ending (8G*, 4A*) closes on the named note and then
        // rises a step from it.
        const named = d.code.endsWith("*") ? d.termination.at(-2) : d.termination.at(-1);
        assert.equal(pc(named), LETTER[m[1].toLowerCase()], d.code);
        if (d.code.endsWith("*")) assert.ok(d.termination.at(-1) > named, d.code);
      }
    }
  });

  test("every pitch fits the c4 staff the psalm verses are written on", () => {
    for (const tone of TONES) {
      const all = [tone.tenor, ...tone.intonation, ...tone.flex, ...tone.mediant,
        ...tone.differentiae.flatMap((d) => [...d.termination, ...(d.mediant ?? [])])];
      for (const m of all) assert.ok(m >= 45 && m <= 65, `${tone.nomen}: ${m}`);
    }
  });

  test("the flex drops from the tenor", () => {
    for (const tone of TONES) {
      assert.equal(tone.flex[0], tone.tenor, tone.nomen);
      assert.ok(tone.flex[1] < tone.tenor, tone.nomen);
    }
  });

  test("the attested formulas read as the Liber prints them", () => {
    const t = (n, diff) => tonus.temperamentum({ mode: n }).tonus(diff ? { differentia: diff } : undefined);
    const spn = (ps) => ps.map((p) => p.spn).join(" ");
    // Dixit Dominus 1g (LU p. 128): f g-a | b♭ a g a | g f g-a g
    assert.equal(spn(t(1).intonatio), "F3 G3 A3");
    assert.equal(spn(t(1).mediatio), "Bb3 A3 G3 A3");
    assert.equal(spn(t(1, "1g").terminatio), "G3 F3 G3 A3 G3");
    // Confitebor 2D (LU p. 134): c d f | g f | e c d
    assert.equal(spn(t(2).intonatio), "C3 D3 F3");
    assert.equal(spn(t(2).terminatio), "E3 C3 D3");
    // Beatus vir 7a (LU p. 146): c-b c-d | f e d e | e d c b-a
    assert.equal(spn(t(7).intonatio), "C4 B3 C4 D4");
    assert.equal(spn(t(7).terminatio), "E4 D4 C4 B3 A3");
    // Magnificat 8 G (LU p. 212): g a c | d c | b c a g
    assert.equal(spn(t(8).terminatio), "B3 C4 A3 G3");
  });

  test("IV A sings the transposed tone, on the tenor d", () => {
    const tn = tonus.temperamentum({ mode: 4 }).tonus({ differentia: "4A" });
    assert.equal(tn.tenor.spn, "D4");
    assert.equal(tn.intonatio[0].spn, "D4");
    assert.equal(tonus.temperamentum({ mode: 4 }).tonus().tenor.spn, "A3");
  });

  test("a differentia matches without regard to case", () => {
    const T = tonus.temperamentum({ mode: 4 });
    assert.equal(T.tonus({ differentia: "4e" }).differentia, "4E");
  });

  test("an unknown differentia throws with the tone's codes", () => {
    const T = tonus.temperamentum({ mode: 1 });
    assert.throws(() => T.tonus({ differentia: "zz" }), (e) =>
      e instanceof RangeError && /1g/.test(e.message) && /1D2/.test(e.message));
    // A code of another tone is no code of this one.
    assert.throws(() => tonus.temperamentum({ mode: 2 }).tonus({ differentia: "6F" }), RangeError);
  });

  test("the tonus peregrinus keeps its two tenors", () => {
    const per = TONES.find((t) => t.mode === 0);
    assert.equal(pc(per.tenor), 9);
    assert.equal(pc(per.secondTenor), 7);
    assert.equal(pc(per.differentiae[0].termination.at(-1)), 2);
  });

  test("no tone carries a solemn mediant yet", () => {
    for (const tone of TONES) assert.equal(tone.solemnMediant, undefined, tone.nomen);
  });
});
