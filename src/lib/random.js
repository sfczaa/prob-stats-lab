// Random number generation: a small seedable PRNG plus samplers for the
// building-block distributions. Everything takes an explicit rng() so
// simulations are reproducible in tests.

/** Mulberry32: fast 32-bit seedable PRNG, returns uniforms in [0, 1). */
export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** One standard normal draw (Box–Muller, polar-free form). */
export function sampleStdNormal(rng) {
  let u = 0
  while (u === 0) u = rng() // avoid log(0)
  const v = rng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/** One Gamma(shape, rate=1) draw via Marsaglia–Tsang; shape > 0. */
export function sampleGammaShape(shape, rng) {
  if (shape < 1) {
    // Boost trick: Gamma(a) = Gamma(a+1) · U^(1/a)
    const u = 1 - rng() // in (0, 1]
    return sampleGammaShape(shape + 1, rng) * Math.pow(u, 1 / shape)
  }
  const d = shape - 1 / 3
  const c = 1 / Math.sqrt(9 * d)
  for (;;) {
    let x, v
    do {
      x = sampleStdNormal(rng)
      v = 1 + c * x
    } while (v <= 0)
    v = v * v * v
    const u = rng()
    if (u < 1 - 0.0331 * x * x * x * x) return d * v
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v
  }
}
