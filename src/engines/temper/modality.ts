// ---------------------------------------------------------------------------
// engines/temper/modality — how well pitch content fits each church mode
// ---------------------------------------------------------------------------
// Modal theory, not tied to any one caller: the imprint uses it to fingerprint a
// whole chant, modulation detection to read each phrase. A pure function of a
// pitch-class distribution (and, optionally, the chant's opening note).
import { MODES } from "./modes.js";

export interface ModalAffinity {
  mode: number;
  alias: string;
  score: number;
}

// A mode's structural degrees are not equal: the finalis defines it, the tenor
// anchors its recitation, and modulation degrees are only secondary colour. Time
// spent on each pitch counts toward the mode in that proportion.
const FINALIS_WEIGHT = 3;
const TENOR_WEIGHT = 2;
const REGULAR_MOD_WEIGHT = 1;
const CONCEDED_MOD_WEIGHT = 0.5;

// A chant's opening note is a modal signal: each mode lists its valid initials
// in rank order, most characteristic first (Rockstro's Grove ordering
// [biblio: rockstro-grove]). Opening on a mode's primary initial boosts it more
// than opening on a lower-ranked one — which is what separates an authentic mode
// from its plagal partner, since the two share a finalis but rank the same
// opening pitch differently.
const INITIAL_BONUS = 0.3;

// The last note is the treatises' first determinant of mode: a chant comes to
// rest on its final. Landing on a mode's final is the single strongest signal.
const FINAL_NOTE_BONUS = 0.5;

// Tessitura — how high the melody sits above its final — is the classical
// authentic/plagal separator (an authentic mode ranges a fifth-and-more above the
// final; its plagal partner straddles it). Calibrated over the corpus (n≈6,666):
// mean-pitch-minus-final is ~4.0 semitones for authentic, ~1.7 for plagal, with
// clean separation. The bonus peaks when the observed tessitura matches the
// mode's expected value and falls off linearly over TESSITURA_TOLERANCE.
const TESSITURA_AUTHENTIC = 4.0;
const TESSITURA_PLAGAL = 1.7;
const TESSITURA_TOLERANCE = 3;
const TESSITURA_WEIGHT = 1.0;

export interface ModalAffinityOpts {
  /** The chant's opening pitch class — applies the rank-weighted initials bonus. */
  firstNotePc?: number;
  /** The chant's closing pitch class — applies the final-note and tessitura bonuses. */
  lastNotePc?: number;
  /** Mean note MIDI minus the last note's MIDI — the melody's height above its close. */
  tessitura?: number;
}

/**
 * Rank a pitch-class distribution against the eight modes, best fit first.
 * The optional signals sharpen the ranking: the opening note (initials bonus),
 * the closing note (final-note bonus), and the tessitura (authentic/plagal).
 */
export function computeModalAffinity(
  pcDistribution: Record<number, number>,
  opts: ModalAffinityOpts = {},
): ModalAffinity[] {
  const { firstNotePc, lastNotePc, tessitura } = opts;
  const results: ModalAffinity[] = [];
  for (let m = 1; m <= 8; m++) {
    const data = MODES.get(m);
    if (!data) continue;

    // Weight each degree by its modal role; a pc that fills more than one role
    // (e.g. a modulation degree that is also the tenor) takes the strongest.
    const degreeWeight = new Map<number, number>();
    const set = (pc: number, w: number) => {
      degreeWeight.set(pc, Math.max(degreeWeight.get(pc) ?? 0, w));
    };
    for (const pc of data.modulations.conceded) set(pc % 12, CONCEDED_MOD_WEIGHT);
    for (const pc of data.modulations.regular) set(pc % 12, REGULAR_MOD_WEIGHT);
    set(data.tenor, TENOR_WEIGHT);
    set(data.final, FINALIS_WEIGHT);

    let score = 0;
    for (const [pc, w] of degreeWeight) score += (pcDistribution[pc] ?? 0) * w;

    // Initials bonus, scaled by how highly the mode ranks the opening pitch.
    if (firstNotePc != null) {
      const initials = data.modulations.initials;
      const rank = initials.findIndex((pc) => pc % 12 === firstNotePc);
      if (rank !== -1) score += (INITIAL_BONUS * (initials.length - rank)) / initials.length;
    }

    // Final-note + tessitura: only apply when the chant actually rests on this
    // mode's final. The tessitura then separates the mode from its authentic/
    // plagal partner (which share the final but sit at different heights).
    if (lastNotePc != null && lastNotePc === data.final % 12) {
      score += FINAL_NOTE_BONUS;
      if (tessitura != null) {
        const expected = data.type === "authentic" ? TESSITURA_AUTHENTIC : TESSITURA_PLAGAL;
        const fit = Math.max(0, 1 - Math.abs(tessitura - expected) / TESSITURA_TOLERANCE);
        score += TESSITURA_WEIGHT * fit;
      }
    }

    results.push({ mode: m, alias: data.alias, score });
  }
  return results.sort((a, b) => b.score - a.score);
}
