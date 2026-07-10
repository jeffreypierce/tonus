// ---------------------------------------------------------------------------
// engines/score/emitters/moderna — modern round-note transcription
// ---------------------------------------------------------------------------
// The moderna species: the chant transcribed to a modern 5-line staff with
// round noteheads, engraved slurs, and a treble-8 clef. A DISTINCT rendering
// from quadrata (svg.ts) with its own spacing pass — square notation clusters a
// neume near zero advance, but round heads need ~1.3 head-widths of air, so the
// two views cannot share one x-pass (design: notatio-moderna, "duae species").
//
// This is a faithful port of the locked reference `working/moderna-generator.py`
// (Lomer transcription practice, Vendome deltas): stemless black noteheads, one
// engraved slur per figure (strophic runs merged), small heads for liquescents,
// noteheadHalf for the double mora, the medRenQuilismaCMN squiggle fused before
// its head, augmentation dots for the mora, divisio ticks/bars by kind, centred
// floating hyphens. The generator's constants are its spec and are reproduced
// here verbatim.
//
// It returns the same { svg, geometry } contract as quadrata, so downstream
// tracks and inscriptio treat both species uniformly.
import { GLYPHS, GLYPH_UPM } from "../../../data/smufl-glyphs.js";
import {
  computeAccidentals, type AccidentalMode, type AccidentalMark,
} from "./accidentals.js";
import type { NoteGeometry, SvgResult, SvgOpts } from "./svg.js";
import type { ChantTabulaRow } from "../tabula.js";
import type { Chant } from "../../chant/types.js";

// ── Bravura moderna glyph codepoints (baked in smufl-glyphs.json) ──
const G = {
  gClef8vb: "E052",
  noteheadHalf: "E0A3",
  noteheadBlack: "E0A4",
  augmentationDot: "E1E7",
  quilisma: "EA20",       // medRenQuilismaCMN
};

// ── geometry constants (from moderna-generator.py) ──
const MSP = 7.4;                    // staff space
const SCALE = (MSP * 4) / 1000;     // SMuFL: 1 em = 4 spaces
const MTOP = 20;                    // top staff line, system-local
const NH_W = 295 * SCALE;           // noteheadBlack advance ≈ 8.7px
const ADV = 11.4;                   // per-note advance inside a melisma
const SYL_GAP = 6;                  // gap after each syllable
const LYRIC_Y = MTOP + 4 * MSP + 21;
const SYSTEM_GAP_DEFAULT = 24;

const LETTERS: Record<string, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Written y for a scientific pitch name on the treble-8 staff (bottom line E4). */
function writtenY(spn: string, systemY: number): { y: number; steps: number } {
  const m = /([A-G])[#b]?(-?\d)/.exec(spn);
  if (!m) return { y: systemY + MTOP + 4 * MSP, steps: 0 };
  const di = (Number(m[2]) + 2) * 7 + LETTERS[m[1]!]!;
  const steps = di - (4 * 7 + LETTERS["E"]!); // relative to bottom line E4
  return { y: systemY + MTOP + 4 * MSP - steps * (MSP / 2), steps };
}

function glyph(name: string, x: number, y: number, scale = SCALE): string {
  const g = GLYPHS[name];
  if (!g) return "";
  return `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(5)} ${(-scale).toFixed(5)})">` +
    `<path d="${g.path}" fill="#111"/></g>`;
}

/** A glyph carrying an SVG class (so downstream tracks / tests can select it). */
function classedGlyph(cls: string, name: string, x: number, y: number, scale = SCALE): string {
  const g = GLYPHS[name];
  if (!g) return "";
  return `<g class="${cls}" transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(5)} ${(-scale).toFixed(5)})">` +
    `<path d="${g.path}" fill="#111"/></g>`;
}

function notehead(x: number, y: number, small: boolean, half: boolean): string {
  const s = SCALE * (small ? 0.68 : 1.0);
  const w = 295 * s;
  return glyph(half ? G.noteheadHalf : G.noteheadBlack, x - w / 2, y, s);
}

function clef(x: number, systemY: number): string {
  return glyph(G.gClef8vb, x, systemY + MTOP + 3 * MSP);
}

function moraDots(x: number, y: number, onLine: boolean): string {
  const dy = onLine ? -MSP / 2 : 0;
  return glyph(G.augmentationDot, x + 6.4, y + dy);
}

// The engraved slur: a filled two-cubic shape tapered to points, belly ~1.55.
function slur(x0: number, y0: number, x1: number, ytop: number): string {
  const span = x1 - x0;
  const h = Math.min(3.8 + span * 0.075, 8.6);
  const a0 = y0 - 4.7;
  const co = ytop - 4.7 - h;      // outer control height
  const ci = co + 1.55;           // inner control height (belly thickness)
  const c0x = x0 + span * 0.30;
  const c1x = x1 - span * 0.30;
  return `<path class="slur" d="M ${x0.toFixed(2)} ${a0.toFixed(2)} ` +
    `C ${c0x.toFixed(2)} ${co.toFixed(2)} ${c1x.toFixed(2)} ${co.toFixed(2)} ${x1.toFixed(2)} ${a0.toFixed(2)} ` +
    `C ${c1x.toFixed(2)} ${ci.toFixed(2)} ${c0x.toFixed(2)} ${ci.toFixed(2)} ${x0.toFixed(2)} ${a0.toFixed(2)} Z" fill="#111"/>`;
}

function quilismaMark(x: number, y: number): string {
  const s = SCALE * 0.92;
  const w = 416 * s;
  return glyph(G.quilisma, x - NH_W / 2 - w - 1.2, y + 149 * s, s);
}

// Accidental glyph scale (matches quadrata's noteScale * 0.62 factor).
const ACC_SCALE = SCALE * 0.62;
const ACC_GAP = 1.2; // trailing air between accidental and notehead (as quilisma)

/** Horizontal room an accidental glyph reserves left of the notehead. */
function accidentalWidth(code: string): number {
  const g = GLYPHS[code];
  if (!g) return 0;
  return g.advance * ACC_SCALE + ACC_GAP;
}

/** Draw a standard/HEJI accidental glyph left of the notehead at (x, y). */
function accidentalMark(x: number, y: number, code: string): string {
  return classedGlyph("accidental", code, x - NH_W / 2 - accidentalWidth(code), y, ACC_SCALE);
}

const DIV_KIND: Record<string, string> = {
  "`": "tick", ",": "tick", ";": "half", ":": "full", "::": "double",
};

function divisioMark(x: number, kind: string, top: number, final: boolean): string {
  const bot = top + 4 * MSP;
  if (kind === "tick")
    return `<line class="divisio" x1="${x.toFixed(2)}" y1="${top - 7}" x2="${x.toFixed(2)}" y2="${top - 1}" stroke="#111" stroke-width="0.9"/>`;
  if (kind === "half")
    return `<line class="divisio" x1="${x.toFixed(2)}" y1="${top + MSP}" x2="${x.toFixed(2)}" y2="${top + 3 * MSP}" stroke="#111" stroke-width="0.9"/>`;
  if (kind === "full")
    return `<line class="divisio" x1="${x.toFixed(2)}" y1="${top}" x2="${x.toFixed(2)}" y2="${bot}" stroke="#111" stroke-width="0.9"/>`;
  if (final)
    return `<line class="divisio" x1="${(x - 3.6).toFixed(2)}" y1="${top}" x2="${(x - 3.6).toFixed(2)}" y2="${bot}" stroke="#111" stroke-width="0.9"/>` +
      `<line class="divisio" x1="${x.toFixed(2)}" y1="${top}" x2="${x.toFixed(2)}" y2="${bot}" stroke="#111" stroke-width="2.2"/>`;
  return `<line class="divisio" x1="${(x - 3.2).toFixed(2)}" y1="${top}" x2="${(x - 3.2).toFixed(2)}" y2="${bot}" stroke="#111" stroke-width="0.9"/>` +
    `<line class="divisio" x1="${x.toFixed(2)}" y1="${top}" x2="${x.toFixed(2)}" y2="${bot}" stroke="#111" stroke-width="0.9"/>`;
}

function textW(s: string): number {
  return s.replace(/-/g, "").length * 6.7 + 2;
}

const stripLyric = (s: string): string =>
  s.replace(/<\/?(?:eu|i)>/g, "").replace(/^-+/, "").replace(/-+$/, "").trim();

type Row = ChantTabulaRow;

/**
 * Render the tabula as moderna. Multi-system when `width` is set; single system
 * otherwise. Returns the shared { svg, geometry } contract.
 */
export function toModerna(rows: Row[], chant: Chant, options: SvgOpts = {}): SvgResult {
  const padding = options.padding ?? 14;
  const width = options.width ?? null;
  const systemGap = options.systemGap ?? SYSTEM_GAP_DEFAULT;
  const systemHeight = LYRIC_Y + 24 + systemGap;

  // Intonation channel: precompute each row's accidental/cents mark once (the
  // repeat-suppression and heji guard live in the engine), keyed by identity.
  const accMode: AccidentalMode = options.accidentals ?? "standard";
  const marks = computeAccidentals(rows, accMode, options.centsBaseline ?? "pythagorean");
  const markByRow = new Map<Row, AccidentalMark>();
  rows.forEach((row, i) => { const m = marks[i]; if (m) markByRow.set(row, m); });

  const body: string[] = [];
  const slurs: string[] = [];
  const lyricSvgs: string[] = [];
  const placements: Array<{ row: Row; x: number; y: number; system: number; systemY: number }> = [];
  const systemMaxX: number[] = [];

  let system = 0;
  let systemY = 0;
  let x = padding + 32;                // clef zone on the first system
  const clefSvgs: string[] = [clef(10, 0)];

  // Group rows into syllables (contiguous phrase+syllable index).
  const sylKeys: string[] = [];
  const bySyl = new Map<string, Row[]>();
  for (const r of rows) {
    const k = `${r.phraseIndex}.${r.syllableIndex}`;
    if (!bySyl.has(k)) { bySyl.set(k, []); sylKeys.push(k); }
    bySyl.get(k)!.push(r);
  }

  const breakBefore = (k: string): boolean => {
    // A new system starts when the running x overflows the width, at a syllable
    // boundary. (Moderna breaks between syllables, honouring word/phrase flow.)
    return width != null && x > width - padding;
  };

  for (let si = 0; si < sylKeys.length; si++) {
    const k = sylKeys[si]!;
    const srows = bySyl.get(k)!;

    if (si > 0 && breakBefore(k)) {
      systemMaxX.push(x + padding);
      system++;
      systemY += systemHeight;
      x = padding + 4;
      clefSvgs.push(clef(10, systemY));
    }

    const lyr = stripLyric(srows[0]!.lyric ?? "");

    // Note x-positions within the syllable.
    let nx = x + NH_W / 2 + 1;
    const notePos: Array<{ mx: number; my: number; steps: number }> = [];
    for (const r of srows) {
      if (r.quilisma) nx += 9.6;      // room for the fused squiggle
      const mk = markByRow.get(r);
      if (mk?.kind === "glyph") nx += accidentalWidth(mk.glyph!); // room for the accidental
      const { y, steps } = writtenY(r.spn, systemY);
      notePos.push({ mx: nx, my: y, steps });
      nx += ADV + 4.6 * r.mora;
    }
    const notesW = nx - x - ADV + NH_W / 2 + 2;
    const sylW = Math.max(notesW, textW(lyr));

    // Draw notes.
    srows.forEach((r, i) => {
      const { mx, my, steps } = notePos[i]!;
      const onLine = steps % 2 === 0;
      if (r.quilisma) body.push(quilismaMark(mx, my));
      const mk = markByRow.get(r);
      if (mk?.kind === "glyph") body.push(accidentalMark(mx, my, mk.glyph!));
      else if (mk?.kind === "cents")
        body.push(
          `<text class="cents" x="${mx.toFixed(2)}" y="${(my - MSP).toFixed(2)}" ` +
          `font-size="7.5" fill="#111" font-family="'Crimson Pro', Georgia, serif">${esc(mk.label ?? "")}</text>`,
        );
      body.push(notehead(mx, my, r.liquescent, r.mora === 2));
      if (r.mora === 1) body.push(moraDots(mx, my, onLine));
      placements.push({ row: r, x: mx, y: my, system, systemY });
    });

    // Slurs per figure; strophic runs on the same pitch merge into one.
    const figs: Row[][] = [];
    let curG = -1;
    for (const r of srows) {
      if (r.neumeGroup !== curG) { figs.push([]); curG = r.neumeGroup; }
      figs[figs.length - 1]!.push(r);
    }
    const merged: Row[][] = [];
    for (const fg of figs) {
      const prev = merged[merged.length - 1];
      if (prev && fg.every((q) => q.strophicus) && prev.every((q) => q.strophicus) &&
          fg[0]!.spn === prev[prev.length - 1]!.spn) {
        prev.push(...fg);
      } else merged.push(fg);
    }
    for (const fg of merged) {
      if (fg.length > 1) {
        const idxs = fg.map((r) => srows.indexOf(r));
        const ytop = Math.min(...idxs.map((i) => notePos[i]!.my));
        slurs.push(slur(notePos[idxs[0]!]!.mx, notePos[idxs[0]!]!.my, notePos[idxs[idxs.length - 1]!]!.mx, ytop));
      }
    }

    // Lyric (hyphens added in a second pass).
    const tx = notePos[0]!.mx - NH_W / 2;
    if (lyr) {
      lyricSvgs.push(
        `<text class="lyric" x="${tx.toFixed(2)}" y="${(systemY + LYRIC_Y).toFixed(2)}" font-size="15" ` +
        `font-weight="518" fill="#111" font-family="'Crimson Pro', Georgia, serif">${esc(lyr)}</text>`,
      );
    }

    x += sylW + SYL_GAP;

    // Divisio at a phrase end.
    const last = srows[srows.length - 1]!;
    const nextK = si + 1 < sylKeys.length ? sylKeys[si + 1]! : null;
    const nextPhrase = nextK ? Number(nextK.split(".")[0]) : -1;
    if (last.divisio && (nextK === null || nextPhrase !== last.phraseIndex)) {
      const kind = DIV_KIND[last.divisio] ?? "full";
      const pad = { tick: 2, half: 5, full: 7, double: 9 }[kind] ?? 7;
      const isFinal = nextK === null;
      body.push(divisioMark(x + pad - 4, kind, systemY + MTOP, isFinal));
      x += pad + 8;
    }
  }

  systemMaxX.push(x + padding);
  const W = Math.ceil(Math.max(...systemMaxX));
  const height = Math.ceil(systemY + LYRIC_Y + 24);

  // Staff lines: five per system.
  const staff: string[] = [];
  for (let s = 0; s <= system; s++) {
    const sysY = s * systemHeight;
    const right = (systemMaxX[s] ?? W) - padding;
    for (let i = 0; i < 5; i++) {
      const ly = sysY + MTOP + i * MSP;
      staff.push(`<line x1="4" y1="${ly.toFixed(2)}" x2="${right.toFixed(2)}" y2="${ly.toFixed(2)}" stroke="#111" stroke-width="0.7"/>`);
    }
  }

  const svgTitle = chant.incipit ? `<title>${esc(chant.incipit)}</title>` : "";
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${height}" ` +
    `width="${W}" height="${height}" class="tonus-chant moderna">${svgTitle}` +
    staff.join("") + clefSvgs.join("") + body.join("") + slurs.join("") + lyricSvgs.join("") +
    `</svg>`;

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
