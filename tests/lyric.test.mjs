import { describe, test } from "node:test";
import assert from "node:assert/strict";
import tonus from "../dist/index.js";

// GABC lyric markup decodes at parse: `lyric` is clean display text
// everywhere (specials as real Unicode), styles survive as `runs`, and the
// emitters draw them as tspans. Before 0.2 the tags passed through raw —
// quadrata printed "<sp>V/</sp>De" as literal lyric text.

function chant(gabc) {
  return {
    id: "t", incipit: "Test", gabc, office: "in", genus: "Introitus",
    mode: "1", modus: "Modus I", pages: [],
    source: { book: "Graduale Romanum", year: 1961, editor: "Solesmes" },
  };
}
const lyricsOf = (score) => {
  const out = [];
  for (const p of score.phrases) for (const s of p.syllables) out.push(s.lyric);
  return out;
};

describe("lyric markup — special characters decode to Unicode", () => {
  test("℣ ℟ † and the raised star", () => {
    const score = tonus.notatio(chant(
      "(c4) <sp>V/</sp>De(g)us(h) <sp>R/</sp>me(g)us(h) <sp>+</sp>fle(g)xa(h) <sp>*</sp>stel(g)la(h.) (::)",
    ));
    const lyr = lyricsOf(score).join(" ");
    assert.ok(lyr.includes("℣"), `℣ decoded: ${lyr}`);
    assert.ok(lyr.includes("℟"), "℟ decoded");
    assert.ok(lyr.includes("†"), "<sp>+</sp> is the flex cross");
    assert.ok(lyr.includes("*"), "the star");
    assert.ok(!lyr.includes("<sp>"), "no raw tags survive");
  });

  test("ligatures: ae → æ, 'ae → ǽ, oe → œ", () => {
    const score = tonus.notatio(chant(
      "(c4) s<sp>'ae</sp>(g)cu(h)la(g) c<sp>ae</sp>(h)li(g) c<sp>oe</sp>(h)lum(g.) (::)",
    ));
    const lyr = lyricsOf(score).join(" ");
    assert.ok(lyr.includes("sǽ"), `accented ligature: ${lyr}`);
    assert.ok(lyr.includes("cæ"), "plain ligature");
    assert.ok(lyr.includes("cœ"), "oe ligature");
  });

  test("<v> verbatim TeX: \\greheightstar is the star, \\pageref vanishes", () => {
    const score = tonus.notatio(chant(
      "(c4) <v>\\greheightstar</v>Glo(g)ri(h)a(g) <v>\\pageref{M-ORIP2d}</v>Pa(h)tri(g.) (::)",
    ));
    const lyr = lyricsOf(score);
    assert.ok(lyr[0].includes("*"), `the height star: ${lyr[0]}`);
    assert.ok(!lyr.join(" ").includes("pageref"), "page cross-refs are dropped");
    assert.equal(lyr[3], "Pa", "the pageref syllable keeps only its text");
  });

  test("centering braces and layout tags leave no residue", () => {
    const score = tonus.notatio(chant(
      "(c4) <clear>al(g)le(h)lú(g){ia}(h) <nlba>non(g) con(h)</nlba>fun(g)den(h)tur(g.) (::)",
    ));
    const lyr = lyricsOf(score).join(" ");
    assert.ok(lyr.includes("ia"), "brace content kept");
    assert.ok(!/[{}<>]/.test(lyr), `no markup residue: ${lyr}`);
  });

  test("<alt> above-lines text is not lyric text", () => {
    const score = tonus.notatio(chant("(c4) <alt>Flexa</alt>De(g)us(h.) (::)"));
    assert.equal(lyricsOf(score)[0], "De");
  });
});

describe("lyric markup — styles ride as runs", () => {
  test("an italic span crossing syllables styles each of them", () => {
    const score = tonus.notatio(chant("(c4) <i>al(g)le(h)lu(g)ia(h)</i> a(g)men(h.) (::)"));
    const syls = [];
    for (const p of score.phrases) for (const s of p.syllables) syls.push(s);
    for (const s of syls.slice(0, 4)) {
      assert.ok(s.runs, `styled syllable carries runs: ${s.lyric}`);
      assert.ok(s.runs.every((r) => r.italic), `italic rides: ${s.lyric}`);
    }
    assert.equal(syls[4].runs, undefined, "the plain syllable carries none");
  });

  test("a plain chant carries no runs at all", () => {
    const score = tonus.notatio(chant("(c4) Pu(g)er(h) na(gh)tus(f.) (::)"));
    for (const p of score.phrases) for (const s of p.syllables)
      assert.equal(s.runs, undefined);
    for (const row of score.tabula) assert.equal(row.runs, undefined);
  });

  test("runs concatenate to the lyric (the covering contract)", () => {
    const score = tonus.notatio(chant("(c4) a<i>b</i>c(g)de(h.) (::)"));
    for (const p of score.phrases) for (const s of p.syllables) {
      if (s.runs) assert.equal(s.runs.map((r) => r.text).join(""), s.lyric);
    }
  });
});

describe("lyric markup — the emitters draw it", () => {
  const marked = () => tonus.notatio(chant(
    "(c4) <sp>V/</sp>Ju(f)bi(g)la(h)te(g) <i>ij.(fgh)</i> <c>Ps.(f)</c> om(g)nis(h.) (::)",
  ));

  test("quadrata: tspans for style, Unicode for specials, no tag soup", () => {
    const svg = tonus.inscriptio(marked()).svg;
    assert.ok(svg.includes("℣"), "℣ in the SVG");
    assert.ok(/<tspan font-style="italic">ij\./.test(svg), "italic tspan");
    assert.ok(/<tspan fill="#9E2B25">Ps\./.test(svg), "rubric-colored tspan");
    assert.ok(!svg.includes("&lt;sp&gt;"), "no escaped raw tags");
  });

  test("moderna: the same markup on the transcription staff", () => {
    const svg = tonus.inscriptio(marked(), { notation: "moderna" }).svg;
    assert.ok(svg.includes("℣"));
    assert.ok(/<tspan font-style="italic">ij\./.test(svg));
    assert.ok(!svg.includes("&lt;"), "no escaped raw tags");
  });

  test("Ps. renders ONE style (rubric) whether the source wrote <i>, <c>, or plain", () => {
    for (const wrap of ["Ps.(f)", "<i>Ps.(f)</i>", "<c>Ps.(f)</c>"]) {
      const svg = tonus.inscriptio(tonus.notatio(chant(`(c4) ${wrap} De(g)us(h.) (::)`))).svg;
      assert.ok(/<tspan fill="#9E2B25">Ps\.<\/tspan>/.test(svg), `rubric Ps. from ${wrap}`);
      assert.ok(!/<tspan font-style="italic">Ps\./.test(svg), `no italic carryover from ${wrap}`);
    }
  });

  test("ij. renders italic whether the source wrote <i> or plain text", () => {
    for (const wrap of ["ij.(fgh)", "<i>ij.(fgh)</i>"]) {
      const svg = tonus.inscriptio(tonus.notatio(chant(`(c4) al(g)le(h) ${wrap} (::)`))).svg;
      assert.ok(/<tspan font-style="italic">ij\.<\/tspan>/.test(svg), `italic ij. from ${wrap}`);
    }
  });

  test("℣/℟ breathe before a letter, stay tight before punctuation", () => {
    const spaced = tonus.notatio(chant("(c4) <sp>V/</sp>De(g)us(h.) (::)"));
    assert.equal(lyricsOf(spaced)[0], "℣ De");
    const tight = tonus.notatio(chant("(c4) <sp>V/</sp>.(g) Lau(h)dem(g.) (::)"));
    assert.ok(lyricsOf(tight)[0].startsWith("℣."), `tight period: ${lyricsOf(tight)[0]}`);
  });

  test("a custom rubricaColor reaches the rubric runs", () => {
    const svg = tonus.inscriptio(marked(), { rubricaColor: "#800020" }).svg;
    assert.ok(/<tspan fill="#800020">Ps\./.test(svg));
  });

  test("corpus reality: a real chant with <sp>V/</sp> and <i>ij.</i> renders clean", () => {
    // The Alleluia "Laudem Domini" pattern from the Graduale — versicle mark,
    // italic ij., euouae — the exact shapes the census found 6,431 of.
    const real = tonus.cantus({ office: "al" })
      .find((c) => c.gabc.includes("<sp>V/</sp>") && c.gabc.includes("<i>"));
    if (!real) return; // corpus slice without one — the constructed tests above cover it
    const svg = tonus.inscriptio(tonus.notatio(real)).svg;
    assert.ok(!svg.includes("&lt;sp&gt;") && !svg.includes("&lt;i&gt;"), "no tag soup");
    assert.ok(svg.includes("℣"), "the versicle mark is drawn");
  });
});
