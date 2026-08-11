// ---------------------------------------------------------------------------
// site/diagrams/frame — the one outer ring both wheels wear
// ---------------------------------------------------------------------------
// The annulus and the rota are two readings of a single year: what is sung in
// it, and what stands over it. So they share a frame — the same radii, the
// same viewBox, the same band at the rim — and only their contents differ.
// Built separately they drifted, one banding the civil months and the other
// the zodiac, at different sizes and in opposite senses.
//
// The band divides into TWELVE either way. That is not a coincidence worth
// hiding: the months and the signs are the same twelvefold division of the
// same circle, which is most of what a medieval reader meant by relating the
// calendar to the heavens. One ring, two labellings.
//
// ONE ORIENTATION, and it is the calendar's: clockwise from twelve o'clock,
// the way the annulus already read. The zodiac turns the same way — a calendar
// date IS the Sun's longitude, so the two advance together — and needs only an
// offset to say where 0° Aries falls in the civil year. Two wheels that
// disagree about which way the year turns cannot be laid side by side.

import { INK, RUBRICA, STRATUM, STROKE, STEP, HOUSE_SERIF, sc } from "./ink.js";
import { pointAt, uprightRotation } from "./polar.js";

const NS = "http://www.w3.org/2000/svg";

/** The shared frame. Everything outward of the contents belongs to both. */
export const FRAME = {
  size: 640,          // the viewBox, square
  centre: 320,
  compass: 228,       // the tick ring: where the contents stop
  week: 231.5,        // a week tick reaches to here
  tick: 234,          // a division tick reaches further
  bandIn: 240,        // the labelled band
  bandOut: 271,
  bandName: 255.5,    // its names ride the middle
};

export const el = (tag, attrs, text) => {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  if (text != null) e.textContent = text;
  return e;
};

/** An svg + its centred root, sized to the shared frame. */
export function wheel({ className, label }) {
  const svg = el("svg", {
    class: className,
    viewBox: `0 0 ${FRAME.size} ${FRAME.size}`,
    xmlns: NS,
    role: "img",
    "aria-label": label,
  });
  const defs = el("defs", {});
  const root = el("g", { transform: `translate(${FRAME.centre} ${FRAME.centre})` });
  svg.appendChild(defs);
  svg.appendChild(root);
  return { svg, defs, root };
}

/**
 * Draw the outer ring: the circles, the twelve divisions, the ticks between
 * them, and the twelve names around the band.
 *
 * @param {SVGElement} root
 * @param {object} opts
 * @param {string[]} opts.names       the twelve, in order
 * @param {number[]} [opts.bounds]    where each division STARTS, in the ring's
 *                                    own units — month day-of-year, or sign
 *                                    degree. Defaults to twelve even sectors.
 * @param {number} [opts.period]      the full turn in those units (365, 360)
 * @param {number} [opts.ticks]       minor tick every N units (a week, 10°)
 * @param {number} [opts.offset]      turn the whole ring by this many degrees
 */
/** THE RUBRICATED ROUNDEL — the ring drawn round the thing you have chosen.
 *  The same mark in all three wheels, which is why it lives here: it was three
 *  copies of `stroke-width: 1.6`, and 1.6 is not a rung. STROKE.heavy is, and
 *  is what an axis or a boundary takes — which is what this is, drawn round one
 *  mark rather than across the figure.
 *
 *  `gap` is how far clear of the mark it sits: the wheels give a dot 7 units,
 *  the hand's larger locus 6.
 */
export function roundel(cx, cy, r, gap = 7) {
  return el("circle", {
    cx: sc(cx), cy: sc(cy), r: sc(r + gap),
    fill: "none", stroke: RUBRICA, "stroke-width": STROKE.heavy,
  });
}

export function outerRing(root, {
  names, bounds, period = 360, ticks = 0, offset = 0,
}) {
  const at = pointAt;
  const rot = uprightRotation;
  const deg = (v) => ((((v / period) * 360 + offset) % 360) + 360) % 360;
  const starts = bounds ?? names.map((_, i) => (i * period) / 12);

  for (const r of [FRAME.compass, FRAME.tick, FRAME.bandIn, FRAME.bandOut]) {
    root.appendChild(el("circle", {
      r, fill: "none", stroke: INK,
      "stroke-opacity": STRATUM.rail, "stroke-width": STROKE.hair,
    }));
  }

  // The minor ticks: a week of the year, ten degrees of the ecliptic.
  if (ticks > 0) {
    for (let v = 0; v < period; v += ticks) {
      const a = deg(v);
      const [x1, y1] = at(a, FRAME.compass);
      const [x2, y2] = at(a, FRAME.week);
      root.appendChild(el("line", {
        x1: sc(x1), y1: sc(y1), x2: sc(x2), y2: sc(y2),
        stroke: INK, "stroke-opacity": STRATUM.rail, "stroke-width": STROKE.hair,
      }));
    }
  }

  // The twelve divisions, ticked and ruled across the band.
  starts.forEach((v) => {
    const a = deg(v);
    const [x1, y1] = at(a, FRAME.compass);
    const [x2, y2] = at(a, FRAME.tick);
    root.appendChild(el("line", {
      x1: sc(x1), y1: sc(y1), x2: sc(x2), y2: sc(y2),
      stroke: INK, "stroke-opacity": STRATUM.bracket, "stroke-width": STROKE.hair,
    }));
    const [bx1, by1] = at(a, FRAME.bandIn);
    const [bx2, by2] = at(a, FRAME.bandOut);
    root.appendChild(el("line", {
      x1: sc(bx1), y1: sc(by1), x2: sc(bx2), y2: sc(by2),
      stroke: INK, "stroke-opacity": STRATUM.rail, "stroke-width": STROKE.hair,
    }));
  });

  // The names, upright around the band.
  names.forEach((name, i) => {
    const from = starts[i];
    const to = i + 1 < starts.length ? starts[i + 1] : period;
    const mid = deg((from + to) / 2);
    const [x, y] = at(mid, FRAME.bandName);
    root.appendChild(el("text", {
      transform: `translate(${sc(x)} ${sc(y)}) rotate(${sc(rot(mid))})`,
      "text-anchor": "middle", "dominant-baseline": "central",
      "font-family": HOUSE_SERIF, "font-size": STEP.micro,
      "letter-spacing": "0.09em",
      fill: INK, "fill-opacity": STRATUM.margin,
    }, name.toUpperCase()));
  });
}
