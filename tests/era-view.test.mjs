// The era view — one `before` across calendar and chants.
//
// festum({ before }) resolves the CALENDAR as of a year; cantus({ before })
// filters the REPERTOIRE attested by a year. These are two halves of one
// intent, and they compose: the feast carries the view it was resolved under,
// and every day verb (proprium, ordinarium, officium, matutinum) serves the
// same view without being told the year twice ⟨RULED 2026-07-27⟩.
//
// Before this contract existed, the day verbs' types PROMISED before/century/
// cursus (they extend CantusQuery) while the implementations diverged three
// ways: proprium threw "unknown query key", officium and ordinarium silently
// ignored them. These tests pin the reconciled behavior.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { getChants } from "../dist/engines/chant/chant.js";
import { getPropers } from "../dist/engines/chant/propers.js";
import { getOrdinary } from "../dist/engines/chant/ordinary.js";
import { getHour } from "../dist/engines/chant/hour.js";
import { getMatins } from "../dist/engines/chant/matutinum.js";
import { getFeast } from "../dist/engines/cal/calendar.js";

const VIEW = 1100; // the high end of the ~700–1100 target
const attested = new Set(getChants({ before: VIEW }).map((c) => c.id));
const easterDate = new Date(Date.UTC(2026, 3, 5));

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
    assert.ok(
      prViewed.length < prPlain.length,
      `the view narrows the propers (${prViewed.length} < ${prPlain.length})`,
    );
    for (const c of prViewed) assert.ok(attested.has(c.id), `proprium: ${c.id} attested by ${VIEW}`);

    for (const c of getOrdinary({ feast: viewed })) {
      assert.ok(attested.has(c.id), `ordinarium: ${c.id} attested by ${VIEW}`);
    }
    for (const c of getHour({ feast: viewed, hora: "laudes", rite: "monasticum" })) {
      if (String(c.id).startsWith("psalm:")) continue; // generated psalmody, not corpus
      assert.ok(attested.has(c.id), `officium: ${c.id} attested by ${VIEW}`);
    }
    const m = getMatins({ feast: viewed, rite: "monasticum" });
    if (m) {
      const chants = [
        m.invitatorium, m.hymnus,
        ...m.nocturns.flatMap((n) => [...n.responsories, ...n.antiphons]),
      ].filter(Boolean);
      for (const c of chants) assert.ok(attested.has(c.id), `matutinum: ${c.id} attested by ${VIEW}`);
    }
  });

  test("the day verb's own before/century overrides the feast's stamp", () => {
    const viewed = getFeast({ date: easterDate, before: 1600 })[0];
    const narrower = new Set(getChants({ before: 1000 }).map((c) => c.id));
    for (const c of getPropers({ feast: viewed, before: 1000 })) {
      assert.ok(narrower.has(c.id), `${c.id}: the query's 1000 wins over the feast's 1600`);
    }
  });
});

describe("era view — re-pick vs silence", () => {
  test("ordinarium RE-PICKS: the rotation runs over the admissible pool ⟨RULED⟩", () => {
    // 100 of 120 kyriale settings are attested by 1100, so a viewed day still
    // sings a full ordinary — from settings the view attests.
    const plain = getFeast({ date: easterDate })[0];
    const parts = (ord) => new Set(ord.map((c) => c.ordinary));
    const viewedOrd = getOrdinary({ feast: plain, before: VIEW });
    assert.ok(viewedOrd.length > 0, "the viewed day still sings");
    for (const c of viewedOrd) assert.ok(attested.has(c.id), `${c.id} attested`);
    // Re-pick keeps every slot the pool can attest. The sung ordinary — Kyrie,
    // Gloria, Credo, Sanctus, Agnus, and the sprinkle — all survive an 1100
    // view. The ITE does not: no dismissal in the kyriale carries an 1100
    // witness (CANTUS scarcely indexes dismissals), so that slot honestly
    // falls silent — evidence speaking, not the re-pick failing.
    const viewed = parts(viewedOrd);
    for (const slot of ["ky", "gl", "cr", "sa", "ag", "va"]) {
      assert.ok(viewed.has(slot), `the ${slot} slot survives the view`);
    }
    for (const slot of viewed) {
      assert.ok(parts(getOrdinary({ feast: plain })).has(slot), `${slot} ⊆ the unviewed slots`);
    }
  });

  test("proprium degrades to SILENCE — a proper has no pool of alternatives ⟨RULED⟩", () => {
    const plain = getFeast({ date: easterDate })[0];
    const all = getPropers({ feast: plain });
    const viewed = getPropers({ feast: plain, before: VIEW });
    // Easter's gradual-tier chant is not attested by 1100 in CANTUS's index:
    // 4 propers → 3 under the view. The missing slot stays missing.
    assert.ok(viewed.length < all.length, "the unattested proper falls silent");
    const viewedIds = new Set(viewed.map((c) => c.id));
    for (const c of all) {
      if (attested.has(c.id)) assert.ok(viewedIds.has(c.id), `${c.id} kept`);
      else assert.ok(!viewedIds.has(c.id), `${c.id} silenced`);
    }
  });
});

describe("era view — one cutoff, every door", () => {
  test("century: N is exactly before: N * 100", () => {
    assert.equal(getChants({ century: 11 }).length, getChants({ before: 1100 }).length);
    assert.equal(getChants({ century: 12 }).length, getChants({ before: 1200 }).length);
    const feast = getFeast({ date: easterDate })[0];
    assert.equal(
      getPropers({ feast, century: 11 }).length,
      getPropers({ feast, before: 1100 }).length,
      "the equivalence holds through the day verbs too",
    );
  });

  test("cursus threads through the day verbs, `both` satisfying either ask", () => {
    const feast = getFeast({ date: easterDate })[0];
    const monastic = new Set(getChants({ cursus: "monastic" }).map((c) => c.id));
    for (const c of getHour({ feast, hora: "laudes", rite: "monasticum", cursus: "monastic" })) {
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
