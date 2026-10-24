import { describe, test } from "node:test";
import assert from "node:assert/strict";
import tonus from "../dist/index.js";

// Clef changes, on Hildegard's chants: 73 of the 163 change clef, some four
// times in a few lines. A wrong clef moves every note after it, and nothing
// else would notice: the chant still renders.
//
// The ground truth is independent of tonus: the Cantus Database's Volpiano
// for the Riesencodex, which writes absolute pitch with no clefs at all. The
// hildegabc edition took the Ordo's pitch from it, so tonus's pitches through
// every clef change must equal it. (Measured 2026-10-24: 81 of the 83 Ordo
// chants match note for note. The other two differ by one editorial note.)

const VOLPIANO = {
  // Cantus a00995, Riesencodex f. 479v. c4 → c3 → c2 → c1, twice inside a word.
  "ordo:024":
    "1---ef--d--c7---d--d--fe--ccd--d---g--hj-kjhgg--fe---ef--g--gfe---d---g---h--j-jjl--kjkjhgg---fe--de--e7---4",
  // Cantus a01044, Riesencodex f. 481r. c4 → c3 → c2 → c1, with B-flats.
  "ordo:072":
    "1---ede---e-eeg--ffE7---dfe---e---eda-dE--e---gfe---e--e--d--e---fed--e---ej-k---h--g--fe7---db--de--e---e-eegF---d---e---fg--f--gfedc--d---d---dh--lk--ijhgfed---f--ged--fed-e--cd---d7--dh-ij--gf---gfg--h---ddc---f--g--h--dc---fedd-e--cd---d--dh--lk--ijh---hjhgf7---ed---d--ca--cd--fedcc-d---dC--acb-ccd---fgfed--feddc--d---d---dh---lk--hij---gfdca-ccd777---fged--fedc-d---d-ddfE--c---e-eegfeda--cD-d---dh-j--g--f---gfg--h---h--k---l--hij---gfg--h---hjH7--gf---g--d-ddfdc---f---g--hij---g---h---ddc--fed--edc--d---dca-cd--fec--d---d7---dh---ggF---gh--h--h---hk--l---ijjH--gh---hhG---hj--gf---gF--gh--h---ddC7--fgh---jhgff--g--fe7---4",
};

// Volpiano's pitch letters, low to high. `c` is middle C. Upper case is the
// liquescent form of the same pitch. `i`, `w`–`z` and the digits are signs,
// not notes.
const ORDER = "89abcdefghjklmnopqrs";
const C4 = 4 * 7;
const volpianoDegrees = (v) =>
  [...v].filter((ch) => ORDER.includes(ch.toLowerCase()))
    .map((ch) => C4 + ORDER.indexOf(ch.toLowerCase()) - ORDER.indexOf("c"));
const LETTER = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
const degree = (spn) => {
  const m = /^([A-G])[#b]?(-?\d+)$/.exec(spn);
  return Number(m[2]) * 7 + LETTER[m[1]];
};

const score = (id) => tonus.notatio(tonus.cantus({ id })[0]);
const fromGabc = (gabc) => tonus.notatio(tonus.cantus({ gabc })[0]);

/** The clef glyphs a quadrata SVG draws, in drawing order. */
const clefGlyphs = (svg) =>
  [...svg.matchAll(/<g class="clef" transform="translate\(([\d.-]+) ([\d.-]+)\)/g)]
    .map((m) => ({ x: Number(m[1]), y: Number(m[2]) }));

/** Staff position of a clef's line: c1/f1 the bottom line (1) … c4/f4 the top (7). */
const clefPosition = (clef) => 2 * Number(clef[clef.length - 1]) - 1;

/** One system's staff: y as a function of staff position, read off its notes. */
function staffOf(rows, geometry, system) {
  const pts = rows.map((r, i) => [r.staffPosition, geometry[i]])
    .filter(([, g]) => g.system === system);
  const [p1, g1] = pts[0];
  const other = pts.find(([p]) => p !== p1);
  const slope = other ? (other[1].y - g1.y) / (other[0] - p1) : 0;
  return (pos) => g1.y + slope * (pos - p1);
}

describe("clef changes — Hildegard's chants", () => {
  test("the pitch after every change is the manuscript's (Cantus Volpiano)", () => {
    for (const [id, volpiano] of Object.entries(VOLPIANO)) {
      const sc = score(id);
      const clefs = new Set(sc.tabula.map((r) => r.clef));
      assert.ok(clefs.size >= 4, `${id} changes clef (${[...clefs].join(" ")})`);
      assert.deepEqual(
        sc.tabula.map((r) => degree(r.spn)),
        volpianoDegrees(volpiano),
        `${id}: tonus's pitches are Cantus's, in absolute register`,
      );
    }
  });

  // ordo:024 steps a C clef down all four lines. symphonia:030 ("O vos angeli")
  // moves between an F clef and C clefs on three lines. At 520 the lines
  // break, so some changes meet a system's head.
  const CASES = ["ordo:024", "ordo:072", "symphonia:030"];

  for (const id of CASES) {
    for (const width of [900, 520]) {
      test(`quadrata: ${id} at ${width} draws every change where it falls, on its own line`, () => {
        const sc = score(id);
        const rows = sc.tabula;
        const { svg, geometry } = tonus.inscriptio(sc, { width });
        const glyphs = clefGlyphs(svg);
        const systems = new Set(geometry.map((g) => g.system)).size;
        const changes = rows.filter((r, i) => i > 0 && rows[i - 1].clef !== r.clef).length;
        assert.ok(changes > 0, "the chant changes clef");
        assert.equal(glyphs.length, systems + changes,
          "one clef at each system's head, one at each change");

        // Walk the expected clefs in order and match them to the glyphs.
        const expected = [];
        rows.forEach((r, i) => {
          const g = geometry[i];
          const head = i === 0 || geometry[i - 1].system !== g.system;
          const change = i > 0 && rows[i - 1].clef !== r.clef;
          if (change && head) {
            // Lands on a break: the new clef closes the old line.
            expected.push({ clef: r.clef, system: geometry[i - 1].system, after: geometry[i - 1].x });
          }
          if (head) expected.push({ clef: r.clef, system: g.system, head: true });
          else if (change) {
            expected.push({ clef: r.clef, system: g.system, after: geometry[i - 1].x, before: g.x });
          }
        });
        assert.equal(expected.length, glyphs.length);

        expected.forEach((e, k) => {
          const glyph = glyphs[k];
          const y = staffOf(rows, geometry, e.system)(clefPosition(e.clef));
          assert.ok(Math.abs(glyph.y - y) < 0.05,
            `clef ${k} (${e.clef}) sits on its line: y ${glyph.y} vs ${y.toFixed(2)}`);
          if (e.after != null) assert.ok(glyph.x > e.after, `clef ${k} follows the note before it`);
          if (e.before != null) assert.ok(glyph.x < e.before, `clef ${k} precedes the note after it`);
        });

        // Every custos names the next line's first note on THIS line's staff,
        // in the clef drawn just before it: the new one, when a change falls
        // on the break.
        const custodes = [...svg.matchAll(/<g class="custos" transform="translate\(([\d.-]+) ([\d.-]+)\)/g)]
          .map((m) => ({ x: Number(m[1]), y: Number(m[2]) }));
        const breaks = rows.map((_, i) => i).filter((i) => i > 0 && geometry[i].system !== geometry[i - 1].system);
        for (const c of custodes) {
          const i = breaks.find((b) => c.y >= geometry[b - 1].systemY && c.y < geometry[b].systemY);
          assert.ok(i != null, `custos at y ${c.y} closes a line`);
          const y = staffOf(rows, geometry, geometry[i - 1].system)(rows[i].staffPosition);
          assert.ok(Math.abs(c.y - y) < 0.05,
            `custos before row ${i} (${rows[i].clef}) names its note: y ${c.y} vs ${y.toFixed(2)}`);
        }

        // The staff letter places a quadrata note whatever the clef. So within
        // a system one letter is one height, before a change and after it.
        const heights = new Map();
        rows.forEach((r, i) => {
          const k = `${geometry[i].system}:${r.staffLetter}`;
          const y = geometry[i].y.toFixed(2);
          if (heights.has(k)) assert.equal(heights.get(k), y, `${k} keeps its height`);
          else heights.set(k, y);
        });
      });
    }

    test(`moderna: ${id} follows the sounding pitch across every change`, () => {
      const sc = score(id);
      const { geometry } = tonus.inscriptio(sc, { notation: "moderna", width: 900 });
      // Within a system, a higher pitch is drawn higher, and one pitch is one
      // height. A clef read wrong breaks this at the first note after it.
      const bySystem = new Map();
      sc.tabula.forEach((r, i) => {
        const s = geometry[i].system;
        if (!bySystem.has(s)) bySystem.set(s, new Map());
        const heights = bySystem.get(s);
        const d = degree(r.spn);
        const y = geometry[i].y.toFixed(2);
        if (heights.has(d)) assert.equal(heights.get(d), y, `degree ${d} keeps its height`);
        else heights.set(d, y);
      });
      for (const heights of bySystem.values()) {
        const ordered = [...heights.entries()].sort((a, b) => a[0] - b[0]).map(([, y]) => Number(y));
        for (let k = 1; k < ordered.length; k++) {
          assert.ok(ordered[k] < ordered[k - 1], "higher pitch, higher on the page");
        }
      }
    });
  }

  test("a change on a forced break: the new clef closes the line, the custos speaks in it", () => {
    for (const gabc of [
      "(c4) A(h) B(i) C(j) (z) (c3) D(h) E(i) (::)",
      "(c4) A(h) B(i) C(j) (z0::c3) D(h) E(i) (::)",
    ]) {
      const sc = fromGabc(gabc);
      const { svg, geometry } = tonus.inscriptio(sc, { width: 300 });
      const glyphs = clefGlyphs(svg);
      assert.equal(glyphs.length, 3, `${gabc}: c4 head, c3 at the line's end, c3 head`);
      const [, endClef, nextHead] = glyphs;
      assert.ok(endClef.x > geometry[2].x && endClef.y < geometry[3].systemY,
        "the new clef is drawn on the old line, after its last note");
      assert.ok(nextHead.y > geometry[3].systemY, "and heads the next line");

      const custos = /<g class="custos" transform="translate\(([\d.]+) ([\d.]+)\)/.exec(svg);
      assert.ok(custos, "a custos at the break");
      // The custos names the next note in the clef just drawn: D(h) under c3
      // sits on the c3 line, so custos and clef share a height.
      assert.ok(Number(custos[1]) > endClef.x, "after the new clef");
      assert.ok(Math.abs(Number(custos[2]) - endClef.y) < 0.05, "on the new clef's line, as D(h) is");
    }
  });
});
