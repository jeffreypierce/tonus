import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { buildScore } from "../dist/engines/score/api.js";

function makeChant(gabc, mode = "1") {
  return {
    id: "test:1", incipit: "Test", gabc, office: "or", genus: "Ordinarium",
    mode, modus: "Modus I", pages: [], source: { book: "Test", year: null, editor: null },
  };
}

// A small ascending-then-descending line with a melismatic final syllable.
const ARCH = "(c4) A(f)scen(g)dit(a) et(g) des(f)cen(dc)dit.(cd..) (::)";

describe("prosody — melodic-interval statistics", () => {
  const p = buildScore(makeChant(ARCH)).prosody;

  test("motus classifies each adjacent motion as step / skip / leap", () => {
    const { step, skip, leap } = p.intervals.motus;
    // Every within-phrase motion is counted exactly once.
    const total = step + skip + leap;
    assert.ok(total > 0);
    // This line is mostly stepwise.
    assert.ok(step >= skip + leap);
  });

  test("maxLeap and leapRate summarize the largest and the frequency of leaps", () => {
    assert.equal(typeof p.intervals.maxLeap, "number");
    assert.ok(p.intervals.leapRate >= 0 && p.intervals.leapRate <= 1);
  });

  test("the histogram keys signed semitone intervals", () => {
    // A rising second (f→g) is +2; a falling second is −2. Both appear here.
    assert.ok(p.intervals.histogram[2] >= 1, "a rising second occurs");
    assert.ok((p.intervals.histogram[-2] ?? 0) >= 1, "a falling second occurs");
  });

  test("intervals never cross a divisio (a breath is not a leap)", () => {
    // Two phrases whose junction would be a huge interval if counted across it.
    const twoPhrase = buildScore(makeChant("(c4) a(c) (::) b(m) (::)")).prosody;
    // c→m across the divisio is ~19 semitones; it must not appear as a leap.
    assert.ok(twoPhrase.intervals.maxLeap < 12, "no interval spans the divisio");
  });
});

describe("prosody — arch, tessitura, cadential melisma", () => {
  const p = buildScore(makeChant(ARCH)).prosody;

  test("arcus reports initial, peak, final, and a signed arch index", () => {
    assert.ok(p.arcus);
    assert.equal(p.arcus.peak >= p.arcus.initial, true);
    assert.equal(p.arcus.peak >= p.arcus.final, true);
    // A rise that returns near its start reads as a positive arch.
    assert.ok(p.arcus.archIndex > 0.5);
  });

  test("tessitura is the mean height above the final, in semitones", () => {
    assert.equal(typeof p.tessitura, "number");
    // Notes sit at or above the final here, so the mean is above it.
    assert.ok(p.tessitura > 0);
  });

  test("melismaCadential averages the final syllable's note count per phrase", () => {
    // The last syllable "descendit" carries a 2-note cadence.
    assert.ok(p.melismaCadential >= 1);
  });

  test("empty score yields null arch / tessitura, not a throw", () => {
    const empty = buildScore(makeChant("")).prosody;
    assert.equal(empty.arcus, null);
    assert.equal(empty.tessitura, null);
    assert.equal(empty.intervals.maxLeap, 0);
  });
});

describe("prosody — phrase and syllable conveniences", () => {
  const score = buildScore(makeChant(ARCH));

  test("each syllable reports its melisma (note count)", () => {
    for (const phrase of score.phrases) {
      for (const syl of phrase.syllables) {
        assert.equal(syl.melisma, syl.notes.length);
      }
    }
  });

  test("each phrase reports its noteCount and syllableCount", () => {
    for (const phrase of score.phrases) {
      const sung = phrase.syllables.filter((s) => s.notes.length > 0);
      assert.equal(phrase.syllableCount, sung.length);
      assert.equal(phrase.noteCount, sung.reduce((n, s) => n + s.notes.length, 0));
    }
  });
});
