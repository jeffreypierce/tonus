// ---------------------------------------------------------------------------
// site/diagrams/hand — the Guidonian hand
// ---------------------------------------------------------------------------
// The medieval singer's index: twenty joints of the left hand, each holding one
// step of the gamut, read in a spiral — thumb tip, down the thumb, across the
// finger bases, up the little finger, back across the tips, then inward, with
// ee floating above the middle fingertip. A cantor pointed at a joint and the
// choir knew the pitch. It is a lookup table you carry with you.
//
// WHAT IS DRAWN HERE, AND WHAT IS ASKED. A hand's shape is not computable, so
// the outline, the reading route, and the twenty locus positions are traced
// illustration and live in hand-figure.js. Everything else is the library's:
// GUIDONIAN_DATA says which pitch each joint holds and what it is called, and
// gradus(midi) reads it under the selected mode — its hexachord, all three
// solmization variants, and its degree and role in that mode.
//
// The loci are keyed BY MIDI, so the drawing indexes into tonus rather than
// restating it. The two b/♮ pairs share a joint by design — one locus, two
// readings, fa in molle and mi in durum — which is the tradition, not a
// collision to resolve.

import { INK, RUBRICA, STRATUM, STROKE, STEP, HOUSE_SERIF, sc } from "./ink.js";
import { tabula } from "./tabula.js";
import { literaGlyph } from "./litera.js";
// The rubricated roundel, shared with the three wheels — see frame.js.
import { roundel } from "./frame.js";
import { LOCUS, DIGITS, KNUCKLE, KNUCKLE_FULL, ROUTE, BOW, VIEWBOX }
  from "./hand-figure.js";

const NS = "http://www.w3.org/2000/svg";

/** NOT READ IS A RATIO, NOT A FLOOR. What tells a joint this hexachord reads
 *  from one it does not is the GAP between them — so when the lit marks come
 *  down, this has to come down with them. The old hardcoded 0.34 was set
 *  against a lit syllable at full ink: 2.9:1. Lower the lit mark to
 *  STRATUM.wave and leave the floor, and the ratio falls under 2:1 — every
 *  joint reads as disabled, which is the one distinction the hand exists to
 *  teach. 0.18 restores 4.2:1. The ring and the litera take stated fractions
 *  of it, so all three move together. */
const NOT_READ = 0.18;

function el(tag, attrs, text) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  if (text != null) e.textContent = text;
  return e;
}

/**
 * The gamut as the hand holds it: one row per locus, read under a mode.
 *
 * @param {object} tonus
 * @param {object} opts
 * @param {number} [opts.mode]  the mode whose hexachord colours the reading
 */
export function handRows(tonus, { mode = 1, tuning, comma } = {}) {
  const T = tonus.temperamentum({
    mode, ...(tuning ? { tuning } : {}), ...(comma != null ? { comma } : {}),
  });
  const rows = [];
  for (const midi of LOCUS.keys()) {
    const g = T.gradus(midi);
    if (!g) continue;
    const n = T.nota(midi);
    rows.push({
      key: String(midi),
      midi,
      // The pitch class, so a caller can match a degree across octaves — a
      // chant sings G2 where the gamut writes G3, and they are one degree.
      pc: n?.pitch?.pc ?? n?.pc ?? null,
      litera: g.name ?? "",
      nomen: g.nomen ?? "",
      hexachord: g.hexachord ?? null,
      solmisatio: g.solmization ?? null,
      // Every hexachord that reads this joint, and how — the mutation table.
      variants: g.variants ?? [],
      mutatio: (g.variants ?? []).map((v) => v.solmization).join(" · "),
      spn: n?.spn ?? "",
      hz: n?.hz ?? null,
      role: g.role && g.role !== "other" ? g.role : "",
      degree: g.degree ?? null,
      xy: LOCUS.get(midi),
    });
  }
  return rows;
}

/**
 * The hand.
 *
 * @param {object} tonus
 * @param {object} opts
 * @param {number} [opts.mode]      the mode read on the hand
 * @param {string} [opts.selected]  a locus key (the midi, as a string)
 * @param {(key: string) => void} [opts.onSelect]
 */
/** A point and a tangent on a cubic, so a mark can ride the curve itself
 *  rather than the chord between its ends. */
function onCubic(p0, c0, c1, p1, t) {
  const mt = 1 - t;
  const at = (i) => mt ** 3 * p0[i] + 3 * mt * mt * t * c0[i] + 3 * mt * t * t * c1[i] + t ** 3 * p1[i];
  const dt = (i) => 3 * mt * mt * (c0[i] - p0[i]) + 6 * mt * t * (c1[i] - c0[i]) + 3 * t * t * (p1[i] - c1[i]);
  return { at: [at(0), at(1)], tan: [dt(0), dt(1)] };
}

/** A chevron pointing along a direction — the route's arrowhead. It rides at
 *  55% of a segment so it cannot collide with the circle it is heading for. */
function chevron(at, tan, size = 5) {
  const a = Math.atan2(tan[1], tan[0]);
  const arm = (d) => [at[0] + size * Math.cos(a + d), at[1] + size * Math.sin(a + d)];
  const [p, q] = [arm(2.5), arm(-2.5)];
  return el("path", {
    d: `M${sc(p[0])} ${sc(p[1])} L${sc(at[0])} ${sc(at[1])} L${sc(q[0])} ${sc(q[1])}`,
    fill: "none", stroke: INK, "stroke-opacity": STRATUM.wave,
    "stroke-width": STROKE.firm, "stroke-linecap": "round", "stroke-linejoin": "round",
  });
}

/** Where a step of the route sits. A paired step reports the midpoint between
 *  its two circles, so the line passes between them. */
function stepAt(step) {
  if (!Array.isArray(step)) return LOCUS.get(step);
  const [a, b] = step.map((m) => LOCUS.get(m));
  return [(a[0] + b[0]) / 2, a[1]];
}

/**
 * The hand.
 *
 * @param {object} tonus
 * @param {object} opts
 * @param {number} [opts.mode]        the mode read on the hand
 * @param {string} [opts.selected]    a locus key (the midi, as a string)
 * @param {string} [opts.hexachord]   which hexachord is being read — "durum",
 *                                    "naturale", "molle". Loci outside it grey.
 * @param {boolean} [opts.route]      draw the reading route at all. Off leaves
 *                                    the twenty places and the five digits —
 *                                    the hand as a reader who knows the order
 *                                    already uses it.
 *                                    Its dashes and its arrows are one thing
 *                                    and go together: an arrow is a direction
 *                                    ON a path, and a path a reader is meant
 *                                    to walk has a direction.
 * @param {(key: string) => void} [opts.onSelect]
 */
export function hand(tonus, { mode = 1, selected, hexachord, route = true,
  onSelect, tuning, comma } = {}) {
  const rows = handRows(tonus, { mode, tuning, comma });
  const sel = selected ?? rows.find((r) => r.role === "finalis")?.key ?? rows[0]?.key;

  // WHICH JOINTS THIS HEXACHORD READS. A joint's `variants` names every
  // hexachord that reads it, so the two b's answer separately: at one joint the
  // round b belongs to molle and the square b to durum, and naturale reads
  // neither. Lighting the pair as a unit said a hexachord contained both, which
  // is the distinction the hand exists to teach.
  const reads = (r) => !hexachord
    || (r.variants ?? []).some((v) => v.hexachord === hexachord);

  const svg = el("svg", {
    class: "hand", viewBox: VIEWBOX, xmlns: NS,
    role: "img",
    "aria-label": `The Guidonian hand, read in mode ${mode}`
      + (hexachord ? `, hexachordum ${hexachord}` : ""),
  });

  // ── the structure: five digits and the knuckles ──
  // It sits at the rail while the route is drawn over it, and comes up one
  // rung when the route is off: with nothing crossing the figure, the digits
  // are the only thing holding the twenty circles together, and at rail weight
  // they read as scaffolding rather than as a hand.
  const bones = route ? STRATUM.rail : STRATUM.margin;
  for (const [x, top, bottom] of DIGITS) {
    svg.appendChild(el("line", {
      x1: x, y1: top, x2: x, y2: bottom, stroke: INK,
      "stroke-opacity": bones, "stroke-width": STROKE.hair,
    }));
  }
  svg.appendChild(el("path", {
    d: route ? KNUCKLE : KNUCKLE_FULL, fill: "none", stroke: INK,
    "stroke-opacity": bones, "stroke-width": STROKE.hair,
  }));

  // ── the route: the CLAIM this figure makes, so it is firm, inked, dashed
  //    and arrowed. Held at the rail like the structure it was drawn with, it
  //    was indistinguishable from it, and the order — which is the whole
  //    point of a hand — could not be read at all. ──
  for (let i = 0; route && i < ROUTE.length - 1; i++) {
    const a = stepAt(ROUTE[i]);
    const b = stepAt(ROUTE[i + 1]);
    const bows = ROUTE[i] === BOW.from && ROUTE[i + 1] === BOW.to;
    if (bows) {
      const c0 = [a[0] + BOW.dx, a[1] - BOW.lift];
      const c1 = [b[0] + BOW.dx, b[1] + BOW.drop];
      svg.appendChild(el("path", {
        d: `M${a[0]} ${a[1]} C ${c0[0]} ${c0[1]}, ${c1[0]} ${c1[1]}, ${b[0]} ${b[1]}`,
        fill: "none", stroke: INK, "stroke-opacity": STRATUM.wave,
        "stroke-width": STROKE.firm, "stroke-dasharray": "5 4",
      }));
      const m = onCubic(a, c0, c1, b, 0.5);
      svg.appendChild(chevron(m.at, m.tan));
      continue;
    }
    svg.appendChild(el("line", {
      x1: a[0], y1: a[1], x2: b[0], y2: b[1], stroke: INK,
      "stroke-opacity": STRATUM.wave, "stroke-width": STROKE.firm,
      "stroke-dasharray": "5 4",
    }));
    const t = 0.55;
    svg.appendChild(chevron(
      [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
      [b[0] - a[0], b[1] - a[1]],
    ));
  }

  // ── a locus per joint ──
  for (const r of rows) {
    const [x, y] = r.xy;
    const isSel = r.key === sel;
    const lit = reads(r);
    const rad = isPaired(r.midi) ? 13 : 16;

    if (isSel) {
      svg.appendChild(roundel(x, y, rad, 6));
    }
    svg.appendChild(el("circle", {
      cx: x, cy: y, r: rad,
      // A KNOCKOUT, NEVER TRANSPARENT: the circle occludes the route passing
      // behind it, so it always holds a fill — this is the only thing stopping
      // the dashes striking through the syllables, which is why the loci are
      // appended AFTER the route and must stay there. The fill is the LEAF,
      // because a locus is not lifted off the page; the sheet's one step up is
      // spent on the joint you have CHOSEN, which stands on --paper-lit as a
      // selected row does.
      fill: isSel ? "var(--paper-lit, #FFF)" : "var(--paper, #FDFDFD)",
      stroke: isSel ? RUBRICA : INK,
      // The ring is the WELL a syllable sits in, not a claim. The wheels draw
      // their sphere rings at rail/hair; this lands a rung above pure
      // graticule because it is also a hit target.
      "stroke-opacity": isSel ? 1 : (lit ? STRATUM.margin : NOT_READ * 0.6),
      "stroke-width": lit ? STROKE.fine : STROKE.hair,
    }));

    // THE SOLFÈGE SYLLABLE ALONE, which is what the hand is FOR: a cantor
    // reads a pitch by the syllable its hexachord gives it, and the litera
    // that names the joint is the table's business. Set as capitals, in the
    // register every other small label on the page uses. (Small caps when the
    // subset carries them — see fonts/README.md — and a step less tracking.)
    const syl = hexachord
      ? ((r.variants ?? []).find((v) => v.hexachord === hexachord)?.solmization
         ?? r.solmisatio ?? r.litera)
      : (r.solmisatio ?? r.litera);
    svg.appendChild(el("text", {
      x, y: y + 2, "text-anchor": "middle", "dominant-baseline": "central",
      // A DRAWN LETTER, at the stratum rota.js gives its planet glyphs — the
      // same kind of mark. STEP.label because a syllable is this figure's
      // CONTENT, not a tick label, and because fitting the hand to its own
      // box (mutatio's HAND_BOX) costs it 10% of its rendered size.
      "font-family": HOUSE_SERIF, "font-size": isPaired(r.midi) ? STEP.caption : STEP.label,
      "letter-spacing": "0.09em",
      fill: isSel ? RUBRICA : INK,
      "fill-opacity": lit ? STRATUM.wave : NOT_READ,
    }, String(syl).toUpperCase()));

    // The litera: which joint this is, for a reader matching the figure against
    // the table beneath it. A step up from micro — it is the name of the
    // place, not a tick label.
    //
    // A PAIRED JOINT LABELS EACH CIRCLE OVERHEAD, not off to one side. The two
    // readings sit thirty units apart, so two labels set to the upper right
    // ran into each other and into the next digit, and neither could be told
    // which circle it belonged to. Above its own circle, each is unambiguous
    // and nothing collides — the route passes between the pair, under them.
    const pair = isPaired(r.midi);
    svg.appendChild(el("text", {
      x: pair ? x : x + 22,
      y: pair ? y - rad - 7 : y - 9,
      "text-anchor": pair ? "middle" : "start",
      "font-family": HOUSE_SERIF, "font-size": STEP.caption,
      "letter-spacing": "0.06em", fill: INK,
      "fill-opacity": lit ? STRATUM.margin : NOT_READ * 0.55,
    }, r.litera));

    if (onSelect) {
      const hit = el("circle", {
        cx: x, cy: y, r: rad + 6, fill: INK, "fill-opacity": 0,
        cursor: "pointer", tabindex: "0", role: "button",
        "aria-label": `${r.nomen} — ${r.spn}${r.role ? `, the ${r.role}` : ""}`,
      });
      hit.addEventListener("click", () => onSelect(r.key));
      hit.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(r.key); }
      });
      svg.appendChild(hit);
    }
  }

  return svg;
}

/** The two joints that carry two readings at once, drawn as a narrower pair. */
const PAIRED = new Set([58, 59, 70, 71]);
function isPaired(midi) { return PAIRED.has(midi); }

/** The gamut in a table: every joint, its name, and how each hexachord reads it. */
/** The gamut as the hexachord system reads it — the table the hand is a
 *  mnemonic FOR.
 *
 *  ONE COLUMN PER HEXACHORD KIND, not per instance. A kind recurs up the
 *  gamut — durum sits on Γ, G and g — but two instances of the same kind never
 *  claim the same pitch, so they stack in one column without collision
 *  (checked: durum touches 16 rows, naturale 15, molle 12, none twice). Three
 *  columns therefore hold all eight instances, and each column reads as its
 *  kind recurring: ut…la, then ut…la again an octave or a fifth up.
 *
 *  Where two columns both name a pitch, that pitch is where a cantor MUTATES
 *  between them — the overlap IS the apparatus, and it stays visible.
 *
 *  (Eight columns, one per instance, said the same thing in a staircase two
 *  and a half times as wide, most of every row empty.) */
export function handTabula(tonus, { mode = 1, selected, onSelect, tuning, comma } = {}) {
  const rows = handRows(tonus, { mode, tuning, comma });
  const sel = selected ?? rows.find((r) => r.role === "finalis")?.key ?? rows[0]?.key;

  // The three kinds, in the order their first instance appears — which is the
  // order the gamut introduces them: durum on Γ, naturale on C, molle on F.
  const order = [];
  for (const row of rows) {
    for (const v of row.variants ?? []) {
      if (!order.includes(v.hexachord)) order.push(v.hexachord);
    }
  }

  const SIGN = { durum: "\u266e", naturale: "\u25cb", molle: "\u266d" };
  const hexCols = order.map((kind) => ({
    key: `hex-${kind}`,
    head: `${SIGN[kind] ?? ""} ${kind}`,
    format: (_v, r) =>
      (r.variants ?? []).find((x) => x.hexachord === kind)?.solmization.toLowerCase() ?? "",
  }));

  return tabula(rows, [
    // The two b's are MARKS, not letters — b rotundum and b quadratum, the
    // shapes ♭ and ♮ descend from — drawn with the baked Bravura glyphs.
    // Every other letter renders as text (literaGlyph returns null).
    { key: "litera", head: "litera", cellClass: "litera",
      render: (v) => literaGlyph(v) },
    // The name beside the letter it belongs to: Γ is Gammaut, A is Are. The
    // two read as one identification, so they sit together, and the hexachord
    // columns stay adjacent to the nota they solmize.
    { key: "nomen", head: "nomen", gloss: (r) => r.role },
    { key: "spn", head: "nota", mono: true },
    ...hexCols,
  ], { selected: sel, onSelect });
}
