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
import { CADENTIAE, type CadentiaFamilia } from "../../../data/cadentiae.js";

export type TrackName = "chironomia" | "tonarium";

/** Analysis fields inscriptio hands the emitters when tracks are requested —
 * the score-level data the flat tabula does not carry. */
export interface TrackData {
  cadences: Cadence[];
  modulations: Modulation[];
  /** Mode digit parsed from the chant's label; absent = no mode line. */
  mode?: number;
}

/** One placed note as the emitters record it — the tracks' working unit.
 * The same anchors the geometry contract exports, with the row attached. */
export interface TrackNote {
  row: ChantTabulaRow;
  x: number;
  y: number;
  system: number;
  systemY: number;
}

// ── The governing ink system ──
const INK = "#111";
/** Stratum opacities: one ink, graded. The melody strata (wave, spark) sit
 * under their annotations; a cadence claim re-inks at full strength. */
const STRATUM = {
  wave: 0.75,     // the chironomy line — the gesture itself
  spark: 0.45,    // the tonarium melody — context, not message
  cadence: 1.0,   // the claim: the melody's ending, full ink
  letters: 0.62,  // Pierik letters
  label: 0.9,     // signature labels
  bracket: 0.3,   // the label's end-ticked tie
  rail: 0.16,     // the maneriae rails
  margin: 0.38,   // the "cad" margin word
} as const;

/** THE nib — one pressure law for every track: normalized velocity → width. */
const nib = (vn: number): number => 0.5 + 1.5 * vn;

/** A scaled measure, at most two places and no trailing zeros: 1.8, not 1.80. */
const sc = (v: number): string => Number(v.toFixed(2)).toString();

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

const HOUSE_SANS = "'IBM Plex Sans', system-ui, sans-serif";
const HOUSE_MONO = "ui-monospace, Menlo, 'IBM Plex Mono', monospace";

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

type Pt = [number, number];

/** Sample one cubic Bézier segment (matches the generators' tessellation). */
function sampleCubic(p1: Pt, c1: Pt, c2: Pt, p2: Pt, steps: number): Pt[] {
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

/** Catmull–Rom through the points, sampled — the tracks' one curve idiom. */
function crSamples(pts: Pt[], steps: number): Pt[] {
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

/** Piecewise-linear velocity read along x between note anchors; the pressure
 * signal both tracks share. Null velocities (phrasing inactive) read 0.3. */
function velocityAt(velpts: Pt[]): (x: number) => number {
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

/** The chant's own velocity ceiling — pressure normalizes per chant, not to a
 * corpus constant (the plates' frozen 0.62 was a session artifact). */
function velocityMax(notes: TrackNote[]): number {
  let vmax = 0;
  for (const n of notes) if (n.row.velocity != null && n.row.velocity > vmax) vmax = n.row.velocity;
  return vmax > 0 ? vmax : 0.62;
}

/** A ribbon polygon around sampled points: THE nib at `scale`, velocity as
 * width — the one pressure stroke every track draws with. */
function ribbonPath(samples: Pt[], vat: (x: number) => number, vmax: number,
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
  // Close thetic neighbours merge into one broader trough (never across a div).
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
  // Tight opposite-direction neighbours both relax.
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
        `font-family="${esc(HOUSE_SANS)}">${labs[j]}</text>`,
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
  const vmax = velocityMax(notes);
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
const CONF_FLOOR = 0.45; // the weak-claim rule: below this, no ink

let _famIndex: Map<string, CadentiaFamilia> | null = null;
function famIndex(): Map<string, CadentiaFamilia> {
  if (!_famIndex) _famIndex = new Map(CADENTIAE.map((f) => [f.key, f]));
  return _famIndex;
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

  const vmax = velocityMax(notes);
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
      const x0 = Math.min(...fig.map((n) => n.x)) - 2 * k;
      const x1 = Math.max(...fig.map((n) => n.x));
      const op = 0.45 + 0.5 * cad.confidence;
      const fam = cad.signature ? famIndex().get(cad.signature) : undefined;
      const closes = (fam?.finality ?? (cad.target === "finalis" ? 1 : 0)) >= 0.5;

      // The figure's slice of its phrase's own samples — the same curve at
      // the same width, the ink change alone marking the claim.
      const samples = (samplesByPhrase.get(fig[0]!.row.phraseIndex) ?? [])
        .filter(([px]) => px >= x0 && px <= x1 + 2 * k);
      if (samples.length >= 2) {
        const d = ribbonPath(samples, vat, vmax, 1);
        g.push(`<path d="${d}" fill="${INK}" fill-opacity="${(STRATUM.cadence * op).toFixed(2)}"/>`);
        const [nx, ny] = samples[samples.length - 1]!;
        const r = sc(1.8 * k);
        g.push(closes
          ? `<circle cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="${r}" fill="${INK}" opacity="${op.toFixed(2)}"/>`
          : `<circle cx="${nx.toFixed(1)}" cy="${ny.toFixed(1)}" r="${r}" fill="none" stroke="${INK}" ` +
            `stroke-width="${sc(0.9 * k)}" opacity="${op.toFixed(2)}"/>`);
      }

      // The label: the signature — the catalogue key, the name (07-28 ruling).
      // It always FOLLOWS its figure; at the system's edge it clamps to the
      // margin rather than jumping to the figure's other side. A light
      // end-ticked bracket ties it to the span it names.
      const lab = cad.signature ?? "";
      if (lab) {
        const estW = lab.length * 5.6 * k; // 9px mono advance, measured
        const right = cfg.rightFor(s) - 2 * k;
        const anchor = Math.min(x1 + 4.5 * k, right - estW);
        const span: [number, number] = [anchor, anchor + estW];
        const row = span[0] < labelRight[0] + 8 * k ? 1 : 0;
        labelRight[row] = Math.max(labelRight[row], span[1]);
        const yRow = yC + row * 9.5 * k;
        const yB = yRow - 0.5 * k;
        const xB = x1 + 2 * k;
        const yTick = yB - 3.5 * k;
        const bw = `stroke="${INK}" stroke-opacity="${(STRATUM.bracket * op).toFixed(2)}" ` +
          `stroke-width="${sc(0.6 * k)}"`;
        g.push(
          `<line x1="${x0.toFixed(1)}" y1="${yB.toFixed(1)}" x2="${xB.toFixed(1)}" y2="${yB.toFixed(1)}" ${bw}/>` +
          `<line x1="${x0.toFixed(1)}" y1="${yB.toFixed(1)}" x2="${x0.toFixed(1)}" y2="${yTick.toFixed(1)}" ${bw}/>` +
          `<line x1="${xB.toFixed(1)}" y1="${yB.toFixed(1)}" x2="${xB.toFixed(1)}" y2="${yTick.toFixed(1)}" ${bw}/>`,
        );
        g.push(`<text x="${anchor.toFixed(1)}" y="${(yRow + 2.8 * k).toFixed(1)}" font-size="${sc(9 * k)}" ` +
          `opacity="${(STRATUM.label * op).toFixed(2)}" fill="${INK}" ` +
          `font-family="${esc(HOUSE_MONO)}">${esc(lab)}</text>`);
      }
    }
    if (s === 0) {
      g.push(`<text x="${(xL - 2 * k).toFixed(1)}" y="${(yC + 3 * k).toFixed(1)}" font-size="${sc(9 * k)}" ` +
        `text-anchor="end" fill="${INK}" opacity="${STRATUM.margin}" ` +
        `font-family="${esc(HOUSE_MONO)}">cad</text>`);
    }
    g.push("</g>");
    out.push(g.join(""));
  }
  return out.join("");
}
