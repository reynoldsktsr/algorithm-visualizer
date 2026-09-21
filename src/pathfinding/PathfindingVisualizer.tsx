import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Cell, PathAlgorithmId } from './algorithms'
import { PATH_ALGORITHMS, PATH_FUNCTIONS, cellKey } from './algorithms'

export interface PathfindingVisualizerProps {
  /** Extra class names applied to the outer wrapper. */
  className?: string
  /** Initial grid size (rows and columns). Defaults to 20. */
  initialGridSize?: number
  /** Initial algorithm. Defaults to 'bfs'. */
  initialAlgorithm?: PathAlgorithmId
}

const MIN_GRID_SIZE = 8
const MAX_GRID_SIZE = 36

type DragMode = 'start' | 'end' | 'wall-add' | 'wall-erase' | null

function speedToDelayMs(speed: number): number {
  const clamped = Math.min(100, Math.max(1, speed))
  const minDelay = 2
  const maxDelay = 120
  return Math.round(maxDelay - ((clamped - 1) / 99) * (maxDelay - minDelay))
}

function defaultStart(size: number): Cell {
  return { row: Math.floor(size / 2), col: Math.max(0, Math.floor(size * 0.2)) }
}

function defaultEnd(size: number): Cell {
  return { row: Math.floor(size / 2), col: Math.min(size - 1, Math.floor(size * 0.8)) }
}

/**
 * Animated grid visualization of pathfinding algorithms. Draw walls by
 * clicking and dragging over empty cells; drag the start/end markers to
 * relocate them; run BFS, Dijkstra, or A* to watch the search explore the
 * grid and reveal the shortest path.
 */
export function PathfindingVisualizer({
  className,
  initialGridSize = 20,
  initialAlgorithm = 'bfs',
}: PathfindingVisualizerProps) {
  const clampedInitialSize = Math.min(MAX_GRID_SIZE, Math.max(MIN_GRID_SIZE, initialGridSize))

  const [gridSize, setGridSize] = useState(clampedInitialSize)
  const [algorithm, setAlgorithm] = useState<PathAlgorithmId>(initialAlgorithm)
  const [speed, setSpeed] = useState(65)
  const [walls, setWalls] = useState<Set<string>>(new Set())
  const [start, setStart] = useState<Cell>(() => defaultStart(clampedInitialSize))
  const [end, setEnd] = useState<Cell>(() => defaultEnd(clampedInitialSize))
  const [visitedAnim, setVisitedAnim] = useState<Cell[]>([])
  const [pathAnim, setPathAnim] = useState<Cell[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [hasResult, setHasResult] = useState(false)
  const [notFound, setNotFound] = useState(false)

  const speedRef = useRef(speed)
  speedRef.current = speed
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mouseDownRef = useRef(false)
  const dragModeRef = useRef<DragMode>(null)
  const startRef = useRef(start)
  const endRef = useRef(end)
  startRef.current = start
  endRef.current = end

  useEffect(() => {
    const handleUp = () => {
      mouseDownRef.current = false
      dragModeRef.current = null
    }
    window.addEventListener('mouseup', handleUp)
    return () => window.removeEventListener('mouseup', handleUp)
  }, [])

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)
    }
  }, [])

  const resetAnimation = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setVisitedAnim([])
    setPathAnim([])
    setHasResult(false)
    setNotFound(false)
    setIsRunning(false)
  }, [])

  const handleGridSizeChange = useCallback(
    (next: number) => {
      if (isRunning) return
      setGridSize(next)
      setStart(defaultStart(next))
      setEnd(defaultEnd(next))
      setWalls(new Set())
      resetAnimation()
    },
    [isRunning, resetAnimation],
  )

  const handleClearWalls = useCallback(() => {
    if (isRunning) return
    setWalls(new Set())
    resetAnimation()
  }, [isRunning, resetAnimation])

  const handleClearPath = useCallback(() => {
    if (isRunning) return
    resetAnimation()
  }, [isRunning, resetAnimation])

  const handleRun = useCallback(() => {
    if (isRunning) return
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setVisitedAnim([])
    setPathAnim([])
    setHasResult(false)
    setNotFound(false)
    setIsRunning(true)

    const result = PATH_FUNCTIONS[algorithm](gridSize, gridSize, walls, start, end)

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
      if (result.path.length === 0) {
        setIsRunning(false)
        setHasResult(true)
        setNotFound(true)
        return
      }
      let j = 0
      const stepPath = () => {
        if (j >= result.path.length) {
          setIsRunning(false)
          setHasResult(true)
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
  }, [isRunning, algorithm, gridSize, walls, start, end])

  const setWallState = useCallback(
    (cell: Cell, wallPresent: boolean) => {
      const isMarker =
        (cell.row === startRef.current.row && cell.col === startRef.current.col) ||
        (cell.row === endRef.current.row && cell.col === endRef.current.col)
      if (isMarker) return
      const k = cellKey(cell)
      setWalls((prev) => {
        const has = prev.has(k)
        if (has === wallPresent) return prev
        const next = new Set(prev)
        if (wallPresent) next.add(k)
        else next.delete(k)
        return next
      })
      if (hasResult) resetAnimation()
    },
    [hasResult, resetAnimation],
  )

  const handleCellMouseDown = useCallback(
    (cell: Cell) => {
      if (isRunning) return
      mouseDownRef.current = true
      if (cell.row === start.row && cell.col === start.col) {
        dragModeRef.current = 'start'
      } else if (cell.row === end.row && cell.col === end.col) {
        dragModeRef.current = 'end'
      } else {
        const isWall = walls.has(cellKey(cell))
        dragModeRef.current = isWall ? 'wall-erase' : 'wall-add'
        setWallState(cell, !isWall)
      }
    },
    [isRunning, start, end, walls, setWallState],
  )

  const handleCellMouseEnter = useCallback(
    (cell: Cell) => {
      if (!mouseDownRef.current || isRunning) return
      const mode = dragModeRef.current
      const k = cellKey(cell)
      if (mode === 'start') {
        if (walls.has(k) || (cell.row === end.row && cell.col === end.col)) return
        setStart(cell)
        if (hasResult) resetAnimation()
      } else if (mode === 'end') {
        if (walls.has(k) || (cell.row === start.row && cell.col === start.col)) return
        setEnd(cell)
        if (hasResult) resetAnimation()
      } else if (mode === 'wall-add') {
        setWallState(cell, true)
      } else if (mode === 'wall-erase') {
        setWallState(cell, false)
      }
    },
    [isRunning, walls, start, end, hasResult, resetAnimation, setWallState],
  )

  const visitedSet = useMemo(() => new Set(visitedAnim.map(cellKey)), [visitedAnim])
  const pathSet = useMemo(() => new Set(pathAnim.map(cellKey)), [pathAnim])

  const cellSizePx = useMemo(() => {
    const maxDimension = 620
    const raw = Math.floor(maxDimension / gridSize)
    return Math.min(30, Math.max(10, raw))
  }, [gridSize])

  const rowsArray = useMemo(() => Array.from({ length: gridSize }, (_, i) => i), [gridSize])
  const colsArray = useMemo(() => Array.from({ length: gridSize }, (_, i) => i), [gridSize])

  return (
    <div className={`flex w-full flex-col gap-4 ${className ?? ''}`}>
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
          Algorithm
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value as PathAlgorithmId)}
            className="rounded border border-slate-300 bg-white px-2 py-1.5 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            {PATH_ALGORITHMS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
          Grid size: {gridSize}
          <input
            type="range"
            min={MIN_GRID_SIZE}
            max={MAX_GRID_SIZE}
            value={gridSize}
            disabled={isRunning}
            onChange={(e) => handleGridSizeChange(Number(e.target.value))}
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
          onClick={handleClearWalls}
          disabled={isRunning}
          className="rounded border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200"
        >
          Clear walls
        </button>

        <button
          type="button"
          onClick={handleClearPath}
          disabled={isRunning}
          className="rounded border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200"
        >
          Clear path
        </button>

        <button
          type="button"
          onClick={handleRun}
          disabled={isRunning}
          className="rounded bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-500"
        >
          {isRunning ? 'Running…' : 'Run'}
        </button>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div
          className="grid touch-none select-none gap-px rounded-lg border border-slate-300 bg-slate-300 p-px dark:border-slate-600 dark:bg-slate-600"
          style={{ gridTemplateColumns: `repeat(${gridSize}, ${cellSizePx}px)` }}
        >
          {rowsArray.map((row) =>
            colsArray.map((col) => {
              const k = `${row},${col}`
              const isStart = row === start.row && col === start.col
              const isEnd = row === end.row && col === end.col
              const isWall = walls.has(k)
              const inPath = pathSet.has(k)
              const inVisited = visitedSet.has(k)

              let colorClass = 'bg-white dark:bg-slate-800'
              if (inVisited) colorClass = 'bg-sky-300 dark:bg-sky-700'
              if (inPath) colorClass = 'bg-amber-400'
              if (isWall) colorClass = 'bg-slate-800 dark:bg-slate-950'
              if (isEnd) colorClass = 'bg-rose-500'
              if (isStart) colorClass = 'bg-emerald-500'

              return (
                <div
                  key={k}
                  onMouseDown={() => handleCellMouseDown({ row, col })}
                  onMouseEnter={() => handleCellMouseEnter({ row, col })}
                  className={`transition-colors duration-100 ${colorClass} ${
                    isStart || isEnd ? 'cursor-grab' : 'cursor-pointer'
                  }`}
                  style={{ width: cellSizePx, height: cellSizePx }}
                />
              )
            }),
          )}
        </div>
        {notFound && (
          <p className="text-sm font-medium text-rose-500">No path exists between start and end.</p>
        )}
        <p className="max-w-lg text-center text-xs text-slate-400">
          Click and drag on empty cells to draw walls. Drag the green (start) or red (end) marker to
          move it.
        </p>
      </div>
    </div>
  )
}

export default PathfindingVisualizer
