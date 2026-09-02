import { describe, test } from "node:test";
import assert from "node:assert/strict";
import tonus from "../dist/index.js";
import { buildScore } from "../dist/engines/score/api.js";
import { inscriptio } from "../dist/engines/score/inscriptio.js";
import { STRATUM } from "../dist/engines/score/emitters/atramentum.js";

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
    // Matched against STRATUM.rail rather than a copy of its value: the ink is
    // the emitter's to set, and a literal here fails as a red suite when the
    // stratum is retuned — which says the rails vanished, not that they moved.
    const rails = (tracked.svg.match(
      new RegExp(`stroke="#111" stroke-opacity="${STRATUM.rail}"`, "g")) || []).length;
    assert.equal(rails, systems * 4, "all four rails, every system");
    // The home mode's numeral (VII) rides the strip in rubrica.
    assert.ok(/font-style="italic">VII</.test(tracked.svg), "the governing numeral");
  });

  test("labels each confident cadence by its in-mode share, and keys it in the margin", () => {
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
    // 34px (default scale) in quadrata and moderna.
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

  test("both species take the title; the book's opening is quadrata's alone", () => {
    const opts = { title: "Puer natus est", annotation: "auto", dropcap: true };
    const quad = inscriptio(score, opts).svg;
    const mod = inscriptio(score, { ...opts, notation: "moderna" }).svg;

    // The centred title is the one piece of front matter both species set.
    assert.ok(quad.includes('class="title"'), "quadrata: the centered title");
    assert.ok(mod.includes('class="title"'), "moderna: the centered title");

    // THE CHANT BOOK'S OPENING IS QUADRATA'S. The genus/mode mark and the
    // illuminated initial belong to the page from the Liber; moderna is a
    // transcription read as an edition, and it carries the analysis tracks
    // that a reserved cap column would fight.
    assert.ok(/class="rubric"[^>]*>Intr\.</.test(quad), "quadrata: the genus mark");
    assert.ok(/class="rubric"[^>]*>7\.</.test(quad), "quadrata: the mode mark");
    assert.ok(quad.includes('class="dropcap"'), "quadrata: the initial");

    // Ignored, not refused — a species skips options that do not apply to it,
    // so one call renders either without the caller stripping anything.
    assert.ok(!mod.includes('class="rubric"'), "moderna: no margin mark");
    assert.ok(!mod.includes('class="dropcap"'), "moderna: no initial");
  });

  // A mode standing alone (an ordinary chant, whose genus line is dropped —
  // "Ordinarium" over every Kyrie tells a reader nothing) kept the TOP row,
  // which floated it clear off the staff. The stack is bottom-aligned, so the
  // mode holds the mode's row whether or not a genus stands above it.
  test("a lone mode keeps the mode's row, not the genus's", () => {
    const opts = { annotation: "auto", dropcap: true };
    const mk = (extra) => buildScore({
      id: "test:2", incipit: "Test", gabc: "(c4) Ky(g)ri(h)e(g.) (::)",
      pages: [], source: { book: "Test", year: null, editor: null }, ...extra,
    });
    const rows = (svg) =>
      [...svg.matchAll(/<text[^>]*class="rubric"[^>]*y="([\d.]+)"[^>]*>([^<]*)</g)]
        .map((m) => ({ text: m[2], y: Number(m[1]) }));

    const stacked = rows(inscriptio(
      mk({ office: "ma", genus: "Introitus", mode: "4", modus: "Modus IV" }), opts,
    ).svg);
    const alone = rows(inscriptio(
      mk({ office: "or", genus: "Ordinarium", ordinarium: true, mode: "8",
        modus: "Modus VIII" }), opts,
    ).svg);

    assert.equal(stacked.length, 2, "a proper chant stacks genus over mode");
    assert.equal(alone.length, 1, "an ordinary chant shows its mode alone");
    assert.equal(
      alone[0].y, stacked[1].y,
      `the lone mode sits at ${alone[0].y}, the stacked mode at ${stacked[1].y} `
      + "— a mode alone must not rise into the genus's row",
    );
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
      for (const track of ["prosodia", "chironomia", "tonarium"]) {
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
      const a = inscriptio(score, { notation, width: 900, tracks: ["prosodia", "chironomia", "tonarium"] });
      const b = inscriptio(score, { notation, width: 900, tracks: ["tonarium", "chironomia", "prosodia"] });
      assert.equal(a.svg, b.svg, `${notation}: any order draws the same page`);
    }
  });

  test("all three tracks stack on one score", () => {
    const all = inscriptio(score, { width: 900, tracks: ["prosodia", "chironomia", "tonarium"] });
    for (const track of ["prosodia", "chironomia", "tonarium"]) {
      assert.ok(all.svg.includes(`class="${track}"`), `${track} present in the stack`);
    }
    const two = inscriptio(score, { width: 900, tracks: ["chironomia", "tonarium"] });
    assert.ok(height(all.svg) > height(two.svg), "the band pays for the third track");
  });

  test("the prosodia draws its marks: tents, blocks, and the rubrica claim", () => {
    const { svg } = inscriptio(score, { width: 900, tracks: ["prosodia"] });
    const band = /<g class="prosodia">.*?<\/g>/s.exec(svg);
    assert.ok(band, "the prosodia group");
    assert.ok(/fill-opacity="0\.18"/.test(band[0]), "a melisma block at the block stratum");
    assert.ok(/<circle[^>]*(fill|stroke)="[^"]*#9E2B25/.test(band[0]),
      "an accent claim in the liturgical red");
  });

  test("a track disturbs neither the notation nor the geometry contract", () => {
    for (const notation of ["quadrata", "moderna"]) {
      const bare = inscriptio(score, { notation, width: 900 });
      const tracked = inscriptio(score, { notation, width: 900, tracks: ["prosodia", "chironomia", "tonarium"] });
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

// The geometry contract addresses a note three ways — geometry[i], tabula[i],
// and the emitter's drawn-order noteheads are the same note. Both emitters
// filled `noteIndex` from the row's `neumeIndex` (position within the neume
// FIGURE) where the tabula and Cadence.notes mean position within the
// SYLLABLE, so the documented tuple join misaddressed every syllable carrying
// a second figure — 17 of 159 notes on this subject. The site never noticed
// because it joins by array index; the documented join was the broken one.
describe("the geometry contract addresses the tabula's own note", () => {
  for (const notation of ["quadrata", "moderna"]) {
    test(`${notation}: every geometry entry matches its tabula row`, () => {
      for (const subject of [puer(), tonus.cantus({ office: "an", limit: 1 })[0]]) {
        const score = tonus.notatio(subject);
        const { geometry } = inscriptio(score, { width: 900, notation });
        assert.equal(geometry.length, score.tabula.length,
          `${subject.id}: one geometry entry per tabula row`);
        for (let i = 0; i < geometry.length; i++) {
          const g = geometry[i], t = score.tabula[i];
          for (const key of ["phraseIndex", "syllableIndex", "neumeGroup", "noteIndex", "neumeIndex"]) {
            assert.equal(g[key], t[key], `${subject.id} note ${i}: ${key}`);
          }
        }
      }
    });
  }
});

// `x` is the ANCHOR, not the middle: quadrata's square glyphs start there and
// run right, so a mark spanning notes drawn anchor-to-anchor sits left of what
// it names. The ink edges are the figure's real extent — the numbers the
// in-house tracks have always consumed, now reported. The site measured the
// drawn glyph out of the DOM for want of them.
describe("the geometry reports the figure's ink, not just its anchor", () => {
  for (const notation of ["quadrata", "moderna"]) {
    test(`${notation}: ink edges straddle the anchor and enclose it`, () => {
      for (const subject of [puer(), tonus.cantus({ office: "an", limit: 1 })[0]]) {
        const score = tonus.notatio(subject);
        const { geometry } = inscriptio(score, { width: 900, notation });
        for (let i = 0; i < geometry.length; i++) {
          const g = geometry[i];
          assert.ok(Number.isFinite(g.inkLeft) && Number.isFinite(g.inkRight),
            `${subject.id} note ${i}: both edges reported`);
          assert.ok(g.inkLeft < g.inkRight,
            `${subject.id} note ${i}: ink runs left to right`);
          assert.ok(g.inkLeft <= g.x,
            `${subject.id} note ${i}: the anchor is not left of the ink`);
        }
      }
    });
  }

  // Moderna centres its heads on the anchor, so the edges are derived rather
  // than measured and the straddle is even.
  test("moderna's derived edges sit evenly about the anchor", () => {
    const { geometry } = inscriptio(tonus.notatio(puer()), { width: 900, notation: "moderna" });
    for (const g of geometry) {
      assert.ok(Math.abs((g.x - g.inkLeft) - (g.inkRight - g.x)) < 0.02,
        `note at ${g.x}: even straddle`);
    }
  });

  // The point of reporting them: the public numbers ARE the private ones the
  // tracks consume, not a parallel derivation that could drift. A track band
  // reserves room, so the systems below it sit lower — `y`/`systemY` move by
  // design, and the page grows by the sum of the bands. The note's horizontal
  // placement and its ink are what a track reads, and those do not move.
  for (const notation of ["quadrata", "moderna"]) {
    test(`${notation}: a track reserves room without moving the ink it reads`, () => {
      const score = tonus.notatio(puer());
      const bare = inscriptio(score, { width: 900, notation }).geometry;
      const tracked = inscriptio(score, { width: 900, notation, tracks: ["prosodia"] }).geometry;
      assert.equal(tracked.length, bare.length, `${notation}: one entry per note either way`);
      for (let i = 0; i < bare.length; i++) {
        for (const key of ["x", "inkLeft", "inkRight", "system", "noteIndex", "neumeIndex"]) {
          assert.equal(tracked[i][key], bare[i][key], `${notation} note ${i}: ${key}`);
        }
      }
    });
  }
});

// A cadence figure that wraps is re-inked in every system it crosses — the
// claim spans them — but it CLOSES once. Drawn per-system, the closing dot
// landed on the earlier fragment's last sample (a landing mid-figure) and the
// label repeated, so one close read as two: at width 680 this subject drew 7
// circles under quadrata and 8 under moderna for 6 confident cadences.
describe("a wrapped cadence closes once", () => {
  const score = tonus.notatio(puer());
  const confident = score.cadences.filter((c) => c.confidence >= 0.45);

  for (const notation of ["quadrata", "moderna"]) {
    test(`${notation}: one landing dot per confident cadence`, () => {
      // 680 forces a cadence figure across a system break on this subject.
      const { svg } = inscriptio(score, { width: 680, notation, tracks: ["tonarium"] });
      const circles = (svg.match(/<circle /g) ?? []).length;
      assert.equal(circles, confident.length,
        `${notation}: ${confident.length} confident cadences, ${circles} landing dots`);
    });
  }
});
