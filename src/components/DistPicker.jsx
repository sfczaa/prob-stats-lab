import { distributionList } from '../lib/distributions.js'

/** Distribution selector: an editorial list with a left rule on the active row. */
export default function DistPicker({ value, onChange, disabled = false }) {
  return (
    <div role="radiogroup" aria-label="Distribution" className="flex flex-col">
      {distributionList.map((d) => {
        const active = d.id === value
        return (
          <button
            key={d.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(d.id)}
            className={`flex items-baseline justify-between border-l-2 px-3 py-1.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              active
                ? 'border-ink bg-surface text-ink'
                : 'border-transparent text-muted hover:border-baseline hover:text-ink2'
            }`}
          >
            <span className={`font-display text-[15px] ${active ? 'font-semibold' : 'font-medium'}`}>
              {d.name}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wide">
              {d.kind === 'continuous' ? 'cont.' : 'disc.'}
            </span>
          </button>
        )
      })}
    </div>
  )
}
