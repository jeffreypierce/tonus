// ---------------------------------------------------------------------------
// engines/score/inscriptio — the score renderer (SVG + geometry contract)
// ---------------------------------------------------------------------------
// `inscriptio` (the inscribing) draws a Score. Per the rendering boundary
// (CODE-STANDARDS → Boundaries), rendering is a standalone function that TAKES a
// score — not a method on one. It inks the score itself; analysis tracks
// (chironomy, tonarium, …) are downstream overlays built on the geometry it
// returns. One emitter format: SVG.
//
// The result is `{ svg, geometry }`. The geometry array — one entry per note in
// tabula order — is the TRACK CONTRACT: downstream consumers place marks against
// notes by index and coordinate, never by scraping the SVG.
//
// This is the standalone shell over the square-note emitter (emitters/svg.ts).
// The multi-system layout engine, front matter, and the accidental channels are
// wired in through InscriptioOpts as they land (Phases 3c–5); the options are
// defined in full here so those phases fill them without a signature change.
import { toSvg, type NoteGeometry, type SvgResult } from "./emitters/svg.js";
import type { Score } from "./api.js";
import type { ChantTabulaRow } from "./tabula.js";

export interface InscriptioOpts {
  // ── species ──
  /** Notation species. Square-note by default; "moderna" is the modern transcription (Phase 4). */
  notation?: "quadrata" | "moderna";
  /** Accidental channel (Phase 5). "standard" performance accidentals by default. */
  accidentals?: "standard" | "heji" | "cents";
  /** Baseline for the cents channel; the chant's home intonation by default. */
  centsBaseline?: "pythagorean" | "et";

  // ── layout (the multi-system engine; Phase 3c) ──
  /** Wrap systems to this px width. Absent = a single system (current behaviour). */
  width?: number;
  /** Vertical gap between systems, px. */
  systemGap?: number;
  /** Phrase indices that force a system break, or "auto" (width-driven). */
  breaks?: "auto" | number[];
  /** Render only the first N phrases — for incipits. */
  until?: number;
  /** Draw the quadrata line-end custos guides. */
  custos?: boolean;

  // ── scale & ink ──
  staffHeight?: number;
  noteScale?: number;
  padding?: number;
  noteColor?: string;
  staffLineColor?: string;
  /** Accent red for dropcap / annotations. */
  rubrica?: string;

  // ── front matter (Phase 3c; all off by default) ──
  title?: string;
  rubric?: string;
  /** Derive the rubric block from chant meta (feast / genus / modus / source). */
  annotation?: "auto";
  dropcap?: boolean;

  // ── lyrics ──
  lyricFont?: string;
  lyricSize?: number;
  lyricWeight?: number;

  // ── emphasis (emit-time, declarative, deterministic) ──
  /** Per-note colour, or null. Emit-time coloring only — interactive selection is downstream. */
  highlight?: (row: ChantTabulaRow) => string | null;
}

export interface Inscriptio {
  svg: string;
  geometry: NoteGeometry[];
}

// Options the underlying square-note emitter understands today. The front-matter
// and accidental options are accepted but inert until their phase.
const EMITTER_KEYS = [
  "staffHeight", "noteScale", "padding", "noteColor", "staffLineColor",
  "width", "systemGap", "custos",
] as const;

/**
 * Render a `Score` as SVG. Returns the markup plus a geometry array (one entry
 * per note, tabula order) for downstream analysis tracks.
 * @throws Error when `score` is not a valid Score (a builder-function contract).
 */
export function inscriptio(score: Score, opts: InscriptioOpts = {}): Inscriptio {
  if (!score || !Array.isArray(score.tabula)) {
    throw new Error("inscriptio: expected a Score (from notatio)");
  }
  if (opts.notation && opts.notation !== "quadrata" && opts.notation !== "moderna") {
    throw new Error(`inscriptio: unknown notation "${opts.notation}"`);
  }

  // Pass through only the options the emitter currently consumes; the rest are
  // reserved for later phases and ignored, not errored, so callers can adopt the
  // full interface now.
  const emitterOpts: Record<string, unknown> = {};
  for (const k of EMITTER_KEYS) if (opts[k] !== undefined) emitterOpts[k] = opts[k];

  const result: SvgResult = toSvg(score.tabula, score.chant, emitterOpts);
  return { svg: result.svg, geometry: result.geometry };
}

export type { NoteGeometry } from "./emitters/svg.js";
