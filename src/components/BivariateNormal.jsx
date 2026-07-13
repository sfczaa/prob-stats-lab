import { useState } from 'react'
import { fmtNum, niceTicks } from '../lib/format.js'
import { C } from './chartTheme.js'
import ChartCard from './ChartCard.jsx'
import ParamSlider from './ParamSlider.jsx'
import StatTile from './StatTile.jsx'
import TeX from './TeX.jsx'

const PARAMS = [
  { key: 'mu1', label: 'Mean μ₁ (X)', min: -3, max: 3, step: 0.1, default: 0 },
  { key: 'mu2', label: 'Mean μ₂ (Y)', min: -3, max: 3, step: 0.1, default: 0 },
  { key: 's1', label: 'Std. dev. σ₁', min: 0.3, max: 3, step: 0.1, default: 1 },
  { key: 's2', label: 'Std. dev. σ₂', min: 0.3, max: 3, step: 0.1, default: 1 },
  { key: 'rho', label: 'Correlation ρ', min: -0.95, max: 0.95, step: 0.05, default: 0.6 },
]

// Mahalanobis radii of the plotted contours, outermost first,
// with strokes from the sequential blue ramp (light → dark inward).
const RINGS = [
  { c: 3, stroke: '#9ec5f4' },
  { c: 2.25, stroke: '#6da7ec' },
  { c: 1.5, stroke: '#3987e5' },
  { c: 0.75, stroke: '#1c5cab' },
]

// SVG geometry
const ML = 44
const MT = 10
const MR = 10
const MB = 30
const PLOT = 430
const W = ML + PLOT + MR
const H = MT + PLOT + MB

export default function BivariateNormal() {
  const [p, setP] = useState(() =>
    Object.fromEntries(PARAMS.map((d) => [d.key, d.default])),
  )
  const setParam = (key, value) => setP((prev) => ({ ...prev, [key]: value }))

  const { mu1, mu2, s1, s2, rho } = p
  const cov = rho * s1 * s2
  const slope = (rho * s2) / s1
  const condSd = s2 * Math.sqrt(1 - rho * rho)

  // Equal scale on both axes so ellipse geometry reads honestly
  const half = 4.2 * Math.max(s1, s2)
  const scale = PLOT / (2 * half)
  const X = (x) => ML + (x - (mu1 - half)) * scale
  const Y = (y) => MT + (mu2 + half - y) * scale

  // Eigen-decomposition of the covariance matrix for contour ellipses
  const a = s1 * s1
  const d = s2 * s2
  const disc = Math.sqrt((a - d) * (a - d) + 4 * cov * cov)
  const l1 = (a + d + disc) / 2
  const l2 = (a + d - disc) / 2
  const thetaDeg = (0.5 * Math.atan2(2 * cov, a - d) * 180) / Math.PI

  const xTicks = niceTicks(mu1 - half, mu1 + half, 7)
  const yTicks = niceTicks(mu2 - half, mu2 + half, 7)

  // Conditional-mean line across the x-domain
  const lx0 = mu1 - half
  const lx1 = mu1 + half
  const ly0 = mu2 + slope * (lx0 - mu1)
  const ly1 = mu2 + slope * (lx1 - mu1)

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="min-w-0 space-y-5">
        <div className="space-y-4 border border-hairline bg-surface p-4">
          <h2 className="text-[11px] uppercase tracking-[0.16em] text-muted">
            Parameters
          </h2>
          {PARAMS.map((def) => (
            <ParamSlider key={def.key} def={def} value={p[def.key]} onChange={setParam} />
          ))}
        </div>
        <p className="border-l-2 border-baseline pl-3 font-display text-[14px] italic leading-snug text-ink2">
          Slide ρ toward ±1 and watch the density collapse onto a line — and the
          conditional mean E[Y | X = x] tilt with it.
        </p>
      </aside>

      <div className="min-w-0 space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile
            label="Covariance"
            value={fmtNum(cov)}
            caption={<TeX tex="\operatorname{Cov}(X,Y)=\rho\sigma_1\sigma_2" />}
          />
          <StatTile
            label="Correlation"
            value={fmtNum(rho)}
            caption={<TeX tex="\rho" />}
          />
          <StatTile
            label="Regression slope"
            value={fmtNum(slope)}
            caption={<TeX tex="\beta = \rho\,\sigma_2/\sigma_1" />}
          />
          <StatTile
            label="Conditional sd"
            value={fmtNum(condSd)}
            caption={<TeX tex="\sigma_2\sqrt{1-\rho^2}" />}
          />
        </div>

        <ChartCard
          title="Density contours"
          subtitle="Ellipses at Mahalanobis distance 0.75σ, 1.5σ, 2.25σ, 3σ"
          height="h-auto"
        >
          <div className="mb-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-ink2">
            <span className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full border-2"
                style={{ borderColor: C.series1 }}
              />
              Density contours
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block h-0.5 w-4" style={{ background: C.theory }} />
              Conditional mean E[Y | X = x]
            </span>
          </div>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="mx-auto block w-full max-w-[560px]"
            role="img"
            aria-label="Bivariate normal density contour plot"
          >
            <defs>
              <clipPath id="bvn-plot">
                <rect x={ML} y={MT} width={PLOT} height={PLOT} />
              </clipPath>
            </defs>

            {/* gridlines */}
            {xTicks.map((t) => (
              <line key={`gx${t}`} x1={X(t)} y1={MT} x2={X(t)} y2={MT + PLOT} stroke={C.grid} strokeWidth="1" />
            ))}
            {yTicks.map((t) => (
              <line key={`gy${t}`} x1={ML} y1={Y(t)} x2={ML + PLOT} y2={Y(t)} stroke={C.grid} strokeWidth="1" />
            ))}

            {/* contour ellipses */}
            <g clipPath="url(#bvn-plot)">
              {RINGS.map(({ c, stroke }) => (
                <ellipse
                  key={c}
                  cx={X(mu1)}
                  cy={Y(mu2)}
                  rx={c * Math.sqrt(l1) * scale}
                  ry={c * Math.sqrt(l2) * scale}
                  transform={`rotate(${-thetaDeg} ${X(mu1)} ${Y(mu2)})`}
                  fill={C.series1}
                  fillOpacity="0.05"
                  stroke={stroke}
                  strokeWidth="2"
                />
              ))}
              {/* conditional mean line */}
              <line
                x1={X(lx0)}
                y1={Y(ly0)}
                x2={X(lx1)}
                y2={Y(ly1)}
                stroke={C.theory}
                strokeWidth="2"
              />
              {/* center */}
              <circle cx={X(mu1)} cy={Y(mu2)} r="4" fill={C.ink} stroke={C.surface} strokeWidth="2" />
            </g>

            {/* axes */}
            <line x1={ML} y1={MT + PLOT} x2={ML + PLOT} y2={MT + PLOT} stroke={C.baseline} strokeWidth="1" />
            <line x1={ML} y1={MT} x2={ML} y2={MT + PLOT} stroke={C.baseline} strokeWidth="1" />
            {xTicks.map((t) => (
              <text
                key={`tx${t}`}
                x={X(t)}
                y={MT + PLOT + 18}
                textAnchor="middle"
                fontSize="11"
                fontFamily="'IBM Plex Mono', monospace"
                fill={C.muted}
              >
                {fmtNum(t, 3)}
              </text>
            ))}
            {yTicks.map((t) => (
              <text
                key={`ty${t}`}
                x={ML - 8}
                y={Y(t) + 3.5}
                textAnchor="end"
                fontSize="11"
                fontFamily="'IBM Plex Mono', monospace"
                fill={C.muted}
              >
                {fmtNum(t, 3)}
              </text>
            ))}
            <text x={ML + PLOT} y={MT + PLOT + 18} textAnchor="end" fontSize="11" fill={C.muted} fontStyle="italic">
              x
            </text>
            <text x={ML - 28} y={MT + 12} fontSize="11" fill={C.muted} fontStyle="italic">
              y
            </text>
          </svg>
        </ChartCard>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <section className="border border-hairline bg-surface p-4">
            <h3 className="font-display text-[17px] font-medium text-ink">Joint density</h3>
            <div className="mt-3 overflow-x-auto text-[15px] text-ink">
              <TeX
                block
                tex="f(x,y) = \tfrac{1}{2\pi\sigma_1\sigma_2\sqrt{1-\rho^2}}\exp\!\Bigl(-\tfrac{1}{2(1-\rho^2)}\Bigl[\tfrac{(x-\mu_1)^2}{\sigma_1^2} - 2\rho\tfrac{(x-\mu_1)(y-\mu_2)}{\sigma_1\sigma_2} + \tfrac{(y-\mu_2)^2}{\sigma_2^2}\Bigr]\Bigr)"
              />
            </div>
            <div className="mt-3 text-[15px] text-ink">
              <TeX
                block
                tex={`\\Sigma = \\begin{pmatrix}\\sigma_1^2 & \\rho\\sigma_1\\sigma_2\\\\ \\rho\\sigma_1\\sigma_2 & \\sigma_2^2\\end{pmatrix} = \\begin{pmatrix}${fmtNum(a)} & ${fmtNum(cov)}\\\\ ${fmtNum(cov)} & ${fmtNum(d)}\\end{pmatrix}`}
              />
            </div>
          </section>

          <section className="border border-hairline bg-surface p-4">
            <h3 className="font-display text-[17px] font-medium text-ink">
              Marginals &amp; conditional
            </h3>
            <div className="mt-3 space-y-2 text-[15px] text-ink">
              <TeX block tex="X \sim N(\mu_1, \sigma_1^2), \qquad Y \sim N(\mu_2, \sigma_2^2)" />
              <TeX
                block
                tex="Y \mid X{=}x \;\sim\; N\!\Bigl(\mu_2 + \rho\tfrac{\sigma_2}{\sigma_1}(x-\mu_1),\; \sigma_2^2(1-\rho^2)\Bigr)"
              />
            </div>
            <p className="mt-2 text-xs leading-snug text-muted">
              The conditional mean is the red line above — linear regression falls
              straight out of the bivariate normal. X and Y are independent iff ρ = 0.
            </p>
          </section>
        </div>

        <section className="border border-hairline bg-surface p-4">
          <h3 className="font-display text-[17px] font-medium text-ink">
            MLE from an iid sample
          </h3>
          <div className="mt-3 space-y-2 text-[15px] text-ink">
            <TeX
              block
              tex="\hat{\boldsymbol\mu} = \bar{\mathbf X} = \tfrac1n\sum_{i=1}^n \mathbf X_i, \qquad \hat\Sigma = \tfrac1n\sum_{i=1}^n (\mathbf X_i - \bar{\mathbf X})(\mathbf X_i - \bar{\mathbf X})^{\!\top}"
            />
            <TeX
              block
              tex="\hat\rho = \frac{\sum_i (X_i-\bar X)(Y_i-\bar Y)}{\sqrt{\sum_i (X_i-\bar X)^2}\sqrt{\sum_i (Y_i-\bar Y)^2}}"
            />
          </div>
          <p className="mt-2 text-xs leading-snug text-muted">
            The MLE of ρ is exactly the sample correlation coefficient r.
          </p>
        </section>
      </div>
    </div>
  )
}
