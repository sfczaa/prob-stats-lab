import { useMemo, useState } from 'react'
import {
  Area, Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  distributions, defaultParams, continuousCurve, discretePoints,
} from '../lib/distributions.js'
import { fmtNum, niceTicks } from '../lib/format.js'
import { C, xAxisProps, yAxisProps } from './chartTheme.js'
import ChartCard from './ChartCard.jsx'
import ChartTooltip from './ChartTooltip.jsx'
import DistPicker from './DistPicker.jsx'
import ParamSlider from './ParamSlider.jsx'
import StatTile from './StatTile.jsx'

const CDF_TICKS = [0, 0.25, 0.5, 0.75, 1]

export default function DistributionLab() {
  const [distId, setDistId] = useState('normal')
  const [params, setParams] = useState(() => defaultParams(distributions.normal))
  const dist = distributions[distId]

  const selectDist = (id) => {
    setDistId(id)
    setParams(defaultParams(distributions[id]))
  }
  const setParam = (key, value) => setParams((p) => ({ ...p, [key]: value }))

  const isDiscrete = dist.kind === 'discrete'
  const data = useMemo(
    () => (isDiscrete ? discretePoints(dist, params) : continuousCurve(dist, params)),
    [dist, params, isDiscrete],
  )
  const discreteTickInterval = Math.max(0, Math.ceil(data.length / 12) - 1)
  const [xLo, xHi] = dist.range(params)
  const xTicks = useMemo(() => niceTicks(xLo, xHi), [xLo, xHi])

  const mean = dist.mean(params)
  const variance = dist.variance(params)

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Controls */}
      <aside className="min-w-0 space-y-5">
        <div>
          <h2 className="mb-2 text-[11px] uppercase tracking-[0.16em] text-muted">
            Distribution
          </h2>
          <DistPicker value={distId} onChange={selectDist} />
        </div>
        <div className="space-y-4 border border-hairline bg-surface p-4">
          <h2 className="text-[11px] uppercase tracking-[0.16em] text-muted">
            Parameters
          </h2>
          {dist.params.map((def) => (
            <ParamSlider
              key={def.key}
              def={def}
              value={params[def.key]}
              onChange={setParam}
            />
          ))}
        </div>
        <p className="border-l-2 border-baseline pl-3 font-display text-[14px] italic leading-snug text-ink2">
          {dist.tagline}
        </p>
      </aside>

      {/* Charts & stats */}
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-mono text-sm text-ink">{dist.notation(params)}</span>
          <span className="text-xs text-muted">
            drag the sliders — everything updates live
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile label="Mean" value={fmtNum(mean)} caption={`E[X] = ${dist.meanFormula}`} />
          <StatTile
            label="Variance"
            value={fmtNum(variance)}
            caption={`Var(X) = ${dist.varianceFormula}`}
          />
          <StatTile
            label="Std. deviation"
            value={fmtNum(Math.sqrt(variance))}
            caption="σ = √Var(X)"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartCard
            title={isDiscrete ? 'Probability mass' : 'Probability density'}
            subtitle={isDiscrete ? 'P(X = k) at each integer k' : 'f(x) over the support'}
          >
            <ResponsiveContainer width="100%" height="100%">
              {isDiscrete ? (
                <ComposedChart data={data} barCategoryGap={2} margin={{ top: 8, right: 8 }}>
                  <CartesianGrid vertical={false} stroke={C.grid} strokeWidth={1} />
                  <XAxis dataKey="x" {...xAxisProps} interval={discreteTickInterval} />
                  <YAxis {...yAxisProps} tickFormatter={(v) => fmtNum(v, 3)} />
                  <Tooltip
                    content={<ChartTooltip xLabel="k" />}
                    cursor={{ fill: C.grid, fillOpacity: 0.4 }}
                  />
                  <Bar
                    dataKey="pmf"
                    name="P(X = k)"
                    fill={C.series1}
                    maxBarSize={24}
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              ) : (
                <ComposedChart data={data} margin={{ top: 8, right: 8 }}>
                  <CartesianGrid vertical={false} stroke={C.grid} strokeWidth={1} />
                  <XAxis
                    dataKey="x"
                    type="number"
                    domain={[xLo, xHi]}
                    ticks={xTicks}
                    tickFormatter={(v) => fmtNum(v, 3)}
                    {...xAxisProps}
                  />
                  <YAxis {...yAxisProps} tickFormatter={(v) => fmtNum(v, 3)} />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={{ stroke: C.baseline, strokeWidth: 1 }}
                  />
                  <Area
                    dataKey="pdf"
                    name="f(x)"
                    type="monotone"
                    stroke={C.series1}
                    strokeWidth={2}
                    fill={C.series1}
                    fillOpacity={0.1}
                    dot={false}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Cumulative distribution"
            subtitle={isDiscrete ? 'F(k) = P(X ≤ k), a step function' : 'F(x) = P(X ≤ x)'}
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 8, right: 8 }}>
                <CartesianGrid vertical={false} stroke={C.grid} strokeWidth={1} />
                {isDiscrete ? (
                  <XAxis dataKey="x" {...xAxisProps} interval={discreteTickInterval} />
                ) : (
                  <XAxis
                    dataKey="x"
                    type="number"
                    domain={[xLo, xHi]}
                    ticks={xTicks}
                    tickFormatter={(v) => fmtNum(v, 3)}
                    {...xAxisProps}
                  />
                )}
                <YAxis {...yAxisProps} domain={[0, 1]} ticks={CDF_TICKS} />
                <Tooltip
                  content={<ChartTooltip xLabel={isDiscrete ? 'k' : 'x'} />}
                  cursor={{ stroke: C.baseline, strokeWidth: 1 }}
                />
                <Line
                  dataKey="cdf"
                  name={isDiscrete ? 'F(k)' : 'F(x)'}
                  type={isDiscrete ? 'stepAfter' : 'monotone'}
                  stroke={C.series1}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  )
}
