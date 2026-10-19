// Kyriale rubric selection — a regression battery for the selection chain.
//
// Every test here encodes a defect that shipped under a green suite, because
// nothing exercised the selection chain end to end: the last-resort appendix
// was ungated (green ferias sang "Requiescant in pace" as their dismissal and
// an ad libitum Gloria), the paschal rubric acted as a RANK (an Eastertide
// Tuesday led with the Advent/Lent Kyrie), the credo rotation's parity was
// coupled to its bias (Credo V was never sung, and odd years sang one credo
// all year), and the Mass II dismissal borrow the book directs was dead code.
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { getOrdinary } from "../dist/engines/chant/ordinary.js";
import { getFeast } from "../dist/engines/cal/calendar.js";

const dayAt = (y, m, d) =>
  getFeast({ date: new Date(Date.UTC(y, m - 1, d)) })[0];
const part = (ord, code) => ord.find((c) => c.ordinary === code);
const APPENDIX = /ad lib|ambros/i;
const REQUIEM = /requiescant|miss\.\s*def|defunct/i;

describe("ordinarium — ferias and the appendix gate", () => {
  test("a green feria sings the ferial mass whole — no Gloria, Benedicamus from Mass II", () => {
    const feria = dayAt(2026, 6, 3); // Wednesday after Pentecost I
    assert.equal(feria.grade, "feria", "fixture: an ordinary green weekday");
    const ord = getOrdinary({ feast: feria });

    assert.ok(!part(ord, "gl"), "the ferial mass prints no Gloria");
    for (const code of ["ke", "sa", "ag"]) {
      assert.equal(part(ord, code)?.mass, 16, `${code} from Mass XVI, sung whole`);
    }
    const be = part(ord, "be");
    assert.ok(be, "no Gloria → the dismissal is Benedicamus");
    assert.equal(be.mass, 2, "borrowed from Mass II, as the book directs");
    assert.ok(!part(ord, "it"), "no Ite when the Gloria is not sung");
  });

  test("no calendar day of 2026 sings the Requiem, and no feria reaches the appendix", () => {
    for (let i = 0; i < 365; i++) {
      const day = getFeast({ date: new Date(Date.UTC(2026, 0, 1 + i)) })[0];
      if (!day) continue;
      const ord = getOrdinary({ feast: day });
      for (const c of ord) {
        assert.ok(
          !REQUIEM.test(c.incipit),
          `${day.id} (${day.grade}): "${c.incipit}" — the Requiem stays out of calendar picks`,
        );
      }
      if (["feria", "feria-major", "vigilia", "feria-privilegiata"].includes(day.grade)) {
        for (const c of ord) {
          assert.ok(
            !APPENDIX.test(c.incipit),
            `${day.id} (${day.grade}): "${c.incipit}" — the appendix never reaches a feria`,
          );
        }
      }
    }
  });

  test("the Requiem ordinary remains reachable by direct section query", () => {
    const req = getOrdinary({ section: "requiem" });
    assert.ok(
      req.some((c) => /requiescant/i.test(c.incipit)),
      'Requiescant serves under ordinarium({ section: "requiem" })',
    );
    assert.ok(req.every((c) => c.section === "requiem" && c.mass === 0));
  });
});

describe("ordinarium — penitential days and the Gloria rubric", () => {
  test("a penitential Sunday sings Mass XVII and borrows the Mass II Benedicamus", () => {
    const advent1 = dayAt(2026, 11, 29);
    assert.equal(advent1.season, "adv", "fixture: the first Sunday of Advent");
    const ord = getOrdinary({ feast: advent1 });
    assert.ok(!part(ord, "gl"), "no Gloria on a penitential Sunday");
    assert.equal(part(ord, "ke")?.mass, 17, "Kyrie from Mass XVII");
    assert.equal(
      part(ord, "be")?.mass, 2,
      '"Benedicamus Domino as in Mass II" — the book\'s primary direction, not its ad libitum "or"',
    );
  });

  test("a high feast inside a penitential season keeps its Gloria", () => {
    // The Gloria follows the day's rank rubric, not the season: season-keying
    // silenced the Immaculate Conception while handing green ferias an
    // ad libitum Gloria.
    for (const y of [2026, 2027, 2028]) {
      const ord = getOrdinary({ feast: dayAt(y, 12, 8) });
      assert.ok(part(ord, "gl"), `${y}: the Immaculate Conception sings its Gloria`);
    }
  });
});

describe("ordinarium — Paschaltide is a time, not a rank", () => {
  test("an ordinary Eastertide day sings Lux et origo, never the appendix", () => {
    // 2027 caught this live: Pasc3-2 (a semiduplex Tuesday) led with
    // "Kyrie XVII C" — the Advent/Lent Kyrie, misfiled as ad libitum, boosted
    // onto an ordinary day because "paschal" sat among the solemn rubrics.
    for (const y of [2026, 2027, 2028, 2029]) {
      for (let i = 0; i < 100; i++) {
        const feasts = getFeast({ date: new Date(Date.UTC(y, 2, 22 + i)) });
        const day = feasts.find((f) => f.id === "Pasc3-2");
        if (!day) continue;
        const ord = getOrdinary({ feast: day });
        for (const c of ord) {
          assert.ok(
            !APPENDIX.test(c.incipit) && c.mass <= 18,
            `${y} Pasc3-2: "${c.incipit}" (mass ${c.mass})`,
          );
        }
        assert.equal(part(ord, "ke")?.mass, 1, `${y}: Mass I in Paschal time`);
        break;
      }
    }
  });

  test("Easter leads with Lux et origo every year", () => {
    const easters = [
      [2025, 4, 20], [2026, 4, 5], [2027, 3, 28],
      [2028, 4, 16], [2029, 4, 1], [2030, 4, 21],
    ];
    for (const [y, m, d] of easters) {
      const ky = part(getOrdinary({ feast: dayAt(y, m, d) }), "ke");
      assert.equal(ky?.mass, 1, `${y}: Easter's Kyrie is Mass I (got mass ${ky?.mass})`);
    }
  });
});

describe("ordinarium — the credo rotation", () => {
  test("every credo is sung within the twelve-year cycle — V included", () => {
    // Keying the off-year rotation on the raw year coupled its parity to the
    // two-year bias (2 divides 6): odd years could only reach III, II and VI,
    // and Credo V was never sung on any day of any year.
    const seen = new Set();
    for (let y = 2024; y < 2048; y++) {
      for (let d = 1; d <= 31; d++) {
        const day = getFeast({ date: new Date(Date.UTC(y, 0, d)) })[0];
        if (!day || day.weekday !== 0) continue;
        const cr = getOrdinary({ feast: day }).find((c) => c.ordinary === "cr");
        // WHICH credo sings is read from the incipit, the chant's own name.
        // `ordinarium` names the part — "Credo", as ORDINARIA spells it —
        // and is the same string for all six.
        if (cr) { seen.add(cr.incipit); break; }
      }
    }
    for (const n of ["I", "II", "III", "IV", "V", "VI"]) {
      assert.ok(
        seen.has(`Credo ${n}`),
        `Credo ${n} is heard (heard: ${[...seen].sort().join(", ")})`,
      );
    }
  });

  test("the part is the category, and the numeral stays in the incipit", () => {
    const day = getFeast({ date: new Date(Date.UTC(2026, 11, 25)) })[0];
    const cr = getOrdinary({ feast: day }).find((c) => c.ordinary === "cr");
    assert.ok(cr, "Christmas sings a Credo");
    assert.equal(cr.ordinarium, "Credo",
      "the part is named as ORDINARIA spells it, beside Gloria and Sanctus");
    assert.match(cr.incipit, /^Credo [IVX]+$/,
      "which of the six it is stays the chant's own name");
  });
});

describe("ordinarium — green Sundays are untouched", () => {
  test("a Sunday per annum sings a Sunday mass with Gloria and Ite", () => {
    let sun = null;
    for (let d = 1; d <= 31 && !sun; d++) {
      const day = getFeast({ date: new Date(Date.UTC(2026, 6, d)) })[0];
      if (day?.weekday === 0 && day.masses?.[0] >= 11 && day.masses?.[0] <= 15) sun = day;
    }
    assert.ok(sun, "found a green Sunday in July 2026");
    const ord = getOrdinary({ feast: sun });
    assert.ok(part(ord, "gl"), "Gloria sung");
    const it = part(ord, "it");
    assert.ok(it && it.mass >= 11 && it.mass <= 15, "Ite from the Sunday masses");
    assert.ok(!part(ord, "be"), "no Benedicamus when the Gloria is sung");
  });
});

describe("ordinarium — the door validates the code it is given", () => {
  test("an unknown ordinary code throws, and `ky` says where the Kyrie went", () => {
    // The same guard cantus carries, at the other door: the two must not
    // disagree about what a valid ordinary code is.
    assert.throws(() => getOrdinary({ ordinary: "ky" }), /unknown ordinary code/);
    assert.throws(() => getOrdinary({ ordinary: "ky" }), /The Kyrie is "ke" from 0\.10\.0/);
    assert.throws(() => getOrdinary({ ordinary: "zz" }), /unknown ordinary code/);
    assert.equal(getOrdinary({ ordinary: "ke" }).length, 31);
  });
});

describe("ordinarium — a mass number is one of the eighteen Masses", () => {
  test("only the mass section is numbered, and only I–XVIII", () => {
    for (const section of ["mass", "credo", "sprinkling", "ad-libitum", "requiem"]) {
      for (const c of getOrdinary({ section })) {
        if (section === "mass") assert.ok(c.mass >= 1 && c.mass <= 18, `${c.incipit}: mass ${c.mass}`);
        else assert.equal(c.mass, 0, `${c.incipit} (${section}) carries no mass number`);
      }
    }
  });

  test("the ad libitum Kyries VI and X are not Masses VI and X", () => {
    for (const mass of [6, 10]) {
      const kyries = getOrdinary({ mass, ordinary: "ke" });
      assert.ok(kyries.length >= 1);
      assert.ok(kyries.every((c) => !/ad lib/i.test(c.incipit)),
        `Mass ${mass}'s Kyrie: ${kyries.map((c) => c.incipit).join(", ")}`);
    }
    const appendix = getOrdinary({ section: "ad-libitum", ordinary: "ke" });
    assert.equal(appendix.length, 11, "the book prints eleven ad libitum Kyries");
  });

  test("an unknown section throws", () => {
    assert.throws(() => getOrdinary({ section: "appendix" }), /unknown section/);
  });
});

describe("ordinarium — Mass XVIII is for Vigils too", () => {
  // The book's heading runs on: "For the ferias of Advent and Lent as well as
  // for Vigils, Ember Days, and Rogation Days." tonus carried only its first
  // line, so the green-season vigils sang the ferial Mass XVI, the Vigil of
  // St John the Baptist (ranked Simplex) the commemoration Mass XV, and the
  // Vigil of the Assumption the Marian masses.
  for (const [label, y, m, d, id] of [
    ["a vigilia-graded vigil (St James)", 2020, 7, 24, "07-24"],
    ["the Vigil of St John the Baptist, ranked Simplex", 2021, 6, 23, "06-23"],
    ["the Vigil of the Assumption, ahead of the BVM rubric", 2020, 8, 14, "08-14"],
  ]) {
    test(label, () => {
      const day = dayAt(y, m, d);
      assert.equal(day.id, id, "fixture: the vigil is the day");
      assert.deepEqual(day.masses, [18]);
      assert.equal(part(getOrdinary({ feast: day }), "ke")?.mass, 18);
    });
  }

  test("inside Paschaltide the season still governs", () => {
    const day = dayAt(2020, 5, 30); // Vigil of Pentecost
    assert.equal(day.id, "Pasc6-6");
    assert.deepEqual(day.masses, [1]);
  });
});

describe("MISSAE — the names the Kyriale prints", () => {
  test("each mass carries the Liber's name, and XVI and XVII none", async () => {
    // Read from the Liber Usualis (1961), Kyriale pp. 16–62: the name each
    // mass prints in parentheses under its heading. XVI and XVII print none.
    // These were typed in by hand at the start and never checked: XVI had
    // taken XVIII's name, and XVII had taken "Salve", which is ad libitum
    // Kyrie XI — offered for XVII's Sundays, not the name of the mass.
    const { MISSAE } = await import("../dist/index.js");
    assert.deepEqual({ ...MISSAE }, {
      1: "Lux et origo",
      2: "Kyrie fons bonitatis",
      3: "Kyrie Deus sempiterne",
      4: "Cunctipotens Genitor Deus",
      5: "Kyrie magnæ Deus potentiæ",
      6: "Kyrie Rex Genitor",
      7: "Kyrie Rex splendens",
      8: "De Angelis",
      9: "Cum jubilo",
      10: "Alme Pater",
      11: "Orbis factor",
      12: "Pater cuncta",
      13: "Stelliferi Conditor orbis",
      14: "Jesu Redemptor",
      15: "Dominator Deus",
      16: null,
      17: null,
      18: "Deus Genitor alme",
    });
    assert.ok(Object.isFrozen(MISSAE));
  });
});
