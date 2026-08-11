// ---------------------------------------------------------------------------
// docs/components/feast-index — which feast a chant is sung at
// ---------------------------------------------------------------------------
// There is no day on a Chant, so the index is built the other way round: walk
// a year — 365 × festum, then the five offices the site reads — and record,
// per chant, the FIRST feast it appears at, and per feast, its chants.
//
// Keyed on the FEAST, not the date: a feast's name is what a reader wants and
// it is year-stable, where a date-keyed index is only true for the year it
// was built — the movable feasts move. Memoised PER YEAR for the same reason.
// Measured: 78 ms for the walk, 1,683 chants placed.
//
// The office list matches app.js's OFFICES — the index must see the same day
// the page shows, or a chant's "first feast" is first of a different set.

let built = null;   // { year, firstFeast: Map id→nomen, chants: Map nomen→[chant] }

const OFFICES = (tonus) => [
  (f) => tonus.proprium({ feast: f }),
  (f) => tonus.ordinarium({ feast: f }),
  (f) => tonus.officium({ feast: f, hora: "matutinum" }),
  (f) => tonus.officium({ feast: f, hora: "laudes" }),
  (f) => tonus.officium({ feast: f, hora: "vesperae" }),
];

function build(tonus, year) {
  const firstFeast = new Map();
  const chants = new Map();
  const queries = OFFICES(tonus);
  for (let d = 0; d < 366; d++) {
    const date = new Date(Date.UTC(year, 0, 1 + d));
    if (date.getUTCFullYear() !== year) break;
    let feast;
    try { [feast] = tonus.festum({ date }); } catch { continue; }
    if (!feast?.nomen) continue;
    for (const of_ of queries) {
      let cs = [];
      try { cs = of_(feast).filter((c) => c.gabc); } catch { cs = []; }
      for (const c of cs) {
        if (!firstFeast.has(c.id)) firstFeast.set(c.id, feast.nomen);
        let list = chants.get(feast.nomen);
        if (!list) chants.set(feast.nomen, (list = { seen: new Set(), rows: [] }));
        if (!list.seen.has(c.id)) { list.seen.add(c.id); list.rows.push(c); }
      }
    }
  }
  return { year, firstFeast, chants };
}

/** The chant's first feast in `year`, and that feast's other chants.
 *  Null when the chant is sung at no feast the index can see. */
export function massOf(tonus, chant, year) {
  if (!built || built.year !== year) built = build(tonus, year);
  const nomen = built.firstFeast.get(chant.id);
  if (!nomen) return null;
  const rows = built.chants.get(nomen)?.rows ?? [];
  return { feast: nomen, siblings: rows.filter((c) => c.id !== chant.id) };
}
