// tests/proprium — which chant a day's Mass sings
//
// The propers are generated: tonus-corpus matches each Divinum Officium text
// to a GregoBase chant (scripts/match-proper.mjs there). That matcher used to
// compare five-word incipits, so a slot could take a chant of the right
// opening and the wrong genre or setting — the Advent I Offertory became the
// Introit, St Anne's "Gaudeamus" became Our Lady of Good Counsel's, and the
// Tract slot of some seventy feasts held the day's Gradual. These tests hold
// the shape of every day's Mass and the specific days that went wrong.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import tonus from "../dist/index.js";

const { festum, proprium } = tonus;
const MASS = new Set(["in", "gr", "al", "tr", "of", "co", "sq"]);

// Every distinct day the calendar produces across four years.
const days = (() => {
  const seen = new Map();
  for (const y of [2025, 2026, 2027, 2028]) {
    for (let t = Date.UTC(y, 0, 1); t < Date.UTC(y + 1, 0, 1); t += 864e5) {
      const f = festum({ date: new Date(t) })[0];
      if (f && !seen.has(f.id)) seen.set(f.id, f);
    }
  }
  return seen;
})();

const dayOf = (id) => {
  const f = days.get(id);
  assert.ok(f, `fixture: ${id} occurs in 2025–2028`);
  return f;
};
const slot = (id, office) => proprium({ feast: dayOf(id) }).filter((c) => c.office === office);

describe("proprium — every day's Mass has a Mass's shape", () => {
  test("only Mass chants, none twice, and one each of Introit, Gradual, Offertory, Communion", () => {
    const bad = [];
    for (const [id, f] of days) {
      const p = proprium({ feast: f });
      const ids = p.map((c) => c.id);
      if (new Set(ids).size < ids.length) bad.push(`${id}: a chant twice`);
      for (const c of p) if (!MASS.has(c.office)) bad.push(`${id}: ${c.office} "${c.incipit}"`);
      for (const o of ["in", "gr", "of", "co"]) {
        const n = p.filter((c) => c.office === o).length;
        if (n > 1) bad.push(`${id}: ${n} × ${o}`);
      }
    }
    assert.deepEqual(bad, []);
  });
});

describe("proprium — the days the incipit matcher got wrong", () => {
  test("Advent I sings its Offertory, not its Introit twice", () => {
    assert.match(slot("Adv1-0", "of")[0]?.incipit ?? "", /^Ad te Domine/);
    assert.equal(slot("Adv1-0", "in").length, 1);
  });

  test("an Introit's setting is the day's own, not a namesake's", () => {
    assert.match(slot("Pent16-0", "in")[0].incipit, /ad te/);          // not "…conculcavit"
    assert.match(slot("07-26", "in")[0].incipit, /Annae/);              // not Boni Consilii
    assert.match(slot("12-26", "in")[0].incipit, /^Etenim sederunt/);   // not the Gradual
  });

  test("the Easter-week Graduals carry each day's own verse", () => {
    const verses = ["Pasc0-1", "Pasc0-2", "Pasc0-3", "Pasc0-4", "Pasc0-5"]
      .map((id) => slot(id, "gr")[0].incipit);
    assert.equal(new Set(verses).size, 5, verses.join(" | "));
  });

  test("Lent's Sundays sing their Tracts", () => {
    assert.match(slot("Quad1-0", "tr")[0]?.incipit ?? "", /^Qui habitat/);
    assert.match(slot("Quad4-0", "tr")[0]?.incipit ?? "", /^Qui confidunt/);
  });

  test("a feast outside Paschaltide takes the setting without alleluia", () => {
    // DO borrows the Second Sunday after Easter's Communion, alleluia and all.
    assert.match(slot("11-14", "co")[0].incipit, /sine Alleluia/);
  });
});
