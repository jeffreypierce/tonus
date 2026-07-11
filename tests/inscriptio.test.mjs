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
    // The Solesmes porrectus carries a LEFT stem on the descent edge (as the
    // clivis does) — the swash alone once rendered bare.
    assert.ok((porr.match(/class="stem"/g) || []).length >= 1, "porrectus left stem");
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

  test("inscriptio(score).svg joins intra-word syllables with a centred hyphen", () => {
    // Melismatic syllables leave a gap wide enough for a floating hyphen,
    // centred in the space (Vendome practice, not a dash on the text).
    const svg = inscriptio(buildScore(makeChant("(c4) Al(gh)le(hg)lu(gh)ia.(g) (::)"))).svg;
    // Intra-word joins Al-le, le-lu, lu-ia → floating hyphens.
    assert.ok((svg.match(/>-<\/text>/g) || []).length >= 2, "floating hyphens present");
    // The syllable text carries no trailing dash.
    assert.equal((svg.match(/>[A-Za-z]+-<\/text>/g) || []).length, 0, "no appended dashes");
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

describe("inscriptio — multi-system layout", () => {
  // A long chant that must wrap at a modest width.
  const long = buildScore(makeChant(
    "(c4) Ky(g)ri(h)e(g.) (,) e(h)le(ih)i(g)son.(f.) (:) " +
    "Chri(g)ste(h) e(gh)le(hg)i(f)son.(g.) (:) " +
    "Ký(g)ri(h)e(gh) e(hg)lé(fg)i(gf)son.(g.) (::)",
  ));

  test("no width renders a single system (system 0 only)", () => {
    const { geometry } = inscriptio(long);
    assert.deepEqual([...new Set(geometry.map((g) => g.system))], [0]);
  });

  test("a width wraps into multiple systems, each x re-based near the margin", () => {
    const { svg, geometry } = inscriptio(long, { width: 250 });
    const systems = [...new Set(geometry.map((g) => g.system))].sort((a, b) => a - b);
    assert.ok(systems.length >= 2, "wrapped into 2+ systems");
    // Every system after the first re-bases x near the left margin (not the
    // running total from earlier systems).
    for (const s of systems) {
      const first = geometry.find((g) => g.system === s);
      assert.ok(first.x < 120, `system ${s} starts near the margin (x=${first.x})`);
    }
    // Four staff lines per system.
    assert.equal((svg.match(/<line/g) || []).length, 4 * systems.length);
  });

  test("systemY steps down by a constant per system, and geometry carries it", () => {
    const { geometry } = inscriptio(long, { width: 250 });
    const bySystem = new Map();
    for (const g of geometry) bySystem.set(g.system, g.systemY);
    const offsets = [...bySystem.entries()].sort((a, b) => a[0] - b[0]).map((e) => e[1]);
    assert.equal(offsets[0], 0);
    // Uniform step between consecutive systems.
    const step = offsets[1] - offsets[0];
    for (let i = 2; i < offsets.length; i++) {
      assert.ok(Math.abs(offsets[i] - offsets[i - 1] - step) < 0.01, "uniform system step");
    }
  });

  test("a custos guides the eye at each system break", () => {
    const { svg } = inscriptio(long, { width: 250 });
    const systems = [...new Set(inscriptio(long, { width: 250 }).geometry.map((g) => g.system))];
    // One custos per break — one fewer than the number of systems.
    assert.equal((svg.match(/class="custos"/g) || []).length, systems.length - 1);
  });

  test("custos: false suppresses the guides", () => {
    const { svg } = inscriptio(long, { width: 250, custos: false });
    assert.equal((svg.match(/class="custos"/g) || []).length, 0);
  });
});

describe("inscriptio — front matter", () => {
  // A chant with real meta so annotation:auto has something to derive from.
  const score = buildScore({
    id: "t", incipit: "Puer natus", gabc: "(c4) Pu(g)er(h) na(g.)tus(f.) (::)",
    office: "in", genus: "Introitus", mode: "7", modus: "Modus VII",
    pages: [], source: { book: "Graduale Romanum", year: 1961, editor: "Solesmes" },
  });

  test("title renders a centered headline and pushes the first system down", () => {
    const withTitle = inscriptio(score, { title: "Puer natus est" });
    assert.ok(/class="title"[^>]*>Puer natus est</.test(withTitle.svg));
    // Centered over the score, as the books open a piece.
    assert.ok(/class="title"[^>]*text-anchor="middle"/.test(withTitle.svg));
    // The header band offsets the first note below where it sits bare.
    const bare = inscriptio(score);
    assert.ok(withTitle.geometry[0].y > bare.geometry[0].y);
  });

  test("annotation:auto stacks the Solesmes genus/mode mark", () => {
    const { svg } = inscriptio(score, { annotation: "auto" });
    const lines = [...svg.matchAll(/class="rubric"[^>]*>([^<]*)</g)].map((m) => m[1]);
    assert.deepEqual(lines, ["Intr.", "7."], "abbreviated genus over mode, one line each");
    // Upright (not italic), oldstyle figures for the numeral.
    assert.ok(!/class="rubric"[^>]*font-style="italic"/.test(svg));
    assert.ok(/class="rubric"[^>]*onum/.test(svg), "oldstyle figures");
  });

  test("with a dropcap the mark centers on the cap column beside the staff", () => {
    const { svg } = inscriptio(score, { annotation: "auto", dropcap: true });
    const marks = [...svg.matchAll(/class="rubric"[^>]*/g)].map((m) => m[0]);
    assert.equal(marks.length, 2);
    for (const m of marks) assert.match(m, /text-anchor="middle"/);
  });

  test("an explicit rubric overrides the auto one", () => {
    const { svg } = inscriptio(score, { rubric: "In Nativitate Domini" });
    assert.ok(svg.includes(">In Nativitate Domini<"));
  });

  test("dropcap draws a rubricated initial from the first lyric", () => {
    const { svg } = inscriptio(score, { dropcap: true });
    assert.ok(/class="dropcap"[^>]*fill="#9E2B25"[^>]*>P</.test(svg));
  });

  test("rubricaColor sets the liturgical red", () => {
    const { svg } = inscriptio(score, { dropcap: true, rubricaColor: "#c00" });
    assert.ok(/class="dropcap"[^>]*fill="#c00"/.test(svg));
  });

  test("no front-matter options → no header band (bare score)", () => {
    const { svg } = inscriptio(score);
    assert.ok(!svg.includes('class="title"'));
    assert.ok(!svg.includes('class="rubric"'));
    assert.ok(!svg.includes('class="dropcap"'));
  });
});

describe("inscriptio — figures never merge across phrases (grouping regression)", () => {
  // Regression: syllableIndex resets per phrase; without phraseIndex in the
  // grouping key, "a(f) (;) men(gf)" merged both figures and dropped the
  // second lyric and the divisio.
  test("both lyrics and both divisios render", () => {
    const { svg } = inscriptio(buildScore(makeChant("(c4) a(f) (;) men(gf) (::)")));
    const lyrics = [...svg.matchAll(/class="lyric[^"]*"[^>]*>([^<]*)</g)].map((m) => m[1]);
    assert.deepEqual(lyrics, ["a", "men"]);
    const divisios = (svg.match(/class="divisio[^"]*"/g) ?? []).length;
    assert.equal(divisios, 2);
  });

  test("an accidental on a non-initial figure note still renders (before the figure)", () => {
    const { svg } = inscriptio(buildScore(makeChant("(c4) a(jix) (::)")));
    const accidentals = (svg.match(/class="accidental[^"]*"/g) ?? []).length;
    assert.ok(accidentals >= 1, "the flat on the upper note must not vanish");
  });
});

describe("inscriptio — the fonts option (references only, never bundled)", () => {
  const opts = {
    title: "Kyrie", annotation: "auto", dropcap: true,
    fonts: {
      dropcap: { family: "Pfeffer Simpelgotisch", weight: 700 },
      title: "Pfeffer Mediaeval",
      lyric: { family: "Pfeffer Mediaeval", scale: 1.15 },
    },
  };

  test("each role carries its face; unset roles keep the house serif", () => {
    const { svg } = inscriptio(buildScore(makeChant(KYRIE_GABC)), opts);
    assert.match(svg, /class="dropcap" [^>]*font-family="Pfeffer Simpelgotisch" font-weight="700"/);
    assert.match(svg, /class="title" [^>]*font-family="Pfeffer Mediaeval"/);
    assert.match(svg, /class="lyric" [^>]*font-family="Pfeffer Mediaeval"/);
    assert.match(svg, /class="rubric" [^>]*font-family="'Crimson Pro'/); // annotation unset → serif
  });

  test("the lyric scale factor resizes the lyric text", () => {
    const plain = inscriptio(buildScore(makeChant(KYRIE_GABC))).svg;
    const scaled = inscriptio(buildScore(makeChant(KYRIE_GABC)), opts).svg;
    const size = (svg) => parseFloat(svg.match(/class="lyric" [^>]*font-size="([\d.]+)"/)[1]);
    assert.ok(Math.abs(size(scaled) / size(plain) - 1.15) < 0.01);
  });

  test("moderna honours the lyric slot", () => {
    const { svg } = inscriptio(buildScore(makeChant(KYRIE_GABC)), {
      notation: "moderna", fonts: { lyric: { family: "Pfeffer Mediaeval", weight: 400, scale: 1.1 } },
    });
    assert.match(svg, /class="lyric" [^>]*font-family="Pfeffer Mediaeval"/);
    assert.match(svg, /class="lyric" [^>]*font-size="16.5"/);
  });

  test("no fonts option → byte-identical to before (pure fallback)", () => {
    const a = inscriptio(buildScore(makeChant(KYRIE_GABC))).svg;
    const b = inscriptio(buildScore(makeChant(KYRIE_GABC)), { fonts: {} }).svg;
    assert.equal(a, b);
  });
});

describe("inscriptio — font embedding (caller's bytes, self-contained SVG)", () => {
  const FAKE = Buffer.from("not-a-real-font").toString("base64");

  test("an embed slot writes one @font-face into the SVG's own style", () => {
    const { svg } = inscriptio(buildScore(makeChant(KYRIE_GABC)), {
      dropcap: true,
      fonts: { dropcap: { family: "Pfeffer Simpelgotisch", weight: 700, embed: { base64: FAKE } } },
    });
    assert.match(svg, /<defs><style>@font-face\{font-family:"Pfeffer Simpelgotisch";font-weight:700;src:url\(data:font\/otf;base64,/);
    assert.ok(svg.includes(FAKE));
  });

  test("the same face in two slots embeds once (dedupe by family + weight)", () => {
    const { svg } = inscriptio(buildScore(makeChant(KYRIE_GABC)), {
      title: "Kyrie", dropcap: true,
      fonts: {
        dropcap: { family: "Pfeffer Mediaeval", embed: { base64: FAKE } },
        title: { family: "Pfeffer Mediaeval", embed: { base64: FAKE } },
      },
    });
    assert.equal((svg.match(/@font-face/g) ?? []).length, 1);
  });

  test("no embed → no style block; format woff2 carries its own mime", () => {
    const plain = inscriptio(buildScore(makeChant(KYRIE_GABC)), {
      fonts: { lyric: "Pfeffer Mediaeval" },
    }).svg;
    assert.ok(!plain.includes("@font-face"));
    const woff2 = inscriptio(buildScore(makeChant(KYRIE_GABC)), {
      fonts: { lyric: { family: "X", embed: { base64: FAKE, format: "woff2" } } },
    }).svg;
    assert.match(woff2, /data:font\/woff2;base64,.*format\("woff2"\)/);
  });

  test("moderna embeds the lyric face too", () => {
    const { svg } = inscriptio(buildScore(makeChant(KYRIE_GABC)), {
      notation: "moderna",
      fonts: { lyric: { family: "Pfeffer Mediaeval", weight: 400, embed: { base64: FAKE } } },
    });
    assert.match(svg, /@font-face\{font-family:"Pfeffer Mediaeval";font-weight:400;/);
  });
});
