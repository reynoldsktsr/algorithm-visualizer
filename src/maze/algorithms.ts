/**
 * Search algorithms (BFS, Dijkstra, A*) over a generated maze. Neighbors
 * come from `mazeNeighbors`, which only returns cells reachable through an
 * open passage — so these explore corridors rather than an open grid.
 */

import type { Maze, MazeCell } from './generateMaze'
import { mazeCellKey, mazeNeighbors } from './generateMaze'

export interface MazePathResult {
  /** Cells in the order they were visited/settled by the algorithm. */
  visitedOrder: MazeCell[]
  /** The path from start to end, inclusive. Empty if unreachable. */
  path: MazeCell[]
}

export type MazeAlgorithmId = 'bfs' | 'dijkstra' | 'astar'

export interface MazeAlgorithmInfo {
  id: MazeAlgorithmId
  label: string
}

export const MAZE_ALGORITHMS: MazeAlgorithmInfo[] = [
  { id: 'bfs', label: 'Breadth-First Search' },
  { id: 'dijkstra', label: "Dijkstra's Algorithm" },
  { id: 'astar', label: 'A* Search' },
]

function reconstructPath(cameFrom: Map<string, string>, start: MazeCell, end: MazeCell): MazeCell[] {
  const startKey = mazeCellKey(start)
  const endKey = mazeCellKey(end)
  if (startKey === endKey) return [start]
  if (!cameFrom.has(endKey)) return []

  const path: MazeCell[] = []
  let currentKey: string | undefined = endKey
  while (currentKey !== undefined && currentKey !== startKey) {
    const [r, c] = currentKey.split(',').map(Number)
    path.push({ row: r, col: c })
    currentKey = cameFrom.get(currentKey)
  }
  if (currentKey !== startKey) return []
  path.push(start)
  path.reverse()
  return path
}

export function mazeBfs(maze: Maze, start: MazeCell, end: MazeCell): MazePathResult {
  const visitedOrder: MazeCell[] = []
  const cameFrom = new Map<string, string>()
  const visited = new Set<string>([mazeCellKey(start)])
  const queue: MazeCell[] = [start]
  let head = 0

  while (head < queue.length) {
    const current = queue[head++]
    visitedOrder.push(current)
    if (current.row === end.row && current.col === end.col) break

    for (const next of mazeNeighbors(maze, current)) {
      const nk = mazeCellKey(next)
      if (visited.has(nk)) continue
      visited.add(nk)
      cameFrom.set(nk, mazeCellKey(current))
      queue.push(next)
    }
  }

  const path = visited.has(mazeCellKey(end)) ? reconstructPath(cameFrom, start, end) : []
  return { visitedOrder, path }
}

/** Extracts and removes the cell with the smallest priority value. O(n) — fine for maze-sized queues. */
function extractMin(open: MazeCell[], priority: Map<string, number>): MazeCell {
  let bestIndex = 0
  let bestPriority = priority.get(mazeCellKey(open[0])) ?? Infinity
  for (let i = 1; i < open.length; i++) {
    const p = priority.get(mazeCellKey(open[i])) ?? Infinity
    if (p < bestPriority) {
      bestPriority = p
      bestIndex = i
    }
  }
  return open.splice(bestIndex, 1)[0]
}

export function mazeDijkstra(maze: Maze, start: MazeCell, end: MazeCell): MazePathResult {
  const startKey = mazeCellKey(start)
  const dist = new Map<string, number>([[startKey, 0]])
  const cameFrom = new Map<string, string>()
  const visited = new Set<string>()
  const visitedOrder: MazeCell[] = []
  const open: MazeCell[] = [start]

  while (open.length > 0) {
    const current = extractMin(open, dist)
    const ck = mazeCellKey(current)
    if (visited.has(ck)) continue
    visited.add(ck)
    visitedOrder.push(current)
    if (current.row === end.row && current.col === end.col) break

    const currentDist = dist.get(ck) ?? Infinity
    for (const next of mazeNeighbors(maze, current)) {
      const nk = mazeCellKey(next)
      if (visited.has(nk)) continue
      const tentative = currentDist + 1
      if (tentative < (dist.get(nk) ?? Infinity)) {
        dist.set(nk, tentative)
        cameFrom.set(nk, ck)
        open.push(next)
      }
    }
  }

  const path = visited.has(mazeCellKey(end)) ? reconstructPath(cameFrom, start, end) : []
  return { visitedOrder, path }
}

function manhattan(a: MazeCell, b: MazeCell): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col)
}

export function mazeAStar(maze: Maze, start: MazeCell, end: MazeCell): MazePathResult {
  const startKey = mazeCellKey(start)
  const gScore = new Map<string, number>([[startKey, 0]])
  const fScore = new Map<string, number>([[startKey, manhattan(start, end)]])
  const cameFrom = new Map<string, string>()
  const visited = new Set<string>()
  const visitedOrder: MazeCell[] = []
  const open: MazeCell[] = [start]
  const inOpen = new Set<string>([startKey])

  while (open.length > 0) {
    const current = extractMin(open, fScore)
    const ck = mazeCellKey(current)
    inOpen.delete(ck)
    if (visited.has(ck)) continue
    visited.add(ck)
    visitedOrder.push(current)
    if (current.row === end.row && current.col === end.col) break

    const currentG = gScore.get(ck) ?? Infinity
    for (const next of mazeNeighbors(maze, current)) {
      const nk = mazeCellKey(next)
      if (visited.has(nk)) continue
      const tentativeG = currentG + 1
      if (tentativeG < (gScore.get(nk) ?? Infinity)) {
        cameFrom.set(nk, ck)
        gScore.set(nk, tentativeG)
        fScore.set(nk, tentativeG + manhattan(next, end))
        if (!inOpen.has(nk)) {
          open.push(next)
          inOpen.add(nk)
        }
      }
    }
  }

  const path = visited.has(mazeCellKey(end)) ? reconstructPath(cameFrom, start, end) : []
  return { visitedOrder, path }
}

export const MAZE_PATH_FUNCTIONS: Record<MazeAlgorithmId, (maze: Maze, start: MazeCell, end: MazeCell) => MazePathResult> = {
  bfs: mazeBfs,
  dijkstra: mazeDijkstra,
  astar: mazeAStar,
}
