import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  syllabifyWord,
  syllabifyPhrase,
  selectVowel,
  detectVowelAccent,
} from "../dist/engines/chant/syllabify.js";

describe("syllabifyWord", () => {
  test("splits Dominus into Do-mi-nus", () => {
    assert.deepEqual(syllabifyWord("Dominus"), ["Do", "mi", "nus"]);
  });

  test("splits gloria into glo-ri-a", () => {
    assert.deepEqual(syllabifyWord("gloria"), ["glo", "ri", "a"]);
  });

  test("keeps ae diphthong together in Caelum", () => {
    const sylls = syllabifyWord("Caelum");
    assert.ok(!sylls.some((s) => s === "a" || s === "e"));
    assert.equal(sylls.length, 2);
  });

  test("keeps qu together as single consonant", () => {
    assert.deepEqual(syllabifyWord("quoniam"), ["quo", "ni", "am"]);
  });

  test("splits muta cum liquida with following vowel", () => {
    const sylls = syllabifyWord("patrem");
    assert.deepEqual(sylls, ["pa", "trem"]);
  });

  test("returns single-syllable words unchanged", () => {
    assert.deepEqual(syllabifyWord("rex"), ["rex"]);
    assert.deepEqual(syllabifyWord("et"), ["et"]);
  });
});

describe("syllabifyPhrase", () => {
  test("splits a phrase preserving space tokens between words", () => {
    const result = syllabifyPhrase("Dixit Dominus");
    assert.ok(result.includes(" "));
    const nonSpace = result.filter((s) => s !== " ");
    assert.ok(nonSpace.length >= 4);
  });
});

describe("selectVowel", () => {
  test("finds the accented vowel in Dóminus", () => {
    const { vowel, accent } = selectVowel("Dóminus");
    assert.equal(vowel, "o");
    assert.equal(accent, true);
  });

  test("returns the first vowel when no accent present", () => {
    const { vowel, accent } = selectVowel("rex");
    assert.equal(vowel, "e");
    assert.equal(accent, false);
  });

  test("expands ae ligature and detects accent", () => {
    const { vowel, accent } = selectVowel("cǽlum");
    assert.equal(vowel, "a");
    assert.equal(accent, true);
  });
});

describe("detectVowelAccent", () => {
  test("returns true for accented syllables", () => {
    assert.equal(detectVowelAccent("Dó"), true);
    assert.equal(detectVowelAccent("lú"), true);
  });

  test("returns false for unaccented syllables", () => {
    assert.equal(detectVowelAccent("mi"), false);
    assert.equal(detectVowelAccent("nus"), false);
  });
});
