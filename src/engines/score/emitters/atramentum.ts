// ---------------------------------------------------------------------------
// engines/score/emitters/atramentum — the ink: one drawing grammar
// ---------------------------------------------------------------------------
// THE GOVERNING INK SYSTEM (ruled 2026-07-29), extracted here so everything
// tonus draws shares one definition rather than agreeing by coincidence. The
// analysis tracks were its first consumer; the documentation site's diagrams
// are the second.
//
// - ONE INK. Every mark draws in the score's black; strata differ by OPACITY
//   alone (STRATUM), never by hue. Rubrica is the only colour, and it is
//   reserved for the claims: the mode line's in the tonarium, the accent's
//   in the prosodia (ruled 2026-08-11, amending 07-29 — see RUBRICA below).
// - ONE NIB. Every pressure-bearing line shares one width law (`nib`): a
//   normalized velocity becomes stroke width. Two marks at different opacities
//   are the same stroke, not two different pens.
// - CONFIDENCE IS OPACITY, composing with the stratum: a weak claim fades, and
//   below CONF_FLOOR it draws nothing at all. A thing tonus is unsure of does
//   not get drawn faintly and hedged in a caption; it goes uninked.
//
// The design brief is "Dieter Rams designs a liturgical book" — functionalist
// restraint, one canonical accent, nothing decorative that is not also
// informative. STEP and STROKE exist so a diagram cannot quietly invent a
// fifteenth type size or a seventh hairline: it picks a step or it does not
// draw.
//
// ─── HOW THIS MEETS THE PAGE ───────────────────────────────────────────────
// The site (orreliquum) keeps a system of its own, stated at the top of
// its stylesheet. The two are separate and they AGREE BY SHARING NUMBERS,
// not by one importing the other:
//
//   STEP        mirrors the six CSS type steps  (--micro … --display-size)
//   INK         mirrors --ink
//   RUBRICA     mirrors --rubrica
//   HOUSE_*     mirror --serif and --mono
//
// That seam is the thing to watch. A face or a step changed on one side and
// not the other does not fail — it renders, quietly, in the wrong thing. It
// has happened twice: HOUSE_MONO once listed ui-monospace first and drew
// every figure label in the system mono beside page text in Plex; HOUSE_SANS
// named a face no page loads, so the wheels' names and the tracks' letters
// came out in system-ui. Both are why the rule below is worth keeping literal.
//
// ─── THE FACES HAVE JOBS ───────────────────────────────────────────────────
// HOUSE_SERIF carries WORDS — a sign name, a month, a role, a gamut letter,
// a chironomy letter. HOUSE_MONO carries MACHINE DATA — hz, cents, ratios,
// ids. There is no third: if a label is a word, it is serif, wherever it is
// drawn. A figure that wants a face outside these two is asking the wrong
// question about its label.
//
// Colour reaches SVG the same way the score's does: a drawn figure names the
// site's token with its own value as the fallback — `var(--paper-dim,
// #F7F6F3)` — so the page can re-ink a figure it did not render, and the same
// figure standing alone still knows what it looks like.
//
// This module is INTERNAL. It is not part of the public API — the site reaches
// it through the vendored render subgraph, and outside consumers have no
// reason to draw in tonus's hand.

/** The one ink. Everything black is this black. */
export const INK = "#111";

/** The liturgical red. Reserved for the CLAIM lines: the mode's in the
 * tonarium, and — ruled 2026-08-11, amending the 07-29 reservation — the
 * word's accent in the prosodia. The precedent is the score's own text
 * apparatus: the dropcap and annotations have always been rubricated, and
 * in the books red is the word's colour. Nothing else wears it. */
export const RUBRICA = "#9E2B25";

/** Stratum opacities: one ink, graded. The melody strata (wave, spark) sit
 * under their annotations; a claim re-inks at full strength. */
export const STRATUM = {
  wave: 0.75,     // the chironomy line — the gesture itself
  spark: 0.45,    // the tonarium melody — context, not message
  cadence: 1.0,   // the claim: the melody's ending, full ink
  letters: 0.62,  // Pierik letters
  label: 0.9,     // signature labels
  bracket: 0.3,   // the label's end-ticked tie
  rail: 0.24,     // the maneriae rails
  margin: 0.38,   // the "cad" margin word
  block: 0.18,    // the prosodia's melisma blocks — a soft fill, not a line
  rule: 0.15,     // the prosodia's single rule — quieter than a rail
} as const;

/** Below this confidence nothing is drawn. Not faint — absent. */
export const CONF_FLOOR = 0.45;

/** THE nib — one pressure law: normalized velocity → stroke width. */
export const nib = (vn: number): number => 0.5 + 1.5 * vn;

/** The stroke ladder. A diagram picks a rung; it does not invent a width.
 * Named for what the line DOES, so the choice is about meaning, not weight. */
export const STROKE = {
  hair: 0.55,   // rails, grids, graticules — structure you read past
  fine: 0.75,   // the common diagram line
  firm: 1.05,   // a line making a claim (the mode line's weight)
  heavy: 1.5,   // an axis, a frame, a boundary
} as const;

/** The type scale, and it is THE PAGE'S: a modular scale on 15px stepped by
 *  the Pythagorean minor third, 32:27 — the same six `--micro` … `--display-size`
 *  that the site's stylesheet declares. So a wheel's label and a table's
 *  label at the same step are the same size.
 *
 *  It was 9/11/13.5/17/21/26, derived from what the diagrams happened to use.
 *  That was honest when the page had no scale of its own; once the page took
 *  one, the two agreed on `title` alone and every drawn label sat 1.5–2px under
 *  the prose around it. The site's vendor step asserts the pairing now, so this
 *  cannot drift again silently.
 *
 *  Nothing inside tonus reads STEP — the site's diagrams are its only consumer
 *  — so moving it changes no emitted SVG for a package consumer. */
export const STEP = {
  micro: 10.5,   // superscripts, tick labels
  caption: 12.5, // the workhorse — most diagram labels
  label: 15,     // named things
  body: 18,      // running text
  title: 21,     // a panel's name
  display: 25,   // the rare headline
} as const;

/** The house faces. Junicode is the serif — the real face, not the Crimson Pro
 * stand-in the early rounds carried; Plex Mono is the machine register. */
export const HOUSE_SERIF = "Junicode, 'Crimson Pro', Georgia, serif";
/* HOUSE_SANS is GONE. The house has three faces and each has a
 * job: Junicode carries content and Latin, Plex Mono carries machine data,
 * Jacquard is the wordmark. The sans stack named a fourth that no page loads,
 * so every label reaching for it resolved to system-ui — SF Pro on macOS —
 * and the wheels' names and the tracks' letters were set in it. Both now
 * label in HOUSE_SERIF. Nothing should reintroduce a sans without a face to
 * back it. */
/** The machine register. IBM Plex Mono FIRST: the site loads and self-hosts
 * that face, and with `ui-monospace` at the head of the stack every drawn
 * label resolved to the system mono — SF Mono on macOS — beside page text in
 * Plex. Two monospaces, same size, same column. */
export const HOUSE_MONO = "'IBM Plex Mono', ui-monospace, Menlo, monospace";

/** The fourth stack, and NOT a fourth face: neither text face carries the
 *  planetary or musical signs (see fonts/README.md), so a figure that draws one
 *  falls back to the system. Mirrors `--symbol` in the site's stylesheet
 *  — the same sharing-by-numbers seam as HOUSE_SERIF and HOUSE_MONO, and it was duplicated
 *  inline in mutatio.js as a local SIGN_FACE before this existed. */
export const HOUSE_SYMBOL = "'Apple Symbols', 'Segoe UI Symbol', "
  + "'Noto Sans Symbols2', " + HOUSE_SERIF;

/** The figures a FIGURE sets: Junicode's own, which are OLDSTYLE by default —
 *  they sit on the baseline with ascenders and descenders as lowercase letters
 *  do, so a number reads as part of a line of text rather than standing off it.
 *
 *  `features` is empty on purpose, and that is the finding worth keeping: in
 *  Junicode `zero` IS the oldstyle glyph and `zero.lf` is the lining variant,
 *  so `onum` maps lining BACK to the default and does nothing unless `lnum` is
 *  already on. Setting it here looked correct and changed no pixel — measured
 *  identical advances, 423.2 either way. Reach for `lnum`/`tnum` when a column
 *  of digits must line up; that is the setting that does work.
 *
 *  Nothing in the library's own emitters uses this yet. It lives here because
 *  this file is the ONE definition of the ink system and the site vendors it —
 *  a second copy in the site would be the drift this module exists to
 *  prevent. */
export const FIGURES = {
  family: HOUSE_SERIF,
  features: "",
} as const;

/** A scaled measure, at most two places and no trailing zeros: 1.8, not 1.80. */
export const sc = (v: number): string => Number(v.toFixed(2)).toString();

/** XML-escape a string for an SVG attribute or text node. */
export const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export type Pt = [number, number];

/** Sample one cubic Bézier segment (matches the generators' tessellation). */
export function sampleCubic(p1: Pt, c1: Pt, c2: Pt, p2: Pt, steps: number): Pt[] {
  const out: Pt[] = [];
  for (let k = 0; k < steps; k++) {
    const t = k / steps;
    const mt = 1 - t;
    out.push([
      mt ** 3 * p1[0] + 3 * mt * mt * t * c1[0] + 3 * mt * t * t * c2[0] + t ** 3 * p2[0],
      mt ** 3 * p1[1] + 3 * mt * mt * t * c1[1] + 3 * mt * t * t * c2[1] + t ** 3 * p2[1],
    ]);
  }
  return out;
}

/** Catmull–Rom through the points, sampled — the one curve idiom. */
export function crSamples(pts: Pt[], steps: number): Pt[] {
  if (pts.length < 2) return [...pts];
  const P: Pt[] = [pts[0]!, ...pts, pts[pts.length - 1]!];
  const out: Pt[] = [];
  for (let i = 1; i < P.length - 2; i++) {
    const [p0, p1, p2, p3] = [P[i - 1]!, P[i]!, P[i + 1]!, P[i + 2]!];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    out.push(...sampleCubic(p1, c1, c2, p2, steps));
  }
  out.push(pts[pts.length - 1]!);
  return out;
}

/** Piecewise-linear velocity read along x between anchors; the pressure signal
 * every pressure-bearing line shares. Null velocities read 0.3. */
export function velocityAt(velpts: Pt[]): (x: number) => number {
  return (x: number): number => {
    if (velpts.length === 0) return 0.3;
    if (x <= velpts[0]![0]) return velpts[0]![1];
    if (x >= velpts[velpts.length - 1]![0]) return velpts[velpts.length - 1]![1];
    for (let i = 0; i + 1 < velpts.length; i++) {
      const [x0, v0] = velpts[i]!;
      const [x1, v1] = velpts[i + 1]!;
      if (x0 <= x && x <= x1) return v0 + (v1 - v0) * ((x - x0) / Math.max(x1 - x0, 1e-6));
    }
    return 0.3;
  };
}

/** The subject's own velocity ceiling — pressure normalizes per subject, not
 * to a corpus constant (the plates' frozen 0.62 was a session artifact). */
export function velocityCeiling(velocities: readonly (number | null | undefined)[]): number {
  let vmax = 0;
  for (const v of velocities) if (v != null && v > vmax) vmax = v;
  return vmax > 0 ? vmax : 0.62;
}

/** A ribbon polygon around sampled points: THE nib at `scale`, velocity as
 * width — the one pressure stroke everything draws with. */
export function ribbonPath(samples: Pt[], vat: (x: number) => number, vmax: number,
  scale: number): string {
  const top: Pt[] = [];
  const bot: Pt[] = [];
  const N = samples.length;
  for (let i = 0; i < N; i++) {
    const [x, y] = samples[i]!;
    const [x0, y0] = samples[Math.max(i - 1, 0)]!;
    const [x1, y1] = samples[Math.min(i + 1, N - 1)]!;
    const dx = x1 - x0;
    const dy = y1 - y0;
    const L = Math.hypot(dx, dy) || 1;
    const nx = -dy / L;
    const ny = dx / L;
    const vn = Math.min(vat(x) / vmax, 1);
    const w = nib(vn) * scale;
    top.push([x + (nx * w) / 2, y + (ny * w) / 2]);
    bot.push([x - (nx * w) / 2, y - (ny * w) / 2]);
  }
  return "M " + top.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ") +
    " L " + bot.reverse().map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ") + " Z";
}
