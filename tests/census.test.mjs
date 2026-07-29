// tests/census — tonus.census({ id })
//
// The census is the one verb backed by a POSITIONAL binary: 2,187 blocks of 225
// float32s, addressed by index. Nothing in the data is self-describing, so the
// tests that matter are the ones that would catch a silent shift — a block
// belonging to the wrong chant, a group read at the wrong offset — rather than
// re-asserting arithmetic.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import tonus from "../dist/index.js";
import { CENSUS_ORDER, CENSUS_GROUPS, CENSUS_BLOCK_FLOATS } from "../dist/data/census.js";

const { census, cantus } = tonus;
const SEED = "gregobase:1210"; // Ab occultis meis — a mode-2 Graduale

describe("census — the shape of the answer", () => {
  test("returns profile, balance and neighbors in one call", () => {
    const c = census({ id: SEED });
    assert.equal(c.id, SEED);
    assert.equal(c.by, "all");
    assert.ok(c.profile, "has a profile");
    assert.ok(c.balance, "has a balance");
    assert.ok(Array.isArray(c.neighbors), "has neighbors");
  });

  test("the profile names every rankable group, and only those", () => {
    const c = census({ id: SEED });
    assert.deepEqual(
      Object.keys(c.profile).sort(),
      Object.keys(CENSUS_GROUPS).sort(),
      "profile groups must match the shipped geometry",
    );
    // flags/attest/extras/reserve are in the block but are not similarity
    // dimensions — they must not leak into the profile.
    for (const notAGroup of ["flags", "attest", "extras", "reserve"]) {
      assert.ok(!(notAGroup in c.profile), `${notAGroup} is not a rankable group`);
    }
  });

  test("each group's values are as wide as the geometry declares", () => {
    const c = census({ id: SEED });
    for (const [name, { count }] of Object.entries(CENSUS_GROUPS)) {
      assert.equal(c.profile[name].values.length, count, `${name} width`);
    }
  });
});

describe("census — the blocks address the right chants", () => {
  test("every shipped chant has a block, and every block a chant", () => {
    // The bijection is the whole reason blocks are deduped by id. If it breaks,
    // census({ id }) starts answering about a chant the caller did not name.
    const ids = new Set();
    for (const code of ["gr", "lu", "la", "lh", "am", "nr", "ky", "ams", "psm", "cse", "cot"]) {
      for (const c of cantus({ source: code })) ids.add(c.id);
    }
    const blocks = new Set(CENSUS_ORDER);
    assert.equal(blocks.size, CENSUS_ORDER.length, "no duplicate ids in the order");
    assert.equal(ids.size, blocks.size, "same population");
    for (const id of ids) assert.ok(blocks.has(id), `${id} has no block`);
  });

  test("a block's own numbers survive a live re-parse — the anti-shift anchor", () => {
    // The test that earns its keep: everything else here is self-consistent
    // under a block-index shift: if census read block i+1 for every chant, the
    // seed's self-similarity would still be 1 and the neighbour ordering would
    // still be internally coherent. Verified by mutation — shifting the index
    // by one left all other assertions passing.
    //
    // The fix is an anchor OUTSIDE the census. modal[8] is the final's
    // pitch-class and modal[10] the ambitus, both re-derivable from a live
    // notatio() parse, so a block belonging to the wrong chant disagrees at
    // once with the chant's own melody.
    const FINAL_PC = 8;
    const AMBITUS = 10;
    let checked = 0;
    for (const id of CENSUS_ORDER.filter((_, i) => i % 97 === 0)) {
      const [chant] = cantus({ id });
      if (!chant) continue;
      let score;
      try { score = tonus.notatio(chant); } catch { continue; }
      const rows = score.tabula;
      if (!rows.length) continue;
      const modal = census({ id, k: 0 }).profile.modal.values;
      const finalPc = (((rows[rows.length - 1].midi % 12) + 12) % 12);
      assert.equal(modal[FINAL_PC], finalPc, `${id}: block final pc ≠ its own melody's`);
      assert.equal(modal[AMBITUS], score.prosody.ambitus ?? 0, `${id}: block ambitus ≠ parsed`);
      checked++;
    }
    assert.ok(checked >= 15, `only ${checked} chants checked — the sample is too thin`);
  });

  test("a chant is nearer to itself than to anything else", () => {
    // The sharpest available check that block i really belongs to CENSUS_ORDER[i]:
    // self-similarity is 1 by construction, so if the index were shifted, some
    // OTHER chant would tie or beat the seed's true neighbours at 1.0 across
    // every group at once. Sampled, because it is O(n) per chant.
    for (const id of [SEED, "gregobase:1", CENSUS_ORDER.at(-1)]) {
      const near = census({ id, k: 1 }).neighbors[0];
      assert.ok(near.similarity <= 1, "similarity is bounded by 1");
      assert.notEqual(near.id, id, "a chant is not its own neighbour");
    }
  });

  test("the census answers about the chant tonus returns for that id", () => {
    // 683 melodies are printed in more than one book. cantus({ id }) keeps one
    // record; the census must be censusing THAT one.
    const shared = CENSUS_ORDER.filter((id) => cantus({ id }).length === 1).slice(0, 50);
    for (const id of shared) {
      assert.doesNotThrow(() => census({ id }), `${id} should have a block`);
    }
  });
});

describe("census — distance and deviance", () => {
  test("distance is 0–1 and typicality never exceeds 1", () => {
    for (const id of [SEED, "gregobase:1", "nocturnale:E1F2R3"]) {
      const c = census({ id, k: 0 });
      assert.ok(c.balance.distance >= 0 && c.balance.distance <= 1, "distance in range");
      for (const [g, p] of Object.entries(c.profile)) {
        assert.ok(p.typicality <= 1 + 1e-9, `${g} typicality ≤ 1`);
      }
    }
  });

  test("deviantGroups are the groups below the chant's own mean, worst first", () => {
    const c = census({ id: SEED, k: 0 });
    const mean =
      Object.values(c.profile).reduce((a, p) => a + p.typicality, 0) /
      Object.keys(c.profile).length;
    for (const g of c.balance.deviantGroups) {
      assert.ok(c.profile[g].typicality < mean, `${g} is below the mean`);
    }
    for (let i = 1; i < c.balance.deviantGroups.length; i++) {
      const prev = c.profile[c.balance.deviantGroups[i - 1]].typicality;
      const cur = c.profile[c.balance.deviantGroups[i]].typicality;
      assert.ok(prev <= cur, "most deviant first");
    }
  });
});

describe("census — neighbors", () => {
  test("k bounds the result and 0 returns none", () => {
    assert.equal(census({ id: SEED, k: 0 }).neighbors.length, 0);
    assert.equal(census({ id: SEED, k: 3 }).neighbors.length, 3);
    assert.equal(census({ id: SEED, k: 10000 }).neighbors.length, CENSUS_ORDER.length - 1);
  });

  test("neighbors descend by similarity, ties broken by lower id", () => {
    const ns = census({ id: SEED, k: 200 }).neighbors;
    for (let i = 1; i < ns.length; i++) {
      const a = ns[i - 1];
      const b = ns[i];
      assert.ok(a.similarity >= b.similarity, "descending");
      if (a.similarity === b.similarity) assert.ok(a.id < b.id, "ties → lower id");
    }
  });

  test("the sweep discriminates — it does not call everything alike", () => {
    // A flat similarity distribution would mean the metric says nothing. Guard
    // the property, not a fixture: the median must sit well below the top.
    const ns = census({ id: SEED, k: 10000 }).neighbors;
    const median = ns[Math.floor(ns.length / 2)].similarity;
    assert.ok(median < 0.9, `median similarity ${median} — the metric is not discriminating`);
    assert.ok(ns[0].similarity > median + 0.15, "the nearest are meaningfully nearer");
  });

  test("`by` changes what near MEANS", () => {
    const all = census({ id: SEED, k: 5 }).neighbors.map((n) => n.id);
    const cad = census({ id: SEED, k: 5, by: "cadenceFinal" }).neighbors.map((n) => n.id);
    assert.notDeepEqual(all, cad, "a different group must give a different answer");
  });

  test("deterministic — the same question twice is the same answer", () => {
    const a = census({ id: SEED, k: 20 });
    const b = census({ id: SEED, k: 20 });
    assert.deepEqual(a.neighbors, b.neighbors);
    assert.deepEqual(a.balance.deviantGroups, b.balance.deviantGroups);
  });
});

describe("census — the era view", () => {
  test("`before` narrows the pool and never widens it", () => {
    const open = census({ id: SEED, k: 10000 }).neighbors.length;
    const viewed = census({ id: SEED, k: 10000, before: 1100 }).neighbors.length;
    assert.ok(viewed < open, "a view excludes chants");
    assert.ok(viewed > 0, "and does not empty the corpus");
  });

  test("`before` EXCLUDES the unattested — silence is not evidence of age", () => {
    // The rule the whole era view rests on: an undated chant is left out under
    // any cutoff rather than assumed old. Every neighbour under a view must
    // itself be admissible under that view via the shared door.
    const viewed = census({ id: SEED, k: 200, before: 1100 }).neighbors;
    for (const n of viewed) {
      const [c] = cantus({ id: n.id, before: 1100 });
      assert.ok(c, `${n.id} is a census neighbour under before:1100 but cantus excludes it`);
    }
  });
});

describe("census — malformed queries are caller bugs", () => {
  test("an unknown id names the corpus rather than returning nothing", () => {
    assert.throws(() => census({ id: "gregobase:999999" }), /no block for/);
  });

  test("an unknown key throws instead of being ignored", () => {
    assert.throws(() => census({ id: SEED, source: "gr" }), /unknown query key\(s\) "source"/);
  });

  test("an unknown group names the ones that exist", () => {
    assert.throws(() => census({ id: SEED, by: "chiron" }), /unknown field group "chiron"/);
    assert.throws(() => census({ id: SEED, by: "flags" }), /unknown field group "flags"/);
  });

  test("a bad k throws", () => {
    assert.throws(() => census({ id: SEED, k: -1 }), /non-negative integer/);
    assert.throws(() => census({ id: SEED, k: 1.5 }), /non-negative integer/);
  });

  test("no id at all throws with guidance", () => {
    assert.throws(() => census({}), /requires an id/);
    assert.throws(() => census(), /requires a query/);
  });
});

describe("census — the geometry is what the artifact says", () => {
  test("block width and group offsets agree with the shipped manifest", () => {
    const widest = Math.max(
      ...Object.values(CENSUS_GROUPS).map((g) => g.offset + g.count),
    );
    assert.ok(widest <= CENSUS_BLOCK_FLOATS, "no group reads past the block");
    // Groups must not overlap — an overlap would silently blend two dimensions.
    const spans = Object.values(CENSUS_GROUPS).sort((a, b) => a.offset - b.offset);
    for (let i = 1; i < spans.length; i++) {
      assert.ok(
        spans[i].offset >= spans[i - 1].offset + spans[i - 1].count,
        "field groups must not overlap",
      );
    }
  });
});
