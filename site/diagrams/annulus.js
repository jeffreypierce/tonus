// ---------------------------------------------------------------------------
// site/diagrams/annulus — the liturgical year as a ring
// ---------------------------------------------------------------------------
// The year drawn once around: seasons as arcs on the inner ring, the movable
// feasts as anchors on the outer, the standing day as a rubricated dot. The
// wheel is the medieval figure for the year returning on itself, so the
// diagram is the argument — Septuagesima and Advent are near neighbours on a
// ring in a way no timeline shows.
//
// COMPUTED, NOT TRANSCRIBED. The lab round this descends from carried fifteen
// hand-copied anchors frozen to 991. tonus.pascha(year) returns exactly those
// fifteen, for any year, so the diagram takes a year and asks. That is the
// site's whole thesis in one panel: it cannot drift from the library, because
// it IS the library.

import { INK, RUBRICA, STRATUM, STROKE, STEP, HOUSE_SERIF, HOUSE_MONO, sc } from "./ink.js";
import { tabula } from "./tabula.js";

const NS = "http://www.w3.org/2000/svg";
const R_SEASON = 150, R_SEASON_NAME = 164, R_ANCHOR = 197;
const R_WEDGE_IN = 178, R_WEDGE_OUT = 216;

/** Anchors in the order they ring the year, with their display names. The keys
 * are pascha()'s own; the Latin is the site's register. */
const ANCHOR_NAMES = [
  ["epiphany", "Epiphania", "Epiphany", 3.6],
  ["baptism", "Baptismus Domini", "Baptism of the Lord", 2.4],
  ["septuagesima", "Septuagesima", "Septuagesima", 2.4],
  ["ashWednesday", "Feria IV Cinerum", "Ash Wednesday", 2.4],
  ["firstLentSunday", "Dominica I Quadragesimæ", "First Sunday of Lent", 2.4],
  ["palmSunday", "Dominica in Palmis", "Palm Sunday", 2.4],
  ["goodFriday", "Feria VI in Parasceve", "Good Friday", 2.4],
  ["easter", "Pascha", "Easter", 5.0],
  ["ascension", "Ascensio Domini", "Ascension", 2.4],
  ["pentecost", "Pentecoste", "Pentecost", 3.6],
  ["trinitySunday", "Trinitas", "Trinity Sunday", 2.4],
  ["corpusChristi", "Corpus Christi", "Corpus Christi", 2.4],
  ["adventFirstSunday", "Dominica I Adventus", "First Sunday of Advent", 2.4],
  ["gaudete", "Gaudete", "Gaudete", 2.4],
  ["christmas", "Nativitas Domini", "Christmas", 3.6],
];

/** The seasons, in ring order, each running from one anchor to the next.
 * `pen` marks the penitential seasons — drawn at the fainter stratum, which is
 * the ink system doing the work a second colour would otherwise do. */
const SEASONS = [
  { name: "NAT", from: "christmas", to: "epiphany", pen: false },
  { name: "EPI", from: "epiphany", to: "septuagesima", pen: false },
  { name: "LXX", from: "septuagesima", to: "ashWednesday", pen: true },
  { name: "QUAD", from: "ashWednesday", to: "easter", pen: true },
  { name: "PASC", from: "easter", to: "pentecost", pen: false, light: true },
  { name: "PENT", from: "pentecost", to: "adventFirstSunday", pen: false },
  { name: "ADV", from: "adventFirstSunday", to: "christmas", pen: true },
];

const deg2xy = (a, r) => [r * Math.sin((a * Math.PI) / 180), -r * Math.cos((a * Math.PI) / 180)];
const doyAngle = (d) => (d / 365) * 360;

function dayOfYear(date, year) {
  return Math.floor((new Date(date) - Date.UTC(year, 0, 1)) / 86400000) + 1;
}

const MONTHS = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun",
  "Iul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** A date as the books would set it, read in UTC. tonus is UTC-canonical, and
 * local-time formatting silently moves a date across the midnight boundary —
 * west of Greenwich, Easter reads as the day before itself. */
function romanDate(date) {
  const d = new Date(date);
  return `${MONTHS[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, "0")}`;
}

function el(tag, attrs, text) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  if (text != null) e.textContent = text;
  return e;
}

/**
 * Build the annulus for a year.
 *
 * @param {object} tonus   the library (needs `pascha`)
 * @param {object} opts
 * @param {number} opts.year      the year to ring
 * @param {Date}   [opts.day]     the standing day, drawn in rubrica
 * @param {string} [opts.selected] anchor key to mark as selected
 * @param {(key: string) => void} [opts.onSelect]
 * @returns {SVGSVGElement}
 */
export function annulus(tonus, { year, day = null, selected = "easter", onSelect } = {}) {
  const p = tonus.pascha(year);

  // Every anchor computed — nothing transcribed.
  const anchors = ANCHOR_NAMES
    .filter(([key]) => p[key] != null)
    .map(([key, nomen, gloss, dot]) => ({
      key, nomen, gloss, dot,
      date: p[key],
      doy: dayOfYear(p[key], year),
    }))
    .sort((a, b) => a.doy - b.doy);

  const byKey = new Map(anchors.map((a) => [a.key, a]));

  const svg = el("svg", {
    class: "annulus",
    viewBox: "0 0 500 500",
    xmlns: NS,
    role: "img",
    "aria-label": `The liturgical year ${year} as a ring`,
  });
  const root = el("g", { transform: "translate(250 250)" });
  svg.appendChild(root);

  const defs = el("defs", {});
  svg.appendChild(defs);

  // ── the season arcs, with their names set along the curve ──
  const seasons = el("g", { class: "seasons" });
  root.appendChild(seasons);
  for (const s of SEASONS) {
    const from = byKey.get(s.from), to = byKey.get(s.to);
    if (!from || !to) continue;
    let a0 = doyAngle(from.doy);
    let a1 = doyAngle(to.doy);
    if (a1 < a0) a1 += 360;                    // the season wrapping the top
    const large = a1 - a0 > 180 ? 1 : 0;
    const [x0, y0] = deg2xy(a0, R_SEASON);
    const [x1, y1] = deg2xy(a1 % 360, R_SEASON);

    seasons.appendChild(el("path", {
      d: `M ${sc(x0)} ${sc(y0)} A ${R_SEASON} ${R_SEASON} 0 ${large} 1 ${sc(x1)} ${sc(y1)}`,
      fill: "none",
      stroke: INK,
      "stroke-opacity": s.pen ? STRATUM.bracket : STRATUM.letters,
      "stroke-width": s.light ? STROKE.hair : STROKE.fine,
    }));

    // The name rides the arc itself; flipped when it would read upside down.
    const mid = ((a0 + a1) / 2) % 360;
    const flip = mid > 100 && mid < 260;
    const [nx0, ny0] = deg2xy(a0, R_SEASON_NAME);
    const [nx1, ny1] = deg2xy(a1 % 360, R_SEASON_NAME);
    const id = `annulus-arc-${s.name}`;
    defs.appendChild(el("path", {
      id,
      d: flip
        ? `M ${sc(nx1)} ${sc(ny1)} A ${R_SEASON_NAME} ${R_SEASON_NAME} 0 ${large} 0 ${sc(nx0)} ${sc(ny0)}`
        : `M ${sc(nx0)} ${sc(ny0)} A ${R_SEASON_NAME} ${R_SEASON_NAME} 0 ${large} 1 ${sc(nx1)} ${sc(ny1)}`,
    }));
    const text = el("text", {
      "font-family": HOUSE_MONO,
      "font-size": STEP.micro,
      "letter-spacing": "0.12em",
      fill: INK,
      "fill-opacity": STRATUM.margin,
    });
    const tp = el("textPath", { href: `#${id}`, startOffset: "50%", "text-anchor": "middle" }, s.name);
    text.appendChild(tp);
    root.appendChild(text);
  }

  // ── the anchors: a wedge hit-area, a dot, and a name ──
  const marks = el("g", { class: "anchors" });
  root.appendChild(marks);

  anchors.forEach((a, i) => {
    const n = anchors.length;
    const prev = anchors[(i - 1 + n) % n];
    const next = anchors[(i + 1) % n];
    const d0 = i === 0 ? (prev.doy - 365 + a.doy) / 2 : (prev.doy + a.doy) / 2;
    const d1 = i === n - 1 ? (a.doy + next.doy + 365) / 2 : (a.doy + next.doy) / 2;
    const a0 = doyAngle(d0), a1 = doyAngle(d1);
    const large = a1 - a0 > 180 ? 1 : 0;
    const [xo0, yo0] = deg2xy(a0, R_WEDGE_OUT), [xo1, yo1] = deg2xy(a1, R_WEDGE_OUT);
    const [xi1, yi1] = deg2xy(a1, R_WEDGE_IN), [xi0, yi0] = deg2xy(a0, R_WEDGE_IN);

    const isSel = a.key === selected;
    const hit = el("path", {
      class: "annulus-hit",
      d: `M ${sc(xo0)} ${sc(yo0)} A ${R_WEDGE_OUT} ${R_WEDGE_OUT} 0 ${large} 1 ${sc(xo1)} ${sc(yo1)} ` +
         `L ${sc(xi1)} ${sc(yi1)} A ${R_WEDGE_IN} ${R_WEDGE_IN} 0 ${large} 0 ${sc(xi0)} ${sc(yi0)} Z`,
      fill: INK,
      "fill-opacity": 0,
      cursor: onSelect ? "pointer" : null,
      tabindex: onSelect ? "0" : null,
      role: onSelect ? "button" : null,
      "aria-label": `${a.nomen} — ${a.gloss}`,
    });
    if (onSelect) {
      hit.addEventListener("click", () => onSelect(a.key));
      hit.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(a.key); }
      });
    }
    marks.appendChild(hit);

    const ang = doyAngle(a.doy);
    const [dx, dy] = deg2xy(ang, R_ANCHOR);
    // Selection on a sparse ring cannot be opacity alone — at this scale a
    // darker dot among fourteen others is invisible. The dot keeps the ink
    // grammar; a halo around it carries the selection.
    if (isSel) {
      marks.appendChild(el("circle", {
        cx: sc(dx), cy: sc(dy), r: sc(a.dot + 5),
        fill: "none", stroke: INK,
        "stroke-opacity": STRATUM.bracket, "stroke-width": STROKE.fine,
      }));
    }
    marks.appendChild(el("circle", {
      cx: sc(dx), cy: sc(dy), r: sc(a.dot),
      fill: INK,
      "fill-opacity": isSel ? STRATUM.cadence : STRATUM.wave,
    }));

    // No name rides the ring. Good Friday and Easter are two degrees apart and
    // five pairs sit inside six, so radial labels collide at any rotation —
    // the names belong to the tabula beside the diagram, where selection joins
    // the two. The ring carries shape; the table carries text.
  });

  // ── the standing day: the one rubricated mark ──
  if (day) {
    const doy = dayOfYear(day, year);
    const ang = doyAngle(doy);
    const [ix, iy] = deg2xy(ang, R_SEASON - 12);
    const [ox, oy] = deg2xy(ang, R_WEDGE_OUT);
    root.appendChild(el("line", {
      x1: sc(ix), y1: sc(iy), x2: sc(ox), y2: sc(oy),
      stroke: RUBRICA, "stroke-width": STROKE.firm, "stroke-linecap": "round",
    }));
    root.appendChild(el("circle", { cx: sc(ox), cy: sc(oy), r: 4, fill: RUBRICA }));
  }

  // ── the year, at the centre ──
  root.appendChild(el("text", {
    x: 0, y: 8, "text-anchor": "middle",
    "font-family": HOUSE_SERIF, "font-size": STEP.display,
    fill: INK, "fill-opacity": STRATUM.label,
  }, String(year)));

  return svg;
}

/** The names the ring cannot carry. Selection joins the two: a row highlights
 * with its wedge, and clicking either moves both. `a die` counts from the
 * standing day, so the table answers "how far from here" without arithmetic. */
export function annulusTabula(tonus, { year, day = null, selected = "easter", onSelect } = {}) {
  const p = tonus.pascha(year);
  const dayDoy = day ? dayOfYear(day, year) : null;

  const rows = ANCHOR_NAMES
    .filter(([key]) => p[key] != null)
    .map(([key, nomen, gloss]) => ({
      key, nomen, gloss,
      dies: romanDate(p[key]),
      doy: dayOfYear(p[key], year),
    }))
    .sort((a, b) => a.doy - b.doy);

  const columns = [
    { key: "nomen", head: "nomen", gloss: (r) => r.gloss },
    { key: "dies", head: "dies", mono: true },
  ];
  if (dayDoy != null) {
    columns.push({
      key: "doy", head: "a die", mono: true, num: true,
      format: (doy) => { const d = doy - dayDoy; return d > 0 ? `+${d}` : String(d); },
    });
  }

  return tabula(rows, columns, {
    selected, onSelect,
    caption: `The movable feasts of ${year}`,
  });
}
