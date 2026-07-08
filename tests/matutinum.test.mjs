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

  test("the monastic rite is not served (returns null)", () => {
    assert.equal(getMatins({ feast: { id: "Adv1-0" }, rite: "monasticum" }), null);
  });

  test("a feast with no Nocturnale match returns null", () => {
    assert.equal(getMatins({ feast: { id: "99-99" } }), null);
  });
});
