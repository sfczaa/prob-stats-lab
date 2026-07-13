import { describe, it, expect } from 'vitest'
import {
  logGamma, erf, regularizedGammaP, regularizedBeta, stdNormalCdf,
} from './special.js'

// Reference values are exact identities or textbook table values.
describe('special functions', () => {
  it('logGamma matches known values', () => {
    expect(logGamma(5)).toBeCloseTo(Math.log(24), 10) // Γ(5) = 4! = 24
    expect(logGamma(0.5)).toBeCloseTo(Math.log(Math.sqrt(Math.PI)), 10)
    expect(logGamma(1)).toBeCloseTo(0, 10)
  })

  it('erf matches known values', () => {
    expect(erf(0)).toBeCloseTo(0, 12)
    expect(erf(1)).toBeCloseTo(0.8427007929497149, 8)
    expect(erf(-1)).toBeCloseTo(-0.8427007929497149, 8)
  })

  it('standard normal CDF matches z-table values', () => {
    expect(stdNormalCdf(0)).toBeCloseTo(0.5, 10)
    expect(stdNormalCdf(1.96)).toBeCloseTo(0.975002, 5)
    expect(stdNormalCdf(-1.6449)).toBeCloseTo(0.05, 3)
  })

  it('regularized incomplete gamma: P(1, x) = 1 − e^−x', () => {
    for (const x of [0.1, 1, 2.5, 7]) {
      expect(regularizedGammaP(1, x)).toBeCloseTo(1 - Math.exp(-x), 10)
    }
  })

  it('regularized incomplete beta: I_x(1, 1) = x and symmetry', () => {
    expect(regularizedBeta(0.3, 1, 1)).toBeCloseTo(0.3, 10)
    // I_x(a,b) = 1 − I_{1−x}(b,a)
    expect(regularizedBeta(0.3, 2, 5)).toBeCloseTo(1 - regularizedBeta(0.7, 5, 2), 10)
  })
})
