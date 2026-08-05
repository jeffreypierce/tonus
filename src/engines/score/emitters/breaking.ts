// ---------------------------------------------------------------------------
// engines/score/emitters/breaking — where a system ends, for both species
// ---------------------------------------------------------------------------
//
// The two emitters break lines at different granularities — quadrata at a
// divisio (and, since 2026-08-05, at a word), moderna between syllables — and
// they draw different line-end marks (quadrata a custos, moderna none). Those
// are real differences between the duae species, not accidents to unify.
//
// But the RULES governing a break are the same in both, and were written twice:
//
//   - `z` forces a break, outranking any width test        (the engraver's own)
//   - `<nlba>` seals a seam and forbids one                 (the editor's own)
//   - a seal yields when the sealed run cannot fit a line   (the page wins)
//   - the usable width reserves the line-end mark           (never overrun it)
//
// Writing them twice is what shipped `<nlba>` working in quadrata and broken in
// moderna on 2026-08-05: the fix went into the emitter I happened to patch
// first, and only a sweep across both species caught it. This module is the
// mechanism; each emitter keeps its own policy and its own drawing.
//
// Nothing here measures or draws. The caller supplies measurements — which is
// what keeps tonus headless: the estimate lives in the emitter, the decision
// lives here, and neither needs a DOM.

import type { ChantTabulaRow } from "../tabula.js";

/** What the caller knows at a candidate break point. */
export interface BreakQuery {
  /** The row that would OPEN the next system. */
  next: ChantTabulaRow;
  /** Cursor position, in svg user units. */
  x: number;
  /** Rightmost usable x — the line's width less padding and any line-end mark. */
  boundary: number;
  /**
   * Width of what must fit before the next legal break point: a phrase for
   * quadrata, a syllable for moderna. Measured by the caller, never estimated
   * here.
   */
  need: number;
  /**
   * Width of the whole sealed run starting at `next`, when `next.keepWithPrev`
   * is set — the caller measures to the end of the `<nlba>` group. Ignored
   * otherwise.
   */
  sealedRun?: number;
  /** Where a fresh system's cursor starts, for judging whether a run fits at all. */
  lineStart: number;
  /**
   * Set when the caller has ALREADY consumed `next.lineBreak` itself. Quadrata
   * honours `z` in its own block (it must repeat the clef and place a custos
   * before the staff advances), so asking here too would break the same system
   * twice — measured, one Graduale chant drew 9 custos for 9 systems where 8 is
   * correct, the last system needing none.
   */
  forcedHandled?: boolean;
}

/** Why a system ended — carried so a caller can vary the line-end mark. */
export type BreakReason = "forced" | "width" | "none";

export interface BreakVerdict {
  break: boolean;
  reason: BreakReason;
}

const NO_BREAK: BreakVerdict = { break: false, reason: "none" };

/**
 * Decide whether a system ends before `next`.
 *
 * The order is the precedence order, and it is the whole contract:
 *
 *   1. `z` — an instruction, not a preference. Nothing overrides it, including
 *      a seal: an editor who wrote both meant both, and the break is the more
 *      specific statement.
 *   2. `<nlba>` — forbids a break, unless honouring it would push the sealed run
 *      off the page. A seal is a preference about where a line ends; staying
 *      inside the canvas is the stronger claim.
 *   3. Width — the ordinary case.
 */
export function decideBreak(q: BreakQuery): BreakVerdict {
  if (q.next.lineBreak && !q.forcedHandled) return { break: true, reason: "forced" };

  if (q.next.keepWithPrev) {
    const run = q.sealedRun ?? q.need;
    // A run that cannot fit a line of its own has nowhere better to go, so the
    // seal yields rather than running off the canvas. Otherwise the seal holds:
    // the break belongs before the group, and the caller finds it there.
    const fitsAnyLine = q.lineStart + run <= q.boundary;
    if (fitsAnyLine) return NO_BREAK;
  }

  // Past the boundary already — break regardless of what comes next. This must
  // be tested on its own: a single figure wider than a whole line (a 36-note
  // melisma at 420px) can never be rescued by breaking, but the line before it
  // should still end rather than run on. Folding this into the `need` test
  // below let such a syllable extend a line that was already full — measured,
  // one Graduale render overran by 56px.
  if (q.x > q.boundary) return { break: true, reason: "width" };

  return q.x + q.need > q.boundary
    ? { break: true, reason: "width" }
    : NO_BREAK;
}

/**
 * Width of the sealed run beginning at `from`, by the caller's own measure.
 *
 * The head of a sealed group must be tested against the WHOLE group: admit the
 * head alone and every seam after it is sealed, so the line can no longer break
 * and the overflow is unrecoverable. Measured across the 35 Graduale chants that
 * carry `<nlba>`, measuring one syllable instead of the run broke 37 seams.
 */
export function sealedRunWidth(
  rows: ChantTabulaRow[],
  from: number,
  widthOf: (index: number) => number,
): number {
  let total = widthOf(from);
  for (let i = from + 1; i < rows.length; i++) {
    if (!rows[i]!.keepWithPrev) break;
    total += widthOf(i);
  }
  return total;
}
