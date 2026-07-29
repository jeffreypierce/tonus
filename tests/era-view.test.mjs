// The era view — one `before` across calendar and chants.
//
// festum({ before }) resolves the CALENDAR as of a year; cantus({ before })
// filters the REPERTOIRE attested by a year. These are two halves of one
// intent, and they compose: the feast carries the view it was resolved under,
// and every day verb (proprium, ordinarium, officium) serves the same view
// without being told the year twice.
//
// THE COMEBACK: this suite was retired with the filter when its data had a
// genre-shaped hole (93% of responsories undated — before: 1098 deleted the
// Night Office). The corpus closed the hole (85% dated, responsories 92%);
// the filter returned with ONE time argument. `century` did not come back —
// the planned convergence executed as a deletion — and the Epiphany
// acceptance test at the bottom pins the exact failure that retired v1, so it
// can never quietly return.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { getChants } from "../dist/engines/chant/chant.js";
import { getPropers } from "../dist/engines/chant/propers.js";
import { getOrdinary } from "../dist/engines/chant/ordinary.js";
import { getHour } from "../dist/engines/chant/hour.js";
import { getFeast } from "../dist/engines/cal/calendar.js";

const VIEW = 1100; // the high end of the ~700–1100 target
const attested = new Set(getChants({ before: VIEW }).map((c) => c.id));
const easterDate = new Date(Date.UTC(2026, 3, 5));
const epiphanyDate = new Date(Date.UTC(2026, 0, 6));

describe("era view — the feast carries it", () => {
  test("festum({ before }) stamps the view; a plain resolution carries none", () => {
    const viewed = getFeast({ date: easterDate, before: VIEW })[0];
    assert.equal(viewed.before, VIEW, "the view rides the Feast");
    const plain = getFeast({ date: easterDate })[0];
    assert.equal(plain.before, undefined, "no stamp on a present-day resolution");
  });

  test("one `before` at the calendar door filters every day verb", () => {
    const viewed = getFeast({ date: easterDate, before: VIEW })[0];
    const plain = getFeast({ date: easterDate })[0];

    const prViewed = getPropers({ feast: viewed });
    const prPlain = getPropers({ feast: plain });
    assert.ok(prViewed.length > 0, "Easter still sings under the view");
    // Self-consistent, not count-pinned: the viewed set is EXACTLY the plain
    // set restricted to attested ids. (A count pin here broke every time the
    // corpus dated one more chant — the law is the restriction, not a number.)
    assert.deepEqual(
      new Set(prViewed.map((c) => c.id)),
      new Set(prPlain.filter((c) => attested.has(c.id)).map((c) => c.id)),
      "proprium under the view ≡ the plain propers restricted to attested ids",
    );

    for (const c of getOrdinary({ feast: viewed })) {
      assert.ok(attested.has(c.id), `ordinarium: ${c.id} attested by ${VIEW}`);
    }
    for (const c of getHour({ feast: viewed, hora: "laudes" })) {
      if (String(c.id).startsWith("psalm:")) continue; // generated psalmody, not corpus
      assert.ok(attested.has(c.id), `officium: ${c.id} attested by ${VIEW}`);
    }
  });

  test("the day verb's own before overrides the feast's stamp", () => {
    const viewed = getFeast({ date: easterDate, before: 1600 })[0];
    const narrower = new Set(getChants({ before: 1000 }).map((c) => c.id));
    for (const c of getPropers({ feast: viewed, before: 1000 })) {
      assert.ok(narrower.has(c.id), `${c.id}: the query's 1000 wins over the feast's 1600`);
    }
  });
});

describe("era view — re-pick vs silence", () => {
  test("ordinarium RE-PICKS: the rotation runs over the admissible pool", () => {
    const plain = getFeast({ date: easterDate })[0];
    const parts = (ord) => new Set(ord.map((c) => c.ordinary));
    const viewedOrd = getOrdinary({ feast: plain, before: VIEW });
    assert.ok(viewedOrd.length > 0, "the viewed day still sings");
    for (const c of viewedOrd) assert.ok(attested.has(c.id), `${c.id} attested`);
    // Re-pick keeps every slot the pool can attest: the sung ordinary — Kyrie,
    // Gloria, Credo, Sanctus, Agnus, and the sprinkle — all survive an 1100
    // view. A slot with no attested candidate falls silent honestly instead.
    const viewed = parts(viewedOrd);
    for (const slot of ["ky", "gl", "cr", "sa", "ag", "va"]) {
      assert.ok(viewed.has(slot), `the ${slot} slot survives the view`);
    }
    for (const slot of viewed) {
      assert.ok(parts(getOrdinary({ feast: plain })).has(slot), `${slot} ⊆ the unviewed slots`);
    }
  });

  test("proprium degrades to SILENCE — a proper has no pool of alternatives", () => {
    const plain = getFeast({ date: easterDate })[0];
    const all = getPropers({ feast: plain });
    const viewed = getPropers({ feast: plain, before: VIEW });
    const viewedIds = new Set(viewed.map((c) => c.id));
    for (const c of all) {
      if (attested.has(c.id)) assert.ok(viewedIds.has(c.id), `${c.id} kept`);
      else assert.ok(!viewedIds.has(c.id), `${c.id} silenced, never substituted`);
    }
  });
});

describe("era view — one argument, every door", () => {
  test("`century` did not come back — the convergence was a deletion", () => {
    assert.throws(() => getChants({ century: 11 }), /century|unknown/i,
      "the retired spelling is refused loudly, not silently ignored");
  });

  test("cursus threads through the day verbs, `both` satisfying either ask", () => {
    const feast = getFeast({ date: easterDate })[0];
    const monastic = new Set(getChants({ cursus: "monastic" }).map((c) => c.id));
    for (const c of getHour({ feast, hora: "laudes", cursus: "monastic" })) {
      if (String(c.id).startsWith("psalm:")) continue;
      assert.ok(monastic.has(c.id), `${c.id} transmitted by the monastic cursus`);
    }
  });

  test("a broken view fails loudly at every door, never filters silently", () => {
    const feast = getFeast({ date: easterDate })[0];
    assert.throws(() => getChants({ before: NaN }), /century number/);
    assert.throws(() => getPropers({ feast, before: NaN }), /century number/);
    assert.throws(() => getOrdinary({ feast, before: NaN }), /century number/);
    assert.throws(() => getHour({ feast, hora: "laudes", before: NaN }), /century number/);
  });
});

describe("era view — the Epiphany acceptance (the failure that retired v1)", () => {
  // Under before: 1098, v1 lost every one of Epiphany Matins' 9 responsories
  // — Hartker-derived, c. 1000, they BELONG in an 1098 answer — because
  // CANTUS's direct text index never dated them. The comeback exists because
  // the corpus closed that hole (crosswalk gap-fill + matcher v2).
  // This test pins the repertory, not a count: the Night Office must survive.
  test("Epiphany Matins keeps its responsories under before: 1098", () => {
    const feast = getFeast({ date: epiphanyDate })[0];
    const q = { feast, hora: "matutinum" };
    const re = (cs) => cs.filter((c) => c.office === "re");
    const plainRe = re(getHour(q));
    const viewedRe = re(getHour({ ...q, before: 1098 }));
    assert.ok(plainRe.length >= 9, `Epiphany Matins sings its responsories (${plainRe.length})`);
    assert.ok(
      viewedRe.length >= Math.ceil(plainRe.length * 2 / 3),
      `the Night Office survives the view: ${viewedRe.length} of ${plainRe.length} responsories attested by 1098`,
    );
    for (const c of viewedRe) {
      assert.ok(attested.has(c.id) || getChants({ before: 1098, id: c.id }).length === 1,
        `${c.id} carries a pre-1098 witness`);
    }
  });
});
