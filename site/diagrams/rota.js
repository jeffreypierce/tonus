// ---------------------------------------------------------------------------
// site/diagrams/rota — the wheel of the spheres, sounding
// ---------------------------------------------------------------------------
// Seven planets on seven rings, each at its true longitude for a moment, and
// each sounding one string of the Greater Perfect System: Saturn the lowest
// (hypate meson) out at the slowest sphere, the Sun the mese at the middle,
// the Moon the highest and nearest. The Ptolemaic order IS the scale order,
// which is the whole claim of the musica mundana — the spheres are a tuning.
//
// The chords are the ASPECTS. Two planets at a trine stand a third apart; at a
// square, a tritone. tonus computes the angle, its orb and strength, AND the
// interval it sounds — so an aspect line here is drawn at the weight of its
// strength and named by the library, not by a table.
//
// COMPUTED, NOT TRANSCRIBED. The round this descends from carried seven bodies
// with hand-copied longitudes, x/y positions, Greek string names and dot sizes,
// frozen to one moment. caelum(date) places the bodies and harmonia(cosmos)
// voices them: every longitude, every Greek name, every pitch and presence
// matches the transcription, and the aspects arrive already named.
//
// Nothing here is a fact about the sky. The radii are evenly spaced in
// Ptolemaic order and the glyph sizes follow presence; those are drawing
// decisions. Everything else is asked.

import { INK, RUBRICA, STRATUM, STROKE, STEP, HOUSE_SERIF, HOUSE_SANS, HOUSE_MONO, sc } from "./ink.js";
import { tabula } from "./tabula.js";
import { pointAt } from "./polar.js";
import { FRAME, wheel, outerRing } from "./frame.js";
// The twelve signs come from the library, not a copy of them: a body's `sign`
// is one of these, so the wheel's sectors and the table's words are the same
// list. (A named export, like MODES and CADENTIAE — not on the default object.)
import { SIGNA } from "./signs.js";

const NS = "http://www.w3.org/2000/svg";

/** Where 0° Aries sits on the shared frame.
 *
 * The frame turns the calendar's way — clockwise from twelve — and the zodiac
 * turns the SAME way, because a calendar date IS the Sun's longitude: day 1 of
 * 991 finds the Sun at 279°, day 80 at 359°, day 152 at 68°, all increasing
 * together. So the signs do not mirror; they are simply offset.
 *
 * The offset is the vernal point's own place in the civil year — the day the
 * Sun crosses 0° Aries, as an angle. Measured rather than assumed: it comes out
 * near 82° for 991 and drifts with precession over centuries, so it is computed
 * per year rather than frozen. Checked across the year, a single offset holds
 * to about two degrees; the residue is the orbit's eccentricity. */
function eclipticTurn(tonus, year) {
  // The Sun's longitude on a known day, turned back into a frame angle.
  const day = new Date(Date.UTC(year, 5, 1));
  const doy = Math.floor((day - Date.UTC(year, 0, 1)) / 86400000) + 1;
  const cal = (doy / 365) * 360;
  const sun = tonus.caelum({ date: day }).bodies.find((b) => b.name === "Sun");
  return (((cal - sun.geo.lon) % 360) + 360) % 360;
}

// The spheres, inward to outward. The innermost radius and the step between
// them are drawing choices.
const R_FIRST = 42, R_STEP = 31;

/** THE CHALDEAN ORDER — Moon nearest, Saturn furthest, by MEAN motion. This is
 * received doctrine, not a measurement: it is the order Ptolemy and Boethius
 * inherited, and the order the musica mundana argues is a scale. It cannot be
 * taken from one moment's geometry — sorting this instant's geocentric speed
 * puts Jupiter inside Mars, because Mars is near a retrograde station, and
 * sorting geocentric distance puts the Moon and Mars inside the Sun. harmonia
 * reports the bodies in its own order (the Sun first, as the mese), so the
 * spheres are named here. */
const CHALDEAN = ["Moon", "Mercury", "Venus", "Sun", "Mars", "Jupiter", "Saturn"];

function el(tag, attrs, text) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  if (text != null) e.textContent = text;
  return e;
}

/**
 * The sounding sky for a moment: one row per planet, on its own ring.
 *
 * @param {object} tonus
 * @param {object} opts
 * @param {Date}   [opts.date]  the moment (default: the library's own epoch)
 */
export function rotaRows(tonus, { date } = {}) {
  const cosmos = date ? tonus.caelum({ date }) : tonus.caelum();
  const H = tonus.harmonia(cosmos);

  return H.tabula
    .map((v, i) => {
      const body = H.bodies[i];
      const sphere = CHALDEAN.indexOf(v.name);
      return {
        key: v.name,
        nomen: v.nomen,
        symbol: body.symbol,
        // The string of the Greater Perfect System this sphere sounds.
        chorda: v.greekName,
        spn: v.spn,
        midi: v.midi,
        hz: v.hz,
        presence: v.presence,
        motion: v.motion,
        retrograde: v.retrograde,
        sign: body.signum,
        // One ring per sphere, at its place in the Chaldean order.
        radius: R_FIRST + (sphere < 0 ? i : sphere) * R_STEP,
        sphere,
        longitude: body.geo.lon,
        aspectCount: v.aspectCount,
      };
    })
    .sort((a, b) => a.sphere - b.sphere);
}

/** The aspects, as the library names them: an angle, a strength, an interval. */
export function rotaAspects(tonus, { date } = {}) {
  const cosmos = date ? tonus.caelum({ date }) : tonus.caelum();
  return tonus.harmonia(cosmos).aspects;
}

/**
 * The rota.
 *
 * @param {object} tonus
 * @param {object} opts
 * @param {Date}   [opts.date]
 * @param {string} [opts.selected]  a body name
 * @param {boolean} [opts.aspects]  draw the aspect chords (default true)
 * @param {(key: string) => void} [opts.onSelect]
 */
export function rota(tonus, { date, selected, aspects = true, onSelect } = {}) {
  const when = date ?? tonus.caelum().date;
  const turn = eclipticTurn(tonus, new Date(when).getUTCFullYear());
  const eclipticAngle = (lon) => (((lon + turn) % 360) + 360) % 360;
  const rows = rotaRows(tonus, { date });
  const chords = aspects ? rotaAspects(tonus, { date }) : [];
  const byName = new Map(rows.map((r) => [r.key, r]));
  const sel = selected ?? rows[0]?.key;

  const { svg, root } = wheel({
    className: "rota",
    label: "The wheel of the spheres, sounding",
  });

  // ── the spheres: one ring per planet ──
  for (const r of rows) {
    root.appendChild(el("circle", {
      r: r.radius, fill: "none", stroke: INK,
      "stroke-opacity": STRATUM.rail, "stroke-width": STROKE.hair,
    }));
  }

  // ── the ring both wheels wear, labelled with the twelve signs ──
  // The frame turns the calendar's way — clockwise from twelve — so the signs
  // are placed at their longitudes within it rather than in the ecliptic's own
  // sense. ECLIPTIC_TURN is what carries 0° Aries to where the frame puts it.
  outerRing(root, { names: [...SIGNA], period: 360, ticks: 10, offset: turn });

  // ── the chords: an aspect line at the weight of its strength ──
  const at = (r) => pointAt(eclipticAngle(r.longitude), r.radius);
  for (const asp of chords) {
    const [aName, bName] = asp.bodies;
    const a = byName.get(aName), b = byName.get(bName);
    if (!a || !b) continue;
    const [x1, y1] = at(a), [x2, y2] = at(b);
    const touches = a.key === sel || b.key === sel;
    root.appendChild(el("line", {
      x1: sc(x1), y1: sc(y1), x2: sc(x2), y2: sc(y2),
      stroke: INK,
      // Strength is opacity, as confidence is everywhere in this house.
      "stroke-opacity": (touches ? 0.9 : STRATUM.spark) * asp.strength,
      "stroke-width": sc(0.6 + 1.2 * asp.strength),
    }));
  }

  // ── the planets, each on its ring ──
  for (const r of rows) {
    const [x, y] = at(r);
    const isSel = r.key === sel;
    // Presence sizes the glyph: how strongly this sphere sounds now.
    const dot = 2.2 + 4.6 * r.presence;

    if (isSel) {
      root.appendChild(el("circle", {
        cx: sc(x), cy: sc(y), r: sc(dot + 7),
        fill: "none", stroke: RUBRICA, "stroke-width": 1.6,
      }));
    }
    root.appendChild(el("circle", {
      cx: sc(x), cy: sc(y), r: sc(dot),
      fill: isSel ? RUBRICA : INK,
      "fill-opacity": isSel ? 1 : STRATUM.wave,
    }));

    // The glyph outside its dot, turned to stay upright.
    const [gx, gy] = pointAt(eclipticAngle(r.longitude), r.radius + dot + 11);
    root.appendChild(el("text", {
      x: sc(gx), y: sc(gy), "text-anchor": "middle", "dominant-baseline": "central",
      "font-family": HOUSE_SERIF, "font-size": STEP.caption,
      fill: isSel ? RUBRICA : INK,
      "fill-opacity": isSel ? 1 : STRATUM.letters,
    }, r.symbol + (r.retrograde ? "℞" : "")));

    if (onSelect) {
      const hit = el("circle", {
        cx: sc(x), cy: sc(y), r: sc(dot + 12),
        fill: INK, "fill-opacity": 0,
        cursor: "pointer", tabindex: "0", role: "button",
        "aria-label": `${r.nomen} — ${r.chorda}, ${r.spn}`,
      });
      hit.addEventListener("click", () => onSelect(r.key));
      hit.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(r.key); }
      });
      root.appendChild(hit);
    }
  }

  // ── the centre: the earth, and what the sky reads as ──
  root.appendChild(el("circle", {
    r: 3, fill: INK, "fill-opacity": STRATUM.cadence,
  }));
  root.appendChild(el("text", {
    x: 0, y: 22, "text-anchor": "middle",
    "font-family": HOUSE_MONO, "font-size": STEP.micro,
    "letter-spacing": "0.1em", fill: INK, "fill-opacity": STRATUM.margin,
  }, "TERRA"));

  return svg;
}

/** The spheres and their strings. */
export function rotaTabula(tonus, { date, selected, onSelect } = {}) {
  const rows = rotaRows(tonus, { date });
  const sel = selected ?? rows[0]?.key;

  return tabula(rows, [
    { key: "nomen", head: "sphaera", gloss: (r) => r.retrograde ? "retrogradus" : "" },
    { key: "chorda", head: "chorda" },
    { key: "spn", head: "nota", mono: true },
    { key: "hz", head: "hz", mono: true, num: true, format: (v) => v.toFixed(2) },
    { key: "presence", head: "praesentia", mono: true, num: true,
      format: (v) => v.toFixed(3) },
    { key: "sign", head: "signum" },
  ], { selected: sel, onSelect, caption: "The seven spheres, sounding" });
}

/** The aspects as chords: what the sky is playing, named by the library. */
export function rotaAspectTabula(tonus, { date } = {}) {
  const rows = rotaAspects(tonus, { date }).map((a, i) => ({
    key: String(i),
    aspectus: a.type,
    bodies: a.bodies.join(" · "),
    intervallum: a.interval.alias || a.interval.nomen,
    consonantia: a.interval.consonance,
    angulus: a.angle,
    vis: a.strength,
  }));

  return tabula(rows, [
    { key: "aspectus", head: "aspectus" },
    { key: "bodies", head: "corpora" },
    { key: "intervallum", head: "intervallum", gloss: (r) => r.consonantia },
    { key: "angulus", head: "angulus", mono: true, num: true,
      format: (v) => `${v.toFixed(1)}°` },
    { key: "vis", head: "vis", mono: true, num: true, format: (v) => v.toFixed(3) },
  ], { caption: "The chords the spheres sound" });
}
