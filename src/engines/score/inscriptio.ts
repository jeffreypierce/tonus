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
import {
  toSvg, type NoteGeometry, type SvgResult,
  type FontSpec, type FontSlot, type FontEmbed,
} from "./emitters/svg.js";
import { toModerna } from "./emitters/moderna.js";
import type { Score } from "./api.js";

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
  /** Draw the quadrata line-end custos guides. */
  custos?: boolean;

  // ── scale & ink ──
  staffHeight?: number;
  noteScale?: number;
  padding?: number;
  noteColor?: string;
  staffLineColor?: string;
  /** Accent red for dropcap / annotations. */
  rubricaColor?: string;

  // ── front matter (Phase 3c; all off by default) ──
  title?: string;
  rubric?: string;
  /** Derive the rubric block from chant meta (feast / genus / modus / source). */
  annotation?: "auto";
  dropcap?: boolean;

  // ── faces ──
  /**
   * Per-role text faces: `dropcap`, `title`, `annotation`, `lyric` — each a
   * font-family string or `{ family, weight?, scale? }` (scale adjusts the
   * role's size for faces whose apparent size differs from the house serif).
   * By default the SVG carries font-family REFERENCES and the host page
   * supplies the face (`@font-face`). A slot may instead carry `embed`
   * ({ base64, format? }) — the CALLER's font bytes — and the face then
   * rides inside the SVG's own `<style>`, making the file self-contained
   * (at the cost of its size). tonus never bundles font files; with embed
   * it is a conduit for data the consumer supplies, and the consumer
   * carries the face's license terms. Anything unset falls back to the
   * house serif.
   */
  fonts?: FontSpec;
}
// Queued past 0.2 (declared here once wired, not before): `breaks` / `until`
// (partial rendering for incipits), lyric font overrides, and an emit-time
// `highlight(row)` hook. 0.2 declares only what the emitters honour.

export interface Inscriptio {
  svg: string;
  geometry: NoteGeometry[];
}

// Options the underlying square-note emitter understands today. The front-matter
// and accidental options are accepted but inert until their phase.
const EMITTER_KEYS = [
  "staffHeight", "noteScale", "padding", "noteColor", "staffLineColor",
  "width", "systemGap", "custos",
  "title", "rubric", "annotation", "dropcap", "rubricaColor", "fonts",
  "accidentals", "centsBaseline",
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
  // The HEJI and cents channels are modern analytical overlays; they belong on
  // the modern staff, not on historical square notation. Quadrata carries only
  // the accidentals GABC itself expresses (flat/natural/sharp).
  if (opts.notation !== "moderna" &&
      (opts.accidentals === "heji" || opts.accidentals === "cents")) {
    throw new Error(
      `inscriptio: accidentals "${opts.accidentals}" is a moderna-only intonation ` +
      `overlay; square notation (quadrata) carries only GABC accidentals. ` +
      `Use notation: "moderna".`,
    );
  }

  // Pass through only the options the emitter currently consumes; the rest are
  // reserved for later phases and ignored, not errored, so callers can adopt the
  // full interface now.
  const emitterOpts: Record<string, unknown> = {};
  for (const k of EMITTER_KEYS) if (opts[k] !== undefined) emitterOpts[k] = opts[k];

  // Dispatch to the species' own renderer — each owns its spacing pass.
  const render = opts.notation === "moderna" ? toModerna : toSvg;
  const result: SvgResult = render(score.tabula, score.chant, emitterOpts);
  return { svg: result.svg, geometry: result.geometry };
}

export type { NoteGeometry } from "./emitters/svg.js";
export type { FontSpec, FontSlot, FontEmbed } from "./emitters/svg.js";
