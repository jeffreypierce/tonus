// ---------------------------------------------------------------------------
// engines/chant/ordinary — Mass ordinary (kyriale) selection
// ---------------------------------------------------------------------------
import {
  MASSES,
  AD_LIB,
  WHOLE_MASS_RUBRICS,
  type MassEntry,
  type MassRubric,
} from "./data/masses.js";
import { KYRIALE, type KyrialeEntry } from "../../data/kyriale.js";
import {
  KY_SOURCE,
  MODE_LABELS,
  ORDINARY_LABELS,
  type OrdinaryChant,
  type OrdinariumQuery,
  type OrdinaryCode,
} from "./types.js";
import {
  type Feast,
  type Grade,
  gradeOrder,
  PENITENTIAL_SEASONS,
} from "../cal/types.js";

// A "high feast" (Duplex II classis or above) prefers the solemn kyriale
// masses 1–9. Threshold expressed against GRADE_ORDER, not a magic number.
function isHighFeast(grade: Grade): boolean {
  return gradeOrder(grade) <= gradeOrder("duplex-ii");
}

const ORDINARY_OFFICES = new Set(Object.keys(ORDINARY_LABELS));
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
// reachable only by direct `ordinarium({ mass })` query.
function isRequiem(entry: KyrialeEntry): boolean {
  return /in\s+Miss\.\s*def|defunct/i.test(entry.incipit);
}

/**
 * Deterministic rotation of a preference list by liturgical year.
 *
 * `feast.masses` lists every mass COMPATIBLE with the day, ranked — not one
 * right answer and a set of wrong ones. A house that sings the same setting for
 * nineteen years is a house, not the tradition, so the year steps through the
 * compatible set. Keyed on the feast's own year, so the result is a pure
 * function of the feast: same feast, same answer, every time it is asked.
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
// libitum' may be employed." [liber-usualis-1961, Kyriale] — the appendix is a
// SOLEMNITY boost, so it belongs only to the festal rubrics. Note this is NOT
// `isHighFeast`: that measures PRECEDENCE, and by it a Lent Sunday
// (Semiduplex I classis) and Ash Wednesday (Feria privilegiata) both rank high —
// yet adding solemnity is precisely what those days do not do. Gate on the
// rubric instead, so the appendix never reaches a penitential or ferial day.
const SOLEMN_RUBRICS: ReadonlySet<MassRubric> = new Set<MassRubric>([
  "class-i",
  "class-ii",
  "bvm",
  "paschal",
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

function appendixFor(office: string): KyrialeEntry[] {
  return KYRIALE.filter(
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
 * The chain degrades: appointed masses → unnumbered settings (Asperges, Vidi
 * aquam) → the ad libitum appendix.
 */
function entriesForOffice(
  office: string,
  massNumbers: number[],
  year: number,
  appendixLeads: boolean,
  wholeMass = false,
): KyrialeEntry[] {
  const rank = new Map(massNumbers.map((m, i) => [m, i]));
  const numbered = KYRIALE.filter(
    (e) =>
      e.office === office && e.mass != null && rank.has(e.mass) &&
      !isAdLibitum(e) && !isRequiem(e),
  );
  // Group by mass so the day's rubric orders the groups, and rotate within a
  // group so a mass with two printings is not permanently reduced to its first.
  const groups = [...new Set(numbered.map((e) => e.mass!))]
    .sort((a, b) => rank.get(a)! - rank.get(b)!);
  // Under a ferial rubric the sung ordinary is not gathered from several masses.
  // The dismissal is exempt — the book sends it elsewhere itself.
  const borrowable = wholeMass && office !== "it" && office !== "be"
    ? groups.slice(0, 1)
    : groups;
  const ranked = borrowable.flatMap((m) =>
    rotate(numbered.filter((e) => e.mass === m), year),
  );

  const appendix = appendixFor(office);
  const appendixPick = appendix.length
    ? [appendix[((year % appendix.length) + appendix.length) % appendix.length]]
    : [];

  if (appendixLeads && appendixPick.length) return [...appendixPick, ...ranked];
  if (ranked.length) return ranked;

  // The sprinkling rites carry no mass number. The plain Asperges / Vidi aquam
  // is the standing answer — its ad libitum variants must NOT rotate against it
  // as equals, or the appendix would be sung more often than the rite itself.
  // They arrive on the appendix turn like every other appendix setting.
  const unnumbered = KYRIALE.filter(
    (e) => e.office === office && e.mass == null && !isRequiem(e),
  );
  const plain = unnumbered.filter((e) => !isAdLibitum(e));
  if (plain.length) return rotate(plain, year);
  if (unnumbered.length) return unnumbered.sort(adLibLast);

  return appendixPick.length ? appendixPick : appendix;
}

function selectBestChant(
  entries: KyrialeEntry[],
  filterMode: number | null,
  highFeast: boolean,
  massNumbers: number[],
): KyrialeEntry | null {
  if (!entries.length) return null;

  const modeStr = filterMode != null ? String(filterMode) : null;
  let candidates = modeStr
    ? entries.filter((e) => e.mode === modeStr)
    : entries;

  if (!candidates.length && modeStr) {
    const paired = pairedMode(filterMode!);
    if (paired) candidates = entries.filter((e) => e.mode === String(paired));
  }
  if (!candidates.length) candidates = entries;

  if (highFeast && candidates.length > 1) {
    const preferred = candidates.filter(
      (c) => c.mass != null && c.mass >= 1 && c.mass <= 9,
    );
    if (preferred.length) candidates = preferred;
  }

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

// The fitting credo leads in one year of every two; the rest of the time the six
// rotate. Every credo is heard, the fitting one is heard most.
const CREDO_BIAS_EVERY = 2;

/**
 * Which credo the day sings, or null when this mass says none.
 *
 * An empty `allowed` still means NO credo today — that is the mass's own rubric
 * and it is respected. But when a credo IS sung, the choice is drawn from all
 * six, not from `allowed`: the Kyriale prints Credo I–VI as a set any mass may
 * draw on, whereas the `credos` arrays in masses.ts only ever name I, III and
 * IV — which left II, V and VI unsingable on every day of the year, despite
 * CREDO_PRIORITY naming all six. 【The narrow `credos` data is a separate gap
 * ⟨Jeffrey⟩; this reads it as a preference rather than the whole permission.】
 */
function selectCredoCode(feast: Feast, allowed: string[], year: number): string | null {
  if (!allowed.length) return null;
  const preferred = preferredCredoCode(feast, allowed);
  if (preferred && year % CREDO_BIAS_EVERY === 0) return preferred;
  return rotate(CREDO_PRIORITY, year)[0];
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
    modus: entry.mode ? (MODE_LABELS[String(entry.mode)] ?? null) : null,
    pages: [],
    source: KY_SOURCE,
    ordinary,
    ordinarium: ORDINARY_LABELS[ordinary] ?? entry.incipit,
    mass: entry.mass ?? 0,
  };
}

// Maundy Thursday (In Cena Domini) is a Triduum exception: it retains a full
// Mass with the Gloria (rung with bells, which then fall silent until the
// Easter Vigil) despite Lent's penitential omission and the Triduum's
// otherwise empty ordinary. The Credo and the Sunday sprinkle rite are not
// part of this evening Mass. See docs/chant.md.
const MAUNDY_THURSDAY_ID = "Quad6-4";
// The feast carries no numbered Kyriale mass of its own (masses: []); as a
// paschally-adjacent solemnity it draws on Mass I (Lux et origo) — the same
// mass the Easter Vigil borrows, so both Triduum Masses share a setting.
const MAUNDY_THURSDAY_MASS = 1;

function ordinaryForFeast(feast: Feast, pinMass?: number, filterMode?: number | null): OrdinaryChant[] {
  const isMaundyThursday = feast.id === MAUNDY_THURSDAY_ID;

  // The Triduum has no Mass-ordinary cycle (Good Friday has no Mass; the
  // Vigil's ordinary belongs to Easter). Maundy Thursday is the exception —
  // it keeps its Mass. An explicitly pinned mass also overrides.
  if (feast.grade === "triduum" && pinMass == null && !isMaundyThursday) return [];

  const resolvedMass = pinMass ?? (isMaundyThursday ? MAUNDY_THURSDAY_MASS : undefined);
  const masses = resolvedMass != null
    ? (() => { const e = MASSES.get(resolvedMass); return e ? [e] : []; })()
    : resolveMasses(feast);
  const mode = filterMode ?? null;
  const highFeast = isHighFeast(feast.grade);

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
    );
    const best = selectBestChant(entries, mode, highFeast, massNumbers);
    return best ? entryToOrdinaryChant(best) : null;
  };

  const results: OrdinaryChant[] = [];

  const ky = pick("ky");
  if (ky) results.push(ky);

  // Gloria is omitted in penitential seasons (Advent, Septuagesima, Lent).
  // Maundy Thursday keeps it — its Gloria is a deliberate breach of Lenten
  // austerity, sung with the bells before they fall silent.
  const glOmitted = PENITENTIAL_SEASONS.has(feast.season) && !isMaundyThursday;
  if (!glOmitted) {
    const gl = pick("gl");
    if (gl) results.push(gl);
  }

  // Credo — In Cena Domini's Mass has no Creed.
  if (!isMaundyThursday) {
    const allowed = allowedCredos(masses);
    const credoCode = selectCredoCode(feast, allowed, year);
    if (credoCode) {
      const credoEntries = KYRIALE.filter((e) => e.office === "cr");
      const named = credoEntries.find((e) => e.incipit.includes(credoCode));
      const best = named ?? selectBestChant(credoEntries, mode, highFeast, massNumbers);
      if (best) {
        const cr = entryToOrdinaryChant(best);
        cr.ordinarium = `Credo ${credoCode}`;
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
    );
    const sprinkleBest = selectBestChant(sprinkleEntries, mode, highFeast, massNumbers);
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


/**
 * Mass ordinary retrieval (`tonus.ordinarium`) from the Kyriale. A feast
 * drives mass selection; `mass` pins a kyriale number directly.
 */
export function getOrdinary(query?: OrdinariumQuery): OrdinaryChant[] {
  if (!query || Object.keys(query).length === 0) return [];

  const feasts = toArray(query.feast);
  assertFeasts(feasts, "ordinarium");
  const filterMode = query.mode != null ? Number(query.mode) : undefined;

  let results: OrdinaryChant[];

  if (feasts) {
    results = feasts.flatMap((f) => ordinaryForFeast(f, query.mass, filterMode));
  } else if (query.mass != null || query.ordinary) {
    // Direct kyriale query without feast context
    let entries = KYRIALE.slice();
    if (query.mass != null) entries = entries.filter((e) => e.mass === query.mass);
    if (query.ordinary) entries = entries.filter((e) => e.office === query.ordinary);
    if (filterMode != null) entries = entries.filter((e) => e.mode === String(filterMode));

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
