// ---------------------------------------------------------------------------
// site/diagrams/annulus — the liturgical year as a ring
// ---------------------------------------------------------------------------
// Two calendars, concentric, and the argument is their relationship: the civil
// year on the outside (months, weeks ticked), the liturgical year within it
// (seasons as a banded ring), and the movable feasts riding an orbit between
// them. Septuagesima and Advent are near neighbours on a ring in a way no
// timeline shows, and Easter's wandering drags a third of the year with it.
//
// COMPUTED, NOT TRANSCRIBED. The lab round this descends from carried fifteen
// hand-copied anchors and seven hand-measured season boundaries, all frozen to
// 991. tonus.pascha(year) returns exactly those fifteen — every day-of-year
// matching the transcription — so the diagram takes a year and asks, and the
// seasons fall out of the anchors that bound them. That is the site's thesis
// in one panel: it cannot drift from the library, because it IS the library.
//
// The ring carries shape; the names live in the tabula beside it. Fifteen
// radial labels cannot work here — Good Friday and Easter are two degrees
// apart — so selection joins figure and table instead.

import { INK, RUBRICA, STRATUM, STROKE, STEP, HOUSE_SERIF, HOUSE_SANS, HOUSE_MONO, sc } from "./ink.js";
import { tabula } from "./tabula.js";
import {
  pointAt, arcPath, wedgePath, uprightRotation, isLowerHalf, neighbourMidpoints,
} from "./polar.js";

const NS = "http://www.w3.org/2000/svg";

// The concentric systems, outward: season band, anchor orbit, compass, months.
const R_SEASON = 150;        // the banded liturgical ring
const R_SEASON_NAME = 176;   // season names, outside their band
const R_ANCHOR = 197;        // the feasts' orbit
const R_COMPASS = 228;       // week ticks start here
const R_WEEK = 231.5;        // …and end here
const R_MONTH_TICK = 234;    // month boundaries reach further
const R_BAND_IN = 240;       // the month band
const R_BAND_OUT = 271;
const R_MONTH_NAME = 255.5;
const SEASON_WEIGHT = 8;     // the season ring is a BAND, not a hairline

/** Anchors in ring order. Keys are pascha()'s own; the Latin is the register. */
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

/** Each season runs anchor to anchor, so the boundaries are computed too.
 * `pen` marks the penitential seasons: darker ink, the ink system doing the
 * work a second colour would otherwise be asked to do. */
const SEASONS = [
  { name: "NAT", from: "christmas", to: "epiphany", pen: false },
  { name: "EPI", from: "epiphany", to: "septuagesima", pen: false },
  { name: "LXX", from: "septuagesima", to: "ashWednesday", pen: true },
  { name: "QUAD", from: "ashWednesday", to: "easter", pen: true },
  { name: "PASC", from: "easter", to: "pentecost", pen: false, light: true },
  { name: "PENT", from: "pentecost", to: "adventFirstSunday", pen: false },
  { name: "ADV", from: "adventFirstSunday", to: "christmas", pen: true },
];

const MONTHS = ["IANUARIUS", "FEBRUARIUS", "MARTIUS", "APRILIS", "MAIUS", "IUNIUS",
  "IULIUS", "AUGUSTUS", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
const MONTH_ABBR = ["Ian", "Feb", "Mar", "Apr", "Mai", "Iun",
  "Iul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const doyAngle = (d) => (d / 365) * 360;

const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** Month-boundary days-of-year for a given year. */
function monthBounds(year) {
  const lens = [31, isLeap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const out = [0];
  for (const n of lens) out.push(out[out.length - 1] + n);
  return out;
}

function dayOfYear(date, year) {
  return Math.floor((new Date(date) - Date.UTC(year, 0, 1)) / 86400000) + 1;
}

/** A date read in UTC. tonus is UTC-canonical, and local-time formatting moves
 * a date across midnight — west of Greenwich Easter reads as the day before. */
function romanDate(date) {
  const d = new Date(date);
  return `${MONTH_ABBR[d.getUTCMonth()]} ${String(d.getUTCDate()).padStart(2, "0")}`;
}

/** The year in Roman numerals — the register the centre asks for. */
function roman(n) {
  const table = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"],
    [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let out = "";
  for (const [v, s] of table) while (n >= v) { out += s; n -= v; }
  return out;
}

function el(tag, attrs, text) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  if (text != null) e.textContent = text;
  return e;
}


/** The anchors for a year, computed and sorted round the ring. */
function anchorsFor(tonus, year) {
  const p = tonus.pascha(year);
  return ANCHOR_NAMES
    .filter(([key]) => p[key] != null)
    .map(([key, nomen, gloss, dot]) => ({
      key, nomen, gloss, dot,
      date: p[key],
      dies: romanDate(p[key]),
      doy: dayOfYear(p[key], year),
    }))
    .sort((a, b) => a.doy - b.doy);
}

/**
 * Build the annulus.
 *
 * @param {object} tonus  the library (needs `pascha`)
 * @param {object} opts
 * @param {number} opts.year        the year to ring
 * @param {Date}   [opts.day]       the standing day, marked in rubrica
 * @param {string} [opts.selected]  anchor key
 * @param {(key: string) => void} [opts.onSelect]
 */
export function annulus(tonus, { year, day = null, selected = "easter", onSelect } = {}) {
  const anchors = anchorsFor(tonus, year);
  const byKey = new Map(anchors.map((a) => [a.key, a]));
  const bounds = monthBounds(year);

  const svg = el("svg", {
    class: "annulus", viewBox: "0 0 600 600", xmlns: NS,
    role: "img", "aria-label": `The liturgical year ${year} as a ring`,
  });
  const defs = el("defs", {});
  svg.appendChild(defs);
  const root = el("g", { transform: "translate(300 300)" });
  svg.appendChild(root);

  // ── the season band: a ring of arcs, each season anchor to anchor ──
  for (const s of SEASONS) {
    const from = byKey.get(s.from), to = byKey.get(s.to);
    if (!from || !to) continue;
    let a0 = doyAngle(from.doy), a1 = doyAngle(to.doy);
    if (a1 < a0) a1 += 360;
    // A hair of air between neighbours, so the band reads as segments.
    const gap = 0.6;
    root.appendChild(el("path", {
      d: arcPath(a0 + gap, a1 - gap, R_SEASON),
      fill: "none",
      stroke: INK,
      "stroke-opacity": s.pen ? STRATUM.spark : (s.light ? STRATUM.rail : STRATUM.bracket),
      "stroke-width": SEASON_WEIGHT,
    }));

    const mid = ((a0 + a1) / 2) % 360;
    const flip = isLowerHalf(mid);
    const id = `annulus-${year}-arc-${s.name}`;
    defs.appendChild(el("path", {
      id,
      d: arcPath(a0, a1, R_SEASON_NAME, flip ? 0 : 1),
    }));
    const t = el("text", {
      "font-family": HOUSE_SANS, "font-size": STEP.micro,
      "letter-spacing": "0.14em", fill: INK, "fill-opacity": STRATUM.margin,
    });
    t.appendChild(el("textPath",
      { href: `#${id}`, startOffset: "50%", "text-anchor": "middle" }, s.name));
    root.appendChild(t);
  }

  // ── the anchor orbit, and the compass and month-band circles ──
  for (const r of [R_ANCHOR, R_COMPASS, R_MONTH_TICK, R_BAND_IN, R_BAND_OUT]) {
    root.appendChild(el("circle", {
      r, fill: "none", stroke: INK,
      "stroke-opacity": STRATUM.rail, "stroke-width": STROKE.fine,
    }));
  }

  // ── the compass: a tick per week, longer at each month boundary ──
  const ticks = el("g", { class: "annulus-ticks" });
  root.appendChild(ticks);
  for (let d = 0; d < 365; d += 7) {
    const a = doyAngle(d);
    const [x1, y1] = pointAt(a, R_COMPASS), [x2, y2] = pointAt(a, R_WEEK);
    ticks.appendChild(el("line", {
      x1: sc(x1), y1: sc(y1), x2: sc(x2), y2: sc(y2),
      stroke: INK, "stroke-opacity": STRATUM.rail, "stroke-width": 0.4,
    }));
  }
  for (let i = 0; i < 12; i++) {
    const a = doyAngle(bounds[i]);
    const [x1, y1] = pointAt(a, R_COMPASS), [x2, y2] = pointAt(a, R_MONTH_TICK);
    ticks.appendChild(el("line", {
      x1: sc(x1), y1: sc(y1), x2: sc(x2), y2: sc(y2),
      stroke: INK, "stroke-opacity": STRATUM.bracket, "stroke-width": 0.5,
    }));
    const [bx1, by1] = pointAt(a, R_BAND_IN), [bx2, by2] = pointAt(a, R_BAND_OUT);
    ticks.appendChild(el("line", {
      x1: sc(bx1), y1: sc(by1), x2: sc(bx2), y2: sc(by2),
      stroke: INK, "stroke-opacity": STRATUM.rail, "stroke-width": STROKE.fine,
    }));
  }

  // ── the month names, set upright around the band ──
  const names = el("g", { class: "annulus-months" });
  root.appendChild(names);
  for (let i = 0; i < 12; i++) {
    const mid = doyAngle((bounds[i] + bounds[i + 1]) / 2);
    const [x, y] = pointAt(mid, R_MONTH_NAME);
    const rot = uprightRotation(mid);
    names.appendChild(el("text", {
      transform: `translate(${sc(x)} ${sc(y)}) rotate(${sc(rot)})`,
      "text-anchor": "middle", "dominant-baseline": "central",
      "font-family": HOUSE_SANS, "font-size": STEP.micro,
      "letter-spacing": "0.16em",
      fill: INK, "fill-opacity": STRATUM.margin,
    }, MONTHS[i]));
  }

  // ── the centre ──
  root.appendChild(el("text", {
    y: -6, "text-anchor": "middle", "font-family": HOUSE_SERIF,
    "font-size": STEP.body, "font-style": "italic",
    fill: INK, "fill-opacity": STRATUM.label,
  }, "Annus Domini"));
  root.appendChild(el("text", {
    y: 22, "text-anchor": "middle", "font-family": HOUSE_MONO,
    "font-size": STEP.label, "letter-spacing": "0.08em",
    fill: INK, "fill-opacity": STRATUM.margin,
  }, roman(year)));

  // ── the anchors on their orbit ──
  const marks = el("g", { class: "annulus-anchors" });
  root.appendChild(marks);
  anchors.forEach((a, i) => {
    const n = anchors.length;
    const prev = anchors[(i - 1 + n) % n], next = anchors[(i + 1) % n];
    const d0 = i === 0 ? (prev.doy - 365 + a.doy) / 2 : (prev.doy + a.doy) / 2;
    const d1 = i === n - 1 ? (a.doy + next.doy + 365) / 2 : (a.doy + next.doy) / 2;
    const isSel = a.key === selected;
    const ang = doyAngle(a.doy);
    const [x, y] = pointAt(ang, R_ANCHOR);

    // Selection is a rubricated roundel — the one place colour is spent here.
    if (isSel) {
      marks.appendChild(el("circle", {
        cx: sc(x), cy: sc(y), r: sc(a.dot + 7),
        fill: "none", stroke: RUBRICA, "stroke-width": 1.6,
      }));
    }
    marks.appendChild(el("circle", {
      cx: sc(x), cy: sc(y), r: sc(a.dot),
      fill: isSel ? RUBRICA : INK,
      "fill-opacity": isSel ? 1 : STRATUM.cadence,
    }));

    // A wedge of the ring is the hit area, so small dots stay clickable.
    const a0 = doyAngle(d0), a1 = doyAngle(d1);
    const hit = el("path", {
      class: "annulus-hit",
      d: wedgePath(a0, a1, R_SEASON, R_COMPASS),
      fill: INK, "fill-opacity": 0,
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
  });

  // ── the standing day, on the same orbit ──
  if (day) {
    const [dx, dy] = pointAt(doyAngle(dayOfYear(day, year)), R_ANCHOR);
    marks.appendChild(el("circle", { cx: sc(dx), cy: sc(dy), r: 3.4, fill: RUBRICA }));
  }

  return svg;
}

/** The names the ring cannot carry. Selection joins the two: clicking a row or
 * its anchor moves both. `a die` counts from the standing day. */
export function annulusTabula(tonus, { year, day = null, selected = "easter", onSelect } = {}) {
  const rows = anchorsFor(tonus, year);
  const dayDoy = day ? dayOfYear(day, year) : null;

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
    selected, onSelect, caption: `The movable feasts of ${year}`,
  });
}
