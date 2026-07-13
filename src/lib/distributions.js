// The six MVP distributions. Each entry provides:
//   params    — slider definitions with legal ranges
//   pdf/pmf   — density (continuous) or mass (discrete)
//   cdf       — cumulative distribution
//   mean/variance — closed-form moments, with display formulas
//   range     — sensible x-range for plotting given current params
//   sample    — one random draw (for the CLT simulator)

import {
  logGamma, logChoose, regularizedGammaP, regularizedBeta, stdNormalCdf,
} from './special.js'
import { sampleStdNormal, sampleGammaShape } from './random.js'

const fmt = (v) => (Number.isInteger(v) ? String(v) : String(+v.toFixed(2)))

export const distributions = {
  normal: {
    id: 'normal',
    name: 'Normal',
    kind: 'continuous',
    tagline: 'The bell curve — symmetric, fully described by its mean and spread.',
    params: [
      { key: 'mu', label: 'Mean μ', min: -10, max: 10, step: 0.1, default: 0 },
      { key: 'sigma', label: 'Std. dev. σ', min: 0.2, max: 5, step: 0.1, default: 1 },
    ],
    notation: (p) => `X ~ N(${fmt(p.mu)}, ${fmt(p.sigma)}²)`,
    meanFormula: 'μ',
    varianceFormula: 'σ²',
    mean: (p) => p.mu,
    variance: (p) => p.sigma * p.sigma,
    pdf: (x, p) => {
      const z = (x - p.mu) / p.sigma
      return Math.exp(-0.5 * z * z) / (p.sigma * Math.sqrt(2 * Math.PI))
    },
    cdf: (x, p) => stdNormalCdf((x - p.mu) / p.sigma),
    range: (p) => [p.mu - 4 * p.sigma, p.mu + 4 * p.sigma],
    sample: (p, rng) => p.mu + p.sigma * sampleStdNormal(rng),
  },

  binomial: {
    id: 'binomial',
    name: 'Binomial',
    kind: 'discrete',
    tagline: 'Number of successes in n independent yes/no trials.',
    params: [
      { key: 'n', label: 'Trials n', min: 1, max: 100, step: 1, default: 20 },
      { key: 'p', label: 'Success prob. p', min: 0.01, max: 0.99, step: 0.01, default: 0.5 },
    ],
    notation: (p) => `X ~ Bin(${p.n}, ${fmt(p.p)})`,
    meanFormula: 'np',
    varianceFormula: 'np(1 − p)',
    mean: (p) => p.n * p.p,
    variance: (p) => p.n * p.p * (1 - p.p),
    pmf: (k, p) => {
      if (k < 0 || k > p.n || !Number.isInteger(k)) return 0
      return Math.exp(
        logChoose(p.n, k) + k * Math.log(p.p) + (p.n - k) * Math.log(1 - p.p),
      )
    },
    cdf: (x, p) => {
      const k = Math.floor(x)
      if (k < 0) return 0
      if (k >= p.n) return 1
      // F(k) = I_{1-p}(n-k, k+1)
      return regularizedBeta(1 - p.p, p.n - k, k + 1)
    },
    range: (p) => [0, p.n],
    sample: (p, rng) => {
      let s = 0
      for (let i = 0; i < p.n; i++) if (rng() < p.p) s++
      return s
    },
  },

  poisson: {
    id: 'poisson',
    name: 'Poisson',
    kind: 'discrete',
    tagline: 'Counts of rare events in a fixed window, at average rate λ.',
    params: [
      { key: 'lambda', label: 'Rate λ', min: 0.1, max: 30, step: 0.1, default: 4 },
    ],
    notation: (p) => `X ~ Poisson(${fmt(p.lambda)})`,
    meanFormula: 'λ',
    varianceFormula: 'λ',
    mean: (p) => p.lambda,
    variance: (p) => p.lambda,
    pmf: (k, p) => {
      if (k < 0 || !Number.isInteger(k)) return 0
      return Math.exp(-p.lambda + k * Math.log(p.lambda) - logGamma(k + 1))
    },
    cdf: (x, p) => {
      const k = Math.floor(x)
      if (k < 0) return 0
      // F(k) = Q(k+1, λ) = 1 − P(k+1, λ)
      return 1 - regularizedGammaP(k + 1, p.lambda)
    },
    range: (p) => [0, Math.max(10, Math.ceil(p.lambda + 4 * Math.sqrt(p.lambda)))],
    sample: (p, rng) => {
      // Knuth's product method (fine for λ ≤ 30)
      const L = Math.exp(-p.lambda)
      let k = 0
      let prod = rng()
      while (prod > L) {
        k++
        prod *= rng()
      }
      return k
    },
  },

  exponential: {
    id: 'exponential',
    name: 'Exponential',
    kind: 'continuous',
    tagline: 'Waiting time until the next event — memoryless and right-skewed.',
    params: [
      { key: 'lambda', label: 'Rate λ', min: 0.2, max: 5, step: 0.1, default: 1 },
    ],
    notation: (p) => `X ~ Exp(${fmt(p.lambda)})`,
    meanFormula: '1/λ',
    varianceFormula: '1/λ²',
    mean: (p) => 1 / p.lambda,
    variance: (p) => 1 / (p.lambda * p.lambda),
    pdf: (x, p) => (x < 0 ? 0 : p.lambda * Math.exp(-p.lambda * x)),
    cdf: (x, p) => (x < 0 ? 0 : 1 - Math.exp(-p.lambda * x)),
    range: (p) => [0, 6 / p.lambda],
    sample: (p, rng) => -Math.log(1 - rng()) / p.lambda,
  },

  beta: {
    id: 'beta',
    name: 'Beta',
    kind: 'continuous',
    tagline: 'A flexible distribution on [0, 1] — the workhorse for proportions.',
    params: [
      { key: 'alpha', label: 'Shape α', min: 0.5, max: 10, step: 0.1, default: 2 },
      { key: 'beta', label: 'Shape β', min: 0.5, max: 10, step: 0.1, default: 5 },
    ],
    notation: (p) => `X ~ Beta(${fmt(p.alpha)}, ${fmt(p.beta)})`,
    meanFormula: 'α/(α + β)',
    varianceFormula: 'αβ / [(α+β)²(α+β+1)]',
    mean: (p) => p.alpha / (p.alpha + p.beta),
    variance: (p) => {
      const s = p.alpha + p.beta
      return (p.alpha * p.beta) / (s * s * (s + 1))
    },
    pdf: (x, p) => {
      if (x <= 0 || x >= 1) return 0
      const logB = logGamma(p.alpha) + logGamma(p.beta) - logGamma(p.alpha + p.beta)
      return Math.exp(
        (p.alpha - 1) * Math.log(x) + (p.beta - 1) * Math.log(1 - x) - logB,
      )
    },
    cdf: (x, p) => regularizedBeta(x, p.alpha, p.beta),
    range: () => [0, 1],
    sample: (p, rng) => {
      const x = sampleGammaShape(p.alpha, rng)
      const y = sampleGammaShape(p.beta, rng)
      return x / (x + y)
    },
  },

  gamma: {
    id: 'gamma',
    name: 'Gamma',
    kind: 'continuous',
    tagline: 'Waiting time until the α-th event; generalizes the Exponential.',
    params: [
      { key: 'alpha', label: 'Shape α', min: 0.5, max: 20, step: 0.1, default: 2 },
      { key: 'rate', label: 'Rate λ', min: 0.2, max: 5, step: 0.1, default: 1 },
    ],
    notation: (p) => `X ~ Gamma(${fmt(p.alpha)}, ${fmt(p.rate)})`,
    meanFormula: 'α/λ',
    varianceFormula: 'α/λ²',
    mean: (p) => p.alpha / p.rate,
    variance: (p) => p.alpha / (p.rate * p.rate),
    pdf: (x, p) => {
      if (x <= 0) return 0
      return Math.exp(
        p.alpha * Math.log(p.rate) + (p.alpha - 1) * Math.log(x) -
        p.rate * x - logGamma(p.alpha),
      )
    },
    cdf: (x, p) => (x <= 0 ? 0 : regularizedGammaP(p.alpha, p.rate * x)),
    range: (p) => {
      const sd = Math.sqrt(p.alpha) / p.rate
      return [0, p.alpha / p.rate + 4.5 * sd]
    },
    sample: (p, rng) => sampleGammaShape(p.alpha, rng) / p.rate,
  },
}

export const distributionList = Object.values(distributions)

/** Default parameter values as a {key: value} object. */
export function defaultParams(dist) {
  return Object.fromEntries(dist.params.map((p) => [p.key, p.default]))
}

/** Grid of {x, pdf, cdf} points for plotting a continuous distribution. */
export function continuousCurve(dist, params, nPoints = 241) {
  const [lo, hi] = dist.range(params)
  const pts = []
  for (let i = 0; i <= nPoints; i++) {
    // avoid exact endpoints where Beta/Gamma densities can blow up
    const t = (i + 0.5) / (nPoints + 1)
    const x = lo + t * (hi - lo)
    pts.push({ x, pdf: dist.pdf(x, params), cdf: dist.cdf(x, params) })
  }
  return pts
}

/** Array of {x, pmf, cdf} for each integer point of a discrete distribution. */
export function discretePoints(dist, params) {
  const [lo, hi] = dist.range(params)
  const pts = []
  for (let k = lo; k <= hi; k++) {
    pts.push({ x: k, pmf: dist.pmf(k, params), cdf: dist.cdf(k, params) })
  }
  return pts
}
