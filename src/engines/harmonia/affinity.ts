// ---------------------------------------------------------------------------
// engines/harmonia/affinity — rank the 8 modes by fit to a pc distribution
// ---------------------------------------------------------------------------
import { MODES } from "../temper/modes.js";

export interface ModalAffinity {
  mode: number;
  alias: string;
  score: number;
}

export function computeModalAffinity(
  pcDistribution: Record<number, number>,
): ModalAffinity[] {
  const results: ModalAffinity[] = [];
  for (let m = 1; m <= 8; m++) {
    const data = MODES.get(m);
    if (!data) continue;
    const structural = new Set<number>([
      data.final,
      data.tenor,
      ...data.modulations.regular,
    ]);
    let score = 0;
    for (const pc of structural) {
      score += pcDistribution[pc] ?? 0;
    }
    results.push({ mode: m, alias: data.alias, score });
  }
  return results.sort((a, b) => b.score - a.score);
}
