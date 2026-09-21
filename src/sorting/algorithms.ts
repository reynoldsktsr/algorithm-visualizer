/**
 * Sorting algorithms implemented as generator functions that yield one
 * "step" per meaningful operation (comparison, swap, or overwrite). Each
 * generator mutates its own private copy of the input array as it runs, so
 * the sequence of yielded steps is a faithful, replayable trace of the real
 * algorithm — a consumer that starts from the same input and applies the
 * steps in order will reproduce the exact same array at every point.
 */

export type SortStep =
  /** Two indices are being compared; no mutation happens on this step. */
  | { kind: 'compare'; indices: [number, number] }
  /** The values at two indices were swapped in place. */
  | { kind: 'swap'; indices: [number, number] }
  /** The value at a single index was overwritten (used by merge sort, which
   * writes through a temporary buffer rather than swapping in place). */
  | { kind: 'overwrite'; index: number; value: number }
  /** One or more indices have reached their final sorted position. */
  | { kind: 'sorted'; indices: number[] }

export type SortGenerator = Generator<SortStep, void, unknown>

export type SortAlgorithmId = 'bubble' | 'selection' | 'insertion' | 'merge' | 'quick'

export interface SortAlgorithmInfo {
  id: SortAlgorithmId
  label: string
}

export const SORT_ALGORITHMS: SortAlgorithmInfo[] = [
  { id: 'bubble', label: 'Bubble Sort' },
  { id: 'selection', label: 'Selection Sort' },
  { id: 'insertion', label: 'Insertion Sort' },
  { id: 'merge', label: 'Merge Sort' },
  { id: 'quick', label: 'Quick Sort' },
]

function swapInPlace(arr: number[], i: number, j: number): void {
  const tmp = arr[i]
  arr[i] = arr[j]
  arr[j] = tmp
}

export function* bubbleSort(input: number[]): SortGenerator {
  const arr = input.slice()
  const n = arr.length
  let lastUnsorted = n - 1
  for (let i = 0; i < n - 1; i++) {
    let swappedThisPass = false
    for (let j = 0; j < n - 1 - i; j++) {
      yield { kind: 'compare', indices: [j, j + 1] }
      if (arr[j] > arr[j + 1]) {
        swapInPlace(arr, j, j + 1)
        yield { kind: 'swap', indices: [j, j + 1] }
        swappedThisPass = true
      }
    }
    yield { kind: 'sorted', indices: [n - 1 - i] }
    lastUnsorted = n - 2 - i
    if (!swappedThisPass) break
  }
  const remaining: number[] = []
  for (let k = 0; k <= lastUnsorted; k++) remaining.push(k)
  if (remaining.length > 0) yield { kind: 'sorted', indices: remaining }
}

export function* selectionSort(input: number[]): SortGenerator {
  const arr = input.slice()
  const n = arr.length
  for (let i = 0; i < n - 1; i++) {
    let minIndex = i
    for (let j = i + 1; j < n; j++) {
      yield { kind: 'compare', indices: [minIndex, j] }
      if (arr[j] < arr[minIndex]) {
        minIndex = j
      }
    }
    if (minIndex !== i) {
      swapInPlace(arr, i, minIndex)
      yield { kind: 'swap', indices: [i, minIndex] }
    }
    yield { kind: 'sorted', indices: [i] }
  }
  yield { kind: 'sorted', indices: [n - 1] }
}

export function* insertionSort(input: number[]): SortGenerator {
  const arr = input.slice()
  const n = arr.length
  if (n > 0) yield { kind: 'sorted', indices: [0] }
  for (let i = 1; i < n; i++) {
    let j = i
    while (j > 0) {
      yield { kind: 'compare', indices: [j - 1, j] }
      if (arr[j - 1] > arr[j]) {
        swapInPlace(arr, j - 1, j)
        yield { kind: 'swap', indices: [j - 1, j] }
        j--
      } else {
        break
      }
    }
    const sortedSoFar = Array.from({ length: i + 1 }, (_, k) => k)
    yield { kind: 'sorted', indices: sortedSoFar }
  }
}

function* merge(arr: number[], lo: number, mid: number, hi: number): SortGenerator {
  const left = arr.slice(lo, mid + 1)
  const right = arr.slice(mid + 1, hi + 1)
  let i = 0
  let j = 0
  let k = lo
  while (i < left.length && j < right.length) {
    yield { kind: 'compare', indices: [lo + i, mid + 1 + j] }
    if (left[i] <= right[j]) {
      arr[k] = left[i]
      yield { kind: 'overwrite', index: k, value: left[i] }
      i++
    } else {
      arr[k] = right[j]
      yield { kind: 'overwrite', index: k, value: right[j] }
      j++
    }
    k++
  }
  while (i < left.length) {
    arr[k] = left[i]
    yield { kind: 'overwrite', index: k, value: left[i] }
    i++
    k++
  }
  while (j < right.length) {
    arr[k] = right[j]
    yield { kind: 'overwrite', index: k, value: right[j] }
    j++
    k++
  }
  yield { kind: 'sorted', indices: Array.from({ length: hi - lo + 1 }, (_, idx) => lo + idx) }
}

function* mergeSortRange(arr: number[], lo: number, hi: number): SortGenerator {
  if (lo >= hi) {
    if (lo === hi) yield { kind: 'sorted', indices: [lo] }
    return
  }
  const mid = Math.floor((lo + hi) / 2)
  yield* mergeSortRange(arr, lo, mid)
  yield* mergeSortRange(arr, mid + 1, hi)
  yield* merge(arr, lo, mid, hi)
}

export function* mergeSort(input: number[]): SortGenerator {
  const arr = input.slice()
  if (arr.length === 0) return
  yield* mergeSortRange(arr, 0, arr.length - 1)
}

function* partition(arr: number[], lo: number, hi: number): Generator<SortStep, number, unknown> {
  const pivot = arr[hi]
  let i = lo
  for (let j = lo; j < hi; j++) {
    yield { kind: 'compare', indices: [j, hi] }
    if (arr[j] < pivot) {
      if (i !== j) {
        swapInPlace(arr, i, j)
        yield { kind: 'swap', indices: [i, j] }
      }
      i++
    }
  }
  if (i !== hi) {
    swapInPlace(arr, i, hi)
    yield { kind: 'swap', indices: [i, hi] }
  }
  return i
}

function* quickSortRange(arr: number[], lo: number, hi: number): SortGenerator {
  if (lo > hi) return
  if (lo === hi) {
    yield { kind: 'sorted', indices: [lo] }
    return
  }
  const pivotIndex = yield* partition(arr, lo, hi)
  yield { kind: 'sorted', indices: [pivotIndex] }
  yield* quickSortRange(arr, lo, pivotIndex - 1)
  yield* quickSortRange(arr, pivotIndex + 1, hi)
}

export function* quickSort(input: number[]): SortGenerator {
  const arr = input.slice()
  if (arr.length === 0) return
  yield* quickSortRange(arr, 0, arr.length - 1)
}

export const SORT_FUNCTIONS: Record<SortAlgorithmId, (input: number[]) => SortGenerator> = {
  bubble: bubbleSort,
  selection: selectionSort,
  insertion: insertionSort,
  merge: mergeSort,
  quick: quickSort,
}
