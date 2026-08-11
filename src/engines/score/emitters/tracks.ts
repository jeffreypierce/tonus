// ---------------------------------------------------------------------------
// engines/score/emitters/tracks — the analysis tracks (chironomia, tonarium)
// ---------------------------------------------------------------------------
// The two analysis tracks the plate series locked, ported onto the emitters'
// own placements. Either rides either species and both may ride one score; the
// two-register principle is the house pairing, not a rule enforced here —
// quadrata as the body (rhythm as gesture, the chironomy wave; plate-chiron-14
// is the spec, its typus lane cut 2026-07-29 since the wave's own A/T letters
// already carry the incise's shape), moderna as the mind (pitch and mode, the
// tonarium lane; plate-tonarium-08, trued to the 2026-07-28 rulings: the
// SIGNATURE is a cadence's name — no familia binomials, no adventus case
// ladder; `arrival` already carries the number).
//
// THE GOVERNING INK SYSTEM (ruled 2026-07-29). One ink, one nib:
// - Every track mark draws in the score's black; strata differ by OPACITY
//   alone (the STRATUM table below), never by hue. Rubrica is the only color,
//   and it belongs to the mode line.
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

export type TrackName = "chironomia" | "tonarium";

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

/** THE STACK. Both tracks ride either species and may ride one score
 * together, so the band room is the sum of what each asks for. The order is
 * fixed here, not by the caller's array: the chironomia rides above, its wave
 * an extension of the lyric line's rhythm; the tonarium rides below, a panel
 * whose label row is its bottom edge and wants nothing under it. Requesting
 * ["tonarium", "chironomia"] therefore draws exactly what ["chironomia",
 * "tonarium"] draws. */
export function trackBands(tracks: readonly TrackName[] | undefined, k: number): {
  chironomia: TrackBand | null;
  tonarium: TrackBand | null;
  extra: number;
} {
  const wantsChiron = tracks?.includes("chironomia") ?? false;
  const wantsTon = tracks?.includes("tonarium") ?? false;
  let top = 0;
  let chironomia: TrackBand | null = null;
  let tonarium: TrackBand | null = null;
  if (wantsChiron) {
    chironomia = { top, height: chironomiaExtra(k) };
    top += chironomia.height;
  }
  if (wantsTon) {
    tonarium = { top, height: tonariumExtra(k) };
    top += tonarium.height;
  }
  return { chironomia, tonarium, extra: top };
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
  // above a floor of fifty corpus occurrences — 122 of them — so a close that
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
      if (m.confidence >= 0.4 && m.startPhrase <= p && p <= m.endPhrase &&
        (!best || m.confidence > best.confidence)) best = m;
    }
    if (best) return { mode: best.toMode, conf: best.confidence, kind: best.kind };
    return home != null ? { mode: home, conf: 1, kind: "home" } : null;
  };

  const systems = [...new Set(notes.map((n) => n.system))].sort((a, b) => a - b);
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
      let dot: number | undefined;
      if (samples.length >= 2) {
        const d = ribbonPath(samples, vat, vmax, 1);
        g.push(`<path d="${d}" fill="${INK}" fill-opacity="${(STRATUM.cadence * op).toFixed(2)}"/>`);
        const [nx, ny] = samples[samples.length - 1]!;
        dot = nx;
        const r = sc(1.8 * k);
        g.push(closes
          ? `<circle cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="${r}" fill="${INK}" opacity="${op.toFixed(2)}"/>`
          : `<circle cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="${r}" fill="none" stroke="${INK}" ` +
            `stroke-width="${sc(0.9 * k)}" opacity="${op.toFixed(2)}"/>`);
      }

      // The label: how characteristic this close is OF THIS CHANT'S MODE —
      // the family's in-mode share over its corpus share ("×2.1"). The raw
      // key is the family's name, but a name is not the question the diagram
      // asks; it moves to the margin (data-cadentia on the group) and the
      // reader gets the measure instead. It always FOLLOWS its figure; at the
      // system's edge it clamps to the margin rather than jumping to the
      // figure's other side. A light end-ticked bracket ties it to the span.
      const lab = cadenceLabel(fam, data.mode);
      if (lab) {
        // The label sits UNDER THE CLOSING DOT, centred on it. The dot is
        // where the cadence lands — the one point the measure is about — so
        // the number belongs beneath it rather than trailing the figure at
        // the end of a bracket. The bracket is gone with it: it drew the
        // figure's span, which the re-inked sparkline above already draws,
        // and two marks for one extent read as two claims.
        const estW = lab.length * 5.6 * k; // 9px mono advance, measured
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
