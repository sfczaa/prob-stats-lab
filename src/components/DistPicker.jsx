import { distributionList } from '../lib/distributions.js'

const GROUPS = [
  { label: 'Continuous', kind: 'continuous' },
  { label: 'Discrete', kind: 'discrete' },
]

export default function DistPicker({ value, onChange, disabled = false }) {
  return (
    <div role="radiogroup" aria-label="Distribution" className="flex flex-col gap-3">
      {GROUPS.map((g) => (
        <div key={g.kind}>
          <div className="mb-1 pl-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            {g.label}
          </div>
          <div className="flex flex-col">
            {distributionList
              .filter((d) => d.kind === g.kind)
              .map((d) => {
                const active = d.id === value
                return (
                  <button
                    key={d.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={disabled}
                    onClick={() => onChange(d.id)}
                    className={`border-l-2 px-3 py-1 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      active
                        ? 'border-ink bg-surface text-ink'
                        : 'border-transparent text-muted hover:border-baseline hover:text-ink2'
                    }`}
                  >
                    <span className={`font-display text-[15px] ${active ? 'font-semibold' : 'font-medium'}`}>
                      {d.name}
                    </span>
                  </button>
                )
              })}
          </div>
        </div>
      ))}
    </div>
  )
}
