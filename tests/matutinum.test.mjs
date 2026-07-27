import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { getMatins } from "../dist/engines/chant/matutinum.js";

describe("getMatins — structured Roman Matins", () => {
  test("Dominica I Adventus assembles three nocturns of three responsories", () => {
    const m = getMatins({ feast: { id: "Adv1-0" } });
    assert.ok(m, "Advent I Sunday should resolve");
    assert.equal(m.feastId, "Adv1-0");
    assert.equal(m.nocturns.length, 3);
    for (const n of m.nocturns) assert.equal(n.responsories.length, 3);
    // The historic Advent I responsories, in order.
    assert.equal(m.nocturns[0].responsories[0].incipit, "Aspiciens a longe");
    assert.equal(m.nocturns[2].responsories[2].incipit, "Ecce dies veniunt");
  });

  test("every resolved responsory carries real GABC from the nr book", () => {
    const m = getMatins({ feast: { id: "Adv1-0" } });
    const chants = m.nocturns.flatMap((n) => n.responsories);
    assert.equal(chants.length, 9);
    for (const c of chants) {
      assert.ok(c.gabc.length > 0, `${c.incipit} should have GABC`);
      assert.equal(c.source.code, "nr");
      assert.ok(!c.gabc.includes("|"), "GABC should be NABC-stripped");
    }
  });

  test("a ferial day with its own chants resolves without redirect", () => {
    const m = getMatins({ feast: { id: "Adv1-2" } }); // Feria III, wk1
    assert.ok(m);
    assert.equal(m.redirectedFrom, null);
    assert.ok(m.nocturns[0].responsories.length >= 1);
  });

  test("a whole-day redirect borrows another day's chants (provenance kept)", () => {
    const m = getMatins({ feast: { id: "Adv2-1" } }); // Feria II wk2 ⇐ A1F2
    assert.ok(m);
    assert.ok(m.redirectedFrom, "should record the borrowed-from feast");
    assert.ok(m.nocturns[0].responsories.length >= 1);
  });

  test("a sanctorale feast resolves through its commune", () => {
    const m = getMatins({ feast: { id: "07-15" } }); // St Henry ⇐ CONP
    assert.ok(m);
    assert.equal(m.redirectedFrom, "CONP");
    const resp = m.nocturns.flatMap((n) => n.responsories);
    assert.ok(resp.length >= 1, "commune should supply responsories");
  });

  test("a great feast has its own proper Matins", () => {
    const m = getMatins({ feast: { id: "12-25" } }); // Nativity
    assert.ok(m);
    assert.equal(m.redirectedFrom, null);
    assert.equal(m.nocturns.length, 3);
  });

  test("the invitatory and hymn are lifted out of the nocturns", () => {
    const m = getMatins({ feast: { id: "12-25" } }); // Nativity
    // Both open the hour, before the first nocturn — not responsories.
    assert.equal(m.invitatorium?.office, "in");
    assert.equal(m.hymnus?.office, "hy");
    // Every nocturn's responsories are now genuinely responsories only.
    for (const n of m.nocturns) {
      for (const r of n.responsories) assert.equal(r.office, "re");
    }
    // Nativity: 3 / 3 / 2 responsories (the third of nocturn 3 is the Te Deum).
    assert.deepEqual(m.nocturns.map((n) => n.responsories.length), [3, 3, 2]);
    // Nocturn 3 carries its three antiphons.
    assert.equal(m.nocturns[2].antiphons.length, 3);
  });

  test("a feast with no Nocturnale match returns null", () => {
    assert.equal(getMatins({ feast: { id: "99-99" } }), null);
  });

  test("the Roman rite reports itself structured", () => {
    assert.equal(getMatins({ feast: { id: "Adv1-0" } }).structured, true);
  });
});

describe("getMatins — flat monastic Matins", () => {
  test("the monastic rite is served, and says it is NOT structured", () => {
    const m = getMatins({ feast: { id: "01-01" }, rite: "monasticum" });
    assert.ok(m, "monastic Matins should resolve");
    assert.equal(m.structured, false);
    assert.equal(m.feastId, "01-01");
  });

  test("flat Matins collapses to exactly one nocturn", () => {
    const m = getMatins({ feast: { id: "01-01" }, rite: "monasticum" });
    // The monastic source table records no nocturn boundaries, so inventing a
    // 3-way division would be fabrication — everything lands in nocturn 1.
    assert.equal(m.nocturns.length, 1);
    assert.equal(m.nocturns[0].n, 1);
  });

  test("chants are sorted into the right buckets by office code", () => {
    const m = getMatins({ feast: { id: "01-01" }, rite: "monasticum" });
    const { responsories, antiphons } = m.nocturns[0];
    assert.ok(antiphons.length > 0, "should carry antiphons");
    for (const a of antiphons) assert.ok(a.office !== "re" && a.office !== "rb");
    for (const r of responsories) assert.ok(r.office === "re" || r.office === "rb");
    // Openers are lifted out of the nocturn, as on the Roman path.
    for (const c of [...responsories, ...antiphons]) {
      assert.ok(c.office !== "in" && c.office !== "hy");
    }
  });

  test("monastic Matins draws on Solesmes books, not the Nocturnale", () => {
    const m = getMatins({ feast: { id: "01-01" }, rite: "monasticum" });
    const all = m.nocturns.flatMap((n) => [...n.responsories, ...n.antiphons]);
    assert.ok(all.length > 0);
    for (const c of all) {
      assert.ok(c.gabc.length > 0, `${c.incipit} should have GABC`);
      assert.notEqual(c.source.code, "nr");
    }
  });

  test("a feast the monastic table cannot fill returns null, not an empty shell", () => {
    assert.equal(getMatins({ feast: { id: "99-99" }, rite: "monasticum" }), null);
  });
});
