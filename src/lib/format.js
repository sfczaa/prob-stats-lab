/** Short display of a parameter value inside distribution notation. */
export const fmtParam = (v) =>
  Number.isInteger(v) ? String(v) : String(+v.toFixed(2))

/** Round tick positions covering [lo, hi] with a 1/2/5×10^k step. */
export function niceTicks(lo, hi, maxTicks = 7) {
  const span = hi - lo
  if (!(span > 0)) return [lo]
  const rawStep = span / (maxTicks - 1)
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const norm = rawStep / mag
  const step = (norm >= 5 ? 10 : norm >= 2.5 ? 5 : norm >= 1.5 ? 2 : 1) * mag
  const ticks = []
  for (let t = Math.ceil(lo / step) * step; t <= hi + step * 1e-6; t += step) {
    ticks.push(Number(t.toPrecision(12)))
  }
  return ticks
}

/** Compact display of a number: 4 significant digits, em dash for non-finite. */
export function fmtNum(v, digits = 4) {
  if (!Number.isFinite(v)) return '—'
  if (v === 0) return '0'
  const a = Math.abs(v)
  if (a >= 100000 || a < 0.001) return v.toExponential(2)
  return String(Number(v.toPrecision(digits)))
}
