// ---------------------------------------------------------------------------
// engines/score/emitters/strokes — where the square hand joins its notes
// ---------------------------------------------------------------------------
// A GABC figure (the notes between two separators) is not one mark on the page.
// Square notation draws it as a run of glyphs: ligatures (pes, clivis, torculus,
// porrectus, scandicus and their extensions) and single notes set beside them.
// The moderna slur spans one joined stroke (plan-moderna-neumes, rule 1), so it
// needs the glyph boundaries, not the figure's.
//
// The segmentation follows gregorio's: a glyph grows note by note while the
// motion stays one of the ligature shapes below. It breaks at a unison, at a
// shape that never ligates, after a liquescent (which always ends its glyph),
// and before a quilisma (which always begins one).
import type { ChantTabulaRow } from "../tabula.js";
import type { WrittenShape } from "../types.js";

type StrokeNote = Pick<ChantTabulaRow, "staffPosition" | "shape" | "liquescent" | "quilisma">;

/** Shapes square notation draws on their own, never inside a ligature: the
 *  inclinatum diamond, the stropha, the virga with its own stem, the linea. */
const ALONE: ReadonlySet<WrittenShape> = new Set<WrittenShape>([
  "inclinatum", "strophicus", "virga", "virgaReversa", "lineaPunctum",
]);

/** The ligatures, by the motion between their notes (u up, d down): pes,
 *  clivis; torculus, porrectus, scandicus; torculus resupinus, porrectus
 *  flexus, scandicus flexus; torculus resupinus flexus. */
const LIGATURES: ReadonlySet<string> = new Set([
  "u", "d", "ud", "du", "uu", "udu", "dud", "uud", "udud",
]);

/** Split one figure into its glyphs, as runs of indices into `figure`. */
export function segmentGlyphs(figure: readonly StrokeNote[]): number[][] {
  const glyphs: number[][] = [];
  let cur: number[] = [];
  let motion = "";
  figure.forEach((note, i) => {
    const prev = cur.length ? figure[cur[cur.length - 1]!]! : null;
    if (prev) {
      const step = Math.sign(note.staffPosition - prev.staffPosition);
      const next = motion + (step > 0 ? "u" : "d");
      if (step !== 0 && !ALONE.has(prev.shape) && !ALONE.has(note.shape) &&
          !prev.liquescent && !note.quilisma && LIGATURES.has(next)) {
        cur.push(i);
        motion = next;
        return;
      }
      glyphs.push(cur);
    }
    cur = [i];
    motion = "";
  });
  if (cur.length) glyphs.push(cur);
  return glyphs;
}

/**
 * The figure's joined strokes: its glyphs, with each pressus closed up. Two
 * glyphs that meet on one pitch, where at least one is a ligature (`ffe`,
 * `hjjg`, `fgg`), are sung as one held sound and slurred as one stroke
 * (rule 3). Two single notes on one pitch (`(ff)`, `jsjs`) stay apart: that
 * is a stropha group, struck twice, and takes no slur.
 */
export function joinStrokes(figure: readonly StrokeNote[]): number[][] {
  const strokes: number[][] = [];
  for (const glyph of segmentGlyphs(figure)) {
    const prev = strokes[strokes.length - 1];
    const last = prev ? figure[prev[prev.length - 1]!]! : null;
    const first = figure[glyph[0]!]!;
    const pressus = prev && last!.staffPosition === first.staffPosition &&
      (prev.length > 1 || glyph.length > 1) &&
      !ALONE.has(last!.shape) && !ALONE.has(first.shape);
    if (pressus) prev!.push(...glyph);
    else strokes.push([...glyph]);
  }
  return strokes;
}
