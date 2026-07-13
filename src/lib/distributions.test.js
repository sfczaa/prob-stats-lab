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

  it('Uniform(0, 1)', () => {
    const p = { a: 0, b: 1 }
    expect(distributions.uniform.pdf(0.5, p)).toBe(1)
    expect(distributions.uniform.cdf(0.25, p)).toBe(0.25)
    expect(distributions.uniform.pdf(1.5, p)).toBe(0)
  })

  it('Chi-square(4)', () => {
    const p = { k: 4 }
    // pdf(2) = e^−1/2, F(2) = 1 − 2e^−1
    expect(distributions.chisq.pdf(2, p)).toBeCloseTo(0.1839397206, 8)
    expect(distributions.chisq.cdf(2, p)).toBeCloseTo(0.2642411177, 8)
  })

  it("Student's t(5)", () => {
    const p = { nu: 5 }
    // pdf(0) = Γ(3)/(√(5π)Γ(2.5))
    expect(distributions.t.pdf(0, p)).toBeCloseTo(0.37961, 4)
    expect(distributions.t.cdf(0, p)).toBeCloseTo(0.5, 10)
    // t-table: t_{0.95, 5} = 2.015
    expect(distributions.t.cdf(2.015, p)).toBeCloseTo(0.95, 3)
  })

  it('Lognormal(0, 0.5)', () => {
    const p = { mu: 0, sigma: 0.5 }
    expect(distributions.lognormal.cdf(1, p)).toBeCloseTo(0.5, 10)
    // pdf(1) = 1/(0.5·√(2π))
    expect(distributions.lognormal.pdf(1, p)).toBeCloseTo(0.7978845608, 8)
    expect(distributions.lognormal.mean(p)).toBeCloseTo(Math.exp(0.125), 10)
  })

  it('Laplace(0, 1)', () => {
    const p = { mu: 0, b: 1 }
    expect(distributions.laplace.pdf(0, p)).toBe(0.5)
    expect(distributions.laplace.cdf(1, p)).toBeCloseTo(1 - 0.5 / Math.E, 10)
    expect(distributions.laplace.cdf(-1, p)).toBeCloseTo(0.5 / Math.E, 10)
  })

  it('Rayleigh(2)', () => {
    const p = { sigma: 2 }
    // F(2) = 1 − e^−0.5, pdf(2) = 0.5·e^−0.5
    expect(distributions.rayleigh.cdf(2, p)).toBeCloseTo(0.3934693403, 8)
    expect(distributions.rayleigh.pdf(2, p)).toBeCloseTo(0.3032653299, 8)
  })

  it('Bernoulli(0.3)', () => {
    const p = { p: 0.3 }
    expect(distributions.bernoulli.pmf(1, p)).toBeCloseTo(0.3, 12)
    expect(distributions.bernoulli.pmf(0, p)).toBeCloseTo(0.7, 12)
    expect(distributions.bernoulli.cdf(0, p)).toBeCloseTo(0.7, 12)
    expect(distributions.bernoulli.cdf(1, p)).toBe(1)
  })

  it('Geometric(0.3)', () => {
    const p = { p: 0.3 }
    // 0.3 · 0.7²
    expect(distributions.geometric.pmf(3, p)).toBeCloseTo(0.147, 10)
    // 1 − 0.7³
    expect(distributions.geometric.cdf(3, p)).toBeCloseTo(0.657, 10)
    expect(distributions.geometric.pmf(0, p)).toBe(0)
  })

  it('Negative Binomial(3, 0.5)', () => {
    const p = { r: 3, p: 0.5 }
    // C(4,2)·0.5⁵
    expect(distributions.negbinomial.pmf(5, p)).toBeCloseTo(0.1875, 10)
    // I_{0.5}(3, 3) = 0.5 by symmetry
    expect(distributions.negbinomial.cdf(5, p)).toBeCloseTo(0.5, 8)
    expect(distributions.negbinomial.pmf(2, p)).toBe(0)
  })

  it('Hypergeometric(N=10, K=4, m=3)', () => {
    const p = { N: 10, K: 4, m: 3 }
    // C(4,1)C(6,2)/C(10,3) = 60/120
    expect(distributions.hypergeom.pmf(1, p)).toBeCloseTo(0.5, 10)
    // (C(6,3) + 60)/120 = 80/120
    expect(distributions.hypergeom.cdf(1, p)).toBeCloseTo(2 / 3, 10)
    expect(distributions.hypergeom.mean(p)).toBeCloseTo(1.2, 12)
  })

  it('Discrete Uniform(1, 6)', () => {
    const p = { a: 1, b: 6 }
    expect(distributions.duniform.pmf(3, p)).toBeCloseTo(1 / 6, 12)
    expect(distributions.duniform.cdf(4, p)).toBeCloseTo(4 / 6, 12)
    expect(distributions.duniform.mean(p)).toBe(3.5)
    expect(distributions.duniform.variance(p)).toBeCloseTo(35 / 12, 12)
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
      // Heavy-tailed distributions (t, Lognormal) opt out: their second
      // moment converges far outside the plotted range. The seeded sampler
      // test below still verifies their variance.
      if (!dist.testOverrides?.skipNumericVariance) {
        expect(Math.abs(num.variance - dist.variance(params))).toBeLessThan(
          0.1 * dist.variance(params) + 1e-6,
        )
      }
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
