/** Stat tile: sentence-case label, semibold value, optional formula caption. */
export default function StatTile({ label, value, caption }) {
  return (
    <div className="border border-hairline bg-surface px-4 py-3">
      <div className="text-[11px] uppercase tracking-[0.12em] text-muted">{label}</div>
      <div className="mt-1 text-xl font-semibold text-ink">{value}</div>
      {caption && <div className="mt-0.5 font-mono text-[11px] text-muted">{caption}</div>}
    </div>
  )
}
