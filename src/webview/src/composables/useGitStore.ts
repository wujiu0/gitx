import { reactive, ref } from 'vue';
import { request, onPushEvent } from './useGitBridge.js';
import type { Branch, Commit, CommitDetail, FileChange, LogOptions, RepoInfo, Stash, Tag } from '../types.ts';

export interface LogFilters {
  search: string;
  author: string;
  since: string;
  until: string;
  branch: string;
}

const PAGE_SIZE = 200;

const repos = ref<RepoInfo[]>([]);
const activeRepoPath = ref('');
const branches = ref<Branch[]>([]);
const tags = ref<Tag[]>([]);
const stashes = ref<Stash[]>([]);
const commits = ref<Commit[]>([]);
const hasMore = ref(false);
const selectedCommit = ref<CommitDetail | null>(null);
const isLoading = ref(false);
const isFetching = ref(false);
const error = ref<string | null>(null);
const filters = reactive<LogFilters>({ search: '', author: '', since: '', until: '', branch: '' });

onPushEvent('git.repoChanged', () => refresh());

async function loadRepos() {
  const data = await request<RepoInfo[]>('git.repos');
  repos.value = data;
  if (data.length > 0 && !activeRepoPath.value) {
    activeRepoPath.value = data[0]!.path;
  }
}

async function loadBranches() {
  if (!activeRepoPath.value) return;
  const data = await request<{ branches: Branch[]; tags: Tag[]; stashes: Stash[] }>('git.branches');
  branches.value = data.branches;
  tags.value = data.tags;
  stashes.value = data.stashes;
}

async function loadLog(reset = true) {
  if (!activeRepoPath.value) return;
  if (reset) {
    commits.value = [];
    hasMore.value = false;
  }

  isLoading.value = true;
  error.value = null;

  const opts: LogOptions = {
    limit: PAGE_SIZE,
    offset: reset ? 0 : commits.value.length,
    search: filters.search || undefined,
    author: filters.author || undefined,
    since: filters.since || undefined,
    until: filters.until || undefined,
    branch: filters.branch || undefined,
  };

  try {
    const data = await request<{ commits: Commit[]; hasMore: boolean }>('git.log', opts);
    if (reset) {
      commits.value = data.commits;
    } else {
      commits.value.push(...data.commits);
    }
    hasMore.value = data.hasMore;
  } catch (err) {
    error.value = String(err);
  } finally {
    isLoading.value = false;
  }
}

async function loadMore() {
  if (!hasMore.value || isLoading.value) return;
  await loadLog(false);
}

async function selectCommit(hash: string) {
  selectedCommit.value = null;
  try {
    const detail = await request<CommitDetail>('git.commitDetail', { hash });
    selectedCommit.value = detail;
  } catch (err) {
    error.value = String(err);
  }
}

async function applyFilters(newFilters: Partial<LogFilters>) {
  Object.assign(filters, newFilters);
  await loadLog(true);
}

async function refresh() {
  await Promise.all([loadBranches(), loadLog(true)]);
}

async function fetchAll() {
  isFetching.value = true;
  try {
    await request('git.fetch');
    await refresh();
  } catch (err) {
    error.value = String(err);
  } finally {
    isFetching.value = false;
  }
}

async function checkoutBranch(name: string) {
  await request('git.checkout', { name });
  await refresh();
}

async function createBranch(name: string, from?: string) {
  await request('git.createBranch', { name, from });
  await refresh();
}

async function deleteBranch(name: string, force = false) {
  await request('git.deleteBranch', { name, force });
  await loadBranches();
}

async function renameBranch(oldName: string, newName: string) {
  await request('git.renameBranch', { oldName, newName });
  await loadBranches();
}

async function mergeBranch(name: string) {
  await request('git.mergeBranch', { name });
  await refresh();
}

async function pushBranch(branch: string, remote?: string) {
  await request('git.pushBranch', { branch, remote });
  await loadBranches();
}

async function createTag(name: string, hash: string) {
  await request('git.createTag', { name, hash });
  await loadBranches();
}

async function openDiff(file: FileChange, commit: CommitDetail) {
  const parentHash = commit.parents[0] ?? '4b825dc642cb6eb9a060e54bf8d69288fbee4904'; // empty tree
  await request('git.openDiff', {
    repoPath: activeRepoPath.value,
    filePath: file.path,
    originalPath: file.originalPath,
    hash: commit.hash,
    parentHash,
    status: file.status,
  });
}

function dismissError() {
  error.value = null;
}

export function useGitStore() {
  return {
    repos,
    activeRepoPath,
    branches,
    tags,
    stashes,
    commits,
    hasMore,
    selectedCommit,
    isLoading,
    isFetching,
    error,
    filters,
    loadRepos,
    loadBranches,
    loadLog,
    loadMore,
    selectCommit,
    applyFilters,
    refresh,
    fetchAll,
    checkoutBranch,
    createBranch,
    deleteBranch,
    renameBranch,
    mergeBranch,
    pushBranch,
    createTag,
    openDiff,
    dismissError,
  };
}
