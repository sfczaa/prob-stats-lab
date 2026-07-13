// Shared chart tokens — mirrors the CSS custom properties in index.css.
export const C = {
  series1: '#2a78d6',
  theory: '#e34948',
  ink: '#0b0b0b',
  ink2: '#52514e',
  muted: '#898781',
  grid: '#e1e0d9',
  baseline: '#c3c2b7',
  surface: '#fcfcfb',
}

export const tickStyle = {
  fill: C.muted,
  fontSize: 11,
  fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
}

export const xAxisProps = {
  tick: tickStyle,
  axisLine: { stroke: C.baseline },
  tickLine: false,
  tickMargin: 8,
}

export const yAxisProps = {
  tick: tickStyle,
  axisLine: false,
  tickLine: false,
  width: 48,
}
