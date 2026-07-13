import { useState } from 'react'
import DistributionLab from './components/DistributionLab.jsx'
import CLTSimulator from './components/CLTSimulator.jsx'

const TABS = [
  { id: 'lab', numeral: 'I', label: 'Distribution Lab' },
  { id: 'clt', numeral: 'II', label: 'CLT Simulator' },
]

export default function App() {
  // '#clt' deep-links straight to the simulator
  const [tab, setTab] = useState(() =>
    window.location.hash === '#clt' ? 'clt' : 'lab',
  )
  const switchTab = (id) => {
    setTab(id)
    window.history.replaceState(null, '', id === 'clt' ? '#clt' : '#lab')
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
      {/* Masthead: journal-style double rule */}
      <header className="pt-6">
        <div className="border-t-2 border-ink" />
        <div className="mt-[3px] border-t border-hairline" />
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1 py-5">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Probability Lab
          </h1>
          <p className="font-display text-sm italic text-muted">
            An interactive field guide to randomness
          </p>
        </div>
        <nav className="flex gap-6 border-y border-hairline" aria-label="Sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => switchTab(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
              className={`-mb-px border-b-2 py-2.5 text-[13px] uppercase tracking-[0.14em] transition-colors ${
                tab === t.id
                  ? 'border-ink font-semibold text-ink'
                  : 'border-transparent text-muted hover:text-ink2'
              }`}
            >
              <span className="mr-1.5 font-display normal-case italic">{t.numeral}.</span>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="pt-6">
        {tab === 'lab' ? <DistributionLab /> : <CLTSimulator />}
      </main>

      <footer className="mt-12 border-t border-hairline pt-4 text-xs text-muted">
        A pure front-end teaching tool. All distribution math (PDF/PMF, CDF,
        moments, samplers) is implemented from scratch and verified with sanity
        tests — see the README.
      </footer>
    </div>
  )
}
