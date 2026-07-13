// Distribution registry and plotting helpers. Definitions live in
// dists-continuous.js / dists-discrete.js.

import { continuousDistributions } from './dists-continuous.js'
import { discreteDistributions } from './dists-discrete.js'

export const distributions = {
  ...continuousDistributions,
  ...discreteDistributions,
}

export const distributionList = Object.values(distributions)

/** Default parameter values as a {key: value} object. */
export function defaultParams(dist) {
  return Object.fromEntries(dist.params.map((p) => [p.key, p.default]))
}

/** Apply one slider change, letting the distribution clamp dependent params. */
export function updateParams(dist, params, key, value) {
  const next = { ...params, [key]: value }
  return dist.clamp ? dist.clamp(next, key) : next
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
