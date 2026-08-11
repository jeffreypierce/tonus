// ---------------------------------------------------------------------------
// site/diagrams/notehead — where a drawn notehead actually sits
// ---------------------------------------------------------------------------
// `inscriptio` returns a geometry entry per note, and it reports the note's
// ANCHOR: its left edge, and the staff line its pitch sits on. That is the
// right thing for the emitter to report — it is where the note is placed — but
// it is not the middle of the drawn glyph, and a ring centred on it sits a few
// pixels left of the head it means to circle.
//
// The middle is computable from what the emitter already wrote: each head is a
// <g> with a transform and a <path>, so the path's extent times the transform
// IS the drawn box. Different neume shapes carry different path origins — a
// punctum runs 0..160 where a liquescent runs −127..14 — so this is per note,
// never one constant for the score.
//
// Computed from markup rather than measured with getBBox, deliberately: a
// figure that has not been laid out yet (or has just been replaced) reports
// every box as zero, and a ring sized from that is the wrong size at exactly
// the moment it is first drawn.

/** A number pair from a path's `d`, in glyph units. */
const COORDS = /([-\d.]+)[ ,]([-\d.]+)/g;
// The glyph's OWN placement is the LAST translate/scale pair on the element: a
// caller may prepend transforms of its own (the ambitus enlarges its two
// structural degrees that way), and those wrap the glyph rather than replace
// it. Matching globally and taking the final pair reads the glyph's placement
// whether or not anything was prepended.
const TRANSFORM = /translate\(([-\d.]+) ([-\d.]+)\)\s*scale\(([-\d.]+)[ ,]([-\d.]+)\)/g;

/**
 * The centre and radius of one drawn notehead.
 *
 * @param {Element} head  a `<g class="note">` from an inscriptio render
 * @returns {{x: number, y: number, r: number} | null}
 */
export function middleOf(head) {
  if (!head) return null;
  const all = [...(head.getAttribute?.("transform") ?? "").matchAll(TRANSFORM)];
  const t = all[all.length - 1];
  const d = head.querySelector?.("path")?.getAttribute("d") ?? "";
  if (!t || !d) return null;

  const pts = [...d.matchAll(COORDS)]
    .map((p) => [Number(p[1]), Number(p[2])])
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
  if (!pts.length) return null;

  const xs = pts.map((p) => p[0]);
  const [loX, hiX] = [Math.min(...xs), Math.max(...xs)];

  // THE HEAD, NOT THE WHOLE GLYPH. A virga is a notehead with a stem hanging
  // off it — the head spans the full width at the foot of the path, the stem
  // tapers away above (measured: 160 units wide at the head, 19 at the stem's
  // tip). Taking the path's whole extent made the ring try to encircle the
  // stem too, so a stemmed note wore a circle twice the size of its neighbour.
  //
  // The head is found by WIDTH rather than by a height guess: walk in from the
  // bottom while the glyph is still most of its full width, and stop where it
  // narrows. A stemless shape never narrows, so this returns its whole extent
  // and those notes are untouched.
  // Keep every band that is still most of the full width, and take their
  // extent. Walking up from the foot and stopping at the first narrow band
  // does not work: a notehead is a rounded rectangle, so its own outermost
  // rows are narrow too and the walk stopped immediately.
  //
  // A stem is narrow along its whole length, so it contributes no wide bands
  // and drops out. A stemless shape is wide throughout and keeps all of its.
  const WIDE = 0.6;                       // of full width still counts as head
  const band = (y) => Math.round(y / 25) * 25;
  const width = new Map();
  for (const [x, y] of pts) {
    const b = band(y);
    const w = width.get(b) ?? [x, x];
    width.set(b, [Math.min(w[0], x), Math.max(w[1], x)]);
  }
  const full = hiX - loX;
  const wide = [...width.entries()]
    .filter(([, [x0, x1]]) => full <= 0 || (x1 - x0) >= full * WIDE)
    .map(([b]) => b);
  const ysAll = pts.map((p) => p[1]);
  const [loY, hiY] = wide.length
    ? [Math.min(...wide), Math.max(...wide)]
    : [Math.min(...ysAll), Math.max(...ysAll)];

  const sx = Number(t[3]), sy = Number(t[4]);

  return {
    x: Number(t[1]) + ((loX + hiX) / 2) * sx,
    y: Number(t[2]) + ((loY + hiY) / 2) * sy,
    // A floor, because a few glyphs are drawn very flat and a ring that
    // followed them exactly would collapse to a line.
    r: Math.max(((hiY - loY) * Math.abs(sy)) / 2, 4),
  };
}
