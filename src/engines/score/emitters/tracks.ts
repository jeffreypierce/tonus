// ---------------------------------------------------------------------------
// engines/score/emitters/tracks — the analysis tracks
//                                  (prosodia, chironomia, tonarium)
// ---------------------------------------------------------------------------
// The analysis tracks, ported onto the emitters' own placements. Any rides
// either species and all may ride one score; the two-register principle is
// the house pairing, not a rule enforced here —
// quadrata as the body (rhythm as gesture, the chironomy wave; plate-chiron-14
// is the spec, its typus lane cut 2026-07-29 since the wave's own A/T letters
// already carry the incise's shape), moderna as the mind (pitch and mode, the
// tonarium lane; plate-tonarium-08, trued to the 2026-07-28 rulings: the
// SIGNATURE is a cadence's name — no familia binomials, no adventus case
// ladder; `arrival` already carries the number). The third register arrived
// 2026-08-11: the PROSODIA reads the WORD — how the melody treats the text,
// at the syllable and word grain (labbed as diagram-word-track rounds 01-08).
//
// THE GOVERNING INK SYSTEM (ruled 2026-07-29). One ink, one nib:
// - Every track mark draws in the score's black; strata differ by OPACITY
//   alone (the STRATUM table below), never by hue. Rubrica is the only color,
//   and it belongs to the claims: the tonarium's mode line, and (ruled
//   2026-08-11, amending 07-29) the prosodia's accent dots.
// - Every pressure-bearing line shares ONE width law (`nib`): each note's
//   velocity as stroke width. The wave and the sparkline are the same stroke
//   at different opacities.
// - Confidence is opacity too (the grammar held since fila), composing with
//   the stratum: a weak claim fades, and below 0.45 it draws nothing.
//
// Tracks draw INTO the species SVG (the emitters reserve the band room), but
// they are still downstream of the notation itself: they consume placements —
// the same note anchors the geometry contract exports — never the score's ink.
import type { ChantTabulaRow } from "../tabula.js";
import type { Cadence } from "../cadence.js";
import type { Modulation } from "../modulation.js";
import {
  cadentiaFamilia, CADENTIAE_POPULATION, type CadentiaFamilia,
} from "../../../data/cadentiae.js";
import {
  INK, STRATUM, CONF_FLOOR, nib, sc, esc, HOUSE_SERIF, HOUSE_MONO,
  sampleCubic, crSamples, velocityAt, velocityCeiling, ribbonPath, type Pt,
} from "./atramentum.js";

export type TrackName = "prosodia" | "chironomia" | "tonarium";

/** Analysis fields inscriptio hands the emitters when tracks are requested —
 * the score-level data the flat tabula does not carry. */
export interface TrackData {
  /**
   * Normally `score.cadences`, whose `finality` the score builder has already
   * joined from the catalogue. Cadences taken straight from `detectCadences`
   * carry `finality: null` everywhere, and the terminal node quietly falls
   * back to the modal target — a close on the finalis reads as closing, and
   * everything else as suspending. Correct behaviour, but coarser than the
   * measured answer, so pass the built score's cadences unless you mean it.
   */
  cadences: Cadence[];
  modulations: Modulation[];
  /** Mode digit parsed from the chant's label; absent = no mode line. */
  mode?: number;
}

/** One placed note as the emitters record it — the tracks' working unit.
 * The same anchors the geometry contract exports, with the row attached. */
export interface TrackNote {
  row: ChantTabulaRow;
  /** The note's anchor — where the emitter placed it. */
  x: number;
  y: number;
  system: number;
  systemY: number;
  /** The figure's measured ink edges. A track that SPANS notes — the cadence
   *  bracket, an arc over a neume — must reach the ink, not the anchors: a
   *  span drawn anchor-to-anchor is narrower than the notes it names and sits
   *  left of their centre, because an anchor is where a glyph starts rather
   *  than where it sits. The emitters have measured these all along and the
   *  mapping into TrackNote used to drop them. */
  inkLeft: number;
  inkRight: number;
}

/** One track's room within the band a system reserves below its lyric line. */
export interface TrackBand {
  /** This band's top, offset from the start of the track region. */
  top: number;
  /** The room this band takes. */
  height: number;
}

/** THE STACK. Every track rides either species and all may ride one score
 * together, so the band room is the sum of what each asks for. The order is
 * fixed here, not by the caller's array: the prosodia rides FIRST, directly
 * under the lyric line — it reads the text itself, so it stays closest to
 * it; the chironomia next, its wave an extension of the lyric line's
 * rhythm; the tonarium below, a panel whose label row is its bottom edge
 * and wants nothing under it. Requesting ["tonarium", "chironomia"]
 * therefore draws exactly what ["chironomia", "tonarium"] draws. */
export function trackBands(tracks: readonly TrackName[] | undefined, k: number): {
  prosodia: TrackBand | null;
  chironomia: TrackBand | null;
  tonarium: TrackBand | null;
  extra: number;
} {
  const wantsPros = tracks?.includes("prosodia") ?? false;
  const wantsChiron = tracks?.includes("chironomia") ?? false;
  const wantsTon = tracks?.includes("tonarium") ?? false;
  let top = 0;
  let prosodia: TrackBand | null = null;
  let chironomia: TrackBand | null = null;
  let tonarium: TrackBand | null = null;
  if (wantsPros) {
    prosodia = { top, height: prosodiaExtra(k) };
    top += prosodia.height;
  }
  if (wantsChiron) {
    chironomia = { top, height: chironomiaExtra(k) };
    top += chironomia.height;
  }
  if (wantsTon) {
    tonarium = { top, height: tonariumExtra(k) };
    top += tonarium.height;
  }
  return { prosodia, chironomia, tonarium, extra: top };
}

// ═══════════════════════════════════════════════════════════════════════════
// PROSODIA — the word's band below the lyric line (diagram-word-track-08)
// ═══════════════════════════════════════════════════════════════════════════
// How the melody treats the text, read at two grains in two lanes:
//
//   THE WORD LANE (upper). One tent per word — the hairpin pair's top edge,
//   dynamics' own mark for swell and release: straight sides cresting through
//   a small rounded cap, the apex over the accented syllable. Accented words
//   rise past the lane's single rule; unaccented crest on it. At the peak,
//   rubrica — the word's claim: a FILLED dot when the accent lands arsic
//   (struck), an OPEN ring when it lands thetic (deferred).
//
//   THE FENCE (lower, on a rail). One mark per syllable, by how the melody
//   treats it: a spoken syllable (< 4 notes) stands as a stem, height = its
//   notes; a syllable recited on the tenor LIES FLAT — a short dash floating
//   above the rail (form, not stratum: two opacities of one stem never
//   separated at a glance); a melisma (4+ notes, the capsule threshold) is a
//   BLOCK whose width is its real ink extent and whose height is its count.
//   Connected melismas join into ONE RIDGE — a piecewise terrain through
//   their peaks; each block is the area under it, the thread between blocks
//   is the same line crossing the gaps. Counts of 8+ print inside their
//   blocks. A divisio drops one hairline through both lanes: the text's
//   breath phrases the band.
//
// Accents are the BOOK'S written accents (GABC accented vowels) — no penult
// derivation, deliberately. All constants are the round-08 lab values at
// staffHeight 40; `k` scales them with the staff.

export interface ProsodiaConfig {
  /** Scale factor: staffInterval / (40/6) — 1 at the default staffHeight. */
  k: number;
  /** Band top within a system (system-local): the lyric baseline plus the
   *  band's offset in the stack. */
  laneTop: number;
  /** Right edge available to the band, per system (page x). */
  rightFor: (system: number) => number;
  /** The liturgical red for the accent dots (the 2026-08-11 amendment). */
  rubricaColor: string;
}

/** Band room the prosodia reserves below each system's lyric line. The 8
 *  beyond the band's own ink is AIR: without it the chironomia's crest
 *  letters sat visibly tighter to this band than the tonarium sits to the
 *  wave's troughs, and the stack read as unevenly spaced. */
export function prosodiaExtra(k: number): number {
  return 72 * k;
}

// The lane's vertical constants, from the band top (k = 1).
const P_WORD_BASE = 38;  // the word lane's baseline
// The tent's swell, as two points on the nib. At the word's edges it is
// thinner than the old flat 0.8; at the accent it is half again as thick,
// so the hairpin is legible as pressure and not only as outline.
const P_TENT_VN_MIN = 0.05;
const P_TENT_VN_MAX = 0.55;
// The accent dot. The word's claim is the loudest thing the prosodia says
// and it was the smallest mark drawn — 1.9 read as a tick on the crest
// rather than the peak's own mark.
const P_ACC_R = 2.5;
const P_TENT_ACC = 16;   // an accented word's crest — above the rule
const P_TENT_PLAIN = 8;  // an unaccented word's crest — ON the rule
const P_RAIL = 58;       // the fence's rail
const P_STEM_W = 1.4;    // the one mark width (not a nib — nothing varies)
/** The fence's height law, shared by stems and blocks: notes → px. */
const prosH = (n: number, k: number): number =>
  Math.min(14, 5 + (n - 1) * 0.9) * k;

/** One syllable as the prosodia reads it, with its per-system extents. */
interface ProsSyl {
  notes: TrackNote[];
  n: number;
  /** The system the syllable BEGINS in (a wrapped melisma keeps its marks
   *  where it starts; the tail extends the word's tent in the next system). */
  system: number;
  x0: number;
  x1: number;
  tail: { system: number; x0: number; x1: number } | null;
  accent: boolean;
  arsic: boolean;
  onTenor: boolean;
  divisio: boolean;
  wordStart: boolean;
}

/** Group placed notes into syllables, in singing order. */
function prosSyllables(notes: TrackNote[]): ProsSyl[] {
  const order: string[] = [];
  const by = new Map<string, TrackNote[]>();
  for (const n of notes) {
    const key = `${n.row.phraseIndex}.${n.row.syllableIndex}`;
    if (!by.has(key)) { by.set(key, []); order.push(key); }
    by.get(key)!.push(n);
  }
  const out: ProsSyl[] = [];
  for (const key of order) {
    const ns = by.get(key)!;
    // The system the syllable begins in — NOT the min-x note's system: a
    // wrapped melisma's continuation starts at the next system's left margin,
    // which is the smaller x (the lab shipped that bug once).
    const system = Math.min(...ns.map((n) => n.system));
    const own = ns.filter((n) => n.system === system);
    const tailSystem = Math.max(...ns.map((n) => n.system));
    let tail: ProsSyl["tail"] = null;
    if (tailSystem !== system) {
      const tn = ns.filter((n) => n.system === tailSystem);
      tail = {
        system: tailSystem,
        x0: Math.min(...tn.map((n) => n.inkLeft)),
        x1: Math.max(...tn.map((n) => n.inkRight)),
      };
    }
    const tenorN = ns.filter((n) => n.row.role === "tenor").length;
    out.push({
      notes: ns,
      n: ns.length,
      system,
      x0: Math.min(...own.map((n) => n.inkLeft)),
      x1: Math.max(...own.map((n) => n.inkRight)),
      tail,
      accent: ns.some((n) => n.row.accent),
      arsic: ns[0]!.row.rhythmicShape === "arsic",
      onTenor: tenorN > ns.length / 2,
      divisio: ns[ns.length - 1]!.row.divisio != null,
      wordStart: ns[0]!.row.wordStart,
    });
  }
  return out;
}

/** The prosodia track, every system. */
export function buildProsodia(notes: TrackNote[], cfg: ProsodiaConfig): string {
  if (notes.length === 0) return "";
  const k = cfg.k;
  const sylls = prosSyllables(notes);
  const systemYs = new Map<number, number>();
  for (const n of notes) if (!systemYs.has(n.system)) systemYs.set(n.system, n.systemY);
  const railYOf = (s: number): number => (systemYs.get(s) ?? 0) + cfg.laneTop + P_RAIL * k;
  const wordBaseOf = (s: number): number => (systemYs.get(s) ?? 0) + cfg.laneTop + P_WORD_BASE * k;

  // Per-system extents — tails included, so a system whose only prosodia ink
  // is a wrapped melisma's continuation still gets its rule and rail.
  const extent = new Map<number, { min: number; max: number }>();
  const grow = (s: number, x0: number, x1: number): void => {
    const e = extent.get(s) ?? { min: Infinity, max: -Infinity };
    e.min = Math.min(e.min, x0);
    e.max = Math.max(e.max, x1);
    extent.set(s, e);
  };
  for (const s of sylls) {
    grow(s.system, s.x0, s.x1);
    if (s.tail) grow(s.tail.system, s.tail.x0, s.tail.x1);
  }

  const g: string[] = ['<g class="prosodia">'];

  // ── the rule and the rail, per system ──
  for (const [s, e] of extent) {
    const xL = e.min - 2 * k;
    const xR = Math.min(e.max + 2 * k, cfg.rightFor(s));
    const yRule = wordBaseOf(s) - P_TENT_PLAIN * k;
    g.push(`<line x1="${xL.toFixed(1)}" y1="${yRule.toFixed(1)}" x2="${xR.toFixed(1)}" y2="${yRule.toFixed(1)}" ` +
      `stroke="${INK}" stroke-opacity="${STRATUM.rule}" stroke-width="${sc(0.5 * k)}"/>`);
    const yRail = railYOf(s);
    g.push(`<line x1="${xL.toFixed(1)}" y1="${yRail.toFixed(1)}" x2="${xR.toFixed(1)}" y2="${yRail.toFixed(1)}" ` +
      `stroke="${INK}" stroke-opacity="${STRATUM.rail}" stroke-width="${sc(0.5 * k)}"/>`);
  }

  // ── the fence: stems, tenor dashes, the melisma ridge, divisio ──
  const mel = sylls.filter((s) => s.n >= 4);
  const melBySys = new Map<number, ProsSyl[]>();
  for (const m of mel) {
    const a = melBySys.get(m.system) ?? [];
    a.push(m);
    melBySys.set(m.system, a);
  }
  for (const [s, arr] of melBySys) {
    arr.sort((a, b) => a.x0 - b.x0);
    const yB = railYOf(s);
    const pts = arr.map((p) => [(p.x0 + p.x1) / 2, prosH(p.n, k)] as const);
    // The ridge: piecewise-linear through the peaks, flat beyond the ends.
    const ridge = (x: number): number => {
      if (x <= pts[0]![0]) return pts[0]![1];
      if (x >= pts[pts.length - 1]![0]) return pts[pts.length - 1]![1];
      for (let i = 1; i < pts.length; i++) {
        if (x <= pts[i]![0]) {
          const [xa, ha] = pts[i - 1]!;
          const [xb, hb] = pts[i]!;
          return ha + (hb - ha) * ((x - xa) / (xb - xa));
        }
      }
      return pts[pts.length - 1]![1];
    };
    arr.forEach((p, i) => {
      const xc = (p.x0 + p.x1) / 2;
      const h = prosH(p.n, k);
      // The block: the area under the ridge across its real extent.
      g.push(`<path d="M${p.x0.toFixed(1)} ${yB.toFixed(1)} ` +
        `L${p.x0.toFixed(1)} ${(yB - ridge(p.x0)).toFixed(1)} ` +
        `L${xc.toFixed(1)} ${(yB - h).toFixed(1)} ` +
        `L${p.x1.toFixed(1)} ${(yB - ridge(p.x1)).toFixed(1)} ` +
        `L${p.x1.toFixed(1)} ${yB.toFixed(1)} Z" fill="${INK}" fill-opacity="${STRATUM.block}"/>`);
      if (p.n >= 8) {
        g.push(`<text x="${xc.toFixed(1)}" y="${(yB - h / 2 + 2.6 * k).toFixed(1)}" ` +
          `font-size="${sc(7 * k)}" text-anchor="middle" fill="${INK}" ` +
          `opacity="${STRATUM.letters}" font-family="${esc(HOUSE_MONO)}">${p.n}</text>`);
      }
      // The thread: the same ridge, crossing the gap to the next block.
      if (i + 1 < arr.length) {
        const q = arr[i + 1]!;
        g.push(`<line x1="${p.x1.toFixed(1)}" y1="${(yB - ridge(p.x1)).toFixed(1)}" ` +
          `x2="${q.x0.toFixed(1)}" y2="${(yB - ridge(q.x0)).toFixed(1)}" ` +
          `stroke="${INK}" stroke-opacity="${STRATUM.rail}" stroke-width="${sc(0.5 * k)}"/>`);
      }
    });
  }
  for (const p of sylls) {
    const yB = railYOf(p.system);
    if (p.n < 4) {
      if (p.onTenor) {
        // Recitation is flatness: the syllable lies down.
        g.push(`<line x1="${p.x0.toFixed(1)}" y1="${(yB - 3 * k).toFixed(1)}" ` +
          `x2="${Math.min(p.x1, p.x0 + 9 * k).toFixed(1)}" y2="${(yB - 3 * k).toFixed(1)}" ` +
          `stroke="${INK}" stroke-opacity="${STRATUM.letters}" stroke-width="${sc(P_STEM_W * k)}"/>`);
      } else {
        g.push(`<line x1="${p.x0.toFixed(1)}" y1="${yB.toFixed(1)}" ` +
          `x2="${p.x0.toFixed(1)}" y2="${(yB - prosH(p.n, k)).toFixed(1)}" ` +
          `stroke="${INK}" stroke-opacity="${STRATUM.letters}" stroke-width="${sc(P_STEM_W * k)}"/>`);
      }
    }
    if (p.divisio) {
      // One hairline through both lanes, ending exactly at the rail.
      const yTop = wordBaseOf(p.system) - P_TENT_ACC * k;
      g.push(`<line x1="${(p.x1 + 4 * k).toFixed(1)}" y1="${yTop.toFixed(1)}" ` +
        `x2="${(p.x1 + 4 * k).toFixed(1)}" y2="${yB.toFixed(1)}" ` +
        `stroke="${INK}" stroke-opacity="${STRATUM.rail}" stroke-width="${sc(0.5 * k)}"/>`);
    }
  }

  // ── the word lane: one tent per word, rubrica at the accent's peak ──
  interface Seg { x0: number; x1: number; accX: number | null; arsic: boolean }
  const words: ProsSyl[][] = [];
  for (const s of sylls) {
    if (s.wordStart || words.length === 0) words.push([]);
    words[words.length - 1]!.push(s);
  }
  for (const word of words) {
    const segs = new Map<number, Seg>();
    const seg = (s: number): Seg => {
      const e = segs.get(s) ?? { x0: Infinity, x1: -Infinity, accX: null, arsic: false };
      segs.set(s, e);
      return e;
    };
    for (const s of word) {
      const e = seg(s.system);
      e.x0 = Math.min(e.x0, s.x0);
      e.x1 = Math.max(e.x1, s.x1);
      if (s.accent) { e.accX = s.x0; e.arsic = s.arsic; }
      if (s.tail) {
        const te = seg(s.tail.system);
        te.x0 = Math.min(te.x0, s.tail.x0);
        te.x1 = Math.max(te.x1, s.tail.x1);
      }
    }
    for (const [s, e] of segs) {
      const yW = wordBaseOf(s);
      // The crest: an accented word rises past the rule; a plain one touches
      // it. Narrow words tent gently rather than spiking.
      const target = (e.accX != null ? P_TENT_ACC : P_TENT_PLAIN) * k;
      const hT = Math.max(4 * k, Math.min(target, (e.x1 - e.x0) * 0.55));
      const yT = yW - hT;
      const xa = e.accX != null
        ? Math.min(Math.max(e.accX, e.x0 + 3 * k), e.x1 - 3 * k)
        : (e.x0 + e.x1) / 2;
      // Straight sides, a slight roundness at the crest: a small quadratic
      // cap tangent to both slopes. The rubrica dot sits on the curve's own
      // peak (the quadratic midpoint), not the sharp corner it replaced.
      const lw = xa - e.x0;
      const rw = e.x1 - xa;
      const r = Math.min(3.5 * k, lw * 0.4, rw * 0.4);
      let d: string;
      let yPeak: number;
      if (r > 0.8 * k) {
        const yL = yW - hT * (1 - r / lw);
        const yR = yW - hT * (1 - r / rw);
        d = `M${e.x0.toFixed(1)} ${yW.toFixed(1)} L${(xa - r).toFixed(1)} ${yL.toFixed(1)} ` +
          `Q${xa.toFixed(1)} ${yT.toFixed(1)} ${(xa + r).toFixed(1)} ${yR.toFixed(1)} ` +
          `L${e.x1.toFixed(1)} ${yW.toFixed(1)}`;
        yPeak = (yL + 2 * yT + yR) / 4;
      } else {
        d = `M${e.x0.toFixed(1)} ${yW.toFixed(1)} L${xa.toFixed(1)} ${yT.toFixed(1)} ` +
          `L${e.x1.toFixed(1)} ${yW.toFixed(1)}`;
        yPeak = yT;
      }
      // THE TENT TAKES THE NIB, like the chironomy ribbon and the tonarium
      // sparkline — and it takes the nib the way they do, as a WIDTH THAT
      // VARIES. The word is a swell, and the mark now swells with it: thin
      // where the word begins, thickest at the accent, thin again at its
      // end. That is the hairpin the shape was always drawing in outline
      // only, said in pressure as well.
      //
      // A stroke cannot vary its own width, so the tent is a RIBBON: the
      // same builder the chironomy uses, sampled along the path it used to
      // stroke. `vat` is distance from the accent rather than a velocity —
      // the nib is a pressure law, and what presses here is the accent.
      const pts: [number, number][] = [];
      const STEPS = 24;
      for (let i = 0; i <= STEPS; i++) {
        const t = i / STEPS;
        // Walk the two slopes, left of the crest then right of it.
        const x = e.x0 + (e.x1 - e.x0) * t;
        const y = x <= xa
          ? yW - hT * (lw > 0 ? (x - e.x0) / lw : 1)
          : yW - hT * (rw > 0 ? (e.x1 - x) / rw : 1);
        pts.push([x, y]);
      }
      const halfW = Math.max(lw, rw) || 1;
      g.push(`<path d="${ribbonPath(pts,
        (x) => P_TENT_VN_MIN
          + (P_TENT_VN_MAX - P_TENT_VN_MIN)
            * Math.max(0, 1 - Math.abs(x - xa) / halfW),
        1, k)}" fill="${INK}" fill-opacity="${STRATUM.margin}"/>`);
      if (e.accX != null) {
        g.push(e.arsic
          ? `<circle cx="${xa.toFixed(1)}" cy="${yPeak.toFixed(1)}" r="${sc(P_ACC_R * k)}" fill="${cfg.rubricaColor}"/>`
          : `<circle cx="${xa.toFixed(1)}" cy="${yPeak.toFixed(1)}" r="${sc(P_ACC_R * k)}" fill="none" ` +
            `stroke="${cfg.rubricaColor}" stroke-width="${sc(0.9 * k)}"/>`);
      }
    }
  }

  g.push("</g>");
  return g.join("");
}

// ═══════════════════════════════════════════════════════════════════════════
// CHIRONOMIA — the hand's wave below the staff (plate-chiron-14)
// ═══════════════════════════════════════════════════════════════════════════
// One continuous line per system: arsic beats crest, thetic beats trough,
// single-note thetic beats pass through shallow (PT), pick-up loops where
// consecutive arses sit close (Carroll: "the hand moves back in a quick
// little arc"), a settling tail at each divisio. Pressure is the governing
// nib: velocity → stroke width, ink at the wave stratum. All constants are
// the chiron-14 plate values at staffHeight 40; `k` scales them with the
// staff.

export interface ChironomiaConfig {
  /** Scale factor: staffInterval / (40/6) — 1 at the default staffHeight. */
  k: number;
  /** y of the wave's midline within a system (system-local). */
  waveMidY: number;
}

/** Band room the chironomia reserves below each system's lyric line. */
export function chironomiaExtra(k: number): number {
  return 50 * k;
}

interface Beat {
  x0: number;
  shape: "arsic" | "thetic";
  n: number;
  endDiv: boolean;
  endX: number | null;
}

interface WavePt {
  x: number;
  amp: number;
  labs: string[];
  up: boolean;
  bx1: number;
  div: boolean;
  y: number;
}

/** Group a system's anchors into compound beats and place their crests. */
function beatsToPts(anchors: { x: number; idx: number; shape: "arsic" | "thetic"; end: boolean }[],
  k: number): { pts: WavePt[]; last: number } {
  const beats: Beat[] = [];
  for (let j = 0; j < anchors.length; j++) {
    const a = anchors[j]!;
    if (a.idx === 1 || beats.length === 0) {
      beats.push({ x0: a.x + 4.5 * k, shape: a.shape, n: 0, endDiv: false, endX: null });
    }
    beats[beats.length - 1]!.n += 1;
    if (a.end) {
      beats[beats.length - 1]!.endDiv = true;
      beats[beats.length - 1]!.endX = a.x + 10 * k;
    }
  }
  const last = anchors[anchors.length - 1]!.x + 10 * k;
  const pts: WavePt[] = [];
  for (let i = 0; i < beats.length; i++) {
    const b = beats[i]!;
    const x1 = b.endDiv ? b.endX! : i < beats.length - 1 ? beats[i + 1]!.x0 : last;
    const span = x1 - b.x0;
    let amp: number;
    let up: boolean;
    let labs: string[];
    if (b.shape === "arsic") {
      amp = Math.min(8.2 * k + 2.2 * k * (b.n - 1) + span * 0.022, 14.5 * k);
      up = true;
      labs = ["A"];
    } else {
      const passing = b.n === 1;
      amp = passing ? 4.4 * k : Math.min(6.6 * k + 1.7 * k * (b.n - 1) + span * 0.017, 10.8 * k);
      up = false;
      labs = passing ? ["PT"] : ["T"];
    }
    pts.push({ x: b.x0 + span * 0.42, amp, labs, up, bx1: x1, div: b.endDiv, y: 0 });
  }
  return { pts, last };
}

/** The chiron-12 wave engine: merge, breathe, chain, loop, settle. */
function waveEngine(ptsIn: WavePt[], last: number, yM: number, k: number,
  vat: (x: number) => number, vmax: number): string {
  // Close thetic neighbors merge into one broader trough (never across a div).
  const pts: WavePt[] = [];
  for (const p of ptsIn) {
    const prev = pts[pts.length - 1];
    if (prev && !prev.up && !p.up && !prev.div && p.x - prev.x < 38 * k) {
      prev.x = (prev.x + p.x) / 2;
      prev.amp = Math.max(prev.amp, p.amp) + 0.6 * k;
      prev.labs.push(...p.labs);
      prev.bx1 = p.bx1;
      prev.div = p.div;
    } else {
      pts.push({ ...p, labs: [...p.labs] });
    }
  }
  // Tight opposite-direction neighbors both relax.
  for (let i = 0; i + 1 < pts.length; i++) {
    if (pts[i + 1]!.x - pts[i]!.x < 18 * k && pts[i]!.up !== pts[i + 1]!.up) {
      pts[i]!.amp *= 0.8;
      pts[i + 1]!.amp *= 0.8;
    }
  }
  for (const p of pts) p.y = p.up ? yM - p.amp : yM + p.amp;
  for (let i = 1; i < pts.length; i++) {
    if (pts[i]!.x - pts[i - 1]!.x < 13 * k) {
      pts[i]!.x = Math.min(pts[i - 1]!.x + 13 * k, pts[i]!.bx1 + 8 * k);
    }
  }

  // Node chain: crests/troughs joined by saddles; loops between close arses;
  // a return to the midline after every divisio.
  type Node = ["pt", Pt] | ["loop", null];
  const nodes: Node[] = [["pt", [pts[0]!.x, pts[0]!.y]]];
  for (let i = 0; i + 1 < pts.length; i++) {
    const p = pts[i]!;
    const nxt = pts[i + 1]!;
    if (p.div) {
      nodes.push(["pt", [p.bx1 + 2 * k, yM]]);
    } else if (p.up && nxt.up) {
      const gap = nxt.x - p.x;
      if (gap >= 15 * k && gap < 34 * k) nodes.push(["loop", null]);
      else if (gap >= 34 * k) {
        const keep = 0.42 * Math.min(Math.abs(p.y - yM), Math.abs(nxt.y - yM));
        nodes.push(["pt", [(p.x + nxt.x) / 2, yM - keep]]);
      }
    } else if (!p.up && !nxt.up) {
      const keep = 0.42 * Math.min(Math.abs(p.y - yM), Math.abs(nxt.y - yM));
      nodes.push(["pt", [(p.x + nxt.x) / 2, yM + keep]]);
    }
    nodes.push(["pt", [nxt.x, nxt.y]]);
  }
  nodes.push(["pt", [last + 8 * k, yM + 1.5 * k]]);

  const chains: Pt[][] = [[]];
  for (const [kind, val] of nodes) {
    if (kind === "loop") chains.push([]);
    else chains[chains.length - 1]!.push(val as Pt);
  }

  // The entry arc — the hand's pick-up into the first beat.
  const samples: Pt[] = [];
  const first = chains[0]![0]!;
  const r = 5.5 * k + 0.55 * Math.abs(first[1] - yM);
  const s0: Pt = [first[0] - 10 * k, yM + 3 * k];
  const cy = yM - r - 3 * k;
  const lead: Pt = [first[0] - 8 * k, first[1] + (first[1] < yM ? 4 * k : -4 * k)];
  samples.push(...sampleCubic(s0, [first[0] + r * 0.55, cy], [first[0] - 10 * k - r, cy], lead, 18));
  chains[0] = [lead, ...chains[0]!];

  // Chains joined by pick-up loops (the little backward arc between arses).
  for (let ci = 0; ci < chains.length; ci++) {
    samples.push(...crSamples(chains[ci]!, 8));
    if (ci < chains.length - 1) {
      const a = chains[ci]![chains[ci]!.length - 1]!;
      const b = chains[ci + 1]![0]!;
      const g2 = Math.max(8 * k, (b[0] - a[0]) * 0.6);
      const ly = Math.max(a[1], b[1]) + g2 * 0.95;
      samples.push(...sampleCubic(a, [b[0] + g2, ly], [a[0] - g2, ly], b, 18));
    }
  }

  // The governing nib at the wave stratum.
  const d = ribbonPath(samples, vat, vmax, k);
  let out = `<g class="chironomia">` +
    `<path d="${d}" fill="${INK}" fill-opacity="${STRATUM.wave}" fill-rule="nonzero"/></g>`;

  // Pierik letters at the crests/troughs (a merged trough lists each thesis).
  const letters: string[] = ['<g class="chironomia-letters">'];
  for (const p of pts) {
    const labs = [...new Set(p.labs)];
    for (let j = 0; j < labs.length; j++) {
      const lx = p.x + (j - (labs.length - 1) / 2) * 13 * k;
      const ly = p.up ? p.y - 4 * k : p.y + 11.5 * k;
      letters.push(
        `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" font-size="${(9 * k).toFixed(1)}" ` +
        `text-anchor="middle" fill="${INK}" opacity="${STRATUM.letters}" ` +
        `font-family="${esc(HOUSE_SERIF)}">${labs[j]}</text>`,
      );
    }
  }
  letters.push("</g>");
  out += letters.join("");
  return out;
}

/** The chironomy track: wave + letters, every system. */
export function buildChironomia(notes: TrackNote[], cfg: ChironomiaConfig): string {
  if (notes.length === 0) return "";
  const { k } = cfg;
  const vmax = velocityCeiling(notes.map((n) => n.row.velocity));
  const systems = [...new Set(notes.map((n) => n.system))].sort((a, b) => a - b);
  const out: string[] = [];

  for (const s of systems) {
    const sysNotes = notes.filter((n) => n.system === s);
    const yM = sysNotes[0]!.systemY + cfg.waveMidY;

    // Anchors: one per note; `end` marks the last note of a divisio phrase.
    const anchors = sysNotes.map((n, i) => ({
      x: n.x,
      idx: n.row.rhythmicIndex,
      shape: n.row.rhythmicShape,
      end: (i + 1 >= sysNotes.length || sysNotes[i + 1]!.row.phraseIndex !== n.row.phraseIndex) &&
        n.row.divisio != null,
    }));
    const velpts: Pt[] = sysNotes.map((n) => [n.x, n.row.velocity ?? 0.3]);
    const vat = velocityAt(velpts);
    const { pts, last } = beatsToPts(anchors, k);
    if (pts.length === 0) continue;
    out.push(waveEngine(pts, last, yM, k, vat, vmax));
  }
  return out.join("");
}

// ═══════════════════════════════════════════════════════════════════════════
// TONARIUM — the melodic-analysis lane below the staff (tonarium-08)
// ═══════════════════════════════════════════════════════════════════════════
// The mode staff: all four maneriae rails, D on the bottom (the finals ladder —
// categories, not pitches, so the rails carry no letters). Through it, the
// sparkline: the melody in the lane's own compressed-ambitus axis, drawn with
// the governing nib at the spark stratum. The MODE LINE steps between rails
// in rubrica — the governing mode per phrase, its numeral in the strip above
// (authentic-vs-plagal lives in the numeral); an inflection is a solid lean,
// a transposition (the affinal frame read as displacement) draws dashed. A
// cadence is the sparkline's OWN ENDING re-inked at full strength (ruled
// 2026-07-29 — no redrawn sigil, no extra weight; the ink change alone marks
// the claim), landing on a terminal node — filled when the family's measured
// finality closes (the CADENTIAE join), open when it suspends. Beneath, a
// light end-ticked bracket ties the figure to its label: the signature
// ("2,0,-2 @0") — the 07-28 ruling, the signature IS the name. The label
// always FOLLOWS its figure, clamping to the margin at the system's edge;
// crowded labels dodge to a second row. Weak claims (confidence < 0.45) draw
// nothing.

export interface TonariumConfig {
  /** Scale factor: staffInterval / (40/6) — 1 at the default staffHeight. */
  k: number;
  /** Lane top within a system (system-local). */
  laneTop: number;
  /** Right edge available to the lane, per system (page x). */
  rightFor: (system: number) => number;
  /** Serif family for the mode numerals (the lyric/annotation face). */
  serifFamily: string;
  /** The liturgical red for the mode line. */
  rubricaColor: string;
}

const LANE_H = 42;
/** Band room the tonarium reserves below each system's lyric line. */
export function tonariumExtra(k: number): number {
  return 78 * k;
}

const MODE_FINAL: Record<number, string> = { 1: "D", 2: "D", 3: "E", 4: "E", 5: "F", 6: "F", 7: "G", 8: "G" };
const RAIL_ORDER = ["D", "E", "F", "G"]; // the finals ladder, D on the bottom
const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

// A family's occurrences in one mode must reach this before its in-mode share
// is printed. Under it the figure is a rumour: one or two chants deciding a
// percentage that reads like a measurement.
const SHARE_FLOOR = 10;

/**
 * What the label says about a cadence: HOW OFTEN THIS FAMILY ENDS A CHANT IN
 * THIS MODE. "3.9%" — the frequency a singer actually meets it at.
 *
 * It used to print a lift, the family's in-mode share over its corpus share
 * ("×2.3"). That number answered a real question — is this close distinctive
 * of this mode — but it read as a verdict it could not support. Measured over
 * the corpus: 89% of cadences score above ×1 and the median is ×2.29, so a
 * "×1.9" that looks like a strong claim is in fact below average. Worse, it
 * ORDERS WRONGLY: in mode 8 the family at ×1.8 ends 3.9% of chants where the
 * one at ×2.3 ends 2.0%, so the more distinctive-looking label marks the
 * rarer close. A share has neither problem — it is directly readable, needs
 * no baseline held in the reader's head, and sorts the way a singer meets
 * them. The lift stays available on the group (`data-lift`) for a caller who
 * wants distinctiveness rather than frequency.
 *
 * The share is read against the CHANT'S mode even where the mode line above
 * shows a governing modulation at that phrase. Deliberate: the question is
 * "how common is this close in this chant's mode?", and re-basing per-phrase
 * would make two adjacent labels incomparable.
 */
function cadenceLabel(fam: CadentiaFamilia | undefined, mode?: number): string {
  // NO CATALOGUE FAMILY IS ITSELF A MEASUREMENT. CADENTIAE holds the families
  // above a floor of fifty corpus occurrences — 110 of them — so a close that
  // fails to join is not unknown, it is RARER than anything the catalogue
  // records. A third of inked cadences land here, and leaving them bare made
  // the rarest closes look like the ones the analysis had nothing to say
  // about.
  //
  // A WORD, NOT A NUMBER. The shares printed beside it run down to 0.2%, so
  // any numeral here would be read on their scale — and "<1%" put an
  // uncatalogued close ABOVE a catalogued 0.3%, exactly backwards. `rara`
  // cannot be compared to a percentage by accident, agrees with the cadentia
  // it describes, and sits in the Latin the rest of the page already speaks
  // (finalis, tenor, diapason).
  if (!fam) return "rara";
  const share = (n: number) => `${(n * 100).toFixed(1)}%`;
  if (mode == null) return share(fam.share);
  const inMode = fam.modes[String(mode)] ?? 0;
  const modeEnds = CADENTIAE_POPULATION.byMode[String(mode)] ?? 0;
  // Too thin to divide, or no mode population: fall back to the corpus share,
  // which is the same KIND of number — a frequency, not a ratio.
  if (inMode < SHARE_FLOOR || !modeEnds) return share(fam.share);
  return share(inMode / modeEnds);
}

/** The family's lift — its in-mode share against its corpus share. Not shown
 *  on the page (see cadenceLabel), but carried on the group so a caller can
 *  ask how DISTINCTIVE a close is rather than how common. */
function cadenceLift(fam: CadentiaFamilia | undefined, mode?: number): string | null {
  if (!fam || mode == null || !fam.share) return null;
  const inMode = fam.modes[String(mode)] ?? 0;
  const modeEnds = CADENTIAE_POPULATION.byMode[String(mode)] ?? 0;
  if (inMode < SHARE_FLOOR || !modeEnds) return null;
  return ((inMode / modeEnds) / fam.share).toFixed(2);
}

/** The tonarium track, every system. */
export function buildTonarium(notes: TrackNote[], data: TrackData,
  cfg: TonariumConfig): string {
  if (notes.length === 0) return "";
  const out: string[] = [];
  const k = cfg.k;
  const laneH = LANE_H * k;

  // The lane's own axis: the chant's ambitus, compressed. True pitch heights.
  const midis = notes.map((n) => n.row.midi);
  const lo = Math.min(...midis);
  const hi = Math.max(...midis, lo + 1);
  const laneY = (systemY: number, midi: number): number =>
    systemY + cfg.laneTop + laneH - 4 * k - ((midi - lo) / (hi - lo)) * (laneH - 8 * k);
  const railY = (systemY: number, letter: string): number =>
    systemY + cfg.laneTop + 33 * k - RAIL_ORDER.indexOf(letter) * 9 * k;

  const vmax = velocityCeiling(notes.map((n) => n.row.velocity));
  const home = data.mode != null && MODE_FINAL[data.mode] ? data.mode : undefined;

  // The governing mode of a phrase: the strongest modulation covering it at or
  // above the floor, else home. Kind rides along — transpositions draw dashed.
  const governing = (p: number): { mode: number; conf: number; kind: string } | null => {
    let best: Modulation | null = null;
    for (const m of data.modulations) {
      if (m.confidence >= CONF_FLOOR && m.startPhrase <= p && p <= m.endPhrase &&
        (!best || m.confidence > best.confidence)) best = m;
    }
    if (best) return { mode: best.toMode, conf: best.confidence, kind: best.kind };
    return home != null ? { mode: home, conf: 1, kind: "home" } : null;
  };

  const systems = [...new Set(notes.map((n) => n.system))].sort((a, b) => a - b);

  // WHERE EACH CADENCE LANDS. `notes` is in tabula order, so the last note
  // carrying a cadenceRef is that cadence's closing note, and the system it
  // sits in is the only one that may draw the closing dot and the label. A
  // figure that wraps is re-inked in every system it crosses — the claim spans
  // them — but it CLOSES once. Drawn per-system, a wrapped cadence printed its
  // landing dot on the earlier fragment's last sample (a landing mid-figure)
  // and repeated its label, so one close read as two.
  const landingSystem = new Map<number, number>();
  for (const n of notes) {
    if (n.row.cadenceRef != null) landingSystem.set(n.row.cadenceRef, n.system);
  }

  for (const s of systems) {
    const sysNotes = notes.filter((n) => n.system === s);
    const sysY = sysNotes[0]!.systemY;
    const xs = sysNotes.map((n) => n.x);
    const xL = Math.min(...xs) - 4 * k;
    const xR = Math.min(Math.max(...xs) + 10 * k, cfg.rightFor(s));
    const g: string[] = ['<g class="tonarium">'];

    // ── the mode staff: all four maneriae rails, always ──
    for (const letter of RAIL_ORDER) {
      const y = railY(sysY, letter);
      g.push(`<line x1="${xL.toFixed(1)}" y1="${y.toFixed(1)}" x2="${xR.toFixed(1)}" y2="${y.toFixed(1)}" ` +
        `stroke="${INK}" stroke-opacity="${STRATUM.rail}" stroke-width="${sc(0.55 * k)}"/>`);
    }

    // ── the sparkline: the governing nib at the spark stratum ──
    const velpts: Pt[] = sysNotes.map((n) => [n.x, n.row.velocity ?? 0.3]);
    const vat = velocityAt(velpts);
    const phrases = [...new Set(sysNotes.map((n) => n.row.phraseIndex))];
    const spark: Pt[] = [];
    const samplesByPhrase = new Map<number, Pt[]>();
    for (const p of phrases) {
      const pnotes = sysNotes.filter((n) => n.row.phraseIndex === p);
      const pts: Pt[] = pnotes.map((n) => [n.x, laneY(sysY, n.row.midi)]);
      spark.push(...pts);
      const samples = crSamples(pts, 10);
      samplesByPhrase.set(p, samples);
      if (samples.length < 2) continue;
      const d = ribbonPath(samples, vat, vmax, 1);
      g.push(`<path d="${d}" fill="${INK}" fill-opacity="${STRATUM.spark}"/>`);
    }

    // ── the mode line: rubrica, stepping between maneriae rails ──
    const STRIP_Y = railY(sysY, "G") - 5.5 * k;
    const stripX = (x0: number): number => {
      for (const cand of [x0 + 3.5 * k, x0 + 21 * k, x0 + 39 * k]) {
        if (spark.every(([px, py]) => Math.abs(px - cand) > 13 * k || py > STRIP_Y + 4.5 * k)) return cand;
      }
      return x0 + 3.5 * k;
    };
    interface Seg { mode: number; conf: number; kind: string; x0: number; x1: number }
    const segs: Seg[] = [];
    for (const p of phrases) {
      const gov = governing(p);
      if (!gov) continue;
      const px = sysNotes.filter((n) => n.row.phraseIndex === p).map((n) => n.x);
      const prev = segs[segs.length - 1];
      if (prev && prev.mode === gov.mode && prev.kind === gov.kind) {
        prev.x1 = Math.max(...px) + 8 * k;
      } else {
        segs.push({ ...gov, x0: Math.min(...px) - 2 * k, x1: Math.max(...px) + 8 * k });
      }
    }
    for (const sg of segs) {
      const y = railY(sysY, MODE_FINAL[sg.mode]!);
      const op = 0.55 + 0.45 * sg.conf;
      const dash = sg.kind === "transposition"
        ? ` stroke-dasharray="${sc(4 * k)} ${sc(2.6 * k)}"` : "";
      g.push(`<line x1="${sg.x0.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(sg.x1 - 3 * k).toFixed(1)}" y2="${y.toFixed(1)}" ` +
        `stroke="${cfg.rubricaColor}" stroke-width="${sc(1.05 * k)}" opacity="${op.toFixed(2)}"${dash} stroke-linecap="round"/>`);
      g.push(`<text x="${stripX(sg.x0).toFixed(1)}" y="${STRIP_Y.toFixed(1)}" font-size="${sc(10.5 * k)}" ` +
        `opacity="${op.toFixed(2)}" fill="${cfg.rubricaColor}" font-family="${esc(cfg.serifFamily)}" ` +
        `font-style="italic">${ROMAN[sg.mode]}</text>`);
    }

    // ── cadences: the sparkline's own ending, re-inked at full strength ──
    const yC = sysY + cfg.laneTop + laneH + 8 * k;
    // Close-set labels dodge to a second row instead of colliding.
    const labelRight: [number, number] = [-Infinity, -Infinity];
    for (let ci = 0; ci < data.cadences.length; ci++) {
      const cad = data.cadences[ci]!;
      if (cad.confidence < CONF_FLOOR) continue; // don't ink weak claims
      const fig = sysNotes.filter((n) => n.row.cadenceRef === ci);
      if (fig.length === 0) continue;
      // The figure's real extent. This was anchor-to-anchor with a 2k fudge
      // standing in for the ink the mapping had discarded.
      const x0 = Math.min(...fig.map((n) => n.inkLeft));
      const x1 = Math.max(...fig.map((n) => n.inkRight));
      const op = 0.45 + 0.5 * cad.confidence;
      const fam = cad.signature ? cadentiaFamilia(cad.signature) : undefined;
      // The score builder already joined finality; read it rather than
      // re-deriving. A cadence handed in straight from the detector carries
      // null here, and falls back to the modal target — see TrackData.cadences.
      const closes = (cad.finality ?? (cad.target === "finalis" ? 1 : 0)) >= 0.5;

      // The family key rides the group, not the page: the label now carries
      // the measure, so the NAME lives here — machine-readable, the join back
      // to CADENTIAE, and the provenance a margin gloss can print.
      const lift = cadenceLift(fam, data.mode);
      g.push(cad.signature
        ? `<g data-cadentia="${esc(cad.signature)}"${lift ? ` data-lift="${lift}"` : ""}>`
        : "<g>");

      // The figure's slice of its phrase's own samples — the same curve at
      // the same width, the ink change alone marking the claim.
      const samples = (samplesByPhrase.get(fig[0]!.row.phraseIndex) ?? [])
        .filter(([px]) => px >= x0 && px <= x1 + 2 * k);
      // Where the cadence LANDS — the closing dot, which the label centres on.
      // Only the landing system draws it; an earlier fragment re-inks the
      // ribbon and stops there.
      const lands = landingSystem.get(ci) === s;
      let dot: number | undefined;
      if (samples.length >= 2) {
        const d = ribbonPath(samples, vat, vmax, 1);
        g.push(`<path d="${d}" fill="${INK}" fill-opacity="${(STRATUM.cadence * op).toFixed(2)}"/>`);
        if (lands) {
          const [nx, ny] = samples[samples.length - 1]!;
          dot = nx;
          const r = sc(1.8 * k);
          g.push(closes
            ? `<circle cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="${r}" fill="${INK}" opacity="${op.toFixed(2)}"/>`
            : `<circle cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="${r}" fill="none" stroke="${INK}" ` +
              `stroke-width="${sc(0.9 * k)}" opacity="${op.toFixed(2)}"/>`);
        }
      }

      // The label: how characteristic this close is OF THIS CHANT'S MODE —
      // the family's in-mode share over its corpus share ("×2.1"). The raw
      // key is the family's name, but a name is not the question the diagram
      // asks; it moves to the margin (data-cadentia on the group) and the
      // reader gets the measure instead. It always FOLLOWS its figure; at the
      // system's edge it clamps to the margin rather than jumping to the
      // figure's other side. A light end-ticked bracket ties it to the span.
      const lab = cadenceLabel(fam, data.mode);
      if (lab && lands) {
        // The label sits UNDER THE CLOSING DOT, centred on it. The dot is
        // where the cadence lands — the one point the measure is about — so
        // the number belongs beneath it rather than trailing the figure at
        // the end of a bracket. The bracket is gone with it: it drew the
        // figure's span, which the re-inked sparkline above already draws,
        // and two marks for one extent read as two claims.
        const estW = lab.length * 5.6 * k; // 9px mono advance, measured
        // With fewer than two samples in the landing slice no dot was drawn;
        // the label centres on the figure's closing ink instead of orphaning.
        const dotX = dot ?? x1;
        const left = xL;
        const right = cfg.rightFor(s) - 2 * k;
        // Centred, then clamped into the system rather than allowed to hang
        // off either edge.
        const anchor = Math.max(left, Math.min(dotX - estW / 2, right - estW));
        const span: [number, number] = [anchor, anchor + estW];
        const row = span[0] < labelRight[0] + 8 * k ? 1 : 0;
        labelRight[row] = Math.max(labelRight[row], span[1]);
        const yRow = yC + row * 9.5 * k;
        g.push(`<text x="${anchor.toFixed(1)}" y="${(yRow + 2.8 * k).toFixed(1)}" font-size="${sc(9 * k)}" ` +
          `opacity="${(STRATUM.label * op).toFixed(2)}" fill="${INK}" ` +
          `font-family="${esc(HOUSE_MONO)}">${esc(lab)}</text>`);
      }
      g.push("</g>");
    }
    g.push("</g>");
    out.push(g.join(""));
  }
  return out.join("");
}
