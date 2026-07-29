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

describe("hiatus, glides, and consonantal i (the ecclesiastical rules)", () => {
  test("ui is hiatus outside the pronoun stems", () => {
    assert.deepEqual(syllabifyWord("fuit"), ["fu", "it"]);
    assert.deepEqual(syllabifyWord("sui"), ["su", "i"]);
    assert.deepEqual(syllabifyWord("ruina"), ["ru", "i", "na"]);
  });

  test("cui and huic keep the true diphthong", () => {
    assert.deepEqual(syllabifyWord("cui"), ["cui"]);
    assert.deepEqual(syllabifyWord("huic"), ["huic"]);
  });

  test("ei is hiatus: De-i, e-le-i-son", () => {
    assert.deepEqual(syllabifyWord("Dei"), ["De", "i"]);
    assert.deepEqual(syllabifyWord("eleison"), ["e", "le", "i", "son"]);
  });

  test("intervocalic i is consonantal: e-ius, hu-ius, al-le-lu-ia, ma-ior", () => {
    assert.deepEqual(syllabifyWord("eius"), ["e", "ius"]);
    assert.deepEqual(syllabifyWord("huius"), ["hu", "ius"]);
    assert.deepEqual(syllabifyWord("cuius"), ["cu", "ius"]);
    assert.deepEqual(syllabifyWord("alleluia"), ["al", "le", "lu", "ia"]);
    assert.deepEqual(syllabifyWord("maior"), ["ma", "ior"]);
  });

  test("word-initial i before a vowel is consonantal: Ie-su", () => {
    assert.deepEqual(syllabifyWord("Iesu"), ["Ie", "su"]);
  });

  test("the ngu glide: lin-gua, san-guis — but gu elsewhere is a vowel", () => {
    assert.deepEqual(syllabifyWord("lingua"), ["lin", "gua"]);
    assert.deepEqual(syllabifyWord("sanguis"), ["san", "guis"]);
    assert.deepEqual(syllabifyWord("exiguus"), ["e", "xi", "gu", "us"]);
  });

  test("qu still swallows its u: qui-a", () => {
    assert.deepEqual(syllabifyWord("quia"), ["qui", "a"]);
  });
});
