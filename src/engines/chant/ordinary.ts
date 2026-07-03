// ---------------------------------------------------------------------------
// engines/chant/ordinary — Mass ordinary (kyriale) selection
// ---------------------------------------------------------------------------
import { MASSES, AD_LIB, type MassEntry } from "../../data/masses.js";
import { KYRIALE, type KyrialeEntry } from "../../data/kyriale.js";
import {
  MODE_LABELS,
  ORDINARY_LABELS,
  type OrdinaryChant,
  type OrdinariumQuery,
  type OrdinaryCode,
} from "./types.js";
import {
  type Feast,
  type Dignitas,
  dignitasOrder,
  PENITENTIAL_SEASONS,
} from "../cal/types.js";

// A "high feast" (Duplex II classis or above) prefers the solemn kyriale
// masses 1–9. Threshold expressed against DIGNITAS_ORDER, not a magic number.
function isHighFeast(dignitas: Dignitas): boolean {
  return dignitasOrder(dignitas) <= dignitasOrder("duplex-ii");
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

function entriesForOffice(office: string, massNumbers: number[]): KyrialeEntry[] {
  const byMass = KYRIALE.filter(
    (e) => e.office === office && e.mass != null && massNumbers.includes(e.mass),
  );
  if (byMass.length) return byMass;
  return KYRIALE.filter((e) => e.office === office && e.mass == null);
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

function selectCredoCode(feast: Feast, allowed: string[]): string | null {
  if (!allowed.length) return null;
  const { season, weekday, marian, apostolic } = feast;
  const isSunday = weekday === 0;

  if (isSunday && ["adv", "quadp", "quad", "nat"].includes(season) && allowed.includes("IV")) return "IV";
  if (isSunday && season === "pasc" && allowed.includes("III")) return "III";
  if (isSunday && ["epi", "pent"].includes(season) && allowed.includes("I")) return "I";
  if (apostolic && allowed.includes("III")) return "III";
  if (marian && allowed.includes("IV")) return "IV";
  return allowed[0];
}

function entryToOrdinaryChant(entry: KyrialeEntry): OrdinaryChant {
  const ordinary = ORDINARY_OFFICES.has(entry.office as OrdinaryCode)
    ? (entry.office as OrdinaryCode)
    : ("ky" as OrdinaryCode);
  return {
    id: entry.id,
    incipit: entry.incipit,
    gabc: entry.gabc,
    office: "or",
    officeLabel: "Ordinarium",
    mode: entry.mode ? String(entry.mode) : null,
    modeLabel: entry.mode ? (MODE_LABELS[String(entry.mode)] ?? null) : null,
    pages: [],
    source: { book: "Graduale Romanum", year: 1961, editor: "Solesmes", code: "gr" },
    ordinary,
    ordinaryLabel: ORDINARY_LABELS[ordinary] ?? entry.incipit,
    mass: entry.mass ?? 0,
  };
}

function ordinaryForFeast(feast: Feast, pinMass?: number, filterMode?: number | null): OrdinaryChant[] {
  // The Triduum has no Mass-ordinary cycle (Good Friday has no Mass; the
  // Vigil's ordinary belongs to Easter). An explicitly pinned mass overrides.
  if (feast.dignitas === "triduum" && pinMass == null) return [];

  const masses = pinMass != null
    ? (() => { const e = MASSES.get(pinMass); return e ? [e] : []; })()
    : resolveMasses(feast);
  const massNumbers = masses.map((m) => m.mass);
  const mode = filterMode ?? null;
  const highFeast = isHighFeast(feast.dignitas);

  const pick = (office: string): OrdinaryChant | null => {
    const entries = entriesForOffice(office, massNumbers);
    const best = selectBestChant(entries, mode, highFeast, massNumbers);
    return best ? entryToOrdinaryChant(best) : null;
  };

  const results: OrdinaryChant[] = [];

  const ky = pick("ky");
  if (ky) results.push(ky);

  // Gloria is omitted in penitential seasons (Advent, Septuagesima, Lent).
  const glOmitted = PENITENTIAL_SEASONS.has(feast.season);
  if (!glOmitted) {
    const gl = pick("gl");
    if (gl) results.push(gl);
  }

  // Credo
  const allowed = allowedCredos(masses);
  const credoCode = selectCredoCode(feast, allowed);
  if (credoCode) {
    const credoEntries = KYRIALE.filter((e) => e.office === "cr");
    const named = credoEntries.find((e) => e.incipit.includes(credoCode));
    const best = named ?? selectBestChant(credoEntries, mode, highFeast, massNumbers);
    if (best) {
      const cr = entryToOrdinaryChant(best);
      cr.ordinaryLabel = `Credo ${credoCode}`;
      results.push(cr);
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
  // Asperges otherwise.
  const sprinkleType = feast.season === "pasc" ? "va" : "as";
  const sprinkleEntries = entriesForOffice(sprinkleType, massNumbers);
  const sprinkleBest = selectBestChant(sprinkleEntries, mode, highFeast, massNumbers);
  if (sprinkleBest) results.push(entryToOrdinaryChant(sprinkleBest));

  return results;
}

function toArray<T>(v: T | T[] | undefined): T[] | undefined {
  if (v === undefined) return undefined;
  return Array.isArray(v) ? v : [v];
}

/**
 * Mass ordinary retrieval (`tonus.ordinarium`) from the Kyriale. A feast
 * drives mass selection; `mass` pins a kyriale number directly.
 */
export function getOrdinary(query?: OrdinariumQuery): OrdinaryChant[] {
  if (!query || Object.keys(query).length === 0) return [];

  const feasts = toArray(query.feast);
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
