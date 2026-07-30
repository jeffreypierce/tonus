// ---------------------------------------------------------------------------
// site/diagrams/chorda — the monochord, and the ruler beside it
// ---------------------------------------------------------------------------
// Two figures for one scale, because the medieval and the modern ways of
// measuring a tone disagree in an instructive way.
//
// THE MONOCHORD is the instrument Guido's readers had: one string between two
// bridges, stopped where a ratio divides it. A pitch at ratio r sounds when the
// string is stopped at 1/r of its length, so the marks crowd toward the far
// bridge as the pitches rise — the octave sits at the halfway point, and the
// spacing IS the arithmetic. Nothing about it is linear in pitch.
//
// THE REGULA is the same scale laid out in cents, evenly, with the equal
// -tempered grid behind it. Where a mark sits off its grid line is where
// Pythagorean tuning and the piano disagree.
//
// COMPUTED, NOT TRANSCRIBED. The round this descends from carried eight rows of
// hand-copied hz, cents, ratios and string fractions, frozen to mode 7 on G.
// temperamentum({ mode }).gamut() returns all of it for any mode, and seven of
// the eight match the transcription to the cent.
//
// The eighth is worth knowing about: the lab's seventh was 704.79 Hz at +15.6¢,
// where the library computes 695.31 at −7.8¢. The difference is 23.4 cents — a
// Pythagorean comma — so the lab was showing the seventh a comma sharp, and
// labelled it `septima (irregularis)` rather than giving it a clean fraction.
// This draws what temperamentum returns: the natural diatonic seventh, 8/9.
//
// No sound. The lab round had a Web Audio voice; tonus does no playback, and
// the sonic labs stay in orreliquum.

import { INK, RUBRICA, STRATUM, STROKE, STEP, HOUSE_SERIF, HOUSE_MONO, sc } from "./ink.js";
import { tabula } from "./tabula.js";

const NS = "http://www.w3.org/2000/svg";

// The string: two bridges, and the span between them.
const NUT = 60, LEN = 680;
const STRING_Y = 70;
const RULER_Y = 80;

/** A string fraction as the books write it: the pitch ratio inverted, since a
 * pitch at 3/2 stops the string at 2/3. Continued fractions find the small
 * whole-number pair; anything that needs large terms is not a simple ratio and
 * prints as a decimal, which is itself the useful fact. */
function fractionFor(fr) {
  // Stern–Brocot: walk the mediant toward the value. Exact for every ratio a
  // Pythagorean chain produces (their denominators are powers of 2 and 3), and
  // it stops rather than drifting when a value is not a simple ratio.
  let [loN, loD, hiN, hiD] = [0, 1, 1, 0];
  for (let i = 0; i < 64; i++) {
    const n = loN + hiN, d = loD + hiD;
    if (d > 4096) break;
    const v = n / d;
    if (Math.abs(v - fr) < 1e-9) return `${n}/${d}`;
    if (v < fr) [loN, loD] = [n, d]; else [hiN, hiD] = [n, d];
  }
  return fr.toFixed(4);
}

function el(tag, attrs, text) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
  if (text != null) e.textContent = text;
  return e;
}

/**
 * The scale as the chorda draws it: one row per degree of the octave, carrying
 * both ways of measuring — the string fraction and the cents.
 */
export function chordaRows(tonus, { mode = 7 } = {}) {
  const T = tonus.temperamentum({ mode });
  const g = T.gamut();
  if (!g.length) return [];

  const base = g[0].hz;
  // The mode's structural degrees, tuned: the finalis and the reciting tone.
  // The tenor is not a fixed interval from the finalis — mode 3's sits a sixth
  // up, mode 8's a fourth — so the library is asked rather than assumed.
  const M = T.modus(mode);
  const finalisPc = M.finalis.pitch.pc;
  const tenorPc = M.reciting.pitch.pc;
  // Each step's medieval name and its place on the Guidonian hand ride along.
  const stepFor = new Map(
    (M.ambitusNotes ?? []).map((n) => [n.pitch.pc, n.step]),
  );
  stepFor.set(finalisPc, M.finalis.step);
  stepFor.set(tenorPc, M.reciting.step);

  return g.map((row, i) => {
    // The interval the library names, measured in semitones from the finalis;
    // it carries the Latin (Diapente, Diapason) and the consonance class.
    const iv = T.intervallum(0, row.midi - g[0].midi);
    // A pitch at ratio r stops the string at 1/r of its length, so the string
    // fraction is the sounding ratio inverted.
    const fr = base / row.hz;
    const isOctave = i === g.length - 1;
    const step = stepFor.get(row.pc);
    return {
      key: row.spn,
      spn: row.spn,
      litera: row.spn.replace(/\d/g, "") + (isOctave ? "′" : ""),
      hz: row.hz,
      // Cents of the TUNING, from the library's own table — the whole point of
      // the regula is that these are not the equal-tempered round numbers.
      cents: 1200 * Math.log2(row.hz / base),
      aequalis: iv.cents,          // where equal temperament would put it
      fr,
      fraction: fractionFor(fr),
      offset: row.offset,
      intervallum: iv.alias || iv.nomen,
      consonantia: iv.consonance,
      // The medieval name of the step, and where it falls on the hand.
      nomen: step?.nomen ?? null,
      solmisatio: step?.solmization ?? null,
      manus: step?.hand ?? null,
      role: isOctave ? "diapason" : (row.pc === finalisPc ? "finalis" : (row.pc === tenorPc ? "tenor" : "")),
    };
  });
}

/** Where the stopping finger goes for a string fraction.
 *
 * The finalis sounds the WHOLE string (fr = 1) and the octave sounds HALF of
 * it, so every division of one octave falls in the first half — measured
 * against the whole string, the far half is empty and the marks are squeezed
 * into the near one. So the drawn span IS that sounding half: the nut at the
 * octave's stop, the far bridge at the finalis. Same physical claim, twice the
 * resolution, no dead string.
 *
 * (Measuring from the nut rather than the far bridge puts the scale on
 * backwards — the pitches rise as the stopped length shortens.) */
const stringX = (fr) => NUT + LEN * (1 - (fr - 0.5) / 0.5);
const rulerX = (cents) => NUT + (cents / 1200) * LEN;

/**
 * The monochord: the string, its bridges, and a mark where each degree stops it.
 *
 * @param {object} tonus
 * @param {object} opts
 * @param {number} [opts.mode]      which mode's scale (default 7)
 * @param {string} [opts.selected]  a row key (SPN)
 * @param {(key: string) => void} [opts.onSelect]
 */
export function chorda(tonus, { mode = 7, selected, onSelect } = {}) {
  // A string shows ONE octave: past its halfway point there is no more string.
  // Modes whose gamut runs higher (mode 1 reaches a twelfth) are drawn to the
  // diapason and no further; the tabula still carries the whole gamut.
  const rows = chordaRows(tonus, { mode }).filter((r) => r.fr >= 0.5 - 1e-9);
  const sel = selected ?? rows.find((r) => r.role === "tenor")?.key ?? rows[0]?.key;

  const svg = el("svg", {
    class: "chorda", viewBox: "0 0 800 150", xmlns: NS,
    role: "img", "aria-label": `The monochord divided for mode ${mode}`,
  });

  // ── the instrument: two bridges and the string between ──
  for (const x of [NUT, NUT + LEN]) {
    svg.appendChild(el("line", {
      x1: x, y1: STRING_Y - 26, x2: x, y2: STRING_Y + 26,
      stroke: INK, "stroke-opacity": STRATUM.cadence, "stroke-width": STROKE.heavy,
    }));
  }
  svg.appendChild(el("line", {
    x1: NUT, y1: STRING_Y, x2: NUT + LEN, y2: STRING_Y,
    stroke: INK, "stroke-opacity": STRATUM.wave, "stroke-width": STROKE.fine,
  }));

  // ── a mark where each degree stops the string ──
  for (const r of rows) {
    const x = stringX(r.fr);
    const isSel = r.key === sel;

    svg.appendChild(el("line", {
      x1: sc(x), y1: isSel ? STRING_Y - 20 : STRING_Y - 14,
      x2: sc(x), y2: isSel ? STRING_Y + 20 : STRING_Y + 14,
      stroke: isSel ? RUBRICA : INK,
      "stroke-opacity": isSel ? 1 : STRATUM.wave,
      "stroke-width": isSel ? 1.6 : 0.85,
    }));
    if (isSel) {
      svg.appendChild(el("circle", { cx: sc(x), cy: STRING_Y, r: 3.4, fill: RUBRICA }));
    }

    // The letter above — the litera the hand and the staff both use.
    svg.appendChild(el("text", {
      x: sc(x), y: STRING_Y - 32, "text-anchor": "middle",
      "font-family": HOUSE_SERIF, "font-size": STEP.body,
      fill: isSel ? RUBRICA : INK,
      "fill-opacity": isSel ? 1 : STRATUM.label,
    }, r.litera));

    // The fraction below, for the degrees that carry the argument.
    if (r.role || isSel) {
      svg.appendChild(el("text", {
        x: sc(x), y: STRING_Y + 38, "text-anchor": "middle",
        "font-family": HOUSE_MONO, "font-size": STEP.caption,
        fill: isSel ? RUBRICA : INK,
        "fill-opacity": isSel ? 1 : STRATUM.margin,
      }, r.fraction));
    }

    if (onSelect) {
      const hit = el("rect", {
        x: sc(x - 11), y: STRING_Y - 30, width: 22, height: 60,
        fill: INK, "fill-opacity": 0, cursor: "pointer",
        tabindex: "0", role: "button",
        "aria-label": `${r.spn} — ${r.intervallum}`,
      });
      hit.addEventListener("click", () => onSelect(r.key));
      hit.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(r.key); }
      });
      svg.appendChild(hit);
    }
  }

  // ── what the figure is, in the margin ──
  svg.appendChild(el("text", {
    x: NUT, y: STRING_Y + 62, "font-family": HOUSE_MONO, "font-size": STEP.micro,
    "letter-spacing": "0.1em", fill: INK, "fill-opacity": STRATUM.margin,
  }, "DIVISIO CHORDAE"));

  return svg;
}

/**
 * The regula: the same scale in cents, against the equal-tempered grid. Where a
 * mark sits off its grid line is where Pythagoras and the piano part company.
 */
export function regula(tonus, { mode = 7, selected, onSelect } = {}) {
  // The ruler spans the octave, so a gamut reaching past it is drawn to 1200
  // and no further — the same bound the monochord's string imposes physically.
  const rows = chordaRows(tonus, { mode }).filter((r) => r.cents <= 1200 + 1e-6);
  const sel = selected ?? rows.find((r) => r.role === "tenor")?.key ?? rows[0]?.key;

  const svg = el("svg", {
    class: "regula", viewBox: "0 0 800 120", xmlns: NS,
    role: "img", "aria-label": `The scale of mode ${mode} in cents`,
  });

  // ── the equal-tempered grid: a line every hundred cents ──
  for (let c = 0; c <= 1200; c += 100) {
    const x = rulerX(c);
    const edge = c % 1200 === 0;
    svg.appendChild(el("line", {
      x1: sc(x), y1: RULER_Y - (edge ? 10 : 8), x2: sc(x), y2: RULER_Y + (edge ? 10 : 8),
      stroke: INK, "stroke-opacity": STRATUM.rail, "stroke-width": STROKE.hair,
    }));
  }
  svg.appendChild(el("line", {
    x1: NUT, y1: RULER_Y, x2: NUT + LEN, y2: RULER_Y,
    stroke: INK, "stroke-opacity": STRATUM.bracket, "stroke-width": STROKE.fine,
  }));

  // ── the scale's own marks, where the tuning actually puts them ──
  for (const r of rows) {
    const x = rulerX(r.cents);
    const isSel = r.key === sel;
    svg.appendChild(el("line", {
      x1: sc(x), y1: RULER_Y - (isSel ? 18 : 13), x2: sc(x), y2: RULER_Y + (isSel ? 18 : 13),
      stroke: isSel ? RUBRICA : INK,
      "stroke-opacity": isSel ? 1 : STRATUM.wave,
      "stroke-width": isSel ? 1.6 : 0.85,
    }));
    svg.appendChild(el("text", {
      x: sc(x), y: RULER_Y - 26, "text-anchor": "middle",
      "font-family": HOUSE_SERIF, "font-size": STEP.label,
      fill: isSel ? RUBRICA : INK,
      "fill-opacity": isSel ? 1 : STRATUM.letters,
    }, r.litera));

    // The deviation from equal temperament, where it is worth seeing.
    if (Math.abs(r.offset) >= 1 && (r.role || isSel)) {
      svg.appendChild(el("text", {
        x: sc(x), y: RULER_Y + 30, "text-anchor": "middle",
        "font-family": HOUSE_MONO, "font-size": STEP.micro,
        fill: isSel ? RUBRICA : INK,
        "fill-opacity": isSel ? 1 : STRATUM.margin,
      }, `${r.offset > 0 ? "+" : ""}${r.offset.toFixed(1)}`));
    }

    if (onSelect) {
      const hit = el("rect", {
        x: sc(x - 11), y: RULER_Y - 24, width: 22, height: 52,
        fill: INK, "fill-opacity": 0, cursor: "pointer",
        tabindex: "0", role: "button",
        "aria-label": `${r.spn} — ${r.cents.toFixed(0)} cents`,
      });
      hit.addEventListener("click", () => onSelect(r.key));
      hit.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(r.key); }
      });
      svg.appendChild(hit);
    }
  }

  svg.appendChild(el("text", {
    x: NUT, y: RULER_Y + 52, "font-family": HOUSE_MONO, "font-size": STEP.micro,
    "letter-spacing": "0.1em", fill: INK, "fill-opacity": STRATUM.margin,
  }, "REGULA · CENTESIMAE"));

  return svg;
}

/** The numbers behind both figures. */
export function chordaTabula(tonus, { mode = 7, selected, onSelect } = {}) {
  const rows = chordaRows(tonus, { mode });
  const sel = selected ?? rows.find((r) => r.role === "tenor")?.key ?? rows[0]?.key;

  return tabula(rows, [
    { key: "nomen", head: "nomen", gloss: (r) => r.role || "" },
    { key: "spn", head: "nota", mono: true },
    { key: "intervallum", head: "intervallum", gloss: (r) => r.consonantia },
    { key: "hz", head: "hz", mono: true, num: true, format: (v) => v.toFixed(2) },
    { key: "cents", head: "¢", mono: true, num: true, format: (v) => v.toFixed(1) },
    { key: "offset", head: "¢ vs æq.", mono: true, num: true,
      format: (v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}` },
    { key: "fraction", head: "chorda", mono: true, num: true },
  ], { selected: sel, onSelect, caption: `The scale of mode ${mode}` });
}
