/**
 * Perfect-maze generation via randomized depth-first search (the
 * "recursive backtracker" algorithm), iterative so it never blows the
 * call stack on larger mazes. Produces a spanning tree over the grid —
 * exactly one path between any two cells, no loops.
 */

export interface MazeCell {
  row: number
  col: number
}

/** Per-cell wall state: [top, right, bottom, left]. `true` = wall present. */
export type CellWalls = [boolean, boolean, boolean, boolean]

export interface Maze {
  rows: number
  cols: number
  walls: CellWalls[][]
}

const DIRS: Array<{ dr: number; dc: number; wallIndex: number; oppositeIndex: number }> = [
  { dr: -1, dc: 0, wallIndex: 0, oppositeIndex: 2 }, // up
  { dr: 0, dc: 1, wallIndex: 1, oppositeIndex: 3 }, // right
  { dr: 1, dc: 0, wallIndex: 2, oppositeIndex: 0 }, // down
  { dr: 0, dc: -1, wallIndex: 3, oppositeIndex: 1 }, // left
]

function shuffled<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function generateMaze(rows: number, cols: number): Maze {
  const walls: CellWalls[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => [true, true, true, true] as CellWalls),
  )
  const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false))

  const stack: MazeCell[] = [{ row: 0, col: 0 }]
  visited[0][0] = true

  while (stack.length > 0) {
    const current = stack[stack.length - 1]
    const candidates = shuffled(DIRS)
      .map((d) => ({ ...d, row: current.row + d.dr, col: current.col + d.dc }))
      .filter((n) => n.row >= 0 && n.row < rows && n.col >= 0 && n.col < cols && !visited[n.row][n.col])

    if (candidates.length === 0) {
      stack.pop()
      continue
    }

    const next = candidates[0]
    walls[current.row][current.col][next.wallIndex] = false
    walls[next.row][next.col][next.oppositeIndex] = false
    visited[next.row][next.col] = true
    stack.push({ row: next.row, col: next.col })
  }

  return { rows, cols, walls }
}

/** Cells reachable from `cell` through open passages (no wall between them). */
export function mazeNeighbors(maze: Maze, cell: MazeCell): MazeCell[] {
  const [top, right, bottom, left] = maze.walls[cell.row][cell.col]
  const result: MazeCell[] = []
  if (!top && cell.row > 0) result.push({ row: cell.row - 1, col: cell.col })
  if (!right && cell.col < maze.cols - 1) result.push({ row: cell.row, col: cell.col + 1 })
  if (!bottom && cell.row < maze.rows - 1) result.push({ row: cell.row + 1, col: cell.col })
  if (!left && cell.col > 0) result.push({ row: cell.row, col: cell.col - 1 })
  return result
}

export function mazeCellKey(cell: MazeCell): string {
  return `${cell.row},${cell.col}`
}
