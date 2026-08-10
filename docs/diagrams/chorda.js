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
import { approximate } from "../dist/engines/temper/scale.js";

const NS = "http://www.w3.org/2000/svg";

// The string: two bridges, and the span between them.
// The standalone chorda/regula keep the old inset; the DUAL chart draws
// edge to edge (see DUAL_NUT/DUAL_LEN) so the string spans its column with no
// dead margin either side — the figure's width is its resolution.
const NUT = 60, LEN = 680;
const STRING_Y = 70;
const RULER_Y = 80;

// The string fraction is named by the LIBRARY: `approximate` is tonus's own
// Stern-Brocot search, the one `ratio()` uses to print "3:2". The site used to
// carry a second copy of it — same algorithm, same constants, its own bugs to
// find. It is exported now, so there is one.
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
export function chordaRows(tonus, { mode = 7, tuning, comma } = {}) {
  // The tuning is the whole subject of this panel — a monochord IS a picture
  // of one. It used to be dropped here: the caller passed it, the destructure
  // ignored it, and every temperament drew the same string.
  const T = tonus.temperamentum({
    mode, ...(tuning ? { tuning } : {}), ...(comma != null ? { comma } : {}),
  });
  const g = T.gamut();
  if (!g.length) return [];

  // The mode's structural degrees, tuned: the finalis and the reciting tone.
  // The tenor is not a fixed interval from the finalis — mode 3's sits a sixth
  // up, mode 8's a fourth — so the library is asked rather than assumed.
  const M = T.modus(mode);
  const finalisPc = M.finalis.pitch.pc;
  const tenorPc = M.reciting.pitch.pc;

  // EVERY RATIO IS MEASURED FROM THE FINALIS, which is what a mode is reckoned
  // from — 1/1 is the tonic, and the diapason is its octave.
  //
  // It used to measure from `gamut()[0]`, the bottom of the ambitus. For the
  // authentic modes those are the same note and nothing showed. For the
  // PLAGAL ones (2, 4, 6, 8) the ambitus starts a fourth BELOW the finalis, so
  // mode 4 — an E mode — put 1/1 on D and named every interval in it against
  // the wrong tonic. The figure read as D–D for a mode that finals on E.
  const tonic = g.find((row) => row.pc === finalisPc) ?? g[0];
  const base = tonic.hz;
  // Each step's medieval name and its place on the Guidonian hand ride along.
  const stepFor = new Map(
    (M.ambitusNotes ?? []).map((n) => [n.pitch.pc, n.step]),
  );
  stepFor.set(finalisPc, M.finalis.step);
  stepFor.set(tenorPc, M.reciting.step);

  return g.map((row, i) => {
    // The interval the library names, from the finalis to this degree; it
    // carries the Latin (Diapente, Diapason) and the consonance class.
    //
    // TWO PITCHES, not an offset. `intervallum` parses both arguments as
    // pitches, so handing it a difference worked only while that difference
    // was positive and happened to be a valid MIDI number — which it was, as
    // long as the base was the bottom of the gamut. Measuring from the finalis
    // makes a plagal mode's lower degrees negative, and a negative MIDI note
    // is not a pitch.
    const iv = T.intervallum(tonic.midi, row.midi);
    // A pitch at ratio r stops the string at 1/r of its length, so the string
    // fraction is the sounding ratio inverted.
    const fr = base / row.hz;
    // The diapason is the finalis an octave up, not merely the last row of
    // the gamut — in a plagal mode those are different notes.
    const isOctave = row.midi === tonic.midi + 12;
    const step = stepFor.get(row.pc);
    return {
      key: row.spn,
      spn: row.spn,
      // The pitch class, so a caller can match a degree across octaves — a
      // chant sings G2 where this scale is written G3, and they are the same
      // degree of the same mode.
      pc: row.pc,
      litera: row.spn.replace(/\d/g, "") + (isOctave ? "′" : ""),
      hz: row.hz,
      // Cents of the TUNING, from the library's own table — the whole point of
      // the regula is that these are not the equal-tempered round numbers.
      cents: 1200 * Math.log2(row.hz / base),
      aequalis: iv.cents,          // where equal temperament would put it
      fr,
      // A STRING FRACTION ONLY MEANS SOMETHING IN JUST INTONATION. Stopping a
      // string at 3/4 of its length IS the fourth — that is the medieval
      // claim, and it holds because the ratio is rational. Temper the fifth
      // and the ratios turn irrational, and the nearest simple fraction to an
      // irrational is noise: 1/5-comma meantone's fourth came out "603/806",
      // which names nothing and looks like a measurement.
      //
      // So the fraction is offered only where it is true, and the cents column
      // carries the tempered scale instead — which is exactly what cents are
      // for, and why the two measures sit side by side in this panel.
      fraction: (() => {
        const [n, d] = approximate(fr);
        // Not "is the fraction simple" but "is it EXACT". A just ratio round-
        // trips to the tuned value; a tempered one only ever approximates, so
        // any fraction offered for it would be a fit dressed as a measurement.
        return Math.abs(n / d - fr) < 1e-9 ? `${n}/${d}` : null;
      })(),
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
export function chorda(tonus, { mode = 7, selected, onSelect, tuning, comma } = {}) {
  // A string shows ONE octave: past its halfway point there is no more string.
  // Modes whose gamut runs higher (mode 1 reaches a twelfth) are drawn to the
  // diapason and no further; the tabula still carries the whole gamut.
  const rows = chordaRows(tonus, { mode, tuning, comma }).filter((r) => r.fr >= 0.5 - 1e-9);
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
export function regula(tonus, { mode = 7, selected, onSelect, tuning, comma } = {}) {
  // The ruler spans the octave, so a gamut reaching past it is drawn to 1200
  // and no further — the same bound the monochord's string imposes physically.
  const rows = chordaRows(tonus, { mode, tuning, comma }).filter((r) => r.cents <= 1200 + 1e-6);
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
export function chordaTabula(tonus, { mode = 7, selected, onSelect, tuning, comma } = {}) {
  const rows = chordaRows(tonus, { mode, tuning, comma });
  const sel = selected ?? rows.find((r) => r.role === "tenor")?.key ?? rows[0]?.key;

  // No nomen column: the medieval step-name is the hand's subject and has a
  // whole panel there. Here a degree is named by its note and its role.
  return tabula(rows, [
    { key: "spn", head: "nota", mono: true, gloss: (r) => r.role || "" },
    { key: "intervallum", head: "intervallum", gloss: (r) => r.consonantia },
    { key: "hz", head: "hz", mono: true, num: true, format: (v) => v.toFixed(2) },
    { key: "cents", head: "¢", mono: true, num: true, format: (v) => v.toFixed(1) },
    { key: "offset", head: "¢ vs æq.", mono: true, num: true,
      format: (v) => `${v > 0 ? "+" : ""}${v.toFixed(1)}` },
    // Blank under a temperament: a string fraction is a claim about a
    // RATIO, and a tempered degree does not have one.
    { key: "fraction", head: "chorda", mono: true, num: true,
      format: (v) => v ?? "—" },
  ], { selected: sel, onSelect });
}

// ── the two measures, as one figure ──────────────────────────────────────
//
// The monochord and the regula are the SAME seven degrees on two different
// x-axes: string fraction, which is reciprocal and crowds toward the octave,
// and cents, which is linear. Drawn apart, a reader has to hold one figure in
// mind while looking at the other to see that they disagree.
//
// Drawn together, the disagreement is the figure. A connector runs from each
// degree's stop on the string to the same degree's place on the ruler, and its
// SLANT is the reading: vertical where the two measures agree (the octave's
// ends, which are fixed points of both), leaning hardest in the middle of the
// octave where a linear reading of pitch and a proportional division of a
// string are furthest apart. That arc is the whole medieval-versus-modern
// argument, and neither figure alone can state it.

const DUAL_STRING_Y = 46;
const DUAL_RULER_Y = 126;

/**
 * The monochord and the ruler, joined.
 *
 * @param {object} tonus
 * @param {object} opts   as chorda/regula — mode, selected, onSelect, tuning, comma
 */
export function chordaDual(tonus, { mode = 7, selected, onSelect, tuning, comma } = {}) {
  // One octave: the string has no more length past its halfway point, and the
  // ruler is ruled to 1200. Both figures already bound themselves this way.
  const rows = chordaRows(tonus, { mode, tuning, comma })
    .filter((r) => r.fr >= 0.5 - 1e-9 && r.cents <= 1200 + 1e-6);
  const sel = selected ?? rows.find((r) => r.role === "tenor")?.key ?? rows[0]?.key;

  const svg = el("svg", {
    class: "chorda-dual", viewBox: `${NUT - 14} 0 ${LEN + 28} 170`, xmlns: NS,
    role: "img",
    "aria-label": `Mode ${mode} measured two ways: the monochord's string`
      + ` fractions above, the same degrees in cents below`,
  });

  // ── above: the string, between its bridges ──
  for (const x of [NUT, NUT + LEN]) {
    svg.appendChild(el("line", {
      x1: x, y1: DUAL_STRING_Y - 18, x2: x, y2: DUAL_STRING_Y + 18,
      stroke: INK, "stroke-opacity": STRATUM.cadence, "stroke-width": STROKE.heavy,
    }));
  }
  svg.appendChild(el("line", {
    x1: NUT, y1: DUAL_STRING_Y, x2: NUT + LEN, y2: DUAL_STRING_Y,
    stroke: INK, "stroke-opacity": STRATUM.wave, "stroke-width": STROKE.fine,
  }));

  // ── below: the equal-tempered grid, and the ruler over it ──
  for (let c = 0; c <= 1200; c += 100) {
    const x = rulerX(c);
    const edge = c % 1200 === 0;
    svg.appendChild(el("line", {
      x1: sc(x), y1: DUAL_RULER_Y - (edge ? 9 : 6), x2: sc(x), y2: DUAL_RULER_Y + (edge ? 9 : 6),
      stroke: INK, "stroke-opacity": STRATUM.rail, "stroke-width": STROKE.hair,
    }));
  }
  svg.appendChild(el("line", {
    x1: NUT, y1: DUAL_RULER_Y, x2: NUT + LEN, y2: DUAL_RULER_Y,
    stroke: INK, "stroke-opacity": STRATUM.bracket, "stroke-width": STROKE.fine,
  }));

  // ── the connectors, which are the point ──
  // Each runs from a degree's stop on the string to the same degree's place on
  // the ruler. The SLANT is the reading: vertical where the two measures agree
  // (the octave's ends, fixed points of both), leaning hardest mid-octave
  // where a proportional division of a string and a linear reading of pitch
  // are furthest apart.
  for (const r of rows) {
    const isSel = r.key === sel;
    svg.appendChild(el("line", {
      x1: sc(stringX(r.fr)), y1: DUAL_STRING_Y + 12,
      x2: sc(rulerX(r.cents)), y2: DUAL_RULER_Y - 12,
      stroke: isSel ? RUBRICA : INK,
      "stroke-opacity": isSel ? 0.9 : STRATUM.rail,
      "stroke-width": isSel ? 1.3 : STROKE.hair,
    }));
  }

  // ── each degree, marked on both scales ──
  for (const r of rows) {
    const xa = stringX(r.fr), xb = rulerX(r.cents);
    const isSel = r.key === sel;
    const ink = isSel ? RUBRICA : INK;

    for (const [x, y, reach] of [[xa, DUAL_STRING_Y, 11], [xb, DUAL_RULER_Y, 10]]) {
      svg.appendChild(el("line", {
        x1: sc(x), y1: y - (isSel ? reach + 4 : reach),
        x2: sc(x), y2: y + (isSel ? reach + 4 : reach),
        stroke: ink,
        "stroke-opacity": isSel ? 1 : STRATUM.wave,
        "stroke-width": isSel ? 1.6 : 0.85,
      }));
    }
    if (isSel) {
      svg.appendChild(el("circle", { cx: sc(xa), cy: DUAL_STRING_Y, r: 3.2, fill: RUBRICA }));
      svg.appendChild(el("circle", { cx: sc(xb), cy: DUAL_RULER_Y, r: 3.2, fill: RUBRICA }));
    }

    // THE LETTER NAMES THE DEGREE, ONCE, BETWEEN THE TWO SCALES — on its own
    // connector, which is the one place that belongs to both. Set above the
    // string it read as that axis's last label, which made every mode look
    // like it ended where its penultimate letter fell.
    //
    // It sits ON the connector, so the line would run straight through the
    // glyph and read as a strike-through. A disc of paper behind it opens a
    // gap in the line instead — the connector arrives at the letter and
    // leaves it, which is what the letter means.
    const lx = (xa + xb) / 2, ly = (DUAL_STRING_Y + DUAL_RULER_Y) / 2;
    svg.appendChild(el("circle", {
      cx: sc(lx), cy: sc(ly), r: isSel ? 13 : 10,
      // The page's own paper, so the gap follows the theme rather than
      // punching a hardcoded white hole in a themed figure.
      fill: "var(--paper, #FDFDFC)",
    }));
    svg.appendChild(el("text", {
      x: sc(lx), y: sc(ly + (isSel ? 7 : 5)),
      "text-anchor": "middle",
      "font-family": HOUSE_SERIF,
      "font-size": isSel ? STEP.title : STEP.body,
      fill: ink, "fill-opacity": isSel ? 1 : STRATUM.letters,
    }, r.litera));

    // The numbers belong to the CHOSEN degree only. Eight degrees times a
    // fraction, a cents figure and a deviation is thirty-odd labels for a
    // figure whose subject is a shape; the reader asks for the numbers by
    // choosing a degree, and gets them large enough to read.
    if (isSel) {
      svg.appendChild(el("text", {
        x: sc(xa), y: DUAL_STRING_Y - 22, "text-anchor": "middle",
        "font-family": HOUSE_MONO, "font-size": STEP.label,
        fill: ink,
      }, r.fraction ?? ""));
      svg.appendChild(el("text", {
        x: sc(xb), y: DUAL_RULER_Y + 32, "text-anchor": "middle",
        "font-family": HOUSE_MONO, "font-size": STEP.label,
        fill: ink,
      }, `${r.cents.toFixed(0)}¢`
        + (Math.abs(r.offset) >= 0.05
          ? `  ${r.offset > 0 ? "+" : "\u2212"}${Math.abs(r.offset).toFixed(1)} æq.` : "")));
    }

    if (onSelect) {
      // One hit area per degree, spanning both scales: they are one thing.
      const hit = el("polygon", {
        points: [
          `${sc(xa - 12)},${DUAL_STRING_Y - 18}`, `${sc(xa + 12)},${DUAL_STRING_Y - 18}`,
          `${sc(xb + 12)},${DUAL_RULER_Y + 18}`, `${sc(xb - 12)},${DUAL_RULER_Y + 18}`,
        ].join(" "),
        fill: INK, "fill-opacity": 0, cursor: "pointer",
        tabindex: "0", role: "button",
        "aria-label": `${r.spn} — ${r.fraction ? `${r.fraction} of the string, ` : ""}`
          + `${r.cents.toFixed(0)} cents${r.role ? `, the ${r.role}` : ""}`,
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
