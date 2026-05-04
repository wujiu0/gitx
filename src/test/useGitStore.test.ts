import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../webview/src/composables/useGitBridge.js', () => ({
  request: vi.fn(),
  onPushEvent: vi.fn().mockReturnValue(() => {}),
}));

import { request } from '../webview/src/composables/useGitBridge.js';
import { useGitStore } from '../webview/src/composables/useGitStore.js';
import type { Commit, CommitDetail } from '../types.js';

const mockRequest = vi.mocked(request);

function makeCommit(hash: string): Commit {
  return { hash, parents: [], refs: '', message: 'msg', author: 'A', authorEmail: 'a@b.com', date: '2024-01-01' };
}

function makeDetail(hash: string): CommitDetail {
  return { ...makeCommit(hash), fullMessage: 'full', files: [] };
}

describe('useGitStore', () => {
  // Issue 4-①: reset all shared state including repos/branches/tags/stashes
  beforeEach(() => {
    vi.clearAllMocks();
    const store = useGitStore();
    store.activeRepoPath.value = '/test/repo';
    store.repos.value = [];
    store.commits.value = [];
    store.branches.value = [];
    store.tags.value = [];
    store.stashes.value = [];
    store.hasMore.value = false;
    store.selectedCommit.value = null;
    store.isLoading.value = false;
    store.isFetching.value = false;
    store.error.value = null;
    Object.assign(store.filters, { search: '', author: '', since: '', until: '', branch: '' });
  });

  it('loadLog resets commits and fetches from offset 0', async () => {
    const fakeCommits = [makeCommit('a1'), makeCommit('a2')];
    mockRequest.mockResolvedValueOnce({ commits: fakeCommits, hasMore: false });

    const { loadLog, commits, isLoading, hasMore } = useGitStore();
    await loadLog(true);

    expect(mockRequest).toHaveBeenCalledWith('git.log', expect.objectContaining({ offset: 0, limit: 200 }));
    expect(commits.value).toEqual(fakeCommits);
    expect(hasMore.value).toBe(false);
    expect(isLoading.value).toBe(false);
  });

  it('loadLog does nothing when activeRepoPath is empty', async () => {
    const store = useGitStore();
    store.activeRepoPath.value = '';

    await store.loadLog();

    expect(mockRequest).not.toHaveBeenCalled();
    expect(store.commits.value).toEqual([]);
  });

  it('loadLog(false) appends commits at current offset', async () => {
    const existing = [makeCommit('x1')];
    const more = [makeCommit('x2'), makeCommit('x3')];
    mockRequest.mockResolvedValueOnce({ commits: more, hasMore: true });

    const store = useGitStore();
    store.commits.value = [...existing];

    await store.loadLog(false);

    expect(mockRequest).toHaveBeenCalledWith('git.log', expect.objectContaining({ offset: 1 }));
    expect(store.commits.value).toEqual([...existing, ...more]);
    expect(store.hasMore.value).toBe(true);
  });

  it('loadLog sets error when request throws', async () => {
    mockRequest.mockRejectedValueOnce(new Error('network failure'));

    const store = useGitStore();
    await store.loadLog();

    expect(store.error.value).toContain('network failure');
    expect(store.isLoading.value).toBe(false);
  });

  it('applyFilters updates filters then reloads from start', async () => {
    mockRequest.mockResolvedValueOnce({ commits: [], hasMore: false });

    const store = useGitStore();
    await store.applyFilters({ author: 'Alice', search: 'feat' });

    expect(store.filters.author).toBe('Alice');
    expect(store.filters.search).toBe('feat');
    expect(mockRequest).toHaveBeenCalledWith('git.log', expect.objectContaining({ author: 'Alice', search: 'feat', offset: 0 }));
  });

  it('selectCommit calls git.commitDetail and sets selectedCommit', async () => {
    const detail = makeDetail('abc123');
    mockRequest.mockResolvedValueOnce(detail);

    const store = useGitStore();
    await store.selectCommit('abc123');

    expect(mockRequest).toHaveBeenCalledWith('git.commitDetail', { hash: 'abc123' });
    expect(store.selectedCommit.value).toEqual(detail);
  });

  it('selectCommit sets error when request fails', async () => {
    mockRequest.mockRejectedValueOnce(new Error('not found'));

    const store = useGitStore();
    await store.selectCommit('bad-hash');

    expect(store.selectedCommit.value).toBeNull();
    expect(store.error.value).toContain('not found');
  });

  // Issue 3: loadMore with commit count assertion
  it('loadMore appends commits — N existing + M new = N+M total', async () => {
    const existing = [makeCommit('e1'), makeCommit('e2')];
    const newCommits = [makeCommit('m1'), makeCommit('m2'), makeCommit('m3')];
    mockRequest.mockResolvedValueOnce({ commits: newCommits, hasMore: false });

    const store = useGitStore();
    store.hasMore.value = true;
    store.commits.value = [...existing];

    await store.loadMore();

    expect(mockRequest).toHaveBeenCalledWith('git.log', expect.objectContaining({ offset: existing.length }));
    expect(store.commits.value).toHaveLength(existing.length + newCommits.length);
    expect(store.commits.value).toEqual([...existing, ...newCommits]);
    expect(store.hasMore.value).toBe(false);
  });

  it('loadMore does nothing when hasMore is false', async () => {
    const store = useGitStore();
    store.hasMore.value = false;

    await store.loadMore();

    expect(mockRequest).not.toHaveBeenCalled();
  });

  it('loadMore does nothing when already loading', async () => {
    const store = useGitStore();
    store.hasMore.value = true;
    store.isLoading.value = true;

    await store.loadMore();

    expect(mockRequest).not.toHaveBeenCalled();
  });

  it('dismissError clears the error state', async () => {
    const store = useGitStore();
    store.error.value = 'some error';

    store.dismissError();

    expect(store.error.value).toBeNull();
  });

  it('loadLog passes filter fields as undefined when empty strings', async () => {
    mockRequest.mockResolvedValueOnce({ commits: [], hasMore: false });

    const store = useGitStore();
    await store.loadLog();

    const opts = mockRequest.mock.calls[0]![1] as Record<string, unknown>;
    expect(opts['search']).toBeUndefined();
    expect(opts['author']).toBeUndefined();
    expect(opts['since']).toBeUndefined();
    expect(opts['until']).toBeUndefined();
    expect(opts['branch']).toBeUndefined();
  });

  // Issue 4-②: loadBranches test
  it('loadBranches fetches git.branches and updates branches/tags/stashes', async () => {
    const fakeBranches = [{ name: 'main', type: 'local' as const, current: true }];
    const fakeTags = [{ name: 'v1.0.0', hash: 'abc123' }];
    const fakeStashes = [{ index: 0, message: 'WIP on main', hash: 'def456', date: '2024-01-01' }];
    mockRequest.mockResolvedValueOnce({ branches: fakeBranches, tags: fakeTags, stashes: fakeStashes });

    const store = useGitStore();
    await store.loadBranches();

    expect(mockRequest).toHaveBeenCalledWith('git.branches');
    expect(store.branches.value).toEqual(fakeBranches);
    expect(store.tags.value).toEqual(fakeTags);
    expect(store.stashes.value).toEqual(fakeStashes);
  });

  // Issue 4-③: checkoutBranch test
  it('checkoutBranch sends git.checkout with the branch name', async () => {
    // checkout → refresh → loadBranches + loadLog
    mockRequest
      .mockResolvedValueOnce(undefined) // git.checkout
      .mockResolvedValueOnce({ branches: [], tags: [], stashes: [] }) // git.branches
      .mockResolvedValueOnce({ commits: [], hasMore: false }); // git.log

    const store = useGitStore();
    await store.checkoutBranch('feature/new');

    expect(mockRequest).toHaveBeenCalledWith('git.checkout', { name: 'feature/new' });
  });

  // Issue 4-④: fetchAll test
  it('fetchAll sets isFetching to true during fetch and false after completion', async () => {
    mockRequest
      .mockResolvedValueOnce(undefined) // git.fetch
      .mockResolvedValueOnce({ branches: [], tags: [], stashes: [] }) // git.branches (refresh)
      .mockResolvedValueOnce({ commits: [], hasMore: false }); // git.log (refresh)

    const store = useGitStore();
    expect(store.isFetching.value).toBe(false);

    const fetchPromise = store.fetchAll();
    // isFetching is set synchronously before the first await
    expect(store.isFetching.value).toBe(true);

    await fetchPromise;

    expect(store.isFetching.value).toBe(false);
    expect(mockRequest).toHaveBeenCalledWith('git.fetch');
  });
});
