import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { parseGABC } from "../dist/engines/score/parse.js";

function notes(gabc, opts) {
  return parseGABC(gabc, opts).events.filter((e) => e.type === "note");
}

function rests(gabc) {
  return parseGABC(gabc).events.filter((e) => e.type === "rest");
}

describe("parseGABC", () => {
  // ── Empty / invalid input ──

  test("returns error for empty string", () => {
    const result = parseGABC("");
    assert.equal(result.events.length, 0);
    assert.ok(result.errors.length > 0);
  });

  test("returns error for whitespace-only input", () => {
    const result = parseGABC("   \n  ");
    assert.equal(result.events.length, 0);
    assert.ok(result.errors.length > 0);
  });

  test("returns error for notation with no parseable notes", () => {
    const result = parseGABC("(c4) ()");
    assert.ok(result.errors.some((e) => e.message.includes("No parseable")));
  });

  // ── Basic note parsing ──

  test("parses a single note", () => {
    const n = notes("(c4) A(g)");
    assert.equal(n.length, 1);
    assert.equal(n[0].lyric, "A");
  });

  test("parses multiple syllables", () => {
    const n = notes("(c4) Do(g)mi(h)nus(g)");
    assert.equal(n.length, 3);
    assert.equal(n[0].lyric, "Do");
    assert.equal(n[1].lyric, "mi");
    assert.equal(n[2].lyric, "nus");
  });

  test("parses a melisma (multiple notes on one syllable)", () => {
    const n = notes("(c4) A(ghg)");
    assert.equal(n.length, 3);
    assert.ok(n.every((e) => e.lyric === "A"));
  });

  // ── Clefs ──

  test("defaults to c3 clef", () => {
    const n1 = notes("(c3) A(g)");
    const n2 = notes("A(g)"); // no explicit clef
    assert.equal(n1[0].step, n2[0].step);
  });

  test("c4 clef shifts pitches relative to c3", () => {
    const c3 = notes("(c3) A(g)");
    const c4 = notes("(c4) A(g)");
    assert.notEqual(c3[0].step, c4[0].step);
  });

  test("f3 clef is recognized", () => {
    const n = notes("(f3) A(g)");
    assert.equal(n.length, 1);
  });

  test("cb3 clef sets b-flat key signature", () => {
    const n = notes("(cb3) A(g)"); // g = B (degree 6) in c3
    assert.equal(n[0].accidental, -1);
  });

  // ── Clef changes mid-stream ──

  test("handles clef change within notation", () => {
    const n = notes("(c4) A(g) B(c3)(g)");
    assert.equal(n.length, 2);
    assert.notEqual(n[0].step, n[1].step);
  });

  // ── Divisiones (rests) ──

  test("parses comma divisio", () => {
    const r = rests("(c4) A(g) (,) B(h)");
    assert.equal(r.length, 1);
    assert.equal(r[0].divisio, ",");
  });

  test("parses all divisio types", () => {
    const result = parseGABC("(c4) A(g) (,) B(g) (;) C(g) (:) D(g) (::)");
    const divs = result.events.filter((e) => e.type === "rest").map((e) => e.divisio);
    assert.deepEqual(divs, [",", ";", ":", "::"]);
  });

  test("divisio resets accidental state", () => {
    // Explicit flat on B, then divisio should reset it
    const n = notes("(c4) A(jx) (,) B(j)");
    assert.equal(n[0].accidental, -1);
    assert.equal(n[0].accidentalSource, "explicit");
    assert.equal(n[1].accidentalSource, "none");
  });

  // ── Accidentals ──

  test("x modifier applies flat", () => {
    const n = notes("(c4) A(jx)");
    assert.equal(n[0].accidental, -1);
    assert.equal(n[0].accidentalSource, "explicit");
  });

  test("y modifier applies natural (cancels flat)", () => {
    const n = notes("(cb4) A(jy)");
    assert.equal(n[0].accidental, 0);
    assert.equal(n[0].accidentalSource, "explicit");
  });

  test("sharp modifier applies sharp", () => {
    const n = notes("(c4) A(g#)");
    assert.equal(n[0].accidental, 1);
    assert.equal(n[0].accidentalSource, "explicit");
  });

  test("accidental state persists within a phrase", () => {
    const n = notes("(c4) A(jx)B(j)");
    assert.equal(n[0].accidental, -1);
    assert.equal(n[1].accidental, -1);
    assert.equal(n[1].accidentalSource, "state");
  });

  test("b-flat key signature from cb clef", () => {
    const n = notes("(cb4) A(i)"); // i = B (degree 6) in c4
    assert.equal(n[0].accidental, -1);
  });

  // ── Ornaments and modifiers ──

  test("episema dot marks ictus", () => {
    const n = notes("(c4) A(g.)");
    assert.equal(n[0].ictus, true);
  });

  test("mora vocis: a single dot is mora 1, a double dot is mora 2", () => {
    assert.equal(notes("(c4) A(g)")[0].mora, 0);   // no dot
    assert.equal(notes("(c4) A(g.)")[0].mora, 1);  // punctum morae
    assert.equal(notes("(c4) A(g..)")[0].mora, 2);  // double mora (major cadence)
  });

  test("the double mora lengthens the note that carries it, more than a single mora", () => {
    const dur = (gabc) => notes(gabc).at(-1).duration;
    assert.ok(dur("(c4) A(g..)") > dur("(c4) A(g.)"),
      "double mora must exceed single mora");
    // On a multi-note neume the dots belong to the last note, not the first.
    const neume = notes("(c4) A(fgf..)");
    assert.equal(neume.at(-1).mora, 2);
    assert.equal(neume[0].mora, 0);
  });

  test("quilisma flag is set by w modifier", () => {
    const n = notes("(c4) A(gw)");
    assert.ok(n.some((e) => e.quilisma === true));
  });

  test("liquescent flag is set by tilde modifier", () => {
    const n = notes("(c4) A(g~)");
    assert.ok(n.some((e) => e.liquescent === true));
  });

  test("liquescent flag is set by < modifier", () => {
    const n = notes("(c4) A(g<)");
    assert.ok(n.some((e) => e.liquescent === true));
  });

  test("liquescent flag is set by > modifier", () => {
    const n = notes("(c4) A(g>)");
    assert.ok(n.some((e) => e.liquescent === true));
  });

  test("strophicus flag is set by ss modifier", () => {
    const n = notes("(c4) A(gss)");
    assert.ok(n.some((e) => e.strophicus === true));
  });

  test("strophicus flag is set by vv modifier", () => {
    const n = notes("(c4) A(gvv)");
    assert.ok(n.some((e) => e.strophicus === true));
  });

  // ── Uppercase (light/weak) notes ──

  test("uppercase letter produces a note", () => {
    const lower = notes("(c4) A(g)");
    const upper = notes("(c4) A(G)");
    assert.equal(lower.length, 1);
    assert.equal(upper.length, 1);
    assert.equal(lower[0].step, upper[0].step);
  });

  // ── Dash prefix (weak note) ──

  test("dash prefix produces a note", () => {
    const n = notes("(c4) A(-g)");
    assert.equal(n.length, 1);
  });

  // ── Skippable tokens ──

  test("z (custos) is skipped", () => {
    const n = notes("(c4) A(gz)");
    assert.equal(n.length, 1);
  });

  test("Z (line break) is skipped", () => {
    const n = notes("(c4) A(gZ)B(h)");
    assert.equal(n.length, 2);
  });

  test("braces (above-staff text) are skipped", () => {
    const n = notes("(c4) A(g{i.})B(h)");
    assert.equal(n.length, 2);
  });

  // ── Break markers ──

  test("slash break marks ictus on corresponding note", () => {
    const n = notes("(c4) A(g/h)");
    // break at position of / should affect a note
    assert.ok(n.some((e) => e.ictus === true));
  });

  // ── Pipe separator in lyrics ──

  test("pipe in lyric text takes only the part before pipe", () => {
    const n = notes("(c4) A|B(g)");
    assert.equal(n[0].lyric, "A");
  });

  // ── Vowel accent detection ──

  test("vowel accent detection is on by default", () => {
    const accented = notes("(c4) Dó(gh)mus(g)");
    const plain = notes("(c4) Do(gh)mus(g)", { useVowelAccent: false });
    // Both parse the same notes, but weights differ due to accent
    assert.equal(accented.length, plain.length);
  });

  test("useVowelAccent can be disabled", () => {
    const result = parseGABC("(c4) Dó(g)mi(h)nus(g)", { useVowelAccent: false });
    assert.ok(result.events.filter((e) => e.type === "note").length === 3);
    assert.equal(result.errors.length, 0);
  });

  // ── Octave parameter ──

  test("oct parameter shifts all pitches", () => {
    const oct3 = notes("(c4) A(g)", { oct: 3 });
    const oct4 = notes("(c4) A(g)", { oct: 4 });
    assert.equal(oct4[0].step - oct3[0].step, 12);
  });

  // ── Complex real-world GABC ──

  test("parses Kyrie with melismas and divisiones", () => {
    const gabc = "(c4) Ky(g)ri(h)e(g.) (,) e(h)le(ih)i(g)son.(f.) (::)";
    const result = parseGABC(gabc);
    const n = result.events.filter((e) => e.type === "note");
    const r = result.events.filter((e) => e.type === "rest");
    assert.ok(n.length >= 7);
    assert.equal(r.length, 2); // comma + double bar
    assert.equal(result.errors.length, 0);
  });

  test("parses Graduale with mixed ornaments", () => {
    const gabc = "(c4) Hæc(g) di(h.)es,(g) (;) quam(h) fe(jx)cit(ih) Do(g.)mi(f)nus.(g.) (::)";
    const result = parseGABC(gabc);
    assert.equal(result.errors.length, 0);
    const n = result.events.filter((e) => e.type === "note");
    assert.ok(n.length >= 9);
    // Check the flat is applied
    const flatNote = n.find((e) => e.accidentalSource === "explicit" && e.accidental === -1);
    assert.ok(flatNote);
  });

  test("parses notation with all letter range a through m", () => {
    const gabc = "(c4) A(a)B(b)C(c)D(d)E(e)F(f)G(g)H(h)I(i)J(j)K(k)L(l)M(m)";
    const n = notes(gabc);
    assert.equal(n.length, 13);
    // Steps should be monotonically increasing
    for (let i = 1; i < n.length; i++) {
      assert.ok(n[i].step > n[i - 1].step, `step ${i} should be higher than step ${i - 1}`);
    }
  });
});
