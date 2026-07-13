import { describe, it, expect } from 'vitest'
import { distributions, distributionList, defaultParams } from './distributions.js'
import { mulberry32 } from './random.js'

// ---- Hand-checked point values ------------------------------------------

describe('point values (hand-checked)', () => {
  it('Normal', () => {
    const p = { mu: 0, sigma: 1 }
    expect(distributions.normal.pdf(0, p)).toBeCloseTo(0.3989422804, 8)
    expect(distributions.normal.cdf(1.96, p)).toBeCloseTo(0.975002, 5)
  })

  it('Binomial(5, 0.3)', () => {
    const p = { n: 5, p: 0.3 }
    // C(5,2)·0.3²·0.7³ = 10·0.09·0.343
    expect(distributions.binomial.pmf(2, p)).toBeCloseTo(0.3087, 10)
    expect(distributions.binomial.cdf(2, p)).toBeCloseTo(0.83692, 8)
    expect(distributions.binomial.cdf(-1, p)).toBe(0)
    expect(distributions.binomial.cdf(5, p)).toBe(1)
  })

  it('Poisson(2)', () => {
    const p = { lambda: 2 }
    // e^−2·2³/3!
    expect(distributions.poisson.pmf(3, p)).toBeCloseTo(0.1804470443, 8)
    // e^−2·(1 + 2 + 2 + 4/3)
    expect(distributions.poisson.cdf(3, p)).toBeCloseTo(0.8571234605, 8)
  })

  it('Exponential(1)', () => {
    const p = { lambda: 1 }
    expect(distributions.exponential.cdf(1, p)).toBeCloseTo(1 - 1 / Math.E, 10)
    expect(distributions.exponential.pdf(-0.5, p)).toBe(0)
  })

  it('Beta', () => {
    expect(distributions.beta.pdf(0.5, { alpha: 2, beta: 2 })).toBeCloseTo(1.5, 8)
    // I_0.3(2,5) = P(Bin(6, 0.3) ≥ 2) = 1 − 0.7⁶ − 6·0.3·0.7⁵
    expect(distributions.beta.cdf(0.3, { alpha: 2, beta: 5 })).toBeCloseTo(0.579825, 6)
  })

  it('Gamma(shape 2, rate 1)', () => {
    const p = { alpha: 2, rate: 1 }
    // F(2) = 1 − e^−2(1 + 2)
    expect(distributions.gamma.cdf(2, p)).toBeCloseTo(0.5939941503, 8)
  })
})

// ---- Self-consistency: pdf ↔ cdf ↔ closed-form moments -------------------
// These catch parameterization mistakes (e.g. rate vs. scale): if the pdf
// and the mean() formula disagreed about what λ means, the numeric moment
// integral would not match the closed form.

const N_GRID = 20000

function continuousChecks(dist, params) {
  const [lo, hi] = dist.range(params)
  const dx = (hi - lo) / N_GRID
  let mass = 0
  let m1 = 0
  let m2 = 0
  for (let i = 0; i < N_GRID; i++) {
    const x = lo + (i + 0.5) * dx
    const f = dist.pdf(x, params)
    mass += f * dx
    m1 += x * f * dx
    m2 += x * x * f * dx
  }
  return { mass, mean: m1, variance: m2 - m1 * m1 }
}

function discreteChecks(dist, params) {
  const [lo, hi] = dist.range(params)
  let mass = 0
  let m1 = 0
  let m2 = 0
  for (let k = lo; k <= hi; k++) {
    const f = dist.pmf(k, params)
    mass += f
    m1 += k * f
    m2 += k * k * f
  }
  return { mass, mean: m1, variance: m2 - m1 * m1 }
}

describe('self-consistency over the plotted range', () => {
  for (const dist of distributionList) {
    it(`${dist.name}: mass ≈ 1, numeric moments match formulas`, () => {
      const params = defaultParams(dist)
      const num =
        dist.kind === 'continuous'
          ? continuousChecks(dist, params)
          : discreteChecks(dist, params)
      const mean = dist.mean(params)
      const sd = Math.sqrt(dist.variance(params))
      // range() is chosen to cover ≥ 99.7% of the mass
      expect(num.mass).toBeGreaterThan(0.995)
      expect(num.mass).toBeLessThan(1.0001)
      expect(Math.abs(num.mean - mean)).toBeLessThan(0.05 * sd + 1e-6)
      expect(Math.abs(num.variance - dist.variance(params))).toBeLessThan(
        0.1 * dist.variance(params) + 1e-6,
      )
    })

    it(`${dist.name}: cdf agrees with integrated/summed density`, () => {
      const params = defaultParams(dist)
      const [lo, hi] = dist.range(params)
      const mid = (lo + hi) / 2
      if (dist.kind === 'continuous') {
        const n = 20000
        const dx = (mid - lo) / n
        let acc = 0
        for (let i = 0; i < n; i++) acc += dist.pdf(lo + (i + 0.5) * dx, params) * dx
        expect(dist.cdf(mid, params) - dist.cdf(lo, params)).toBeCloseTo(acc, 4)
      } else {
        const k = Math.floor(mid)
        let acc = 0
        for (let j = 0; j <= k; j++) acc += dist.pmf(j, params)
        expect(dist.cdf(k, params)).toBeCloseTo(acc, 8)
      }
    })

    it(`${dist.name}: cdf is monotone from ~0 to ~1`, () => {
      const params = defaultParams(dist)
      const [lo, hi] = dist.range(params)
      let prev = -Infinity
      for (let i = 0; i <= 50; i++) {
        const x = lo + ((hi - lo) * i) / 50
        const c = dist.cdf(x, params)
        expect(c).toBeGreaterThanOrEqual(prev - 1e-12)
        expect(c).toBeGreaterThanOrEqual(0)
        expect(c).toBeLessThanOrEqual(1)
        prev = c
      }
      expect(dist.cdf(hi, params)).toBeGreaterThan(0.99)
    })
  }
})

// ---- Samplers feed the CLT simulator: check their moments -----------------

describe('samplers match theoretical moments (seeded)', () => {
  const N = 40000
  for (const dist of distributionList) {
    it(`${dist.name}`, () => {
      const params = defaultParams(dist)
      const rng = mulberry32(20260713)
      let s1 = 0
      let s2 = 0
      for (let i = 0; i < N; i++) {
        const x = dist.sample(params, rng)
        s1 += x
        s2 += x * x
      }
      const mean = s1 / N
      const variance = s2 / N - mean * mean
      const tMean = dist.mean(params)
      const tVar = dist.variance(params)
      const se = Math.sqrt(tVar / N)
      expect(Math.abs(mean - tMean)).toBeLessThan(5 * se)
      expect(Math.abs(variance - tVar)).toBeLessThan(0.08 * tVar)
    })
  }
})
