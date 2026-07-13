import { fmtNum } from '../lib/format.js'

/** Labeled range slider with a live mono readout. */
export default function ParamSlider({ def, value, onChange, disabled = false }) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] text-ink2">{def.label}</span>
        <span className="font-mono text-[13px] text-ink">{fmtNum(value)}</span>
      </div>
      <input
        type="range"
        min={def.min}
        max={def.max}
        step={def.step}
        value={value}
        disabled={disabled}
        aria-label={def.label}
        onChange={(e) => onChange(def.key, Number(e.target.value))}
      />
      <div className="flex justify-between font-mono text-[10px] text-muted">
        <span>{def.min}</span>
        <span>{def.max}</span>
      </div>
    </label>
  )
}
