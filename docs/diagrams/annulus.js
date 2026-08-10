// ---------------------------------------------------------------------------
// site/diagrams/annulus — the liturgical year as a ring
// ---------------------------------------------------------------------------
// Two calendars, concentric, and the argument is their relationship: the civil
// year on the outside (months, weeks ticked), the liturgical year within it
// (seasons as a banded ring), and the movable feasts riding an orbit between
// them. Septuagesima and Advent are near neighbors on a ring in a way no
// timeline shows, and Easter's wandering drags a third of the year with it.
//
// COMPUTED, NOT TRANSCRIBED. The lab round this descends from carried fifteen
// hand-copied anchors with their Latin names and seven hand-measured season
// boundaries, all frozen to 991. The library answers every one of them:
// pascha(year) dates the movable feasts, festum({ date }) names each one and
// reports the season it falls in, and each season states its own seasonStart
// and seasonEnd. So the diagram asks and draws.
//
// What is left here is only what a DRAWING has to decide: five radii, a band
// weight, which feasts get a larger dot, and which seasons read darker. Those
// are rendering choices. Every fact about the calendar comes from tonus, which
// is the point — the panel cannot drift from the library, because it has no
// copy of the library to drift from.
//
// The ring carries shape; the names live in the tabula beside it. Fifteen
// radial labels cannot work here — Good Friday and Easter are two degrees
// apart — so selection joins figure and table instead.

import { INK, RUBRICA, STRATUM, STROKE, STEP, HOUSE_SERIF, HOUSE_MONO, sc } from "./ink.js";
import { tabula } from "./tabula.js";
import {
  pointAt, arcPath, wedgePath, uprightRotation, isLowerHalf, neighborMidpoints,
} from "./polar.js";
import { FRAME, wheel, outerRing } from "./frame.js";

const NS = "http://www.w3.org/2000/svg";

// The concentric systems, outward: season band, anchor orbit, compass, months.
const R_SEASON = 150;        // the banded liturgical ring
const R_SEASON_NAME = 176;   // season names, outside their band
const R_ANCHOR = 197;        // the feasts' orbit
const R_COMPASS = FRAME.compass;   // the ring both wheels share begins here
const SEASON_WEIGHT = 8;     // the season ring is a BAND, not a hairline

/** The anchors, in the order pascha() reports them. Only the dot size is the
 * diagram's own business: how much a feast weighs in the drawing is a
 * rendering decision, not a fact about the calendar. Everything else — the
 * date, the Latin name, the season it falls in — is asked of the library. */
const ANCHOR_WEIGHT = {
  easter: 5.0,
  christmas: 3.6, epiphany: 3.6, pentecost: 3.6,
};

/** The seasons tonus does NOT ink lightly: penitential time reads darker, and
 * paschal time lighter, which is the ink system doing what a second colour
 * would otherwise be asked to do. Keyed by the library's own season codes. */
const PENITENTIAL = new Set(["quadp", "quad", "adv"]);
const PASCHAL = new Set(["pasc"]);

const MONTHS = ["IANUARIUS", "FEBRUARIUS", "MARTIUS", "APRILIS", "MAIUS", "IUNIUS",
  "IULIUS", "AUGUSTUS", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];

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

/** Two dates on the same UTC day. Compared as instants rather than by
 *  getUTCDate, so a seasonStart carrying a time of day still matches. */
function sameDay(a, b) {
  if (!a || !b) return false;
  const x = new Date(a), y = new Date(b);
  return x.getUTCFullYear() === y.getUTCFullYear()
    && x.getUTCMonth() === y.getUTCMonth()
    && x.getUTCDate() === y.getUTCDate();
}

/** A date read in UTC. tonus is UTC-canonical, and local-time formatting moves
 * a date across midnight — west of Greenwich Easter reads as the day before. */
function romanDate(date) {
  const d = new Date(date);
  const m = MONTHS[d.getUTCMonth()];
  return `${m[0]}${m.slice(1, 3).toLowerCase()} ${String(d.getUTCDate()).padStart(2, "0")}`;
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


/** The principal fixed feasts — the ones that hold a place in the year
 * regardless of where Easter falls. Their ids ARE their dates (`MM-DD`), so
 * the calendar dates them and this list only says which ones matter enough to
 * stand beside the movable anchors. Christmas and the Epiphany are deliberately
 * absent: pascha() already reports both, and a day cannot be two marks.
 *
 * All are duplex-i in the Tridentine ranking — the same rank as Easter and
 * Pentecost — so this is the received hierarchy, not a preference. */
const FIXED = ["03-25", "06-24", "06-29", "08-15", "09-29", "11-01", "12-08"];

/** The anchors for a year: pascha() dates the movable feasts, festum() names
 * each one and says which season it falls in, and the principal fixed feasts
 * join them. Nothing is transcribed. */
function anchorsFor(tonus, year) {
  const p = tonus.pascha(year);
  // Whatever anchors pascha() reports — not a list of them kept here. It dates
  // fifteen today; a sixteenth would arrive on the ring without an edit.
  // Two of pascha()'s anchors are not movable at all — Christmas and the
  // Epiphany keep their dates and are reported here because the year is
  // reckoned around them, so they are marked as what they are.
  const FIXED_ANCHORS = new Set(["christmas", "epiphany"]);
  const movable = Object.keys(p)
    .filter((key) => key !== "year" && p[key] instanceof Date)
    .map((key) => ({ key, date: p[key], fixed: FIXED_ANCHORS.has(key) }));

  // A fixed feast may be outranked by the day it lands on — the Annunciation
  // inside Holy Week, say — in which case festum() reports the occurrent feast
  // first and this one is simply not kept. The calendar decides, not the list.
  const fixed = FIXED.map((id) => {
    const [m, d] = id.split("-").map(Number);
    const date = new Date(Date.UTC(year, m - 1, d));
    return { key: id, date, fixed: true, id };
  }).filter(({ date, id }) =>
    tonus.festum({ date }).some((f) => f.id === id));

  const taken = new Set(movable.map((a) => a.date.getTime()));

  return [...movable, ...fixed.filter((a) => !taken.has(a.date.getTime()))]
    .map(({ key, date, fixed: isFixed, id }) => {
      const all = tonus.festum({ date: new Date(date) });
      // For a fixed feast, name the feast ITSELF rather than whatever outranks
      // it that day; for a movable anchor, the day's first feast is the point.
      const feast = (isFixed && all.find((f) => f.id === id)) || all[0] || null;
      return {
        key,
        nomen: feast?.nomen ?? key,
        season: feast?.season ?? null,
        tempus: feast?.tempus ?? null,
        fixed: isFixed,
        dot: ANCHOR_WEIGHT[key] ?? (isFixed ? 2.0 : 2.4),
        date,
        dies: romanDate(date),
        doy: dayOfYear(date, year),
      };
    })
    .sort((a, b) => a.doy - b.doy);
}

/** The year's seasons as RUNS of consecutive days — each stretch the civil year
 * actually shows, in the order it shows them. Walking the year and asking is
 * what makes the ring answerable for any year: the boundaries are the
 * library's, not a table of anchor pairs.
 *
 * A RUN, NOT A SEASON CODE. Nativitas falls twice in one civil year — the tail
 * of the last Advent's Christmas in January, and again from December 25 — so
 * collecting one entry per code kept whichever came first and silently dropped
 * the other. That is the December band that went missing from the ring.
 *
 * Asking each day also means a run is bounded by the year by construction, so
 * nothing needs clamping into it: a season's own seasonStart/seasonEnd are the
 * LITURGICAL bounds and need not fall inside the year being drawn (Pentecost
 * asked about a June day runs to the NEXT Advent, in the following November),
 * which is what made the band go out of round when those dates were used as
 * angles directly. */
function seasonsFor(tonus, year) {
  const runs = [];
  const days = isLeap(year) ? 366 : 365;
  for (let d = 0; d < days; d++) {
    const feast = tonus.festum({ date: new Date(Date.UTC(year, 0, 1 + d)) })[0];
    if (!feast?.season) continue;
    const doy = d + 1;
    const last = runs[runs.length - 1];
    // Same season as yesterday, and yesterday was yesterday: extend the run.
    if (last && last.season === feast.season && last.to === doy - 1) {
      last.to = doy;
      continue;
    }
    runs.push({
      season: feast.season,
      tempus: feast.tempus ?? null,
      from: doy,
      to: doy,
      // Does the season BEGIN here, or is this the tail of one that opened in
      // the year before? The day reports its own seasonStart, so the run can
      // say which of the two it is — and the label goes on the opening arc.
      opens: sameDay(feast.seasonStart, new Date(Date.UTC(year, 0, 1 + d))),
      penitential: PENITENTIAL.has(feast.season),
      paschal: PASCHAL.has(feast.season),
    });
  }
  return runs;
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
  const seasons = seasonsFor(tonus, year);
  const bounds = monthBounds(year);

  const { svg, defs, root } = wheel({
    className: "annulus",
    label: `The liturgical year ${year} as a ring`,
  });

  // ── the season band: one arc per run of days the year actually shows ──
  for (const [i, s] of seasons.entries()) {
    // The run is already inside the year, so these are angles directly — no
    // clamping, and no arc that wraps past itself. Nativitas draws as the two
    // arcs it is: a few days in January, and the stretch from December 25.
    const a0 = doyAngle(s.from);
    const a1 = doyAngle(s.to);
    // A hair of air between neighbors, so the band reads as segments.
    const gap = 0.6;
    root.appendChild(el("path", {
      d: arcPath(a0 + gap, a1 - gap, R_SEASON),
      fill: "none",
      stroke: INK,
      "stroke-opacity": s.penitential ? STRATUM.spark
        : (s.paschal ? STRATUM.rail : STRATUM.bracket),
      "stroke-width": SEASON_WEIGHT,
    }));

    // A season split across the wrap is still ONE season, so it is named once —
    // on the arc where the season OPENS, which the run itself reports. For
    // Nativitas that is the December stretch beginning at Christmas, not the
    // days trailing into January. Deliberately not the longer arc: those two
    // run 8 days and 7, so width would settle it by a single day and could
    // move the name from one side of the ring to the other between years.
    if (!s.opens) continue;

    const mid = ((a0 + a1) / 2) % 360;
    const flip = isLowerHalf(mid);
    // Indexed, not keyed by season: two runs share a code, and a duplicate id
    // would send both textPaths to whichever arc the document defined first.
    const id = `annulus-${year}-arc-${i}-${s.season}`;
    defs.appendChild(el("path", {
      id,
      d: arcPath(a0, a1, R_SEASON_NAME, flip ? 0 : 1),
    }));
    const t = el("text", {
      "font-family": HOUSE_SERIF, "font-size": STEP.micro,
      "letter-spacing": "0.09em", fill: INK, "fill-opacity": STRATUM.margin,
    });
    // The library's own season code, set as the books abbreviate.
    t.appendChild(el("textPath",
      { href: `#${id}`, startOffset: "50%", "text-anchor": "middle" },
      s.season.toUpperCase()));
    root.appendChild(t);
  }

  // ── the anchor orbit, then the ring both wheels wear ──
  root.appendChild(el("circle", {
    r: R_ANCHOR, fill: "none", stroke: INK,
    "stroke-opacity": STRATUM.rail, "stroke-width": STROKE.fine,
  }));
  outerRing(root, { names: MONTHS, bounds, period: 365, ticks: 7 });

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

  // ── the standing day ──
  // The selected anchor already wears a rubricated roundel, so the day cannot
  // also be a rubrica dot on the same orbit — the two read as one another. It
  // is a radius instead: a hand on the year, pointing from the centre out
  // through the ring, which is what a standing day is.
  if (day) {
    const a = doyAngle(dayOfYear(day, year));
    const [ix, iy] = pointAt(a, R_SEASON + SEASON_WEIGHT / 2 + 3);
    const [ox, oy] = pointAt(a, FRAME.tick);
    marks.appendChild(el("line", {
      x1: sc(ix), y1: sc(iy), x2: sc(ox), y2: sc(oy),
      stroke: RUBRICA, "stroke-width": 1, "stroke-opacity": 0.5,
    }));
    const [dx, dy] = pointAt(a, R_ANCHOR);
    marks.appendChild(el("circle", { cx: sc(dx), cy: sc(dy), r: 3.4, fill: RUBRICA }));
  }

  return svg;
}

/** The names the ring cannot carry. Selection joins the two: clicking a row or
 * its anchor moves both. `a die` counts from the standing day. */
export function annulusTabula(tonus, { year, selected = "easter", onSelect } = {}) {
  // Name, season, date. The signed distance from the standing day that used to
  // close this table was arithmetic the ring already draws: how far off a feast
  // is IS the angle between its mark and the day's.
  return tabula(anchorsFor(tonus, year), [
    // The name and the season are the library's own words.
    { key: "nomen", head: "nomen", gloss: (r) => r.tempus ?? "" },
    // A fixed feast keeps its date whatever Easter does; a movable one is
    // reckoned from Easter. Saying which is which is the whole point of
    // showing them together, and the date alone cannot say it.
    { key: "dies", head: "dies", mono: true,
      gloss: (r) => r.fixed ? "" : "mobilis" },
  ], { selected, onSelect });
}
