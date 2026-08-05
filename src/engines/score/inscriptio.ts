// ---------------------------------------------------------------------------
// engines/score/inscriptio — the score renderer (SVG + geometry contract)
// ---------------------------------------------------------------------------
// `inscriptio` (the inscribing) draws a Score. Per the rendering boundary
// (CODE-STANDARDS → Boundaries), rendering is a standalone function that TAKES a
// score — not a method on one. It inks the score itself; the analysis tracks
// (chironomia, the rhythmic band; tonarium, the melodic one) ship with it as
// opt-in bands (`tracks`), either riding either species, drawn from the same
// placements the geometry contract exports — never by scraping the notation.
// Custom tracks remain downstream consumers of that contract. One emitter
// format: SVG.
//
// The result is `{ svg, geometry }`. The geometry array — one entry per note in
// tabula order — is the TRACK CONTRACT: downstream consumers place marks against
// notes by index and coordinate, never by scraping the SVG.
//
// This is the standalone shell over the species emitters: the square-note
// renderer (emitters/svg.ts) and the modern transcription (emitters/moderna.ts).
// The multi-system layout engine, front matter, and the accidental channels
// are all wired in through InscriptioOpts.
import {
  toSvg, type NoteGeometry, type SvgResult,
  type FontSpec, type FontSlot, type FontEmbed, type Theme,
} from "./emitters/svg.js";
import { toModerna } from "./emitters/moderna.js";
import type { TrackData, TrackName } from "./emitters/tracks.js";
import type { Score } from "./api.js";

export interface InscriptioOpts {
  // ── species ──
  /** Notation species. Square-note by default; "moderna" is the modern transcription. */
  notation?: "quadrata" | "moderna";
  /** Accidental channel. "standard" performance accidentals by default. */
  accidentals?: "standard" | "heji" | "cents";
  /** Baseline for the cents channel; the chant's home intonation by default. */
  centsBaseline?: "pythagorean" | "et";
  /**
   * Analysis tracks drawn beneath each system: "chironomia" — the rhythmic
   * band (wave, Pierik letters) — and "tonarium" — the melodic band (maneriae
   * rails, pressure sparkline, mode line, cadence nodes). Either rides either
   * species, and both may ride one score; they stack in a fixed order, the
   * chironomia above the tonarium, whichever order they are asked for.
   *
   * The two-register principle is the house pairing — the rhythmic band under
   * the square notation (the body), the melodic band under the transcription
   * (the mind). It is a default worth keeping, not a constraint enforced here.
   */
  tracks?: readonly TrackName[];

  // ── layout (the multi-system engine) ──
  /** Wrap systems to this px width. Absent = a single system (current behaviour). */
  width?: number;
  /** Draw the quadrata line-end custos guides. */
  custos?: boolean;

  // ── front matter (all off by default) ──
  title?: string;
  rubric?: string;
  /** Derive the rubric block from chant meta (feast / genus / modus / source). */
  annotation?: "auto";
  /** Draw a rubricated initial from the first lyric; the first system indents. */
  dropcap?: boolean;

  // ── dress ──
  /**
   * Faces, ink, and measurements — the whole look in one object.
   *
   * `fonts` carries four roles (`dropcap`, `title`, `annotation`, `lyric`), each
   * a family string or `{ family, weight?, scale?, embed? }`. Without `embed`
   * the SVG carries a font-family REFERENCE and the host page supplies the face;
   * with it the CALLER's bytes ride inside the SVG's own `<style>` and the file
   * is self-contained. tonus bundles no font files — with `embed` it is a
   * conduit for data the consumer supplies, and the consumer carries the face's
   * license terms.
   *
   * `colors` reaches the SVG as CSS custom properties with the theme's value as
   * the fallback, so a host stylesheet can retheme a drawn chant without
   * re-rendering it. `metrics` cannot work that way: staff height and note scale
   * are consumed by line breaking long before a stylesheet sees the output.
   */
  theme?: Theme;
}
// Queued past 0.2 (declared here once wired, not before): `breaks` / `until`
// (partial rendering for incipits), lyric font overrides, and an emit-time
// `highlight(row)` hook. 0.2 declares only what the emitters honour.

export interface Inscriptio {
  svg: string;
  geometry: NoteGeometry[];
}

// Options handed through to the species emitters — everything but the species
// selector itself.
const EMITTER_KEYS = [
  "width", "custos",
  "title", "rubric", "annotation", "dropcap",
  "accidentals", "centsBaseline", "tracks",
] as const;

/**
 * Flatten a `theme` into the keys the emitters consume.
 *
 * The emitters take a flat option bag — one field per measurement, one per
 * colour — because that is the shape a render loop wants. The theme is the
 * shape a CALLER wants: faces, ink, and metrics travel together, and a house
 * style is worth naming once. Resolving between them is this function's whole
 * job, and it is the only place that knows both shapes.
 */
function flattenTheme(theme: Theme | undefined): Record<string, unknown> {
  if (!theme) return {};
  const out: Record<string, unknown> = {};
  if (theme.fonts) out.fonts = theme.fonts;
  const { colors: c, metrics: m } = theme;
  if (c?.note !== undefined) out.noteColor = c.note;
  if (c?.staffLine !== undefined) out.staffLineColor = c.staffLine;
  if (c?.rubrica !== undefined) out.rubricaColor = c.rubrica;
  if (m?.staffHeight !== undefined) out.staffHeight = m.staffHeight;
  if (m?.noteScale !== undefined) out.noteScale = m.noteScale;
  if (m?.padding !== undefined) out.padding = m.padding;
  if (m?.systemGap !== undefined) out.systemGap = m.systemGap;
  return out;
}

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

  // Either track rides either species, and both may ride one score — the
  // selection is independent of the notation, as the notation itself is. An
  // unknown name is a caller bug and throws.
  for (const track of opts.tracks ?? []) {
    if (track !== "chironomia" && track !== "tonarium") {
      throw new Error(
        `inscriptio: unknown track "${track}" — tracks are "chironomia" ` +
        `(the rhythmic band) and "tonarium" (the melodic band)`,
      );
    }
  }

  // Pass through the options the emitters consume; the species selector stays
  // here. A species ignores, not errors on, options that do not apply to it.
  // Both species honour the front matter (title, rubric/annotation) — the
  // official opening is `title` + `annotation: "auto"`, no dropcap.
  const emitterOpts: Record<string, unknown> = flattenTheme(opts.theme);
  for (const k of EMITTER_KEYS) if (opts[k] !== undefined) emitterOpts[k] = opts[k];

  // The tracks consume score-level analysis the flat tabula does not carry;
  // hand it through only when a track asked for it.
  if (opts.tracks && opts.tracks.length > 0) {
    const modeDigit = score.chant.mode ? parseInt(score.chant.mode) : NaN;
    const trackData: TrackData = {
      cadences: score.cadences,
      modulations: score.modulations,
      mode: Number.isFinite(modeDigit) ? modeDigit : undefined,
    };
    emitterOpts["trackData"] = trackData;
  }

  // Dispatch to the species' own renderer — each owns its spacing pass.
  const render = opts.notation === "moderna" ? toModerna : toSvg;
  const result: SvgResult = render(score.tabula, score.chant, emitterOpts);
  return { svg: result.svg, geometry: result.geometry };
}

export type { NoteGeometry } from "./emitters/svg.js";
export type { FontSpec, FontSlot, FontEmbed, Theme, ThemeColors, ThemeMetrics } from "./emitters/svg.js";
export type { TrackName, TrackData } from "./emitters/tracks.js";
