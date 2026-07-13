// Continuous distributions. Each entry provides:
//   params      — slider definitions with legal ranges (+ optional clamp)
//   pdf, cdf    — density and cumulative distribution
//   mean/variance — closed-form moments
//   range       — sensible x-range for plotting given current params
//   sample      — one random draw (for the CLT simulator)
//   formulas    — KaTeX strings: moments, MLE and MME for an iid sample
//
// Convention in formulas: S_n^2 = (1/n)Σ(X_i − X̄)², ψ = digamma.

import { logGamma, regularizedGammaP, regularizedBeta, stdNormalCdf } from './special.js'
import { sampleStdNormal, sampleGammaShape } from './random.js'
import { fmtParam as fmt } from './format.js'

export const continuousDistributions = {
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
    mean: (p) => p.mu,
    variance: (p) => p.sigma * p.sigma,
    pdf: (x, p) => {
      const z = (x - p.mu) / p.sigma
      return Math.exp(-0.5 * z * z) / (p.sigma * Math.sqrt(2 * Math.PI))
    },
    cdf: (x, p) => stdNormalCdf((x - p.mu) / p.sigma),
    range: (p) => [p.mu - 4 * p.sigma, p.mu + 4 * p.sigma],
    sample: (p, rng) => p.mu + p.sigma * sampleStdNormal(rng),
    formulas: {
      mean: '\\mu',
      variance: '\\sigma^2',
      mle: ['\\hat\\mu = \\bar X', '\\hat\\sigma^2 = \\tfrac{1}{n}\\sum_{i=1}^{n}(X_i-\\bar X)^2 = S_n^2'],
      mme: ['\\hat\\mu = \\bar X', '\\hat\\sigma^2 = S_n^2'],
    },
  },

  uniform: {
    id: 'uniform',
    name: 'Uniform',
    kind: 'continuous',
    tagline: 'Equal density on [a, b] — the MLE sits on the sample extremes.',
    params: [
      { key: 'a', label: 'Lower a', min: -10, max: 10, step: 0.1, default: 0 },
      { key: 'b', label: 'Upper b', min: -10, max: 10, step: 0.1, default: 1 },
    ],
    clamp: (p, changed) => {
      if (p.b < p.a + 0.2) {
        if (changed === 'a') return { ...p, b: +(p.a + 0.2).toFixed(1) }
        return { ...p, a: +(p.b - 0.2).toFixed(1) }
      }
      return p
    },
    notation: (p) => `X ~ U(${fmt(p.a)}, ${fmt(p.b)})`,
    mean: (p) => (p.a + p.b) / 2,
    variance: (p) => ((p.b - p.a) * (p.b - p.a)) / 12,
    pdf: (x, p) => (x < p.a || x > p.b ? 0 : 1 / (p.b - p.a)),
    cdf: (x, p) => Math.min(1, Math.max(0, (x - p.a) / (p.b - p.a))),
    range: (p) => {
      const pad = 0.08 * (p.b - p.a)
      return [p.a - pad, p.b + pad]
    },
    sample: (p, rng) => p.a + (p.b - p.a) * rng(),
    formulas: {
      mean: '\\tfrac{a+b}{2}',
      variance: '\\tfrac{(b-a)^2}{12}',
      mle: ['\\hat a = X_{(1)}', '\\hat b = X_{(n)}'],
      mleNote: 'The MLE lies on the boundary of the support (order statistics) — the usual regularity conditions fail here.',
      mme: ['\\hat a = \\bar X - \\sqrt{3}\\,S_n', '\\hat b = \\bar X + \\sqrt{3}\\,S_n'],
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
    mean: (p) => 1 / p.lambda,
    variance: (p) => 1 / (p.lambda * p.lambda),
    pdf: (x, p) => (x < 0 ? 0 : p.lambda * Math.exp(-p.lambda * x)),
    cdf: (x, p) => (x < 0 ? 0 : 1 - Math.exp(-p.lambda * x)),
    range: (p) => [0, 6 / p.lambda],
    sample: (p, rng) => -Math.log(1 - rng()) / p.lambda,
    formulas: {
      mean: '1/\\lambda',
      variance: '1/\\lambda^2',
      mle: ['\\hat\\lambda = 1/\\bar X'],
      mme: ['\\hat\\lambda = 1/\\bar X'],
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
    formulas: {
      mean: '\\alpha/\\lambda',
      variance: '\\alpha/\\lambda^2',
      mle: ['\\ln\\hat\\alpha - \\psi(\\hat\\alpha) = \\ln\\bar X - \\overline{\\ln X}', '\\hat\\lambda = \\hat\\alpha/\\bar X'],
      mleNote: 'No closed form for α̂ — solve the first equation numerically.',
      mme: ['\\hat\\alpha = \\bar X^2 / S_n^2', '\\hat\\lambda = \\bar X / S_n^2'],
    },
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
    formulas: {
      mean: '\\tfrac{\\alpha}{\\alpha+\\beta}',
      variance: '\\tfrac{\\alpha\\beta}{(\\alpha+\\beta)^2(\\alpha+\\beta+1)}',
      mle: [
        '\\psi(\\hat\\alpha)-\\psi(\\hat\\alpha+\\hat\\beta) = \\overline{\\ln X}',
        '\\psi(\\hat\\beta)-\\psi(\\hat\\alpha+\\hat\\beta) = \\overline{\\ln(1-X)}',
      ],
      mleNote: 'No closed form — solve the score equations numerically.',
      mme: [
        '\\hat\\alpha = \\bar X\\Bigl(\\tfrac{\\bar X(1-\\bar X)}{S_n^2}-1\\Bigr)',
        '\\hat\\beta = (1-\\bar X)\\Bigl(\\tfrac{\\bar X(1-\\bar X)}{S_n^2}-1\\Bigr)',
      ],
    },
  },

  chisq: {
    id: 'chisq',
    name: 'Chi-square',
    kind: 'continuous',
    tagline: 'Sum of k squared standard normals — the backbone of variance tests.',
    params: [
      { key: 'k', label: 'Degrees of freedom k', min: 1, max: 30, step: 1, default: 4 },
    ],
    notation: (p) => `X ~ χ²(${p.k})`,
    mean: (p) => p.k,
    variance: (p) => 2 * p.k,
    // χ²(k) = Gamma(shape k/2, rate 1/2)
    pdf: (x, p) => {
      if (x <= 0) return 0
      const a = p.k / 2
      return Math.exp(a * Math.log(0.5) + (a - 1) * Math.log(x) - x / 2 - logGamma(a))
    },
    cdf: (x, p) => (x <= 0 ? 0 : regularizedGammaP(p.k / 2, x / 2)),
    range: (p) => [0, p.k + 4.5 * Math.sqrt(2 * p.k)],
    sample: (p, rng) => 2 * sampleGammaShape(p.k / 2, rng),
    formulas: {
      mean: 'k',
      variance: '2k',
      mle: ['\\psi(\\hat k/2) = \\overline{\\ln X} - \\ln 2'],
      mleNote: 'No closed form — solve numerically.',
      mme: ['\\hat k = \\bar X'],
    },
  },

  t: {
    id: 't',
    name: "Student's t",
    kind: 'continuous',
    tagline: 'Heavy-tailed cousin of the Normal; drives small-sample inference.',
    params: [
      { key: 'nu', label: 'Degrees of freedom ν', min: 3, max: 30, step: 1, default: 5 },
    ],
    notation: (p) => `X ~ t(${p.nu})`,
    mean: () => 0,
    variance: (p) => p.nu / (p.nu - 2),
    pdf: (x, p) => {
      const v = p.nu
      const logC = logGamma((v + 1) / 2) - logGamma(v / 2) - 0.5 * Math.log(v * Math.PI)
      return Math.exp(logC - ((v + 1) / 2) * Math.log(1 + (x * x) / v))
    },
    cdf: (x, p) => {
      const v = p.nu
      const ib = regularizedBeta(v / (v + x * x), v / 2, 0.5)
      return x >= 0 ? 1 - 0.5 * ib : 0.5 * ib
    },
    range: (p) => {
      const sd = Math.sqrt(p.nu / (p.nu - 2))
      return [-6 * sd, 6 * sd]
    },
    sample: (p, rng) =>
      sampleStdNormal(rng) / Math.sqrt((2 * sampleGammaShape(p.nu / 2, rng)) / p.nu),
    formulas: {
      mean: '0 \\quad (\\nu>1)',
      variance: '\\tfrac{\\nu}{\\nu-2} \\quad (\\nu>2)',
      mle: [],
      mleNote: 'No closed form — maximize the log-likelihood over ν numerically.',
      mme: ['\\hat\\nu = \\tfrac{2\\,S_n^2}{S_n^2-1}'],
      mmeNote: 'Valid when S_n² > 1 (otherwise the moment equation has no solution).',
    },
    // Heavy tails: the numeric second moment converges too slowly on the
    // plotted range; the sampler test still verifies the variance.
    testOverrides: { skipNumericVariance: true },
  },

  lognormal: {
    id: 'lognormal',
    name: 'Lognormal',
    kind: 'continuous',
    tagline: 'ln X is Normal — multiplicative processes, incomes, survival times.',
    params: [
      { key: 'mu', label: 'Log-mean μ', min: -1, max: 2, step: 0.1, default: 0 },
      { key: 'sigma', label: 'Log-sd σ', min: 0.1, max: 1.2, step: 0.05, default: 0.5 },
    ],
    notation: (p) => `X ~ LogN(${fmt(p.mu)}, ${fmt(p.sigma)}²)`,
    mean: (p) => Math.exp(p.mu + (p.sigma * p.sigma) / 2),
    variance: (p) => {
      const s2 = p.sigma * p.sigma
      return (Math.exp(s2) - 1) * Math.exp(2 * p.mu + s2)
    },
    pdf: (x, p) => {
      if (x <= 0) return 0
      const z = (Math.log(x) - p.mu) / p.sigma
      return Math.exp(-0.5 * z * z) / (x * p.sigma * Math.sqrt(2 * Math.PI))
    },
    cdf: (x, p) => (x <= 0 ? 0 : stdNormalCdf((Math.log(x) - p.mu) / p.sigma)),
    range: (p) => [0, Math.exp(p.mu + 3.2 * p.sigma)],
    sample: (p, rng) => Math.exp(p.mu + p.sigma * sampleStdNormal(rng)),
    formulas: {
      mean: 'e^{\\mu+\\sigma^2/2}',
      variance: '(e^{\\sigma^2}-1)\\,e^{2\\mu+\\sigma^2}',
      mle: ['\\hat\\mu = \\overline{\\ln X}', '\\hat\\sigma^2 = \\tfrac1n\\sum(\\ln X_i - \\hat\\mu)^2'],
      mme: ['\\hat\\sigma^2 = \\ln\\bigl(1 + S_n^2/\\bar X^2\\bigr)', '\\hat\\mu = \\ln\\bar X - \\hat\\sigma^2/2'],
    },
    // Heavy right tail: numeric second moment needs an absurdly wide range;
    // the sampler test still verifies the variance.
    testOverrides: { skipNumericVariance: true },
  },

  laplace: {
    id: 'laplace',
    name: 'Laplace',
    kind: 'continuous',
    tagline: 'Double exponential — sharp peak, heavy tails; the MLE of location is the median.',
    params: [
      { key: 'mu', label: 'Location μ', min: -5, max: 5, step: 0.1, default: 0 },
      { key: 'b', label: 'Scale b', min: 0.2, max: 3, step: 0.1, default: 1 },
    ],
    notation: (p) => `X ~ Laplace(${fmt(p.mu)}, ${fmt(p.b)})`,
    mean: (p) => p.mu,
    variance: (p) => 2 * p.b * p.b,
    pdf: (x, p) => Math.exp(-Math.abs(x - p.mu) / p.b) / (2 * p.b),
    cdf: (x, p) =>
      x < p.mu
        ? 0.5 * Math.exp((x - p.mu) / p.b)
        : 1 - 0.5 * Math.exp(-(x - p.mu) / p.b),
    range: (p) => [p.mu - 7.5 * p.b, p.mu + 7.5 * p.b],
    sample: (p, rng) => {
      const u = rng() - 0.5
      return p.mu - p.b * Math.sign(u) * Math.log(1 - 2 * Math.abs(u))
    },
    formulas: {
      mean: '\\mu',
      variance: '2b^2',
      mle: ['\\hat\\mu = \\operatorname{med}(X_1,\\dots,X_n)', '\\hat b = \\tfrac1n\\sum_{i=1}^n\\lvert X_i - \\hat\\mu\\rvert'],
      mme: ['\\hat\\mu = \\bar X', '\\hat b = S_n/\\sqrt{2}'],
    },
  },

  rayleigh: {
    id: 'rayleigh',
    name: 'Rayleigh',
    kind: 'continuous',
    tagline: 'Norm of a 2-D Gaussian vector — signal amplitudes, wind speeds.',
    params: [
      { key: 'sigma', label: 'Scale σ', min: 0.2, max: 5, step: 0.1, default: 1 },
    ],
    notation: (p) => `X ~ Rayleigh(${fmt(p.sigma)})`,
    mean: (p) => p.sigma * Math.sqrt(Math.PI / 2),
    variance: (p) => (2 - Math.PI / 2) * p.sigma * p.sigma,
    pdf: (x, p) => {
      if (x < 0) return 0
      const s2 = p.sigma * p.sigma
      return (x / s2) * Math.exp(-(x * x) / (2 * s2))
    },
    cdf: (x, p) => (x < 0 ? 0 : 1 - Math.exp(-(x * x) / (2 * p.sigma * p.sigma))),
    range: (p) => [0, 4.2 * p.sigma],
    sample: (p, rng) => p.sigma * Math.sqrt(-2 * Math.log(1 - rng())),
    formulas: {
      mean: '\\sigma\\sqrt{\\pi/2}',
      variance: '\\bigl(2-\\tfrac{\\pi}{2}\\bigr)\\sigma^2',
      mle: ['\\hat\\sigma = \\sqrt{\\tfrac{1}{2n}\\sum_{i=1}^n X_i^2}'],
      mme: ['\\hat\\sigma = \\bar X\\sqrt{2/\\pi}'],
    },
  },
}
