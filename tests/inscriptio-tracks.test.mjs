import { describe, test } from "node:test";
import assert from "node:assert/strict";
import tonus from "../dist/index.js";
import { buildScore } from "../dist/engines/score/api.js";
import { inscriptio } from "../dist/engines/score/inscriptio.js";

// The analysis tracks ride inscriptio (`tracks`): chironomia under quadrata,
// tonarium under moderna — the two-register principle. Puer natus est is the
// plate series' own subject (chiron-14 / tonarium-08), so it exercises every
// stratum: classified incises (VIII), modulations, and confident cadences.
const puer = () => tonus.cantus({ incipit: "Puer natus" })[0];

describe("inscriptio — the chironomia track (quadrata)", () => {
  const score = tonus.notatio(puer());
  const plain = inscriptio(score, { width: 900 });
  const tracked = inscriptio(score, { width: 900, tracks: ["chironomia"] });

  test("draws the wave with the governing ink: one black, graded by stratum", () => {
    assert.ok(tracked.svg.includes('class="chironomia"'), "the wave group");
    // Pressure is line WEIGHT (the shared nib), not an opacity gradient.
    assert.ok(!tracked.svg.includes("linearGradient"), "no gradient ink");
    assert.ok(/class="chironomia"><path [^>]*fill="#111" fill-opacity="0\.75"/.test(tracked.svg),
      "one ink at the wave stratum");
    assert.ok(tracked.svg.includes('class="chironomia-letters"'), "the letter row");
    assert.ok(/>A<\/text>/.test(tracked.svg), "arsis letters");
    assert.ok(/>T<\/text>/.test(tracked.svg), "thesis letters");
  });

  test("reserves band room without disturbing the notation", () => {
    const h = (svg) => Number(svg.match(/height="(\d+)"/)[1]);
    assert.ok(h(tracked.svg) > h(plain.svg), "the band widens the page");
    // The geometry contract is unmoved: same notes, same x anchors, and the
    // first system's y unchanged (later systems shift by the band).
    assert.equal(tracked.geometry.length, plain.geometry.length);
    tracked.geometry.forEach((g, i) => {
      assert.equal(g.x, plain.geometry[i].x);
      if (g.system === 0) assert.equal(g.y, plain.geometry[i].y);
    });
  });
});

describe("inscriptio — the tonarium track (moderna)", () => {
  const score = tonus.notatio(puer());
  const tracked = inscriptio(score, { notation: "moderna", width: 900, tracks: ["tonarium"] });

  test("draws the four maneriae rails and the mode line with its numeral", () => {
    assert.ok(tracked.svg.includes('class="tonarium"'), "the lane group");
    // Four rails per system, D on the bottom — categories, not pitches;
    // rail ink = the governing black at the rail stratum.
    const systems = new Set(tracked.geometry.map((g) => g.system)).size;
    const rails = (tracked.svg.match(/stroke="#111" stroke-opacity="0\.16"/g) || []).length;
    assert.equal(rails, systems * 4, "all four rails, every system");
    // The home mode's numeral (VII) rides the strip in rubrica.
    assert.ok(/font-style="italic">VII</.test(tracked.svg), "the governing numeral");
  });

  test("labels each confident cadence by its lift, and keys it in the margin", () => {
    const confident = score.cadences.filter((c) => c.confidence >= 0.45 && c.signature);
    assert.ok(confident.length > 0, "the subject has confident cadences");

    // The KEY moves to the group: still the family's name and still the join
    // back to CADENTIAE, but no longer the thing the reader is handed.
    for (const cad of confident) {
      assert.ok(tracked.svg.includes(`data-cadentia="${cad.signature}"`),
        `signature "${cad.signature}" keys its group`);
      assert.ok(!tracked.svg.includes(`>${cad.signature}</text>`),
        `signature "${cad.signature}" is no longer printed as the label`);
    }

    // What the READER gets is the measure: lift against the chant's own mode
    // ("×2.1"), or the plain corpus share where the mode is unknown or the
    // in-mode count too thin to divide.
    const labels = [...tracked.svg.matchAll(/>(×[\d.]+|[\d.]+%)<\/text>/g)];
    assert.ok(labels.length > 0, "no lift or share label rendered");

    // No Latin arrival cases ride the row (adventus was cut).
    assert.ok(!/in (finalem|tenorem|tertiam|subfinalem)/.test(tracked.svg));
  });

  test("draws a transposition segment dashed — displacement, not modulation", () => {
    const exaltabo = tonus.cantus({ source: "gr" }).find((c) => c.id === "gregobase:648");
    const s = tonus.notatio(exaltabo);
    assert.ok(s.modulations.some((m) => m.kind === "transposition"),
      "the affinal-frame subject still reads as transposition");
    const svg = inscriptio(s, { notation: "moderna", width: 900, tracks: ["tonarium"] }).svg;
    assert.ok(svg.includes('stroke-dasharray="4 2.6"'), "the dashed rubrica segment");
  });
});

describe("inscriptio — duae species parity (ruled 2026-07-29)", () => {
  const score = tonus.notatio(puer());

  test("one staff→lyric gap and one lyric weight across both species", () => {
    // The gap from the bottom staff line to the lyric baseline is the same
    // 21px (default scale) in quadrata and moderna.
    const gapOf = (svg, lines) => {
      const lineYs = [...svg.matchAll(/<line x1[^>]*y1="([\d.]+)"/g)]
        .slice(0, lines).map((m) => Number(m[1]));
      const lyricY = Number(svg.match(/class="lyric"[^>]*y="([\d.]+)"/)[1]);
      return lyricY - Math.max(...lineYs);
    };
    const quad = inscriptio(score).svg;
    const mod = inscriptio(score, { notation: "moderna" }).svg;
    const qGap = gapOf(quad, 4);   // 4-line staff
    const mGap = gapOf(mod, 5);    // 5-line staff
    assert.ok(Math.abs(qGap - mGap) < 0.1, `gaps match (${qGap} vs ${mGap})`);
    // Both species set the same default lyric weight.
    assert.ok(/class="lyric"[^>]*font-weight="518"/.test(quad), "quadrata weight 518");
    assert.ok(/class="lyric"[^>]*font-weight="518"/.test(mod), "moderna weight 518");
  });

  test("both species honour the official front matter (title + auto mark, no dropcap)", () => {
    const opts = { title: "Puer natus est", annotation: "auto" };
    const quad = inscriptio(score, opts).svg;
    const mod = inscriptio(score, { ...opts, notation: "moderna" }).svg;
    for (const svg of [quad, mod]) {
      assert.ok(svg.includes('class="title"'), "the centered title");
      assert.ok(/class="rubric"[^>]*>Intr\.</.test(svg), "the genus mark");
      assert.ok(/class="rubric"[^>]*>7\.</.test(svg), "the mode mark");
      assert.ok(!svg.includes('class="dropcap"'), "no dropcap in tonus scores");
    }
  });
});

describe("inscriptio — the tracks are selectable, not species-paired", () => {
  const score = tonus.notatio(puer());
  const plain = buildScore({
    id: "test:1", incipit: "Test", gabc: "(c4) Ky(g)ri(h)e(g.) (::)", office: "or",
    genus: "Ordinarium", mode: "1", modus: "Modus I", pages: [],
    source: { book: "Test", year: null, editor: null },
  });
  const height = (svg) => Number(/height="([0-9.]+)"/.exec(svg)[1]);

  test("either track rides either species", () => {
    for (const notation of ["quadrata", "moderna"]) {
      for (const track of ["chironomia", "tonarium"]) {
        const { svg } = inscriptio(score, { notation, width: 900, tracks: [track] });
        assert.ok(svg.includes(`class="${track}"`), `${track} on ${notation}`);
      }
    }
  });

  test("both tracks stack on one score, and the band pays for both", () => {
    for (const notation of ["quadrata", "moderna"]) {
      const one = inscriptio(score, { notation, width: 900, tracks: ["chironomia"] });
      const other = inscriptio(score, { notation, width: 900, tracks: ["tonarium"] });
      const both = inscriptio(score, { notation, width: 900, tracks: ["chironomia", "tonarium"] });
      assert.ok(both.svg.includes('class="chironomia"'), `${notation}: wave present`);
      assert.ok(both.svg.includes('class="tonarium"'), `${notation}: lane present`);
      assert.ok(height(both.svg) > height(one.svg), `${notation}: taller than the wave alone`);
      assert.ok(height(both.svg) > height(other.svg), `${notation}: taller than the lane alone`);
    }
  });

  test("the stack order is the renderer's, not the caller's", () => {
    for (const notation of ["quadrata", "moderna"]) {
      const a = inscriptio(score, { notation, width: 900, tracks: ["chironomia", "tonarium"] });
      const b = inscriptio(score, { notation, width: 900, tracks: ["tonarium", "chironomia"] });
      assert.equal(a.svg, b.svg, `${notation}: either order draws the same page`);
    }
  });

  test("a track disturbs neither the notation nor the geometry contract", () => {
    for (const notation of ["quadrata", "moderna"]) {
      const bare = inscriptio(score, { notation, width: 900 });
      const tracked = inscriptio(score, { notation, width: 900, tracks: ["chironomia", "tonarium"] });
      assert.equal(tracked.geometry.length, bare.geometry.length, `${notation}: same notes`);
      for (let i = 0; i < bare.geometry.length; i++) {
        assert.equal(tracked.geometry[i].x, bare.geometry[i].x, `${notation}: note ${i} x`);
        if (bare.geometry[i].system === 0) {
          assert.equal(tracked.geometry[i].y, bare.geometry[i].y, `${notation}: note ${i} y`);
        }
      }
    }
  });

  test("unknown track names still throw", () => {
    assert.throws(() => inscriptio(plain, { tracks: ["bogus"] }), /unknown track/);
    assert.throws(() => inscriptio(plain, { notation: "moderna", tracks: ["bogus"] }), /unknown track/);
  });
});
