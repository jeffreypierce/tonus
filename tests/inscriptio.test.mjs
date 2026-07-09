import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildScore } from "../dist/engines/score/api.js";
import { inscriptio } from "../dist/engines/score/inscriptio.js";

const KYRIE_GABC = "(c4) Ky(g)ri(h)e(g.) (,) e(h)le(ih)i(g)son.(f.) (::)";

function makeChant(gabc, mode = "1") {
  return {
    id: "test:1", incipit: "Test", gabc, office: "or", genus: "Ordinarium",
    mode, modus: "Modus I", pages: [], source: { book: "Test", year: null, editor: null },
  };
}

describe("inscriptio — square-note SVG (single-system)", () => {
  const score = buildScore(makeChant(KYRIE_GABC));

  test("inscriptio(score).svg renders a self-contained staff with notes and lyrics", () => {
    const svg = inscriptio(score).svg;
    assert.ok(svg.startsWith("<svg"), "is an svg document");
    assert.ok(svg.includes("</svg>"));
    // 4-line Gregorian staff (no ledger lines in this chant).
    assert.equal((svg.match(/<line /g) || []).length, 4, "four staff lines");
    // A clef and one note glyph per row (no porrectus swash in this chant).
    assert.ok(svg.includes('class="clef"'));
    const noteGlyphs = (svg.match(/class="note/g) || []).length;
    assert.equal(noteGlyphs, score.tabula.length, "one note glyph per row");
    // Self-contained: notation is inline <path>, no external font reference.
    assert.ok(svg.includes("<path"), "glyphs are inline paths");
    assert.ok(!svg.includes("@font-face") && !svg.includes(".otf"));
    // Lyrics present as text.
    assert.ok(svg.includes('class="lyric"'));
  });

  test("inscriptio(score).svg sizes glyphs to the SMuFL standard (staff space = upm/4)", () => {
    // staffHeight 48 → staffInterval 8 → staff space 16 px → scale 16/250.
    const svg = inscriptio(buildScore(makeChant("(c4) a(g) (::)")), { staffHeight: 48 }).svg;
    assert.ok(svg.includes("scale(0.06400"), "glyph scale = staffSpace / (upm/4)");
    // The g punctum (position 4) sits at y = topY + 3·staffInterval = 64.
    const m = svg.match(/class="note"[^>]*translate\([\d.]+ ([\d.]+)\)/);
    assert.equal(m && m[1], "64.00", "notehead registered exactly at its pitch");
  });

  test("inscriptio(score).svg renders the clef from the score and moves it by line", () => {
    // c4 → do clef on the top line (position 7 → y 40 at staffHeight 48);
    // c3 → line 3 (position 5 → y 56). Same letters, same slots, clef moves.
    const c4 = inscriptio(buildScore(makeChant("(c4) a(g) (::)")), { staffHeight: 48 }).svg;
    const c3 = inscriptio(buildScore(makeChant("(c3) a(g) (::)", "1")), { staffHeight: 48 }).svg;
    const clefY = (svg) => svg.match(/class="clef"[^>]*translate\([\d.]+ ([\d.]+)\)/)?.[1];
    assert.equal(clefY(c4), "40.00");
    assert.equal(clefY(c3), "56.00");
    // An F clef renders a different glyph than a C clef.
    const f3 = inscriptio(buildScore(makeChant("(f3) a(g) (::)")), { staffHeight: 48 }).svg;
    const clefGlyph = (svg) => svg.match(/class="clef".*?<path d="([^"]{0,40})/)?.[1];
    assert.ok(clefGlyph(f3) && clefGlyph(c3), "clef glyph paths found");
    assert.notEqual(clefGlyph(f3), clefGlyph(c3), "F clef uses its own glyph");
  });

  test("inscriptio(score).svg stacks the pes and stems wide intervals", () => {
    // gh: pes of a second — two podatus components sharing a column, no stem.
    const second = inscriptio(buildScore(makeChant("(c4) a(gh) (::)"))).svg;
    assert.equal((second.match(/class="stem"/g) || []).length, 0);
    // gj: pes of a fourth — stacked plus a connecting stem.
    const fourth = inscriptio(buildScore(makeChant("(c4) a(gj) (::)"))).svg;
    assert.equal((fourth.match(/class="stem"/g) || []).length, 1);
    // The two pes notes overlap horizontally (stacked, not side by side).
    const xs = [...fourth.matchAll(/class="note"[^>]*translate\(([\d.]+)/g)].map((m) => Number(m[1]));
    assert.ok(xs.length === 2 && Math.abs(xs[1] - xs[0]) < 12, "pes notes share a column");
  });

  test("inscriptio(score).svg renders a clivis as two abutting notes with a left stem", () => {
    const svg = inscriptio(buildScore(makeChant("(c4) a(hg) (::)"))).svg;
    assert.equal((svg.match(/class="note"/g) || []).length, 2, "two distinct noteheads");
    assert.equal((svg.match(/class="stem"/g) || []).length, 1, "one left stem");
  });

  test("inscriptio(score).svg renders a torculus with junction stems and a porrectus swash", () => {
    const torc = inscriptio(buildScore(makeChant("(c4) a(ghg) (::)"))).svg;
    assert.equal((torc.match(/class="note"/g) || []).length, 3);
    assert.equal((torc.match(/class="stem"/g) || []).length, 2, "stems at both junctions");
    const porr = inscriptio(buildScore(makeChant("(c4) a(hgh) (::)"))).svg;
    assert.equal((porr.match(/swash/g) || []).length, 1, "porrectus keeps the diagonal swash");
  });

  test("inscriptio(score).svg draws explicit accidentals and ledger lines", () => {
    // gx = explicit flat; letter a sits below the staff → ledger line at −1.
    const svg = inscriptio(buildScore(makeChant("(c4) a(gx)b(a) (::)"))).svg;
    assert.ok((svg.match(/class="accidental/g) || []).length >= 1, "flat rendered");
    assert.ok((svg.match(/class="ledger"/g) || []).length >= 1, "ledger line rendered");
  });

  test("inscriptio(score).svg renders mora, episema, and ictus signs", () => {
    const svg = inscriptio(buildScore(makeChant("(c4) a(g.)b(g_)c(g') (::)"))).svg;
    assert.equal((svg.match(/class="mora"/g) || []).length, 1);
    assert.equal((svg.match(/class="episema"/g) || []).length, 1);
    assert.equal((svg.match(/class="ictus"/g) || []).length, 1);
  });

  test("inscriptio(score).svg hyphenates syllables within a word", () => {
    // Ky- ri- e | e- ia: hyphens are appended to intra-word syllables.
    const svg = inscriptio(buildScore(makeChant("(c4) Ky(g)ri(h)e(g) e(f)ia(g) (::)"))).svg;
    assert.equal((svg.match(/-<\/text>/g) || []).length, 3);
    assert.ok(svg.includes(">Ky-<"), "hyphen rides the syllable text");
  });

  test("inscriptio(score).svg uses the quilisma glyph when a note is a quilisma", () => {
    const plain = inscriptio(buildScore(makeChant("(c4) a(fh) (::)"))).svg;
    const quil = inscriptio(buildScore(makeChant("(c4) a(fwh) (::)"))).svg;
    // The quilisma path differs from a punctum, so the two SVGs' glyph sets differ.
    assert.notEqual(plain, quil, "quilisma changes the rendered glyph");
  });
});

describe("inscriptio — the geometry contract", () => {
  const score = buildScore(makeChant(KYRIE_GABC));
  const { geometry } = inscriptio(score);

  test("one geometry entry per tabula row, in tabula order", () => {
    assert.equal(geometry.length, score.tabula.length);
    for (let i = 0; i < geometry.length; i++) {
      const g = geometry[i];
      const row = score.tabula[i];
      assert.equal(g.phraseIndex, row.phraseIndex);
      assert.equal(g.syllableIndex, row.syllableIndex);
      assert.equal(g.neumeGroup, row.neumeGroup);
      assert.equal(g.noteIndex, row.neumeIndex);
    }
  });

  test("each entry carries a notehead anchor and its system", () => {
    for (const g of geometry) {
      assert.equal(typeof g.x, "number");
      assert.equal(typeof g.y, "number");
      assert.equal(g.system, 0);   // single-system MVP
      assert.equal(g.systemY, 0);
    }
  });

  test("x is non-decreasing within a system", () => {
    for (let i = 1; i < geometry.length; i++) {
      // Notes stacked in one figure (a pes) may share an x; never decrease.
      assert.ok(geometry[i].x >= geometry[i - 1].x - 0.01, "x is non-decreasing");
    }
  });

  test("throws on a non-Score argument (builder contract)", () => {
    assert.throws(() => inscriptio(null), /expected a Score/);
    assert.throws(() => inscriptio({}), /expected a Score/);
  });

  test("throws on an unknown notation species", () => {
    assert.throws(() => inscriptio(score, { notation: "gothic" }), /unknown notation/);
  });
});
