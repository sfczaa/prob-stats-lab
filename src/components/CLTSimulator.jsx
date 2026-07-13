import { memo, useEffect, useMemo, useRef, useState } from 'react'
import {
  Area, Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts'
import {
  distributions, defaultParams, updateParams, continuousCurve, discretePoints,
} from '../lib/distributions.js'
import { fmtNum } from '../lib/format.js'
import { C, xAxisProps, yAxisProps } from './chartTheme.js'
import ChartCard from './ChartCard.jsx'
import ChartTooltip from './ChartTooltip.jsx'
import DistPicker from './DistPicker.jsx'
import ParamSlider from './ParamSlider.jsx'
import StatTile from './StatTile.jsx'

const N_BINS = 41
const RUN_DURATION_MS = 4000 // the animation always completes in about this long
const TOTAL_OPTIONS = [1000, 5000, 20000]
const N_DEF = { key: 'n', label: 'Sample size n', min: 1, max: 100, step: 1, default: 30 }

function makeSetup(dist, params, n) {
  const mu = dist.mean(params)
  const sd = Math.sqrt(dist.variance(params))
  const se = sd / Math.sqrt(n) // theoretical SD of the sample mean
  const lo = mu - 4.5 * se
  const hi = mu + 4.5 * se
  return { mu, sd, se, lo, hi, width: (hi - lo) / N_BINS }
}

export default function CLTSimulator() {
  const [distId, setDistId] = useState('exponential')
  const [params, setParams] = useState(() => defaultParams(distributions.exponential))
  const [n, setN] = useState(N_DEF.default)
  const [total, setTotal] = useState(5000)
  const [running, setRunning] = useState(false)
  const [counts, setCounts] = useState(() => new Array(N_BINS).fill(0))
  const [drawn, setDrawn] = useState(0)
  const [empirical, setEmpirical] = useState({ mean: NaN, sd: NaN })

  const dist = distributions[distId]
  const setup = useMemo(() => makeSetup(dist, params, n), [dist, params, n])

  // Mutable simulation state (updated inside the animation loop)
  const simRef = useRef(null)

  const reset = () => {
    setRunning(false)
    setCounts(new Array(N_BINS).fill(0))
    setDrawn(0)
    setEmpirical({ mean: NaN, sd: NaN })
    simRef.current = null
  }

  const selectDist = (id) => {
    setDistId(id)
    setParams(defaultParams(distributions[id]))
    reset()
  }
  const setParam = (key, value) => {
    setParams((p) => updateParams(dist, p, key, value))
    reset()
  }
  const setSampleSize = (_, value) => {
    setN(value)
    reset()
  }

  const run = () => {
    // Freeze the configuration for the whole run
    simRef.current = {
      dist, params, n, total, setup,
      counts: new Array(N_BINS).fill(0),
      drawn: 0, sum: 0, sumSq: 0,
      startTime: performance.now(),
    }
    setCounts(new Array(N_BINS).fill(0))
    setDrawn(0)
    setEmpirical({ mean: NaN, sd: NaN })
    setRunning(true)
  }

  // "?autorun" starts a simulation on load — handy for shared links and demos
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('autorun')) run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!running) return undefined
    let raf = 0
    const step = () => {
      const sim = simRef.current
      if (!sim) return
      // Pace by wall clock, not frame count, so the run takes ~RUN_DURATION_MS
      // even when the browser throttles animation frames. The per-frame floor
      // guarantees completion within ~240 frames on clocks that stand still
      // (e.g. headless virtual time).
      const elapsed = performance.now() - sim.startTime
      const floor = sim.drawn + Math.ceil(sim.total / 240)
      const paced = Math.round((sim.total * elapsed) / RUN_DURATION_MS)
      const target = Math.min(sim.total, Math.max(floor, paced))
      const batch = target - sim.drawn
      for (let b = 0; b < batch; b++) {
        let s = 0
        for (let i = 0; i < sim.n; i++) s += sim.dist.sample(sim.params, Math.random)
        const m = s / sim.n
        sim.drawn++
        sim.sum += m
        sim.sumSq += m * m
        const idx = Math.floor((m - sim.setup.lo) / sim.setup.width)
        if (idx >= 0 && idx < N_BINS) sim.counts[idx]++
      }
      const mean = sim.sum / sim.drawn
      setCounts([...sim.counts])
      setDrawn(sim.drawn)
      setEmpirical({
        mean,
        sd: sim.drawn > 1 ? Math.sqrt(Math.max(0, sim.sumSq / sim.drawn - mean * mean)) : NaN,
      })
      if (sim.drawn < sim.total) raf = requestAnimationFrame(step)
      else setRunning(false)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [running])

  // Histogram bins + theoretical normal overlay, scaled to counts
  const chartData = useMemo(() => {
    const { lo, width, mu, se } = setup
    return counts.map((count, i) => {
      const x = lo + (i + 0.5) * width
      return {
        x: fmtNum(x, 3),
        count,
        theory:
          drawn > 0
            ? drawn * width * distributions.normal.pdf(x, { mu, sigma: se })
            : null,
      }
    })
  }, [counts, drawn, setup])

  const progress = total > 0 ? drawn / total : 0

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Controls */}
      <aside className="min-w-0 space-y-5">
        <div>
          <h2 className="mb-2 text-[11px] uppercase tracking-[0.16em] text-muted">
            Population
          </h2>
          <DistPicker value={distId} onChange={selectDist} disabled={running} />
        </div>

        <PopulationPreview dist={dist} params={params} />

        <div className="space-y-4 border border-hairline bg-surface p-4">
          <h2 className="text-[11px] uppercase tracking-[0.16em] text-muted">
            Simulation settings
          </h2>
          {dist.params.map((def) => (
            <ParamSlider
              key={def.key}
              def={def}
              value={params[def.key]}
              onChange={setParam}
              disabled={running}
            />
          ))}
          <ParamSlider def={N_DEF} value={n} onChange={setSampleSize} disabled={running} />
          <div>
            <div className="mb-1 text-[13px] text-ink2">Number of samples</div>
            <div className="flex gap-1">
              {TOTAL_OPTIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  disabled={running}
                  onClick={() => {
                    setTotal(t)
                    reset()
                  }}
                  className={`flex-1 border px-2 py-1 font-mono text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    total === t
                      ? 'border-ink bg-ink text-paper'
                      : 'border-hairline text-muted hover:border-baseline hover:text-ink2'
                  }`}
                >
                  {t.toLocaleString()}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={run}
              disabled={running}
              className="flex-1 border border-ink bg-ink px-3 py-2 text-sm font-medium text-paper transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {running ? 'Sampling…' : drawn > 0 ? 'Run again' : 'Run simulation'}
            </button>
            <button
              type="button"
              onClick={reset}
              className="border border-hairline px-3 py-2 text-sm text-ink2 transition-colors hover:border-baseline"
            >
              Reset
            </button>
          </div>
        </div>
      </aside>

      {/* Results */}
      <div className="min-w-0 space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Population"
            value={`μ = ${fmtNum(setup.mu)}`}
            caption={`σ = ${fmtNum(setup.sd)}`}
          />
          <StatTile
            label="Theory for X̄"
            value={`μ = ${fmtNum(setup.mu)}`}
            caption={`σ/√n = ${fmtNum(setup.se)}`}
          />
          <StatTile
            label="Observed X̄"
            value={`μ̂ = ${fmtNum(empirical.mean)}`}
            caption={`sd = ${fmtNum(empirical.sd)}`}
          />
          <StatTile
            label="Samples drawn"
            value={drawn.toLocaleString()}
            caption={`of ${total.toLocaleString()}`}
          />
        </div>

        <ChartCard
          title="Distribution of the sample mean"
          subtitle={`Each sample averages n = ${n} draws; the histogram collects those averages`}
          height="h-80"
        >
          <div className="flex h-full flex-col">
            {/* Legend (two series) */}
            <div className="mb-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-ink2">
              <span className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-[2px]" style={{ background: C.series1 }} />
                Sample means (simulated)
              </span>
              <span className="flex items-center gap-2">
                <span className="inline-block h-0.5 w-4" style={{ background: C.theory }} />
                <span>
                  Theory: N(μ, σ²/n)
                </span>
              </span>
              {running && (
                <span className="ml-auto font-mono text-[11px] text-muted">
                  {Math.round(progress * 100)}%
                </span>
              )}
            </div>
            <div className="min-h-0 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} barCategoryGap={2} margin={{ top: 8, right: 8 }}>
                  <CartesianGrid vertical={false} stroke={C.grid} strokeWidth={1} />
                  <XAxis dataKey="x" {...xAxisProps} interval={Math.ceil(N_BINS / 8) - 1} />
                  <YAxis {...yAxisProps} allowDecimals={false} />
                  <Tooltip
                    content={<ChartTooltip xLabel="x̄" />}
                    cursor={{ fill: C.grid, fillOpacity: 0.4 }}
                  />
                  <Bar
                    dataKey="count"
                    name="Sample means"
                    fill={C.series1}
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  />
                  <Line
                    dataKey="theory"
                    name="Normal theory"
                    type="monotone"
                    stroke={C.theory}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </ChartCard>

        <p className="border-l-2 border-baseline pl-3 font-display text-[14px] italic leading-snug text-ink2">
          The Central Limit Theorem: whatever shape the population has, the
          distribution of the sample mean X̄ approaches N(μ, σ²/n) as n grows.
          Try a skewed population (Exponential) with n = 1, then slide n upward.
        </p>
      </div>
    </div>
  )
}

/** Sparkline of the population shape; memoized so animation frames skip it. */
const PopulationPreview = memo(function PopulationPreview({ dist, params }) {
  const data = useMemo(
    () =>
      dist.kind === 'discrete'
        ? discretePoints(dist, params)
        : continuousCurve(dist, params, 121),
    [dist, params],
  )
  return (
    <div className="border border-hairline bg-surface p-4">
      <h2 className="text-[11px] uppercase tracking-[0.16em] text-muted">
        Population shape
      </h2>
      <div className="mt-2 h-20 min-w-0 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            {dist.kind === 'discrete' ? (
              <Bar dataKey="pmf" fill={C.series1} isAnimationActive={false} />
            ) : (
              <Area
                dataKey="pdf"
                type="monotone"
                stroke={C.series1}
                strokeWidth={2}
                fill={C.series1}
                fillOpacity={0.1}
                dot={false}
                isAnimationActive={false}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 font-mono text-[11px] text-muted">{dist.notation(params)}</p>
    </div>
  )
})
