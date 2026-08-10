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

import { INK, RUBRICA, STRATUM, STROKE, STEP, HOUSE_SERIF, HOUSE_MONO, sc } from "./ink.js";
import { tabula } from "./tabula.js";
import { OUTLINE, SPIRAL, LOCUS, VIEWBOX } from "./hand-figure.js";
import { literaGlyph } from "./litera.js";

const NS = "http://www.w3.org/2000/svg";

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
export function hand(tonus, { mode = 1, selected, onSelect, tuning, comma } = {}) {
  const rows = handRows(tonus, { mode, tuning, comma });
  const sel = selected ?? rows.find((r) => r.role === "finalis")?.key ?? rows[0]?.key;

  const svg = el("svg", {
    class: "hand", viewBox: VIEWBOX, xmlns: NS,
    role: "img", "aria-label": `The Guidonian hand, read in mode ${mode}`,
  });

  // ── the hand itself ──
  svg.appendChild(el("path", {
    d: OUTLINE, fill: "none", stroke: INK,
    "stroke-opacity": STRATUM.letters, "stroke-width": STROKE.fine,
    "stroke-linejoin": "round",
  }));

  // ── the reading route, faint: the order the gamut is learned in ──
  svg.appendChild(el("path", {
    d: SPIRAL, fill: "none", stroke: INK,
    "stroke-opacity": STRATUM.rail, "stroke-width": STROKE.hair,
    "stroke-dasharray": "3 3",
  }));

  // ── a locus per joint ──
  for (const r of rows) {
    const [x, y] = r.xy;
    const isSel = r.key === sel;
    // A joint carrying a structural degree of the mode reads darker.
    const structural = r.role === "finalis" || r.role === "tenor";

    if (isSel) {
      svg.appendChild(el("circle", {
        cx: x, cy: y, r: 26, fill: "none",
        stroke: RUBRICA, "stroke-width": 1.6,
      }));
    }
    svg.appendChild(el("circle", {
      cx: x, cy: y, r: 21,
      fill: "var(--paper, #FDFDFC)",
      stroke: isSel ? RUBRICA : INK,
      "stroke-opacity": isSel ? 1 : (structural ? STRATUM.wave : STRATUM.bracket),
      "stroke-width": structural ? STROKE.firm : STROKE.hair,
    }));

    // THE SOLFÈGE SYLLABLE ALONE, which is what the hand is FOR: a cantor
    // reads a pitch by the syllable its hexachord gives it, and the litera
    // that names the joint is the table's business. Both drawn in one circle
    // made twenty joints each carry two labels, and the figure read as a list.
    svg.appendChild(el("text", {
      x, y: y + 2, "text-anchor": "middle", "dominant-baseline": "central",
      "font-family": HOUSE_SERIF, "font-size": STEP.label,
      fill: isSel ? RUBRICA : INK,
      "fill-opacity": isSel ? 1 : (structural ? STRATUM.label : STRATUM.letters),
    }, r.solmisatio ? r.solmisatio.toLowerCase() : r.litera));

    if (onSelect) {
      const hit = el("circle", {
        cx: x, cy: y, r: 27, fill: INK, "fill-opacity": 0,
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

  // ── what the figure is ──
  svg.appendChild(el("text", {
    x: 246, y: 1000, "font-family": HOUSE_MONO, "font-size": STEP.micro,
    "letter-spacing": "0.1em", fill: INK, "fill-opacity": STRATUM.margin,
  }, "MANUS GUIDONIS"));

  return svg;
}

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
    // shapes ♭ and ♮ descend from — so they are drawn with the medieval
    // glyphs the emitter uses rather than set in a text font.
    { key: "litera", head: "litera", cellClass: "litera",
      render: (v) => literaGlyph(v) },
    { key: "spn", head: "nota", mono: true },
    ...hexCols,
    { key: "nomen", head: "nomen", gloss: (r) => r.role },
  ], { selected: sel, onSelect });
}
