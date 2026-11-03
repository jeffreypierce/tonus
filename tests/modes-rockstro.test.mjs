import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { MODES } from "../dist/engines/temper/modes.js";

// Rockstro's chart of the modes, Grove vol. 2 p. 342 [biblio: rockstro-grove],
// cells as printed (wikisource Page:A_Dictionary_of_Music_and_Musicians_vol_2
// .djvu/354, checked against the scan 2026-11-01). Superscripts are the
// chart's footnotes: 1 the inverted 7th · 3 the 5th above the Final ·
// 4 barely used in an Absolute Initial · 6 the lowest note of the Mode.
// `low` is the bottom of the printed Range in semitones above C3 (the compass
// examples on p. 341 put mode I at D3–D4, mode II at A2–A3, and so on).
const CHART = {
  1: { low: 2, fin: "D", dom: "A", med: "F", part: "G", con: "C1. E", init: "C1. D. F. G. A" },
  2: { low: -3, fin: "D", dom: "F", med: "E", part: "A. A3", con: "C. G", init: "A. C. D. E4. F" },
  3: { low: 4, fin: "E", dom: "C", med: "G", part: "A. B", con: "D1. F", init: "E. F. G4. C" },
  4: { low: -1, fin: "E", dom: "A", med: "G", part: "C. F", con: "D. B3", init: "C. D. E. F. G4. A4" },
  5: { low: 5, fin: "F", dom: "C", med: "A", part: "G", con: "B. D. E", init: "F. A. C" },
  6: { low: 0, fin: "F", dom: "A", med: "D", part: "C6", con: "B1. G. B♭", init: "C6. D4. F" },
  7: { low: 7, fin: "G", dom: "D", med: "C", part: "A", con: "B. E", init: "G. A4. B. C. D" },
  8: { low: 2, fin: "G", dom: "C", med: "F. A", part: "D6", con: "B. D3", init: "C1. D. F. G. A. C" },
};

const LETTER = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** One printed note, placed by the chart's own marks (see data/modes.ts). */
function place(cell, low, final) {
  const m = /^([A-G])(♭)?(\d)?$/.exec(cell.trim());
  assert.ok(m, `unreadable cell ${cell}`);
  const [, letter, flat, mark] = m;
  const pc = LETTER[letter] - (flat ? 1 : 0);
  if (mark === "3") return final + 7;
  // the pitch of this pc in [low, low + 12): an unmarked endpoint is the lower
  let p = low + ((pc - low) % 12 + 12) % 12;
  if (mark === "1") p -= 12; // the inverted 7th: the degree below the range
  return p;
}
const notes = (cells, low, final) => cells.split(".").filter((c) => c.trim())
  .map((c) => place(c, low, final));

describe("MODES.modulations — Rockstro's chart", () => {
  for (const [n, row] of Object.entries(CHART)) {
    const mode = MODES.get(Number(n));
    const final = place(row.fin, row.low, 0);

    test(`mode ${n}: every list is the chart's, one pitch per printed note`, () => {
      const { regular, conceded, initials, rareInitials } = mode.modulations;
      assert.deepEqual(regular, [row.fin, row.dom, row.med, row.part]
        .flatMap((c) => notes(c, row.low, final)), "regular");
      assert.deepEqual(conceded, notes(row.con, row.low, final), "conceded");
      assert.deepEqual(initials, notes(row.init, row.low, final), "initials");
      const rare = row.init.split(".").filter((c) => /4$/.test(c.trim()))
        .map((c) => place(c, row.low, final));
      assert.deepEqual(rareInitials, rare, "rareInitials");
    });

    test(`mode ${n}: final and tenor agree with the chart's Fin. and Dom.`, () => {
      assert.equal(mode.final, ((final % 12) + 12) % 12);
      assert.equal(mode.tenor, LETTER[row.dom]);
    });
  }
});

describe("MODES.ambitus — Rockstro's Range column", () => {
  for (const [n, row] of Object.entries(CHART)) {
    test(`mode ${n}: the range is the octave above the chart's low note`, () => {
      assert.deepEqual(MODES.get(Number(n)).ambitus, { lowest: row.low, highest: row.low + 12, span: 12 });
    });
  }
});
