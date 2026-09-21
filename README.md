# algorithm-visualizer

Step-by-step animated sorting and pathfinding algorithm visualizations as
drop-in React components. This repo is both:

- an **importable component library** (`<SortingVisualizer />` and
  `<PathfindingVisualizer />`), and
- a **live demo app** showing both off, with a tab switcher and full controls
  for each.

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

### Pathfinding

- Breadth-first search, Dijkstra's algorithm, and A* (Manhattan-distance
  heuristic), all implemented for real on an unweighted grid (walls block
  movement, every open cell costs 1)
- Draw walls by clicking and dragging over empty cells; drag the start/end
  markers to new cells
- Animates visited-cell exploration order, then the final shortest path
- Controls: algorithm picker, grid size slider, speed slider, clear walls,
  clear path, and run

## Install

```sh
npm install algorithm-visualizer
```

`react` and `react-dom` are peer dependencies (`^18.2.0 || ^19.0.0`) and are
not bundled.

## Usage

```tsx
import { SortingVisualizer, PathfindingVisualizer } from 'algorithm-visualizer'

export default function Demo() {
  return (
    <>
      <SortingVisualizer initialAlgorithm="merge" initialSize={50} />
      <PathfindingVisualizer initialAlgorithm="astar" initialGridSize={24} />
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

### `<PathfindingVisualizer />`

| Prop               | Type                              | Default | Description                             |
| ------------------ | ------------------------------------ | ------- | ------------------------------------------ |
| `className`        | `string`                          | —       | Extra class names on the outer wrapper. |
| `initialGridSize`  | `number`                          | `20`    | Initial grid size (rows and columns).   |
| `initialAlgorithm` | `'bfs' \| 'dijkstra' \| 'astar'`  | `'bfs'` | Initial algorithm.                      |

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
