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

test("accordatio: vis 0 leaves formants unchanged", () => {
  const v = tonus.vox("tenor");
  const plain = v.formantes("e");
  const acc = v.formantes("e", { ad: [440, 880, 1320], vis: 0 });
  assert.deepEqual(acc, plain);
});

test("accordatio: vis 1 snaps a formant onto the nearest lattice value", () => {
  const v = tonus.vox("tenor");
  const acc = v.formantes("i", { ad: [500, 1000, 2000, 3000, 4000], vis: 1 });
  for (const band of acc) {
    assert.ok([500, 1000, 2000, 3000, 4000].includes(band.freqHz));
  }
});

test("accordatio: a snapping function is accepted (interop without dependency)", () => {
  const v = tonus.vox("tenor");
  // Snap to the nearest multiple of 100 Hz — stands in for a temperament lattice.
  const snap = (hz) => Math.round(hz / 100) * 100;
  const acc = v.formantes("a", { ad: snap, vis: 1 });
  for (const band of acc) assert.equal(band.freqHz % 100, 0);
});

test("accordatio: partial vis moves partway to the lattice", () => {
  const v = tonus.vox("tenor");
  const plain = v.formantes("a")[0].freqHz;
  const half = v.formantes("a", { ad: [plain + 200], vis: 0.5 })[0].freqHz;
  assert.ok(Math.abs(half - (plain + 100)) < 1e-9);
});

test("accordatio: vis defaults to 1 (fully tuned)", () => {
  const v = tonus.vox("tenor");
  const lattice = [500, 1000, 2000, 3000, 4000];
  assert.deepEqual(
    v.formantes("i", { ad: lattice }),
    v.formantes("i", { ad: lattice, vis: 1 }),
  );
});

test("accordatio: a non-lattice ad throws with guidance", () => {
  const v = tonus.vox("tenor");
  const temperShaped = { tuning: "pythagorean" }; // not a lattice
  assert.throws(() => v.formantes("a", { ad: temperShaped }), /array of target Hz/);
  assert.throws(() => v.formantes("a", { ad: [440, NaN] }), /non-finite/);
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
