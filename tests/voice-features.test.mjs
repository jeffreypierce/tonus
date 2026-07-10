import test from "node:test";
import assert from "node:assert/strict";
import tonus from "../dist/index.js";

// ── latinitas ──

test("latinitas: romana is the reference (no shift)", () => {
  const roman = tonus.vox("tenor", { latinitas: "romana" }).formantes("e");
  const base = tonus.vox("tenor").formantes("e"); // default is romana
  assert.deepEqual(roman, base);
});

test("latinitas: germanica shifts the vowel from romana", () => {
  const roman = tonus.vox("tenor", { latinitas: "romana" }).formantes("e");
  const german = tonus.vox("tenor", { latinitas: "germanica" }).formantes("e");
  assert.notDeepEqual(roman, german);
});

test("latinitas: gallica differs from both", () => {
  const roman = tonus.vox("tenor", { latinitas: "romana" }).formantes("u");
  const gallic = tonus.vox("tenor", { latinitas: "gallica" }).formantes("u");
  assert.notDeepEqual(roman, gallic);
});

// ── liquescentia ──

test("liquescentia: returns five formant targets", () => {
  const t = tonus.vox("tenor").liquescentia("a", "m");
  assert.equal(t.length, 5);
});

test("liquescentia: depth 0 equals the plain vowel", () => {
  const v = tonus.vox("tenor");
  assert.deepEqual(v.liquescentia("a", "n", 0), v.formantes("a"));
});

test("liquescentia: the m coda lowers F1 (bilabial nasal closes the mouth)", () => {
  const v = tonus.vox("tenor");
  const plain = v.formantes("a")[0].freqHz;
  const melted = v.liquescentia("a", "m", 1)[0].freqHz;
  assert.ok(melted < plain);
});

test("liquescentia: the j glide raises F2 (toward [i])", () => {
  const v = tonus.vox("tenor");
  const plain = v.formantes("a")[1].freqHz;
  const melted = v.liquescentia("a", "j", 1)[1].freqHz;
  assert.ok(melted > plain);
});

test("liquescentia: an unknown coda throws", () => {
  assert.throws(() => tonus.vox("tenor").liquescentia("a", "x"), /unknown coda/);
});

// ── accordatio ──
// The public shape: formantes(vowel, temper, vis?) — a Temperamentum only,
// vis 0 (phonetic truth) … 1 (fully tuned, default). No lattice plumbing.

test("accordatio: vis 0 leaves formants unchanged", () => {
  const v = tonus.vox("tenor");
  const temper = tonus.temperamentum({ tuning: "pythagorean" });
  assert.deepEqual(v.formantes("e", temper, 0), v.formantes("e"));
});

test("accordatio: vis 1 snaps every band onto the tuning's pitches", () => {
  const v = tonus.vox("tenor");
  const temper = tonus.temperamentum({ tuning: "pythagorean" });
  const hzSet = temper.gamut({ span: [36, 120] }).map((p) => p.hz);
  for (const band of v.formantes("i", temper, 1)) {
    assert.ok(hzSet.some((hz) => Math.abs(hz - band.freqHz) < 1e-6),
      `band ${band.freqHz} sits on the tuning`);
  }
});

test("accordatio: partial vis moves partway toward the tuning", () => {
  const v = tonus.vox("tenor");
  const temper = tonus.temperamentum({ tuning: "pythagorean" });
  const plain = v.formantes("a")[0].freqHz;
  const locked = v.formantes("a", temper, 1)[0].freqHz;
  const half = v.formantes("a", temper, 0.5)[0].freqHz;
  assert.ok(Math.abs(half - (plain + locked) / 2) < 1e-9);
});

test("accordatio: vis defaults to 1 (fully tuned)", () => {
  const v = tonus.vox("tenor");
  const temper = tonus.temperamentum({ tuning: "pythagorean" });
  assert.deepEqual(v.formantes("i", temper), v.formantes("i", temper, 1));
});

test("accordatio: a non-Temperamentum tuning throws with guidance", () => {
  const v = tonus.vox("tenor");
  assert.throws(() => v.formantes("a", { tuning: "pythagorean" }), /must be a Temperamentum/);
  assert.throws(() => v.formantes("a", [440, 880]), /must be a Temperamentum/);
  const temper = tonus.temperamentum({ tuning: "pythagorean" });
  assert.throws(() => v.formantes("a", temper, NaN), /finite 0\.\.1/);
});

test("liquescentia: formants stay ascending under every coda at full depth", () => {
  const v = tonus.vox("tenor");
  for (const vowel of ["a", "e", "i", "o", "u"]) {
    for (const coda of ["m", "n", "l", "j", "w"]) {
      const bands = v.liquescentia(vowel, coda, 1);
      for (let i = 1; i < bands.length; i++) {
        assert.ok(
          bands[i].freqHz > bands[i - 1].freqHz,
          `${vowel}/${coda}: F${i} ${bands[i - 1].freqHz} !< F${i + 1} ${bands[i].freqHz}`,
        );
      }
    }
  }
});
