// ---------------------------------------------------------------------------
// engines/census/types — the census verb's shapes
// ---------------------------------------------------------------------------
// The field names are English by design. The census is measurement, not
// repertoire: it says how a chant sits against the corpus it belongs to, and
// the vocabulary for that is arithmetic, not liturgy.

/** A field group census() can measure similarity on. */
export type CensusGroup =
  | "modal"
  | "degreeHist"
  | "melodic"
  | "trigram"
  | "cadenceFinal"
  | "cadenceMedial"
  | "chironomy"
  | "textual"
  | "formulas";

/** `all` = the equal-weight mean of every group's cosine. */
export type CensusBy = CensusGroup | "all";

export interface CensusQuery {
  /** The chant to census. Exactly one block per id (blocks are deduped by id). */
  id: string;
  /** How many neighbors to return. Default 8; 0 returns none. */
  k?: number;
  /** Which field group similarity is measured on. Default "all". */
  by?: CensusBy;
  /**
   * Restrict neighbors to chants attested by this year. Unattested chants are
   * EXCLUDED, not assumed old — the same rule as `cantus({ before })`.
   */
  before?: number;
}

/** One field group's reading for a chant, beside the corpus norm. */
export interface CensusGroupProfile {
  /** The chant's values for this group. */
  values: readonly number[];
  /**
   * Cosine of this group against the corpus mean, 0–1. Low means the chant
   * uses this dimension unlike the rest of the corpus.
   */
  typicality: number;
}

export interface CensusNeighbor {
  id: string;
  /** Cosine similarity on the chosen group(s), 0–1. Higher is nearer. */
  similarity: number;
}

export interface Census {
  /** The chant censused. */
  id: string;
  /** Per-group readings, keyed by group name. */
  profile: Readonly<Record<CensusGroup, CensusGroupProfile>>;
  balance: {
    /**
     * Mean cosine distance from the corpus centre across all groups, 0–1.
     * 0 is a chant at the corpus mean; 1 has nothing in common with it.
     */
    distance: number;
    /**
     * Groups whose typicality falls furthest below the chant's own mean —
     * where this chant is unusual, named. Most deviant first.
     */
    deviantGroups: readonly CensusGroup[];
  };
  /** Nearest chants on the chosen group, nearest first. Ties → lower id. */
  neighbors: readonly CensusNeighbor[];
  /** Which group the neighbor sweep measured on. */
  by: CensusBy;
}
