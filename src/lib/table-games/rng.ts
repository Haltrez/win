/**
 * Crypto-quality randomness for the free table games.
 * Browser and Node both expose `globalThis.crypto.getRandomValues` (Node ≥ 19), so the same code runs in the
 * unit tests. Nothing here is seeded or biased: every shuffle and every wheel spin is an unbiased draw.
 */

/** Uniform integer in [0, n). Rejection sampling removes the modulo bias of a plain `% n`. */
export function randomInt(n: number): number {
  if (!Number.isInteger(n) || n <= 0) throw new Error('randomInt: n must be a positive integer');
  if (n === 1) return 0;
  const buf = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / n) * n; // largest multiple of n that fits in 32 bits
  for (;;) {
    globalThis.crypto.getRandomValues(buf);
    if (buf[0] < limit) return buf[0] % n;
  }
}

/** In-place Fisher–Yates shuffle with crypto randomness. Returns the same array for chaining. */
export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}
