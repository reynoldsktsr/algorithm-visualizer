/**
 * Classic binary-tree interview algorithms: level-order (BFS) and preorder
 * (DFS) traversal, root-to-node path finding, and lowest common ancestor.
 */

import type { GeneratedTree } from './generateTree'

export type TreeAlgorithmId = 'bfs' | 'dfs' | 'path' | 'lca'

export interface TreeAlgorithmInfo {
  id: TreeAlgorithmId
  label: string
  description: string
}

export const TREE_ALGORITHMS: TreeAlgorithmInfo[] = [
  { id: 'bfs', label: 'BFS (level order)', description: 'Visit nodes level by level using a queue.' },
  { id: 'dfs', label: 'DFS (preorder)', description: 'Visit nodes depth-first, recursing left before right.' },
  { id: 'path', label: 'Find path to node', description: 'Select a node, then find the path from the root to it.' },
  {
    id: 'lca',
    label: 'Lowest common ancestor',
    description: 'Select two nodes, then find the deepest node that is an ancestor of both.',
  },
]

export function bfsTraversal(tree: GeneratedTree): number[] {
  const order: number[] = []
  const queue: number[] = [tree.rootId]
  let head = 0
  while (head < queue.length) {
    const id = queue[head++]
    order.push(id)
    const node = tree.nodes[id]
    if (node.leftId !== null) queue.push(node.leftId)
    if (node.rightId !== null) queue.push(node.rightId)
  }
  return order
}

export function dfsTraversal(tree: GeneratedTree): number[] {
  const order: number[] = []
  function visit(id: number) {
    order.push(id)
    const node = tree.nodes[id]
    if (node.leftId !== null) visit(node.leftId)
    if (node.rightId !== null) visit(node.rightId)
  }
  visit(tree.rootId)
  return order
}

/** Path from the root down to `targetId`, inclusive of both ends. */
export function findPathToNode(tree: GeneratedTree, targetId: number): number[] {
  const path: number[] = []
  let currentId: number | null = targetId
  while (currentId !== null) {
    path.push(currentId)
    currentId = tree.nodes[currentId].parentId
  }
  path.reverse()
  return path
}

export interface LcaResult {
  lcaId: number
  /** Path from the LCA down to `aId`, inclusive of both ends. */
  pathToA: number[]
  /** Path from the LCA down to `bId`, inclusive of both ends. */
  pathToB: number[]
}

export function findLowestCommonAncestor(tree: GeneratedTree, aId: number, bId: number): LcaResult {
  const pathA = findPathToNode(tree, aId)
  const pathB = findPathToNode(tree, bId)
  const onPathA = new Set(pathA)

  let lcaId = tree.rootId
  for (const id of pathB) {
    if (onPathA.has(id)) lcaId = id
  }

  const lcaIndexA = pathA.indexOf(lcaId)
  const lcaIndexB = pathB.indexOf(lcaId)
  return {
    lcaId,
    pathToA: pathA.slice(lcaIndexA),
    pathToB: pathB.slice(lcaIndexB),
  }
}
