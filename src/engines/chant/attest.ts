// ---------------------------------------------------------------------------
// engines/chant/attest — the era view's one admissibility rule
//
// A LEAF module, importing data only: every chant verb (cantus, proprium,
// ordinarium, officium, matutinum) draws its attestation filtering from here,
// so no verb needs to import another verb's module to share the rule — the
// chant ↔ ordinary import cycle this replaces died of exactly that (a TDZ
// ReferenceError whenever ordinary.js loaded first).
// ---------------------------------------------------------------------------
import { ATTESTATION } from "../../data/attestation.js";

/**
 * A year → the latest century wholly attested by it, on the same scale as
 * `Attestation.century` (10 = the 900s).
 *
 * CANTUS dates a manuscript only to its century, so `before: 1098` cannot mean
 * "witnessed before 1098" — a book dated "11th century" may have been written
 * in 1099. Admitting the whole 11th century would let a caller asking for 1098
 * receive chants first written down after it, which is the one thing this
 * filter exists to prevent. So a year admits only centuries that CLOSED before
 * it: 1098 → 10 (through the 900s), 1100 → 11. Callers who do want the
 * containing century can say so precisely with `century`.
 */
export function centuryOf(year: number): number {
  // floor, not ceil−1: the two agree everywhere except exact century
  // multiples, where ceil−1 wrongly excluded the century that had just CLOSED
  // (1100 → 10, so `before: 1100` refused the 1000s) — and the round inputs
  // callers actually reach for are precisely the multiples that were wrong.
  return Math.floor(year / 100);
}

/**
 * The attestation cutoff a query asks for, as a century number — or null when
 * the query carries no era view. `century: N` and `before: N * 100` are the
 * SAME cutoff; one code path here, two spellings at the door.
 * 【NOTED ⟨Jeffrey⟩ — before/century should converge into one argument
 * eventually; keeping a single internal cutoff makes that a deletion.】
 */
export function attestationCutoff(
  query: { before?: number; century?: number },
  method: string,
): number | null {
  if (query.century == null && query.before == null) return null;
  const cutoff = query.century ?? centuryOf(query.before!);
  if (!Number.isFinite(cutoff)) {
    throw new Error(
      `${method}: century must be a century number (10 = the 900s), before a year — ` +
        `e.g. ${method}({ before: 1098 })`,
    );
  }
  return cutoff;
}

/**
 * The cutoff a DAY verb serves under: the query's own view wins; otherwise the
 * view `festum({ before })` stamped on the Feast rides along, so one argument
 * at the calendar door carries through the whole day. Feasts resolved together
 * came from one festum call and share one view — the first stamp speaks for
 * the set.
 */
export function eraCutoff(
  query: { before?: number; century?: number },
  feasts: readonly { before?: number }[] | null | undefined,
  method: string,
): number | null {
  const own = attestationCutoff(query, method);
  if (own != null) return own;
  const stamped = feasts?.find((f) => f?.before != null);
  return stamped ? centuryOf(stamped.before!) : null;
}

/**
 * ONE admissibility rule for every door — the book (`cantus`) and the day
 * verbs (`proprium`, `ordinarium`, `officium`, `matutinum`) alike. Evidence,
 * not existence: an undated chant is excluded under any cutoff rather than
 * assumed old, and `both` satisfies either cursus.
 */
export function chantAdmissible(
  id: string,
  cutoff: number | null,
  cursus?: "monastic" | "secular",
): boolean {
  if (cutoff == null && !cursus) return true;
  const a = ATTESTATION[id];
  if (cutoff != null && (a == null || a.century > cutoff)) return false;
  if (cursus && !(a?.cursus === cursus || a?.cursus === "both")) return false;
  return true;
}
