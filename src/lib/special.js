// Special functions needed for distribution PDFs/PMFs and CDFs.
// Algorithms follow the classic formulations in Numerical Recipes
// (Press et al.): Lanczos log-gamma, series/continued-fraction
// incomplete gamma, and Lentz's method for the incomplete beta.

const LANCZOS_COEF = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028,
  771.32342877765313, -176.61502916214059, 12.507343278686905,
  -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
]
const LANCZOS_G = 7
const EPS = 3e-14
const FPMIN = 1e-300

/** Natural log of the gamma function, valid for x > 0. */
export function logGamma(x) {
  if (x < 0.5) {
    // Reflection formula keeps the Lanczos series in its accurate range.
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x)
  }
  const z = x - 1
  let a = LANCZOS_COEF[0]
  const t = z + LANCZOS_G + 0.5
  for (let i = 1; i < LANCZOS_COEF.length; i++) a += LANCZOS_COEF[i] / (z + i)
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a)
}

/** log of the binomial coefficient C(n, k). */
export function logChoose(n, k) {
  return logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1)
}

// Series representation of P(a, x), converges quickly for x < a + 1.
function lowerGammaSeries(a, x) {
  let ap = a
  let sum = 1 / a
  let del = sum
  for (let i = 0; i < 500; i++) {
    ap += 1
    del *= x / ap
    sum += del
    if (Math.abs(del) < Math.abs(sum) * EPS) break
  }
  return sum * Math.exp(-x + a * Math.log(x) - logGamma(a))
}

// Continued fraction for Q(a, x) = 1 - P(a, x), for x >= a + 1 (Lentz).
function upperGammaCF(a, x) {
  let b = x + 1 - a
  let c = 1 / FPMIN
  let d = 1 / b
  let h = d
  for (let i = 1; i <= 500; i++) {
    const an = -i * (i - a)
    b += 2
    d = an * d + b
    if (Math.abs(d) < FPMIN) d = FPMIN
    c = b + an / c
    if (Math.abs(c) < FPMIN) c = FPMIN
    d = 1 / d
    const del = d * c
    h *= del
    if (Math.abs(del - 1) < EPS) break
  }
  return Math.exp(-x + a * Math.log(x) - logGamma(a)) * h
}

/** Regularized lower incomplete gamma P(a, x) = γ(a, x) / Γ(a). */
export function regularizedGammaP(a, x) {
  if (a <= 0 || x < 0 || Number.isNaN(x)) return NaN
  if (x === 0) return 0
  return x < a + 1 ? lowerGammaSeries(a, x) : 1 - upperGammaCF(a, x)
}

/** Error function, via erf(x) = sgn(x) · P(1/2, x²). */
export function erf(x) {
  const p = regularizedGammaP(0.5, x * x)
  return x < 0 ? -p : p
}

// Continued fraction for the incomplete beta (Lentz's method).
function betaCF(a, b, x) {
  const qab = a + b
  const qap = a + 1
  const qam = a - 1
  let c = 1
  let d = 1 - (qab * x) / qap
  if (Math.abs(d) < FPMIN) d = FPMIN
  d = 1 / d
  let h = d
  for (let m = 1; m <= 500; m++) {
    const m2 = 2 * m
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2))
    d = 1 + aa * d
    if (Math.abs(d) < FPMIN) d = FPMIN
    c = 1 + aa / c
    if (Math.abs(c) < FPMIN) c = FPMIN
    d = 1 / d
    h *= d * c
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2))
    d = 1 + aa * d
    if (Math.abs(d) < FPMIN) d = FPMIN
    c = 1 + aa / c
    if (Math.abs(c) < FPMIN) c = FPMIN
    d = 1 / d
    const del = d * c
    h *= del
    if (Math.abs(del - 1) < EPS) break
  }
  return h
}

/** Regularized incomplete beta I_x(a, b), the CDF of Beta(a, b). */
export function regularizedBeta(x, a, b) {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const logFront =
    logGamma(a + b) - logGamma(a) - logGamma(b) +
    a * Math.log(x) + b * Math.log(1 - x)
  const front = Math.exp(logFront)
  // Use the continued fraction directly where it converges fast,
  // otherwise use the symmetry I_x(a,b) = 1 - I_{1-x}(b,a).
  if (x < (a + 1) / (a + b + 2)) return (front * betaCF(a, b, x)) / a
  return 1 - (front * betaCF(b, a, 1 - x)) / b
}

/** Standard normal CDF Φ(z). */
export function stdNormalCdf(z) {
  return 0.5 * (1 + erf(z / Math.SQRT2))
}
