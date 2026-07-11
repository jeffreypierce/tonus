// ---------------------------------------------------------------------------
// engines/score/emitters/svg — square-note chant score as SVG (single line)
// ---------------------------------------------------------------------------
// Renders the score's tabula as a 4-line Gregorian staff with SMuFL glyphs
// (outlines baked from Bravura in smufl-glyphs.json). Fully self-contained: all
// notation is inline <path>; only lyric text uses a system font.
//
// SMuFL fonts are metrically standardized: 1 em = 4 staff spaces, so one staff
// space = upm/4 font units. Bravura's chant noteheads are drawn to fill ~0.8 of
// a space; Solesmes engraving leaves more air, so noteheads render at
// `noteScale` (default 0.8) of the SMuFL size while clefs and divisiones stay
// full-size. Staff positions are half-spaces from the bottom line (odd = lines,
// even = spaces); y = baseline − position × staffInterval.
//
// Figures follow Solesmes engraving: the pes stacks its two notes; the clivis
// is two abutting puncta with a left stem; the torculus three abutting puncta
// with junction stems; the porrectus uses the baked diagonal swash; descending
// inclinata cascade as diamonds. Stems overshoot the lower note slightly, as
// in the printed books.

import type { ChantTabulaRow } from "../tabula.js";
import type { Chant } from "../../chant/types.js";
import type { LyricRun } from "../types.js";
import { trimRuns } from "../lyric.js";
import { GLYPHS, GLYPH_UPM, type SmuflGlyph } from "../../../data/smufl-glyphs.js";
import {
  computeAccidentals, type AccidentalMode, type CentsBaseline, type AccidentalMark,
} from "./accidentals.js";
import {
  GLYPH,
  SHAPE_GLYPH,
  DIVISIO_GLYPH,
  ligaturaDesc,
} from "../../../data/gabc-glyphs.js";

/** A font face to embed into the SVG itself: the CALLER's bytes, base64.
 * tonus ships no font files — it is a conduit for data the consumer supplies,
 * so the consumer also carries the face's license terms. */
export interface FontEmbed {
  base64: string;
  format?: "opentype" | "truetype" | "woff" | "woff2";
}

/** One text role's face: a family string, or a family with weight, a size
 * factor (the "bit of tweaks" a display hand needs — e.g. a Gothic lyric face
 * usually wants scale ~1.15 to match the serif's apparent size), and an
 * optional `embed`. Without `embed`, the SVG carries a font-family REFERENCE
 * and the host page supplies the face (@font-face); with it, the face rides
 * inside the SVG's own <style> and the file is self-contained. */
export type FontSlot =
  | string
  | { family: string; weight?: number; scale?: number; embed?: FontEmbed };

/** Per-role faces. Anything unset falls back to `fontFamily` (the house serif). */
export interface FontSpec {
  dropcap?: FontSlot;
  title?: FontSlot;
  annotation?: FontSlot;
  lyric?: FontSlot;
}

interface ResolvedFont {
  family: string;
  weight: number | null;
  scale: number;
  embed: FontEmbed | null;
}
interface ResolvedFonts {
  dropcap: ResolvedFont;
  title: ResolvedFont;
  annotation: ResolvedFont;
  lyric: ResolvedFont;
}

function resolveFont(slot: FontSlot | undefined, fallback: string): ResolvedFont {
  if (!slot) return { family: fallback, weight: null, scale: 1, embed: null };
  if (typeof slot === "string") return { family: slot, weight: null, scale: 1, embed: null };
  return {
    family: slot.family,
    weight: slot.weight ?? null,
    scale: slot.scale ?? 1,
    embed: slot.embed ?? null,
  };
}

const EMBED_MIME: Record<string, string> = {
  opentype: "font/otf", truetype: "font/ttf", woff: "font/woff", woff2: "font/woff2",
};

/** One @font-face rule per embedded (family, weight); deduped across slots. */
export function fontFaceCss(fonts: ResolvedFont[]): string {
  const seen = new Set<string>();
  const rules: string[] = [];
  for (const f of fonts) {
    if (!f.embed) continue;
    const key = `${f.family}::${f.weight ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const format = f.embed.format ?? "opentype";
    rules.push(
      `@font-face{font-family:${JSON.stringify(f.family)};` +
      (f.weight != null ? `font-weight:${f.weight};` : "") +
      `src:url(data:${EMBED_MIME[format] ?? "font/otf"};base64,${f.embed.base64}) ` +
      `format("${format}")}`,
    );
  }
  return rules.length ? `<defs><style>${rules.join("")}</style></defs>` : "";
}

/** font-family (+ optional font-weight) attributes for a resolved slot. */
function fontAttrs(f: ResolvedFont): string {
  return `font-family="${esc(f.family)}"` + (f.weight != null ? ` font-weight="${f.weight}"` : "");
}

export interface SvgOpts {
  /** Height of the 4-line staff in px (line 1 to line 4). Default 40. */
  staffHeight?: number;
  /** Notehead/clef size relative to the SMuFL nominal (1 = fill the space). Default 0.7. */
  noteScale?: number;
  /** Horizontal padding / left margin in px. Default 12. */
  padding?: number;
  /** Colour of staff lines. Defaults to `noteColor`. */
  staffLineColor?: string;
  /** Colour of notation glyphs. Default "#111". */
  noteColor?: string;
  /** Font-family for lyric text. Default a serif stack. */
  fontFamily?: string;
  fonts?: FontSpec;
  /** Wrap systems to this px width. Absent = a single system. */
  width?: number;
  /** Vertical gap between systems, px. Default 24. */
  systemGap?: number;
  /** Draw a custos (line-end guide note) at each system break. Default true when wrapping. */
  custos?: boolean;
  // ── front matter ──
  /** A headline above the score. */
  title?: string;
  /** A right-corner annotation line (feast, page cite). */
  rubric?: string;
  /** Derive the rubric block from chant meta (genus · modus · book). */
  annotation?: "auto";
  /** Draw a rubricated initial from the first lyric; the first system indents. */
  dropcap?: boolean;
  /** The liturgical red for dropcap and annotations. Default a sober red. */
  rubricaColor?: string;
  /** The intonation channel: standard accidentals, HEJI commas, or cents labels. */
  accidentals?: AccidentalMode;
  /** Baseline for the cents channel; the chant's home intonation by default. */
  centsBaseline?: CentsBaseline;
}

interface Resolved {
  staffInterval: number;  // half a line gap (px)
  padding: number;
  staffLineColor: string;
  noteColor: string;
  fontFamily: string;
  fonts: ResolvedFonts;
  glyphScale: number;     // font units → px at SMuFL nominal: staffSpace / (upm/4)
  noteScale: number;      // calibration factor for noteheads/signs
  lineWeight: number;     // staff line weight (px)
  stemWeight: number;     // neume stem weight (px)
  noteheadH: number;      // rendered punctum ink height (px)
  interGlyph: number;     // gap between figures within a syllable
  interSyllable: number;  // base gap between syllables
  interWord: number;      // extra gap between words
  lyricSize: number;      // px
  width: number | null;   // wrap width, or null for single system
  systemGap: number;      // vertical gap between systems
  custos: boolean;        // draw line-end guide notes
  title: string | null;   // headline
  rubric: string | null;  // corner annotation, or "auto"-derived
  dropcap: boolean;       // rubricated initial
  rubricaColor: string;   // liturgical red
}

function resolveOpts(o: SvgOpts): Resolved {
  const staffHeight = o.staffHeight ?? 40;
  // 4 lines span 3 gaps; each gap = 2 staffIntervals ⇒ staffInterval = h/6.
  const staffInterval = staffHeight / 6;
  const glyphScale = (staffInterval * 2) / (GLYPH_UPM / 4);
  const noteScale = o.noteScale ?? 0.7;
  const punctum = GLYPHS[GLYPH.punctum];
  const noteheadH = punctum
    ? (punctum.bbox[3] - punctum.bbox[1]) * glyphScale * noteScale
    : staffInterval * 1.3;
  const noteColor = o.noteColor ?? "#111";
  return {
    staffInterval,
    padding: o.padding ?? 14,
    // Staff lines match the note colour by default (they carry their own
    // option for later, but for now everything is one ink).
    staffLineColor: o.staffLineColor ?? noteColor,
    noteColor,
    fontFamily: o.fontFamily ?? HOUSE_SERIF,
    fonts: {
      dropcap: resolveFont(o.fonts?.dropcap, o.fontFamily ?? HOUSE_SERIF),
      title: resolveFont(o.fonts?.title, o.fontFamily ?? HOUSE_SERIF),
      annotation: resolveFont(o.fonts?.annotation, o.fontFamily ?? HOUSE_SERIF),
      lyric: resolveFont(o.fonts?.lyric, o.fontFamily ?? HOUSE_SERIF),
    },
    glyphScale,
    noteScale,
    lineWeight: Math.max(0.5, staffInterval * 0.11),
    stemWeight: Math.max(0.6, staffInterval * 0.14),
    noteheadH,
    interGlyph: staffInterval * 0.62,
    interSyllable: staffInterval * 1.85,
    interWord: staffInterval * 1.15,
    lyricSize: staffInterval * 2.2,
    width: o.width ?? null,
    systemGap: o.systemGap ?? 24,
    custos: o.custos ?? (o.width != null),
    title: o.title ?? null,
    // "auto" is resolved in toSvg where the chant meta is in hand.
    rubric: typeof o.rubric === "string" ? o.rubric : null,
    dropcap: o.dropcap ?? false,
    rubricaColor: o.rubricaColor ?? "#9E2B25",
  };
}

const HOUSE_SERIF =
  "'Crimson Pro', 'Crimson Text', 'EB Garamond', Garamond, Georgia, serif";

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * A syllable's lyric as SVG text content: styled runs become <tspan>s
 * (italic, bold, small caps, rubric color); a plain lyric stays a bare
 * escaped string. Shared by both species — callers pass runs whose
 * concatenation equals the plain text they measure with.
 */
export function lyricMarkup(
  runs: LyricRun[] | undefined,
  plain: string,
  rubricaColor: string,
): string {
  if (!runs || runs.length === 0) return esc(plain);
  return runs
    .map((run) => {
      const attrs: string[] = [];
      if (run.italic) attrs.push('font-style="italic"');
      if (run.bold) attrs.push('font-weight="700"');
      if (run.smallCaps) attrs.push('font-variant="small-caps"');
      if (run.rubric) attrs.push(`fill="${esc(rubricaColor)}"`);
      return attrs.length
        ? `<tspan ${attrs.join(" ")}>${esc(run.text)}</tspan>`
        : esc(run.text);
    })
    .join("");
}

// ── Geometry ──
// Staff positions: 1 = bottom line, 3, 5, 7 = top line; even = spaces.

interface Layout {
  topY: number;       // y of the top staff line (position 7), system-local
  bottomY: number;    // y of the bottom staff line (position 1), system-local
  baselineY: number;  // y of staff position 0, system-local
  lyricY: number;     // lyric text baseline, system-local
  /** Vertical offset of the current system. 0 for the first; bumped at each break. */
  systemY: number;
  /** Full height of one system (staff + lyric room) + the inter-system gap. */
  systemHeight: number;
}

function makeLayout(r: Resolved): Layout {
  const topY = r.staffInterval * 5; // room for high notes + episema above
  const lyricY = topY + r.staffInterval * 8.5 + r.lyricSize * 0.8;
  return {
    topY,
    bottomY: topY + r.staffInterval * 6,
    baselineY: topY + r.staffInterval * 7,
    // Lyric baseline sits ~1.25 staff spaces below the bottom line — close to
    // the staff, but clear of notes hanging below it and their descenders.
    lyricY,
    systemY: 0,
    systemHeight: Math.ceil(lyricY + r.lyricSize * 0.6) + r.systemGap,
  };
}

// The y for a staff position, offset into the current system.
function yFor(pos: number, L: Layout, r: Resolved): number {
  return L.systemY + L.baselineY - pos * r.staffInterval;
}

// The y for a staff position in a SPECIFIC system — used by the post-passes
// (episema, rhythmic signs) that run after layout, when notes may live in
// different systems than the current L.systemY.
function yAt(pos: number, systemY: number, L: Layout, r: Resolved): number {
  return systemY + L.baselineY - pos * r.staffInterval;
}

// A placed glyph with its page-coordinate ink extents.
interface PlacedGlyph {
  svg: string;
  advance: number;
  inkLeft: number;
  inkRight: number;
}

// Place one glyph with its origin at (x, y). `factor` scales relative to the
// SMuFL nominal (noteheads use r.noteScale; clefs/divisiones use 1). dyFont
// shifts the glyph in font units (y-up) before the flip — used to re-register
// base-registered components.
function placeGlyph(
  code: string, x: number, y: number, r: Resolved,
  cls: string, data = "", factor = 1, dyFont = 0,
): PlacedGlyph | null {
  const g: SmuflGlyph | undefined = GLYPHS[code];
  if (!g) return null;
  const s = r.glyphScale * factor;
  const yy = y - dyFont * s;
  const svg =
    `<g class="${cls}"${data} transform="translate(${x.toFixed(2)} ${yy.toFixed(2)}) scale(${s.toFixed(5)} ${(-s).toFixed(5)})">` +
    `<path d="${g.path}" fill="${r.noteColor}"/></g>`;
  return {
    svg,
    advance: g.advance * s,
    inkLeft: x + g.bbox[0] * s,
    inkRight: x + g.bbox[2] * s,
  };
}

// ── Renderer ──

interface NotePlacement {
  row: ChantTabulaRow;
  inkLeft: number;
  inkRight: number;
  /** Notehead anchor in svg user units — the geometry contract's x/y. */
  x: number;
  y: number;
  /** Which system this note landed in, and that system's top offset. */
  system: number;
  systemY: number;
}

/**
 * One entry per tabula row, in tabula order — the TRACK CONTRACT. Analysis
 * overlays (chironomy, tonarium) consume score data + this geometry to place
 * marks against notes, without scraping the SVG for coordinates.
 */
export interface NoteGeometry {
  phraseIndex: number;
  syllableIndex: number;
  neumeGroup: number;
  noteIndex: number;
  /** Which system (staff line) the note landed in — 0 for the single-system MVP. */
  system: number;
  /** Notehead anchor in svg user units. */
  x: number;
  y: number;
  /** The system's top offset within the svg — 0 until multi-system layout (Phase 3c). */
  systemY: number;
}

export interface SvgResult {
  svg: string;
  geometry: NoteGeometry[];
}

export function toSvg(
  rows: ChantTabulaRow[], chant: Chant, options: SvgOpts = {},
): SvgResult {
  const r = resolveOpts(options);
  const L = makeLayout(r);

  // ── Front matter ── Title, rubric annotation, and dropcap sit in a header
  // band above the first system, set as the Solesmes books open a piece: the
  // TITLE centered over the score ("Dominica Prima Adventus."), the
  // genus/mode mark at the left margin over the dropcap ("Introitus. 8.",
  // upright). Everything below offsets down by the band's height. The text
  // is emitted at final assembly, when the score's width is known (the title
  // centers on it); here we only reserve the band.
  // The books abbreviate the genus in the margin mark (Intr., Grad., Offert.);
  // a genus not in the table prints as-is with its period.
  const GENUS_ABBREV: Record<string, string> = {
    Introitus: "Intr.", Graduale: "Grad.", Offertorium: "Offert.",
    Communio: "Comm.", Tractus: "Tract.", Alleluia: "All.",
    Antiphona: "Ant.", Responsorium: "Resp.", "Responsorium Breve": "Resp. br.",
    Hymnus: "Hymn.", Sequentia: "Seq.", Canticum: "Cant.", Psalmus: "Ps.",
  };
  const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
  const autoLines = options.annotation === "auto"
    ? ([
        chant.genus && capitalize(GENUS_ABBREV[chant.genus] ?? `${chant.genus}.`),
        chant.mode && `${chant.mode}.`,
      ].filter(Boolean) as string[])
    : [];
  // The mark STACKS as the books set it — "Offert." over "2." — one line per
  // element; an explicit `rubric` string stays a single line.
  const rubricLines: string[] = r.rubric ? [r.rubric] : autoLines;
  const markSize = r.lyricSize * 1.05;
  const markLineH = markSize * 0.98;   // tight, as the books stack Intr. over 8.
  let headerY = 0;
  let titleBaseline = 0;
  let rubricTop = 0;
  if (r.title) {
    const size = r.lyricSize * 1.5;
    titleBaseline = size;
    headerY += size * 1.4;
  }
  if (rubricLines.length > 0 && !r.dropcap) {
    // No cap → no margin column; the stack takes a header band of its own.
    rubricTop = (r.title ? headerY : 0) + markSize * 1.1;
    headerY = rubricTop + markLineH * (rubricLines.length - 1) + markSize * 0.5;
  }
  // Push all systems below the header band.
  L.systemY = headerY;

  const body: string[] = [];      // glyphs and stems
  const behind: string[] = [];    // ledger lines (render under glyphs)
  const lyrics: Array<{
    cx: number; text: string; runs?: LyricRun[]; wordStart: boolean; systemY: number;
  }> = [];
  // Display form of a row's lyric: trimmed styled runs when markup rides,
  // else the hyphen-trimmed plain string. One derivation for measuring and
  // drawing, so the two can never disagree.
  const displayLyric = (row: ChantTabulaRow): { text: string; runs?: LyricRun[] } => {
    if (row.runs) {
      const runs = trimRuns(row.runs);
      return { text: runs.map((s) => s.text).join(""), runs };
    }
    return { text: row.lyric.replace(/^-+/, "").replace(/-+$/, "").trim() };
  };
  const placements: NotePlacement[] = [];

  // Dropcap column — the book's illuminated capital owns the left margin of
  // the FIRST system only: its staff, clef, and lyric all start past the cap;
  // later systems return to the full margin (Solesmes practice).
  const capInitial = r.dropcap
    ? (rows.find((row) => row.lyric.trim())?.lyric.trim().charAt(0) ?? "")
    : "";
  // Sized to span staff + lyric (the book initial), sitting close to the staff.
  const capSize = r.staffInterval * 10;
  const capIndent = capInitial
    ? capSize * r.fonts.dropcap.scale * 0.72 + r.staffInterval * 0.45
    : 0;

  let x = r.padding + capIndent;

  // Multi-system layout state. Everything is emitted with the CURRENT system's Y
  // baked in (via yFor + L.systemY); we also record where each system starts so
  // the staff lines can be drawn per system at the end.
  let system = 0;
  const systemMaxX: number[] = []; // rightmost x reached in each finished system

  // Intonation channel: precompute each row's accidental/cents mark once (the
  // repeat-suppression and heji guard live in the engine), keyed by identity.
  const accMode: AccidentalMode = options.accidentals ?? "standard";
  // Square notation writes its own accidentals: b rotundum / b quadratum /
  // croix — the medieval glyph set, not the modern transcription's ♭ ♮ ♯.
  const marks = computeAccidentals(rows, accMode, options.centsBaseline ?? "pythagorean", "medieval");
  const markByRow = new Map<ChantTabulaRow, AccidentalMark>();
  rows.forEach((row, i) => { const m = marks[i]; if (m) markByRow.set(row, m); });

  const dataAttrs = (row: ChantTabulaRow): string =>
    ` data-note-index="${row.phraseIndex}.${row.syllableIndex}.${row.neumeGroup}.${row.neumeIndex}"` +
    ` data-staff="${row.staffLetter}"`;

  // Vertical stem joining two pitches at a notehead edge. Runs from the upper
  // pitch down past the lower one by a slight overshoot, as in the books.
  const stem = (edgeX: number, posA: number, posB: number): string => {
    const y0 = yFor(Math.max(posA, posB), L, r);
    const y1 = yFor(Math.min(posA, posB), L, r) + r.noteheadH * 0.45;
    const w = r.stemWeight;
    return `<rect class="stem" x="${(edgeX - w).toFixed(2)}" y="${y0.toFixed(2)}" ` +
      `width="${w.toFixed(2)}" height="${(y1 - y0).toFixed(2)}" fill="${r.noteColor}"/>`;
  };

  // Short ledger lines behind a notehead outside the staff.
  const ledger = (pos: number, inkLeft: number, inkRight: number): void => {
    const pad = (inkRight - inkLeft) * 0.25;
    const emit = (lp: number): void => {
      const ly = yFor(lp, L, r);
      behind.push(
        `<line class="ledger" x1="${(inkLeft - pad).toFixed(2)}" y1="${ly.toFixed(2)}" ` +
        `x2="${(inkRight + pad).toFixed(2)}" y2="${ly.toFixed(2)}" ` +
        `stroke="${r.staffLineColor}" stroke-width="${r.lineWeight.toFixed(2)}"/>`,
      );
    };
    for (let lp = -1; lp >= pos; lp -= 2) emit(lp);
    for (let lp = 9; lp <= pos; lp += 2) emit(lp);
  };

  // Place a notehead glyph for a row at x; returns the placement.
  const placeNote = (row: ChantTabulaRow, atX: number, code?: string, dyFont = 0): PlacedGlyph | null => {
    const glyphCode = code ?? SHAPE_GLYPH[row.shape] ?? GLYPH.punctum;
    const y = yFor(row.staffPosition, L, r);
    const sc = row.liquescent ? r.noteScale * 0.66 : r.noteScale;
    const p = placeGlyph(glyphCode, atX, y, r, "note", dataAttrs(row), sc, dyFont);
    if (!p) return null;
    ledger(row.staffPosition, p.inkLeft, p.inkRight);
    body.push(p.svg);
    placements.push({ row, inkLeft: p.inkLeft, inkRight: p.inkRight, x: atX, y, system, systemY: L.systemY });
    return p;
  };

  // The note's intonation mark before/above it; returns the advance consumed.
  // A glyph (standard accidental or HEJI comma) precedes the head; a cents label
  // floats above it (and consumes no horizontal advance).
  const placeAccidental = (row: ChantTabulaRow, atX: number): number => {
    const mark = markByRow.get(row);
    if (!mark) return 0;
    if (mark.kind === "cents") {
      const y = yFor(row.staffPosition, L, r) - r.noteheadH * 0.9;
      body.push(
        `<text class="cents" x="${atX.toFixed(2)}" y="${y.toFixed(2)}" ` +
        `font-family="${esc(r.fontFamily)}" font-size="${(r.lyricSize * 0.5).toFixed(1)}" ` +
        `fill="${r.noteColor}">${esc(mark.label ?? "")}</text>`,
      );
      return 0;
    }
    const p = placeGlyph(mark.glyph!, atX, yFor(row.staffPosition, L, r), r,
      "accidental", "", r.noteScale * 0.62);
    if (!p) return 0;
    body.push(p.svg);
    return p.advance + r.interGlyph * 0.6;
  };

  // ── Figure renderers ── each returns the new x cursor.

  const renderPes = (lo: ChantTabulaRow, hi: ChantTabulaRow, atX: number): number => {
    let cx = atX;
    if (lo.shape !== "punctum") {
      // Quilisma/special lower note: keep its glyph, stack a punctum above
      // sharing the right column, joined by a stem.
      const lower = placeNote(lo, cx);
      if (!lower) return cx;
      const upWidth = (GLYPHS[GLYPH.punctum]?.advance ?? 0) * r.glyphScale * r.noteScale;
      const upX = Math.max(cx, lower.inkRight - upWidth);
      const upper = placeNote(hi, upX);          /* stacked, stemless (Solesmes) */
      return Math.max(lower.inkRight, upper?.inkRight ?? 0);
    }
    // Authentic stacked pes: base-registered components re-centered on pitch.
    const lower = placeNote(lo, cx, GLYPH.podatusLower, -82);
    if (!lower) return cx;
    const upper = placeNote(hi, cx + lower.advance, GLYPH.podatusUpper, -96);
    if (hi.staffPosition - lo.staffPosition > 1) {
      body.push(stem(lower.inkRight, lo.staffPosition, hi.staffPosition));
    }
    return Math.max(lower.inkRight, upper?.inkRight ?? 0);
  };

  // Clivis: a left stem, then two abutting square notes descending.
  const renderClivis = (hi: ChantTabulaRow, lo: ChantTabulaRow, atX: number): number => {
    let cx = atX;
    body.push(stem(cx + r.stemWeight, hi.staffPosition, lo.staffPosition));
    const first = placeNote(hi, cx);
    if (!first) return cx;
    const second = placeNote(lo, first.inkRight);
    return second?.inkRight ?? first.inkRight;
  };

  const renderFallback = (figure: ChantTabulaRow[], atX: number): number => {
    let cx = atX;
    let prev: { pos: number; inkRight: number } | null = null;
    const inclinata = figure.every((f, i) => i === 0 || f.shape === "inclinatum");
    for (let i = 0; i < figure.length; i++) {
      const row = figure[i]!;
      if (prev && prev.pos === row.staffPosition)
        cx += r.staffInterval * 0.55;          /* strophae breathe (Solesmes) */
      const p = placeNote(row, cx);
      if (!p) continue;
      if (prev && !inclinata && Math.abs(prev.pos - row.staffPosition) > 1) {
        body.push(stem(p.inkLeft + r.stemWeight, prev.pos, row.staffPosition));
      }
      // Inclinata cascade uses wider, interval-scaled steps (exsurge rule);
      // square notes abut.
      const step = inclinata && i > 0
        ? p.advance * Math.max(1.1, Math.abs(prev!.pos - row.staffPosition) * (2 / 3))
        : p.advance;
      prev = { pos: row.staffPosition, inkRight: p.inkRight };
      cx += step;
    }
    return prev?.inkRight ?? cx;
  };

  const renderFigure = (figure: ChantTabulaRow[], atXIn: number): number => {
    // Solesmes practice: an accidental inflecting ANY note of a ligature is
    // printed BEFORE the whole figure, at the inflected note's staff position —
    // never interleaved mid-ligature. (Placing only the first note's mark
    // silently dropped a flat on the upper note of a pes.)
    let atX = atXIn;
    for (const row of figure) atX += placeAccidental(row, atX);
    if (figure.length === 1) {
      const cx = atX;
      const p = placeNote(figure[0]!, cx);
      return p?.inkRight ?? cx;
    }
    const dirs = figure.slice(1).map((f, i) =>
      Math.sign(f.staffPosition - figure[i]!.staffPosition));
    if (figure.length === 2 && dirs[0] === 1) {
      return renderPes(figure[0]!, figure[1]!, atX);
    }
    if (figure.length === 2 && dirs[0] === -1) {
      return renderClivis(figure[0]!, figure[1]!, atX);
    }
    if (figure.length === 3 && dirs[0] === 1 && dirs[1] === -1) {
      // Torculus: three abutting notes with stems at both junctions.
      const cx = atX;
      const first = placeNote(figure[0]!, cx);
      if (!first) return cx;
      body.push(stem(first.inkRight + r.stemWeight, figure[0]!.staffPosition, figure[1]!.staffPosition));
      const second = placeNote(figure[1]!, first.inkRight);
      if (!second) return first.inkRight;
      body.push(stem(second.inkRight + r.stemWeight, figure[1]!.staffPosition, figure[2]!.staffPosition));
      const third = placeNote(figure[2]!, second.inkRight);
      return third?.inkRight ?? second.inkRight;
    }
    if (figure.length === 3 && dirs[0] === -1 && dirs[1] === 1) {
      // Porrectus: the baked diagonal swash for the fall (2nd–5th), the final
      // note stacked at its end.
      const drop = figure[0]!.staffPosition - figure[1]!.staffPosition;
      if (drop >= 1 && drop <= 4) {
        const cx = atX;
        const swash = placeGlyph(
          ligaturaDesc(drop + 1), cx, yFor(figure[0]!.staffPosition, L, r), r,
          "note swash", dataAttrs(figure[0]!), r.noteScale,
        );
        if (swash) {
          ledger(figure[0]!.staffPosition, swash.inkLeft, swash.inkRight);
          ledger(figure[1]!.staffPosition, swash.inkLeft, swash.inkRight);
          // The Solesmes porrectus carries a left stem — the descent edge,
          // as on the clivis (the swash is a clivis whose fall stretched).
          body.push(stem(swash.inkLeft + r.stemWeight, figure[0]!.staffPosition, figure[1]!.staffPosition));
          body.push(swash.svg);
          placements.push({ row: figure[0]!, inkLeft: swash.inkLeft, inkRight: swash.inkRight, x: cx, y: yFor(figure[0]!.staffPosition, L, r), system, systemY: L.systemY });
          placements.push({ row: figure[1]!, inkLeft: swash.inkLeft, inkRight: swash.inkRight, x: cx, y: yFor(figure[1]!.staffPosition, L, r), system, systemY: L.systemY });
          const upWidth = (GLYPHS[GLYPH.punctum]?.advance ?? 0) * r.glyphScale * r.noteScale;
          const upper = placeNote(figure[2]!, Math.max(atX, swash.inkRight - upWidth));
          if (figure[2]!.staffPosition - figure[1]!.staffPosition > 1) {
            body.push(stem(swash.inkRight, figure[1]!.staffPosition, figure[2]!.staffPosition));
          }
          return Math.max(swash.inkRight, upper?.inkRight ?? 0);
        }
      }
      return renderFallback(figure, atX);
    }
    if (figure.length === 3 && dirs[0] === 1 && dirs[1] === 1) {
      // Scandicus: first note, then a stacked pes on top.
      const cx = atX;
      const first = placeNote(figure[0]!, cx);
      if (!first) return cx;
      if (figure[1]!.staffPosition - figure[0]!.staffPosition > 1) {
        body.push(stem(first.inkRight + r.stemWeight, figure[0]!.staffPosition, figure[1]!.staffPosition));
      }
      return renderPes(figure[1]!, figure[2]!, first.inkRight);
    }
    return renderFallback(figure, atX);
  };

  // ── Clef ──
  const clefStr = rows[0]?.clef ?? "c3";
  const drawClef = (clef: string, atX: number): number => {
    const isF = clef[0] === "f";
    const line = parseInt(clef[clef.length - 1] ?? "3", 10) || 3;
    const pos = 2 * line - 1;
    const p = placeGlyph(isF ? GLYPH.fClef : GLYPH.cClef, atX, yFor(pos, L, r), r, "clef", "", r.noteScale);
    if (!p) return atX;
    body.push(p.svg);
    let cx = p.inkRight + r.interGlyph;
    if (clef.includes("b")) {
      // Key flat at the te position: one letter below do for C clefs, the te
      // below fa for F clefs.
      const flatPos = isF ? pos - 4 : pos - 1;
      const fp = placeGlyph(GLYPH.flat, cx, yFor(flatPos, L, r), r,
        "accidental key-flat", "", r.noteScale * 0.62);
      if (fp) { body.push(fp.svg); cx = fp.inkRight + r.interGlyph; }
    }
    return cx + r.staffInterval * 1.2;
  };
  x = drawClef(clefStr, x);
  let activeClef = clefStr;

  // Estimated lyric width for column spacing (headless: no text measurement).
  const estLyricW = (text: string): number => text.length * r.lyricSize * 0.52;
  const minLyricGap = r.lyricSize * 0.25;
  let prevLyricRight = -Infinity;

  // ── Walk figures grouped by (phraseIndex, syllableIndex, neumeGroup) ──
  // syllableIndex resets per phrase, so the phrase must be part of the key:
  // without it, phrase N's last figure and phrase N+1's first merge whenever
  // the indices collide, silently dropping the second figure's lyric and the
  // divisio between them.
  let i = 0;
  let prevSyllable = -1;
  let prevPhrase = -1;
  let afterDivisio = false;
  while (i < rows.length) {
    const { phraseIndex, syllableIndex, neumeGroup } = rows[i]!;
    let j = i;
    while (
      j < rows.length &&
      rows[j]!.phraseIndex === phraseIndex &&
      rows[j]!.syllableIndex === syllableIndex &&
      rows[j]!.neumeGroup === neumeGroup
    ) j++;
    const figure = rows.slice(i, j);

    // Mid-score clef change.
    if (figure[0]!.clef !== activeClef) {
      activeClef = figure[0]!.clef;
      x = drawClef(activeClef, x + r.interGlyph);
    }

    const newSyllable = syllableIndex !== prevSyllable || phraseIndex !== prevPhrase;
    if (newSyllable && prevSyllable !== -1) {
      x += afterDivisio ? 0 : r.interSyllable;
      if (figure[0]!.wordStart && !afterDivisio) x += r.interWord;
      afterDivisio = false;
      // Column rule: don't let this syllable's lyric collide with the last.
      const lyricText = displayLyric(figure[0]!).text;
      if (lyricText) {
        const estFigW = figure.length *
          (GLYPHS[GLYPH.punctum]?.advance ?? 0) * r.glyphScale * r.noteScale;
        const estLeft = x + estFigW / 2 - estLyricW(lyricText) / 2;
        if (estLeft < prevLyricRight + minLyricGap) {
          x += prevLyricRight + minLyricGap - estLeft;
        }
      }
    } else if (!newSyllable && prevSyllable !== -1) {
      x += figure[0]!.quilisma ? r.staffInterval * 0.12 : r.interGlyph;
    }

    const figureStartX = x;
    x = renderFigure(figure, x);

    if (newSyllable) {
      const { text, runs } = displayLyric(figure[0]!);
      if (text) {
        const cx = (figureStartX + x) / 2;
        lyrics.push({ cx, text, runs, wordStart: figure[0]!.wordStart, systemY: L.systemY });
        prevLyricRight = cx + estLyricW(text) / 2;
      }
    }

    // Divisio at the end of a phrase.
    const div = figure[figure.length - 1]!.divisio;
    const phraseEnds = j >= rows.length || rows[j]!.phraseIndex !== figure[0]!.phraseIndex;
    if (div && phraseEnds) {
      x += r.staffInterval * 2.1;
      const code = DIVISIO_GLYPH[div];
      if (code) {
        // Divisiones register at the staff center (position 4).
        const p = placeGlyph(code, x, yFor(4, L, r), r, "divisio");
        if (p) { body.push(p.svg); x = p.inkRight; }
      }
      x += r.staffInterval * 2.1;
      afterDivisio = true;

      // ── System break ── When wrapping, a divisio is a legal break point.
      // Break if the next phrase would overflow the width — but never on the
      // last divisio (nothing follows). A custos guides the eye to the next
      // system's first pitch.
      const moreToCome = j < rows.length;
      if (r.width != null && moreToCome && x > r.width - r.padding) {
        if (r.custos) {
          // A line-end guide to the next system's first pitch. Drawn as a small
          // punctum at that pitch (no dedicated custos glyph in the bake yet).
          const nextPos = rows[j]!.staffPosition;
          const p = placeGlyph(GLYPH.punctum, x + r.interGlyph, yFor(nextPos, L, r), r, "custos", "", r.noteScale * 0.85);
          if (p) body.push(p.svg);
        }
        systemMaxX.push(x + r.padding);
        system++;
        L.systemY += L.systemHeight;
        x = r.padding;
        // The clef repeats at the head of every system.
        x = drawClef(activeClef, x);
        afterDivisio = false; // a fresh system starts clean, not "after a divisio"
        // Forget the previous system's rightmost lyric — otherwise the lyric-
        // column rule would shove this system's first syllable across the page
        // to clear a lyric that is now a line above.
        prevLyricRight = -Infinity;
      }
    }

    prevSyllable = syllableIndex;
    prevPhrase = phraseIndex;
    i = j;
  }

  // ── Episema: one bar per neume group, spanning the group's ink ──
  {
    const groups = new Map<string, { l: number; rr: number; top: number; has: boolean; systemY: number }>();
    for (const pl of placements){
      const key = `${pl.row.phraseIndex}.${pl.row.syllableIndex}.${pl.row.neumeGroup}`;
      const g = groups.get(key) ?? { l: Infinity, rr: -Infinity, top: -Infinity, has: false, systemY: pl.systemY };
      g.l = Math.min(g.l, pl.inkLeft); g.rr = Math.max(g.rr, pl.inkRight);
      g.top = Math.max(g.top, pl.row.staffPosition);
      g.systemY = pl.systemY;
      if (pl.row.episema) g.has = true;
      groups.set(key, g);
    }
    for (const g of groups.values()){
      if (!g.has) continue;
      const y = yAt(g.top, g.systemY, L, r) - r.staffInterval * 1.35;
      body.push(`<rect class="episema" x="${g.l.toFixed(2)}" y="${y.toFixed(2)}" ` +
        `width="${(g.rr - g.l).toFixed(2)}" height="${(r.lineWeight * 1.7).toFixed(2)}" fill="${r.noteColor}"/>`);
    }
  }

  // ── Rhythmic signs, per placed notehead ──
  for (let k = 0; k < placements.length; k++) {
    const pl = placements[k]!;
    const { row } = pl;
    const midX = (pl.inkLeft + pl.inkRight) / 2;
    if (row.mora) {
      const prevRow = k > 0 ? placements[k - 1]!.row : null;
      const fromAbove = prevRow != null && prevRow.staffPosition > row.staffPosition;
      const dotPos = row.staffPosition % 2 !== 0
        ? row.staffPosition + (fromAbove ? -1 : 1)
        : row.staffPosition;
      const p = placeGlyph(GLYPH.mora, pl.inkRight + r.staffInterval * 0.3,
        yAt(dotPos, pl.systemY, L, r) + r.staffInterval * 0.33, r, "mora", "", r.noteScale);
      if (p) body.push(p.svg);
    }
    if (row.ictusSign) {
      // The tick's ink starts only 28 font-units past its origin, so shift the
      // origin past the notehead's edge to keep it clear.
      const below = row.staffPosition > 0;
      const code = below ? GLYPH.ictusBelow : GLYPH.ictusAbove;
      const g = GLYPHS[code];
      const w = (g ? (g.bbox[2] - g.bbox[0]) : 0) * r.glyphScale * r.noteScale;
      const clearance = r.noteheadH * 0.45;
      const y = yAt(row.staffPosition, pl.systemY, L, r) + (below ? clearance : -clearance);
      const p = placeGlyph(code, midX - w / 2, y, r, "ictus", "", r.noteScale);
      if (p) body.push(p.svg);
    }
  }

  // Close the final system; width is the widest system, height reaches the last.
  systemMaxX.push(x + r.padding);
  const width = Math.ceil(Math.max(...systemMaxX));
  const height = Math.ceil(L.systemY + L.lyricY + r.lyricSize * 0.6);

  // Staff lines (positions 1, 3, 5, 7), once per system. A system's rightmost
  // ink bounds its staff so a short final line doesn't stretch to the page edge.
  const staffLines: string[] = [];
  for (let s = 0; s <= system; s++) {
    const sysY = headerY + s * L.systemHeight;
    const right = (systemMaxX[s] ?? width) - r.padding;
    const left = r.padding + (s === 0 ? capIndent : 0); // the cap owns system 0's margin
    for (const pos of [1, 3, 5, 7]) {
      const ly = sysY + L.baselineY - pos * r.staffInterval;
      staffLines.push(
        `<line x1="${left.toFixed(2)}" y1="${ly.toFixed(2)}" x2="${right.toFixed(2)}" ` +
        `y2="${ly.toFixed(2)}" stroke="${r.staffLineColor}" stroke-width="${r.lineWeight.toFixed(2)}"/>`,
      );
    }
  }

  // Lyrics. Within a word, syllables are joined by a hyphen floated CENTRED in
  // the gap between them (Vendome practice, matching moderna) rather than a
  // dash appended to the text — only when both syllables share a system.
  // The dropcap owns the first letter — the lyric line carries the remainder
  // (strip BEFORE rendering; the cap itself is drawn later, over the margin).
  if (capInitial && lyrics.length > 0) {
    const first = lyrics[0]!;
    first.text = first.text.slice(1);
    if (first.runs && first.runs.length > 0) {
      first.runs = first.runs
        .map((run, i) => (i === 0 ? { ...run, text: run.text.slice(1) } : run))
        .filter((run) => run.text.length > 0);
    }
  }

  const lyricSvgs: string[] = [];
  const lyricFontSize = r.lyricSize * r.fonts.lyric.scale;
  const lyricText = (cx: number, systemY: number, text: string, runs?: LyricRun[]): string =>
    `<text class="lyric" x="${cx.toFixed(2)}" y="${(systemY + L.lyricY).toFixed(2)}" ` +
    `text-anchor="middle" ${fontAttrs(r.fonts.lyric)} ` +
    `font-size="${lyricFontSize.toFixed(1)}" fill="${r.noteColor}">${lyricMarkup(runs, text, r.rubricaColor)}</text>`;
  for (let k = 0; k < lyrics.length; k++) {
    const ly = lyrics[k]!;
    const next = lyrics[k + 1];
    lyricSvgs.push(lyricText(ly.cx, ly.systemY, ly.text, ly.runs));
    // Continuing syllable in the same system → a centred hyphen in the gap.
    if (next && !next.wordStart && next.systemY === ly.systemY) {
      const thisRight = ly.cx + estLyricW(ly.text) / 2;
      const nextLeft = next.cx - estLyricW(next.text) / 2;
      if (nextLeft - thisRight > r.lyricSize * 0.4) {
        lyricSvgs.push(lyricText((thisRight + nextLeft) / 2, ly.systemY, "-"));
      }
    }
  }

  // Dropcap — the large rubricated initial in its own left column beside the
  // first system. The initial IS the lyric's first letter, so the lyric line
  // carries the remainder only (the book prints "K yrie" as cap + "yrie").
  const dropcapSvgs: string[] = [];
  if (capInitial && lyrics.length > 0) {
    const y = headerY + L.lyricY; // bottom-aligned with the first lyric baseline
    dropcapSvgs.push(
      `<text class="dropcap" x="${r.padding.toFixed(2)}" y="${y.toFixed(2)}" ` +
      `${fontAttrs(r.fonts.dropcap)} font-size="${(capSize * r.fonts.dropcap.scale).toFixed(1)}" ` +
      `fill="${r.rubricaColor}">${esc(capInitial.toUpperCase())}</text>`,
    );
  }

  // Front-matter text, deferred to here so the title can center on the
  // final width (the books center the piece's title over the whole score).
  const header: string[] = [];
  if (r.title) {
    const size = r.lyricSize * 1.5;
    header.push(
      `<text class="title" x="${(width / 2).toFixed(2)}" y="${titleBaseline.toFixed(2)}" ` +
      `text-anchor="middle" ${fontAttrs(r.fonts.title)} ` +
      `font-size="${(size * r.fonts.title.scale).toFixed(1)}" ` +
      `fill="${r.noteColor}">${esc(r.title)}</text>`,
    );
  }
  if (rubricLines.length > 0) {
    // With a dropcap the stack owns the margin column: centered on the cap's
    // width, its last line landing beside the first staff's upper reaches
    // (the "Offert." / "2." of the books). Otherwise it sits left-aligned in
    // its own header band. Oldstyle figures for the mode numeral.
    const inMargin = r.dropcap && capIndent > 0;
    const cx = inMargin ? r.padding + capIndent * 0.42 : r.padding;
    const anchor = inMargin ? 'text-anchor="middle" ' : "";
    // The stack STARTS at the top of the staff — first baseline roughly level
    // with the top line, the mode numeral tucked beneath.
    const y0 = inMargin
      ? headerY + L.topY + markSize * 0.2
      : rubricTop;
    rubricLines.forEach((line, i) => {
      header.push(
        `<text class="rubric" x="${cx.toFixed(2)}" y="${(y0 + i * markLineH).toFixed(2)}" ` +
        `${anchor}${fontAttrs(r.fonts.annotation)} ` +
        `font-size="${(markSize * r.fonts.annotation.scale).toFixed(1)}" ` +
        `style="font-feature-settings:'onum'" ` +
        `fill="${r.rubricaColor}">${esc(line)}</text>`,
      );
    });
  }

  const svgTitle = chant.incipit ? `<title>${esc(chant.incipit)}</title>` : "";
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" ` +
    `width="${width}" height="${height}" class="tonus-chant">${svgTitle}` +
    fontFaceCss([r.fonts.dropcap, r.fonts.title, r.fonts.annotation, r.fonts.lyric]) +
    header.join("") +
    staffLines.join("") + behind.join("") + body.join("") + lyricSvgs.join("") +
    dropcapSvgs.join("") +
    `</svg>`;

  // The geometry contract: one entry per placed note, in tabula order, carrying
  // which system it landed in and that system's top offset.
  const geometry: NoteGeometry[] = placements.map((pl) => ({
    phraseIndex: pl.row.phraseIndex,
    syllableIndex: pl.row.syllableIndex,
    neumeGroup: pl.row.neumeGroup,
    noteIndex: pl.row.neumeIndex,
    system: pl.system,
    x: Number(pl.x.toFixed(2)),
    y: Number(pl.y.toFixed(2)),
    systemY: Number(pl.systemY.toFixed(2)),
  }));

  return { svg, geometry };
}
