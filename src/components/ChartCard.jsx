/** A chart panel: serif title, muted subtitle, fixed-height plot area. */
export default function ChartCard({ title, subtitle, children, height = 'h-64' }) {
  return (
    <section className="border border-hairline bg-surface p-4">
      <h3 className="font-display text-[17px] font-medium text-ink">{title}</h3>
      {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      <div className={`mt-3 min-w-0 overflow-hidden ${height}`}>{children}</div>
    </section>
  )
}
