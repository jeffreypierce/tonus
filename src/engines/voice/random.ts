// ---------------------------------------------------------------------------
// engines/voice/random — the blessed deterministic PRNG pair (djb2 + mulberry32)
// ---------------------------------------------------------------------------
// Determinism is a contract: same seed + same inputs → byte-identical output.
// No Math.random anywhere in the library.

/** djb2 — deterministic string → 32-bit unsigned seed. */
export function hashName(name: string): number {
  let h = 5381;
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) + h + name.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** mulberry32 — deterministic PRNG. Returns a 0..1 generator. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Signed jitter in [-amt, amt) from a generator. */
export function jitter(rng: () => number, amt: number): number {
  return (rng() * 2 - 1) * amt;
}
