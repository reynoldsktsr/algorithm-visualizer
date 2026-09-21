/**
 * Grid pathfinding algorithms (BFS, Dijkstra, A*) on an unweighted grid
 * (every open cell costs 1 to enter; walls are impassable). Each function
 * returns the order in which cells were visited/settled (for animating the
 * search) and the final shortest path from start to end, if one exists.
 */

export interface Cell {
  row: number
  col: number
}

export interface PathResult {
  /** Cells in the order they were visited/settled by the algorithm. */
  visitedOrder: Cell[]
  /** The shortest path from start to end, inclusive. Empty if unreachable. */
  path: Cell[]
}

export type PathAlgorithmId = 'bfs' | 'dijkstra' | 'astar'

export interface PathAlgorithmInfo {
  id: PathAlgorithmId
  label: string
}

export const PATH_ALGORITHMS: PathAlgorithmInfo[] = [
  { id: 'bfs', label: 'Breadth-First Search' },
  { id: 'dijkstra', label: "Dijkstra's Algorithm" },
  { id: 'astar', label: 'A* Search' },
]

function key(row: number, col: number): string {
  return `${row},${col}`
}

function neighbors(cell: Cell, rows: number, cols: number): Cell[] {
  const deltas: Array<[number, number]> = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]
  const result: Cell[] = []
  for (const [dr, dc] of deltas) {
    const row = cell.row + dr
    const col = cell.col + dc
    if (row >= 0 && row < rows && col >= 0 && col < cols) result.push({ row, col })
  }
  return result
}

function reconstructPath(cameFrom: Map<string, string>, start: Cell, end: Cell): Cell[] {
  const startKey = key(start.row, start.col)
  const endKey = key(end.row, end.col)
  if (startKey === endKey) return [start]
  if (!cameFrom.has(endKey)) return []

  const path: Cell[] = []
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

export function bfs(rows: number, cols: number, walls: Set<string>, start: Cell, end: Cell): PathResult {
  const visitedOrder: Cell[] = []
  const cameFrom = new Map<string, string>()
  const visited = new Set<string>([key(start.row, start.col)])
  const queue: Cell[] = [start]
  let queueHead = 0

  while (queueHead < queue.length) {
    const current = queue[queueHead++]
    visitedOrder.push(current)
    if (current.row === end.row && current.col === end.col) break

    for (const next of neighbors(current, rows, cols)) {
      const nk = key(next.row, next.col)
      if (visited.has(nk) || walls.has(nk)) continue
      visited.add(nk)
      cameFrom.set(nk, key(current.row, current.col))
      queue.push(next)
    }
  }

  const path = visited.has(key(end.row, end.col)) ? reconstructPath(cameFrom, start, end) : []
  return { visitedOrder, path }
}

/** Extracts and removes the cell with the smallest priority value. O(n) — fine for grid-sized queues. */
function extractMin(open: Cell[], priority: Map<string, number>): Cell {
  let bestIndex = 0
  let bestPriority = priority.get(key(open[0].row, open[0].col)) ?? Infinity
  for (let i = 1; i < open.length; i++) {
    const p = priority.get(key(open[i].row, open[i].col)) ?? Infinity
    if (p < bestPriority) {
      bestPriority = p
      bestIndex = i
    }
  }
  return open.splice(bestIndex, 1)[0]
}

export function dijkstra(rows: number, cols: number, walls: Set<string>, start: Cell, end: Cell): PathResult {
  const startKey = key(start.row, start.col)
  const dist = new Map<string, number>([[startKey, 0]])
  const cameFrom = new Map<string, string>()
  const visited = new Set<string>()
  const visitedOrder: Cell[] = []
  const open: Cell[] = [start]

  while (open.length > 0) {
    const current = extractMin(open, dist)
    const ck = key(current.row, current.col)
    if (visited.has(ck)) continue
    visited.add(ck)
    visitedOrder.push(current)
    if (current.row === end.row && current.col === end.col) break

    const currentDist = dist.get(ck) ?? Infinity
    for (const next of neighbors(current, rows, cols)) {
      const nk = key(next.row, next.col)
      if (visited.has(nk) || walls.has(nk)) continue
      const tentative = currentDist + 1
      if (tentative < (dist.get(nk) ?? Infinity)) {
        dist.set(nk, tentative)
        cameFrom.set(nk, ck)
        open.push(next)
      }
    }
  }

  const path = visited.has(key(end.row, end.col)) ? reconstructPath(cameFrom, start, end) : []
  return { visitedOrder, path }
}

function manhattan(a: Cell, b: Cell): number {
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col)
}

export function aStar(rows: number, cols: number, walls: Set<string>, start: Cell, end: Cell): PathResult {
  const startKey = key(start.row, start.col)
  const gScore = new Map<string, number>([[startKey, 0]])
  const fScore = new Map<string, number>([[startKey, manhattan(start, end)]])
  const cameFrom = new Map<string, string>()
  const visited = new Set<string>()
  const visitedOrder: Cell[] = []
  const open: Cell[] = [start]
  const inOpen = new Set<string>([startKey])

  while (open.length > 0) {
    const current = extractMin(open, fScore)
    const ck = key(current.row, current.col)
    inOpen.delete(ck)
    if (visited.has(ck)) continue
    visited.add(ck)
    visitedOrder.push(current)
    if (current.row === end.row && current.col === end.col) break

    const currentG = gScore.get(ck) ?? Infinity
    for (const next of neighbors(current, rows, cols)) {
      const nk = key(next.row, next.col)
      if (visited.has(nk) || walls.has(nk)) continue
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

  const path = visited.has(key(end.row, end.col)) ? reconstructPath(cameFrom, start, end) : []
  return { visitedOrder, path }
}

export const PATH_FUNCTIONS: Record<
  PathAlgorithmId,
  (rows: number, cols: number, walls: Set<string>, start: Cell, end: Cell) => PathResult
> = {
  bfs,
  dijkstra,
  astar: aStar,
}

export function cellKey(cell: Cell): string {
  return key(cell.row, cell.col)
}
