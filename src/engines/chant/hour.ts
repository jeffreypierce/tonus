// ---------------------------------------------------------------------------
// engines/chant/hour — Divine Office hour retrieval
// ---------------------------------------------------------------------------
import { resolveChant, resolveChants } from "./chant.js";
import { eraCutoff, chantAdmissible } from "./attest.js";
import { intonePortion, officePsalmPortions } from "./psalm.js";
import { temporaSundayId } from "../cal/date.js";
import { getFeast } from "../cal/calendar.js";
import type { Chant, OfficiumQuery, CanonicalHour, Rite } from "./types.js";
import type { Feast } from "../cal/types.js";
import { OFFICE_ROMAN, type OfficeDay } from "../../data/office-roman.js";
import { OFFICE_MONASTIC } from "../../data/office-monastic.js";
import { OFFICE_FERIAL } from "../../data/office-ferial.js";
import { COMMUNE_OFFICE } from "../../data/commune-office.js";
import { SEASONAL_RESPBREVE } from "../../data/seasonal-respbreve.js";
import { FEAST_COMMUNE } from "../../data/commune.js";
import {
  COMPLINE_ORDINARY,
  COMPLINE_SEASONAL,
  marianAntiphonFor,
} from "./data/compline.js";
import { PRIME_ORDINARY, PRIME_SEASONAL } from "./data/prime.js";

let _roman: Map<string, OfficeDay> | null = null;
let _monastic: Map<string, OfficeDay> | null = null;
function officeMap(rite: Rite): Map<string, OfficeDay> {
  if (rite === "monasticum") {
    if (!_monastic) _monastic = new Map(OFFICE_MONASTIC.map((d) => [d.feastId, d]));
    return _monastic;
  }
  if (!_roman) _roman = new Map(OFFICE_ROMAN.map((d) => [d.feastId, d]));
  return _roman;
}

// Hours whose result is an ordered sequence (an ordo) rather than a set of
// chants — they keep assembly order instead of being sorted by incipit.
const ORDERED_ORDO_HOURS: ReadonlySet<CanonicalHour> = new Set([
  "prima", "tertia", "sexta", "nona", "completorium",
]);

// The purely seasonal/fixed hours — identical for every feast of a day, so
// concurrent feasts collapse to one and a no-feast query resolves the default
// epoch. (Terce/Sext/None are NOT here: their responsory breve is per-feast.)
const SEASONAL_ORDO_HOURS: ReadonlySet<CanonicalHour> = new Set([
  "prima", "completorium",
]);

// Compline is fixed and seasonal, not per-feast: it does not use the OfficeDay
// tables at all. The ordo is assembled from the season (Te lucis, In manus
// tuas), the fixed psalms (from the extracted DO scheme), the invariable spine
// (Deus in adjutorium, Nunc dimittis), and the date-driven Marian antiphon.
// See ./data/compline.ts.
function complineForFeast(feast: Feast, rite: Rite): Chant[] {
  const seasonal = COMPLINE_SEASONAL[feast.season];
  const results: Chant[] = [];

  const opening = resolveChant(COMPLINE_ORDINARY.opening);
  if (opening) results.push(opening);

  // Monastic Compline uses a fixed three-psalm set (4, 90, 133); the Roman rite
  // adds Ps 30 vv. 2–6. The difference is entirely in the psalm scheme — the
  // rest of the ordo (spine, hymn, In manus tuas, Marian antiphon) is shared.
  for (const p of officePsalmPortions("Completorium", feast.weekday, rite)) {
    results.push(...intonePortion(p));
  }

  const hymn = seasonal && resolveChant(seasonal.teLucis);
  if (hymn) results.push(hymn);

  const responsory = seasonal && resolveChant(seasonal.inManusTuas);
  if (responsory) results.push(responsory);

  const canticle = resolveChant(COMPLINE_ORDINARY.canticle);
  if (canticle) results.push(canticle);

  const marian = resolveChant(marianAntiphonFor(feast.season, feast.date));
  if (marian) results.push(marian);

  return results;
}

// Prime, like Compline, is a fixed+seasonal ordo, not per-feast. Covers the
// sung parts only (see ./data/prime.ts): opening, fixed psalms, the hymn Iam
// lucis, and the seasonal short responsory Christe Fili Dei.
function primeForFeast(feast: Feast, rite: Rite): Chant[] {
  const seasonal = PRIME_SEASONAL[feast.season];
  const results: Chant[] = [];

  const opening = resolveChant(PRIME_ORDINARY.opening);
  if (opening) results.push(opening);

  const hymn = resolveChant(PRIME_ORDINARY.hymn);
  if (hymn) results.push(hymn);

  // The monastic Prime psalmody is weekday-varied across the psalter (vs. the
  // Roman Ps-118 pattern) — a psalm-scheme difference; the ordo spine is shared.
  for (const p of officePsalmPortions("Prima", feast.weekday, rite)) {
    results.push(...intonePortion(p));
  }

  const responsory = seasonal && resolveChant(seasonal.responsory);
  if (responsory) results.push(responsory);

  return results;
}

/**
 * The antiphons for an hour: the day's own proper, else its COMMUNE, else the
 * FERIAL CYCLE.
 *
 * A monastic weekday in the temporale mostly has no proper antiphons — the
 * office-monastic table has the day but leaves antLaudes/antVespera/antMatutinum
 * empty (292 of its 409 entries), because those antiphons live in the psalter,
 * not in the propers. Without a fallback the hour silently returns a partial
 * ordo, which is why Lauds resolved on 106 of 360 days and essentially never in
 * the temporale.
 *
 * ── WHY THE COMMUNE COMES BEFORE THE FERIAL CYCLE ───────────────────────────
 * A saint's day is not a feria. When the rubrics give a saint no proper
 * antiphons they do not send the choir back to the weekday psalter — they send
 * it to the saint's CATEGORY: the Commune of one Martyr, of Virgins, of a
 * Confessor Bishop. The Mass has always resolved this way (propers.ts:
 * proper → seasonal → commune); the Office simply never had the table. So the
 * commune is tried first, and the ferial cycle covers what remains — days with
 * no saint at all, which is exactly what it was mined for.
 *
 * Monastic only (the ferial cycle we mined is the monastic psalter), and only
 * for a feast carrying a real weekday — the all-days survey path builds a
 * mockFeast with no weekday, where a weekday-keyed lookup would be meaningless.
 * The commune lookup has no such constraint: it is keyed by feast, not weekday.
 */
function antiphonsFor(
  proper: readonly (string | null)[] | null | undefined,
  hour: CanonicalHour,
  feast: Feast,
  rite: Rite,
): Chant[] {
  // Copy: the OfficeDay arrays are readonly and may hold nulls; resolveChant
  // drops the nulls, resolveChants wants a mutable string[].
  const own = resolveChants([...(proper ?? [])].filter((id): id is string => !!id));
  // All-or-nothing per hour: a feast with ANY proper antiphon for this hour
  // sings only those. Topping a short proper set up from the commune would mix
  // two feasts' chants inside one hour, which no rubric asks for.
  if (own.length) return own;

  const fromCommune = communeAntiphons(feast, hour);
  if (fromCommune.length) return fromCommune;

  if (rite !== "monasticum") return own;
  if (feast.weekday == null || !feast.date) return own;

  const byWeekday = OFFICE_FERIAL[hour];
  if (!byWeekday) return own;
  const slot = byWeekday[String(feast.weekday)] ?? byWeekday["any"];
  if (!slot) return own;
  // Variant preference: the season's own set, else the plain ferial cycle.
  const variant = ferialVariantFor(feast);
  const ids = slot[variant] ?? slot["ferial"];
  return ids ? resolveChants(ids) : own;
}

/**
 * The antiphons this feast's COMMUNE appoints for an hour, or empty.
 *
 * FEAST_COMMUNE (mined from DO's `[Rule]`/`[Rank]` headers) says which category
 * a feast belongs to; COMMUNE_OFFICE says what that category sings. Both rites
 * use it — a commune is a category of saint, not a cursus.
 */
function communeSlot(feast: Feast, hour: CanonicalHour, slot: string): Chant[] {
  const commune = communeByFeast().get(feast.id);
  if (!commune) return [];
  const ids = COMMUNE_OFFICE[commune]?.[hour]?.[slot];
  return ids?.length ? resolveChants(ids) : [];
}

const communeAntiphons = (feast: Feast, hour: CanonicalHour): Chant[] =>
  communeSlot(feast, hour, "antiphons");

/**
 * The little hours' short responsory as the SEASON appoints it — the last
 * fallback, after the day's own proper and its commune.
 *
 * This chant is seasonal, not proper: DO carries none at all in its monastic
 * dirs (0 of 278 SanctiM, 0 of 267 TemporaM) and keeps the real cycle in
 * Psalterium/Special keyed by tempus. Only a few dozen feasts important enough
 * to override have one of their own, which is why a feast-driven lookup filled
 * so few days — it was reading the exception and missing the rule.
 *
 * Outside the four proper seasons the responsory is the per-diem default, and
 * Sunday takes its own: `dominica` on a Sunday, `feria` on every other day.
 */
function seasonalRespBreve(feast: Feast, hour: CanonicalHour): Chant[] {
  const byHour =
    // DO's `Quad5` is PASSIONTIDE — the last fortnight of Lent — and tonus has
    // no season code for it (`quadp` is Septuagesima, a different thing that
    // falls BEFORE Lent). Rather than mis-map one to the other, Passiontide is
    // left to resolve as ordinary Lent until the calendar models it.
    SEASONAL_RESPBREVE[feast.season] ??
    SEASONAL_RESPBREVE[feast.weekday === 0 ? "dominica" : "feria"];
  const id = byHour?.[hour];
  const chant = id ? resolveChant(id) : null;
  return chant ? [chant] : [];
}

/**
 * A little hour's portion of Ps 118 (Terce vv. 33–80, Sext 81–128, None 129–176,
 * from the extracted DO scheme). The psalmody belongs to a specific day, so it
 * is only included for a real feast query — not the all-days survey scan, which
 * has no date and would repeat the psalms once per feast.
 */
function littleHourPsalmody(feast: Feast, hour: CanonicalHour, rite: Rite): Chant[] {
  if (!feast.date) return [];
  const hourName = hour === "tertia" ? "Tertia" : hour === "sexta" ? "Sexta" : "Nona";
  const out: Chant[] = [];
  for (const p of officePsalmPortions(hourName, feast.weekday, rite)) {
    out.push(...intonePortion(p));
  }
  return out;
}

let _communeByFeast: Map<string, string> | null = null;
function communeByFeast(): Map<string, string> {
  if (!_communeByFeast) {
    _communeByFeast = new Map(FEAST_COMMUNE.map((f) => [f.feastId, f.commune]));
  }
  return _communeByFeast;
}

/** Which ferial variant a day draws: the season's, else the plain cycle. */
function ferialVariantFor(feast: Feast): string {
  if (feast.season === "adv") return "advent";
  if (feast.season === "pasc") return "paschal";
  if (feast.season === "nat") return "nat";
  return "ferial";
}

function chantsForFeastHour(feast: Feast, hour: CanonicalHour, rite: Rite): Chant[] {
  if (hour === "completorium") return complineForFeast(feast, rite);
  if (hour === "prima") return primeForFeast(feast, rite);

  const map = officeMap(rite);
  const sunday = temporaSundayId(feast.id);
  const day = map.get(feast.id) ?? (sunday ? (map.get(sunday) ?? null) : null);
  if (!day) {
    // No proper row at all — most sanctoral days and many ferias have none.
    // That is not silence: a monastery still sings the ferial cycle. Return it
    // rather than an empty ordo (this is the other half of the antiphonsFor
    // fallback, which only fires when a row EXISTS but its arrays are empty).
    // The little hours have no antiphon of their own — their proper chant IS the
    // short responsory — so they take the commune's respBreve. The psalmody is
    // still theirs either way: returning ONLY the responsory would silence a day
    // the commune cannot fill, which is worse than what it replaced.
    if (hour === "tertia" || hour === "sexta" || hour === "nona") {
      const fromCommune = communeSlot(feast, hour, "respBreve");
      return [
        ...littleHourPsalmody(feast, hour, rite),
        ...(fromCommune.length ? fromCommune : seasonalRespBreve(feast, hour)),
      ];
    }
    // The commune fills EVERY slot type it ships, not just the antiphons: a
    // saint served by commune sings the commune's invitatory, hymn and
    // responsories too — the table mined them (512 texts across 24 communes)
    // and returning a truncated hour left them silent on the shelf. Slot
    // order mirrors the with-row assembly below.
    if (hour === "matutinum") {
      return [
        ...communeSlot(feast, hour, "invitatorium"),
        ...antiphonsFor(null, hour, feast, rite),
        ...communeSlot(feast, hour, "hymnus"),
        ...communeSlot(feast, hour, "responsories"),
      ];
    }
    if (hour === "laudes" || hour === "vesperae") {
      return [
        ...antiphonsFor(null, hour, feast, rite),
        ...communeSlot(feast, hour, "hymnus"),
      ];
    }
    return antiphonsFor(null, hour, feast, rite);
  }

  const results: Chant[] = [];

  if (hour === "matutinum") {
    // Each slot falls to the commune INDEPENDENTLY (own else commune, same
    // all-or-nothing-per-slot rule the antiphons and respBreve always had) —
    // a row with proper responsories but no invitatory borrows only the
    // invitatory.
    const inv = resolveChant(day.invit);
    if (inv) results.push(inv);
    else results.push(...communeSlot(feast, hour, "invitatorium"));
    results.push(...antiphonsFor(day.antMatutinum, hour, feast, rite));
    const hy = resolveChant(day.hymnMatutinum);
    if (hy) results.push(hy);
    else results.push(...communeSlot(feast, hour, "hymnus"));
    const ownResp = resolveChants([...day.respMatutinum].filter((id): id is string => !!id));
    if (ownResp.length) results.push(...ownResp);
    else results.push(...communeSlot(feast, hour, "responsories"));
  } else if (hour === "laudes") {
    results.push(...antiphonsFor(day.antLaudes, hour, feast, rite));
    const bc = resolveChant(day.antBenedictus);
    if (bc) results.push(bc);
    const hy = resolveChant(day.hymnLaudes);
    if (hy) results.push(hy);
    else results.push(...communeSlot(feast, hour, "hymnus"));
  } else if (hour === "tertia" || hour === "sexta" || hour === "nona") {
    // The little hours: their portion of Ps 118 (Terce vv. 33–80, Sext 81–128,
    // None 129–176, from the extracted DO scheme), then the responsory breve.
    // The psalmody belongs to a specific day, so it is only included for a real
    // feast query — not the all-days survey scan (which has no date and would
    // repeat the psalms once per feast).
    results.push(...littleHourPsalmody(feast, hour, rite));
    // The short responsory, with the same commune fallback the antiphons get.
    // office-monastic fills respBreve on only 84–96 of its 409 rows, which is
    // why Terce/Sext/None sang on 184–196 of 366 days: unlike the antiphons this
    // was a bare lookup with nothing behind it.
    const rb = resolveChant(
      hour === "tertia" ? day.respBreveTertia
        : hour === "sexta" ? day.respBreveSexta
          : day.respBreveNona,
    );
    if (rb) results.push(rb);
    else {
      const fromCommune = communeSlot(feast, hour, "respBreve");
      results.push(...(fromCommune.length ? fromCommune : seasonalRespBreve(feast, hour)));
    }
  } else if (hour === "vesperae") {
    results.push(...antiphonsFor(day.antVespera, hour, feast, rite));
    const mc = resolveChant(day.antMagnificat);
    if (mc) results.push(mc);
    const hy = resolveChant(day.hymnVespera);
    if (hy) results.push(hy);
    else results.push(...communeSlot(feast, hour, "hymnus"));
  }

  return results;
}

function toArray<T>(v: T | T[] | undefined): T[] | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v : [v];
}

/** The feast filter must carry Feast objects (from tonus.festum) — a raw
 * TypeError deep in resolution would otherwise mask the caller bug. */
function assertFeasts(feasts: Feast[] | undefined, method: string): void {
  if (!feasts) return;
  for (const f of feasts) {
    if (!f || typeof f !== "object" || typeof (f as Feast).id !== "string")
      throw new Error(`${method}: feast must be a Feast (from tonus.festum) — got ${typeof f}`);
  }
}


/**
 * Divine Office retrieval (`tonus.officium`) for a canonical hour
 * (matutinum … completorium). Without an hour, returns chants for all
 * available hours; a feast acts as a filter.
 */
export function getHour(query?: OfficiumQuery): Chant[] {
  if (!query || Object.keys(query).length === 0) return [];

  const feasts = toArray(query.feast);
  assertFeasts(feasts, "officium");
  const hour = query.hora;
  const rite = query.rite ?? "romanum";

  let results: Chant[];

  if (feasts && hour) {
    // Prime and Compline are seasonal/weekday ordos, identical for every feast
    // of the day — so concurrent feasts collapse to a single ordo rather than
    // repeating it. The other hours are genuinely per-feast.
    results = SEASONAL_ORDO_HOURS.has(hour)
      ? feasts[0] ? chantsForFeastHour(feasts[0], hour, rite) : []
      : feasts.flatMap((f) => chantsForFeastHour(f, hour, rite));
  } else if (feasts) {
    const hours: CanonicalHour[] = [
      "matutinum", "laudes", "prima", "tertia", "sexta", "nona",
      "vesperae", "completorium",
    ];
    results = feasts.flatMap((f) => hours.flatMap((h) => chantsForFeastHour(f, h, rite)));
  } else if (hour && SEASONAL_ORDO_HOURS.has(hour)) {
    // Prime and Compline are seasonal ordos, not per-feast. With no feast,
    // resolve for the default epoch (Guido d'Arezzo's era) — festum()'s anchor.
    const [feast] = getFeast();
    results = feast ? chantsForFeastHour(feast, hour, rite) : [];
  } else if (hour) {
    // Hour without feast — survey per-feast content across the office entries of
    // the chosen rite. mockFeast has no date, so the little hours return only
    // their responsories.
    const table = rite === "monasticum" ? OFFICE_MONASTIC : OFFICE_ROMAN;
    results = table.flatMap((day) => {
      const mockFeast = { id: day.feastId } as Feast;
      return chantsForFeastHour(mockFeast, hour, rite);
    });
  } else {
    return [];
  }

  // The era view: an own `before`/`century` wins; otherwise the view
  // festum({ before }) stamped on the feast rides along. Excluded chants
  // degrade to SILENCE here ⟨RULED⟩ — the office's proper → commune → ferial
  // chain triggers on ABSENCE from the tables, not on inadmissibility, so no
  // re-pick is attempted. (Extending the chain to re-pick under a view is a
  // recorded follow-up, not an accident.)
  {
    const cutoff = eraCutoff(query, feasts, "officium");
    if (cutoff != null || query.cursus) {
      results = results.filter((c) => chantAdmissible(c.id, cutoff, query.cursus));
    }
  }

  // Apply CantusQuery filters
  const offices = toArray(query.office);
  if (offices) {
    const set = new Set<string>(offices);
    results = results.filter((c) => set.has(c.office));
  }

  const modes = toArray(query.mode);
  if (modes) {
    const set = new Set(modes.map(String));
    results = results.filter((c) => c.mode != null && set.has(c.mode));
  }

  const sources = toArray(query.source);
  if (sources) {
    const set = new Set<string>(sources);
    results = results.filter((c) => c.source.code != null && set.has(c.source.code));
  }

  if (query.incipit) {
    const needle = query.incipit.toLowerCase();
    results = results.filter((c) => c.incipit.toLowerCase().includes(needle));
  }

  if (query.id) {
    const ids = new Set(toArray(query.id));
    results = results.filter((c) => ids.has(c.id));
  }

  // The little hours and Compline are ordered ordos — their sequence IS the
  // content — so they keep assembly order unless the caller explicitly asks for
  // a sort. The other hours return a set of chants, sorted by incipit.
  const isOrderedOrdo = query.hora != null && ORDERED_ORDO_HOURS.has(query.hora);
  if (query.sort || !isOrderedOrdo) {
    const sort = query.sort ?? "incipit";
    results.sort((a, b) => {
      if (sort === "id") return a.id.localeCompare(b.id);
      if (sort === "mode")
        return (
          String(a.mode ?? "").localeCompare(String(b.mode ?? "")) ||
          a.incipit.localeCompare(b.incipit)
        );
      return a.incipit.localeCompare(b.incipit);
    });
  }

  const offset = Math.max(0, query.offset ?? 0);
  const limit = query.limit == null ? results.length : Math.max(0, query.limit);
  return results.slice(offset, offset + limit);
}
