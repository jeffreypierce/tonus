// ---------------------------------------------------------------------------
// tonus/census — one chant measured against the corpus that holds it
// ---------------------------------------------------------------------------
// The analysis boundary, made addressable. The library never RUNS a census; it
// CITES one. Everything here reads a baked table — the blocks the corpus
// pipeline emits — and does arithmetic over it. No mining lives behind this
// entry and none may be added: a threshold calibrated across many chants is the
// corpus repo's business, and re-enters as generated data with provenance.
//
// Year-shaped questions ("this season," "this manuscript," a window of the
// calendar) are not here and do not belong here. `data/census.ts` states the
// same rule from the data side: this is the only census artifact in the
// package, and the corpus repo's other outputs stay there. Pooling blocks is
// the caller's to do, under the rule census.md fixes — cosine per field group,
// never over the flat 221.
//
// CENSUS_BLOCK_FLOATS joins the two constants the root already exported. A
// caller decoding a block had to know the stride and could get it only by
// counting CENSUS_GROUPS, which is the transcription the appendix rule exists
// to prevent.

export { getCensus as census } from "./engines/census/census.js";

export type {
  Census,
  CensusQuery,
  CensusBy,
  CensusGroup,
  CensusGroupProfile,
  CensusNeighbor,
} from "./engines/census/types.js";

export {
  CENSUS_GROUPS,
  CENSUS_ORDER,
  CENSUS_BLOCK_FLOATS,
} from "./data/census.js";
