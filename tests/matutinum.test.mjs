import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { getMatins } from "../dist/engines/chant/matutinum.js";

describe("getMatins — structured Roman Matins", () => {
  // ── The Roman office was CUT ⟨RULED: Jeffrey, 2026-07-27⟩ ─────────────────
  // tonus ships the Roman MASS and the Benedictine OFFICE. The Nocturnale exists
  // to serve Roman Matins, so the cut took all but the 129 of its chants the
  // monastic day or the commune reaches. MATINS_ROMAN still ships — the table is
  // intact and every id in it is real — but the chants it names are no longer in
  // the corpus, so the hour resolves to nothing rather than to a false ordo.
  //
  // Restoring it is one flag: set scopes.romanOffice = true in
  // tonus-corpus/scripts/build-keep-set.mjs, re-run it and the extractors. These
  // assertions are what should pass again when that happens.
  test("Roman Matins serves only chants the cut happened to keep", () => {
    const m = getMatins({ feast: { id: "Adv1-0" } });
    if (m === null) return;               // the whole day resolved away
    // Whatever it returns must be REAL — resolved chants with GABC, never
    // half-built shells. The count is incidental: a Nocturnale chant survives
    // the cut when the monastic office or a commune also asks for it, so Roman
    // Matins picks up whatever overlaps. Advent I keeps all nine of its great
    // responsories that way; other days will return fewer, or nothing.
    const sung = m.nocturns.flatMap((n) => [...n.responsories, ...n.antiphons]);
    for (const c of sung) {
      assert.ok(c.gabc.length > 0, `${c.incipit} resolved without GABC`);
      assert.ok(c.office === "re" || c.office === "an",
        `${c.incipit} is ${c.office}, not a nocturn genre`);
    }
  });

  test("a feast with no Nocturnale match returns null", () => {
    assert.equal(getMatins({ feast: { id: "99-99" } }), null);
  });

  test("the Roman rite still reports itself structured", () => {
    // The SHAPE contract survives the cut even though the chants do not.
    const m = getMatins({ feast: { id: "Adv1-0" } });
    if (m) assert.equal(m.structured, true);
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
