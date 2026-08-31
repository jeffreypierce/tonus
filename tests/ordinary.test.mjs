import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { getOrdinary } from "../dist/engines/chant/ordinary.js";
import { getFeast } from "../dist/engines/cal/calendar.js";
import { MASS_CENTURY, partWithinEra } from "../dist/engines/chant/data/masses.js";

describe("the Kyriale era rule (latest 1324)", () => {
  test("its SCOPE is the Kyriale, not the corpus", () => {
    // tonus has per-chant dates for 71 of 2,860 shipped chants — 2.5%. A
    // corpus-wide era filter would be filtering 97.5% of the repertory on data
    // that does not exist, which is the mistake that retired the attestation
    // filter (at 69% coverage). The period of everything else is set by THE
    // CUT: tonus ships what the liturgy places.
    assert.equal(partWithinEra(undefined, undefined), true, "no mass/office → admit");
    assert.equal(partWithinEra(4, "gr"), true, "a non-ordinary office is not the rule's business");
  });

  test("drops a late PART without losing the mass", () => {
    // Mass XI "Orbis factor" is a 10th-c Kyrie/Gloria/Sanctus with a 14th-c
    // Agnus bolted on — the Kyriale is a 19th-c grouping of chants from
    // different centuries, which is why its ascriptions are per-part.
    assert.equal(partWithinEra(11, "ke"), true, "Orbis factor's Kyrie is 10th c");
    assert.equal(partWithinEra(11, "gl"), true);
    assert.equal(partWithinEra(11, "sa"), true);
    assert.equal(partWithinEra(11, "ag"), false, "its Agnus is XIV. s.");
  });

  test("honours the editors' parenthetical earlier reading", () => {
    // Mass XI's Kyrie prints "(X) XIV-XVI. s." — the parenthetical is the
    // melody, the late reading is whichever manuscript was transcribed.
    // Corpus Monodicum (Brill, 2024) dates Orbis factor to the 10th–12th c.
    assert.equal(MASS_CENTURY[11].ke.alt, 10);
    assert.equal(partWithinEra(11, "ke"), true);
    // Mass VIII's Sanctus likewise: "(XI) XII. s." keeps it, while the famous
    // late Kyrie and Gloria go.
    assert.equal(partWithinEra(8, "sa"), true);
    assert.equal(partWithinEra(8, "ke"), false, "de Angelis' Kyrie is XV–XVI");
    assert.equal(partWithinEra(8, "gl"), false);
  });

  test("there is no lower bound — only a latest year", () => {
    // An earlier draft carried ERA_FROM = 754, which read as doctrine but was
    // unenforceable: nothing checked it and no data could. A 9th-c setting is
    // admitted for the same reason a 13th-c one is — the rule can only remove
    // what the Kyriale itself dates late.
    assert.equal(partWithinEra(1, "ke"), true, "Lux et origo, X. s.");
  });

  test("1324 admits only centuries that CLOSED before it", () => {
    // A setting marked XIV. s. may have been written in 1390, after the bull.
    assert.equal(partWithinEra(9, "sa"), false, "Mass IX Sanctus is XIV. s.");
    assert.equal(partWithinEra(13, "sa"), true, "Mass XIII Sanctus is XIII. s.");
  });

  test("an undated part is ADMITTED, not excluded", () => {
    // The editors' own "?. s." — undated is not late. Excluding it would repeat
    // the mistake that retired the attestation filter.
    assert.equal(MASS_CENTURY[10].sa.from, null);
    assert.equal(partWithinEra(10, "sa"), true);
    // And a part with no entry at all.
    assert.equal(partWithinEra(2, "sa"), true);
  });

  test("every day still sings: a dropped part borrows", () => {
    // Sundays are appointed Mass XI alone, so its dropped Agnus has nowhere to
    // go without the sung borrow the LU licenses.
    const sunday = getFeast({ date: new Date(Date.UTC(2024, 5, 2)) })[0];
    const served = getOrdinary({ feast: [sunday] });
    const have = new Set(served.map((c) => c.ordinary));
    for (const slot of ["ke", "sa", "ag"]) {
      assert.ok(have.has(slot), `Sunday must sing ${slot}`);
    }
    // The borrowed Agnus comes from another mass, not Mass XI.
    const agnus = served.find((c) => c.ordinary === "ag");
    assert.notEqual(agnus.mass, 11, "Mass XI's own Agnus is out of the era");
  });
});
