// ---------------------------------------------------------------------------
// site/diagrams/mutatio — the hexachord through a chant, as a ring
// ---------------------------------------------------------------------------
// A cantor singing a chant does not stay in one hexachord: at some notes the
// gamut offers a syllable in more than one, and the singer MUTATES — changes
// which six the next stretch is read by. This is that, over the whole piece.
//
// IT IS A RING, AND THE HAND STANDS IN IT. The site reads two other things as
// wheels — the year in Festum, the sky in Harmonia — and they are the same
// object: a round frame, a band of lanes, marks on a path, one rubric where
// you are. A piece read straight through is a cycle like those are, so it
// takes the same form and the same 640 square, and the hand it drives sits at
// the centre of it rather than beneath. Time is the angle, twelve o'clock to
// twelve o'clock; the hexachord is the radius.
//
// The three lanes run OUTWARD as the b goes UP: molle innermost with the round
// b, then naturale with neither, then durum outermost with the square one.
//
// The line steps and does not slope. A hexachord holds until it changes and
// then changes at a note, so an arc at one radius and a jump to the next.
// Sampled as a slope it would claim a piece drifts between hexachords, which
// is exactly what a mutation is not.
//
// THE RING IS A CONTROL. Its mark is `state.note` — the same selection the
// score and the tables carry — so pointing at the ring is not a second
// selection, it is the one the whole page already shares.

import { INK, RUBRICA, STRATUM, STROKE, STEP, HOUSE_SYMBOL, HOUSE_MONO } from "./ink.js";
import { FRAME } from "./frame.js";
import { BOX, CROWN } from "./hand-figure.js";
import { pointAt } from "./polar.js";

const NS = "http://www.w3.org/2000/svg";
const el = (tag, attrs, text) => {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  if (text != null) e.textContent = text;
  return e;
};

// A lane is named by the b it reads — the same three signs handTabula heads
// its columns with, so ring and table map onto each other at a glance and
// there is no abbreviation to decode. `durum` has the square b, `molle` the
// round one, and `naturale` neither: a ring for the hexachord that touches
// no b at all.
const LANES = [
  { key: "durum", sign: "\u266e", r: 298 },
  { key: "naturale", sign: "\u25cb", r: 278 },
  { key: "molle", sign: "\u266d", r: 258 },
];
const LANE = new Map(LANES.map((l) => [l.key, l.r]));
const INNER = 244;                       // where the ring stops and the hand begins
// ONE UNIT ACROSS THE COMPOSITE. A nested svg scales strokes and type along
// with geometry, so fitting the hand into a box wider than its own quietly
// rescales every rung inside it: at 532 the hand's unit ran ×1.118, and
// STROKE.firm painted 1.17 where the ring's painted 1.05. A rung is supposed
// to mean one rendered thing in both.
//
// It is BOX.w and not BOX.h because the fit below divides by
// max(BOX.w, BOX.h) — the box is 476 × 435, so the width is the max and the
// unit lands at exactly 1. Were the hand ever redrawn taller than it is wide,
// this would have to become that max.
const HAND_BOX = BOX.w;                  // 476 — the square the hand is fitted into
// How far ABOVE the molle lane the crown of the hand hangs. Zero sets ee's top
// edge exactly on the lane; a little clear of it reads as the hand standing in
// the ring rather than hooked onto it.
//
// NEGATIVE NOW, which is the figure being centred rather than hung. The hand's
// ink is not centred inside its own box — the crown reaches higher than the
// wrist drops — so hanging it from the lane left its middle 72 units above the
// ring's. Dropping it puts the two centres nearer together, which is what a
// figure standing INSIDE a ring should look like.
const HAND_LIFT = -8;   // his eye, 2026-08-11: ~3px lower at rendered size
// How much paper a lane sign punches out from under itself, so the lane it
// stands on does not strike through it. A halo, not a line — hence a stated
// width rather than a STROKE rung.
const KNOCKOUT = 5;

const P = (deg, r) => pointAt(deg, r).map((v) => Number(v.toFixed(1)));

/** An arc at one radius, from one angle to the next. */
function arc(a0, a1, r) {
  const [x0, y0] = P(a0, r);
  const [x1, y1] = P(a1, r);
  const large = (a1 - a0) % 360 > 180 ? 1 : 0;
  return `M${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
}

/**
 * @param {object} opts
 * @param {{hexachord: string|null}[]} opts.rows   the score's tabula
 * @param {number} [opts.note]                     index of the current note
 * @param {number[]} [opts.phrases]                note indices a phrase begins at
 * @param {SVGElement} [opts.centre]               the figure the ring drives
 * @param {(i: number) => void} [opts.onSelect]
 */
export function mutatio({ rows, note, phrases = [], centre, onSelect } = {}) {
  const steps = (rows ?? []).map((r) => r?.hexachord ?? null);

  const svg = el("svg", {
    class: "mutatio", viewBox: `0 0 ${FRAME.size} ${FRAME.size}`, xmlns: NS,
    role: "img", "aria-label": "The hexachord in force through the chant",
  });
  const root = el("g", { transform: `translate(${FRAME.centre} ${FRAME.centre})` });
  svg.appendChild(root);

  // The hand rides inside the ring, in its own coordinates: a nested svg keeps
  // its viewBox, so the figure is placed and scaled without being redrawn.
  //
  // HUNG, NOT CENTRED. Its crown — the top of ee — is set on the molle lane at
  // twelve o'clock, so the figure meets the band at a stated place instead of
  // floating wherever centring happens to leave it. The scale is the fit the
  // nested svg will choose, worked out here so the sum can be made.
  if (centre) {
    const s = HAND_BOX / Math.max(BOX.w, BOX.h);
    const inset = (HAND_BOX - BOX.h * s) / 2;
    centre.setAttribute("x", FRAME.centre - HAND_BOX / 2);
    centre.setAttribute("y",
      (FRAME.centre - LANES[2].r) - HAND_LIFT - inset - (CROWN - BOX.y) * s);
    centre.setAttribute("width", HAND_BOX);
    centre.setAttribute("height", HAND_BOX);
    svg.appendChild(centre);
  }
  if (!steps.length) return svg;

  const span = 360 / steps.length;
  const at = (i) => i * span;

  // NO BOUNDARY CIRCLES. The three lanes are the band, and a rule drawn round
  // the inside or the outside of them only states the band's own width a
  // second time. `INNER` survives as where the hit wedges reach, not as a
  // line — nothing is drawn at it.
  for (const l of LANES) {
    root.appendChild(el("circle", {
      r: l.r, fill: "none", stroke: INK,
      // The lanes are a graticule you read the line against, so they take
      // the rung named for exactly that. 0.10 was a value invented BELOW
      // the floor of the ladder — a third of the quietest named stratum.
      "stroke-opacity": STRATUM.rail, "stroke-width": STROKE.hair,
    }));
  }

  // The phrase divisions, so a mutation can be read against the text it
  // serves. They run INSIDE the band — the outer lane to the inner and no
  // further — so the band stays one object with its divisions in it, rather
  // than a set of lanes with ticks hung off the outside of them.
  for (const i of phrases) {
    if (i <= 0 || i >= steps.length) continue;
    const [x0, y0] = P(at(i), LANES[0].r);
    const [x1, y1] = P(at(i), LANES[LANES.length - 1].r);
    root.appendChild(el("line", {
      x1: x0, y1: y0, x2: x1, y2: y1, stroke: INK,
      "stroke-opacity": STRATUM.rail, "stroke-width": STROKE.hair,
    }));
  }

  // The line: an arc while the hexachord holds, a radial jump where it turns.
  // A note the gamut gives no hexachord to breaks it rather than being drawn
  // at a lane it is not in.
  const d = [];
  steps.forEach((h, i) => {
    const r = LANE.get(h);
    if (r == null) return;
    d.push(arc(at(i), at(i + 1), r));
    const next = LANE.get(steps[i + 1]);
    if (next != null && next !== r) {
      const [x0, y0] = P(at(i + 1), r);
      const [x1, y1] = P(at(i + 1), next);
      d.push(`M${x0} ${y0} L${x1} ${y1}`);
    }
  });
  root.appendChild(el("path", {
    d: d.join(" "), fill: "none", stroke: INK,
    // TONED BY WEIGHT, NOT BY OPACITY. This line has to stay the darkest mark
    // in the band — it is what the figure argues — so it comes off the claim
    // rung and KEEPS its stratum. Dropping the opacity instead would put it
    // level with the loci and the figure would stop having a subject.
    //
    // Measured as opacity × width, it now leads the loci 0.465 to 0.285. It
    // used to TRAIL them, 0.651 against 0.788, which was the whole complaint:
    // the lookup table was inked louder than the claim it serves.
    //
    // Note the wheels render at ~0.785 px per unit (640u in ~502px), so every
    // rung below `heavy` paints under one device pixel — `fine` lands at
    // 0.59px. That is the house condition, not this line's problem; the
    // annulus's own principal mark is an 8-unit BAND rather than a rung for
    // the same reason.
    "stroke-opacity": STRATUM.letters, "stroke-width": STROKE.fine,
    "stroke-linecap": "round",
  }));

  // The signs sit at six o'clock, one per lane, clear of the crown of the hand
  // and of twelve o'clock where the piece begins and the line is densest.
  // They knock a little paper out behind them.
  for (const l of LANES) {
    const [x, y] = P(180, l.r);
    root.appendChild(el("text", {
      x, y: y + 5, "text-anchor": "middle",
      "font-family": HOUSE_SYMBOL, "font-size": STEP.body,
      fill: INK, "fill-opacity": STRATUM.label,
      // KNOCKOUT: the sign punches paper out from under itself so the lane
      // it sits on does not strike through it. hand.js does the same job
      // with a fill, because a circle can; a glyph cannot, so it is a
      // stroke laid under the fill. KNOCKOUT is the width that clears
      // this glyph at STEP.body — not a rung, because it is not a line.
      "paint-order": "stroke", stroke: "var(--paper, #FDFDFD)",
      "stroke-width": KNOCKOUT,
    }, l.sign));
  }

  // WHERE YOU ARE, in the rubric the other two wheels already mark with.
  if (note != null && steps[note] !== undefined) {
    const a = at(note + 0.5);
    const [x0, y0] = P(a, INNER - 8);
    const [x1, y1] = P(a, LANES[0].r + 18);
    root.appendChild(el("line", {
      x1: x0, y1: y0, x2: x1, y2: y1,
      stroke: RUBRICA, "stroke-width": STROKE.firm,
    }));
    const r = LANE.get(steps[note]);
    if (r != null) {
      const [cx, cy] = P(a, r);
      root.appendChild(el("circle", { cx, cy, r: 4.2, fill: RUBRICA }));
    }
  }

  // One hit wedge per note, across the whole band: a ring this dense is
  // pointed at by sector, not by the few pixels the line happens to occupy.
  if (onSelect) {
    const rIn = INNER, rOut = LANES[0].r + 14;
    steps.forEach((_, i) => {
      const [ax, ay] = P(at(i), rIn);
      const [bx, by] = P(at(i + 1), rIn);
      const [cx, cy] = P(at(i + 1), rOut);
      const [dx, dy] = P(at(i), rOut);
      const large = span > 180 ? 1 : 0;
      const hit = el("path", {
        d: `M${ax} ${ay} A ${rIn} ${rIn} 0 ${large} 1 ${bx} ${by} L${cx} ${cy} `
           + `A ${rOut} ${rOut} 0 ${large} 0 ${dx} ${dy} Z`,
        fill: INK, "fill-opacity": 0, cursor: "pointer",
      });
      hit.addEventListener("click", () => onSelect(i));
      root.appendChild(hit);
    });
  }

  return svg;
}
