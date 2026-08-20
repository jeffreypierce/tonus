// ---------------------------------------------------------------------------
// engines/chant/attest — the era view's one admissibility rule
//
// A LEAF module, importing data only: every chant verb (cantus, proprium,
// ordinarium, officium) draws its attestation filtering from here, so no verb
// needs to import another verb's module to share the rule — the chant ↔
// ordinary import cycle this replaces died of exactly that (a TDZ
// ReferenceError whenever ordinary.js loaded first).
//
// ── A FILTER THAT LEFT AND CAME BACK ───────────────────────────────────────
// This filter was once retired because its data had a genre-shaped hole: a
// third of the corpus undated, and RESPONSORIES almost all of it, so
// `before: 1098` deleted the Hartker repertory from Epiphany Matins — wrong
// about the liturgy on the exact question the library exists to answer. The
// rule was never the problem; the coverage was. The corpus side closed it
// (crosswalk gap-fill + matcher v2: composite respond+verse, the incipit-entry
// rule, containment, genre disambiguation — all gold-gated): the great majority
// of shipped records now carry a dated witness, responsories included. What remains
// undated is deliberate (psalter, formulas) or editorial territory (hymns,
// modern propers) — not a genre bias. So the evidence law stands: an undated
// chant is EXCLUDED under any cutoff. Silence is not evidence.
//
// A `century` option is deliberately absent. It was always `before: N * 100`
// in different clothes — one cutoff internally, two spellings at the door —
// so the two spellings converged on the one that is a year.
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
 * it: 1098 → 10 (through the 900s), 1100 → 11.
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
 * the query carries no era view.
 */
export function attestationCutoff(
  query: { before?: number },
  method: string,
): number | null {
  if (query.before == null) return null;
  const cutoff = centuryOf(query.before);
  if (!Number.isFinite(cutoff)) {
    throw new Error(
      `${method}: before must be a year — the cutoff is the latest century number ` +
        `(10 = the 900s) wholly closed by it; e.g. ${method}({ before: 1098 })`,
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
  query: { before?: number },
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
 * verbs (`proprium`, `ordinarium`, `officium`) alike. Evidence, not
 * existence: an undated chant is excluded under any cutoff rather than
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
