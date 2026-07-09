import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildScore } from "../dist/engines/score/api.js";
import { inscriptio } from "../dist/engines/score/inscriptio.js";
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
});
