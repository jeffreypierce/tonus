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
  id?: string;
  /**
   * A SET of chants to census together — every Kyrie, a mode, a feast's
   * propers, whatever query produced them. The profile is then the centroid of
   * their blocks, read against the corpus exactly as one chant's would be, so
   * "how typical is this group" is the same question as "how typical is this
   * chant" asked of more than one.
   *
   * Give `id` or `ids`, never both and never neither.
   */
  ids?: readonly string[];
  /** How many neighbours to return. Default 8; 0 returns none. */
  k?: number;
  /** Which field group similarity is measured on. Default "all". */
  by?: CensusBy;
  /**
   * Restrict neighbours to chants attested by this year. Unattested chants are
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

export interface CensusNeighbour {
  id: string;
  /** Cosine similarity on the chosen group(s), 0–1. Higher is nearer. */
  similarity: number;
}

export interface Census {
  /** The chant censused — the single id, or the first of a set. */
  id: string;
  /**
   * Every chant censused, in the order they were read. One entry for a single
   * chant, so the shape does not fork between the two questions.
   */
  ids: readonly string[];
  /** Per-group readings, keyed by group name. For a set, of the centroid. */
  profile: Readonly<Record<CensusGroup, CensusGroupProfile>>;
  balance: {
    /**
     * Mean cosine distance from the corpus centre across all groups, 0–1.
     * 0 is a chant at the corpus mean; 1 has nothing in common with it.
     */
    distance: number;
    /**
     * Groups whose typicality falls furthest below the subject's own mean —
     * where it is unusual, named. Most deviant first.
     */
    deviantGroups: readonly CensusGroup[];
  };
  /**
   * Nearest chants on the chosen group, nearest first. Ties → lower id.
   * The subject is never its own neighbour, and for a set no MEMBER is: a
   * group's neighbours are what resemble it from outside.
   */
  neighbors: readonly CensusNeighbour[];
  /** Which group the neighbour sweep measured on. */
  by: CensusBy;
}
