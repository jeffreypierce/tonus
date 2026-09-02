import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildScore } from "../dist/engines/score/api.js";
import { inscriptio } from "../dist/engines/score/inscriptio.js";
import { decideBreak } from "../dist/engines/score/emitters/breaking.js";
import { autoRubricLines } from "../dist/engines/score/emitters/svg.js";
import { OFFICIA } from "../dist/engines/chant/types.js";

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
    const svg = inscriptio(buildScore(makeChant("(c4) a(g) (::)")), { scale: 48 }).svg;
    assert.ok(svg.includes("scale(0.06400"), "glyph scale = staffSpace / (upm/4)");
    // The g punctum (position 4) sits at y = topY + 3·staffInterval = 64.
    const m = svg.match(/class="note"[^>]*translate\([\d.]+ ([\d.]+)\)/);
    assert.equal(m && m[1], "64.00", "notehead registered exactly at its pitch");
  });

  test("inscriptio(score).svg renders the clef from the score and moves it by line", () => {
    // c4 → do clef on the top line (position 7 → y 40 at staffHeight 48);
    // c3 → line 3 (position 5 → y 56). Same letters, same slots, clef moves.
    const c4 = inscriptio(buildScore(makeChant("(c4) a(g) (::)")), { scale: 48 }).svg;
    const c3 = inscriptio(buildScore(makeChant("(c3) a(g) (::)", "1")), { scale: 48 }).svg;
    const clefY = (svg) => svg.match(/class="clef"[^>]*translate\([\d.]+ ([\d.]+)\)/)?.[1];
    assert.equal(clefY(c4), "40.00");
    assert.equal(clefY(c3), "56.00");
    // An F clef renders a different glyph than a C clef.
    const f3 = inscriptio(buildScore(makeChant("(f3) a(g) (::)")), { scale: 48 }).svg;
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

// Moderna draws a gClef8vb, which TRANSPOSES: a sounding pitch is written an
// octave above where it sounds. Nothing pinned that lift, so an octave error in
// writtenY put every note off the top of the staff while 702 tests stayed green
// — the suite checked x, order and ink, never height. These pin height.
describe("inscriptio — moderna sits its notes on the staff (octave regression)", () => {
  // Staff geometry, from the moderna metrics at default scale: five lines from
  // MTOP=20 down to MTOP + 4*MSP, MSP=7.4 — so 20 (top, written F5) .. 49.6
  // (bottom, written E4).
  const TOP = 20, BOTTOM = 49.6;
  const score = buildScore(makeChant(KYRIE_GABC));
  const { geometry } = inscriptio(score, { notation: "moderna" });

  test("every notehead lands within the five lines", () => {
    for (const g of geometry) {
      assert.ok(g.y >= TOP - 0.01, `y=${g.y} is above the top line (${TOP})`);
      assert.ok(g.y <= BOTTOM + 0.01, `y=${g.y} is below the bottom line (${BOTTOM})`);
    }
  });

  test("the 8vb clef's octave lift: sounding G3 is written G4, the second line", () => {
    // The Kyrie's opening note is gabc 'g' — sounding G3. Under gClef8vb it is
    // written G4 and sits on the second line up: 2 steps, a whole space+line
    // above the bottom. Half a space is MSP/2 = 3.7, so 2 steps = 7.4.
    assert.equal(Number(geometry[0].y.toFixed(2)), Number((BOTTOM - 7.4).toFixed(2)));
  });

  test("higher pitch means smaller y, strictly, across a rising figure", () => {
    // 'g' then 'h' — a rising second must move UP the page by exactly one step.
    assert.ok(geometry[1].y < geometry[0].y, "the second note sits higher");
    assert.equal(Number((geometry[0].y - geometry[1].y).toFixed(2)), 3.7);
  });
});

// `temperamentum.transpose` moves what a chant SOUNDS, and moderna reads
// sounding pitch (`spn`) where quadrata reads staff position — so moderna is
// the species transposition can derail, in two ways at once.
describe("inscriptio — moderna under transposition", () => {
  const TOP = 20, BOTTOM = 49.6;
  // A ninth (e–m, 13 semitones) — the widest that FITS the staff, so "no note
  // off the staff" is a reachable assertion and any failure means the lift is
  // wrong rather than the chant being unfittable. Real chants are often wider:
  // 59 of 200 measured exceed the staff and legitimately need ledger lines.
  const WIDE = "(c4) Lux(e) et(g) o(i)ri(k)go(m) lu(k)cis(i) ae(g)ter(e)nae.(e.) (::)";
  const scoreAt = (t) => buildScore(makeChant(WIDE), { temperamentum: { transpose: t } });
  const at = (t) => inscriptio(scoreAt(t), { notation: "moderna", width: 900 });
  const signs = (svg) => (svg.match(/class="accidental"/g) ?? []).length;

  test("quadrata is untouched by transposition, moderna is not", () => {
    // The contrast is the reason this suite exists: quadrata draws from
    // staffLetter/clef, which transposition does not move.
    const q = (t) => inscriptio(scoreAt(t), { width: 900 }).geometry.map((g) => g.y);
    assert.deepEqual(q(0), q(5), "quadrata: identical geometry");
    assert.notDeepEqual(at(0).geometry.map((g) => g.y), at(5).geometry.map((g) => g.y),
      "moderna: geometry follows the sounding pitch");
  });

  test("a transposed chromatic draws its accidental, every time", () => {
    // Without this the page lies: writtenY put Ab3 and A3 on ONE slot and drew
    // nothing, so the note read a semitone off with no sign to say so.
    for (const t of [1, 2, 4, -2, -4]) {
      const score = scoreAt(t);
      const chromatic = score.tabula.filter((r) => r.spn && /^[A-G][#b]/.test(r.spn)).length;
      assert.ok(chromatic > 0, `transpose ${t} should produce chromatics`);
      assert.equal(signs(at(t).svg), chromatic, `transpose ${t}: one sign per chromatic`);
    }
  });

  test("the spelling follows spn — sharps stay sharps", () => {
    // +1 yields both flats (Ab3) and sharps (C#4); the renderer draws what the
    // pitch data says rather than respelling everything as the gamut's b molle.
    const score = scoreAt(1);
    const spns = new Set(score.tabula.filter((r) => r.spn).map((r) => r.spn));
    assert.ok([...spns].some((p) => p.includes("#")), "the fixture has sharps");
    assert.ok([...spns].some((p) => p.includes("b")), "and flats");
    const svg = at(1).svg;
    assert.ok(svg.includes("E262") || /accidental/.test(svg), "sharps are drawn");
  });

  test("an untransposed chant draws no accidental it was not given", () => {
    // The guard against over-eager spelling: Puer natus has no written flat.
    assert.equal(signs(at(0).svg), 0);
  });

  test("the octave lift never leaves the chant worse than unlifted", () => {
    // One clef throughout; what floats is the written octave. Downward is the
    // direction that hurt — chant already sounds below this staff — and at -4
    // an unlifted corpus put 43.6% of all notes under the bottom line.
    //
    // The promise is "no worse", not "always zero". The lift moves by WHOLE
    // octaves, so a chant whose ambitus straddles the staff's window cannot be
    // aligned by any multiple of 12 — this fixture at -4 sounds 48–61 against
    // a window of 52–65, and neither 0 nor +1 clears it. That is the accepted
    // cost of keeping one clef; it minimises ledger lines rather than
    // promising none.
    const offAt = (t) => at(t).geometry
      .filter((g) => g.y < g.systemY + TOP || g.y > g.systemY + BOTTOM).length;
    for (const t of [-4, -2, 0, 2]) {
      assert.ok(offAt(t) <= at(0).geometry.length,
        `transpose ${t}: ${offAt(t)} off-staff is not a sane count`);
    }
    // Untransposed, this fixture is exactly staff-width and must sit clean.
    assert.equal(offAt(0), 0, "the fitting case fits");
  });

  test("the lift is whole octaves, applied to the whole chant at once", () => {
    // A partial lift would respell the music; a per-phrase one would make a
    // single page read in two registers. Transposing by an exact octave is the
    // clean probe: the SOUNDING pitch moves by 12 but the written shape must
    // not change at all, because the lift absorbs it — same slots, same gaps.
    const ys = (t) => at(t).geometry.map((g) => Number((g.y - g.systemY).toFixed(2)));
    assert.deepEqual(ys(12), ys(0), "an octave up is absorbed by the lift");
    assert.deepEqual(ys(-12), ys(0), "and an octave down");
  });
});

// The lift makes ledger lines rarer; it cannot make them unnecessary. 59 of 200
// measured corpus chants are WIDER than the staff's ninth, so they need ledgers
// under any clef. Moderna had none at all — an off-staff note rendered as a
// notehead floating in blank space, with nothing to say which pitch it was.
describe("inscriptio — moderna ledger lines", () => {
  // Staff steps: 0 is the bottom line, 8 the top, and the LINES are the even
  // positions. Recovering steps from y is what lets these tests state the rule
  // rather than assert pixel values.
  const stepsOf = (g) => Math.round((20 + 29.6 - (g.y - g.systemY)) / 3.7);
  const owed = (s) => (s > 8 ? Math.floor((s - 8) / 2) : s < 0 ? Math.floor(-s / 2) : 0);
  const drawn = (svg) => (svg.match(/class="ledger"/g) ?? []).length;
  const render = (gabc, t = 0) => inscriptio(
    buildScore(makeChant(gabc), { temperamentum: { transpose: t } }),
    { notation: "moderna", width: 600 },
  );

  test("one ledger per line the note has passed, below the staff", () => {
    // a–m walks well under the staff: steps -4 and -2 owe 2 and 1.
    const r = render("(c4) a(a)b(c)c(e)d(g)e(i)f(k)g(m) (::)");
    const expected = r.geometry.reduce((n, g) => n + owed(stepsOf(g)), 0);
    assert.equal(expected, 3, "the fixture reaches two lines below");
    assert.equal(drawn(r.svg), expected);
  });

  test("and above it, sharing one line between a line-note and the space over it", () => {
    // Transposed up, the top notes reach steps 10 and 11 — the first LINE above
    // and the space above that. Both sit on one ledger, not two.
    const r = render("(c4) a(d)b(f)c(h)d(j)e(l)f(m) (::)", 5);
    const steps = r.geometry.map(stepsOf);
    assert.ok(steps.includes(10) && steps.includes(11), "the fixture reaches 10 and 11");
    assert.equal(drawn(r.svg), 2, "one ledger each, not one per step");
  });

  test("a note just outside the staff gets none — that is a space, not a line", () => {
    // Steps 9 and -1 are the spaces immediately outside; engraving leaves them
    // bare. Counting "off-staff notes" would wrongly demand a ledger here.
    for (const [gabc, t] of [["(c4) a(m) (::)", 3], ["(c4) a(a) (::)", 0]]) {
      const r = render(gabc, t);
      const s = stepsOf(r.geometry[0]);
      if (s === 9 || s === -1) assert.equal(drawn(r.svg), 0, `step ${s} draws nothing`);
    }
  });

  test("a chant that fits draws no ledger at all", () => {
    assert.equal(drawn(render(KYRIE_GABC).svg), 0);
  });

  test("ledgers lie behind the noteheads, as staff not as ink over the note", () => {
    // The wide fixture — a narrow one gets lifted onto the staff and draws none.
    const svg = render("(c4) a(a)b(c)c(e)d(g)e(i)f(k)g(m) (::)").svg;
    const firstLedger = svg.indexOf('class="ledger"');
    const firstNote = svg.indexOf('class="note"');
    assert.ok(firstLedger >= 0 && firstNote >= 0, "both present");
    assert.ok(firstLedger < firstNote, "ledger is emitted before the notehead");
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

  test("custos guides appear whenever systems wrap", () => {
    // No longer an option: a custos is how a chant book ends a line that
    // continues, so it is standard behaviour rather than a choice. It appears
    // when there is a next system to point at, and not otherwise.
    const wrapped = inscriptio(long, { width: 250 }).svg;
    assert.ok((wrapped.match(/class="custos"/g) || []).length > 0);

    const single = inscriptio(long).svg;   // no width → one system, nothing follows
    assert.equal((single.match(/class="custos"/g) || []).length, 0);
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

  // CENTRED OVER THE INITIAL, on that letter's own width — so the stack names
  // the chant the cap opens rather than sitting at the margin beside it. It
  // was briefly left-aligned while the initial was Jacquard, whose flourishes
  // climb into the numeral's band; Junicode's capitals do not.
  test("with a dropcap the mark centres over the initial", () => {
    const { svg } = inscriptio(score, { annotation: "auto", dropcap: true });
    const marks = [...svg.matchAll(/class="rubric"[^>]*/g)].map((m) => m[0]);
    assert.equal(marks.length, 2);
    for (const m of marks) assert.match(m, /text-anchor="middle"/);

    // PAST the initial's left edge, and inside its width: centred on the
    // letter, not parked at the margin the letter starts from.
    const capX = Number(/class="dropcap" x="([\d.]+)"/.exec(svg)[1]);
    const capSize = Number(/class="dropcap"[^>]*font-size="([\d.]+)"/.exec(svg)[1]);
    for (const m of marks) {
      const x = Number(/x="([\d.]+)"/.exec(m)[1]);
      assert.ok(x > capX, `mark at ${x} should sit past the cap's left edge ${capX}`);
      assert.ok(x < capX + capSize, `mark at ${x} should sit within the cap's width`);
    }
  });

  test("an explicit rubric overrides the auto one", () => {
    const { svg } = inscriptio(score, { rubric: "In Nativitate Domini" });
    assert.ok(svg.includes(">In Nativitate Domini<"));
  });

  test("dropcap draws the initial from the first lyric, in the note ink", () => {
    const { svg } = inscriptio(score, { dropcap: true });
    // BLACK, not rubricated. The books set the initial in black and spend
    // their red on the genus/mode mark beside it.
    assert.ok(/class="dropcap"[^>]*fill="var\(--tonus-note, #111\)"[^>]*>P</.test(svg));
  });

  test("theme.colors.rubrica sets the liturgical red, and CSS can still win", () => {
    // Probed on a LYRIC RUBRIC RUN — GABC's `<c>` — which is what the reserved
    // colour now marks. (It probed the dropcap, then the genus/mode mark; both
    // have since gone black, following the printed books.)
    const rubricated = buildScore(makeChant("(c4) <c>Ky</c>(g)ri(h)e(g.) (::)"));
    const { svg } = inscriptio(rubricated, { theme: { colors: { rubrica: "#c00" } } });
    // The theme value becomes the custom property's FALLBACK, so the file
    // carries the ink it was drawn with while a host stylesheet setting
    // --tonus-rubrica still overrides it. An inline literal could not be
    // overridden at all — an inline fill beats any stylesheet rule.
    assert.ok(/fill="var\(--tonus-rubrica, #c00\)"/.test(svg));
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

  test("an accidental mid-figure renders before the note it precedes", () => {
    // `jxi` — the marker sits between two sung notes, which is how the corpus
    // writes it (zero of the Graduale's 1337 markers end a group with nothing
    // following). The sign is drawn at the note after it; the marker itself
    // sounds nothing.
    const score = buildScore(makeChant("(c4) a(jxjh) (::)"));
    assert.equal(score.tabula.length, 2, "two sung notes — the marker is not one");
    const { svg } = inscriptio(score);
    assert.ok(
      (svg.match(/class="accidental[^"]*"/g) ?? []).length >= 1,
      "the flat must not vanish with the phantom note",
    );
  });
});

describe("inscriptio — the fonts option (references only, never bundled)", () => {
  const opts = {
    title: "Kyrie", annotation: "auto", dropcap: true,
    theme: {
      fonts: {
        dropcap: { family: "Pfeffer Simpelgotisch", weight: 700 },
        title: "Pfeffer Mediaeval",
        lyric: { family: "Pfeffer Mediaeval", scale: 1.15 },
      },
    },
  };

  test("each role carries its face; unset roles keep the house serif", () => {
    const { svg } = inscriptio(buildScore(makeChant(KYRIE_GABC)), opts);
    assert.match(svg, /class="dropcap" [^>]*font-family="Pfeffer Simpelgotisch" font-weight="700"/);
    assert.match(svg, /class="title" [^>]*font-family="Pfeffer Mediaeval"/);
    assert.match(svg, /class="lyric" [^>]*font-family="Pfeffer Mediaeval"/);
    // Annotation is unset, so it keeps the house serif. Asserted on the STACK
    // rather than its first name: which face leads is a recommendation that
    // may change (Junicode leads it now), while "an unset role falls back to
    // the house stack" is the contract this line is here to hold.
    assert.match(svg, /class="rubric" [^>]*font-family="[^"]*Garamond[^"]*serif"/);
  });

  test("the lyric scale factor resizes the lyric text", () => {
    const plain = inscriptio(buildScore(makeChant(KYRIE_GABC))).svg;
    const scaled = inscriptio(buildScore(makeChant(KYRIE_GABC)), opts).svg;
    const size = (svg) => parseFloat(svg.match(/class="lyric" [^>]*font-size="([\d.]+)"/)[1]);
    assert.ok(Math.abs(size(scaled) / size(plain) - 1.15) < 0.01);
  });

  // EVERY GENUS ABBREVIATES. The margin mark is a few letters wide, and a
  // genus the table did not know printed whole — "Toni Communes." over the
  // cap, running into the staff (ruled 2026-09-02: "all need an abbrev.").
  // Held against OFFICIA, so a genus added to the vocabulary cannot reach the
  // mark unabbreviated.
  test("every OFFICIA genus has an abbreviation in the auto mark", () => {
    for (const genus of new Set(Object.values(OFFICIA))) {
      const [mark] = autoRubricLines({ genus, mode: "1" });
      assert.notEqual(mark, `${genus}.`, `${genus} prints unabbreviated`);
      // No wider than the name (a five-letter genus — Tropa, Prosa — cannot
      // lose a letter without losing its reading), and marked as a cut.
      assert.ok(mark.length <= genus.length && mark.endsWith("."),
        `${genus} → ${mark} is not a book abbreviation`);
    }
  });

  test("Toni Communes marks as Ton. comm.", () => {
    const svg = inscriptio(buildScore({ ...makeChant(KYRIE_GABC), genus: "Toni Communes" }), {
      annotation: "auto", dropcap: true, width: 640,
    }).svg;
    assert.ok(svg.includes(">Ton. comm.<"), "the mark is abbreviated");
    assert.ok(!svg.includes("Toni Communes."), "the full name does not print");
  });

  // A SCALED TITLE KEEPS ITS ROOM. The header band was reserved from the
  // NOMINAL title size while assembly drew the SCALED one, so a display hand
  // (any scale > 1) descended into the staff with its baseline still pinned
  // where the small letter's had been — the collision a Toni Communes plate
  // showed. Both sites now derive from one scaled size; this holds them
  // together at the sizes a title face actually asks for.
  test("a scaled title grows its header band instead of falling into the staff", () => {
    const titled = (scale) => inscriptio(buildScore(makeChant(KYRIE_GABC)), {
      title: "Toni Communes.", annotation: "auto", dropcap: true, width: 640,
      theme: { fonts: { title: { family: "Junicode", scale } } },
    }).svg;
    for (const scale of [1, 1.3, 1.6, 2]) {
      const svg = titled(scale);
      const m = svg.match(/class="title"[^>]*y="([\d.]+)"[^>]*font-size="([\d.]+)"/);
      const baseline = parseFloat(m[1]);
      const drawn = parseFloat(m[2]);
      // The band tracks the drawn letter: baseline and size move together.
      assert.ok(Math.abs(drawn / (baseline || 1) - 1) < 0.01,
        `scale ${scale}: baseline (${baseline}) tracks the drawn size (${drawn})`);
      // And the letter clears the staff it sits above. 0.22em is a serif's
      // descender: enough of one to catch a title sitting in the notation.
      const staffTop = Math.min(...[...svg.matchAll(/<line x1[^>]*y1="([\d.]+)"/g)]
        .slice(0, 4).map((l) => Number(l[1])));
      assert.ok(baseline + drawn * 0.22 < staffTop,
        `scale ${scale}: title descends to ${baseline + drawn * 0.22}, staff top ${staffTop}`);
    }
  });

  // THE MARGIN MARK STAYS IN ITS COLUMN. The genus/mode stack was centred on
  // the dropcap's advance without regard for its OWN width, so a wide mark ran
  // past the staff's left edge into the clef — "Offert." reached x 68 against a
  // staff starting at 60.3. Keeping the NAME short is GENUS_ABBREV's job; this
  // holds the centring that places whatever that table hands over.
  test("a wide genus mark stays inside the dropcap column", () => {
    // A serif's per-character width, case-aware: capitals run wider, and the
    // marks are capitalised, so a flat average would under-read exactly here.
    const runW = (text, size) => {
      let w = 0;
      for (const ch of text) {
        w += /[A-ZÀ-ÞŒÆ]/.test(ch) ? 0.70 : /[.,;:'’\- ]/.test(ch) ? 0.28 : 0.50;
      }
      return w * size;
    };
    // The abbreviations GENUS_ABBREV actually produces — the widths that reach
    // the margin in practice. The full names are that table's business.
    for (const mark of ["Ant.", "Hymn.", "Offert.", "Ton. comm."]) {
      const svg = inscriptio(buildScore(makeChant(KYRIE_GABC)), {
        rubric: mark, dropcap: true, width: 640,
      }).svg;
      const m = svg.match(
        /class="rubric"[^>]*?x="([\d.-]+)"[^>]*?y="[\d.-]+"[^>]*?font-size="([\d.]+)"[^>]*>([^<]*)</);
      const cx = parseFloat(m[1]);
      const size = parseFloat(m[2]);
      const half = runW(m[3], size) / 2;
      const staffX = parseFloat(svg.match(/<line x1="([\d.]+)"/)[1]);
      assert.ok(cx + half <= staffX,
        `${mark}: runs to ${cx + half}, staff starts at ${staffX}`);
      assert.ok(cx - half >= 0, `${mark}: starts at ${cx - half}, off the left edge`);
    }
  });

  test("moderna honours the lyric slot", () => {
    const { svg } = inscriptio(buildScore(makeChant(KYRIE_GABC)), {
      notation: "moderna", theme: { fonts: { lyric: { family: "Pfeffer Mediaeval", weight: 400, scale: 1.1 } } },
    });
    assert.match(svg, /class="lyric" [^>]*font-family="Pfeffer Mediaeval"/);
    assert.match(svg, /class="lyric" [^>]*font-size="16.5"/);
  });

  test("no fonts option → byte-identical to before (pure fallback)", () => {
    const a = inscriptio(buildScore(makeChant(KYRIE_GABC))).svg;
    const b = inscriptio(buildScore(makeChant(KYRIE_GABC)), { theme: { fonts: {} } }).svg;
    assert.equal(a, b);
  });
});

describe("inscriptio — font embedding (caller's bytes, self-contained SVG)", () => {
  const FAKE = Buffer.from("not-a-real-font").toString("base64");

  test("an embed slot writes one @font-face into the SVG's own style", () => {
    const { svg } = inscriptio(buildScore(makeChant(KYRIE_GABC)), {
      dropcap: true,
      theme: { fonts: { dropcap: { family: "Pfeffer Simpelgotisch", weight: 700, embed: { base64: FAKE } } } },
    });
    assert.match(svg, /<defs><style>@font-face\{font-family:"Pfeffer Simpelgotisch";font-weight:700;src:url\(data:font\/otf;base64,/);
    assert.ok(svg.includes(FAKE));
  });

  test("the same face in two slots embeds once (dedupe by family + weight)", () => {
    const { svg } = inscriptio(buildScore(makeChant(KYRIE_GABC)), {
      title: "Kyrie", dropcap: true,
      theme: {
        fonts: {
          dropcap: { family: "Pfeffer Mediaeval", embed: { base64: FAKE } },
          title: { family: "Pfeffer Mediaeval", embed: { base64: FAKE } },
        },
      },
    });
    assert.equal((svg.match(/@font-face/g) ?? []).length, 1);
  });

  test("no embed → no style block; format woff2 carries its own mime", () => {
    const plain = inscriptio(buildScore(makeChant(KYRIE_GABC)), {
      theme: { fonts: { lyric: "Pfeffer Mediaeval" } },
    }).svg;
    assert.ok(!plain.includes("@font-face"));
    const woff2 = inscriptio(buildScore(makeChant(KYRIE_GABC)), {
      theme: { fonts: { lyric: { family: "X", embed: { base64: FAKE, format: "woff2" } } } },
    }).svg;
    assert.match(woff2, /data:font\/woff2;base64,.*format\("woff2"\)/);
  });

  test("moderna embeds the lyric face too", () => {
    const { svg } = inscriptio(buildScore(makeChant(KYRIE_GABC)), {
      notation: "moderna",
      theme: { fonts: { lyric: { family: "Pfeffer Mediaeval", weight: 400, embed: { base64: FAKE } } } },
    });
    assert.match(svg, /@font-face\{font-family:"Pfeffer Mediaeval";font-weight:400;/);
  });

  // ── The engraver's own line markers ──
  //
  // `z` orders a break; `<nlba>` forbids one. Both are instructions tonus used
  // to discard at parse, which is why its automatic breaking disagreed with the
  // books even where the books had said exactly what to do.

  test("`z` forces a system break at the note it precedes", () => {
    const gabc = "(c3) a(g) b(h) (z) c(i) d(j)";
    const score = buildScore(makeChant(gabc));
    const flagged = score.tabula.findIndex((r) => r.lineBreak);
    assert.ok(flagged > 0, "the marker reaches the tabula");

    const { geometry } = inscriptio(score, { width: 900 });
    assert.notEqual(
      geometry[flagged].systemY,
      geometry[flagged - 1].systemY,
      "the flagged note opens a new system even though the line had room",
    );
  });

  // A `z` FOLLOWING NOTES is not a break. The tokenizer splits `ra(gz)ti` into
  // ["g","z"], because `z` is not in a note's suffix class, and that stray
  // token was read as the engraver's marker: 97 chants carried one, and three
  // Nocturnale responsories cut their systems a third of the way across the
  // page and left the rest of every line empty.
  test("a `z` after notes in one group is not a break", () => {
    const score = buildScore(makeChant("(c3) a(g) ra(gz) ti(h) c(i) d(j)"));
    assert.equal(
      score.tabula.filter((r) => r.lineBreak).length, 0,
      "the z rides its neume; nothing is flagged",
    );
  });

  // …but a break that CARRIES its bar and clef still breaks. `(z0::c3)` is
  // common in the corpus, and guarding on "alone in its group" killed it.
  test("`z0::c3` breaks, carrying the bar and the new clef", () => {
    const score = buildScore(makeChant("(c3) a(g) b(h) (z0::c3) c(i) d(j)"));
    assert.equal(
      score.tabula.filter((r) => r.lineBreak).length, 1,
      "the marker leads its group, so it is the engraver's break",
    );
  });

  test("`Z` and `z0` break the same way — tonus paginates nothing", () => {
    for (const marker of ["Z", "z0"]) {
      const score = buildScore(makeChant(`(c3) a(g) b(h) (${marker}) c(i)`));
      assert.ok(
        score.tabula.some((r) => r.lineBreak),
        `${marker} is read as a break`,
      );
    }
  });

  test("<nlba> keeps its group whole across a break point", () => {
    // A long lead-in, then a sealed group: without the seal the line breaks
    // inside it, since that is exactly where the width runs out.
    const lead = Array.from({ length: 14 }, (_, i) => `syl${i}(g)`).join(" ");
    const gabc = `(c3) ${lead} <nlba>Al(g)le(h)lú(i)ia(h)</nlba> fi(g)nis(h)`;
    const score = buildScore(makeChant(gabc));
    const sealed = score.tabula
      .map((r, i) => (r.keepWithPrev ? i : -1))
      .filter((i) => i >= 0);
    assert.ok(sealed.length > 0, "the seal reaches the tabula");

    for (const notation of ["quadrata", "moderna"]) {
      const { geometry } = inscriptio(score, { notation, width: 320 });
      for (const i of sealed) {
        assert.equal(
          geometry[i].systemY,
          geometry[i - 1].systemY,
          `${notation}: no break inside the sealed group at row ${i}`,
        );
      }
    }
  });

  test("a word carried to the next system keeps its hyphen", () => {
    // One long word forced to split: the books set a hyphen at the line's end
    // so the reader knows the word continues. The gap-centred rule cannot reach
    // this — the halves have a line break between them, not a gap.
    const gabc =
      "(c3) " +
      Array.from({ length: 24 }, (_, i) => `syl${i}(g)`).join("") +
      " end(h)";
    const score = buildScore(makeChant(gabc));

    for (const notation of ["quadrata", "moderna"]) {
      const { svg, geometry } = inscriptio(score, { notation, width: 400 });
      const carries = score.tabula.filter(
        (r, i) =>
          i > 0 &&
          !r.wordStart &&
          geometry[i] &&
          geometry[i - 1] &&
          geometry[i].systemY !== geometry[i - 1].systemY,
      ).length;
      if (carries === 0) continue;

      // Every system that carries a word must place a hyphen on its own
      // baseline, past the last lyric of that line.
      const byBaseline = new Map();
      for (const m of svg.matchAll(/<text class="lyric hyphen"[^>]*y="([\d.]+)"/g)) {
        byBaseline.set(m[1], (byBaseline.get(m[1]) ?? 0) + 1);
      }
      assert.ok(
        byBaseline.size > 0,
        `${notation}: a split word draws at least one hyphen`,
      );
    }
  });
});

describe("breaking: the rules both species share", () => {
  // These were written twice, once per emitter, until 2026-08-05 — which is how
  // <nlba> shipped working in quadrata and broken in moderna. Testing the
  // decision directly is only possible now that there is one of it.
  const row = (over = {}) => ({ lineBreak: false, keepWithPrev: false, ...over });

  test("`z` outranks the width test", () => {
    const v = decideBreak({
      next: row({ lineBreak: true }),
      x: 0, boundary: 1000, need: 10, lineStart: 0,
    });
    assert.equal(v.break, true);
    assert.equal(v.reason, "forced");
  });

  test("a caller that already consumed `z` is not told to break again", () => {
    // Quadrata honours `z` in its own block, because it must repeat the clef and
    // place a custos before the staff advances. Asking here too broke the same
    // system twice.
    const v = decideBreak({
      next: row({ lineBreak: true }),
      x: 0, boundary: 1000, need: 10, lineStart: 0, forcedHandled: true,
    });
    assert.equal(v.break, false);
  });

  test("<nlba> seals a seam that would otherwise break on width", () => {
    const v = decideBreak({
      next: row({ keepWithPrev: true }),
      x: 990, boundary: 1000, need: 50, sealedRun: 50, lineStart: 0,
    });
    assert.equal(v.break, false, "the seal holds; the break belongs before the group");
  });

  test("...but yields when the sealed run cannot fit any line", () => {
    const v = decideBreak({
      next: row({ keepWithPrev: true }),
      x: 990, boundary: 1000, need: 5000, sealedRun: 5000, lineStart: 0,
    });
    assert.equal(v.break, true, "staying on the page outranks the editor's preference");
  });

  test("a cursor already past the boundary breaks on its own", () => {
    // A single figure wider than a whole line can never be rescued by breaking,
    // but the line before it must still end.
    const v = decideBreak({
      next: row(), x: 1200, boundary: 1000, need: 0, lineStart: 0,
    });
    assert.equal(v.break, true);
  });
});

describe("the layout contract", () => {
  // Documented in docs/api/score.md → "Why the layout estimates". These are the
  // properties tonus trades typographic precision FOR, so they are worth a test:
  // if either breaks, the trade stops being worth making.

  test("the same score and options render byte-identically", () => {
    const gabc = "(c3) DE(g)us(h) in(i) ad(h)ju(g)tó(hi)ri(h)um(g) (::)";
    const a = inscriptio(buildScore(makeChant(gabc)), { width: 680 }).svg;
    const b = inscriptio(buildScore(makeChant(gabc)), { width: 680 }).svg;
    assert.equal(a, b, "determinism is what makes the render suite testable");
  });

  test("no font bytes and no host APIs ride in the output", () => {
    // The library bundles no fonts (license discipline) and touches no DOM, so
    // `inscriptio` runs in Node, a worker, or CI with nothing installed.
    const { svg } = inscriptio(buildScore(makeChant(KYRIE_GABC)), { width: 680 });
    assert.ok(!/data:font/.test(svg), "no font is embedded unless a caller supplies one");
    assert.ok(!/document\.|window\./.test(svg));
  });

  test("width is a request, not a promise — content wins over clipping", () => {
    // A chant that cannot fit comes back WIDER, never clipped: a canvas smaller
    // than its content would hide notes.
    //
    // It must be UNBREAKABLE content, or the test proves nothing. A long line of
    // separate syllables simply wraps and fits, so the first version of this
    // test passed against a deliberately broken width rule. One 40-note melisma
    // on a single syllable cannot wrap, and forces the canvas to 429 against a
    // request of 200.
    const melisma = "(c3) al(" + "g".repeat(40) + ")";
    const { svg, geometry } = inscriptio(buildScore(makeChant(melisma)), { width: 200 });
    const canvas = Number(/\bwidth="([\d.]+)"/.exec(svg)[1]);
    const rightmost = Math.max(...geometry.map((g) => g.x));
    assert.ok(canvas > 200, "the canvas grew past the request rather than clipping");
    assert.ok(rightmost <= canvas, "every note sits inside the canvas");
  });
});

describe("theme — faces, ink, and metrics in one object", () => {
  test("colours reach the SVG as CSS custom properties, theme value as fallback", () => {
    // An inline fill beats any stylesheet rule, so a literal `fill="#111"` made
    // the emitter's own semantic classes (note, lyric, dropcap, custos…)
    // unstylable from the host page. The var keeps the render self-describing
    // while letting a page retheme it without re-rendering.
    const { svg } = inscriptio(buildScore(makeChant(KYRIE_GABC)), {
      theme: { colors: { note: "#234", rubrica: "#801" } },
    });
    assert.match(svg, /var\(--tonus-note, #234\)/);
    assert.ok(!/var\([^)]*var\(/.test(svg), "custom properties do not nest");
  });

  test("both species honour theme.colors.note", () => {
    // moderna hardcoded #111 in seventeen places and ignored the note colour
    // outright, so a caller theming the ink saw quadrata change and moderna not.
    for (const notation of ["quadrata", "moderna"]) {
      const { svg } = inscriptio(buildScore(makeChant(KYRIE_GABC)), {
        notation,
        theme: { colors: { note: "#07c" } },
      });
      assert.match(svg, /var\(--tonus-note, #07c\)/, `${notation} honours the theme`);
    }
  });

  test("scale drives layout, which CSS could never do", () => {
    // Scale is consumed by line breaking long before a stylesheet sees the
    // output — which is why it is an option and not a CSS property.
    const small = inscriptio(buildScore(makeChant(KYRIE_GABC)), { scale: "small" }).svg;
    const large = inscriptio(buildScore(makeChant(KYRIE_GABC)), { scale: "large" }).svg;
    assert.notEqual(small, large);
  });

  test("dropcap keeps its own face, separate from the lyric", () => {
    // The printed books set a Lombardic or uncial initial against a text hand;
    // the two are not the same face and the theme must not conflate them.
    const { svg } = inscriptio(buildScore(makeChant(KYRIE_GABC)), {
      dropcap: true,
      theme: { fonts: { dropcap: "Pfeffer Simpelgotisch", lyric: "Junicode" } },
    });
    assert.match(svg, /class="dropcap"[^>]*font-family="Pfeffer Simpelgotisch"/);
    assert.match(svg, /class="lyric"[^>]*font-family="Junicode"/);
  });
});

describe("scale — the one layout decision a caller makes", () => {
  test("named scales order small < normal < large, and reflow the music", () => {
    const score = buildScore(makeChant(KYRIE_GABC));
    const systems = (scale) =>
      new Set(inscriptio(score, { width: 400, scale }).geometry.map((g) => g.systemY)).size;
    assert.ok(systems("small") <= systems("normal"));
    assert.ok(systems("normal") <= systems("large"));
  });

  test("a number is a staff height in px, for fitting a known column", () => {
    const a = inscriptio(buildScore(makeChant(KYRIE_GABC)), { scale: 48 }).svg;
    const b = inscriptio(buildScore(makeChant(KYRIE_GABC)), { scale: 30 }).svg;
    assert.notEqual(a, b);
  });

  test("an unknown scale throws with guidance (the builder contract)", () => {
    assert.throws(
      () => inscriptio(buildScore(makeChant(KYRIE_GABC)), { scale: "huge" }),
      /unknown scale "huge".*small, normal, large/s,
    );
  });

  test("the page margin does NOT scale — a bigger chant keeps its room", () => {
    // Scaling the margin with the staff gave a large chant less usable width
    // than a small one (93% of the canvas against 89%), which is backwards.
    // The margin belongs to the page, not the notation.
    const score = buildScore(makeChant(KYRIE_GABC));
    const clefX = (scale) =>
      Number(/<g class="clef"[^>]*translate\(([\d.]+)/.exec(
        inscriptio(score, { width: 900, scale }).svg,
      )[1]);
    assert.equal(clefX("small"), clefX("large"));
  });
});
