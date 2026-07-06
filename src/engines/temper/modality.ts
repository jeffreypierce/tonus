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

/**
 * Rank a pitch-class distribution against the eight modes, best fit first.
 * `firstNotePc`, when given, applies the rank-weighted initials bonus.
 */
export function computeModalAffinity(
  pcDistribution: Record<number, number>,
  firstNotePc?: number,
): ModalAffinity[] {
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

    results.push({ mode: m, alias: data.alias, score });
  }
  return results.sort((a, b) => b.score - a.score);
}
