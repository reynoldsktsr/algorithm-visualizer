import { useState } from 'react'
import { SortingVisualizer } from './sorting/SortingVisualizer'
import { PathfindingVisualizer } from './pathfinding/PathfindingVisualizer'

type Tab = 'sorting' | 'pathfinding'

function App() {
  const [tab, setTab] = useState<Tab>('sorting')

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">algorithm-visualizer</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400 sm:text-base">
            Step-by-step animated sorting and pathfinding algorithms as drop-in React components.
            Part of a series of small tech demos by{' '}
            <a
              className="font-medium text-slate-900 underline underline-offset-2 dark:text-slate-100"
              href="https://github.com/reynoldsktsr"
              target="_blank"
              rel="noreferrer"
            >
              Kieran Reynolds
            </a>
            .
          </p>
        </header>

        <div className="flex gap-2 rounded-full border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setTab('sorting')}
            className={`rounded-full px-5 py-1.5 text-sm font-medium transition-colors ${
              tab === 'sorting'
                ? 'bg-slate-900 text-white dark:bg-indigo-600'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            Sorting
          </button>
          <button
            type="button"
            onClick={() => setTab('pathfinding')}
            className={`rounded-full px-5 py-1.5 text-sm font-medium transition-colors ${
              tab === 'pathfinding'
                ? 'bg-slate-900 text-white dark:bg-indigo-600'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
            }`}
          >
            Pathfinding
          </button>
        </div>

        <section className="w-full">
          {tab === 'sorting' ? <SortingVisualizer /> : <PathfindingVisualizer />}
        </section>
      </div>
    </div>
  )
}

export default App
