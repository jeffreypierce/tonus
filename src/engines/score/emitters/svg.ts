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
import { GLYPHS, GLYPH_UPM, type SmuflGlyph } from "../../../data/smufl-glyphs.js";
import {
  GLYPH,
  SHAPE_GLYPH,
  DIVISIO_GLYPH,
  ligaturaDesc,
} from "../../../data/gabc-glyphs.js";

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
  /** Wrap systems to this px width. Absent = a single system. */
  width?: number;
  /** Vertical gap between systems, px. Default 24. */
  systemGap?: number;
  /** Draw a custos (line-end guide note) at each system break. Default true when wrapping. */
  custos?: boolean;
}

interface Resolved {
  staffInterval: number;  // half a line gap (px)
  padding: number;
  staffLineColor: string;
  noteColor: string;
  fontFamily: string;
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
    fontFamily: o.fontFamily ??
      "'Crimson Pro', 'Crimson Text', 'EB Garamond', Garamond, Georgia, serif",
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
  };
}

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

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

  const body: string[] = [];      // glyphs and stems
  const behind: string[] = [];    // ledger lines (render under glyphs)
  const lyrics: Array<{ cx: number; text: string; wordStart: boolean; systemY: number }> = [];
  const placements: NotePlacement[] = [];
  let x = r.padding;

  // Multi-system layout state. Everything is emitted with the CURRENT system's Y
  // baked in (via yFor + L.systemY); we also record where each system starts so
  // the staff lines can be drawn per system at the end.
  let system = 0;
  const systemMaxX: number[] = []; // rightmost x reached in each finished system

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

  // Explicit accidental before a note; returns the advance consumed.
  const placeAccidental = (row: ChantTabulaRow, atX: number): number => {
    if (row.accidentalSource !== "explicit") return 0;
    const code = row.accidental === -1 ? GLYPH.flat
      : row.accidental === 1 ? GLYPH.sharp : GLYPH.natural;
    const p = placeGlyph(code, atX, yFor(row.staffPosition, L, r), r,
      "accidental", "", r.noteScale * 0.62);
    if (!p) return 0;
    body.push(p.svg);
    return p.advance + r.interGlyph * 0.6;
  };

  // ── Figure renderers ── each returns the new x cursor.

  const renderPes = (lo: ChantTabulaRow, hi: ChantTabulaRow, atX: number): number => {
    let cx = atX;
    cx += placeAccidental(lo, cx);
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
    cx += placeAccidental(hi, cx);
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
      cx += placeAccidental(row, cx);
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

  const renderFigure = (figure: ChantTabulaRow[], atX: number): number => {
    if (figure.length === 1) {
      let cx = atX;
      cx += placeAccidental(figure[0]!, cx);
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
      let cx = atX;
      cx += placeAccidental(figure[0]!, cx);
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
        let cx = atX;
        cx += placeAccidental(figure[0]!, cx);
        const swash = placeGlyph(
          ligaturaDesc(drop + 1), cx, yFor(figure[0]!.staffPosition, L, r), r,
          "note swash", dataAttrs(figure[0]!), r.noteScale,
        );
        if (swash) {
          ledger(figure[0]!.staffPosition, swash.inkLeft, swash.inkRight);
          ledger(figure[1]!.staffPosition, swash.inkLeft, swash.inkRight);
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
      let cx = atX;
      cx += placeAccidental(figure[0]!, cx);
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

  // ── Walk figures grouped by (syllableIndex, neumeGroup) ──
  let i = 0;
  let prevSyllable = -1;
  let afterDivisio = false;
  while (i < rows.length) {
    const { syllableIndex, neumeGroup } = rows[i]!;
    let j = i;
    while (
      j < rows.length &&
      rows[j]!.syllableIndex === syllableIndex &&
      rows[j]!.neumeGroup === neumeGroup
    ) j++;
    const figure = rows.slice(i, j);

    // Mid-score clef change.
    if (figure[0]!.clef !== activeClef) {
      activeClef = figure[0]!.clef;
      x = drawClef(activeClef, x + r.interGlyph);
    }

    const newSyllable = syllableIndex !== prevSyllable;
    if (newSyllable && prevSyllable !== -1) {
      x += afterDivisio ? 0 : r.interSyllable;
      if (figure[0]!.wordStart && !afterDivisio) x += r.interWord;
      afterDivisio = false;
      // Column rule: don't let this syllable's lyric collide with the last.
      const lyricText = figure[0]!.lyric.replace(/^-+/, "").replace(/-+$/, "").trim();
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
      const text = figure[0]!.lyric.replace(/^-+/, "").replace(/-+$/, "").trim();
      if (text) {
        const cx = (figureStartX + x) / 2;
        lyrics.push({ cx, text, wordStart: figure[0]!.wordStart, systemY: L.systemY });
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
    const sysY = s * L.systemHeight;
    const right = (systemMaxX[s] ?? width) - r.padding;
    for (const pos of [1, 3, 5, 7]) {
      const ly = sysY + L.baselineY - pos * r.staffInterval;
      staffLines.push(
        `<line x1="${r.padding}" y1="${ly.toFixed(2)}" x2="${right.toFixed(2)}" ` +
        `y2="${ly.toFixed(2)}" stroke="${r.staffLineColor}" stroke-width="${r.lineWeight.toFixed(2)}"/>`,
      );
    }
  }

  // Lyrics; syllables within a word carry a trailing hyphen ("Ký- ri- e"). Each
  // lyric sits under its own system.
  const lyricSvgs: string[] = [];
  for (let k = 0; k < lyrics.length; k++) {
    const ly = lyrics[k]!;
    const next = lyrics[k + 1];
    const text = next && !next.wordStart ? `${ly.text}-` : ly.text;
    const y = ly.systemY + L.lyricY;
    lyricSvgs.push(
      `<text class="lyric" x="${ly.cx.toFixed(2)}" y="${y.toFixed(2)}" ` +
      `text-anchor="middle" font-family="${esc(r.fontFamily)}" ` +
      `font-size="${r.lyricSize.toFixed(1)}" fill="${r.noteColor}">${esc(text)}</text>`,
    );
  }

  const title = chant.incipit ? `<title>${esc(chant.incipit)}</title>` : "";
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" ` +
    `width="${width}" height="${height}" class="tonus-chant">${title}` +
    staffLines.join("") + behind.join("") + body.join("") + lyricSvgs.join("") +
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
