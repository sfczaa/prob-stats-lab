import { fmtNum } from '../lib/format.js'

/** Recharts custom tooltip: hairline card, mono values, text-token colors. */
export default function ChartTooltip({ active, payload, label, xLabel = 'x' }) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="border border-hairline bg-surface px-3 py-2 shadow-sm">
      <div className="font-mono text-[11px] text-muted">
        {xLabel} = {typeof label === 'number' ? fmtNum(label) : label}
      </div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="mt-0.5 flex items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-[2px]"
            style={{ background: entry.color || entry.stroke }}
          />
          <span className="text-xs text-ink2">{entry.name}</span>
          <span className="ml-auto pl-3 font-mono text-xs text-ink">
            {fmtNum(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}
