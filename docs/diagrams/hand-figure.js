// ---------------------------------------------------------------------------
// site/diagrams/hand-figure — the drawn hand
// ---------------------------------------------------------------------------
// The one part of this diagram the library cannot supply: a hand's shape. The
// outline and the spiral route are traced illustration, and the loci are
// positions ON that illustration.
//
// They are keyed BY MIDI, which is the whole point — the drawing indexes into
// tonus's Guidonian table rather than restating it. Which pitch sits at a
// joint, what it is called, which hexachords read it and how, all come from
// the library at draw time. Only where the joint IS lives here.

/** The hand, traced. */
export const OUTLINE = "M 246 760 L 246 378 A 50 50 0 0 1 346 378 L 346 610 A 11 11 0 0 0 368 610 L 368 196 A 46 46 0 0 1 460 196 L 460 538 A 11 11 0 0 0 482 538 L 482 130 A 50 50 0 0 1 582 130 L 582 538 A 11 11 0 0 0 604 538 L 604 196 A 46 46 0 0 1 696 196 L 696 538 A 11 11 0 0 0 718 538 L 718 308 A 44 44 0 0 1 806 308 L 806 760 C 802 880, 700 975, 528 975 C 356 975, 250 880, 246 760 Z";

/** The reading route: thumb tip, down the thumb, across the finger bases,
 * up the little finger, back across the tips, then inward. */
export const SPIRAL = "M 296 408 C 292 446, 292 482, 296 520 C 322 514, 372 508, 414 505 C 452 500, 494 497, 532 497 C 572 497, 614 500, 650 505 C 690 509, 728 512, 762 518 C 768 458, 768 398, 762 338 C 746 296, 698 262, 650 240 C 614 220, 570 194, 532 182 C 490 194, 448 220, 414 240 C 408 298, 408 358, 414 416 C 450 406, 494 396, 532 392 C 572 396, 614 404, 650 416 C 664 372, 604 316, 532 287 C 564 296, 620 310, 650 328 C 680 272, 604 140, 538 66";

/** A natural sign, for the two loci that carry one. */
export const NATURAL_GLYPH = "M0 -186C0 -192 3 -195 8 -195C9 -195 14 -194 15 -193C29 -187 85 -163 114 -163C124 -163 131 -166 131 -174V-323C131 -330 136 -335 143 -335H156C162 -335 168 -330 168 -323V179C168 184 164 187 160 187C159 187 157 187 156 186L141 181C139 181 138 180 137 180C137 180 73 157 47 157C41 157 37 158 37 162V329C37 336 31 341 25 341H12C5 341 0 336 0 329ZM122 79C128 79 131 78 131 74V-29C131 -47 74 -70 49 -70C42 -70 37 -68 37 -64V39C37 53 98 79 122 79Z";

/** Locus centre for each Guidonian midi, in the figure's own coordinates. */
export const LOCUS = new Map([
  [43, [296, 408]],   // gam
  [45, [296, 464]],   // A
  [47, [296, 520]],   // B
  [48, [414, 505]],   // C
  [50, [532, 497]],   // D
  [52, [650, 505]],   // E
  [53, [762, 518]],   // F
  [55, [762, 458]],   // G
  [57, [762, 398]],   // a
  // B FA and B MI SHARE A JOINT on the historical hand — that is the whole
  // b molle / b durum distinction, and the reason the hand has a "square b"
  // and a "round b" at one place. Drawn side by side rather than stacked, so
  // each can be pointed at: the flat left, the natural right.
  [58, [744, 338]],   // b (molle — b rotundum)
  [59, [786, 338]],   // ♮ (durum — b quadratum)
  [60, [650, 240]],   // c
  [62, [532, 182]],   // d
  [64, [414, 240]],   // e
  [65, [414, 328]],   // f
  [67, [414, 416]],   // g
  [69, [532, 392]],   // aa
  [70, [632, 416]],   // bb (molle)
  [71, [674, 416]],   // ♮♮ (durum)
  [72, [532, 287]],   // cc
  [74, [650, 328]],   // dd
  [76, [532, 36]],   // ee
]);

/** The figure's own coordinates. The ink runs x 246..806 and y 10..975 (the ee
 * locus floats above the middle fingertip, the palm closes at the bottom), so
 * this is the drawing plus a small margin — not the looser frame the lab round
 * used, which left the palm swimming in space. */
export const VIEWBOX = "216 -18 620 1024";
