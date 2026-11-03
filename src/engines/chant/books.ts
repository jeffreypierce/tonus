// ---------------------------------------------------------------------------
// engines/chant/books — the book registry, and a chant presented as a book
// ---------------------------------------------------------------------------
// A LEAF module (data and types only), like attest.ts: every verb that takes a
// `source` filter reads the books a chant is printed in through here, so
// proprium, officium and ordinarium filter by the same shelf cantus does
// without importing cantus's module (chant.ts ↔ ordinary.ts is an import
// cycle).
import type { Chant, ChantSource } from "./types.js";
import { GR_SOURCE } from "../../data/gr.js";
import { LU_SOURCE } from "../../data/lu.js";
import { LA_SOURCE } from "../../data/la.js";
import { LH_SOURCE } from "../../data/lh.js";
import { AM_SOURCE } from "../../data/am.js";
import { NR_SOURCE } from "../../data/nocturnale-romanum.js";
import { PSM_SOURCE } from "../../data/psm.js";

// The book registry, and so the shelf `corpus()` reports. `ky` is absent: it
// is a partition of `gr`, not a book (see chant.ts, KYRIALE_CHANTS). Its
// bibliographic record still rides every kyriale chant's `source`, so a caller
// reading one is told which book it is printed in, but the Kyriale is not a
// row in the ledger, because the Graduale already is.
export const SOURCES: Record<ChantSource, Chant["source"]> = {
  gr: GR_SOURCE, lu: LU_SOURCE, la: LA_SOURCE, lh: LH_SOURCE, am: AM_SOURCE, nr: NR_SOURCE,
  // office books — provenance, not acquisition
  psm: PSM_SOURCE,
};

// Every printing's pages, by chant id then book code. Kept beside the corpus
// rather than on the Chant: a caller gets the pages for the book they ASKED
// about (see presentAs), and carrying all of them on every record would invite
// reading the wrong volume's citation.
const PAGES_BY_BOOK = new Map<string, Record<string, Chant["pages"]>>();

/** Remember a chant's by-book page map, for presentAs. */
export function registerPages(id: string, byBook: Record<string, Chant["pages"]>): void {
  PAGES_BY_BOOK.set(id, byBook);
}

/**
 * The same chant, presented as the book the caller asked for.
 *
 * A melody printed in several books is stored once, under one owner, so its
 * `source` and `pages` are the owner's. Ask `cantus({ source: "gr" })` and you
 * mean the Graduale: you want the Graduale's bibliographic record and the
 * Graduale's page numbers, not the Liber Usualis's because that is where the
 * record happens to be filed. `books` is unchanged — the shelf is the shelf.
 */
export function presentAs(chant: Chant, code: ChantSource): Chant {
  if (chant.source.code === code) return chant;
  const src = SOURCES[code];
  if (!src) return chant;
  const pages = PAGES_BY_BOOK.get(chant.id)?.[code];
  return { ...chant, source: src, pages: pages ?? chant.pages };
}

/**
 * The chants some asked-for book PRINTS, each presented as that book. Reads
 * `books`, never `source.code`: a chant filed under the Liber Usualis and
 * printed in the Graduale is a Graduale chant to a caller asking for `gr`.
 */
export function inBooks<T extends Chant>(chants: readonly T[], sources: readonly string[]): T[] {
  const set = new Set<string>(sources);
  const out: T[] = [];
  for (const c of chants) {
    const asked = c.books.find((b) => set.has(b)) as ChantSource | undefined;
    if (asked) out.push(presentAs(c, asked) as T);
  }
  return out;
}
