// ---------------------------------------------------------------------------
// site/diagrams/litera — a gamut letter, drawn as the books draw it
// ---------------------------------------------------------------------------
// Most Guidonian letters are letters: Γ, A, B, c, dd. Two are not. The pitch
// the tradition writes as "b" comes in two shapes — b rotundum, the round b,
// and b quadratum, the square b — and those two shapes are literally where ♭
// and ♮ come from. They are the same letter written twice, which is the whole
// point of the joint they share.
//
// The typographic ♭ ♮ are the descendants; the medieval marks are the things
// themselves, and tonus already bakes them (GLYPH.flat / GLYPH.natural, the
// SMuFL medieval-and-Renaissance accidentals the square-note emitter draws).
// So a letter that IS one of those is drawn with its glyph rather than set in
// a text font that only has the modern descendant.
//
// The gamut table keeps letters, deliberately — it names joints rather than
// drawing them. The drawing happens here.

import { GLYPHS, GLYPH_UPM } from "../dist/data/smufl-glyphs.js";

const NS = "http://www.w3.org/2000/svg";

/** The STANDARD accidentals, not the medieval ones tonus draws on a staff.
 *  Bravura carries both, and the score emitter uses `GLYPH.flat`/`GLYPH.natural`
 *  (E9E0/E9E1, b rotundum and b quadratum) because a square-note staff wants
 *  the shapes the books print. This table is read as type rather than as
 *  notation, so it takes the modern descendants — engraved, so they match the
 *  page's weight instead of whatever ♭ ♮ a text font happens to carry. */
const SIGN = { flat: "E260", natural: "E261" };

/** Which mark a gamut name calls for, if any. `bb`/`♮♮` are the same marks an
 *  octave up — the doubling is the octave, not a different sign. */
function markFor(litera) {
  if (/^b+$/.test(litera)) return { code: SIGN.flat, repeat: litera.length };
  if (/^♮+$/.test(litera)) return { code: SIGN.natural, repeat: litera.length };
  return null;
}

/**
 * A gamut letter as an SVG node: a `<text>` for an ordinary letter, a group of
 * glyph paths for the two that are marks.
 *
 * @param {string} litera        the name from the library (Γ, a, b, ♮♮ …)
 * @param {object} opts
 * @param {number} opts.x
 * @param {number} opts.y        the letter's visual centre
 * @param {number} opts.size     cap height to match, in px
 * @param {string} opts.fill
 * @param {number} [opts.opacity]
 * @returns {SVGElement}
 */
export function litera(litera_, { x, y, size, fill, opacity = 1 }) {
  const mark = markFor(litera_);
  if (!mark) {
    const t = document.createElementNS(NS, "text");
    for (const [k, v] of Object.entries({
      x, y: y + size * 0.34, "text-anchor": "middle",
      "font-family": "Junicode, 'Crimson Pro', Georgia, serif",
      "font-size": size, fill, "fill-opacity": opacity,
    })) t.setAttribute(k, v);
    t.textContent = litera_;
    return t;
  }

  const g = GLYPHS[mark.code];
  const group = document.createElementNS(NS, "g");
  if (!g) return group;

  // SMuFL glyphs are drawn in font units, y-UP, so the transform flips y. The
  // scale is set from the glyph's own height rather than the em, because these
  // two marks are tall for their size and would otherwise tower over a letter
  // set at the same nominal size.
  const [, yMin, , yMax] = g.bbox;
  const s = (size * 1.15) / (yMax - yMin);
  const w = g.advance * s;
  // The octave doubles the sign, and these glyphs have NO side bearings — the
  // ink fills the advance edge to edge (measured: 226/226 and 168/168 units) —
  // so consecutive marks touch unless the space is put here. The whole gap is
  // this number, which is why it is large next to ordinary letter tracking.
  const gap = w * 0.55;
  const total = w * mark.repeat + gap * (mark.repeat - 1);

  for (let i = 0; i < mark.repeat; i++) {
    const node = document.createElementNS(NS, "g");
    const left = x - total / 2 + i * (w + gap);
    // The glyph's own bbox centres it: its origin is a baseline, not a middle.
    node.setAttribute("transform",
      `translate(${left.toFixed(2)} ${(y + ((yMax + yMin) / 2) * s).toFixed(2)}) `
      + `scale(${s.toFixed(5)} ${(-s).toFixed(5)})`);
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", g.path);
    path.setAttribute("fill", fill);
    if (opacity !== 1) path.setAttribute("fill-opacity", opacity);
    node.appendChild(path);
    group.appendChild(node);
  }
  return group;
}

/** The same, as markup for a table cell — where there is no SVG to draw into.
 *  Returns null for an ordinary letter, which the caller then sets as text. */
export function literaGlyph(litera_, { size = 13 } = {}) {
  const mark = markFor(litera_);
  if (!mark) return null;
  const g = GLYPHS[mark.code];
  if (!g) return null;

  const [, yMin, , yMax] = g.bbox;
  // The mark stands at the nominal size, no correction: these two are tall for
  // their size and towered over the letters they sit between at 1.15.
  const s = size / (yMax - yMin);
  const w = g.advance * s;
  // The octave doubles the sign, and these glyphs have NO side bearings — the
  // ink fills the advance edge to edge (measured: 226/226 and 168/168 units) —
  // so consecutive marks touch unless the space is put here. The whole gap is
  // this number, which is why it is large next to ordinary letter tracking.
  const gap = w * 0.55;
  const total = w * mark.repeat + gap * (mark.repeat - 1);
  const h = (yMax - yMin) * s;

  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", `0 0 ${total.toFixed(2)} ${h.toFixed(2)}`);
  svg.setAttribute("width", total.toFixed(2));
  svg.setAttribute("height", h.toFixed(2));
  svg.setAttribute("class", "litera-glyph");
  for (let i = 0; i < mark.repeat; i++) {
    const node = document.createElementNS(NS, "g");
    node.setAttribute("transform",
      `translate(${(i * (w + gap)).toFixed(2)} ${(yMax * s).toFixed(2)}) `
      + `scale(${s.toFixed(5)} ${(-s).toFixed(5)})`);
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", g.path);
    path.setAttribute("fill", "currentColor");
    node.appendChild(path);
    svg.appendChild(node);
  }
  return svg;
}
