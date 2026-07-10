import test from "node:test";
import assert from "node:assert/strict";
import tonus from "../dist/index.js";

test("spectrum: returns the requested number of harmonics", () => {
  const s = tonus.vox("tenor").spectrum(196, "e", 40);
  assert.equal(s.length, 40);
  for (const a of s) assert.ok(a >= 0);
});

test("spectrum: the fundamental is present and positive", () => {
  const s = tonus.vox("tenor").spectrum(196, "a", 40);
  assert.ok(s[0] > 0);
});

test("claritas: is a readable output in the audio range", () => {
  const c = tonus.vox("tenor").claritas(196, "e");
  assert.ok(c > 196 && c < 12000, `centroid ${c} out of range`);
});

test("claritas: rises with nisus (pressing brightens the voice)", () => {
  const light = tonus.vox("tenor", { nisus: 0.1 }).claritas(196, "a");
  const pressed = tonus.vox("tenor", { nisus: 0.9 }).claritas(196, "a");
  assert.ok(pressed > light, `pressed ${pressed} should exceed light ${light}`);
});

test("claritas: rises with cantoris (the ring adds high energy)", () => {
  const dull = tonus.vox("tenor", { cantoris: 0.0 }).claritas(196, "a");
  const ringing = tonus.vox("tenor", { cantoris: 1.0 }).claritas(196, "a");
  assert.ok(ringing > dull, `ringing ${ringing} should exceed dull ${dull}`);
});

test("claritas: fatigue darkens the voice", () => {
  const fresh = tonus.vox("tenor", { fatigatio: 0.0 }).claritas(196, "a");
  const tired = tonus.vox("tenor", { fatigatio: 1.0 }).claritas(196, "a");
  assert.ok(tired < fresh, `tired ${tired} should fall below fresh ${fresh}`);
});
