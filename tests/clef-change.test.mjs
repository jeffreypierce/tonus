import { describe, test } from "node:test";
import assert from "node:assert/strict";
import tonus from "../dist/index.js";

// Clef changes. A wrong clef moves every note after it, and nothing else would
// notice: the chant still renders.
//
// The pitch check is independent of any edition: one pitch written under
// every clef must sound as one pitch. Middle C sits on the clef's own line for
// a C clef (j under c4, h under c3, f under c2, d under c1) and a fourth above
// the line for an F clef (l under f3). The render checks run on the shelf's
// own clef changes: the Nocturnale's Toni Communes move between c4, f3 and c3
// six times, a Matins responsory moves from c3 to c2, and a Graduale chant
// from c4 to c3.
//
// (Through 0.15.0's development these ran on Hildegard's chants against the
// Cantus Database's Volpiano for the Riesencodex. Her books left the shelf
// before the release; the Volpiano check returns with them.)

const SAME_PITCH = "(c4) A(j) (c3) B(h) (c2) C(f) (c1) D(d) (f3) E(l) (::)";
const STEP_ABOVE = "(c4) A(jk) (c3) B(hi) (c2) C(fg) (c1) D(de) (f3) E(lm) (::)";

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

describe("clef changes", () => {
  test("one pitch written under every clef sounds as one pitch", () => {
    const same = fromGabc(SAME_PITCH).tabula;
    assert.deepEqual(same.map((r) => r.clef), ["c4", "c3", "c2", "c1", "f3"]);
    assert.ok(same.every((r) => r.spn === "C4"), same.map((r) => `${r.clef} ${r.spn}`).join(", "));
    // And the step above it is the step above, in every clef.
    const steps = fromGabc(STEP_ABOVE).tabula.map((r) => degree(r.spn));
    for (let k = 0; k < steps.length; k += 2) {
      assert.equal(steps[k], degree("C4"));
      assert.equal(steps[k + 1], degree("D4"));
    }
  });

  // nocturnale:ORAL2 moves between c4, f3 and c3 six times; 0915N2R3 moves
  // from c3 to c2; gregobase:1092 ("Omnes collaudant") from c4 to c3. At 520
  // the lines break, so some changes meet a system's head.
  const CASES = ["nocturnale:ORAL2", "nocturnale:0915N2R3", "gregobase:1092"];

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
