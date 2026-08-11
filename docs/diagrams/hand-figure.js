// ---------------------------------------------------------------------------
// site/diagrams/hand-figure — where the hand's twenty joints are
// ---------------------------------------------------------------------------
// The one part of this diagram the library cannot supply: a hand's shape. Which
// pitch sits at a joint, what it is called, and which hexachords read it all
// come from tonus at draw time. Only WHERE the joint is lives here.
//
// THE FIGURE IS SKELETAL. It was a traced outline with a palm, and the palm was
// more than half the figure's height while holding nothing; at the size a
// column gives it, the fingers closed up and the loci drifted off them. What a
// reader needs is the five digits and the twenty places, so that is what is
// drawn: five rules, an arc where the knuckles are, and circles — the same
// marks the wheels are built from.
//
// THE BASES ARC. The middle finger's base stands highest, then the index, the
// ring, and the little finger lowest, with the thumb lower still and outboard.
// A flat row of bases is what made the bottom of the figure read wrong.

/** The five digits, left to right. A locus names its column by index. */
export const COLX = [82, 178, 268, 358, 448];
const [THUMB, INDEX, MIDDLE, RING, LITTLE] = [0, 1, 2, 3, 4];

/** Locus centre for each Guidonian midi, in the figure's own coordinates. */
export const LOCUS = new Map([
  [43, [COLX[THUMB], 404]],   // gam
  [45, [COLX[THUMB], 476]],   // A
  [47, [COLX[THUMB], 548]],   // B
  [48, [COLX[INDEX], 470]],   // C
  [50, [COLX[MIDDLE], 456]],  // D
  [52, [COLX[RING], 474]],    // E
  [53, [COLX[LITTLE], 506]],  // F
  [55, [COLX[LITTLE], 434]],  // G
  [57, [COLX[LITTLE], 362]],  // a
  // B FA and B MI SHARE A JOINT on the historical hand — that is the whole
  // b molle / b durum distinction, and the reason the hand has a "square b"
  // and a "round b" at one place. Drawn side by side so each can be pointed
  // at and each can be greyed on its own: the flat left, the natural right.
  [58, [COLX[LITTLE] - 17, 290]],  // b (molle — b rotundum)
  [59, [COLX[LITTLE] + 17, 290]],  // ♮ (durum — b quadratum)
  [60, [COLX[RING], 258]],    // c
  [62, [COLX[MIDDLE], 244]],  // d
  [64, [COLX[INDEX], 254]],   // e
  [65, [COLX[INDEX], 326]],   // f
  [67, [COLX[INDEX], 398]],   // g
  [69, [COLX[MIDDLE], 384]],  // aa
  [70, [COLX[RING] - 17, 402]],    // bb (molle)
  [71, [COLX[RING] + 17, 402]],    // ♮♮ (durum)
  // The inward turn: bb sits at the base joint of the RING finger, so the
  // route carries on UP that finger to cc before crossing to the middle for
  // dd and ee. Held the other way round, the line left the ring at bb, crossed
  // to the middle for cc, went back out to the ring for dd, and crossed again
  // for ee — three crossings where the hand makes one turn.
  [72, [COLX[RING], 330]],    // cc — middle joint of the ring finger
  [74, [COLX[MIDDLE], 312]],  // dd — middle joint of the middle finger
  [76, [COLX[MIDDLE], 172]],  // ee — above the fingertip, extra manum
]);

/** The digits, as bare rules: [x, top, bottom].
 *  Each stops just past its outermost joint — the thumb's rule used to run on
 *  below its lowest circle with nothing at the end of it. The middle finger
 *  stops at d, not at ee: ee is sung above the hand, not on it. */
export const DIGITS = [
  [COLX[THUMB], 382, 570],
  [COLX[INDEX], 232, 492],
  [COLX[MIDDLE], 222, 478],
  [COLX[RING], 236, 496],
  [COLX[LITTLE], 268, 528],
];

/** The knuckle line, in two lengths.
 *
 *  SHORT, while the route is drawn. It stops at the ring, because past there
 *  it only redraws the route's own run from E to F and two lines saying one
 *  thing is a doubled line.
 *
 *  FULL, when the route is off. Nothing else then joins the digits, and five
 *  columns with nothing across them are not a hand — so the arc runs the whole
 *  way: the heel from the thumb's base, across all four knuckles, out to the
 *  little finger. Which is where it would have gone all along had the route
 *  not been drawing most of it first. */
export const KNUCKLE =
  `M ${COLX[INDEX]} 492 C ${COLX[INDEX] + 60} 500, ${COLX[RING] - 60} 500, ${COLX[RING]} 496`;
export const KNUCKLE_FULL =
  // the heel, thumb base up to the index — one sweep, not the hook this used
  // to be: it is the edge of a palm, and a palm's edge does not have a corner
  // in it
  `M ${COLX[THUMB]} 548 C ${COLX[THUMB] + 30} 552, ${COLX[INDEX] - 20} 514, `
  + `${COLX[INDEX]} 492 `
  + KNUCKLE
  + ` C ${COLX[RING] + 34} 502, ${COLX[LITTLE] - 24} 516, ${COLX[LITTLE]} 522`;

/** The reading route, in order: thumb tip, down the thumb, across the finger
 *  bases, up the little finger, back across the tips, down the index, then
 *  inward and up to ee. Given as midi, so the drawing reads its positions from
 *  LOCUS and cannot fall out of step with it.
 *
 *  The two b's are ONE step of the route — it passes between the pair rather
 *  than through either, because a cantor sings one or the other, never both. */
export const ROUTE = [43, 45, 47, 48, 50, 52, 53, 55, 57, [58, 59], 60, 62, 64,
                      65, 67, 69, [70, 71], 72, 74, 76];

/** The one segment that bows. dd and ee stand on the same digit with d between
 *  them, so a straight line from one to the other runs through a third joint. */
export const BOW = { from: 74, to: 76, dx: -46, lift: 40, drop: 60 };

/** A natural sign, for the two loci that carry one. */
export const NATURAL_GLYPH = "M0 -186C0 -192 3 -195 8 -195C9 -195 14 -194 15 -193C29 -187 85 -163 114 -163C124 -163 131 -166 131 -174V-323C131 -330 136 -335 143 -335H156C162 -335 168 -330 168 -323V179C168 184 164 187 160 187C159 187 157 187 156 186L141 181C139 181 138 180 137 180C137 180 73 157 47 157C41 157 37 158 37 162V329C37 336 31 341 25 341H12C5 341 0 336 0 329ZM122 79C128 79 131 78 131 74V-29C131 -47 74 -70 49 -70C42 -70 37 -68 37 -64V103C37 117 98 79 122 79Z";

/** The figure's own coordinates.
 *  The MIDDLE FINGER stands at the centre: x runs 268 ± 238, so the box's own
 *  middle falls on that digit's rule. Fitted to the drawing's extents instead,
 *  the centre landed 17 units left of it, and inside a ring that reads as the
 *  whole hand hanging off to one side. */
export const BOX = { x: 30, y: 140, w: 476, h: 435 };
export const VIEWBOX = `${BOX.x} ${BOX.y} ${BOX.w} ${BOX.h}`;

/** The top edge of the highest locus — ee, and its radius. A ring placing this
 *  figure inside itself hangs it from here, so the crown of the hand meets a
 *  lane rather than floating at whatever height centring happens to give. */
export const CROWN = 172 - 16;
