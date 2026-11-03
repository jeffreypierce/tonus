// ---------------------------------------------------------------------------
// engines/score/inscriptio — the score renderer (SVG + geometry contract)
// ---------------------------------------------------------------------------
// `inscriptio` (the inscribing) draws a Score. Per the rendering boundary
// (CODE-STANDARDS → Boundaries), rendering is a standalone function that TAKES a
// score — not a method on one. It inks the score itself; the three analysis
// tracks (prosodia, the word band; chironomia, the rhythmic band; tonarium,
// the melodic one) ship with it as opt-in bands (`tracks`), any of them riding
// either species, drawn from the same placements the geometry contract
// exports — never by scraping the notation.
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
import { toModerna, MODERNA_SPAN_RATIO } from "./emitters/moderna.js";
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
   * Analysis tracks drawn beneath each system: "prosodia" — the word band
   * (accent tents, syllable stems, melisma blocks) — "chironomia" — the
   * rhythmic band (wave, Pierik letters) — and "tonarium" — the melodic band
   * (maneriae rails, pressure sparkline, mode line, cadence nodes). Any rides
   * either species, and all may ride one score; they stack in a fixed order,
   * prosodia, chironomia, tonarium, whichever order they are asked for.
   *
   * The two-register principle is the house pairing — the rhythmic band under
   * the square notation (the body), the melodic band under the transcription
   * (the mind). It is a default worth keeping, not a constraint enforced here.
   */
  tracks?: readonly TrackName[];

  // ── layout (the multi-system engine) ──
  /** Wrap systems to this px width. Absent = a single system (current behaviour). */
  width?: number;
  /**
   * How big the chant is drawn: `"small"`, `"normal"` (default), `"large"`, or
   * a staff height in px for fitting a known column. A named size sets the
   * lyric at one size in both species (16px at `normal`); a number is the
   * drawn staff's height (top line to bottom line) exactly, in either species,
   * so `40` draws larger than `"normal"` in both.
   * Everything scales from it — notes, lyrics, the gap between systems — and
   * it reflows the music, so a larger scale means fewer notes per line.
   */
  scale?: "small" | "normal" | "large" | number;

  // ── front matter (all off by default) ──
  title?: string;
  rubric?: string;
  /** Derive the rubric block from chant meta (feast / genus / modus / source). */
  annotation?: "auto";
  /** Draw a rubricated initial from the first lyric; the first system indents. */
  dropcap?: boolean;

  // ── dress ──
  /**
   * Faces and ink — the whole look in one object.
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
   * re-rendering it. Size cannot work that way, which is why `scale` is not
   * part of the theme: line breaking consumes it long before a stylesheet sees
   * the output.
   */
  theme?: Theme;
}
// Queued (declared here once wired, not before): `breaks` / `until` (partial
// rendering for incipits) and an emit-time `highlight(row)` hook. The options
// above are exactly what the emitters honour.

export interface Inscriptio {
  svg: string;
  geometry: NoteGeometry[];
}

// Options handed through to the species emitters — everything but the species
// selector itself.
const EMITTER_KEYS = [
  "width",
  "title", "rubric", "annotation", "dropcap",
  "accidentals", "centsBaseline", "tracks",
] as const;

/**
 * Flatten a `theme` into the keys the emitters consume.
 *
 * The emitters take a flat option bag — one field per measurement, one per
 * colour — because that is the shape a render loop wants. The theme is the
 * shape a CALLER wants: faces and ink travel together, and a house style is
 * worth naming once. Resolving between them is this function's whole job, and
 * it is the only place that knows both shapes.
 */
function flattenTheme(theme: Theme | undefined): Record<string, unknown> {
  if (!theme) return {};
  const out: Record<string, unknown> = {};
  if (theme.fonts) out.fonts = theme.fonts;
  const c = theme.colors;
  if (c?.note !== undefined) out.noteColor = c.note;
  if (c?.staffLine !== undefined) out.staffLineColor = c.staffLine;
  if (c?.rubrica !== undefined) out.rubricaColor = c.rubrica;
  return out;
}

/** The named sizes, as the emitters' nominal staff heights in px; quadrata
 *  draws its staff at `QUADRATA_STAFF` of these and moderna at its engraved
 *  proportion, so the lyric is the same size in both. */
const SCALES: Record<string, number> = {
  small: 30,
  normal: 40,
  large: 56,
};

/**
 * Resolve `scale` to the emitter's `staffHeight`.
 *
 * A caller decides how big the chant should be, not how tall its staff is in
 * pixels — so the public option is a size and the staff height is what it
 * resolves to. A raw number still works for the caller who is fitting a known
 * column, and is the drawn staff's span in both species: quadrata's
 * `staffHeight` already is its span, and moderna's is a nominal size whose
 * span is `MODERNA_SPAN_RATIO` of it, so the number is divided through.
 *
 * A named size is a size of TYPE: the lyric is the same at `normal` in both
 * species (16px), and each species draws its staff to suit. Quadrata's suits
 * at 16/17 of the nominal height — its music was judged against a 17px lyric,
 * and the lyric came down to moderna's 16 with the staff following, rather
 * than the proportion changing. A raw number is not adjusted: it is the staff
 * height the caller asked for.
 */
const QUADRATA_STAFF = 16 / 17;

function resolveScale(
  scale: InscriptioOpts["scale"], quadrata: boolean,
): number | undefined {
  if (typeof scale === "number") return quadrata ? scale : scale / MODERNA_SPAN_RATIO;
  const px = SCALES[scale ?? "normal"];
  if (px === undefined) {
    throw new Error(
      `inscriptio: unknown scale "${scale}" ` +
      `(expected ${Object.keys(SCALES).join(", ")}, or a staff height in px)`,
    );
  }
  return quadrata ? px * QUADRATA_STAFF : px;
}

// ── Validation (the builder contract: invalid input throws) ──

const OPTION_KEYS = new Set<string>([
  "notation", "accidentals", "centsBaseline", "tracks", "width", "scale",
  "title", "rubric", "annotation", "dropcap", "theme",
]);
const TRACK_NAMES = new Set<string>(["prosodia", "chironomia", "tonarium"]);
const FONT_ROLES = new Set<string>(["dropcap", "title", "annotation", "lyric"]);
const COLOR_ROLES = new Set<string>(["note", "staffLine", "rubrica"]);

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isPositive = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v) && v > 0;

function oneOf(key: string, value: unknown, allowed: readonly string[], more = ""): void {
  if (value !== undefined && !allowed.includes(value as string)) {
    throw new Error(
      `inscriptio: unknown ${key} ${JSON.stringify(value)} (expected ${allowed.join(", ")}${more})`,
    );
  }
}

function validateTheme(theme: unknown): void {
  if (theme === undefined) return;
  if (!isObject(theme)) throw new Error("inscriptio: theme must be an object { fonts?, colors? }");
  for (const k of Object.keys(theme)) {
    if (k !== "fonts" && k !== "colors") throw new Error(`inscriptio: unknown theme key ${k} (fonts, colors)`);
  }
  if (theme.fonts !== undefined) {
    if (!isObject(theme.fonts)) throw new Error("inscriptio: theme.fonts must be an object");
    for (const [role, slot] of Object.entries(theme.fonts)) {
      if (!FONT_ROLES.has(role)) {
        throw new Error(`inscriptio: unknown font role ${role} (${[...FONT_ROLES].join(", ")})`);
      }
      if (slot === undefined || typeof slot === "string") continue;
      if (!isObject(slot) || typeof slot.family !== "string") {
        throw new Error(`inscriptio: theme.fonts.${role} must be a family string or { family, weight?, scale?, embed? }`);
      }
      if (slot.scale !== undefined && !isPositive(slot.scale)) {
        throw new Error(`inscriptio: theme.fonts.${role}.scale must be a positive number`);
      }
      if (slot.weight !== undefined && !isPositive(slot.weight)) {
        throw new Error(`inscriptio: theme.fonts.${role}.weight must be a positive number`);
      }
    }
  }
  if (theme.colors !== undefined) {
    if (!isObject(theme.colors)) throw new Error("inscriptio: theme.colors must be an object");
    for (const [role, value] of Object.entries(theme.colors)) {
      if (!COLOR_ROLES.has(role)) {
        throw new Error(`inscriptio: unknown colour role ${role} (${[...COLOR_ROLES].join(", ")})`);
      }
      if (value !== undefined && typeof value !== "string") {
        throw new Error(`inscriptio: theme.colors.${role} must be a CSS colour string`);
      }
    }
  }
}

/**
 * Check every option before anything is drawn. A malformed option is a caller
 * bug, and resolving it to something plausible (a NaN canvas, a silently
 * ignored typo) hides it — the builder contract throws instead, with the
 * accepted values in the message.
 */
function validateOpts(opts: unknown): asserts opts is InscriptioOpts {
  if (!isObject(opts)) throw new Error("inscriptio: options must be an object");
  for (const k of Object.keys(opts)) {
    if (!OPTION_KEYS.has(k)) {
      throw new Error(`inscriptio: unknown option ${k} (options: ${[...OPTION_KEYS].join(", ")})`);
    }
  }
  oneOf("notation", opts.notation, ["quadrata", "moderna"]);
  oneOf("accidentals", opts.accidentals, ["standard", "heji", "cents"]);
  oneOf("centsBaseline", opts.centsBaseline, ["pythagorean", "et"]);
  oneOf("annotation", opts.annotation, ["auto"]);
  if (opts.width !== undefined && !isPositive(opts.width)) {
    throw new Error(`inscriptio: width must be a positive number of px (got ${String(opts.width)})`);
  }
  if (typeof opts.scale === "number" && !isPositive(opts.scale)) {
    throw new Error(`inscriptio: scale must be a positive staff height in px (got ${String(opts.scale)})`);
  }
  if (opts.scale !== undefined && typeof opts.scale !== "number") {
    oneOf("scale", opts.scale, Object.keys(SCALES), ", or a staff height in px");
  }
  for (const k of ["title", "rubric"] as const) {
    if (opts[k] !== undefined && typeof opts[k] !== "string") {
      throw new Error(`inscriptio: ${k} must be a string`);
    }
  }
  if (opts.dropcap !== undefined && typeof opts.dropcap !== "boolean") {
    throw new Error("inscriptio: dropcap must be a boolean");
  }
  if (opts.tracks !== undefined) {
    if (!Array.isArray(opts.tracks)) {
      throw new Error(
        `inscriptio: tracks must be an array of track names, e.g. ["chironomia"] (got ${JSON.stringify(opts.tracks)})`,
      );
    }
    // An unknown name is a caller bug and throws.
    for (const track of opts.tracks) {
      if (!TRACK_NAMES.has(track)) {
        throw new Error(
          `inscriptio: unknown track "${track}" — tracks are "prosodia" ` +
          `(the word band), "chironomia" (the rhythmic band) and "tonarium" ` +
          `(the melodic band)`,
        );
      }
    }
  }
  validateTheme(opts.theme);
}

/**
 * Render a `Score` as SVG. Returns the markup plus a geometry array (one entry
 * per note, tabula order) for downstream analysis tracks.
 * @throws Error when `score` is not a valid Score, or on an unknown option or
 *   an invalid value (a builder-function contract).
 */
export function inscriptio(score: Score, opts: InscriptioOpts = {}): Inscriptio {
  if (!score || !Array.isArray(score.tabula)) {
    throw new Error("inscriptio: expected a Score (from notatio)");
  }
  validateOpts(opts);
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

  // Any track rides either species, and all may ride one score — the
  // selection is independent of the notation, as the notation itself is.

  // Pass through the options the emitters consume; the species selector stays
  // here. A species ignores, not errors on, options that do not apply to it:
  // both honour `title`, and the margin mark (`rubric`, `annotation`) and the
  // `dropcap` are quadrata's alone.
  const emitterOpts: Record<string, unknown> = flattenTheme(opts.theme);
  const staffHeight = resolveScale(opts.scale, opts.notation !== "moderna");
  if (staffHeight !== undefined) emitterOpts.staffHeight = staffHeight;
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
export type { FontSpec, FontSlot, FontEmbed, Theme, ThemeColors } from "./emitters/svg.js";
export type { TrackName, TrackData } from "./emitters/tracks.js";
