import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  pointAt, arcPath, wedgePath, uprightRotation, isLowerHalf, neighborMidpoints,
  eclipticAt, eclipticRotation,
} from "../docs/diagrams/polar.js";

// The site's ring diagrams measure in degrees clockwise from twelve o'clock.
// These pin the two things that actually broke while porting the annulus: which
// way a sweep runs, and what happens across the wrap.

describe("docs/polar — the ring geometry", () => {
  const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

  test("twelve o'clock is up, and the quarters run clockwise", () => {
    const [x0, y0] = pointAt(0, 100);
    assert.ok(near(x0, 0) && near(y0, -100), "0° is straight up");
    const [x90, y90] = pointAt(90, 100);
    assert.ok(near(x90, 100) && near(y90, 0), "90° is to the right");
    const [x180, y180] = pointAt(180, 100);
    assert.ok(near(x180, 0) && near(y180, 100), "180° is down");
    const [x270, y270] = pointAt(270, 100);
    assert.ok(near(x270, -100) && near(y270, 0), "270° is to the left");
  });

  test("a reversed sweep draws the SAME arc, not the long way round", () => {
    // The bug: reversing by swapping endpoints and adding 360 turned a
    // 48° arc into a 312° one, carrying its label half a ring away.
    const fwd = arcPath(99, 147, 176, 1);
    const rev = arcPath(99, 147, 176, 0);
    const ends = (d) => d.match(/-?\d+\.?\d*/g).slice(0, 2).concat(d.match(/-?\d+\.?\d*/g).slice(-2));
    // Same two endpoints, opposite order.
    assert.deepEqual(ends(fwd).slice(0, 2), ends(rev).slice(-2), "start ↔ end");
    assert.deepEqual(ends(fwd).slice(-2), ends(rev).slice(0, 2), "end ↔ start");
    // Neither is flagged as the long way round: 48° is a minor arc.
    assert.match(fwd, / 0 1 /, "forward: small-arc flag");
    assert.match(rev, / 0 0 /, "reversed: small-arc flag, sweep 0");
  });

  test("the large-arc flag follows the true span, including across the wrap", () => {
    // Christmas → Epiphany is expressed as 354° → 366°: a 12° arc.
    assert.match(arcPath(354, 366, 150), / 0 1 /, "12° across the wrap stays minor");
    // Pentecost → Advent is 179° — just short of major, and the flag says so.
    assert.match(arcPath(147, 326, 150), / 0 1 /, "179° is still a minor arc");
    assert.match(arcPath(0, 181, 150), / 1 1 /, "181° crosses into major");
    assert.match(arcPath(0, 200, 150), / 1 1 /, "200° reads as major");
  });

  test("upright text flips only on the ring's left half", () => {
    assert.equal(uprightRotation(0), 0);
    assert.equal(uprightRotation(45), 45);
    assert.equal(uprightRotation(180), 0, "straight down flips to upright");
    assert.equal(uprightRotation(270), 90, "nine o'clock flips — text there points left");
    assert.equal(uprightRotation(90), 90, "three o'clock does not");
    assert.equal(uprightRotation(-30), 330, "negative angles normalize");
  });

  test("the lower half is where an arc label must run backwards", () => {
    assert.equal(isLowerHalf(0), false);
    assert.equal(isLowerHalf(123), true, "PASC's midpoint");
    assert.equal(isLowerHalf(237), true, "PENT's midpoint");
    assert.equal(isLowerHalf(340), false, "ADV's midpoint");
  });

  test("neighbor midpoints close the ring across the wrap", () => {
    // Three marks at 10, 100, 300 on a 360 ring.
    const spans = neighborMidpoints([10, 100, 300], 360);
    assert.equal(spans.length, 3);
    // The first mark's wedge starts BEFORE zero — it borrows from the last.
    assert.ok(spans[0][0] < 0, "the first wedge reaches back across the wrap");
    assert.equal(spans[0][1], 55, "…and ends midway to its neighbor");
    // The last mark's wedge closes onto the first across the wrap: its forward
    // neighbor is 10, a full turn on — (300 + 10 + 360) / 2.
    assert.equal(spans[2][1], 335, "the last wedge closes across the wrap");
    // The ring is closed: the last wedge's end and the first's start are the
    // same point, one turn apart.
    assert.equal(spans[2][1] - 360, spans[0][0], "the ring meets itself");
  });

  test("a wedge closes: two arcs and a join", () => {
    const d = wedgePath(0, 30, 150, 228);
    assert.match(d, /^M /, "starts with a move");
    assert.match(d, /Z$/, "and closes");
    assert.equal((d.match(/A /g) || []).length, 2, "an outer and an inner arc");
  });

  test("the ecliptic runs the OTHER way, from three o'clock", () => {
    // The zodiac does not share the calendar ring's sense: longitude is
    // measured from the vernal point anticlockwise, and the vernal point is due
    // right. Reusing pointAt() mirrors the sky — every planet lands on the
    // wrong side of the wheel.
    const [x0, y0] = eclipticAt(0, 100);
    assert.ok(near(x0, 100) && near(y0, 0), "0° Aries is due right");
    const [x90, y90] = eclipticAt(90, 100);
    assert.ok(near(x90, 0) && near(y90, -100), "90° Cancer is at the TOP");
    const [x180, y180] = eclipticAt(180, 100);
    assert.ok(near(x180, -100) && near(y180, 0), "180° Libra is due left");

    // The Sun at 68.3° in the default epoch, on the solar sphere.
    const [sx, sy] = eclipticAt(68.3, 135);
    assert.ok(Math.abs(sx - 49.9) < 0.1, `Sol x ${sx.toFixed(1)} ≈ 49.9`);
    assert.ok(Math.abs(sy + 125.4) < 0.1, `Sol y ${sy.toFixed(1)} ≈ -125.4`);
  });

  test("ecliptic labels stay upright across the wheel", () => {
    assert.equal(eclipticRotation(0), 0, "due right reads flat");
    assert.equal(eclipticRotation(180), 0, "due left flips to upright");
    assert.equal(eclipticRotation(90), 270 - 180, "the top");
  });
});
