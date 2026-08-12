// ---------------------------------------------------------------------------
// site/diagrams/temperamentum — the octave bent to a circle
// ---------------------------------------------------------------------------
// The scale's degrees placed by CENTS around a ring, the final at twelve
// o'clock. A monochord shows a scale as lengths along a string; this shows it
// as positions in a turn, which is the view that makes tempering legible: a
// degree that moves under the slider moves along the ring, and the fifths that
// build the scale draw as chords across it.
//
// COMPUTED, NOT TRANSCRIBED. The lab this descends from
// (working/review/diagram-temperamentum-04.html) carried 34 baked frames of
// hand-computed cents. Everything here is asked of the library at render:
// chordaRows for the degrees, temperamentum().lupus() for the wolf,
// intervallum() for what an interval IS. See the plan's §0 — nothing is
// recomputed in a figure that the engine already answers.
//
// FINAL AT TWELVE O'CLOCK for free: chordaRows measures every degree from the
// finalis, so 0¢ is the top and no rotation is needed.

import { INK, RUBRICA, STRATUM, STROKE, STEP, HOUSE_SERIF, HOUSE_MONO, sc }
  from "./ink.js";
import { chordaRows, commaForm, justTable, degreeJust } from "./chorda.js";

const NS = "http://www.w3.org/2000/svg";

// The lab's geometry, doubled onto one grid so the ink system's rungs land at
// the size the lab tuned. Same convention as census.js.
const GRID = 2;

// The paper halo every label wears where lines run: the text clears its own
// ground, so a needle or a chord can never strike a word. One definition —
// letters, ratios, plates and the centre reading all take it.
// heavy on the grid IS 3 — the width the halo was written at, now on the
// ladder so the lint can see it is a chosen rung and not a loose number.
// How wide a pointer needs, not how wide a line looks.
const HIT_W = 9;

const HALO = { stroke: "var(--paper, #FDFDFD)",
  "stroke-width": STROKE.heavy * GRID,
  "paint-order": "stroke", "stroke-linejoin": "round" };

// The ring, and the radius the labels hang at. R+30 is the lab's; the ratio
// stacks with the letter rather than sitting radially beside it, which
// collides at three and nine o'clock.
//
// The BOX is the lab's cropped one, opened at the top: the lab drew no ratio
// above its letters and could crop to 22, where a stacked ratio on the top arc
// reaches about 14 units higher and was clipped.
const CX = 220, CY = 206, R = 128;
const LABEL_R = R + 30;

// The string, under the wheel in the same box. Its bridges sit inside the
// wheel's own width so the two figures read as one drawing rather than a
// figure and a ruler that happen to share a column.
//
// THE FINAL SITS AT BOTH BRIDGES. A string sounds its whole length and its
// half, so the octave is the same degree twice — and drawing the final at the
// left bridge alone would leave an arch springing from nothing at the right.
// The degrees between run in CENTS order, which is not the row order: mode 4
// opens on D a tone BELOW its final, and that D belongs at 996¢, near the far
// bridge, not first.
// STRING_Y CLEARS THE WHEEL'S LOWEST INK plus everything the string draws
// upward — a fifth arches 74 above it and its name sits on a plate above
// that. Measured: the wheel bottoms at 364, the tallest arch and its label
// reached 351 from a string at 470, so 13 short. 490 clears it with air.
const X0 = 40, X1 = 400, STRING_Y = 490;

// An interval's arch height, by what the LIBRARY calls it. The lab keyed
// these off cents windows (m3 [270,340] and so on), which is a second opinion
// about naming that intervallum already holds — and a window drifts under
// temperament where a name does not. Only the four consonances arch; the rest
// of the pairs are silent, which is what keeps the figure readable.
const ARCH_H = { m3: 26, M3: 40, P4: 56, P5: 74 };

function n(tag, attrs, text) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  if (text != null) e.textContent = text;
  return e;
}

const norm = (c) => ((c % 1200) + 1200) % 1200;
/** Cents to angle: 0¢ at twelve o'clock, clockwise through the octave. */
const angleOf = (c) => (norm(c) / 1200) * 2 * Math.PI - Math.PI / 2;
const pointAt = (a, r) => [CX + r * Math.cos(a), CY + r * Math.sin(a)];

/**
 * The wheel.
 *
 * @param {object} tonus
 * @param {object} opts
 * @param {number} [opts.mode]      the mode whose scale is drawn
 * @param {string} [opts.tuning]
 * @param {number} [opts.comma]     the tempering fraction, live from the slider
 * @param {object} [opts.weights]   pc → share, from imprint.pcDistribution
 * @param {string} [opts.selected]  the chosen degree's row key (its spn).
 *                                  Absent means the final: there is always a
 *                                  selection, so the resting figure shows the
 *                                  mode's own spine.
 * @param {(key: string) => void} [opts.onSelect]
 */
export function wheel(tonus, { mode = 7, tuning, comma, weights, selected,
  onSelect, edge, onEdge } = {}) {
  // ONE TURN IS ONE OCTAVE, and a mode's ambitus is not: the plagal modes
  // start a fourth below their final (mode 4 opens at −203.9¢) and every mode
  // runs past the diapason. Folding by cents would stack those onto the same
  // points, so the rows are deduped by PITCH CLASS — one dot per degree, which
  // is what a circle of the octave can hold. The first row for a pc wins, so
  // the octave-proper reading of each degree is the one drawn.
  const seen = new Set();
  const rows = chordaRows(tonus, { mode, tuning, comma })
    .filter((r) => {
      if (seen.has(r.pc)) return false;
      seen.add(r.pc);
      return true;
    });
  if (!rows.length) return null;

  const svg = n("svg", {
    class: "temper-wheel", viewBox: "0 8 440 550", xmlns: NS,
    role: "img",
    "aria-label": `Mode ${mode} twice: its degrees placed by cents around the`
      + " octave, and the same degrees along a divided string beneath",
  });

  // ── the ring, and the equal grid the ±æq. numbers refer to ──
  svg.append(n("circle", {
    cx: CX, cy: CY, r: R, fill: "none", stroke: INK,
    "stroke-opacity": STRATUM.rail, "stroke-width": STROKE.hair * GRID,
  }));
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * 2 * Math.PI - Math.PI / 2;
    const [x1, y1] = pointAt(a, R - 5), [x2, y2] = pointAt(a, R);
    svg.append(n("line", {
      x1: sc(x1), y1: sc(y1), x2: sc(x2), y2: sc(y2), stroke: INK,
      "stroke-opacity": STRATUM.rail, "stroke-width": STROKE.hair * GRID,
    }));
  }

  // ONE SCALE FOR BOTH DRAWINGS: the wheel's dots and the string's read the
  // same weights, so a degree that is heavy on one is heavy on the other.
  const wmax = Math.max(...Object.values(weights ?? {}), 1e-6);

  // THE SELECTION IS ALWAYS SOMETHING. `selected` absent means the FINAL, so
  // the resting figure shows the mode's spine rather than nothing at all —
  // and both drawings resolve it once, here, so they cannot disagree.
  //
  // The chorda figures rest on the TENOR instead (chorda.js, four call
  // sites). They are drawings of a scale, where the reciting note is the one
  // a reader wants first; this is a drawing of a MODE, and a mode is reckoned
  // from its final. The two differ only until the reader clicks, after which
  // one selection drives all of them — but the difference is real and worth
  // settling in context rather than by quietly changing four defaults.
  const finalRow = rows.find((r) => r.role === "finalis") ?? rows[0];
  const sel = rows.find((r) => r.key === selected) ?? finalRow;

  // ── THE STAR: the chain of fifths, drawn across the ring ──
  // A scale is BUILT from fifths, and the chords are that construction made
  // visible: six of them for seven degrees, because the diatonic chain is
  // open — F–C–G–D–A–E–B, with no chord closing B back to F. That missing
  // seventh chord is the tritone, and its absence is the figure's own
  // argument rather than something a caption has to assert.
  //
  // Partners come from intervallum, not a cents window: a fifth and its
  // inversion (P5 up, P4 up from the other end) are the same relationship,
  // and the library knows which is which under any temperament.
  //
  // ONLY THE SELECTION SPEAKS. The full star is six lines crossing one small
  // circle and it reads as a scribble; the selected degree's chords draw in
  // rubrica, its neighbours' faintly, the rest not at all.
  const T = tonus.temperamentum({ mode, ...(tuning ? { tuning } : {}),
    ...(comma != null ? { comma } : {}) });
  const byCents = [...rows].sort((a, b) => norm(a.cents) - norm(b.cents));
  const si = byCents.findIndex((r) => r.pc === sel.pc);
  const nbrs = new Set(si < 0 ? [] : [
    byCents[(si + byCents.length - 1) % byCents.length].pc,
    byCents[(si + 1) % byCents.length].pc,
  ]);
  // A DRAWN CHORD TAKES A CLICK (his ask, 2026-08-12): hold it and the
  // centre names the interval its two notes make, live under the slider.
  // The held chord firms up in its own ink so the reading has a referent.
  for (let i = 0; i < rows.length; i++) {
    for (let k = i + 1; k < rows.length; k++) {
      const a = rows[i], b = rows[k];
      const touchesSel = a.pc === sel.pc || b.pc === sel.pc;
      const touchesNbr = nbrs.has(a.pc) || nbrs.has(b.pc);
      if (!touchesSel && !touchesNbr) continue;
      const cls = T.intervallum(a.spn, b.spn)?.class;
      if (cls !== "P5" && cls !== "P4") continue;
      const held = edgeIs(edge, a, b);
      const [ax, ay] = pointAt(angleOf(a.cents), R);
      const [bx, by] = pointAt(angleOf(b.cents), R);
      svg.append(n("line", {
        x1: sc(ax), y1: sc(ay), x2: sc(bx), y2: sc(by),
        stroke: touchesSel ? RUBRICA : INK,
        "stroke-opacity": touchesSel || held ? STRATUM.label : STRATUM.rail,
        "stroke-width": touchesSel || held ? STROKE.firm : STROKE.hair,
      }));
      edgeHit(svg, { ax, ay, bx, by, a, b, edge, onEdge });
    }
  }

  // ── THE WOLF: the tempered chain's leftover fifth ──
  // Twelve fifths do not close an octave, and the leftover falls on the one
  // interval nobody stacked. Its ends are G♯ and E♭, which no mode sings, so
  // they wear NO DOT AND NO LETTER — a dot would claim the chant goes there.
  // (It is NOT "the fifth the chain cannot make" — that phrase names the
  // TRITONUS below, whose ends the mode does sing. A wolf errs by a comma on
  // an interval that ought to be a fifth; the tritone misses by an apotome
  // and was never a fifth at all. Ruled 2026-08-12: the two are drawn as two
  // marks, each labelled, and the caption never conflates them.)
  // The ring is a circle of cents, so a pitch has a place on it whether or not
  // it is drawn: verified across all eight modes and the whole comma range, a
  // wolf end never comes within 19° of a drawn degree, so the chord always has
  // clear arc to spring from.
  //
  // Dashed, and always faint. It is a fact about the TUNING rather than about
  // the selection, so it does not brighten with a click.
  //
  // THE SIZE SITS AT THE LINE'S OWN END, just outside the ring: a number
  // touching its line is a number whose linkage needs no guessing, where a
  // label floating mid-ring among the star's crossings belonged to nothing
  // (tried, ruled off 2026-08-12: "too much collision and undefined
  // linkage"). AT THE TO-END, not the from-end: the 19° clearance holds for
  // DOTS, but the gauges magnify ×4 and a needle can sweep to the from-end
  // (mode 4 at 1/3 comma puts G's needle exactly there — caught on the
  // page). The to-end sits past the last degree's whole magnified road in
  // every mode, so the number stands on clear paper. Mono: cents are
  // machine data (the same-day numeral ruling).
  const lupus = T.lupus?.();
  if (lupus) {
    const finC = T.cents[sel.pc] != null ? T.cents[finalRow.pc] : 0;
    const relOf = (pc) => norm(T.cents[pc] - finC);
    const aTo = angleOf(relOf(lupus.to));
    const [wx1, wy1] = pointAt(angleOf(relOf(lupus.from)), R);
    const [wx2, wy2] = pointAt(aTo, R);
    svg.append(n("line", {
      x1: sc(wx1), y1: sc(wy1), x2: sc(wx2), y2: sc(wy2),
      stroke: INK, "stroke-opacity": STRATUM.rail,
      "stroke-width": STROKE.fine, "stroke-dasharray": "4 4",
    }));
    const [ex, ey] = pointAt(aTo, R + 24);
    svg.append(n("text", {
      x: sc(ex), y: sc(ey + 3), "text-anchor": "middle",
      "font-family": HOUSE_MONO, "font-size": STEP.micro,
      fill: INK, "fill-opacity": STRATUM.margin,
    }, `${lupus.cents.toFixed(0)}¢`));
  }

  // ── THE TRITONUS: the fifth the chain of fifths cannot make ──
  // The star stacks six fifths for seven degrees and stops: no chord closes
  // B back to F. The interval standing in that gap is the tritone — the
  // SCALE's own fact, in every tuning, where the wolf above is the TUNING's.
  // Its ends ARE degrees the mode sings, so unlike the wolf it obeys the
  // selection like any chord: always faintly present, dotted (a different
  // absence from the wolf's dashes), and it speaks when B or F is chosen.
  //
  // ITS SIZE IS THE CHAIN'S ARITHMETIC, not a second table: the six tempered
  // fifths and the gap close the circle, so the gap is −6 fifths (mod 1200)
  // — 588¢ under pure fifths, widening to 631¢ at 1/3 comma as the wolf
  // widens, which is the symmetry worth drawing. The pair is found by what
  // the library CALLS it (class TT), the same law the arches follow.
  // The tempered fifth, read off the star itself: any P5 pair's span. The
  // tritone's arithmetic base.
  const p5 = (() => {
    for (let i = 0; i < rows.length; i++)
      for (let k = i + 1; k < rows.length; k++)
        if (T.intervallum(rows[i].spn, rows[k].spn)?.class === "P5") {
          const s = norm(rows[k].cents - rows[i].cents);
          return s > 600 ? s : 1200 - s;
        }
    return 702;
  })();
  let tri = null;
  {
    let pair = null;
    for (let i = 0; i < rows.length && !pair; i++)
      for (let k = i + 1; k < rows.length && !pair; k++)
        if (T.intervallum(rows[i].spn, rows[k].spn)?.class === "TT")
          pair = [rows[i], rows[k]];
    if (pair) tri = { a: pair[0], b: pair[1], gap: norm(-6 * p5) };
  }
  if (tri) {
    const touches = tri.a.pc === sel.pc || tri.b.pc === sel.pc;
    const held = edgeIs(edge, tri.a, tri.b);
    const [tx1, ty1] = pointAt(angleOf(tri.a.cents), R);
    const [tx2, ty2] = pointAt(angleOf(tri.b.cents), R);
    svg.append(n("line", {
      x1: sc(tx1), y1: sc(ty1), x2: sc(tx2), y2: sc(ty2),
      stroke: touches ? RUBRICA : INK,
      "stroke-opacity": touches || held ? STRATUM.label : STRATUM.rail,
      "stroke-width": touches || held ? STROKE.firm : STROKE.fine,
      "stroke-dasharray": "1.5 4",
    }));
    edgeHit(svg, { ax: tx1, ay: ty1, bx: tx2, by: ty2,
      a: tri.a, b: tri.b, edge, onEdge });
    // NO NUMBER ON THE WHEEL. At rest it floated mid-ring with the wolf's
    // beside it — two grey figures belonging to nothing (ruled off
    // 2026-08-12, "undefined linkage"). The size lives where the linkage is
    // exact: at the apex of its own arch on the string, the moment the
    // selection makes it speak — or at the centre, when the chord itself is
    // clicked and held.
  }

  // NO STANDING HUB — RULED TWICE and settled 2026-08-12. Rev F's
  // three-line plate was "all that info, it looked bad"; the pared
  // one-metric hub fell the same day: "we show the fifth right above —
  // it's the value on the slider," and a label that never changes is not
  // data. The centre stays clear paper at rest.
  //
  // BUT THE CENTRE ANSWERS A QUESTION. Click a drawn chord and the interval
  // its two notes make reads here — the spelling in the ratio register, the
  // size in the machine register — and it rides the slider live, which is
  // what makes it data rather than a label (his ask, same day: "if you
  // clicked on a line, it showed you the ratio of the two notes — that's
  // what could go in the hub"). Click the chord again, or any note, and
  // the centre returns to clear paper.
  if (edge) {
    const ea = rows.find((r) => r.pc === edge[0]);
    const eb = rows.find((r) => r.pc === edge[1]);
    if (ea && eb) {
      const s = Math.abs(norm(ea.cents) - norm(eb.cents));
      const spelled = commaForm(s, degreeJust(T));
      svg.append(n("text", {
        x: CX, y: CY - 3, "text-anchor": "middle",
        "font-family": spelled ? HOUSE_SERIF : HOUSE_MONO,
        "font-size": STEP.caption, fill: INK,
        "fill-opacity": STRATUM.label, ...HALO,
      }, spelled ?? `${s.toFixed(0)}¢`));
      const l2 = n("text", {
        x: CX, y: CY + 13, "text-anchor": "middle",
        "font-size": STEP.micro, fill: INK,
        "fill-opacity": STRATUM.margin, ...HALO,
      });
      l2.append(n("tspan", { "font-family": HOUSE_SERIF },
        `${ea.litera} · ${eb.litera}  `));
      l2.append(n("tspan", { "font-family": HOUSE_MONO },
        `${s.toFixed(1)}¢`));
      svg.append(l2);
    }
  }

  // ── THE VERNIERS: the travel, magnified ──
  // A degree moves under the slider, and the movement is REAL but small: from
  // Pythagorean to 1/3-comma, A and B shift 2.15° on the ring and F shifts
  // 10.75°. At the ring's radius the small ones are invisible, so the figure
  // would be claiming nothing happens where something does.
  //
  // The gauge is a vernier in the instrument-maker's sense: it does not move
  // the dot, which stays at its true place, but draws the same travel on a
  // scale big enough to read. ×4 — enough that 2° becomes 8.6° and is plainly
  // a movement, not so much that a degree's gauge runs into its neighbour's.
  // The factor is declared in the popover, because a magnified reading that
  // does not say it is magnified is a lie about the ring.
  //
  // The final has no gauge: it is the point everything else is measured from,
  // so its travel is zero by construction and an empty gauge would imply the
  // measurement had been taken and come out flat.
  const MAG = 4;
  // COMMA 0, SAID OUT LOUD. The tuning's own default is quarter-comma, so
  // leaving comma off made T0 a tempered scale and every gauge measured from
  // it: the tick sat 5–27¢ sharp of pure, the needle swung off its own dot
  // at rest (the error, magnified ×4 with everything else), and the arcs
  // drew a quarter of the road. The gauge's zero is the untempered chain.
  const T0 = tonus.temperamentum({ mode, ...(tuning ? { tuning, comma: 0 } : {}) });
  const T3 = tonus.temperamentum({ mode, tuning: "meantone", comma: 1 / 3 });
  const finPc = finalRow.pc;
  const relIn = (Temp, pc) => norm(Temp.cents[pc] - Temp.cents[finPc]);
  for (const r of rows) {
    if (r.pc === finPc) continue;
    const at0 = relIn(T0, r.pc);
    let travel = relIn(T3, r.pc) - at0;
    if (travel > 600) travel -= 1200;
    if (travel < -600) travel += 1200;
    if (Math.abs(travel) < 0.5) continue;
    let live = norm(r.cents) - at0;
    if (live > 600) live -= 1200;
    if (live < -600) live += 1200;

    // THE BAND SITS AT R+9…R+20, not hugging the ring: the selection's
    // roundel reaches R+8, and a needle grazing it read as clutter around
    // the chosen note (caught on the page, 2026-08-12). Four units of air
    // keep the gauge its own instrument; the letters at R+30 still clear it.
    const a0 = angleOf(at0);
    const aEnd = angleOf(at0 + travel * MAG);
    const aNow = angleOf(at0 + live * MAG);
    const sweep = travel > 0 ? 1 : 0;
    const [gx0, gy0] = pointAt(a0, R + 15);
    const [gx1, gy1] = pointAt(aEnd, R + 15);
    // The whole travel, as a faint arc: the road the degree can walk.
    svg.append(n("path", {
      d: `M ${sc(gx0)} ${sc(gy0)} A ${R + 15} ${R + 15} 0 0 ${sc(sweep)} `
        + `${sc(gx1)} ${sc(gy1)}`,
      fill: "none", stroke: INK, "stroke-opacity": STRATUM.bracket,
      // Two rungs down from the shipped heavy: with the road at its full
      // Pythagorean→⅓ length the arc no longer needs weight to be seen — at
      // heavy it read as a smear beside its own needle, one instrument drawn
      // in two pens.
      "stroke-width": STROKE.fine * GRID,
    }));
    // The Pythagorean end: where pure fifths put the degree, and the mark the
    // needle is read against. Full height, like the needle — and ON THE GRID,
    // like every other stroke the wheel draws; the tick and needle were the
    // only two raw widths on it, spindly beside their own arc.
    const [tx0, ty0] = pointAt(a0, R + 9);
    const [tx1, ty1] = pointAt(a0, R + 20);
    svg.append(n("line", {
      x1: sc(tx0), y1: sc(ty0), x2: sc(tx1), y2: sc(ty1),
      stroke: INK, "stroke-opacity": STRATUM.margin,
      "stroke-width": STROKE.fine * GRID,
    }));
    // The needle, at the live position. INK, NOT RUBRICA: the red on this
    // figure belongs to the selection and to the final, and a needle on every
    // moving degree would spend it on seven things at once — the eye would
    // read the gauges as the claim and the chords as decoration. It is the
    // darkest mark in its own gauge, which is all it needs to be.
    const [nx0, ny0] = pointAt(aNow, R + 9);
    const [nx1, ny1] = pointAt(aNow, R + 20);
    svg.append(n("line", {
      x1: sc(nx0), y1: sc(ny0), x2: sc(nx1), y2: sc(ny1),
      stroke: INK, "stroke-opacity": STRATUM.cadence,
      "stroke-width": STROKE.firm * GRID,
    }));
  }

  // ── the degrees ──
  // A dot's AREA carries how much the chant sings the degree, so the radius
  // goes as the root: doubling the area is doubling the time spent there.
  // A degree the scale has and the chant never sings draws OPEN — absent is
  // not the same as zero, and a filled dot at minimum size would claim a
  // weight the chant does not have.
  for (const r of rows) {
    const a = angleOf(r.cents);
    const [x, y] = pointAt(a, R);
    const w = weights?.[r.pc] ?? 0;
    const sung = w > 0;
    const isFinal = r.role === "finalis";
    // THE DOT SITS ON PAPER, ABOVE THE LINES. Its ink is a stratum, and
    // over a chord the translucency let the line read straight THROUGH the
    // dot — "the stacking / opacity making it feel not as refined" (his
    // catch, 2026-08-12). So each dot clears its own ground the way the
    // letters do: a paper disc beneath the filled ones, paper fill inside
    // the open ones (the key's ring swatch has always drawn its centre
    // paper). The ink and its stratum are untouched; only the ground is.
    const dotR = sung ? 2 + Math.sqrt(w / wmax) * 4 : 2.5;
    if (sung) {
      svg.append(n("circle", { cx: sc(x), cy: sc(y), r: sc(dotR + 1.4),
        fill: "var(--paper, #FDFDFD)" }));
    }
    svg.append(n("circle", {
      cx: sc(x), cy: sc(y),
      r: sc(dotR),
      fill: sung ? (isFinal ? RUBRICA : INK) : "var(--paper, #FDFDFD)",
      "fill-opacity": sung && !isFinal ? STRATUM.letters : null,
      stroke: sung ? null : (isFinal ? RUBRICA : INK),
      "stroke-opacity": sung ? null : STRATUM.letters,
      "stroke-width": sung ? null : STROKE.fine * GRID,
    }));
    // THE CHOSEN DEGREE WEARS A RING, not a colour: the final is already
    // rubrica, and recolouring the selection would make those two claims
    // fight whenever the final IS the selection, which is the resting state.
    if (r.pc === sel.pc) {
      svg.append(n("circle", {
        cx: sc(x), cy: sc(y), r: 8, fill: "none", stroke: RUBRICA,
        "stroke-width": STROKE.firm * GRID,
      }));
    }
    hit(svg, { x, y, row: r, sel, onSelect, finalKey: finalRow.key });

    // THE LETTER IS ALWAYS NEAREST THE RING, and the ratio always outside it.
    // On the top arc that means the ratio goes ABOVE the letter — putting it
    // below would slide it between the letter and the ring, which reads as a
    // label for the ring rather than for the degree.
    const [lx, ly] = pointAt(a, LABEL_R);
    const top = Math.sin(a) < -0.5;
    const letterY = ly + (top ? 0 : 6);
    // Letters and ratios wear the halo: at three and nine o'clock the ratio
    // stacks BELOW the letter and cuts across the gauge band, and a needle
    // was striking straight through "6:5−1/4c" (his catch, 2026-08-12).
    svg.append(n("text", {
      x: sc(lx), y: sc(letterY), "text-anchor": "middle",
      "font-family": HOUSE_SERIF, "font-size": STEP.body,
      fill: isFinal ? RUBRICA : INK,
      "fill-opacity": isFinal ? null : STRATUM.letters, ...HALO,
    }, r.litera));
    // Mid-slider the row SPELLS the degree ("5:4+1c" — ruled 2026-08-12, and
    // chordaRows does the spelling), so the slot only falls empty past the
    // octave, where no honest spelling exists.
    if (r.ratio) {
      svg.append(n("text", {
        x: sc(lx), y: sc(letterY + (top ? -23 : 13)),
        "text-anchor": "middle", "font-family": HOUSE_SERIF,
        // A STEP UP FROM micro. Measured on the page: the letter renders at
        // 22px and the ratio at 12.9, which reads as a footnote to the letter
        // rather than as the other half of the label. It IS the reading — the
        // letter only says which degree — so it takes the caption rung.
        "font-size": STEP.caption, fill: INK, "fill-opacity": STRATUM.letters,
        ...HALO,
      }, r.ratio));
    }
  }

  // ── the string beneath ──
  drawString(svg, tonus, { rows, mode, tuning, comma, weights, wmax, sel,
    onSelect, tri });

  return svg;
}

// The comma spelling (justTable, commaForm) lives in chorda.js now, beside
// the rows that spell their own degrees (ruled 2026-08-12) — one copy,
// downstream of the data it annotates; this module imports it for its
// arches and its hub.

/** Does the held edge join this pair? Order-free: a chord has no direction. */
const edgeIs = (edge, a, b) => !!edge
  && ((edge[0] === a.pc && edge[1] === b.pc)
    || (edge[0] === b.pc && edge[1] === a.pc));

/** A chord's click target: the same line, wide and invisible. Clicking the
 *  held chord releases it — the same one law the note dots follow. */
function edgeHit(svg, { ax, ay, bx, by, a, b, edge, onEdge }) {
  if (!onEdge) return;
  const t = n("line", {
    x1: sc(ax), y1: sc(ay), x2: sc(bx), y2: sc(by),
    // A CLICK AREA, not a line: transparent, so its width is a pointer
    // target rather than an ink weight and belongs to no stratum.
    stroke: "transparent", "stroke-width": HIT_W, style: "cursor:pointer",
  });
  t.addEventListener("click", () =>
    onEdge(edgeIs(edge, a, b) ? null : [a.pc, b.pc]));
  t.append(n("title", {}, `${a.litera} · ${b.litera}`));
  svg.append(t);
}

/** A degree's click target, over its dot.
 *
 *  The dots run from 2 to 6 units and a pointer does not, so the target is a
 *  transparent circle of its own — big enough to hit, invisible either way.
 *  CLICKING THE SELECTED DEGREE RETURNS TO THE FINAL: one law, so a reader
 *  never has to hunt for the way back to the resting figure.
 */
function hit(svg, { x, y, row, sel, onSelect, finalKey }) {
  if (!onSelect) return;
  const t = n("circle", {
    cx: sc(x), cy: sc(y), r: 11, fill: "transparent",
    style: "cursor:pointer",
  });
  t.addEventListener("click", () => {
    onSelect(row.key === sel.key ? finalKey : row.key);
  });
  t.append(n("title", {}, row.litera));
  svg.append(t);
}

/** Cents to a place along the string, linear across the octave. */
const stringX = (c) => X0 + (norm(c) / 1200) * (X1 - X0);

/**
 * The divided string, under the wheel and in the same SVG.
 *
 * The wheel shows a degree's PLACE in the turn; the string shows the same
 * degrees laid flat, where an interval can arch between two of them and be
 * read as a span. One figure, two drawings: the wheel says where, the string
 * says how far.
 */
function drawString(svg, tonus, { rows, mode, tuning, comma, weights, wmax, sel, onSelect, tri }) {
  const finalPc = rows.find((r) => r.role === "finalis")?.pc ?? rows[0].pc;
  const T = tonus.temperamentum({ mode, ...(tuning ? { tuning } : {}),
    ...(comma != null ? { comma } : {}) });
  const just = justTable(T);

  // The two either side in cents order, wrapping: an interval's partners are
  // its neighbours on the ring, and the ring has no first or last.
  const byCents = [...rows].sort((a, b) => norm(a.cents) - norm(b.cents));
  const si = byCents.findIndex((r) => r.pc === sel.pc);
  const nbrs = new Set(si < 0 ? [] : [
    byCents[(si + byCents.length - 1) % byCents.length].pc,
    byCents[(si + 1) % byCents.length].pc,
  ]);

  // THE WHOLE STRING DRAWS OFF THE GRID. The arches were ruled off it —
  // long lines read far heavier than they measure — and a chart is ONE PEN:
  // bridges, string, rings and ghosts at the rungs' own values beside
  // arches already there, or the frame outweighs the tracery (his catch,
  // 2026-08-12: "none of the line refinement made it in — quite unbalanced
  // and thick"). The wheel above keeps its grid; this chart keeps its own.

  // ── the Pythagorean ghosts ──
  // Where a degree has drifted more than 2¢ from pure fifths, a small dashed
  // tick stands at the place it left (plan §3) — the string's half of the
  // story the verniers tell on the wheel, unmagnified because the string is
  // long enough to tell it true.
  const Tp = tonus.temperamentum({ mode, ...(tuning ? { tuning, comma: 0 } : {}) });
  const finC0 = Tp.cents[finalPc];
  for (const r of rows) {
    const p = norm(Tp.cents[r.pc] - finC0);
    let d = norm(r.cents) - p;
    if (d > 600) d -= 1200;
    if (d < -600) d += 1200;
    if (Math.abs(d) <= 2) continue;
    const gx = stringX(p);
    svg.append(n("line", {
      x1: sc(gx), y1: sc(STRING_Y - 7), x2: sc(gx), y2: sc(STRING_Y + 7),
      stroke: INK, "stroke-opacity": STRATUM.margin,
      "stroke-width": STROKE.fine, "stroke-dasharray": "2 2",
    }));
  }

  // the string, between its bridges
  for (const x of [X0, X1]) {
    svg.append(n("line", {
      x1: sc(x), y1: sc(STRING_Y - 12), x2: sc(x), y2: sc(STRING_Y + 12),
      stroke: INK, "stroke-opacity": STRATUM.cadence,
      "stroke-width": STROKE.heavy,
    }));
  }
  svg.append(n("line", {
    x1: sc(X0), y1: sc(STRING_Y), x2: sc(X1), y2: sc(STRING_Y),
    stroke: INK, "stroke-opacity": STRATUM.wave, "stroke-width": STROKE.fine,
  }));

  // ── the arches, spoken for the selection ──
  // The selected degree's intervals spring ABOVE in rubrica; its two
  // neighbours' hang BELOW in light ink. Two registers, so they cannot
  // overlap, and everything else is silent — the full set of consonances
  // across seven degrees is more lines than a reader can hold.
  //
  // Labels are COLLECTED and drawn after every arc, so no line strikes a word.
  const plates = [];
  for (let i = 0; i < rows.length; i++) {
    for (let k = i + 1; k < rows.length; k++) {
      const a = rows[i], b = rows[k];
      const touchesSel = a.pc === sel.pc || b.pc === sel.pc;
      const touchesNbr = nbrs.has(a.pc) || nbrs.has(b.pc);
      if (!touchesSel && !touchesNbr) continue;
      // WHAT THE INTERVAL IS, from the library. A cents window would be a
      // second opinion about naming, and it drifts under temperament.
      const iv = T.intervallum(a.spn, b.spn);
      const h = ARCH_H[iv?.class];
      if (!h) continue;
      const [xa, xb] = [stringX(a.cents), stringX(b.cents)].sort((p, q) => p - q);
      const under = !touchesSel;
      const hgt = under ? h * 0.72 : h;
      svg.append(n("path", {
        d: `M ${sc(xa)} ${sc(STRING_Y)} A ${sc((xb - xa) / 2)} ${sc(hgt)} 0 0 `
          + `${under ? 0 : 1} ${sc(xb)} ${sc(STRING_Y)}`,
        fill: "none",
        stroke: touchesSel ? RUBRICA : INK,
        "stroke-opacity": touchesSel ? STRATUM.label : STRATUM.rail,
        // THINNER THAN THE LAB'S, and OFF THE GRID. These are long spans, and
        // a long line at a short line's weight reads far heavier than it
        // measures. Doubling them onto the figure's grid is what made them the
        // darkest thing in it; at the rungs' own values the ring holds its own
        // and the arches read as the light tracery they should be.
        "stroke-width": touchesSel ? STROKE.firm : STROKE.hair,
      }));
      if (touchesSel) {
        // WHAT THE INTERVAL MEASURES, not what it is called. The name is
        // already the arch's height — a fifth arches higher than a third — so
        // printing "Quinta" over a fifth says the same thing twice. The size
        // is the thing that MOVES under the slider, and it is the whole
        // subject of the panel.
        const span = Math.abs(norm(b.cents) - norm(a.cents));
        plates.push({ x: (xa + xb) / 2, y: STRING_Y - hgt - 7,
          text: commaForm(span, just) ?? `${span.toFixed(0)}¢` });
      }
    }
  }

  // ── the tritonus, laid flat ──
  // The chain's gap on the string: arched OVER the fifths (74 is the tallest
  // consonance; the gap springs 88, so its apex is never mistaken for one),
  // dotted in the same costume as its chord on the wheel — one mark, two
  // drawings. Faint always; it speaks, with its size, when the selection
  // touches B or F, which is the law every arch here already follows.
  if (tri) {
    const touches = tri.a.pc === sel.pc || tri.b.pc === sel.pc;
    const [xa, xb] = [stringX(tri.a.cents), stringX(tri.b.cents)]
      .sort((p, q) => p - q);
    const TRI_H = 88;
    svg.append(n("path", {
      d: `M ${sc(xa)} ${sc(STRING_Y)} A ${sc((xb - xa) / 2)} ${TRI_H} 0 0 1 `
        + `${sc(xb)} ${sc(STRING_Y)}`,
      fill: "none",
      stroke: touches ? RUBRICA : INK,
      "stroke-opacity": touches ? STRATUM.label : STRATUM.rail,
      "stroke-width": touches ? STROKE.firm : STROKE.hair,
      "stroke-dasharray": "1.5 4",
    }));
    if (touches) {
      plates.push({ x: (xa + xb) / 2, y: STRING_Y - TRI_H - 7,
        text: `${tri.gap.toFixed(0)}¢` });
    }
  }

  // ── the degrees on the string ──
  for (const r of rows) {
    const x = stringX(r.cents);
    const w = weights?.[r.pc] ?? 0;
    const sung = w > 0;
    const isFinal = r.role === "finalis";
    // The same paper ground as the wheel's dots: the arches end on these,
    // and a line read through a translucent dot is the unrefinement his
    // 2026-08-12 catch named.
    const dotR = sung ? 2 + Math.sqrt(w / wmax) * 3 : 2;
    if (sung) {
      svg.append(n("circle", { cx: sc(x), cy: sc(STRING_Y),
        r: sc(dotR + 1.2), fill: "var(--paper, #FDFDFD)" }));
    }
    svg.append(n("circle", {
      cx: sc(x), cy: sc(STRING_Y),
      r: sc(dotR),
      fill: sung ? (isFinal ? RUBRICA : INK) : "var(--paper, #FDFDFD)",
      "fill-opacity": sung && !isFinal ? STRATUM.letters : null,
      stroke: sung ? null : INK,
      "stroke-opacity": sung ? null : STRATUM.letters,
      "stroke-width": sung ? null : STROKE.fine,
    }));
    if (r.pc === sel.pc) {
      svg.append(n("circle", {
        cx: sc(x), cy: sc(STRING_Y), r: 7, fill: "none", stroke: RUBRICA,
        "stroke-width": STROKE.heavy,
      }));
    }
    hit(svg, { x, y: STRING_Y, row: r, sel, onSelect,
      finalKey: rows.find((q) => q.pc === finalPc)?.key });
    // THE LETTER WEARS A PAPER HALO. The neighbours' under-arches hang
    // through the letter row — a fifth dips to 53 below a baseline at 26 —
    // and a hairline through a glyph reads as a misprint. The halo is the
    // letter clearing its own ground, not a plate: the mark stays the glyph.
    svg.append(n("text", {
      x: sc(x), y: sc(STRING_Y + 26), "text-anchor": "middle",
      "font-family": HOUSE_SERIF, "font-size": STEP.label,
      fill: isFinal ? RUBRICA : INK,
      "fill-opacity": isFinal ? null : STRATUM.letters,
      ...HALO,
    }, r.litera));
  }

  // THE DIAPASON, AT THE FAR BRIDGE. A string sounds its whole length and its
  // half, so the octave is the final again and the right bridge is not a bare
  // end. It is drawn plainly, not rubricated: the final proper wears the red,
  // and two red dots would read as two claims where there is one degree.
  const fin = rows.find((r) => r.pc === finalPc);
  if (fin) {
    const w = weights?.[fin.pc] ?? 0;
    const dotR = w > 0 ? 2 + Math.sqrt(w / wmax) * 3 : 2;
    if (w > 0) {
      svg.append(n("circle", { cx: sc(X1), cy: sc(STRING_Y),
        r: sc(dotR + 1.2), fill: "var(--paper, #FDFDFD)" }));
    }
    svg.append(n("circle", {
      cx: sc(X1), cy: sc(STRING_Y),
      r: sc(dotR),
      fill: w > 0 ? INK : "var(--paper, #FDFDFD)",
      "fill-opacity": w > 0 ? STRATUM.letters : null,
      stroke: w > 0 ? null : INK,
      "stroke-opacity": w > 0 ? null : STRATUM.letters,
      "stroke-width": w > 0 ? null : STROKE.fine,
    }));
    svg.append(n("text", {
      x: sc(X1), y: sc(STRING_Y + 26), "text-anchor": "middle",
      "font-family": HOUSE_SERIF, "font-size": STEP.label,
      fill: INK, "fill-opacity": STRATUM.letters,
      ...HALO,
    }, fin.litera));
  }

  // ── the labels, last ──
  // NO PAPER PLATES. A white box behind a word is a patch over a collision
  // rather than a layout, and eight of them scattered through a figure read
  // as cheap. The collision they were patching was the label sitting ON its
  // own arch's apex, which is a position chosen and therefore a position that
  // can be un-chosen: each label clears its apex instead.
  //
  // They cannot collide with EACH OTHER either, and that is structural rather
  // than lucky: only the selection's arches are labelled, they share one end
  // (the selected degree), and their heights are keyed by interval class — a
  // third, a fourth and a fifth arch to 26, 56 and 74, so their apexes are
  // always a rung apart.
  for (const pl of plates) {
    svg.append(n("text", {
      x: sc(pl.x), y: sc(pl.y), "text-anchor": "middle",
      // BY REGISTER: a spelling ("3:2−1/4c") is ratio language and wears the
      // oldstyle serif; a bare size ("631¢") is a measurement and wears the
      // mono (the 2026-08-12 numeral ruling).
      "font-family": pl.text.includes(":") ? HOUSE_SERIF : HOUSE_MONO,
      "font-size": STEP.micro,
      fill: RUBRICA,
      // The same halo as the letters: the tritone's arch crosses the fifth's
      // airspace, and a label is no more striking-through-able than a glyph.
      ...HALO,
    }, pl.text));
  }
}
