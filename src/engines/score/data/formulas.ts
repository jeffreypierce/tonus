// ---------------------------------------------------------------------------
// engines/score/data/formulas — the melodic-formula catalogue (Apel)
// ---------------------------------------------------------------------------
// Apel's centonization thesis [biblio: apel-chant, pp. 305–374]: the responsorial-
// melismatic chants (Graduals, Tracts, Great Responsories) are not freely
// composed but assembled from a stock of recurring standard phrases shared across
// many chants of a mode. He catalogues them per genre × mode as a closed symbol
// alphabet — openings, intonations, flexes, mediants, terminations, a close —
// and tabulates each chant as its sequence of those symbols.
//
// A Formula here is one such symbol: its Apel id, the slot it fills, and its
// melodic skeleton as DIATONIC STEPS relative to the mode's final (0 = final,
// +1 = one scale-step above, -1 the note below) — mode-relative and transposition-
// invariant, the same encoding CadenceFigure uses, just a whole phrase long. The
// matcher (formula.ts) fits a chant's phrases against this catalogue with tolerance
// for the melismatic filling Apel's variant notation (+, small caps, underline)
// records, since a formula flexes to fit its text.
//
// The catalogue is keyed by `${office}:${mode}` (e.g. "gr:5", "tr:2", "re:8") —
// only the Tier-1 tabulatable genres. Transcribed dictate-verify from Apel's
// plates (the figures are an image-only scan), the same way the Niedermeyer
// cadence figures were; his printed tabulation is the validation oracle.

/** The psalmodic-skeleton slot a formula fills, in a chant's flow. */
export type FormulaSlot =
  | "opening"
  | "intonation"
  | "flex"
  | "mediant"
  | "termination"
  | "close";

export interface Formula {
  /** Apel's symbol, e.g. "D1", "F1", "C2". */
  id: string;
  /** Which slot in the psalmodic skeleton this phrase fills. */
  slot: FormulaSlot;
  /**
   * The melodic skeleton as diatonic steps relative to the mode's final
   * (0 = final). Read in melodic order (first note first). Null entries are
   * notes off the mode's scale (chromatic inflections).
   */
  steps: Array<number | null>;
}

// The catalogue, keyed by `${office}:${mode}`. Seeded empty per genre×mode until
// the Apel formulae are dictated in; a null/absent key means "no catalogue for
// this genre×mode", and the matcher degrades gracefully (formula: null).
//
// TODO(dictate): populate from Apel — mode-5 Graduals (Fig. 103–104, pp. 344–347)
// and the mode-2/mode-8 Great Responsory tabulations. Until then this ships empty
// so the machinery and its graceful degradation are exercised by fixtures.
export const FORMULAE: Record<string, Formula[]> = {
  // "gr:5": [ … mode-5 Gradual formulae … ],
  // "tr:2": [ … mode-2 Tract formulae … ],
  // "re:8": [ … mode-8 Great Responsory formulae … ],
};

/** The formula catalogue for a genre × mode, or an empty list if none exists. */
export function formulaeFor(office: string, mode: number): Formula[] {
  return FORMULAE[`${office}:${mode}`] ?? [];
}
