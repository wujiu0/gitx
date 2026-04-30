import type { Commit, CommitGraphNode, GraphEdge } from '../types.ts';

const GRAPH_COLORS = [
  'var(--gitx-graph-0)',
  'var(--gitx-graph-1)',
  'var(--gitx-graph-2)',
  'var(--gitx-graph-3)',
  'var(--gitx-graph-4)',
  'var(--gitx-graph-5)',
];

function colorFor(col: number): string {
  return GRAPH_COLORS[col % GRAPH_COLORS.length]!;
}

export function computeGraphLayout(commits: Commit[]): CommitGraphNode[] {
  // laneMap: hash -> column index
  const laneMap = new Map<string, number>();
  const freeLanes: number[] = [];
  let nextLane = 0;

  function allocLane(): number {
    return freeLanes.length > 0 ? freeLanes.pop()! : nextLane++;
  }

  function freeLane(col: number): void {
    freeLanes.push(col);
    freeLanes.sort((a, b) => b - a); // pop smallest first
  }

  const result: CommitGraphNode[] = [];

  // Track which lanes are "alive" at each row for pass-through lines
  const activeLanes = new Set<number>();

  for (const commit of commits) {
    const { hash, parents } = commit;

    // Determine this commit's column
    let col = laneMap.get(hash);
    if (col === undefined) {
      col = allocLane();
      laneMap.set(hash, col);
    }

    activeLanes.add(col);

    // Compute edges to parents
    const edges: GraphEdge[] = [];
    const [firstParent, ...otherParents] = parents;

    if (firstParent) {
      if (!laneMap.has(firstParent)) {
        // Continue in same lane
        laneMap.set(firstParent, col);
        edges.push({ fromCol: col, toCol: col, type: 'straight' });
      } else {
        const parentCol = laneMap.get(firstParent)!;
        if (parentCol === col) {
          edges.push({ fromCol: col, toCol: col, type: 'straight' });
        } else {
          edges.push({ fromCol: col, toCol: parentCol, type: 'merge' });
        }
      }
    }

    for (const parent of otherParents) {
      if (!laneMap.has(parent)) {
        const newCol = allocLane();
        laneMap.set(parent, newCol);
        activeLanes.add(newCol);
        edges.push({ fromCol: col, toCol: newCol, type: 'fork' });
      } else {
        edges.push({ fromCol: col, toCol: laneMap.get(parent)!, type: 'merge' });
      }
    }

    // Pass-through lanes: all active lanes except the current commit's column
    const passThrough = Array.from(activeLanes).filter((l) => l !== col);

    result.push({
      hash,
      column: col,
      color: colorFor(col),
      edges,
      passThrough,
    });

    // After processing this commit, if it was in laneMap and its lane won't be
    // continued (no parents or first parent already had another lane), free the lane.
    if (!firstParent) {
      laneMap.delete(hash);
      freeLane(col);
      activeLanes.delete(col);
    } else if (laneMap.get(firstParent) !== col) {
      // This lane ends here (merged into another)
      laneMap.delete(hash);
      freeLane(col);
      activeLanes.delete(col);
    }
  }

  return result;
}
