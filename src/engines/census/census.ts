// ---------------------------------------------------------------------------
// engines/census — where a chant sits against the corpus that holds it
// ---------------------------------------------------------------------------
// The corpus repo censuses every shipped chant into a block of 225 float32s:
// modal behaviour, degree histogram, interval bigrams, trigram and cadence
// vocabulary, chironomy, text setting, formula hits. This engine reads those
// blocks and answers one question — how typical is this chant, and what is it
// near?
//
// DISTANCE IS COSINE PER FIELD GROUP, never over the flat 225. Cosine
// on the whole vector is dominated by the 121-float melodic block and by sheer
// magnitude, so a long Tract would neighbour other long chants for being long.
// Per-group cosine asks about SHAPE within each dimension, and `all` is the
// equal-weight mean of those — every dimension one vote, no tunable weights.

import {
  CENSUS_BLOCKS_B64,
  CENSUS_BLOCK_FLOATS,
  CENSUS_GROUPS,
  CENSUS_ORDER,
} from "../../data/census.js";
import { attestationCutoff, chantAdmissible } from "../chant/attest.js";
import type {
  Census,
  CensusBy,
  CensusGroup,
  CensusGroupProfile,
  CensusNeighbour,
  CensusQuery,
} from "./types.js";

const GROUP_NAMES = Object.keys(CENSUS_GROUPS) as CensusGroup[];

// ── The blocks, decoded once ────────────────────────────────────────────────
// Base64 in a .ts is how the blocks ride in the package (no fs, no fetch, works
// in a browser). Decoding is deferred so importing tonus does not pay for a
// census nobody asked for.
let _blocks: Float32Array | null = null;
function blocks(): Float32Array {
  if (_blocks) return _blocks;
  const bin =
    typeof Buffer !== "undefined"
      ? Buffer.from(CENSUS_BLOCKS_B64, "base64")
      : Uint8Array.from(atob(CENSUS_BLOCKS_B64), (c) => c.charCodeAt(0));
  // The bytes are float32 little-endian. A DataView read is used rather than a
  // Float32Array view over the buffer because the base64 decode gives no
  // alignment guarantee, and because a big-endian host would silently
  // byte-swap an aligned view.
  const view = new DataView(bin.buffer, bin.byteOffset, bin.byteLength);
  const out = new Float32Array(bin.byteLength / 4);
  for (let i = 0; i < out.length; i++) out[i] = view.getFloat32(i * 4, true);
  _blocks = out;
  return out;
}

let _index: Map<string, number> | null = null;
function index(): Map<string, number> {
  if (!_index) _index = new Map(CENSUS_ORDER.map((id, i) => [id, i]));
  return _index;
}

/** One group's slice of a chant's block. */
function slice(blockIndex: number, group: CensusGroup): Float32Array {
  const { offset, count } = CENSUS_GROUPS[group]!;
  const start = blockIndex * CENSUS_BLOCK_FLOATS + offset;
  return blocks().subarray(start, start + count);
}

/**
 * Cosine similarity, 0–1. Two all-zero vectors are IDENTICAL (1), not
 * undefined: a chant with no formula hits and another with none agree
 * perfectly about formulas. One zero vector against a non-zero one shares
 * nothing, so 0.
 */
function cosine(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i]!;
    const y = b[i]!;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 && nb === 0) return 1;
  if (na === 0 || nb === 0) return 0;
  const c = dot / (Math.sqrt(na) * Math.sqrt(nb));
  // Guard the float edge: a chant against itself must be exactly 1.
  return c > 1 ? 1 : c < -1 ? -1 : c;
}

// ── The corpus mean, per group, computed once ───────────────────────────────
// Typicality is measured against the whole SHIPPED corpus, not against the
// filtered pool: `before` restricts who may be a neighbour, it does not
// move the mean.
let _means: Record<CensusGroup, Float32Array> | null = null;
function means(): Record<CensusGroup, Float32Array> {
  if (_means) return _means;
  const out = {} as Record<CensusGroup, Float32Array>;
  const n = CENSUS_ORDER.length;
  for (const g of GROUP_NAMES) {
    const { count } = CENSUS_GROUPS[g]!;
    const acc = new Float32Array(count);
    for (let i = 0; i < n; i++) {
      const s = slice(i, g);
      for (let k = 0; k < count; k++) acc[k]! += s[k]!;
    }
    for (let k = 0; k < count; k++) acc[k]! /= n;
    out[g] = acc;
  }
  _means = out;
  return out;
}

/** The centroid of several blocks, per group — a set's stand-in for a chant's
 * own slice. One member returns that member's slice unchanged, so a set of one
 * censuses exactly as the chant does. */
function centroid(blockIndices: readonly number[], group: CensusGroup): Float32Array {
  if (blockIndices.length === 1) return slice(blockIndices[0]!, group);
  const { count } = CENSUS_GROUPS[group]!;
  const acc = new Float32Array(count);
  for (const bi of blockIndices) {
    const s = slice(bi, group);
    for (let k = 0; k < count; k++) acc[k]! += s[k]!;
  }
  for (let k = 0; k < count; k++) acc[k]! /= blockIndices.length;
  return acc;
}

const VALID_KEYS = new Set(["id", "ids", "k", "by", "before"]);

/**
 * The census of one chant, or of a SET of them: its profile against the
 * corpus, where it is unusual, and what it is near.
 *
 * A set is censused as its centroid, so "how typical are the Graduals" is the
 * same question as "how typical is this Gradual", asked of more than one. Its
 * neighbours are what resemble it from outside — no member of the set is one.
 */
export function getCensus(query: CensusQuery): Census {
  if (!query || typeof query !== "object") {
    throw new Error('census requires a query: census({ id: "gregobase:1210" }).');
  }
  const unknown = Object.keys(query).filter((k) => !VALID_KEYS.has(k));
  if (unknown.length) {
    throw new Error(
      `census: unknown query key(s) ${unknown.map((k) => `"${k}"`).join(", ")} ` +
        `(expected ${[...VALID_KEYS].join(", ")}).`,
    );
  }

  // One chant or a set, never both and never neither. A malformed query
  // throws; this is the door, not a no-match.
  const hasId = query.id !== undefined;
  const hasIds = query.ids !== undefined;
  if (hasId && hasIds) {
    throw new Error('census: give id or ids, not both — census({ id }) censuses one chant, ' +
      "census({ ids }) censuses a set together.");
  }
  if (!hasId && !hasIds) {
    throw new Error('census requires an id (a string) or ids (an array), ' +
      'e.g. census({ id: "gregobase:1210" }).');
  }
  if (hasId && (typeof query.id !== "string" || !query.id)) {
    throw new Error("census requires an id (a string), e.g. census({ id: \"gregobase:1210\" }).");
  }
  if (hasIds && (!Array.isArray(query.ids) || query.ids.length === 0)) {
    throw new Error("census: ids must be a non-empty array of chant ids.");
  }

  // Deduped, and read in the order given: the same set always answers the same.
  const ids = hasId ? [query.id as string] : [...new Set(query.ids as readonly string[])];
  const blockIndices: number[] = [];
  for (const one of ids) {
    if (typeof one !== "string" || !one) {
      throw new Error("census: every id must be a non-empty string.");
    }
    const at = index().get(one);
    if (at == null) {
      throw new Error(
        `census: no block for "${one}". The census covers the ${CENSUS_ORDER.length} chants ` +
          "tonus ships; an id from a catalogue at large will not be among them.",
      );
    }
    blockIndices.push(at);
  }
  const id = ids[0]!;
  const members = new Set(blockIndices);

  const by: CensusBy = query.by ?? "all";
  if (by !== "all" && !GROUP_NAMES.includes(by as CensusGroup)) {
    throw new Error(
      `census: unknown field group "${by}" ` +
        `(expected all, ${GROUP_NAMES.join(", ")}).`,
    );
  }

  const k = query.k ?? 8;
  if (!Number.isInteger(k) || k < 0) {
    throw new Error(`census: k must be a non-negative integer, got ${String(query.k)}.`);
  }

  // The shared rule, not a local one — same door as cantus and the day verbs,
  // so `before: 1098` means the same thing here as everywhere else.
  const cutoff = attestationCutoff({ before: query.before }, "census");

  // ── profile: each group against the corpus mean ──────────────────────────
  const mean = means();
  const profile = {} as Record<CensusGroup, CensusGroupProfile>;
  for (const g of GROUP_NAMES) {
    const s = centroid(blockIndices, g);
    profile[g] = {
      values: Array.from(s),
      typicality: cosine(s, mean[g]!),
    };
  }

  // ── balance: how far from the corpus mean, and where ─────────────────────
  const typicalities = GROUP_NAMES.map((g) => profile[g]!.typicality);
  const meanTypicality = typicalities.reduce((a, b) => a + b, 0) / typicalities.length;
  const distance = 1 - meanTypicality;
  // "Deviant" is relative to this chant's OWN mean, not an absolute threshold:
  // the question is where a chant is unlike itself elsewhere, which is what
  // makes it legible. Ties → alphabetical, so the answer is deterministic.
  const deviantGroups = GROUP_NAMES.filter((g) => profile[g]!.typicality < meanTypicality).sort(
    (a, b) =>
      profile[a]!.typicality - profile[b]!.typicality ||
      (a < b ? -1 : a > b ? 1 : 0),
  );

  // ── neighbors ────────────────────────────────────────────────────────────
  const neighbors: CensusNeighbour[] = [];
  if (k > 0) {
    const groupsToUse = by === "all" ? GROUP_NAMES : [by as CensusGroup];
    const selfSlices = groupsToUse.map((g) => centroid(blockIndices, g));
    const scored: CensusNeighbour[] = [];
    for (let i = 0; i < CENSUS_ORDER.length; i++) {
      // A subject is never its own neighbour, and no member of a set is one
      // of the set's: what a group is near means what is near it from outside.
      if (members.has(i)) continue;
      const otherId = CENSUS_ORDER[i]!;
      if (cutoff != null && !chantAdmissible(otherId, cutoff)) continue;
      let sum = 0;
      for (let gi = 0; gi < groupsToUse.length; gi++) {
        sum += cosine(selfSlices[gi]!, slice(i, groupsToUse[gi]!));
      }
      scored.push({ id: otherId, similarity: sum / groupsToUse.length });
    }
    // Ties → lower id, so the same question always has the same answer.
    scored.sort((a, b) => b.similarity - a.similarity || (a.id < b.id ? -1 : 1));
    neighbors.push(...scored.slice(0, k));
  }

  return { id, ids, profile, balance: { distance, deviantGroups }, neighbors, by };
}
