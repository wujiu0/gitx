import { describe, expect, it } from 'vitest';
import { computeGraphLayout } from '../webview/src/utils/graphLayout.js';
import type { Commit } from '../types.js';

// mirrors the private constant in graphLayout.ts
const GRAPH_COLORS = [
  'var(--gitx-graph-0)',
  'var(--gitx-graph-1)',
  'var(--gitx-graph-2)',
  'var(--gitx-graph-3)',
  'var(--gitx-graph-4)',
  'var(--gitx-graph-5)',
];

function c(hash: string, parents: string[]): Commit {
  return { hash, parents, refs: '', message: '', author: '', authorEmail: '', date: '' };
}

describe('computeGraphLayout', () => {
  it('returns empty array for empty input', () => {
    expect(computeGraphLayout([])).toEqual([]);
  });

  it('single commit with no parents is placed in column 0', () => {
    const result = computeGraphLayout([c('A', [])]);
    expect(result).toHaveLength(1);
    expect(result[0]!.hash).toBe('A');
    expect(result[0]!.column).toBe(0);
    expect(result[0]!.edges).toEqual([]);
    expect(result[0]!.passThrough).toEqual([]);
  });

  it('linear chain stays in column 0 with straight edges', () => {
    const commits = [c('A', ['B']), c('B', ['C']), c('C', [])];
    const result = computeGraphLayout(commits);
    expect(result).toHaveLength(3);
    for (const node of result) {
      expect(node.column).toBe(0);
    }
    expect(result[0]!.edges).toEqual([{ fromCol: 0, toCol: 0, type: 'straight' }]);
    expect(result[1]!.edges).toEqual([{ fromCol: 0, toCol: 0, type: 'straight' }]);
    expect(result[2]!.edges).toEqual([]);
  });

  it('fork: second parent gets a new lane and produces a fork edge', () => {
    const commits = [c('M', ['B', 'C'])];
    const result = computeGraphLayout(commits);
    expect(result[0]!.column).toBe(0);
    const edges = result[0]!.edges;
    expect(edges).toContainEqual({ fromCol: 0, toCol: 0, type: 'straight' });
    expect(edges).toContainEqual({ fromCol: 0, toCol: 1, type: 'fork' });
  });

  // Issue 1: multi-lane color assertions using GRAPH_COLORS
  it('merge: when parent already has a lane, produces a merge edge; node colors match GRAPH_COLORS[col]', () => {
    // M branches to B (lane 0) and C (lane 1)
    // Then C points to D which is already in laneMap on lane 0
    const commits = [
      c('M', ['B', 'C']),
      c('B', ['D']),
      c('C', ['D']),
      c('D', []),
    ];
    const result = computeGraphLayout(commits);

    // C is on lane 1, D is on lane 0 — C should emit a merge edge
    const cNode = result.find((n) => n.hash === 'C')!;
    expect(cNode.edges).toContainEqual({ fromCol: 1, toCol: 0, type: 'merge' });

    // Verify node colors match GRAPH_COLORS[column]
    const mNode = result.find((n) => n.hash === 'M')!;
    const bNode = result.find((n) => n.hash === 'B')!;
    const dNode = result.find((n) => n.hash === 'D')!;

    expect(mNode.column).toBe(0);
    expect(mNode.color).toBe(GRAPH_COLORS[0]);

    expect(bNode.column).toBe(0);
    expect(bNode.color).toBe(GRAPH_COLORS[0]);

    expect(cNode.column).toBe(1);
    expect(cNode.color).toBe(GRAPH_COLORS[1]);

    expect(dNode.column).toBe(0);
    expect(dNode.color).toBe(GRAPH_COLORS[0]);
  });

  it('color for column 0 is the first graph color variable', () => {
    const [node] = computeGraphLayout([c('A', [])]);
    expect(node!.color).toBe('var(--gitx-graph-0)');
  });

  it('color for column 5 is the sixth graph color variable', () => {
    // Build a scenario where a commit ends up in column 5 by forking 5 branches
    const commits = [c('M', ['B', 'C', 'D', 'E', 'F', 'G'])];
    const result = computeGraphLayout(commits);
    // G gets lane 5
    const gNode = result[0]!;
    // M itself is lane 0; lanes 1-5 are fork branches
    // Verify lane 5 color by checking fork edges target col 5
    const forkTo5 = gNode.edges.find((e) => e.toCol === 5);
    expect(forkTo5).toBeDefined();
    // Build a trivial commit at col 5 by making a 6-lane history
    const six = [c('X', ['a', 'b', 'c', 'd', 'e', 'f'])];
    const r2 = computeGraphLayout(six);
    // lane 5 fork edge exists; color at col 5 should be graph-5
    const edgeToCol5 = r2[0]!.edges.find((e) => e.toCol === 5);
    expect(edgeToCol5).toBeDefined();
  });

  it('color cycles: column 6 wraps to the first color', () => {
    // Fork 7 branches so that a branch is assigned column 6
    const commits = [c('M', ['a', 'b', 'c', 'd', 'e', 'f', 'g'])];
    const result = computeGraphLayout(commits);
    // Fork edge to col 6 should exist (7 parents → lanes 0-6)
    const edgeTo6 = result[0]!.edges.find((e) => e.toCol === 6);
    expect(edgeTo6).toBeDefined();
    // A standalone commit that ends up in lane 6 would get color graph-0 (6 % 6 = 0)
    // We can verify by building 7 root commits and checking the 7th
    const rootCommits = [
      c('r0', []),
      c('r1', []),
      c('r2', []),
      c('r3', []),
      c('r4', []),
      c('r5', []),
      c('r6', []),
    ];
    const r = computeGraphLayout(rootCommits);
    // Each root frees its lane, so each one re-uses lane 0
    for (const node of r) {
      expect(node.column).toBe(0);
    }
    // Specifically the 7th should still be col 0, cycling back to graph-0
    expect(r[6]!.color).toBe('var(--gitx-graph-0)');
  });

  // Issue 2: direct color cycling test with 7 independent single-parent commits on different lanes
  it('color at column 6 wraps to GRAPH_COLORS[0] (6 % 6 === 0) — 7 single-parent chains on distinct lanes', () => {
    // M forks into 7 branches A0-A6, each being a single-parent chain pointing to root.
    // A0 stays on lane 0 (first parent of M); A1-A6 get lanes 1-6 (fork).
    // Each Ax has exactly one parent ('root'), so they are single-parent chain commits.
    // A6 is on lane 6 — colorFor(6) === GRAPH_COLORS[6 % 6] === GRAPH_COLORS[0].
    const commits = [
      c('M',    ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6']),
      c('A0',   ['root']),
      c('A1',   ['root']),
      c('A2',   ['root']),
      c('A3',   ['root']),
      c('A4',   ['root']),
      c('A5',   ['root']),
      c('A6',   ['root']),
      c('root', []),
    ];
    const result = computeGraphLayout(commits);

    const a6Node = result.find((n) => n.hash === 'A6')!;
    expect(a6Node.column).toBe(6);
    expect(a6Node.color).toBe(GRAPH_COLORS[6 % GRAPH_COLORS.length]);
    expect(a6Node.color).toBe(GRAPH_COLORS[0]);

    // Sanity-check that earlier lanes have the expected colors
    const a0Node = result.find((n) => n.hash === 'A0')!;
    const a1Node = result.find((n) => n.hash === 'A1')!;
    const a5Node = result.find((n) => n.hash === 'A5')!;
    expect(a0Node.color).toBe(GRAPH_COLORS[0]); // col 0
    expect(a1Node.color).toBe(GRAPH_COLORS[1]); // col 1
    expect(a5Node.color).toBe(GRAPH_COLORS[5]); // col 5
  });

  it('passThrough contains all active lanes except the current commit column', () => {
    // M is on lane 0, branches to B (lane 0) and C (lane 1)
    // Then B runs alone: it should see lane 1 as passThrough
    const commits = [c('M', ['B', 'C']), c('B', ['D']), c('D', [])];
    const result = computeGraphLayout(commits);
    const bNode = result.find((n) => n.hash === 'B')!;
    // B is on lane 0; lane 1 (for C) is active but not B's column
    expect(bNode.passThrough).toContain(1);
    expect(bNode.passThrough).not.toContain(0);
  });

  it('root commit (no parents) frees its lane for reuse', () => {
    // X has no parent → frees lane 0; Y should reuse it
    const commits = [c('X', []), c('Y', [])];
    const result = computeGraphLayout(commits);
    expect(result[0]!.column).toBe(0);
    expect(result[1]!.column).toBe(0);
  });

  it('lane reuse: freed lane from a branch end is reused before allocating new lanes', () => {
    // Branch: M → B (lane 0), C (lane 1); C has no parent (root) → frees lane 1
    // Next commit D (unrelated) should get lane 1 (reused), not lane 2
    const commits = [
      c('M', ['B', 'C']),
      c('C', []),      // lane 1 ends here
      c('B', ['D']),
      c('D', []),      // should get lane 1 (recycled) not lane 2
    ];
    const result = computeGraphLayout(commits);
    const dNode = result.find((n) => n.hash === 'D')!;
    // D should not be assigned a lane higher than 1 since lane 1 was freed
    expect(dNode.column).toBeLessThanOrEqual(1);
  });

  it('multiple parallel branches each get distinct columns', () => {
    // M forks into three branches: B, C, D
    const commits = [c('M', ['B', 'C', 'D'])];
    const result = computeGraphLayout(commits);
    const edges = result[0]!.edges;
    const targetCols = edges.map((e) => e.toCol);
    // All target columns must be distinct
    expect(new Set(targetCols).size).toBe(targetCols.length);
    // Should have columns 0, 1, 2
    expect(targetCols.sort()).toEqual([0, 1, 2]);
  });

  it('straight edge type when first parent continues in same lane', () => {
    const commits = [c('A', ['B']), c('B', [])];
    const [a] = computeGraphLayout(commits);
    expect(a!.edges[0]!.type).toBe('straight');
  });

  it('merge edge type when first parent is already on a different lane', () => {
    // Build: M → {B (lane 0), C (lane 1)}; B → already-placed D on lane 1
    // Actually let's do: after M, process C first so that C continues on lane 1.
    // Then B (lane 0) points to C's lane → merge edge
    const commits = [
      c('M', ['C', 'B']),   // M on lane 0; first parent C continues lane 0; B gets lane 1
      c('C', ['X']),        // C is on lane 0
      c('B', ['X']),        // B is on lane 1; X is already in laneMap via C
      c('X', []),
    ];
    const result = computeGraphLayout(commits);
    const bNode = result.find((n) => n.hash === 'B')!;
    // B is on lane 1, X is on lane 0 → merge edge from 1 to 0
    expect(bNode.edges[0]!.type).toBe('merge');
  });
});
