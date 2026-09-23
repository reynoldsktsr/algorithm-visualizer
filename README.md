# algorithm-visualizer

Step-by-step animated visualizations of the algorithms that actually show up
in coding exercises and interviews — sorting, maze search, and binary-tree
traversal/path-finding — as drop-in React components. This repo is both:

- an **importable component library** (`<SortingVisualizer />`,
  `<MazeVisualizer />`, and `<TreeVisualizer />`), and
- a **live demo app** showing all three off, with a tab switcher and full
  controls for each.

Built with Vite, React, TypeScript, and Tailwind CSS.

`algorithm-visualizer` is part of a series of small tech demos by
[Kieran Reynolds](https://github.com/reynoldsktsr).

## Features

### Sorting

- Bubble sort, selection sort, insertion sort, merge sort, and quick sort,
  each implemented as a generator function that yields one step (compare,
  swap, or overwrite) per real operation the algorithm performs — the
  animation is a direct trace of the actual algorithm, not a scripted fake
- Bar-chart visualization with distinct colors for bars being compared,
  swapped, and already in their final sorted position
- Controls: algorithm picker, array size slider, shuffle, speed slider,
  play/pause, and step-forward

### Maze

- A perfect maze (exactly one path between any two cells — no loops, always
  solvable) generated with a randomized depth-first "recursive backtracker"
- Breadth-first search, Dijkstra's algorithm, and A* (Manhattan-distance
  heuristic) race from entrance to exit through the corridors
- Animates visited-cell exploration order, then the final shortest path
- Controls: algorithm picker, maze size slider, speed slider, new maze, and
  solve

### Tree

- A random binary search tree (5-40 nodes), laid out so it reads
  left-to-right sorted like a real BST
- Four modes, all real implementations of classic interview problems:
  - **BFS (level order)** — queue-based level-by-level traversal
  - **DFS (preorder)** — recursive depth-first traversal
  - **Find path to node** — click a node, then trace the root-to-node path
    via parent pointers
  - **Lowest common ancestor** — click two nodes, then find the deepest
    shared ancestor by comparing their root paths
- Controls: mode picker, node count slider, speed slider, new tree, and run

## Install

```sh
npm install algorithm-visualizer
```

`react` and `react-dom` are peer dependencies (`^18.2.0 || ^19.0.0`) and are
not bundled.

## Usage

```tsx
import { SortingVisualizer, MazeVisualizer, TreeVisualizer } from 'algorithm-visualizer'

export default function Demo() {
  return (
    <>
      <SortingVisualizer initialAlgorithm="merge" initialSize={50} />
      <MazeVisualizer initialAlgorithm="astar" initialSize={20} />
      <TreeVisualizer initialAlgorithm="lca" initialNodeCount={25} />
    </>
  )
}
```

## Props

### `<SortingVisualizer />`

| Prop               | Type                                                             | Default    | Description                             |
| ------------------ | ----------------------------------------------------------------- | ---------- | ------------------------------------------ |
| `className`        | `string`                                                         | —          | Extra class names on the outer wrapper. |
| `initialSize`      | `number`                                                         | `40`       | Initial array size.                     |
| `initialAlgorithm` | `'bubble' \| 'selection' \| 'insertion' \| 'merge' \| 'quick'`   | `'bubble'` | Initial algorithm.                      |

### `<MazeVisualizer />`

| Prop               | Type                              | Default | Description                             |
| ------------------ | ------------------------------------ | ------- | ------------------------------------------ |
| `className`        | `string`                          | —       | Extra class names on the outer wrapper. |
| `initialSize`      | `number`                          | `16`    | Initial maze size (rows and columns).   |
| `initialAlgorithm` | `'bfs' \| 'dijkstra' \| 'astar'`  | `'bfs'` | Initial algorithm.                      |

### `<TreeVisualizer />`

| Prop                | Type                                    | Default | Description                             |
| ------------------- | ------------------------------------------ | ------- | ------------------------------------------ |
| `className`         | `string`                                | —       | Extra class names on the outer wrapper. |
| `initialNodeCount`  | `number`                                | `19`    | Initial number of nodes in the tree.    |
| `initialAlgorithm`  | `'bfs' \| 'dfs' \| 'path' \| 'lca'`     | `'bfs'` | Initial mode.                           |

## Local development

```sh
npm install
npm run dev
```

## Scripts

| Script               | Description                                                 |
| --------------------- | -------------------------------------------------------------- |
| `npm run dev`         | Start the demo app locally.                                    |
| `npm run build`       | Build the demo app (output: `dist-demo/`).                     |
| `npm run build:lib`   | Build the publishable component library (output: `dist/`).     |
| `npm run preview`     | Preview the built demo app.                                    |

## Live demo

The demo app is deployed to GitHub Pages via `.github/workflows/deploy.yml`
on every push to `main` (`actions/upload-pages-artifact` +
`actions/deploy-pages`). Once GitHub Pages is enabled for this repo
(Settings → Pages → Source: GitHub Actions), it's available at:

```
https://reynoldsktsr.github.io/algorithm-visualizer/
```

## License

MIT © Kieran Reynolds
