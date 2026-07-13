// Discrete distributions — same contract as dists-continuous.js, with pmf
// in place of pdf. Supports are integer ranges given by range().

import { logGamma, logChoose, regularizedGammaP, regularizedBeta } from './special.js'
import { fmtParam as fmt } from './format.js'

export const discreteDistributions = {
  bernoulli: {
    id: 'bernoulli',
    name: 'Bernoulli',
    kind: 'discrete',
    tagline: 'A single yes/no trial — the atom of discrete probability.',
    params: [
      { key: 'p', label: 'Success prob. p', min: 0.01, max: 0.99, step: 0.01, default: 0.3 },
    ],
    notation: (p) => `X ~ Ber(${fmt(p.p)})`,
    mean: (p) => p.p,
    variance: (p) => p.p * (1 - p.p),
    pmf: (k, p) => (k === 0 ? 1 - p.p : k === 1 ? p.p : 0),
    cdf: (x, p) => (x < 0 ? 0 : x < 1 ? 1 - p.p : 1),
    range: () => [0, 1],
    sample: (p, rng) => (rng() < p.p ? 1 : 0),
    formulas: {
      mean: 'p',
      variance: 'p(1-p)',
      mle: ['\\hat p = \\bar X'],
      mme: ['\\hat p = \\bar X'],
    },
  },

  binomial: {
    id: 'binomial',
    name: 'Binomial',
    kind: 'discrete',
    tagline: 'Number of successes in m independent yes/no trials.',
    params: [
      { key: 'n', label: 'Trials m', min: 1, max: 100, step: 1, default: 20 },
      { key: 'p', label: 'Success prob. p', min: 0.01, max: 0.99, step: 0.01, default: 0.5 },
    ],
    notation: (p) => `X ~ Bin(${p.n}, ${fmt(p.p)})`,
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
      // F(k) = I_{1-p}(m-k, k+1)
      return regularizedBeta(1 - p.p, p.n - k, k + 1)
    },
    range: (p) => [0, p.n],
    sample: (p, rng) => {
      let s = 0
      for (let i = 0; i < p.n; i++) if (rng() < p.p) s++
      return s
    },
    formulas: {
      mean: 'mp',
      variance: 'mp(1-p)',
      mle: ['\\hat p = \\bar X / m'],
      mleNote: 'Number of trials m treated as known.',
      mme: ['\\hat p = \\bar X / m'],
    },
  },

  geometric: {
    id: 'geometric',
    name: 'Geometric',
    kind: 'discrete',
    tagline: 'Trials until the first success — memoryless in discrete time.',
    params: [
      { key: 'p', label: 'Success prob. p', min: 0.05, max: 0.95, step: 0.01, default: 0.3 },
    ],
    notation: (p) => `X ~ Geom(${fmt(p.p)})`,
    mean: (p) => 1 / p.p,
    variance: (p) => (1 - p.p) / (p.p * p.p),
    pmf: (k, p) => {
      if (k < 1 || !Number.isInteger(k)) return 0
      return p.p * Math.pow(1 - p.p, k - 1)
    },
    cdf: (x, p) => {
      const k = Math.floor(x)
      return k < 1 ? 0 : 1 - Math.pow(1 - p.p, k)
    },
    range: (p) => {
      const sd = Math.sqrt(1 - p.p) / p.p
      return [1, Math.max(5, Math.ceil(1 / p.p + 6.5 * sd))]
    },
    sample: (p, rng) => Math.floor(Math.log(1 - rng()) / Math.log(1 - p.p)) + 1,
    formulas: {
      mean: '1/p',
      variance: '\\tfrac{1-p}{p^2}',
      mle: ['\\hat p = 1/\\bar X'],
      mme: ['\\hat p = 1/\\bar X'],
    },
  },

  negbinomial: {
    id: 'negbinomial',
    name: 'Negative Binomial',
    kind: 'discrete',
    tagline: 'Trials until the r-th success — a sum of r Geometrics.',
    params: [
      { key: 'r', label: 'Successes r', min: 1, max: 10, step: 1, default: 3 },
      { key: 'p', label: 'Success prob. p', min: 0.1, max: 0.95, step: 0.01, default: 0.5 },
    ],
    notation: (p) => `X ~ NB(${p.r}, ${fmt(p.p)})`,
    mean: (p) => p.r / p.p,
    variance: (p) => (p.r * (1 - p.p)) / (p.p * p.p),
    pmf: (k, p) => {
      if (k < p.r || !Number.isInteger(k)) return 0
      return Math.exp(
        logChoose(k - 1, p.r - 1) + p.r * Math.log(p.p) + (k - p.r) * Math.log(1 - p.p),
      )
    },
    cdf: (x, p) => {
      const k = Math.floor(x)
      if (k < p.r) return 0
      // P(X ≤ k) = I_p(r, k − r + 1)
      return regularizedBeta(p.p, p.r, k - p.r + 1)
    },
    range: (p) => {
      const sd = Math.sqrt(p.r * (1 - p.p)) / p.p
      return [p.r, Math.max(p.r + 4, Math.ceil(p.r / p.p + 5.5 * sd))]
    },
    sample: (p, rng) => {
      let total = 0
      for (let i = 0; i < p.r; i++) {
        total += Math.floor(Math.log(1 - rng()) / Math.log(1 - p.p)) + 1
      }
      return total
    },
    formulas: {
      mean: 'r/p',
      variance: '\\tfrac{r(1-p)}{p^2}',
      mle: ['\\hat p = r/\\bar X'],
      mleNote: 'r treated as known; with r unknown the MLE has no closed form.',
      mme: ['\\hat p = \\tfrac{\\bar X}{\\bar X + S_n^2}', '\\hat r = \\hat p\\,\\bar X'],
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
    formulas: {
      mean: '\\lambda',
      variance: '\\lambda',
      mle: ['\\hat\\lambda = \\bar X'],
      mme: ['\\hat\\lambda = \\bar X'],
    },
  },

  hypergeom: {
    id: 'hypergeom',
    name: 'Hypergeometric',
    kind: 'discrete',
    tagline: 'Successes when drawing m items without replacement.',
    params: [
      { key: 'N', label: 'Population N', min: 20, max: 200, step: 1, default: 50 },
      { key: 'K', label: 'Successes K', min: 1, max: 200, step: 1, default: 20 },
      { key: 'm', label: 'Draws m', min: 1, max: 200, step: 1, default: 10 },
    ],
    clamp: (p) => ({ ...p, K: Math.min(p.K, p.N), m: Math.min(p.m, p.N) }),
    notation: (p) => `X ~ HG(${p.N}, ${p.K}, ${p.m})`,
    mean: (p) => (p.m * p.K) / p.N,
    variance: (p) => {
      const q = p.K / p.N
      return p.m * q * (1 - q) * ((p.N - p.m) / (p.N - 1))
    },
    pmf: (k, p) => {
      const lo = Math.max(0, p.m + p.K - p.N)
      const hi = Math.min(p.m, p.K)
      if (k < lo || k > hi || !Number.isInteger(k)) return 0
      return Math.exp(
        logChoose(p.K, k) + logChoose(p.N - p.K, p.m - k) - logChoose(p.N, p.m),
      )
    },
    cdf(x, p) {
      const k = Math.floor(x)
      const lo = Math.max(0, p.m + p.K - p.N)
      if (k < lo) return 0
      let acc = 0
      for (let j = lo; j <= Math.min(k, Math.min(p.m, p.K)); j++) acc += this.pmf(j, p)
      return Math.min(1, acc)
    },
    range: (p) => [Math.max(0, p.m + p.K - p.N), Math.min(p.m, p.K)],
    sample: (p, rng) => {
      let succ = p.K
      let total = p.N
      let s = 0
      for (let i = 0; i < p.m; i++) {
        if (rng() < succ / total) {
          s++
          succ--
        }
        total--
      }
      return s
    },
    formulas: {
      mean: 'm\\tfrac{K}{N}',
      variance: 'm\\tfrac{K}{N}\\Bigl(1-\\tfrac{K}{N}\\Bigr)\\tfrac{N-m}{N-1}',
      mle: [],
      mleNote: 'With N and m known, the MLE of K is an integer search; for a single observation it is ⌊(N+1)X/m⌋.',
      mme: ['\\hat K = N\\bar X/m'],
    },
  },

  duniform: {
    id: 'duniform',
    name: 'Discrete Uniform',
    kind: 'discrete',
    tagline: 'Equal mass on the integers a,…,b — a fair die is U{1, 6}.',
    params: [
      { key: 'a', label: 'Lower a', min: -10, max: 20, step: 1, default: 1 },
      { key: 'b', label: 'Upper b', min: -10, max: 20, step: 1, default: 6 },
    ],
    clamp: (p, changed) => {
      if (p.b < p.a) {
        if (changed === 'a') return { ...p, b: p.a }
        return { ...p, a: p.b }
      }
      return p
    },
    notation: (p) => `X ~ U{${p.a}, …, ${p.b}}`,
    mean: (p) => (p.a + p.b) / 2,
    variance: (p) => {
      const m = p.b - p.a + 1
      return (m * m - 1) / 12
    },
    pmf: (k, p) =>
      k >= p.a && k <= p.b && Number.isInteger(k) ? 1 / (p.b - p.a + 1) : 0,
    cdf: (x, p) => {
      const k = Math.floor(x)
      if (k < p.a) return 0
      if (k >= p.b) return 1
      return (k - p.a + 1) / (p.b - p.a + 1)
    },
    range: (p) => [p.a, p.b],
    sample: (p, rng) => p.a + Math.floor(rng() * (p.b - p.a + 1)),
    formulas: {
      mean: '\\tfrac{a+b}{2}',
      variance: '\\tfrac{(b-a+1)^2-1}{12}',
      mle: ['\\hat a = X_{(1)}', '\\hat b = X_{(n)}'],
      mme: ['\\hat a,\\hat b = \\bar X \\mp \\tfrac{\\sqrt{12 S_n^2+1}-1}{2}'],
    },
  },
}
