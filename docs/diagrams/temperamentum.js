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
 * @param {number} [opts.selected]  the chosen degree's pc; null means the final
 */
export function wheel(tonus, { mode = 7, tuning, comma, weights } = {}) {
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
    class: "temper-wheel", viewBox: "0 8 440 396", xmlns: NS,
    role: "img",
    "aria-label": `Mode ${mode}, its degrees placed by cents around the octave`
      + ", the final at the top",
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

  // ── the degrees ──
  // A dot's AREA carries how much the chant sings the degree, so the radius
  // goes as the root: doubling the area is doubling the time spent there.
  // A degree the scale has and the chant never sings draws OPEN — absent is
  // not the same as zero, and a filled dot at minimum size would claim a
  // weight the chant does not have.
  const wmax = Math.max(...Object.values(weights ?? {}), 1e-6);
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

    // The letter outside, its ratio stacked with it. BELOW everywhere except
    // the top arc, where below would put the ratio between the letter and the
    // ring — the one place the stack has to invert.
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
        x: sc(lx), y: sc(letterY + (top ? -14 : 12)),
        "text-anchor": "middle", "font-family": HOUSE_SERIF,
        "font-size": STEP.micro, fill: INK, "fill-opacity": STRATUM.rail,
      }, r.ratio));
    }
  }

  return svg;
}
