// ---------------------------------------------------------------------------
// engines/chant/matutinum — structured Roman Matins (nocturns)
// ---------------------------------------------------------------------------
// The flat `officium({ hora: "matutinum" })` returns Matins chants as an
// undifferentiated Chant[] (the best-effort flat view, unchanged). This module
// adds the STRUCTURED night office for the Roman rite: the 3-nocturn assembly
// from the Nocturnale Romanum [biblio: nocturnale-romanum], joined to the tonus
// calendar by feast id.
//
// It is additive and separate — a distinct accessor (`tonus.matutinum`), not a
// reshape of getHour — so the flat path and every other rite stay as they are.
// Coverage is what the Nocturnale + the calendar bridge give: the sanctorale and
// Advent today (see office-matins-roman.ts). A feast with no Nocturnale match
// returns null, the office's graceful-degradation convention.
import { resolveChant } from "./chant.js";
import { getHour } from "./hour.js";
import { getFeast } from "../cal/calendar.js";
import { temporaSundayId } from "../cal/date.js";
import { MATINS_ROMAN, type MatinsDay } from "../../data/office-matins-roman.js";
import type { Chant, OfficiumQuery, Rite } from "./types.js";
import type { Feast } from "../cal/types.js";

/** One nocturn of a resolved Matins: its responsories (and any antiphons). */
export interface Nocturn {
  /** 1–3. */
  n: number;
  /** The nocturn's great responsories, in order, as resolved chants. */
  responsories: Chant[];
  /** The nocturn's antiphons, where the Nocturnale carries them (else empty). */
  antiphons: Chant[];
}

/** A feast's Matins. */
export interface Matins {
  /** The tonus feast id this Matins was resolved for. */
  feastId: string;
  /** The feast's Latin name from the Nocturnale. */
  nomen: string;
  /** The Latin rank/class from the Nocturnale, e.g. "I. classis", "Feria". */
  ritus: string;
  /**
   * Whether `nocturns` carries the real rubrical division. `true` for the Roman
   * rite, whose Nocturnale assembly is nocturn-by-nocturn. `false` for the
   * monastic rite, where the source table (office-monastic) is flat and every
   * chant lands in a single nocturn `n: 1` — the Benedictine 12-psalm grouping
   * is not modelled, so a caller must NOT read monastic nocturns as rubric.
   */
  structured: boolean;
  /** The invitatory, which opens Matins before the first nocturn (else null). */
  invitatorium: Chant | null;
  /** The Matins hymn, which follows the invitatory before the nocturns (else null). */
  hymnus: Chant | null;
  /** One nocturn (simple) or three (festal). */
  nocturns: Nocturn[];
  /** The feast whose chants were borrowed by rubric, if any (provenance). */
  redirectedFrom: string | null;
}

let _byFeast: Map<string, MatinsDay> | null = null;
function byFeast(): Map<string, MatinsDay> {
  if (!_byFeast) {
    _byFeast = new Map();
    for (const d of MATINS_ROMAN) if (d.tonusFeastId) _byFeast.set(d.tonusFeastId, d);
  }
  return _byFeast;
}

function resolveDay(day: MatinsDay): Matins {
  // The invitatory and hymn precede the first nocturn rubrically — they are not
  // responsories. Lift them out; a nocturn holds only responsories and antiphons.
  let invitatorium: Chant | null = null;
  let hymnus: Chant | null = null;

  const nocturns: Nocturn[] = day.nocturns.map((noc) => {
    const responsories: Chant[] = [];
    const antiphons: Chant[] = [];
    for (const c of noc.chants) {
      const chant = resolveChant(c.id);
      if (!chant) continue;
      // Type "I" (invitatory) and any hymn (office "hy") open Matins, not a nocturn.
      if (c.type === "I" || chant.office === "hy") {
        if (c.type === "I") invitatorium ??= chant;
        else hymnus ??= chant;
      } else if (c.type === "A") {
        antiphons.push(chant);
      } else {
        responsories.push(chant);
      }
    }
    return { n: noc.n, responsories, antiphons };
  });

  return {
    feastId: day.tonusFeastId!,
    nomen: day.name,
    ritus: day.rank,
    structured: true,
    invitatorium,
    hymnus,
    nocturns,
    redirectedFrom: day.redirectedFrom,
  };
}

/**
 * Monastic Matins, FLAT. The monastic table (office-monastic) carries the night
 * office as undifferentiated fields — `invit`, `antMatutinum`, `hymnMatutinum`,
 * `respMatutinum` — with no nocturn boundaries, so there is nothing to assemble
 * three nocturns from. Rather than invent a division the source does not record,
 * everything lands in a single nocturn (`n: 1`) and `structured` is false.
 *
 * The Benedictine night office is genuinely a different shape from the Roman
 * (12 psalms across the nocturns, not 9), so the Roman assembly is not merely
 * unavailable here — it would be the wrong structure. Modelling it properly is
 * deferred; this returns the right CHANTS in an honest container.
 */
function monasticMatins(feast: Feast): Matins | null {
  const chants = getHour({ feast: [feast], hora: "matutinum", rite: "monasticum" });
  if (!chants.length) return null;

  // Lift the openers out, exactly as the Roman path does: the invitatory and
  // hymn precede the first nocturn rubrically and are not responsories.
  let invitatorium: Chant | null = null;
  let hymnus: Chant | null = null;
  const responsories: Chant[] = [];
  const antiphons: Chant[] = [];
  for (const c of chants) {
    if (c.office === "in") invitatorium ??= c;
    else if (c.office === "hy") hymnus ??= c;
    else if (c.office === "re" || c.office === "rb") responsories.push(c);
    else antiphons.push(c);
  }

  return {
    feastId: feast.id,
    nomen: feast.nomen,
    ritus: feast.ritus,
    structured: false,
    invitatorium,
    hymnus,
    nocturns: [{ n: 1, responsories, antiphons }],
    redirectedFrom: null,
  };
}

/** The Nocturnale Matins for a feast id, or null when the calendar has no match. */
function matinsForFeastId(feastId: string): Matins | null {
  const map = byFeast();
  const day = map.get(feastId) ?? (() => {
    // Temporal feasts resolve their Sunday where a weekday has no proper.
    const sunday = temporaSundayId(feastId);
    return sunday ? map.get(sunday) : undefined;
  })();
  return day ? resolveDay(day) : null;
}

/**
 * Structured Roman Matins (`tonus.matutinum`) for a feast: the invitatory and
 * hymn that open the hour, then the nocturns with their responsories (and
 * antiphons where present), assembled from the Nocturnale Romanum. Without a
 * feast, resolves the default epoch's feast (as `officium` does).
 *
 * Both rites are served, in different shapes — read `structured` before trusting
 * `nocturns`. Roman Matins is assembled nocturn-by-nocturn from the Nocturnale
 * (`structured: true`). Monastic Matins comes from the flat office-monastic
 * table, so it returns the right chants in ONE nocturn (`structured: false`);
 * the Benedictine 12-psalm division is not modelled.
 *
 * The query's `feast` and `rite` are read; `hora` is ignored (Matins *is* the
 * hour) as are the other `CantusQuery` filters.
 * @returns the Matins, or null when the rite's table has no match for the feast.
 */
export function getMatins(query?: OfficiumQuery): Matins | null {
  const rite: Rite = query?.rite ?? "romanum";

  const feasts = query?.feast
    ? Array.isArray(query.feast) ? query.feast : [query.feast]
    : null;
  const feast: Feast | undefined = feasts ? feasts[0] : getFeast()[0];
  if (!feast) return null;
  if (typeof feast !== "object" || typeof feast.id !== "string")
    throw new Error(
      "matutinum: feast must be a Feast (from tonus.festum) — got " + typeof feast,
    );

  return rite === "monasticum" ? monasticMatins(feast) : matinsForFeastId(feast.id);
}
