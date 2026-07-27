import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { MODES } from "../dist/engines/temper/modes.js";

describe("ModeData.recitingNotes", () => {
  test("every mode has at least one reciting note", () => {
    for (let m = 1; m <= 8; m++) {
      const data = MODES.get(m);
      assert.ok(data.recitingNotes.length >= 1, `mode ${m} has no recitingNotes`);
    }
  });

  test("tenor stays represented in recitingNotes", () => {
    // `tenor` is a plain duplicate of one recitingNotes entry, not a derived
    // getter (tonus's plain-data-table convention) — this guards against the
    // two drifting apart. Not every mode's operative tenor is labeled
    // "principal" in the source (mode VI's is literally "auxiliary" per the
    // Degree Summary Table, since its final is the only true note of
    // composition) — so the invariant checked is that `tenor`'s pc appears
    // somewhere in recitingNotes, at whatever rank the source actually gives it.
    for (let m = 1; m <= 8; m++) {
      const data = MODES.get(m);
      const match = data.recitingNotes.find((rn) => rn.pc === data.tenor);
      assert.ok(match, `mode ${m}: tenor (${data.tenor}) has no matching entry in recitingNotes`);
    }
  });

  test("every reciting note pc is in [0, 11]", () => {
    for (let m = 1; m <= 8; m++) {
      const data = MODES.get(m);
      for (const rn of data.recitingNotes) {
        assert.ok(rn.pc >= 0 && rn.pc <= 11, `mode ${m}: reciting note pc ${rn.pc} out of range`);
      }
    }
  });
});
