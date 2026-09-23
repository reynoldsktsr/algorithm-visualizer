import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { GeneratedTree } from './generateTree'
import { generateTree } from './generateTree'
import type { TreeAlgorithmId } from './algorithms'
import { TREE_ALGORITHMS, bfsTraversal, dfsTraversal, findLowestCommonAncestor, findPathToNode } from './algorithms'

export interface TreeVisualizerProps {
  /** Extra class names applied to the outer wrapper. */
  className?: string
  /** Initial node count. Defaults to 19. */
  initialNodeCount?: number
  /** Initial algorithm/mode. Defaults to 'bfs'. */
  initialAlgorithm?: TreeAlgorithmId
}

const H_SPACING = 46
const V_SPACING = 70
const RADIUS = 17
const PADDING = 30

function speedToDelayMs(speed: number): number {
  const clamped = Math.min(100, Math.max(1, speed))
  const minDelay = 60
  const maxDelay = 700
  return Math.round(maxDelay - ((clamped - 1) / 99) * (maxDelay - minDelay))
}

type StepColor = 'visited' | 'path-a' | 'path-b' | 'lca'

/**
 * Animated visualization of classic binary-tree interview algorithms: BFS
 * and DFS traversal, root-to-node path finding, and lowest common ancestor.
 * Click nodes on the tree to pick a target (path mode) or a pair of targets
 * (LCA mode), then run.
 */
export function TreeVisualizer({ className, initialNodeCount = 19, initialAlgorithm = 'bfs' }: TreeVisualizerProps) {
  const [nodeCount, setNodeCount] = useState(Math.max(3, Math.min(63, initialNodeCount)))
  const [mode, setMode] = useState<TreeAlgorithmId>(initialAlgorithm)
  const [speed, setSpeed] = useState(60)
  const [tree, setTree] = useState<GeneratedTree>(() => generateTree(nodeCount))
  const [targetId, setTargetId] = useState<number | null>(null)
  const [pairIds, setPairIds] = useState<[number | null, number | null]>([null, null])
  const [steps, setSteps] = useState<Array<{ id: number; color: StepColor }>>([])
  const [revealed, setRevealed] = useState(0)
  const [isRunning, setIsRunning] = useState(false)

  const speedRef = useRef(speed)
  speedRef.current = speed
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
    setSteps([])
    setRevealed(0)
    setIsRunning(false)
  }, [])

  const handleNewTree = useCallback(() => {
    if (isRunning) return
    setTree(generateTree(nodeCount))
    setTargetId(null)
    setPairIds([null, null])
    resetAnimation()
  }, [isRunning, nodeCount, resetAnimation])

  const handleNodeCountChange = useCallback(
    (next: number) => {
      if (isRunning) return
      setNodeCount(next)
      setTree(generateTree(next))
      setTargetId(null)
      setPairIds([null, null])
      resetAnimation()
    },
    [isRunning, resetAnimation],
  )

  const handleModeChange = useCallback(
    (next: TreeAlgorithmId) => {
      if (isRunning) return
      setMode(next)
      setTargetId(null)
      setPairIds([null, null])
      resetAnimation()
    },
    [isRunning, resetAnimation],
  )

  const handleNodeClick = useCallback(
    (id: number) => {
      if (isRunning) return
      if (mode === 'path') {
        setTargetId(id)
        resetAnimation()
      } else if (mode === 'lca') {
        setPairIds(([a, b]) => {
          if (a === null || (b !== null && a !== null)) return [id, null]
          if (id === a) return [a, null]
          return [a, id]
        })
        resetAnimation()
      }
    },
    [isRunning, mode, resetAnimation],
  )

  const canRun =
    mode === 'bfs' || mode === 'dfs' ? true : mode === 'path' ? targetId !== null : pairIds[0] !== null && pairIds[1] !== null

  const handleRun = useCallback(() => {
    if (isRunning || !canRun) return
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)
    setSteps([])
    setRevealed(0)
    setIsRunning(true)

    let plan: Array<{ id: number; color: StepColor }> = []
    if (mode === 'bfs') {
      plan = bfsTraversal(tree).map((id) => ({ id, color: 'visited' }))
    } else if (mode === 'dfs') {
      plan = dfsTraversal(tree).map((id) => ({ id, color: 'visited' }))
    } else if (mode === 'path' && targetId !== null) {
      plan = findPathToNode(tree, targetId).map((id) => ({ id, color: 'path-a' }))
    } else if (mode === 'lca' && pairIds[0] !== null && pairIds[1] !== null) {
      const result = findLowestCommonAncestor(tree, pairIds[0], pairIds[1])
      const rootToLca = findPathToNode(tree, result.lcaId).map((id) => ({ id, color: 'visited' as StepColor }))
      const toA = result.pathToA.slice(1).map((id) => ({ id, color: 'path-a' as StepColor }))
      const toB = result.pathToB.slice(1).map((id) => ({ id, color: 'path-b' as StepColor }))
      const interleavedTail: Array<{ id: number; color: StepColor }> = []
      const maxLen = Math.max(toA.length, toB.length)
      for (let i = 0; i < maxLen; i++) {
        if (toA[i]) interleavedTail.push(toA[i])
        if (toB[i]) interleavedTail.push(toB[i])
      }
      plan = [...rootToLca, ...interleavedTail, { id: result.lcaId, color: 'lca' }]
    }

    setSteps(plan)

    let i = 0
    const step = () => {
      if (i >= plan.length) {
        setIsRunning(false)
        return
      }
      i += 1
      setRevealed(i)
      timeoutRef.current = setTimeout(step, speedToDelayMs(speedRef.current))
    }
    step()
  }, [isRunning, canRun, mode, tree, targetId, pairIds])

  const revealedSteps = useMemo(() => steps.slice(0, revealed), [steps, revealed])
  const colorByNode = useMemo(() => {
    const map = new Map<number, StepColor>()
    for (const s of revealedSteps) map.set(s.id, s.color)
    return map
  }, [revealedSteps])

  const nodes = useMemo(() => Object.values(tree.nodes), [tree])
  const width = tree.width * H_SPACING + PADDING * 2
  const height = tree.height * V_SPACING + PADDING * 2

  const posOf = useCallback(
    (id: number) => {
      const node = tree.nodes[id]
      return { cx: PADDING + node.x * H_SPACING, cy: PADDING + node.depth * V_SPACING }
    },
    [tree],
  )

  const fillFor = useCallback(
    (id: number): string => {
      const color = colorByNode.get(id)
      if (color === 'lca') return 'fill-fuchsia-500'
      if (color === 'path-a') return 'fill-amber-400'
      if (color === 'path-b') return 'fill-emerald-400'
      if (color === 'visited') return 'fill-sky-300 dark:fill-sky-700'
      if (id === targetId && mode === 'path') return 'fill-amber-200 dark:fill-amber-900'
      if ((id === pairIds[0] || id === pairIds[1]) && mode === 'lca') return 'fill-amber-200 dark:fill-amber-900'
      return 'fill-white dark:fill-slate-800'
    },
    [colorByNode, targetId, pairIds, mode],
  )

  return (
    <div className={`flex w-full flex-col gap-4 ${className ?? ''}`}>
      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
          Mode
          <select
            value={mode}
            onChange={(e) => handleModeChange(e.target.value as TreeAlgorithmId)}
            className="rounded border border-slate-300 bg-white px-2 py-1.5 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
          >
            {TREE_ALGORITHMS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
          Nodes: {nodeCount}
          <input
            type="range"
            min={5}
            max={40}
            value={nodeCount}
            disabled={isRunning}
            onChange={(e) => handleNodeCountChange(Number(e.target.value))}
            className="w-36"
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
          onClick={handleNewTree}
          disabled={isRunning}
          className="rounded border border-slate-300 px-4 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200"
        >
          New tree
        </button>

        <button
          type="button"
          onClick={handleRun}
          disabled={isRunning || !canRun}
          className="rounded bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-indigo-600 dark:hover:bg-indigo-500"
        >
          {isRunning ? 'Running…' : 'Run'}
        </button>
      </div>

      <p className="text-center text-xs text-slate-400">
        {mode === 'bfs' && 'Visits every node level by level — no selection needed, just run.'}
        {mode === 'dfs' && 'Visits every node depth-first (left before right) — no selection needed, just run.'}
        {mode === 'path' && (targetId === null ? 'Click a node to pick a target, then run.' : 'Click a different node to change the target.')}
        {mode === 'lca' &&
          (pairIds[0] === null
            ? 'Click a node to start selecting a pair.'
            : pairIds[1] === null
              ? 'Click a second node to complete the pair.'
              : 'Click any node to start a new pair.')}
      </p>

      <div className="flex justify-center overflow-x-auto">
        <svg width={width} height={height} className="max-w-full">
          {nodes.map((node) =>
            node.leftId !== null || node.rightId !== null ? (
              <g key={`edges-${node.id}`}>
                {node.leftId !== null && (
                  <Edge from={posOf(node.id)} to={posOf(node.leftId)} />
                )}
                {node.rightId !== null && (
                  <Edge from={posOf(node.id)} to={posOf(node.rightId)} />
                )}
              </g>
            ) : null,
          )}
          {nodes.map((node) => {
            const { cx, cy } = posOf(node.id)
            const isSelectable = mode === 'path' || mode === 'lca'
            return (
              <g
                key={node.id}
                onClick={() => handleNodeClick(node.id)}
                className={isSelectable && !isRunning ? 'cursor-pointer' : ''}
              >
                <circle
                  cx={cx}
                  cy={cy}
                  r={RADIUS}
                  className={`stroke-slate-400 transition-colors duration-150 dark:stroke-slate-500 ${fillFor(node.id)}`}
                  strokeWidth={1.5}
                />
                <text
                  x={cx}
                  y={cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="select-none fill-slate-900 text-[11px] font-medium dark:fill-slate-100"
                >
                  {node.value}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

function Edge({ from, to }: { from: { cx: number; cy: number }; to: { cx: number; cy: number } }) {
  return (
    <line
      x1={from.cx}
      y1={from.cy}
      x2={to.cx}
      y2={to.cy}
      className="stroke-slate-300 dark:stroke-slate-600"
      strokeWidth={1.5}
    />
  )
}

export default TreeVisualizer
