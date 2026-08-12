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

import { INK, RUBRICA, STRATUM, STROKE, STEP, HOUSE_SERIF, sc } from "./ink.js";
import { chordaRows } from "./chorda.js";

const NS = "http://www.w3.org/2000/svg";

// The lab's geometry, doubled onto one grid so the ink system's rungs land at
// the size the lab tuned. Same convention as census.js.
const GRID = 2;

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
  onSelect } = {}) {
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
  for (let i = 0; i < rows.length; i++) {
    for (let k = i + 1; k < rows.length; k++) {
      const a = rows[i], b = rows[k];
      const touchesSel = a.pc === sel.pc || b.pc === sel.pc;
      const touchesNbr = nbrs.has(a.pc) || nbrs.has(b.pc);
      if (!touchesSel && !touchesNbr) continue;
      const cls = T.intervallum(a.spn, b.spn)?.class;
      if (cls !== "P5" && cls !== "P4") continue;
      const [ax, ay] = pointAt(angleOf(a.cents), R);
      const [bx, by] = pointAt(angleOf(b.cents), R);
      svg.append(n("line", {
        x1: sc(ax), y1: sc(ay), x2: sc(bx), y2: sc(by),
        stroke: touchesSel ? RUBRICA : INK,
        "stroke-opacity": touchesSel ? STRATUM.label : STRATUM.rail,
        "stroke-width": touchesSel ? STROKE.firm : STROKE.hair,
      }));
    }
  }

  // ── THE WOLF: the fifth the chain cannot make ──
  // Twelve fifths do not close an octave, and the leftover falls on the one
  // interval nobody stacked. Its ends are G♯ and E♭, which no mode sings, so
  // they wear NO DOT AND NO LETTER — a dot would claim the chant goes there.
  // The ring is a circle of cents, so a pitch has a place on it whether or not
  // it is drawn: verified across all eight modes and the whole comma range, a
  // wolf end never comes within 19° of a drawn degree, so the chord always has
  // clear arc to spring from.
  //
  // Dashed, and always faint. It is a fact about the TUNING rather than about
  // the selection, so it does not brighten with a click — but the hub names
  // its size, and the size is what the slider changes.
  const lupus = T.lupus?.();
  if (lupus) {
    const finC = T.cents[sel.pc] != null ? T.cents[finalRow.pc] : 0;
    const relOf = (pc) => norm(T.cents[pc] - finC);
    const [wx1, wy1] = pointAt(angleOf(relOf(lupus.from)), R);
    const [wx2, wy2] = pointAt(angleOf(relOf(lupus.to)), R);
    svg.append(n("line", {
      x1: sc(wx1), y1: sc(wy1), x2: sc(wx2), y2: sc(wy2),
      stroke: INK, "stroke-opacity": STRATUM.rail,
      "stroke-width": STROKE.fine, "stroke-dasharray": "4 4",
    }));
  }

  const hubPlates = [];

  // ── THE HUB: what the slider is doing, in three lines ──
  // Over the star's crossings, on a paper plate, because that is the one part
  // of the ring the chords leave empty and because the fifth IS the star: the
  // number names the thing those lines are drawn from.
  //
  // Three lines and nothing else. The fifth spelled as the theorists wrote it,
  // the fifth measured, and the wolf — which is the fifth's cost. Narrow the
  // eleven and the twelfth pays for it, so the two numbers move together and
  // belong in one plate.
  {
    const just = justTable(T);
    // MEASURED FROM THE SCALE, not assumed: C up to G in the built table is
    // the fifth this temperament actually makes.
    const fifthC = norm(T.cents[7] - T.cents[0]);
    const spelled = commaForm(fifthC, just);
    const lines = [];
    // At Pythagorean the spelling IS "3:2" and the line below already says
    // 702.0¢, so printing both says one thing twice. The spelling earns its
    // line only when it has something to add — which is the moment the
    // slider leaves zero, and exactly when a reader wants it.
    if (spelled && spelled !== "3:2") lines.push(spelled);
    lines.push(`the fifth · ${fifthC.toFixed(1)}¢`);
    if (lupus) {
      lines.push(`the wolf · ${lupus.cents.toFixed(0)}¢ · `
        + `${lupus.fromPure > 0 ? "+" : "\u2212"}${Math.abs(lupus.fromPure).toFixed(0)} from 3:2`);
    }
    const LH = 15;
    const hubY = CY - (lines.length - 1) * LH / 2;
    lines.forEach((text, i) => {
      const t = n("text", {
        x: sc(CX), y: sc(hubY + i * LH), "text-anchor": "middle",
        "font-family": HOUSE_SERIF,
        "font-size": i === 0 ? STEP.label : STEP.caption,
        fill: INK, "fill-opacity": i === 0 ? STRATUM.letters : STRATUM.rail,
      }, text);
      svg.append(t);
      hubPlates.push(t);
    });
  }
  // ONE PLATE UNDER ALL THREE LINES, sized on the next frame for the reason
  // the arch labels are: getBBox reads zero before layout. The chords cross
  // exactly here — that is what makes the middle the only empty part of the
  // ring — so without it they strike straight through the numbers.
  if (hubPlates.length && typeof requestAnimationFrame === "function") {
    const plate = n("rect", { rx: 3, fill: "var(--paper, #FDFDFC)" });
    svg.insertBefore(plate, hubPlates[0]);
    requestAnimationFrame(() => {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const t of hubPlates) {
        const b = t.getBBox();
        if (!b.width) return;
        x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y);
        x1 = Math.max(x1, b.x + b.width); y1 = Math.max(y1, b.y + b.height);
      }
      plate.setAttribute("x", sc(x0 - 6));
      plate.setAttribute("y", sc(y0 - 4));
      plate.setAttribute("width", sc(x1 - x0 + 12));
      plate.setAttribute("height", sc(y1 - y0 + 8));
    });
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
    svg.append(n("circle", {
      cx: sc(x), cy: sc(y),
      r: sc(sung ? 2 + Math.sqrt(w / wmax) * 4 : 2.5),
      fill: sung ? (isFinal ? RUBRICA : INK) : "none",
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
    svg.append(n("text", {
      x: sc(lx), y: sc(letterY), "text-anchor": "middle",
      "font-family": HOUSE_SERIF, "font-size": STEP.body,
      fill: isFinal ? RUBRICA : INK,
      "fill-opacity": isFinal ? null : STRATUM.letters,
    }, r.litera));
    // Mid-slider a degree sits between ratios and the library names none; the
    // slot stays empty rather than printing an approximation.
    if (r.ratio) {
      svg.append(n("text", {
        x: sc(lx), y: sc(letterY + (top ? -23 : 13)),
        "text-anchor": "middle", "font-family": HOUSE_SERIF,
        // A STEP UP FROM micro. Measured on the page: the letter renders at
        // 22px and the ratio at 12.9, which reads as a footnote to the letter
        // rather than as the other half of the label. It IS the reading — the
        // letter only says which degree — so it takes the caption rung.
        "font-size": STEP.caption, fill: INK, "fill-opacity": STRATUM.letters,
      }, r.ratio));
    }
  }

  // ── the string beneath ──
  drawString(svg, tonus, { rows, mode, tuning, comma, weights, wmax, sel, onSelect });

  return svg;
}

// ── the comma spelling ────────────────────────────────────────────────────
// THE ONE PIECE OF ARITHMETIC THAT IS THE FIGURE'S OWN, and it is a NOTATION
// rather than a fact about a tuning: a way of writing a tempered size the way
// the meantone theorists wrote it. Every interval here sits an exact
// comma-multiple from a just ratio — the Pythagorean third 81:64 IS 5:4 plus
// one comma of 81:80 — so a size can be spelled "5:4+1c" instead of "408¢",
// and the spelling says WHERE the temperament put it.
//
// The just ratios come from T.ratio(), not a copy of them: the library holds
// the arithmetic and a second table here would be a second opinion.
const JUST_KEYS = ["3/2", "4/3", "5/4", "6/5", "5/3", "8/5"];
const COMMA = 21.506;   // the syntonic comma, 81:80
// The fractions a reader of the slider actually meets. Anything else prints a
// decimal: a spelling is only worth having when it is nameable.
const NICE = [[0, "0"], [1 / 9, "1/9"], [1 / 6, "1/6"], [2 / 9, "2/9"],
  [1 / 4, "1/4"], [1 / 3, "1/3"], [4 / 9, "4/9"], [1 / 2, "1/2"],
  [2 / 3, "2/3"], [3 / 4, "3/4"], [1, "1"], [4 / 3, "4/3"], [3 / 2, "3/2"],
  [2, "2"]];

/** The just intervals, resolved once per render from the library. */
function justTable(T) {
  return JUST_KEYS.map((k) => {
    const r = T.ratio(k);
    return [r.cents, r.display];
  });
}

/** A tempered span as the theorists would write it, or null when it sits too
 *  far from anything just — beyond about two commas the spelling stops being
 *  a reading and becomes arithmetic, and the size speaks better in cents. */
function commaForm(span, just) {
  let best = null;
  for (const [c, display] of just) {
    const k = (span - c) / COMMA;
    if (!best || Math.abs(k) < Math.abs(best.k)) best = { k, display };
  }
  if (!best || Math.abs(best.k) > 2.05) return null;
  if (Math.abs(best.k) < 0.02) return best.display;   // it IS the just ratio
  const nice = NICE.find(([v]) => Math.abs(Math.abs(best.k) - v) <= 0.02);
  const size = nice ? nice[1] : Math.abs(best.k).toFixed(1);
  return `${best.display}${best.k > 0 ? "+" : "\u2212"}${size}c`;
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
function drawString(svg, tonus, { rows, mode, tuning, comma, weights, wmax, sel, onSelect }) {
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

  // the string, between its bridges
  for (const x of [X0, X1]) {
    svg.append(n("line", {
      x1: sc(x), y1: sc(STRING_Y - 12), x2: sc(x), y2: sc(STRING_Y + 12),
      stroke: INK, "stroke-opacity": STRATUM.cadence,
      "stroke-width": STROKE.heavy * GRID,
    }));
  }
  svg.append(n("line", {
    x1: sc(X0), y1: sc(STRING_Y), x2: sc(X1), y2: sc(STRING_Y),
    stroke: INK, "stroke-opacity": STRATUM.wave, "stroke-width": STROKE.fine * GRID,
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
        plates.push({ x: (xa + xb) / 2, y: STRING_Y - hgt - 5,
          text: commaForm(span, just) ?? `${span.toFixed(0)}¢` });
      }
    }
  }

  // ── the degrees on the string ──
  for (const r of rows) {
    const x = stringX(r.cents);
    const w = weights?.[r.pc] ?? 0;
    const sung = w > 0;
    const isFinal = r.role === "finalis";
    svg.append(n("circle", {
      cx: sc(x), cy: sc(STRING_Y),
      r: sc(sung ? 2 + Math.sqrt(w / wmax) * 3 : 2),
      fill: sung ? (isFinal ? RUBRICA : INK) : "none",
      "fill-opacity": sung && !isFinal ? STRATUM.letters : null,
      stroke: sung ? null : INK,
      "stroke-opacity": sung ? null : STRATUM.letters,
      "stroke-width": sung ? null : STROKE.fine * GRID,
    }));
    if (r.pc === sel.pc) {
      svg.append(n("circle", {
        cx: sc(x), cy: sc(STRING_Y), r: 7, fill: "none", stroke: RUBRICA,
        "stroke-width": STROKE.firm * GRID,
      }));
    }
    hit(svg, { x, y: STRING_Y, row: r, sel, onSelect,
      finalKey: rows.find((q) => q.pc === finalPc)?.key });
    svg.append(n("text", {
      x: sc(x), y: sc(STRING_Y + 26), "text-anchor": "middle",
      "font-family": HOUSE_SERIF, "font-size": STEP.label,
      fill: isFinal ? RUBRICA : INK,
      "fill-opacity": isFinal ? null : STRATUM.letters,
    }, r.litera));
  }

  // THE DIAPASON, AT THE FAR BRIDGE. A string sounds its whole length and its
  // half, so the octave is the final again and the right bridge is not a bare
  // end. It is drawn plainly, not rubricated: the final proper wears the red,
  // and two red dots would read as two claims where there is one degree.
  const fin = rows.find((r) => r.pc === finalPc);
  if (fin) {
    const w = weights?.[fin.pc] ?? 0;
    svg.append(n("circle", {
      cx: sc(X1), cy: sc(STRING_Y),
      r: sc(w > 0 ? 2 + Math.sqrt(w / wmax) * 3 : 2),
      fill: w > 0 ? INK : "none",
      "fill-opacity": w > 0 ? STRATUM.letters : null,
      stroke: w > 0 ? null : INK,
      "stroke-opacity": w > 0 ? null : STRATUM.letters,
      "stroke-width": w > 0 ? null : STROKE.fine * GRID,
    }));
    svg.append(n("text", {
      x: sc(X1), y: sc(STRING_Y + 26), "text-anchor": "middle",
      "font-family": HOUSE_SERIF, "font-size": STEP.label,
      fill: INK, "fill-opacity": STRATUM.letters,
    }, fin.litera));
  }

  // ── the labels, last, each on its own paper plate ──
  // THE PLATE IS CUT TO ITS OWN WORD. A per-character estimate overshoots a
  // short label and pinches a long one — measured, "Quinta" wore 12.5 units of
  // padding a side against "Tertia minor"'s 6.6 — but getBBox() cannot be read
  // at build time either: the text has no layout until the SVG is in the
  // document, and it returns zero width. So the plate is drawn first at a
  // placeholder and RESIZED on the next frame, when the browser has laid the
  // text out and can be asked how wide it really is.
  const PLATE_PAD = 3.5;
  const pending = [];
  for (const pl of plates) {
    const plate = n("rect", {
      y: sc(pl.y - 9), height: 13, rx: 2, fill: "var(--paper, #FDFDFC)",
    });
    const t = n("text", {
      x: sc(pl.x), y: sc(pl.y), "text-anchor": "middle",
      "font-family": HOUSE_SERIF, "font-size": STEP.micro,
      fill: RUBRICA,
    }, pl.text);
    svg.append(plate, t);
    pending.push([plate, t]);
  }
  if (pending.length && typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => {
      for (const [plate, t] of pending) {
        const bb = t.getBBox();
        if (!bb.width) continue;
        plate.setAttribute("x", sc(bb.x - PLATE_PAD));
        plate.setAttribute("width", sc(bb.width + PLATE_PAD * 2));
        plate.setAttribute("y", sc(bb.y - 1));
        plate.setAttribute("height", sc(bb.height + 2));
      }
    });
  }
}
