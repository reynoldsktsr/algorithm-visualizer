import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Maze, MazeCell } from './generateMaze'
import { generateMaze, mazeCellKey } from './generateMaze'
import type { MazeAlgorithmId } from './algorithms'
import { MAZE_ALGORITHMS, MAZE_PATH_FUNCTIONS } from './algorithms'

export interface MazeVisualizerProps {
  /** Extra class names applied to the outer wrapper. */
  className?: string
  /** Initial maze size (rows and columns). Defaults to 16. */
  initialSize?: number
  /** Initial algorithm. Defaults to 'bfs'. */
  initialAlgorithm?: MazeAlgorithmId
}

const MIN_SIZE = 6
const MAX_SIZE = 30

function speedToDelayMs(speed: number): number {
  const clamped = Math.min(100, Math.max(1, speed))
  const minDelay = 4
  const maxDelay = 140
  return Math.round(maxDelay - ((clamped - 1) / 99) * (maxDelay - minDelay))
}

/**
 * Animated maze visualization. A perfect maze (exactly one path between any
 * two cells) is generated with a randomized depth-first "recursive
 * backtracker", then BFS, Dijkstra, or A* races from the entrance (top-left)
 * to the exit (bottom-right), revealing the cells it explores and the
 * shortest path it finds.
 */
export function MazeVisualizer({ className, initialSize = 16, initialAlgorithm = 'bfs' }: MazeVisualizerProps) {
  const clampedInitialSize = Math.min(MAX_SIZE, Math.max(MIN_SIZE, initialSize))

  const [size, setSize] = useState(clampedInitialSize)
  const [algorithm, setAlgorithm] = useState<MazeAlgorithmId>(initialAlgorithm)
  const [speed, setSpeed] = useState(70)
  const [maze, setMaze] = useState<Maze>(() => generateMaze(clampedInitialSize, clampedInitialSize))
  const [visitedAnim, setVisitedAnim] = useState<MazeCell[]>([])
  const [pathAnim, setPathAnim] = useState<MazeCell[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const speedRef = useRef(speed)
  speedRef.current = speed
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)
    }
  }, [])

  const start = useMemo<MazeCell>(() => ({ row: 0, col: 0 }), [])
  const end = useMemo<MazeCell>(() => ({ row: maze.rows - 1, col: maze.cols - 1 }), [maze])

  const resetAnimation = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setVisitedAnim([])
    setPathAnim([])
    setIsRunning(false)
  }, [])

  const handleNewMaze = useCallback(() => {
    if (isRunning) return
    setMaze(generateMaze(size, size))
    resetAnimation()
  }, [isRunning, size, resetAnimation])

  const handleSizeChange = useCallback(
    (next: number) => {
      if (isRunning) return
      setSize(next)
      setMaze(generateMaze(next, next))
      resetAnimation()
    },
    [isRunning, resetAnimation],
  )

  const handleRun = useCallback(() => {
    if (isRunning) return
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setVisitedAnim([])
    setPathAnim([])
    setIsRunning(true)

    const result = MAZE_PATH_FUNCTIONS[algorithm](maze, start, end)

    let i = 0
    const stepVisited = () => {
      if (i >= result.visitedOrder.length) {
        runPathPhase()
        return
      }
      const batchEnd = Math.min(result.visitedOrder.length, i + 1)
      setVisitedAnim(result.visitedOrder.slice(0, batchEnd))
      i = batchEnd
      timeoutRef.current = setTimeout(stepVisited, speedToDelayMs(speedRef.current))
    }

    const runPathPhase = () => {
      let j = 0
      const stepPath = () => {
        if (j >= result.path.length) {
          setIsRunning(false)
          return
        }
        const batchEnd = Math.min(result.path.length, j + 1)
        setPathAnim(result.path.slice(0, batchEnd))
        j = batchEnd
        timeoutRef.current = setTimeout(stepPath, speedToDelayMs(speedRef.current) * 2)
      }
      stepPath()
    }

    stepVisited()
  }, [isRunning, algorithm, maze, start, end])

  const visitedSet = useMemo(() => new Set(visitedAnim.map(mazeCellKey)), [visitedAnim])
  const pathSet = useMemo(() => new Set(pathAnim.map(mazeCellKey)), [pathAnim])

  const cellSizePx = useMemo(() => {
    const maxDimension = 560
    const raw = Math.floor(maxDimension / size)
    return Math.min(34, Math.max(12, raw))
  }, [size])

  const rowsArray = useMemo(() => Array.from({ length: maze.rows }, (_, i) => i), [maze.rows])
  const colsArray = useMemo(() => Array.from({ length: maze.cols }, (_, i) => i), [maze.cols])

  return (
    <div className={`flex w-full flex-col gap-4 ${className ?? ''}`}>
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
          Algorithm
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value as MazeAlgorithmId)}
            className="rounded border border-slate-300 bg-white px-2 py-1.5 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            {MAZE_ALGORITHMS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
          Maze size: {size}
          <input
            type="range"
            min={MIN_SIZE}
            max={MAX_SIZE}
            value={size}
            disabled={isRunning}
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
          onClick={handleNewMaze}
          disabled={isRunning}
          className="rounded border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200"
        >
          New maze
        </button>

        <button
          type="button"
          onClick={handleRun}
          disabled={isRunning}
          className="rounded bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-500"
        >
          {isRunning ? 'Solving…' : 'Solve'}
        </button>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div
          className="grid bg-white dark:bg-slate-900"
          style={{ gridTemplateColumns: `repeat(${maze.cols}, ${cellSizePx}px)` }}
        >
          {rowsArray.map((row) =>
            colsArray.map((col) => {
              const cell = { row, col }
              const k = mazeCellKey(cell)
              const isStart = row === start.row && col === start.col
              const isEnd = row === end.row && col === end.col
              const inPath = pathSet.has(k)
              const inVisited = visitedSet.has(k)
              const [top, right, bottom, left] = maze.walls[row][col]

              let colorClass = ''
              if (inVisited) colorClass = 'bg-sky-200 dark:bg-sky-800'
              if (inPath) colorClass = 'bg-amber-400'
              if (isEnd) colorClass = 'bg-rose-500'
              if (isStart) colorClass = 'bg-emerald-500'

              return (
                <div
                  key={k}
                  className={`text-slate-800 transition-colors duration-100 dark:text-slate-300 ${colorClass}`}
                  style={{
                    width: cellSizePx,
                    height: cellSizePx,
                    borderStyle: 'solid',
                    borderColor: 'currentColor',
                    borderTopWidth: top ? 2 : 0,
                    borderRightWidth: right ? 2 : 0,
                    borderBottomWidth: bottom ? 2 : 0,
                    borderLeftWidth: left ? 2 : 0,
                  }}
                />
              )
            }),
          )}
        </div>
        <p className="max-w-lg text-center text-xs text-slate-400">
          Green is the entrance, red is the exit — every maze is solvable by construction (it's
          generated as a spanning tree, so there's exactly one route through).
        </p>
      </div>
    </div>
  )
}

export default MazeVisualizer
