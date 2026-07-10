import test from "node:test";
import assert from "node:assert/strict";
import tonus from "../dist/index.js";

test("vox: a corner vowel returns five formants", () => {
  const f = tonus.vox("tenor").formantes("a");
  assert.equal(f.length, 5);
  for (const band of f) {
    assert.ok(band.freqHz > 0);
    assert.ok(band.q > 0);
    assert.ok(band.gain > 0);
  }
});

test("vox: each cardinal vowel round-trips to its own table shape", () => {
  const v = tonus.vox("tenor");
  const F1 = (vow) => v.formantes(vow)[0].freqHz;
  const F2 = (vow) => v.formantes(vow)[1].freqHz;
  // Open /a/ has by far the highest F1; close /i/,/u/ the lowest.
  assert.ok(F1("a") > F1("i") * 1.8, `/a/ F1 ${F1("a")} not open vs /i/ ${F1("i")}`);
  assert.ok(F1("a") > F1("u") * 1.8, `/a/ F1 ${F1("a")} not open vs /u/ ${F1("u")}`);
  // Front /i/,/e/ have high F2; back /o/,/u/ have low F2.
  assert.ok(F2("i") > 2000 && F2("e") > 1800, "front vowels lack high F2");
  assert.ok(F2("o") < 1100 && F2("u") < 1100, "back vowels lack low F2");
  // All five F1s are distinct (the plane isn't collapsing vowels together).
  const f1s = ["a", "e", "i", "o", "u"].map(F1);
  assert.equal(new Set(f1s.map((x) => Math.round(x))).size, 5);
});

test("vox: formants are ordered by ascending frequency", () => {
  const f = tonus.vox("tenor").formantes("i");
  for (let i = 1; i < f.length; i++) {
    assert.ok(f[i].freqHz > f[i - 1].freqHz);
  }
});

test("vox: an unknown persona throws with guidance", () => {
  assert.throws(() => tonus.vox("nope"), /unknown persona/);
});

test("vox: a non-vowel argument throws", () => {
  assert.throws(() => tonus.vox("tenor").formantes("z"), /not a vowel/);
});

test("vox: preset + override resolves onto the slider bank", () => {
  const v = tonus.vox("tenor", { nisus: 0.7, fatigatio: 0.4 });
  assert.equal(v.params.nisus, 0.7);
  assert.equal(v.params.fatigatio, 0.4);
  assert.equal(v.params.tract, 1.02); // tenor tract survives the override
});

test("vox: a larger tract lowers formant frequencies", () => {
  const bass = tonus.vox("bassus").formantes("a");
  const treble = tonus.vox("puer").formantes("a");
  assert.ok(bass[0].freqHz < treble[0].freqHz);
});

test("vox: locus of a cardinal vowel is its plane coordinate", () => {
  const l = tonus.vox("tenor").locus("i");
  assert.deepEqual(l, { u: 1.0, v: 0.5 });
});

test("vox: iter midpoint sits between the two vowels' formants", () => {
  const v = tonus.vox("tenor");
  const a = v.formantes("a")[0].freqHz;
  const i = v.formantes("i")[0].freqHz;
  const mid = v.iter("a", "i", 0.5)[0].freqHz;
  const lo = Math.min(a, i);
  const hi = Math.max(a, i);
  assert.ok(mid >= lo && mid <= hi, `${mid} not within [${lo}, ${hi}]`);
});

test("vox: iter endpoints equal the plain vowels", () => {
  const v = tonus.vox("tenor");
  assert.deepEqual(v.iter("a", "i", 0), v.formantes("a"));
  assert.deepEqual(v.iter("a", "i", 1), v.formantes("i"));
});

test("vox: an arbitrary plane point returns five formants", () => {
  const f = tonus.vox("tenor").formantes({ u: 0.3, v: 0.7 });
  assert.equal(f.length, 5);
});

test("vox: vetus modifier raises age", () => {
  assert.ok(tonus.vox("vetus").params.aetas > tonus.vox("tenor").params.aetas);
});

test("vox: identical inputs produce byte-identical formants", () => {
  assert.deepEqual(
    tonus.vox("tenor", { fatigatio: 0.4 }).formantes("e"),
    tonus.vox("tenor", { fatigatio: 0.4 }).formantes("e"),
  );
});
