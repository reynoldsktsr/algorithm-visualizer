/**
 * Generates a random binary search tree and lays it out for rendering:
 * `x` is assigned by inorder position (so it reads left-to-right sorted,
 * like a real BST), `depth` by distance from the root.
 */

export interface TreeNode {
  id: number
  value: number
  parentId: number | null
  leftId: number | null
  rightId: number | null
  depth: number
  x: number
}

export interface GeneratedTree {
  nodes: Record<number, TreeNode>
  rootId: number
  /** Number of horizontal layout slots (max x + 1). */
  width: number
  /** Number of depth levels (max depth + 1). */
  height: number
}

function shuffledUniqueValues(count: number, max: number): number[] {
  const pool = Array.from({ length: max }, (_, i) => i + 1)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count)
}

export function generateTree(nodeCount = 19): GeneratedTree {
  const clamped = Math.max(3, Math.min(63, Math.floor(nodeCount)))
  const values = shuffledUniqueValues(clamped, clamped * 3)
  const nodes: Record<number, TreeNode> = {}
  let nextId = 0
  let rootId: number | null = null

  function insertNode(value: number, parentId: number | null): number {
    const id = nextId++
    nodes[id] = { id, value, parentId, leftId: null, rightId: null, depth: 0, x: 0 }
    return id
  }

  for (const value of values) {
    if (rootId === null) {
      rootId = insertNode(value, null)
      continue
    }
    let currentId = rootId
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const current = nodes[currentId]
      if (value < current.value) {
        if (current.leftId === null) {
          current.leftId = insertNode(value, currentId)
          break
        }
        currentId = current.leftId
      } else {
        if (current.rightId === null) {
          current.rightId = insertNode(value, currentId)
          break
        }
        currentId = current.rightId
      }
    }
  }

  const root = rootId as number

  function assignDepth(id: number, depth: number) {
    const node = nodes[id]
    node.depth = depth
    if (node.leftId !== null) assignDepth(node.leftId, depth + 1)
    if (node.rightId !== null) assignDepth(node.rightId, depth + 1)
  }
  assignDepth(root, 0)

  let counter = 0
  function assignX(id: number) {
    const node = nodes[id]
    if (node.leftId !== null) assignX(node.leftId)
    node.x = counter++
    if (node.rightId !== null) assignX(node.rightId)
  }
  assignX(root)

  const width = counter
  let height = 1
  for (const node of Object.values(nodes)) height = Math.max(height, node.depth + 1)

  return { nodes, rootId: root, width, height }
}
