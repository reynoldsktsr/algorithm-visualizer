import { useCallback, useEffect, useRef, useState } from 'react'
import type { SortAlgorithmId, SortStep } from './algorithms'
import { SORT_ALGORITHMS, SORT_FUNCTIONS } from './algorithms'

export interface SortingVisualizerProps {
  /** Extra class names applied to the outer wrapper. */
  className?: string
  /** Initial array size. Defaults to 40. */
  initialSize?: number
  /** Initial algorithm. Defaults to 'bubble'. */
  initialAlgorithm?: SortAlgorithmId
}

const MIN_SIZE = 5
const MAX_SIZE = 120
const MIN_VALUE = 5
const MAX_VALUE = 100

function randomArray(size: number): number[] {
  return Array.from({ length: size }, () => Math.floor(Math.random() * (MAX_VALUE - MIN_VALUE + 1)) + MIN_VALUE)
}

/** Map a 1-100 speed slider to a per-step delay in milliseconds (higher = faster). */
function speedToDelayMs(speed: number): number {
  const clamped = Math.min(100, Math.max(1, speed))
  const minDelay = 4
  const maxDelay = 400
  return Math.round(maxDelay - ((clamped - 1) / 99) * (maxDelay - minDelay))
}

type Highlight = { comparing: number[]; swapping: number[] }

const NO_HIGHLIGHT: Highlight = { comparing: [], swapping: [] }

/**
 * Animated bar-chart visualization of sorting algorithms. Plays back a
 * generator-recorded sequence of real comparisons/swaps/overwrites one step
 * at a time, coloring bars currently being compared or swapped.
 */
export function SortingVisualizer({
  className,
  initialSize = 40,
  initialAlgorithm = 'bubble',
}: SortingVisualizerProps) {
  const [algorithm, setAlgorithm] = useState<SortAlgorithmId>(initialAlgorithm)
  const [size, setSize] = useState(() => Math.min(MAX_SIZE, Math.max(MIN_SIZE, initialSize)))
  const [speed, setSpeed] = useState(55)
  const [baseArray, setBaseArray] = useState<number[]>(() => randomArray(initialSize))
  const [displayArray, setDisplayArray] = useState<number[]>(baseArray)
  const [highlight, setHighlight] = useState<Highlight>(NO_HIGHLIGHT)
  const [sortedIndices, setSortedIndices] = useState<Set<number>>(new Set())
  const [isPlaying, setIsPlaying] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const stepsRef = useRef<SortStep[]>([])
  const stepIndexRef = useRef(0)
  const workingArrayRef = useRef<number[]>([])
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const speedRef = useRef(speed)
  speedRef.current = speed

  const rebuild = useCallback((arr: number[], algo: SortAlgorithmId) => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    stepsRef.current = Array.from(SORT_FUNCTIONS[algo](arr))
    stepIndexRef.current = 0
    workingArrayRef.current = arr.slice()
    setDisplayArray(arr.slice())
    setHighlight(NO_HIGHLIGHT)
    setSortedIndices(new Set())
    setIsPlaying(false)
    setIsDone(arr.length <= 1)
  }, [])

  // (Re)build the step list whenever the base array or algorithm changes.
  useEffect(() => {
    rebuild(baseArray, algorithm)
  }, [baseArray, algorithm, rebuild])

  const applyNextStep = useCallback((): boolean => {
    const steps = stepsRef.current
    const idx = stepIndexRef.current
    if (idx >= steps.length) return false
    const step = steps[idx]
    stepIndexRef.current = idx + 1

    if (step.kind === 'compare') {
      setHighlight({ comparing: step.indices, swapping: [] })
    } else if (step.kind === 'swap') {
      const [i, j] = step.indices
      const arr = workingArrayRef.current
      const tmp = arr[i]
      arr[i] = arr[j]
      arr[j] = tmp
      setDisplayArray(arr.slice())
      setHighlight({ comparing: [], swapping: step.indices })
    } else if (step.kind === 'overwrite') {
      const arr = workingArrayRef.current
      arr[step.index] = step.value
      setDisplayArray(arr.slice())
      setHighlight({ comparing: [], swapping: [step.index] })
    } else if (step.kind === 'sorted') {
      setSortedIndices((prev) => {
        const next = new Set(prev)
        for (const i of step.indices) next.add(i)
        return next
      })
    }

    if (stepIndexRef.current >= steps.length) {
      setIsDone(true)
      setHighlight(NO_HIGHLIGHT)
    }
    return true
  }, [])

  // Playback loop.
  useEffect(() => {
    if (!isPlaying) return
    const tick = () => {
      const hasMore = applyNextStep()
      if (!hasMore) {
        setIsPlaying(false)
        return
      }
      timeoutRef.current = setTimeout(tick, speedToDelayMs(speedRef.current))
    }
    timeoutRef.current = setTimeout(tick, speedToDelayMs(speedRef.current))
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, applyNextStep])

  const handleShuffle = useCallback(() => {
    setBaseArray(randomArray(size))
  }, [size])

  const handleSizeChange = useCallback((next: number) => {
    setSize(next)
    setBaseArray(randomArray(next))
  }, [])

  const handleAlgorithmChange = useCallback((next: SortAlgorithmId) => {
    setAlgorithm(next)
  }, [])

  const handlePlayPause = useCallback(() => {
    if (isDone) return
    setIsPlaying((p) => !p)
  }, [isDone])

  const handleStep = useCallback(() => {
    if (isPlaying) setIsPlaying(false)
    applyNextStep()
  }, [isPlaying, applyNextStep])

  return (
    <div className={`flex w-full flex-col gap-4 ${className ?? ''}`}>
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
          Algorithm
          <select
            value={algorithm}
            onChange={(e) => handleAlgorithmChange(e.target.value as SortAlgorithmId)}
            className="rounded border border-slate-300 bg-white px-2 py-1.5 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            {SORT_ALGORITHMS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
          Array size: {size}
          <input
            type="range"
            min={MIN_SIZE}
            max={MAX_SIZE}
            value={size}
            disabled={isPlaying}
            onChange={(e) => handleSizeChange(Number(e.target.value))}
            className="w-40"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
          Speed: {speed}
          <input
            type="range"
            min={1}
            max={100}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="w-40"
          />
        </label>

        <button
          type="button"
          onClick={handleShuffle}
          disabled={isPlaying}
          className="rounded border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200"
        >
          Shuffle
        </button>

        <button
          type="button"
          onClick={handlePlayPause}
          disabled={isDone}
          className="rounded bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-500"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <button
          type="button"
          onClick={handleStep}
          disabled={isDone}
          className="rounded border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200"
        >
          Step
        </button>
      </div>

      <div className="flex h-72 w-full items-end gap-px rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        {displayArray.map((value, index) => {
          const isComparing = highlight.comparing.includes(index)
          const isSwapping = highlight.swapping.includes(index)
          const isSorted = sortedIndices.has(index)
          let colorClass = 'bg-slate-400 dark:bg-slate-500'
          if (isSorted) colorClass = 'bg-emerald-500'
          if (isComparing) colorClass = 'bg-amber-400'
          if (isSwapping) colorClass = 'bg-rose-500'
          return (
            <div
              key={index}
              className={`min-w-[2px] flex-1 rounded-t transition-colors duration-75 ${colorClass}`}
              style={{ height: `${(value / MAX_VALUE) * 100}%` }}
              title={String(value)}
            />
          )
        })}
      </div>
    </div>
  )
}

export default SortingVisualizer
