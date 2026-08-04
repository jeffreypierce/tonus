// ---------------------------------------------------------------------------
// site/diagrams/polar — the ring diagrams' one geometry
// ---------------------------------------------------------------------------
// Every ring in the site measures the same way: degrees CLOCKWISE FROM TWELVE
// O'CLOCK, because that is how a calendar wheel and a tone wheel are both read.
// SVG's own rotation runs clockwise from three o'clock, and its arc command
// takes a sweep flag and a large-arc flag that are easy to get wrong in
// opposite directions — which is exactly what happened twice while porting the
// annulus: a 48-degree arc drawn as 312, putting a season's name half a year
// from its band.
//
// So the trigonometry lives here once, with tests pinning the two things that
// actually broke: which way a sweep runs, and what happens across the wrap.

/** A point at `deg` clockwise from twelve o'clock, `r` from the centre. */
export function pointAt(deg, r) {
  const rad = (deg * Math.PI) / 180;
  return [r * Math.sin(rad), -r * Math.cos(rad)];
}

/** The rotation SVG needs to set text along the ring at `deg`: its own zero is
 * three o'clock, ours is twelve. */
export const tangentRotation = (deg) => deg - 90;

/** A point at ecliptic longitude `lon`, `r` from the centre.
 *
 * The zodiac does NOT share the calendar ring's convention. Longitude is
 * measured from the vernal point ANTICLOCKWISE, and the vernal point sits at
 * three o'clock — so 0° Aries is due right and Cancer is at the top, the
 * opposite sense from a clock face. Reusing pointAt() here mirrors the sky:
 * the signs run backwards and every planet lands on the wrong side of the
 * wheel. */
export function eclipticAt(lon, r) {
  const rad = (lon * Math.PI) / 180;
  return [r * Math.cos(rad), -r * Math.sin(rad)];
}

/** Upright text for a label at ecliptic longitude `lon`. */
export function eclipticRotation(lon) {
  const a = ((-lon % 360) + 360) % 360;
  return a > 90 && a <= 270 ? a - 180 : a;
}

/** Upright text set radially would read upside down over the ring's left side;
 * this is the rotation that keeps it legible, flipping it through 180 where
 * needed. Nine o'clock (270°) flips — text there points left — while three
 * o'clock does not, so the half-open interval [90, 270] is the flipping one. */
export function uprightRotation(deg) {
  const a = ((deg % 360) + 360) % 360;
  return a > 90 && a <= 270 ? a - 180 : a;
}

/** True when a label centred at `deg` would hang under its arc rather than sit
 * on it — the ring's lower half, where an arc must be run backwards. */
export function isLowerHalf(deg) {
  const a = ((deg % 360) + 360) % 360;
  return a > 100 && a < 260;
}

/**
 * An arc path from `a0` to `a1` at radius `r`, both in degrees clockwise from
 * twelve.
 *
 * `sweep = 1` runs it clockwise; `sweep = 0` runs the SAME arc backwards, which
 * is how a name on the lower half is set the right way up — same geometry,
 * opposite direction, so the text rides above the line instead of hanging
 * beneath it. Reversing an arc by swapping its endpoints and adding 360 does
 * NOT do this: it draws the long way round the circle.
 *
 * `a1` may exceed 360 to express an arc crossing the wrap (Christmas to
 * Epiphany is 354° to 366°); the large-arc flag is taken from the true span.
 */
export function arcPath(a0, a1, r, sweep = 1) {
  const span = Math.abs(a1 - a0);
  const large = span > 180 ? 1 : 0;
  const [xs, ys] = pointAt(sweep ? a0 : a1, r);
  const [xe, ye] = pointAt(sweep ? a1 : a0, r);
  return `M ${fmt(xs)} ${fmt(ys)} A ${r} ${r} 0 ${large} ${sweep} ${fmt(xe)} ${fmt(ye)}`;
}

/**
 * A wedge between two angles and two radii — the hit area that makes a small
 * mark on a ring clickable.
 */
export function wedgePath(a0, a1, rInner, rOuter) {
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  const [xo0, yo0] = pointAt(a0, rOuter);
  const [xo1, yo1] = pointAt(a1, rOuter);
  const [xi1, yi1] = pointAt(a1, rInner);
  const [xi0, yi0] = pointAt(a0, rInner);
  return `M ${fmt(xo0)} ${fmt(yo0)} A ${rOuter} ${rOuter} 0 ${large} 1 ${fmt(xo1)} ${fmt(yo1)} ` +
    `L ${fmt(xi1)} ${fmt(yi1)} A ${rInner} ${rInner} 0 ${large} 0 ${fmt(xi0)} ${fmt(yi0)} Z`;
}

/** Midpoints between neighbours on a closed ring — where one mark's wedge ends
 * and the next begins. `values` must be sorted; `period` is the ring's full
 * turn in the same units (365 days, 360 degrees, 12 tones). */
export function neighbourMidpoints(values, period) {
  const n = values.length;
  return values.map((v, i) => {
    const prev = values[(i - 1 + n) % n];
    const next = values[(i + 1) % n];
    return [
      i === 0 ? (prev - period + v) / 2 : (prev + v) / 2,
      i === n - 1 ? (v + next + period) / 2 : (v + next) / 2,
    ];
  });
}

const fmt = (v) => Number(v.toFixed(2)).toString();
