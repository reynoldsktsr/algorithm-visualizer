import { useState } from 'react'
import { SortingVisualizer } from './sorting/SortingVisualizer'
import { MazeVisualizer } from './maze/MazeVisualizer'
import { TreeVisualizer } from './tree/TreeVisualizer'

type Tab = 'sorting' | 'maze' | 'tree'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'sorting', label: 'Sorting' },
  { id: 'maze', label: 'Maze' },
  { id: 'tree', label: 'Tree' },
]

function App() {
  const [tab, setTab] = useState<Tab>('sorting')

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-8">
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">algorithm-visualizer</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400 sm:text-base">
            Step-by-step animated sorting, maze-solving, and binary-tree algorithms as drop-in React
            components. Part of a series of small tech demos by{' '}
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
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full px-5 py-1.5 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-slate-900 text-white dark:bg-indigo-600'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <section className="w-full">
          {tab === 'sorting' && <SortingVisualizer />}
          {tab === 'maze' && <MazeVisualizer />}
          {tab === 'tree' && <TreeVisualizer />}
        </section>
      </div>
    </div>
  )
}

export default App
