import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildScore } from "../dist/engines/score/api.js";
import { inscriptio } from "../dist/engines/score/inscriptio.js";
import { buildTemper } from "../dist/engines/temper/api.js";
import { GLYPHS } from "../dist/data/smufl-glyphs.js";

function makeChant(gabc, mode = "7") {
  return {
    id: "t", incipit: "Test", gabc, office: "in", genus: "Introitus",
    mode, modus: "Modus VII", pages: [],
    source: { book: "Graduale Romanum", year: 1961, editor: "Solesmes" },
  };
}

// The rendered path of a glyph, to assert it appears in the output.
const pathOf = (code) => GLYPHS[code].path.slice(0, 24);

describe("inscriptio — moderna species", () => {
  const score = buildScore(makeChant("(c4) Pu(g)er(h) na(gh)tus(f.) (::)"));

  test("moderna renders a 5-line staff with the treble-8 clef", () => {
    const { svg } = inscriptio(score, { notation: "moderna" });
    assert.ok(svg.includes('class="tonus-chant moderna"'));
    // Five staff lines (not the quadrata four).
    assert.equal((svg.match(/<line x1="4"/g) || []).length, 5);
    // The gClef8vb glyph is drawn.
    assert.ok(svg.includes(pathOf("E052")), "gClef8vb present");
  });

  test("notes are round noteheads (noteheadBlack), not square puncta", () => {
    const { svg } = inscriptio(score, { notation: "moderna" });
    assert.ok(svg.includes(pathOf("E0A4")), "noteheadBlack present");
  });

  test("a multi-note figure gets one engraved slur", () => {
    // na(gh) is a two-note pes → one slur.
    const { svg } = inscriptio(score, { notation: "moderna" });
    assert.ok((svg.match(/class="slur"/g) || []).length >= 1);
  });

  test("a single mora is an augmentation dot; a double mora a half notehead", () => {
    const one = inscriptio(buildScore(makeChant("(c4) a(g.) (::)")), { notation: "moderna" }).svg;
    assert.ok(one.includes(pathOf("E1E7")), "augmentationDot for single mora");
    const two = inscriptio(buildScore(makeChant("(c4) a(g..) (::)")), { notation: "moderna" }).svg;
    assert.ok(two.includes(pathOf("E0A3")), "noteheadHalf for double mora");
  });

  test("a quilisma fuses the medRen squiggle before its head", () => {
    const { svg } = inscriptio(buildScore(makeChant("(c4) a(gwh) (::)")), { notation: "moderna" });
    assert.ok(svg.includes(pathOf("EA20")), "medRenQuilismaCMN present");
  });

  test("returns the same geometry contract as quadrata (one per note)", () => {
    const { geometry } = inscriptio(score, { notation: "moderna" });
    assert.equal(geometry.length, score.tabula.length);
    for (let i = 0; i < geometry.length; i++) {
      assert.equal(geometry[i].phraseIndex, score.tabula[i].phraseIndex);
      assert.equal(geometry[i].neumeGroup, score.tabula[i].neumeGroup);
    }
  });

  test("wraps into multiple systems when a width is set", () => {
    const long = buildScore(makeChant(
      "(c4) Ky(g)ri(h)e(g.) (:) e(h)le(ih)i(g)son.(f.) (:) " +
      "Chri(g)ste(h) e(gh)le(hg)i(f)son.(g.) (::)",
    ));
    const { geometry } = inscriptio(long, { notation: "moderna", width: 300 });
    const systems = [...new Set(geometry.map((g) => g.system))];
    assert.ok(systems.length >= 2, "wrapped");
    // Each system re-bases its x near the margin.
    for (const s of systems) {
      assert.ok(geometry.find((g) => g.system === s).x < 120);
    }
  });

  test("an unknown notation still throws (guard from inscriptio)", () => {
    assert.throws(() => inscriptio(score, { notation: "neume" }), /unknown notation/);
  });

  // ── the intonation channel (moderna carries the full channel) ──
  // A diatonic scale exercises every pitch class's tuning deviation.
  const SCALE = "(c4) c(g)d(h)e(i)f(j)g(k)a(l)b(m) (::)";
  const just = () =>
    buildScore(makeChant(SCALE), { temperamentum: buildTemper({ tuning: "ptolemy-intense" }) });

  test("an explicit accidental renders its glyph before the head", () => {
    // (gxg) flats the B (Bb) with accidentalSource "explicit".
    const flat = inscriptio(buildScore(makeChant("(c3) A(gxg)b(h) (::)")), { notation: "moderna" }).svg;
    assert.ok(flat.includes(pathOf("E260")), "the flat glyph (E260) is drawn");
    assert.ok((flat.match(/class="accidental"/g) || []).length >= 1, "tagged class=accidental");
  });

  test("HEJI comma arrows bloom under a just tuning, none under Pythagorean", () => {
    const arrows = (svg) => (svg.match(/class="accidental"/g) || []).length;
    const pyth = inscriptio(buildScore(makeChant(SCALE)), { notation: "moderna", accidentals: "heji" }).svg;
    const jst = inscriptio(just(), { notation: "moderna", accidentals: "heji" }).svg;
    assert.equal(arrows(pyth), 0, "the Pythagorean baseline blooms no arrows");
    assert.ok(arrows(jst) > 0, "just intonation raises comma arrows");
  });

  test("cents labels float in the band above the staff, not glued to heads", () => {
    const svg = inscriptio(just(), { notation: "moderna", accidentals: "cents" }).svg;
    const labels = svg.match(/<text class="cents"[^>]*>/g) || [];
    assert.ok(labels.length > 0);
    // Single system: every label sits in the two-row band above the top line
    // (topPad 12 + MTOP 20 − 10 = 22, or 12 when staggered up), regardless of
    // the note's y — the pad keeps the upper row inside the viewBox.
    for (const t of labels) {
      assert.match(t, /y="(22|12)\.00"/, `floats above the staff: ${t}`);
      assert.match(t, /text-anchor="middle"/);
    }
  });

  test("heji under meantone surfaces the engine guard as a throw", () => {
    const meantone = buildScore(makeChant(SCALE), { temperamentum: buildTemper({ tuning: "meantone" }) });
    assert.throws(() => inscriptio(meantone, { notation: "moderna", accidentals: "heji" }), /just-expressible/);
  });

  test("continuation systems clear the clef — no first-note collision", () => {
    // Narrow width forces several systems; every system's leftmost head must
    // sit past the ~30px clef zone (a regression reset x to padding+4).
    const long = makeChant("(c4) " + "Pu(g)er(h) na(gh)tus(f.) ".repeat(8) + "(::)");
    const { geometry } = inscriptio(buildScore(long), { notation: "moderna", width: 320 });
    const systems = [...new Set(geometry.map((g) => g.system))];
    assert.ok(systems.length > 1, "the narrow width forces multiple systems");
    for (const s of systems) {
      const minX = Math.min(...geometry.filter((g) => g.system === s).map((g) => g.x));
      assert.ok(minX >= 40, `system ${s} first head at x=${minX.toFixed(1)} clears the clef`);
    }
  });

  test("an accidental reserves room — its head sits right of the unflatted note", () => {
    const flatted = inscriptio(buildScore(makeChant("(c3) A(gxg)b(h) (::)")), { notation: "moderna" }).geometry;
    const plain = inscriptio(buildScore(makeChant("(c3) A(g)b(h) (::)")), { notation: "moderna" }).geometry;
    assert.ok(flatted[0].x > plain[0].x, "the accidental pushes the head right");
  });
});

test("moderna joins same-word syllables with centred hyphens (Vendôme, as quadrata)", () => {
  const kyrie = buildScore(makeChant("(c4) Ky(g)ri(h)e(g.) (,) e(h)le(ih)i(g)son.(f.) (::)", "1"));
  const { svg } = inscriptio(kyrie, { notation: "moderna" });
  const texts = [...svg.matchAll(/class="lyric[^"]*"[^>]*>([^<]*)</g)].map((m) => m[1]);
  const joined = texts.join("");
  assert.ok(joined.includes("Ky-ri-e"), `hyphens inside Kyrie: ${joined}`);
  assert.ok(!joined.includes("e-e"), "no hyphen across the word boundary");
});
