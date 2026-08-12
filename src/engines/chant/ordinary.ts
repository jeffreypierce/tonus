// ---------------------------------------------------------------------------
// engines/chant/ordinary — Mass ordinary (kyriale) selection
// ---------------------------------------------------------------------------
import {
  MASSES,
  AD_LIB,
  WHOLE_MASS_RUBRICS,
  partWithinEra,
  type MassEntry,
  type MassRubric,
} from "./data/masses.js";
import { KYRIALE, type KyrialeEntry } from "../../data/kyriale.js";
import { attestationCutoff, eraCutoff, chantAdmissible } from "./attest.js";
import { CANTUS_QUERY_KEYS } from "./types.js";
import {
  KY_SOURCE,
  MODI,
  ORDINARIA,
  type OrdinaryChant,
  type OrdinariumQuery,
  type OrdinaryCode,
} from "./types.js";
import { type Feast } from "../cal/types.js";

const ORDINARY_OFFICES = new Set(Object.keys(ORDINARIA));
const MODE_PAIRS: [number, number][] = [[1, 2], [3, 4], [5, 6], [7, 8]];
const CREDO_PRIORITY = ["IV", "III", "I", "II", "V", "VI"] as const;

function pairedMode(mode: number): number | null {
  const pair = MODE_PAIRS.find((p) => p.includes(mode));
  return pair ? (pair.find((m) => m !== mode) ?? null) : null;
}

function resolveMasses(feast: Feast): MassEntry[] {
  const resolved = feast.masses
    .map((num) => MASSES.get(num) ?? null)
    .filter((m): m is MassEntry => m !== null);
  if (resolved.length) return resolved;
  return [feast.marian ? AD_LIB.bvm : AD_LIB.standard];
}

// The numbered kyriale runs 1–18. The book's appendix — ad libitum settings and
// the like — carries synthetic numbers above that range, which no feast's
// `masses` list ever names; those settings are therefore reachable only as a
// last-resort fallback here, or by direct `ordinarium({ mass })` query.
const NUMBERED_MASS_MAX = 18;

function isAdLibitum(entry: KyrialeEntry): boolean {
  // Most appendix settings sit above the numbered range, but two ad libitum
  // Kyries are numbered 6 and 10 in the source data, colliding with the
  // numbered masses — for those the incipit is the only discriminator.
  return (entry.mass ?? 0) > NUMBERED_MASS_MAX || /\(ad lib\./i.test(entry.incipit);
}

/** Prefer a proper numbered setting over an appendix one at equal standing. */
function adLibLast(a: KyrialeEntry, b: KyrialeEntry): number {
  return Number(isAdLibitum(a)) - Number(isAdLibitum(b));
}

// The Missa pro defunctis settings belong to the Requiem, not to the temporal or
// sanctoral day. They stay out of every calendar-driven pick and remain
// reachable only by direct `ordinarium({ mass })` query. Note the Requiem's own
// dismissal carries the bare incipit "Requiescant" — no "(in Miss. def.)"
// qualifier — so it must be named here explicitly, or it leaks through the
// last-resort appendix onto every feria whose mass prints no dismissal.
function isRequiem(entry: KyrialeEntry): boolean {
  return /in\s+Miss\.\s*def|defunct|requiescant/i.test(entry.incipit);
}

/**
 * Deterministic rotation of a preference list by year.
 *
 * `feast.masses` lists every mass COMPATIBLE with the day, ranked — not one
 * right answer and a set of wrong ones. A house that sings the same setting for
 * nineteen years is a house, not the tradition, so the year steps through the
 * compatible set. Keyed on the CIVIL (UTC) year of the feast's date — a pure
 * function of the feast: same feast, same answer, every time it is asked. That
 * means Christmastide's rotation identity flips at Jan 1 mid-liturgical-year;
 * accepted, because the alternative (keying on the liturgical year) trades a
 * cosmetic quirk for a computus dependency in every rotation.
 */
function rotate<T>(list: readonly T[], year: number): T[] {
  if (list.length <= 1) return [...list];
  const i = ((year % list.length) + list.length) % list.length;
  return [...list.slice(i), ...list.slice(0, i)];
}

function feastYear(feast: Feast): number {
  return feast.date instanceof Date ? feast.date.getUTCFullYear() : 0;
}

// "In order to add greater solemnity, one or more of the following 'Chants ad
// libitum' may be employed." [liber-usualis, Kyriale] — the appendix is a
// SOLEMNITY boost, so it belongs only to the festal rubrics. Note this is NOT
// `isHighFeast`: that measures PRECEDENCE, and by it a Lent Sunday
// (Semiduplex I classis) and Ash Wednesday (Feria privilegiata) both rank high —
// yet adding solemnity is precisely what those days do not do. Gate on the
// rubric instead, so the appendix never reaches a penitential or ferial day.
//
// "paschal" is deliberately NOT here: it is a TIME, not a rank — every
// Eastertide day carries it, ordinary Tuesdays included (their grade is
// semiduplex, so no grade test separates them from a feast either). And Easter
// itself sings Lux et Origo every year — a fixed point — which an appendix turn
// on the paschal rubric would break every second year. Mass I is complete in
// every slot, so paschal days never need the appendix at all.
const SOLEMN_RUBRICS: ReadonlySet<MassRubric> = new Set<MassRubric>([
  "class-i",
  "class-ii",
  "bvm",
]);

// The Gloria follows the day's RANK rubric, not its season: the ferial masses
// print none (XVI, XVIII) and the penitential-Sunday mass none (XVII) — while a
// I-class feast inside Advent or Lent (Immaculate Conception, Annunciation)
// keeps its Gloria. Season-keying had both wrong: green ferias degraded to an
// ad libitum Gloria, and class feasts in Lent lost theirs. When the Gloria is
// not sung, the dismissal is Benedicamus Domino — the existing be/it switch.
const GLORIALESS_RUBRICS: ReadonlySet<MassRubric> = new Set<MassRubric>([
  "sunday-penitential",
  "feria-penitential",
  "feria",
]);

// Within a festal rubric the appendix joins the year's rotation as one more
// member of the pool, taking its turn once every (appointed masses + 1) years.
function appendixLeadsThisYear(
  rubric: MassRubric | null,
  poolSize: number,
  year: number,
): boolean {
  if (rubric == null || !SOLEMN_RUBRICS.has(rubric) || poolSize < 1) return false;
  const n = poolSize + 1;
  return ((year % n) + n) % n === poolSize;
}

function appendixFor(office: string, pool: KyrialeEntry[]): KyrialeEntry[] {
  return pool.filter(
    (e) => e.office === office && isAdLibitum(e) && !isRequiem(e),
  ).sort((a, b) => (a.mass ?? 0) - (b.mass ?? 0) || (a.id < b.id ? -1 : 1));
}

/**
 * Candidate settings for one ordinary slot, most preferred first.
 *
 * `feast.masses` now holds exactly the masses the Kyriale appoints under the
 * day's own rubric — "For feasts of the II class", "For ferias throughout the
 * Year" — so every candidate here is one the book permits for this day. Where
 * that rubric names several, the book numbers them (II class 1–5) and the year
 * rotates through them; `massNumbers` arrives already rotated. Sibling settings
 * under one number (mass I prints two dismissals, Ite Ia and Ib) rotate with it.
 *
 * Slots resolve independently, which the book licenses outright: "chants from one
 * Mass may be used together with those from others" — so a day normally sings one
 * mass throughout and borrows only where the book leaves a hole. Masses XVII and
 * XVIII carry no dismissal at all, and the LU directs the borrow explicitly
 * ("Benedicamus Domino as in Mass II, p. 22, or ad libitum as below").
 *
 * `wholeMass` carries the rubric's one exception — "the Ferial Masses excepted".
 * Under a ferial rubric the sung movements may NOT be gathered from other masses;
 * only the dismissal may travel, as the book itself directs.
 *
 * The chain degrades: appointed masses → the dismissal borrow (Mass II first,
 * as the book directs) → unnumbered settings (Asperges, Vidi aquam) → the ad
 * libitum appendix, and the appendix only where the day's rubric admits it.
 */
function entriesForOffice(
  office: string,
  massNumbers: number[],
  year: number,
  appendixLeads: boolean,
  wholeMass = false,
  appendixAllowed = false,
  pool: KyrialeEntry[] = KYRIALE,
): KyrialeEntry[] {
  const rank = new Map(massNumbers.map((m, i) => [m, i]));
  const numbered = pool.filter(
    (e) =>
      e.office === office && e.mass != null && rank.has(e.mass) &&
      !isAdLibitum(e) && !isRequiem(e),
  );
  // Group by mass so the day's rubric orders the groups, and rotate within a
  // group so a mass with two printings is not permanently reduced to its first.
  const groups = [...new Set(numbered.map((e) => e.mass!))]
    .sort((a, b) => rank.get(a)! - rank.get(b)!);
  // Under a ferial rubric the sung ordinary is not gathered from several masses.
  // (The dismissal is exempt, but that travels through the explicit borrow
  // below, not by widening this pool.)
  const borrowable = wholeMass ? groups.slice(0, 1) : groups;
  const ranked = borrowable.flatMap((m) =>
    rotate(numbered.filter((e) => e.mass === m), year),
  );

  const appendix = appendixFor(office, pool);
  const appendixPick = appendix.length
    ? [appendix[((year % appendix.length) + appendix.length) % appendix.length]]
    : [];

  if (appendixLeads && appendixPick.length) return [...appendixPick, ...ranked];
  if (ranked.length) return ranked;

  // The SUNG borrow. A day is often appointed exactly one mass, so
  // when a slot has no candidate left the rubric's own licence is the only way
  // out: "chants from one Mass may be used together with those from others, the
  // Ferial Masses excepted." Before the era bound this branch was unreachable —
  // every appointed mass printed every sung part — but dropping Mass XI's
  // 14th-c Agnus left 115 Sundays a decade with an Agnus-shaped hole and only
  // Mass XI appointed. Numbered masses in book order; never the appendix, which
  // stays a solemnity boost reachable only on its own turn.
  if (!wholeMass) {
    const borrowed = pool.filter(
      (e) =>
        e.office === office && e.mass != null &&
        !isAdLibitum(e) && !isRequiem(e),
    ).sort((a, b) => a.mass! - b.mass! || (a.id < b.id ? -1 : 1));
    if (borrowed.length) return borrowed;
  }

  // The dismissal borrow. A mass with no dismissal of its own is sent elsewhere
  // by the book itself: Masses XVII and XVIII print none and direct
  // "Benedicamus Domino as in Mass II, p. 22, or ad libitum as below"; Mass XVI
  // prints none either. The primary direction wins: Mass II first, then the
  // numbered kyriale in order — never the appendix, so a feria's dismissal
  // cannot smuggle solemnity in through the back of the chain.
  if (office === "it" || office === "be") {
    const borrowed = pool.filter(
      (e) =>
        e.office === office && e.mass != null &&
        !isAdLibitum(e) && !isRequiem(e),
    ).sort(
      (a, b) =>
        (a.mass === 2 ? -1 : a.mass!) - (b.mass === 2 ? -1 : b.mass!) ||
        (a.id < b.id ? -1 : 1),
    );
    if (borrowed.length) return borrowed;
  }

  // The sprinkling rites carry no mass number. The plain Asperges / Vidi aquam
  // is the standing answer — its ad libitum variants must NOT rotate against it
  // as equals, or the appendix would be sung more often than the rite itself.
  // They arrive on the appendix turn like every other appendix setting.
  const unnumbered = pool.filter(
    (e) => e.office === office && e.mass == null && !isRequiem(e),
  );
  const plain = unnumbered.filter((e) => !isAdLibitum(e));
  if (plain.length) return rotate(plain, year);
  if (unnumbered.length) return unnumbered.sort(adLibLast);

  // Last resort: the appendix — but only where the appendix may go AT ALL.
  // Ungated, this line was the hole in the fence: mass XVI prints no Gloria and
  // no dismissal, so every green feria degraded to an ad libitum Gloria and to
  // "Requiescant in pace" as its Ite. An empty slot is the honest answer for a
  // day whose rubric the appendix may not touch.
  if (!appendixAllowed) return [];
  return appendixPick.length ? appendixPick : appendix;
}

// The entry list arrives already in the day's preference order — rotation
// first, the appendix in front when its turn has come. No rank re-sorting
// happens here: an earlier masses-1–9 preference on high feasts re-imposed
// PRECEDENCE over the rubric (the confusion the rubric rebuild removed from the
// gate), silently discarding the appendix's solemnity turn on the very class-i
// days it was built for and pinning high BVM feasts to mass IX forever.
function selectBestChant(
  entries: KyrialeEntry[],
  filterModes: string[] | null,
): KyrialeEntry | null {
  if (!entries.length) return null;

  let candidates = filterModes
    ? entries.filter((e) => e.mode != null && filterModes.includes(e.mode))
    : entries;

  // The paired-mode fallback serves a single asked mode; a list already
  // states its own alternatives.
  if (!candidates.length && filterModes?.length === 1) {
    const asked = Number(filterModes[0]);
    const paired = Number.isInteger(asked) ? pairedMode(asked) : null;
    if (paired) candidates = entries.filter((e) => e.mode === String(paired));
  }
  if (!candidates.length) candidates = entries;

  return candidates[0];
}

function allowedCredos(masses: MassEntry[]): string[] {
  const set = new Set<string>();
  for (const m of masses) for (const c of m.credos) set.add(c);
  return CREDO_PRIORITY.filter((c) => set.has(c));
}

// The preferred credo for the day, where the season or the feast's character
// argues for one. A BIAS, not a gate — see selectCredoCode.
function preferredCredoCode(feast: Feast, allowed: string[]): string | null {
  const { season, weekday, marian, apostolic } = feast;
  const isSunday = weekday === 0;

  if (isSunday && ["adv", "quadp", "quad", "nat"].includes(season) && allowed.includes("IV")) return "IV";
  if (isSunday && season === "pasc" && allowed.includes("III")) return "III";
  if (isSunday && ["epi", "pent"].includes(season) && allowed.includes("I")) return "I";
  if (apostolic && allowed.includes("III")) return "III";
  if (marian && allowed.includes("IV")) return "IV";
  return allowed[0] ?? null;
}

// The fitting credo leads in one year of every two; the other years step
// through all six in turn — a full circuit every twelve years — so every credo,
// V included, is heard. The fitting one is heard most.
const CREDO_BIAS_EVERY = 2;

/**
 * Which credo the day sings, or null when this mass says none.
 *
 * An empty `allowed` still means NO credo today — that is the mass's own rubric
 * and it is respected. But when a credo IS sung, the choice is drawn from all
 * six, not from `allowed`: the Kyriale prints Credo I–VI as a set any mass may
 * draw on, whereas the `credos` arrays in masses.ts only ever name I, III and
 * IV — which left II, V and VI unsingable on every day of the year, despite
 * CREDO_PRIORITY naming all six. The narrow `credos` data is a separate gap
 * still open; this reads it as a preference rather than the whole permission.
 */
function selectCredoCode(feast: Feast, allowed: string[], year: number): string | null {
  if (!allowed.length) return null;
  const preferred = preferredCredoCode(feast, allowed);
  if (preferred && year % CREDO_BIAS_EVERY === 0) return preferred;
  // The off-years advance their OWN cycle. Keyed on the raw year, the
  // rotation's parity was coupled to the bias (2 divides 6): odd years could
  // only ever land on indices 1, 3, 5 — III, II, VI — and Credo V was never
  // sung on any day of any year.
  return rotate(CREDO_PRIORITY, Math.floor(year / CREDO_BIAS_EVERY))[0];
}

// Exported for the corpus surface (chant.ts): the kyriale rides `cantus`
// under source "ky" as exactly these records — one shaping, one identity,
// whether a chant arrives through the book or through `ordinarium`.
export function entryToOrdinaryChant(entry: KyrialeEntry): OrdinaryChant {
  const ordinary = ORDINARY_OFFICES.has(entry.office as OrdinaryCode)
    ? (entry.office as OrdinaryCode)
    : ("ky" as OrdinaryCode);
  return {
    id: entry.id,
    incipit: entry.incipit,
    gabc: entry.gabc,
    office: "or",
    genus: "Ordinarium",
    mode: entry.mode ? String(entry.mode) : null,
    modus: entry.mode ? (MODI[String(entry.mode)] ?? null) : null,
    pages: [],
    source: KY_SOURCE,
    ordinary,
    ordinarium: ORDINARIA[ordinary] ?? entry.incipit,
    mass: entry.mass ?? 0,
  };
}

// Maundy Thursday (In Cena Domini) is a Triduum exception: it retains a full
// Mass with the Gloria (rung with bells, which then fall silent until the
// Easter Vigil) despite Lent's penitential omission and the Triduum's
// otherwise empty ordinary. The Credo and the Sunday sprinkle rite are not
// part of this evening Mass. See ../../../docs/api/chant.md.
const MAUNDY_THURSDAY_ID = "Quad6-4";
// The feast carries no numbered Kyriale mass of its own (masses: []); as a
// paschally-adjacent solemnity it draws on Mass I (Lux et origo) — the same
// mass the Easter Vigil borrows, so both Triduum Masses share a setting.
const MAUNDY_THURSDAY_MASS = 1;

function ordinaryForFeast(
  feast: Feast,
  pinMass?: number,
  filterModes?: string[] | null,
  admissible?: ((id: string) => boolean) | null,
): OrdinaryChant[] {
  const isMaundyThursday = feast.id === MAUNDY_THURSDAY_ID;

  // The Triduum has no Mass-ordinary cycle (Good Friday has no Mass; the
  // Vigil's ordinary belongs to Easter). Maundy Thursday is the exception —
  // it keeps its Mass. An explicitly pinned mass also overrides.
  if (feast.grade === "triduum" && pinMass == null && !isMaundyThursday) return [];

  const resolvedMass = pinMass ?? (isMaundyThursday ? MAUNDY_THURSDAY_MASS : undefined);
  const masses = resolvedMass != null
    ? (() => { const e = MASSES.get(resolvedMass); return e ? [e] : []; })()
    : resolveMasses(feast);
  const mode = filterModes ?? null;

  // The day's OWN rank rubric, from the unpinned resolution — the Gloria and
  // the appendix licence are the day's law, not the pinned mass's.
  const dayRubric = resolveMasses(feast)[0]?.rubric ?? null;
  const appendixAllowed = dayRubric != null && SOLEMN_RUBRICS.has(dayRubric);

  // The Kyriale era rule RE-PICKS rather than silences: unlike a proper, the
  // ordinary offers ranked alternatives by design, so the whole selection —
  // rotation, siblings, borrow, appendix — runs over the admissible pool and
  // the day still sings a permitted setting. Filtering PER PART is what makes
  // that work: Mass XI keeps its 10th-c Kyrie/Gloria/Sanctus and only its
  // 14th-c Agnus borrows. Mass VIII (de Angelis) loses its Kyrie, Gloria and
  // Agnus — the famous late ones — while its Sanctus stays, because the editors
  // print that one "(XI) XII. s." NO mass leaves the pool whole: 7 of 66 parts
  // go, and every day still sings.
  // See partWithinEra() in ./data/masses.ts for the 1324 reasoning.
  const pool = KYRIALE.filter(
    (e) => partWithinEra(e.mass, e.office) && (!admissible || admissible(e.id)),
  );

  // The year steps through the masses the day's rubric appoints. A pinned mass
  // is an explicit request and overrides that — `ordinarium({ mass })` means
  // that mass, this year and every year.
  const year = feastYear(feast);
  const pinned = resolvedMass != null;
  const massNumbers = pinned
    ? masses.map((m) => m.mass)
    : rotate(masses.map((m) => m.mass), year);

  // Every mass the day permits shares one rubric (they were selected by it), so
  // the first one carries the day's category. "The Ferial Masses excepted" —
  // under those two rubrics the sung ordinary is not assembled from several.
  const rubric = masses[0]?.rubric ?? null;
  const wholeMass = !pinned && rubric != null && WHOLE_MASS_RUBRICS.has(rubric);
  const appendixLeads = !pinned &&
    appendixLeadsThisYear(rubric, massNumbers.length, year);

  const pick = (office: string): OrdinaryChant | null => {
    const entries = entriesForOffice(
      office,
      massNumbers,
      year,
      appendixLeads,
      wholeMass,
      appendixAllowed,
      pool,
    );
    const best = selectBestChant(entries, mode);
    return best ? entryToOrdinaryChant(best) : null;
  };

  const results: OrdinaryChant[] = [];

  const ky = pick("ky");
  if (ky) results.push(ky);

  // Gloria is omitted under the gloria-less rubrics — penitential Sundays and
  // every feria — not by season (see GLORIALESS_RUBRICS: a I-class feast inside
  // Advent keeps its Gloria; a green feria has none). Maundy Thursday keeps it
  // regardless — its Gloria is a deliberate breach of Lenten austerity, sung
  // with the bells before they fall silent.
  const glOmitted =
    dayRubric != null && GLORIALESS_RUBRICS.has(dayRubric) && !isMaundyThursday;
  if (!glOmitted) {
    const gl = pick("gl");
    if (gl) results.push(gl);
  }

  // Credo — In Cena Domini's Mass has no Creed.
  if (!isMaundyThursday) {
    const allowed = allowedCredos(masses);
    const credoCode = selectCredoCode(feast, allowed, year);
    if (credoCode) {
      const credoEntries = pool.filter((e) => e.office === "cr");
      // Exact numeral match, never substring: `.includes("V")` found
      // "Credo IV" first, so a day asking for Credo V was served IV under a
      // V label — the honest-label fix exposed it, and the cycle test caught
      // the numeral that had silently never sounded.
      const credoNumeral = (incipit: string) => /Credo\s+([IVX]+)/.exec(incipit)?.[1] ?? null;
      const named = credoEntries.find((e) => credoNumeral(e.incipit) === credoCode);
      const best = named ?? selectBestChant(credoEntries, mode);
      if (best) {
        const cr = entryToOrdinaryChant(best);
        // `ordinarium` is the PART — "Credo", as ORDINARIA spells it, beside
        // "Gloria" and "Sanctus". Which credo of the six sings is the chant's
        // own identity and is already in its incipit ("Credo II"), which is
        // where the honest-label rule below reads it: when the asked-for
        // credo is not in the pool (an era view excluded it, or the mode
        // filter did), the pool's best sings instead, under its own name.
        // Numbering the part here made Credo the one ordinary whose category
        // was not a category.
        results.push(cr);
      }
    }
  }

  const sa = pick("sa");
  if (sa) results.push(sa);
  const ag = pick("ag");
  if (ag) results.push(ag);

  if (glOmitted) {
    const be = pick("be");
    if (be) results.push(be);
  } else {
    const it = pick("it");
    if (it) results.push(it);
  }

  // Sprinkle rite: Vidi aquam in Paschaltide (through the Pentecost octave),
  // Asperges otherwise. It precedes the principal Sunday Mass only — not the
  // evening Mass of In Cena Domini.
  if (!isMaundyThursday) {
    const sprinkleType = feast.season === "pasc" ? "va" : "as";
    const sprinkleEntries = entriesForOffice(
      sprinkleType,
      massNumbers,
      year,
      false,
      false,
      appendixAllowed,
      pool,
    );
    const sprinkleBest = selectBestChant(sprinkleEntries, mode);
    if (sprinkleBest) results.push(entryToOrdinaryChant(sprinkleBest));
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


const ORDINARIUM_QUERY_KEYS = new Set([...CANTUS_QUERY_KEYS, "feast", "ordinary", "mass"]);

/**
 * Mass ordinary retrieval (`tonus.ordinarium`) from the Kyriale. A feast
 * drives mass selection; `mass` pins a kyriale number directly.
 */
export function getOrdinary(query?: OrdinariumQuery): OrdinaryChant[] {
  if (!query || Object.keys(query).length === 0) return [];

  // The same door policy as cantus and officium: an unknown key throws, so a
  // stale or misspelled option is learned immediately, not silently ignored.
  const unknown = Object.keys(query).filter((k) => !ORDINARIUM_QUERY_KEYS.has(k));
  if (unknown.length) {
    throw new Error(
      `ordinarium: unknown query key(s) ${unknown.map((k) => `"${k}"`).join(", ")} ` +
      `(expected ${[...ORDINARIUM_QUERY_KEYS].join(", ")}).`,
    );
  }

  const feasts = toArray(query.feast);
  assertFeasts(feasts, "ordinarium");
  // `mode` accepts a scalar or an array, with cantus's semantics: match any.
  const filterModes = query.mode == null
    ? null
    : (Array.isArray(query.mode) ? query.mode : [query.mode]).map(String);

  let results: OrdinaryChant[];

  if (feasts) {
    // The era view: an own `before` wins; otherwise the view festum({ before })
    // stamped on the feast rides along. The admissibility rule composes with
    // the standing Kyriale era doctrine (partWithinEra, bound at 1324):
    // doctrine bounds what the BOOK may reach for, attestation narrows to what
    // a viewed year can EVIDENCE — and the re-pick machinery serves both.
    results = feasts.flatMap((f) => {
      const cutoff = eraCutoff(query, [f], "ordinarium");
      const adm = cutoff != null || query.cursus
        ? (id: string) => chantAdmissible(id, cutoff, query.cursus)
        : null;
      return ordinaryForFeast(f, query.mass, filterModes, adm);
    });
  } else if (query.mass != null || query.ordinary) {
    // Direct kyriale query without feast context — same admissibility rule as
    // cantus, so the two doors cannot disagree.
    let entries = KYRIALE.slice();
    const cutoff = attestationCutoff(query, "ordinarium");
    if (cutoff != null || query.cursus) {
      entries = entries.filter((e) => chantAdmissible(e.id, cutoff, query.cursus));
    }
    if (query.mass != null) entries = entries.filter((e) => e.mass === query.mass);
    if (query.ordinary) entries = entries.filter((e) => e.office === query.ordinary);
    if (filterModes) entries = entries.filter((e) => e.mode != null && filterModes.includes(e.mode));

    const offset = Math.max(0, query.offset ?? 0);
    const limit = query.limit == null ? entries.length : Math.max(0, query.limit);
    results = entries.slice(offset, offset + limit).map(entryToOrdinaryChant);
  } else {
    return [];
  }

  // Apply remaining CantusQuery filters
  if (query.incipit) {
    const needle = query.incipit.toLowerCase();
    results = results.filter((c) => c.incipit.toLowerCase().includes(needle));
  }

  if (query.id) {
    const ids = new Set(toArray(query.id));
    results = results.filter((c) => ids.has(c.id));
  }

  if (query.source) {
    const sources = new Set<string>(toArray(query.source)!);
    results = results.filter((c) => c.source.code != null && sources.has(c.source.code));
  }

  return results;
}
