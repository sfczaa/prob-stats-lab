import TeX from './TeX.jsx'

function Column({ title, lines, note }) {
  return (
    <div className="min-w-0">
      <h4 className="text-[11px] uppercase tracking-[0.16em] text-muted">{title}</h4>
      <div className="mt-2 space-y-1.5 text-[15px] text-ink">
        {lines.map((l) => (
          <TeX key={l} tex={l} block />
        ))}
      </div>
      {note && <p className="mt-2 text-xs leading-snug text-muted">{note}</p>}
    </div>
  )
}

/** Symbolic moments, MLE and MME for the selected distribution. */
export default function EstimationPanel({ dist }) {
  const f = dist.formulas
  return (
    <section className="border border-hairline bg-surface p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-[17px] font-medium text-ink">
          Moments &amp; estimators
        </h3>
        <span className="text-xs text-muted">
          for an iid sample <TeX tex="X_1,\dots,X_n" />
        </span>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-3">
        <Column
          title="Moments"
          lines={[`E[X] = ${f.mean}`, `\\operatorname{Var}(X) = ${f.variance}`]}
        />
        <Column title="Maximum likelihood" lines={f.mle} note={f.mleNote} />
        <Column title="Method of moments" lines={f.mme} note={f.mmeNote} />
      </div>
      <p className="mt-4 border-t border-hairline pt-2 text-[11px] leading-snug text-muted">
        Notation: <TeX tex="\bar X = \tfrac1n\sum X_i" />,{' '}
        <TeX tex="S_n^2 = \tfrac1n\sum (X_i-\bar X)^2" /> (so{' '}
        <TeX tex="S_n = \sqrt{S_n^2}" />),{' '}
        <TeX tex="\overline{\ln X} = \tfrac1n\sum \ln X_i" />,{' '}
        <TeX tex="X_{(1)} \le \dots \le X_{(n)}" /> are the order statistics, and{' '}
        <TeX tex="\psi" /> is the digamma function.
      </p>
    </section>
  )
}
