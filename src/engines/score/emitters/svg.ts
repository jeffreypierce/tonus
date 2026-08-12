// ---------------------------------------------------------------------------
// engines/score/emitters/svg — square-note chant score as SVG
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
import { decideBreak } from "./breaking.js";
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
import {
  buildChironomia, buildProsodia, buildTonarium, trackBands,
  type TrackData, type TrackName, type TrackNote,
} from "./tracks.js";

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

/** Per-role faces. Anything unset falls back to `fontFamily` (the house serif).
 *
 * The four roles are the four kinds of text a chant page sets, and they are
 * deliberately separate: a book's dropcap is very often NOT its lyric face —
 * a Lombardic or uncial initial against a text hand — which is exactly the
 * pairing the printed books use. */
export interface FontSpec {
  dropcap?: FontSlot;
  title?: FontSlot;
  annotation?: FontSlot;
  lyric?: FontSlot;
}

/** The ink. Every value reaches the SVG as a CSS custom property with the
 * theme's own value as the fallback — `var(--tonus-note, #111)` — so a host
 * stylesheet can retheme a rendered chant without re-rendering it, while a
 * file opened on its own still carries the colours it was drawn with. */
export interface ThemeColors {
  /** Noteheads, stems, episemata, lyric text. */
  note?: string;
  /** The four staff lines. */
  staffLine?: string;
  /** Liturgical red: the dropcap, rubrics, and the annotation block. */
  rubrica?: string;
}

export interface Theme {
  fonts?: FontSpec;
  colors?: ThemeColors;
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
  /** Analysis tracks to draw beneath each system; they stack in a fixed order. */
  tracks?: readonly TrackName[];
  /** Score-level analysis the tracks consume — supplied by inscriptio. */
  trackData?: TrackData;
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

/** A themeable colour: the caller's value, reachable from CSS by name. */
const cssVar = (name: string, value: string): string => `var(--tonus-${name}, ${value})`;

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
  const rawNote = o.noteColor ?? "#111";
  return {
    staffInterval,
    // A FIXED margin, not one derived from the staff. The margin belongs to the
    // page, not to the notation: a book does not widen its margins when the
    // staff grows, and scaling it here made a large chant get LESS usable width
    // than a small one (93% of a 900px canvas at small against 89% at large) —
    // exactly backwards, since a bigger chant needs more room, not less.
    padding: o.padding ?? 14,
    // Staff lines match the note colour by default (they carry their own
    // option for later, but for now everything is one ink).
    //
    // Each colour reaches the SVG as a CSS custom property with the resolved
    // value as its FALLBACK — `var(--tonus-note, #111)`. An inline fill beats
    // any stylesheet rule, so writing the literal made the 17 semantic classes
    // this emitter already carries (note, lyric, dropcap, custos, episema…)
    // unstylable from the host page. With the var, a page can retheme a drawn
    // chant by setting three properties, and a file opened on its own still
    // shows the ink it was rendered with.
    // Wrap the RAW value, not the already-wrapped one: defaulting the staff
    // line to `noteColor` after wrapping nests the vars
    // (`var(--tonus-staff-line, var(--tonus-note, #111))`), which works but
    // reads as a mistake and ties the two properties together in CSS.
    staffLineColor: cssVar("staff-line", o.staffLineColor ?? rawNote),
    noteColor: cssVar("note", rawNote),
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
    // Air between figures within a syllable. 0.62 until 2026-08-04, which set
    // the square notation tighter than the books do — the neumes read as one
    // mass rather than as separable figures. Scales with the staff, so the
    // relationship holds at any size.
    interGlyph: staffInterval * 0.86,
    // Syllable and word spacing. Both widened 2026-08-04 (1.85 / 1.15): the
    // square notation read as one dense mass, and the neumes need enough air
    // between syllables for a reader to see where one ends. Scales with the
    // staff, so the relationship holds at any size.
    interSyllable: staffInterval * 2.35,
    interWord: staffInterval * 1.55,
    lyricSize: staffInterval * 2.2,
    width: o.width ?? null,
    // Likewise the air between systems: flat 24px held the system pitch at
    // 135px whether the staff was 30 or 56, so a large chant crowded and a
    // small one sprawled.
    systemGap: o.systemGap ?? staffHeight * 0.6,
    custos: o.custos ?? (o.width != null),
    title: o.title ?? null,
    // "auto" is resolved in toSvg where the chant meta is in hand.
    rubric: typeof o.rubric === "string" ? o.rubric : null,
    dropcap: o.dropcap ?? false,
    rubricaColor: cssVar("rubrica", o.rubricaColor ?? "#9E2B25"),
  };
}

const HOUSE_SERIF =
  "'Crimson Pro', 'Crimson Text', 'EB Garamond', Garamond, Georgia, serif";

// The books abbreviate the genus in the margin mark (Intr., Grad., Offert.);
// a genus not in the table prints as-is with its period.
const GENUS_ABBREV: Record<string, string> = {
  Introitus: "Intr.", Graduale: "Grad.", Offertorium: "Offert.",
  Communio: "Comm.", Tractus: "Tract.", Alleluia: "All.",
  Antiphona: "Ant.", Responsorium: "Resp.", "Responsorium Breve": "Resp. br.",
  Hymnus: "Hymn.", Sequentia: "Seq.", Canticum: "Cant.", Psalmus: "Ps.",
};

/** The `annotation: "auto"` mark, derived from chant meta and stacked as the
 * books set it ("Intr." over "8.") — shared by both species. */
export function autoRubricLines(chant: Chant): string[] {
  const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
  // AN ORDINARY CHANT SHOWS ITS MODE ALONE. `genus` for these is "Ordinarium",
  // which reads identically over every Kyrie, Gloria, Sanctus and Agnus — a
  // mark that never changes tells a reader nothing. Naming the piece instead
  // ("Agnus", "Kyrie") only repeats the title set directly above the score,
  // and this slot is the CATEGORY's, not the piece's. So the line is dropped
  // and the mode stands on its own.
  const genus = chant.ordinarium
    ? null
    : chant.genus && capitalize(GENUS_ABBREV[chant.genus] ?? `${chant.genus}.`);
  return [
    genus,
    chant.mode && `${chant.mode}.`,
  ].filter(Boolean) as string[];
}

// ── the initial's own width ────────────────────────────────────────────────
// A DROPCAP IS INDENTED BY WHAT IT ACTUALLY OCCUPIES. The indent used one
// factor (0.72) for every letter, which is not a measurement of anything: in
// Junicode the capitals run from I at 0.344 to W at 0.971, so a narrow letter
// reserved a column of white it never filled and a wide one ran out under the
// staff. Measured in a browser at 100px, both faces, every capital.
//
// Keyed by FACE, because the caller chooses the dropcap's family and a
// blackletter is a different set of widths: Jacquard's capitals sit between
// 0.535 and 0.698, near enough uniform, where Junicode's spread is threefold.
// An unknown family falls back to the widest plausible letter rather than an
// average — reserving too much leaves white, reserving too little collides
// with the music, and only one of those is a defect.
const CAP_ADVANCE: Record<string, Record<string, number>> = {
  junicode: {
    A: 0.684, B: 0.613, C: 0.656, D: 0.748, E: 0.606, F: 0.563, G: 0.688,
    H: 0.803, I: 0.344, J: 0.350, K: 0.655, L: 0.659, M: 0.902, N: 0.731,
    O: 0.711, P: 0.571, Q: 0.716, R: 0.689, S: 0.509, T: 0.645, U: 0.731,
    V: 0.628, W: 0.971, X: 0.649, Y: 0.621, Z: 0.606,
  },
  // Crimson / Garamond / Georgia and the generic serif, which is what the
  // library defaults to. Measured on Georgia, the widest of them.
  serif: {
    A: 0.671, B: 0.639, C: 0.66, D: 0.751, E: 0.613, F: 0.573, G: 0.71,
    H: 0.828, I: 0.39, J: 0.418, K: 0.71, L: 0.611, M: 0.927, N: 0.775,
    O: 0.759, P: 0.596, Q: 0.759, R: 0.679, S: 0.561, T: 0.618, U: 0.777,
    V: 0.671, W: 0.976, X: 0.66, Y: 0.62, Z: 0.591,
  },
  jacquard: {
    A: 0.651, B: 0.651, C: 0.558, D: 0.558, E: 0.558, F: 0.651, G: 0.605,
    H: 0.651, I: 0.535, J: 0.535, K: 0.698, L: 0.581, M: 0.698, N: 0.605,
    O: 0.628, P: 0.581, Q: 0.674, R: 0.628, S: 0.535, T: 0.651, U: 0.605,
    V: 0.581, W: 0.698, X: 0.651, Y: 0.605, Z: 0.581,
  },
};
const CAP_ADVANCE_FALLBACK = 0.9;

/** How far a capital rises above its baseline, as a fraction of font size.
 *  A cap height, near enough, and near enough equal across the faces this
 *  draws in — it decides where the margin stack clears, not where ink lands. */
const CAP_RISE = 0.72;

/** The initial's advance, as a fraction of its font size.
 *
 *  The DEFAULT row is the one that matters most: the library's own dropcap
 *  face is the Crimson stack, not the site's Junicode, so a table that knew
 *  only the two named faces sent every default render to the fallback. Old
 *  serifs vary little at the capitals (Georgia, Garamond and the generic
 *  serif agree to about a hundredth on M and W), so one row serves the
 *  stack. */
function capAdvance(letter: string, family: string): number {
  const face = family.toLowerCase();
  const ch = letter.toUpperCase();
  for (const key of Object.keys(CAP_ADVANCE)) {
    if (key !== "serif" && face.includes(key)) {
      return CAP_ADVANCE[key]![ch] ?? CAP_ADVANCE_FALLBACK;
    }
  }
  return CAP_ADVANCE.serif![ch] ?? CAP_ADVANCE_FALLBACK;
}

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

function makeLayout(r: Resolved, trackExtra = 0): Layout {
  const topY = r.staffInterval * 5; // room for high notes + episema above
  // Lyric baseline sits 28px below the bottom line at the default staffHeight
  // — MATCHED to moderna's staff→lyric gap (ruled 2026-07-29: one gap across
  // the duae species), scaling with the staff. The staff spans SIX intervals,
  // so the gap is (10.2 − 6) of them; it was 9.15 (a 21px gap) until
  // 2026-08-04, which crowded the lyrics against notes hanging below the
  // staff. Those notes share this room, as they do in the books.
  const lyricY = topY + r.staffInterval * 10.2;
  return {
    topY,
    bottomY: topY + r.staffInterval * 6,
    baselineY: topY + r.staffInterval * 7,
    lyricY,
    systemY: 0,
    // A requested track band widens every system by its reserved room.
    systemHeight: Math.ceil(lyricY + r.lyricSize * 0.6) + trackExtra + r.systemGap,
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
  /** Which system (staff line) the note landed in — 0 when nothing wraps. */
  system: number;
  /** Notehead anchor in svg user units. */
  x: number;
  y: number;
  /** The system's top offset within the svg — 0 in the first system. */
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
  // Track scale: chiron-14's constants are px at the default staffHeight 40
  // (staffInterval 40/6); other staff sizes scale the whole band with them.
  const trackScale = r.staffInterval / (40 / 6);
  const bands = trackBands(options.tracks, trackScale);
  const L = makeLayout(r, bands.extra);

  // ── Front matter ── Title, rubric annotation, and dropcap sit in a header
  // band above the first system, set as the Solesmes books open a piece: the
  // TITLE centered over the score ("Dominica Prima Adventus."), the
  // genus/mode mark at the left margin over the dropcap ("Introitus. 8.",
  // upright). Everything below offsets down by the band's height. The text
  // is emitted at final assembly, when the score's width is known (the title
  // centers on it); here we only reserve the band.
  const autoLines = options.annotation === "auto" ? autoRubricLines(chant) : [];
  // The mark STACKS as the books set it — "Offert." over "2." — one line per
  // element; an explicit `rubric` string stays a single line.
  const rubricLines: string[] = r.rubric ? [r.rubric] : autoLines;
  const markSize = r.lyricSize * 1.05;
  const markLineH = markSize * 0.98;   // tight, as the books stack Intr. over 8.
  // The stack's full height in rows — genus over mode. In the margin it is
  // bottom-aligned to this, so a lone mode keeps the mode's row rather than
  // rising into the genus's.
  const MARK_ROWS = 2;
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
  // 9.5, not 10: the initial spans staff + lyric, and a twentieth off it
  // gives the margin mark above room without shrinking the letter's weight.
  const capSize = r.staffInterval * 9.5;
  // The letter's OWN advance, plus a hair of air before the staff begins.
  const capIndent = capInitial
    ? capSize * r.fonts.dropcap.scale
        * capAdvance(capInitial, r.fonts.dropcap.family)
      + r.staffInterval * 0.45
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

  /**
   * Place a figure, report where it ended, and leave nothing behind.
   *
   * PLACEMENT IS THE MEASUREMENT. The break test used to estimate the coming
   * phrase from a note count times a nominal advance, and that estimate was
   * wrong in both directions — too small and figures spilled off the line, too
   * large and the break came early and the line sat 60-78% full. Four separate
   * attempts at a better estimate failed the same way, because the estimate is
   * a second code path that has to agree with the drawing code and cannot.
   *
   * Exsurge answers this by placing the element and asking whether it fit
   * (`positionNotationElement`). This is the same move in tonus's shape: the
   * emitter draws into two arrays, so a trial run records their lengths, calls
   * the real renderFigure, reads the resulting x, and truncates both arrays
   * back. What the drawing code would do IS what the measurement reports,
   * because it is the drawing code.
   */
  const measureFigure = (figure: ChantTabulaRow[], atX: number): number => {
    const bodyMark = body.length;
    const placeMark = placements.length;
    const endX = renderFigure(figure, atX);
    body.length = bodyMark;
    placements.length = placeMark;
    return endX;
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
  // Lyric width, for the collision check below. Case-aware, because a flat
  // per-character average is wrong exactly where it matters: chant sets its
  // opening word in capitals ("CAntábo", "DE us"), and capitals run about 0.70
  // em against lowercase's 0.50. A flat 0.52 underestimated "CAn" by 5px — a
  // quarter of its width — so the opening syllables were placed as if they
  // fitted and then collided with what followed.
  const estLyricW = (text: string): number => {
    let w = 0;
    for (const ch of text) {
      w += /[A-ZÀ-ÞŒÆ]/.test(ch) ? 0.70 : /[.,;:'’\- ]/.test(ch) ? 0.28 : 0.50;
    }
    return w * r.lyricSize;
  };
  // Clear air between one syllable's right edge and the next one's left.
  // 0.25 em until 2026-08-04, which let syllables touch even when the width
  // estimate was right — a space between words has to read as a space.
  const minLyricGap = r.lyricSize * 0.42;
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

      // ── The engraver's own break ────────────────────────────────────────
      //
      // GABC's `z` says "start a new line here", and it is not a hint: an
      // editor who set a chant chose where its lines end, and that choice
      // carries a reading of the piece a width cannot infer. tonus SKIPPED the
      // token at parse — 41 Graduale chants carry one and every break was
      // being thrown away, which is why the automatic breaks looked arbitrary
      // against a printed copy.
      //
      // It wins over the fit test. Where it is absent the layout still decides.
      if (r.width != null && figure[0]!.lineBreak && prevSyllable !== -1) {
        if (r.custos) {
          const cp = placeGlyph(GLYPH.punctum, x + r.interGlyph,
            yFor(figure[0]!.staffPosition, L, r), r, "custos", "", r.noteScale * 0.85);
          if (cp) body.push(cp.svg);
        }
        systemMaxX.push(Math.max(x, prevLyricRight) + r.padding);
        L.systemY += L.systemHeight;
        system++;
        x = r.padding;
        x = drawClef(activeClef, x);
        prevLyricRight = -Infinity;
        afterDivisio = true;
      }

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

    // Close the current system and open the next, optionally guiding the eye
    // with a custos at `nextPos`. Both break paths (divisio and word boundary)
    // route through here so the two cannot drift apart.
    const closeSystem = (nextPos: number | null): void => {
      if (r.custos && nextPos != null) {
        const cx = x - r.staffInterval * 2.1 + r.interGlyph;
        const p = placeGlyph(GLYPH.punctum, cx, yFor(nextPos, L, r), r,
                             "custos", "", r.noteScale * 0.85);
        if (p) body.push(p.svg);
      }
      systemMaxX.push(Math.max(x, prevLyricRight) + r.padding);
      system++;
      L.systemY += L.systemHeight;
      x = r.padding;
      x = drawClef(activeClef, x);
      afterDivisio = false;
      prevLyricRight = -Infinity;
    };

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
      // Break when the NEXT phrase will not fit, rather than once this one has
      // already overrun. The check was `x > width - padding`, which only fires
      // AFTER the boundary is crossed — and since a system may break only at a
      // divisio, the overrun was a whole phrase wide. Measured over thirty
      // graduals, every one of them overran a 900px request, by up to 289px.
      // That is what made a render wider than the column it was drawn for, and
      // why "sometimes bigger, sometimes smaller" varied by chant: the overrun
      // depends on where the phrases happen to fall.
      //
      // The estimate is calibrated, not guessed: measured over twenty graduals,
      // a phrase's width is 1.53 x (notes x staffInterval) at the median and
      // 2.26 at p90. 2.2 keeps most phrases inside the line; a lower figure
      // (1.35, the first attempt) sat at the median and let half of them spill.
      // Capped at 0.8 of a system, since a phrase longer than that has nowhere
      // better to go and moving it only empties the line it left.
      const moreToCome = j < rows.length;
      // The line's usable width RESERVES the custos, rather than drawing it
      // afterwards and hoping. Exsurge computes the same boundary once up front
      // (`staffRight - CustosLong.width`), which makes a custos structurally
      // unable to overrun — where tonus used to place it past a finished `x`.
      // See working/notes/exsurge-line-breaking.md.
      //
      // A final divisio needs no custos (nothing follows), so the full width is
      // available there.
      const custosW = r.custos
        ? (GLYPHS[GLYPH.punctum]?.advance ?? 0) * r.glyphScale * r.noteScale * 0.85
          + r.interGlyph
        : 0;
      const rightBoundary = r.width != null
        ? r.width - r.padding - (div === "::" ? 0 : custosW)
        : Infinity;

      // How wide is the coming phrase? MEASURED, by placing it and rewinding —
      // not estimated. See measureFigure above for why every estimate failed.
      //
      // The trial walks the phrase figure by figure exactly as the real loop
      // will, including the syllable and word gaps, so the number it returns is
      // the number the drawing will produce.
      let nextPhraseW = 0;
      if (r.width != null && moreToCome) {
        const phrase = rows[j]!.phraseIndex;
        let tx = 0;
        let prevSyl = -1;
        for (let k = j; k < rows.length && rows[k]!.phraseIndex === phrase;) {
          let e = k;
          while (e < rows.length &&
                 rows[e]!.phraseIndex === rows[k]!.phraseIndex &&
                 rows[e]!.syllableIndex === rows[k]!.syllableIndex &&
                 rows[e]!.neumeGroup === rows[k]!.neumeGroup) e++;
          if (rows[k]!.syllableIndex !== prevSyl && prevSyl !== -1) {
            tx += r.interSyllable;
            if (rows[k]!.wordStart) tx += r.interWord;
          } else if (prevSyl !== -1) {
            tx += r.interGlyph;
          }
          prevSyl = rows[k]!.syllableIndex;
          tx = measureFigure(rows.slice(k, e), tx);
          k = e;
        }
        nextPhraseW = tx;
      }

      // No tolerance. It existed to absorb the error in an ESTIMATED phrase
      // width; the width is measured now, so slack only buys overruns. Set to
      // 3% it doubled the renders that exceeded the requested width (16 of 80
      // against 8) for a four-point gain in line fill — the wrong trade when a
      // uniform scale is what a reader notices.
      const slack = 0;
      // `<nlba>` seals a seam: the editor set "T. P. Allelúia" and its verse as
      // one unbreakable run, and a break inside it splits a group the book
      // keeps whole. Measured across the 35 Graduale chants that carry the tag,
      // the automatic breaks violated it 5-13 times depending on width — and
      // every one of them in moderna, which is why a quadrata-only check first
      // reported none.
      //
      // The seal only forbids; it never forces. If this break point is sealed
      // the line simply runs on to the next candidate, which is what Gregorio's
      // own renderer does in spirit — nabc-lib pushes the whole kept-together
      // stack down to the next line rather than breaking inside it. tonus can
      // take the simpler road because its breaks fall at phrase boundaries: a
      // sealed boundary is just not a candidate.
      const sealed = moreToCome && rows[j]!.keepWithPrev;
      // A divisio is the BEST place to end a system, so it still breaks when the
      // coming phrase will not fit whole — but only once the line has earned it.
      // Breaking at every barline that cannot hold a whole phrase is what left a
      // quarter of quadrata's lines under 75% full: a long phrase would not fit
      // anywhere, so the line ended early and the phrase overran the next one
      // regardless. Now that a word boundary can end a system too, the barline
      // can hold out for a line that is actually full, and the word rule below
      // catches the remainder mid-phrase.
      //
      // 0.88 is measured, not chosen: sweeping the threshold over 120 graduals,
      // short lines fall 28% → 27% → 23% → 8% → 4% across 0.55/0.65/0.72/0.80/
      // 0.88 and then stop moving (0.95 also gives 4%). The knee is at 0.88, so
      // it takes the whole gain while still letting a barline end a line that is
      // merely close to full — a higher figure would only discard divisio breaks
      // for nothing.
      const earned = x >= rightBoundary * 0.88;
      // The shared rules (breaking.ts) decide `z`, the seal, and the width; the
      // `earned` threshold is quadrata's own policy — a divisio is the BEST
      // place to end a system, so it holds out for a line that is nearly full
      // and lets the word rule below take the remainder.
      // A sealed seam is not a candidate here at all: quadrata's breaks fall at
      // phrase boundaries, so refusing is enough — the word rule below finds the
      // group's head. Testing the seal INSIDE the shared decision instead let a
      // sealed boundary close a system, which drew a custos on a line that had
      // none before (measured: 8 custos became 9 on gregobase:697).
      const divVerdict = r.width != null && moreToCome && !sealed
        ? decideBreak({
            next: rows[j]!,
            x,
            boundary: rightBoundary,
            need: earned ? nextPhraseW + slack : 0,
            lineStart: r.padding,
            forcedHandled: true,
          })
        : { break: false as const, reason: "none" as const };
      if (divVerdict.break) {
        // A custos after a FULL STOP is noise. The sign says "the melody
        // continues, at this pitch" — a divisio finalis has already said the
        // opposite, and drawing both put two marks in the same place, which
        // reads as a heavy double barline rather than as a guide. (Gregorio
        // and exsurge both suppress it there for the same reason.)
        //
        // After a minor divisio it earns its place: the phrase is punctuated,
        // not finished, and the eye still has to find the next pitch.
        if (r.custos && div !== "::") {
          // The line-end guide naming the next system's first pitch, drawn as
          // a small punctum at that pitch — Bravura's chant range as baked
          // carries no custos glyph (see gabc-glyphs.ts). A hooked custos
          // would read better and needs the bake extended first.
          const nextPos = rows[j]!.staffPosition;
          const glyph = GLYPH.punctum;
          // Snug to the barline, not floating after it. `x` has already taken
          // the divisio's trailing air (2.1 staff intervals), which put the
          // custos 41-46px past the last note — reading as a stray note rather
          // than as a sign belonging to the line's end. The books set it tight
          // against the margin; pulling that air back does the same.
          const cx = x - r.staffInterval * 2.1 + r.interGlyph;
          const p = placeGlyph(glyph, cx, yFor(nextPos, L, r), r, "custos", "", r.noteScale * 0.85);
          if (p) body.push(p.svg);
        }
        systemMaxX.push(Math.max(x, prevLyricRight) + r.padding);
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

    // ── Break at a word, when the phrase has nowhere else to end ──
    //
    // A divisio is the RIGHT place to end a system and stays the first choice
    // above. But it cannot be the only one: quadrata's break test used to live
    // entirely inside `if (div && phraseEnds)`, so a system could end nowhere
    // else, and a phrase wider than the line simply ran until its next barline.
    // Measured over 120 graduals, a QUARTER of quadrata's lines came out under
    // 75% full against 6% in moderna — which breaks between syllables. That gap
    // was the asymmetry, not a spacing difference.
    //
    // The books break mid-phrase freely; the unit is the word, never a syllable
    // mid-word (which would split a lyric) and never mid-neume. So: at a word
    // start, with the coming word measured, break if it will not fit.
    if (r.width != null && j < rows.length && rows[j]!.wordStart &&
        !afterDivisio && !rows[j]!.keepWithPrev) {
      // Measure the coming WORD the same way the phrase is measured — by
      // placing and rewinding, so the number is the one the drawing produces.
      let tw = 0;
      let pSyl = rows[j]!.syllableIndex;
      let k = j;
      while (k < rows.length) {
        if (k > j && rows[k]!.wordStart) break;          // the next word begins
        let e = k;
        while (e < rows.length &&
               rows[e]!.phraseIndex === rows[k]!.phraseIndex &&
               rows[e]!.syllableIndex === rows[k]!.syllableIndex &&
               rows[e]!.neumeGroup === rows[k]!.neumeGroup) e++;
        if (rows[k]!.syllableIndex !== pSyl) tw += r.interSyllable;
        else if (k > j) tw += r.interGlyph;
        pSyl = rows[k]!.syllableIndex;
        tw = measureFigure(rows.slice(k, e), tw);
        k = e;
      }

      const custosW2 = r.custos
        ? (GLYPHS[GLYPH.punctum]?.advance ?? 0) * r.glyphScale * r.noteScale * 0.85
          + r.interGlyph
        : 0;
      const bound = r.width - r.padding - custosW2;
      const wordVerdict = decideBreak({
        next: rows[j]!,
        x: x + r.interSyllable + r.interWord,
        boundary: bound,
        need: tw,
        sealedRun: tw,
        lineStart: r.padding,
        forcedHandled: true,
      });
      if (wordVerdict.break) closeSystem(rows[j]!.staffPosition);
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

  // Close the final system; height reaches the last.
  systemMaxX.push(Math.max(x, prevLyricRight) + r.padding);
    // The canvas is what the CALLER asked for, not what the content happened to
    // reach. Width was `max(systemMaxX)` in both species, so a render of a
    // requested 900 came out 915, 986, 1074, 1203 — whatever the widest system
    // ended at. A host applying `max-width: 100%` then shrank each render by a
    // different factor, which is why the same page showed one chant's notation
    // a third smaller than another's, and why the two species never agreed:
    // measured across fourteen graduals, moderna landed between 0.66 and 0.95
    // of quadrata's on-screen size with no pattern a reader could learn.
    //
    // `width` is the wrap point, and now also the canvas. Content still wraps
    // inside it; it no longer decides how big the picture is. Without a width
    // there is nothing to wrap to and the content still sets the size.
  const contentW = Math.ceil(Math.max(...systemMaxX));
  // A CEILING, not a floor. `width` is the room the caller has; content wraps
  // inside it and the canvas never exceeds it, so a host applying `max-width`
  // shrinks nothing and every render on a page shares one scale. But a chant
  // that does not fill the room keeps its own width — padding it out to the
  // full column would leave a short chant floating in white space, and any
  // host that scales to fit would then shrink the notation for having been
  // short. That is the bug this line replaced, in the other direction.
  // The canvas is the requested width. Every render on a page then shares one
  // scale, which is the thing a reader actually notices: width used to be
  // `max(systemMaxX)`, so a requested 900 came back 915, 986, 1074, 1203 by
  // chant and a host applying `max-width` shrank each differently.
  //
  // Content that overruns is handled at the SOURCE — the wrap check breaks a
  // system before it spills (see the lookahead below) — not by growing the
  // canvas to fit it. Letting the canvas follow the content is what made the
  // scale wander again; letting it clip is what cut the tail off a staff. The
  // overrun itself had to go.
  // The requested width, so every render on a page shares one scale — a
  // content-driven width returned 915, 986, 1074, 1203 for the same request
  // and a host applying `max-width` shrank each differently.
  //
  // The `max` is a safety net for the last few pixels. Placement is decided
  // from an estimate of the coming phrase, absorbed by a tolerance (see the
  // break above), and the residue is small: over forty chants the worst
  // overrun is 35px on a 900px line. Growing the canvas by that is invisible;
  // clipping it takes the end off a staff.
  const width = r.width != null ? Math.max(Math.ceil(r.width), contentW) : contentW;
  const height = Math.ceil(L.systemY + L.lyricY + r.lyricSize * 0.6 + bands.extra);

  // ── The analysis tracks, below each system ──
  // Downstream of the notation: they consume the placements (the same anchors
  // the geometry contract exports), never the score's own ink. Drawn after the
  // page width is known — the tonarium's lane measures itself against each
  // system's right edge.
  if (bands.prosodia || bands.chironomia || bands.tonarium) {
    const trackNotes: TrackNote[] = placements.map((pl) => ({
      row: pl.row, x: pl.x, y: pl.y, system: pl.system, systemY: pl.systemY,
      inkLeft: pl.inkLeft, inkRight: pl.inkRight,
    }));
    if (bands.prosodia) {
      body.push(buildProsodia(trackNotes, {
        k: trackScale,
        laneTop: L.lyricY + bands.prosodia.top,
        rightFor: (s) => (systemMaxX[s] ?? width) - r.padding,
        rubricaColor: r.rubricaColor,
      }));
    }
    if (bands.chironomia) {
      body.push(buildChironomia(trackNotes, {
        k: trackScale,
        // Clear of the lyric line's descenders: the crest's letters top out
        // ~26px above the midline, and the lyric baseline sits at lyricY.
        waveMidY: L.lyricY + bands.chironomia.top + 33 * trackScale,
      }));
    }
    if (bands.tonarium) {
      body.push(buildTonarium(trackNotes, options.trackData ?? { cadences: [], modulations: [] }, {
        k: trackScale,
        laneTop: L.lyricY + bands.tonarium.top + 26 * trackScale,
        rightFor: (s) => (systemMaxX[s] ?? width) - r.padding,
        serifFamily: r.fonts.lyric.family,
        rubricaColor: r.rubricaColor,
      }));
    }
  }

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
  // Lyric weight defaults to moderna's 518 (one weight across the duae
  // species, ruled 2026-07-29); an explicit fonts.lyric.weight overrides.
  const lyricWeightAttr = r.fonts.lyric.weight != null ? "" : ' font-weight="518"';
  const lyricText = (cx: number, systemY: number, text: string, runs?: LyricRun[]): string =>
    `<text class="lyric" x="${cx.toFixed(2)}" y="${(systemY + L.lyricY).toFixed(2)}" ` +
    `text-anchor="middle" ${fontAttrs(r.fonts.lyric)}${lyricWeightAttr} ` +
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
    } else if (next && !next.wordStart) {
      // ...and a word carried to the NEXT system takes a hyphen at the line's
      // end, which is what the books set. The gap-centred rule above cannot
      // reach this case — the two syllables have no gap between them, they have
      // a line break — so the hyphen was simply dropped: measured, 351 splits
      // across 165 of 200 graduals rendered with nothing joining the halves.
      // "Sanc" ended a line and "tus" opened the next, reading as two words.
      const thisRight = ly.cx + estLyricW(ly.text) / 2;
      lyricSvgs.push(lyricText(thisRight + r.lyricSize * 0.42, ly.systemY, "-"));
    }
  }

  // Dropcap — the large initial in its own left column beside the first
  // system. The initial IS the lyric's first letter, so the lyric line carries
  // the remainder only (the book prints "K yrie" as cap + "yrie").
  //
  // IT TAKES THE NOTE INK, NOT THE RUBRICA. The printed books set the initial
  // in black and spend their red on the genus/mode mark beside it — see the
  // Liber's "Intr. 1." over a black R. It was rubricated here, which put the
  // reserved colour on the largest mark on the page and left the rubric it is
  // reserved for competing with it. A caller wanting a red initial themes
  // `--tonus-note` on the cap, or passes its own colour.
  const dropcapSvgs: string[] = [];
  if (capInitial && lyrics.length > 0) {
    const y = headerY + L.lyricY; // bottom-aligned with the first lyric baseline
    dropcapSvgs.push(
      `<text class="dropcap" x="${r.padding.toFixed(2)}" y="${y.toFixed(2)}" ` +
      `${fontAttrs(r.fonts.dropcap)} font-size="${(capSize * r.fonts.dropcap.scale).toFixed(1)}" ` +
      `fill="${r.noteColor}">${esc(capInitial.toUpperCase())}</text>`,
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
    // LEFT-ALIGNED OVER THE CAP, not centred on it. Centring worked while the
    // initial was a plain roman capital whose ink stopped well below the
    // stack; a blackletter's flourishes climb into that band, and the numeral
    // landed on top of one. Sitting at the margin the mark clears the letter's
    // reach whatever face draws it, and the books set it there anyway.
    // Both cases now start at the margin, so there is one x and one anchor.
    const cx = r.padding;
    const anchor = "";
    // The stack sits ABOVE the cap, not beside it. Its last line lands a clear
    // markSize over the cap's own ink, which is what the books do — "Grad."
    // over "5." over a large Q, each clear of the next.
    //
    // It used to start at the staff's top line (topY + 0.2 × markSize) on the
    // reasoning that the mark rides the staff. But the CAP rises far above the
    // staff — its ink began at y 41.3 while the numeral ran to 54.5, measured,
    // a 13-unit overlap — so the two collided in the one column they share.
    // CAP_RISE, not capAdvance: this is how far the initial climbs ABOVE its
    // baseline, and the advance is how wide it is. The two shared the 0.72
    // literal that used to stand for both, so replacing that literal with a
    // width table quietly made a vertical position depend on a horizontal
    // measurement — an I would have hung far lower than an M.
    const capTop = capInitial
      ? headerY + L.lyricY - capSize * r.fonts.dropcap.scale * CAP_RISE
      : headerY + L.topY;
    // Sitting ON the staff's top line — where the books set it. The stack was
    // floating well above the staff, reading as a header rather than as a mark
    // in the margin beside the music.
    //
    // BOTTOM-ALIGNED, so the stack grows upward from a fixed last row. A mode
    // standing alone (no genus above it) belongs on the SECOND row, level with
    // where it sits when "Intr." is over it — anchoring the top row instead
    // would float a lone numeral high and off the staff.
    const y0 = inMargin
      ? headerY + L.topY + markSize * 0.18
        + markLineH * (MARK_ROWS - rubricLines.length)
      : rubricTop;
    rubricLines.forEach((line, i) => {
      header.push(
        `<text class="rubric" x="${cx.toFixed(2)}" y="${(y0 + i * markLineH).toFixed(2)}" ` +
        `${anchor}${fontAttrs(r.fonts.annotation)} ` +
        `font-size="${(markSize * r.fonts.annotation.scale).toFixed(1)}" ` +
        `style="font-feature-settings:'onum'" ` +
        `fill="${r.noteColor}">${esc(line)}</text>`,
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
