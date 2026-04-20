import * as path from 'path';
import * as vscode from 'vscode';
import type { GitExtension, API as CodeGitAPI } from '../typings/git.js';
import { execAsync } from '../utils/global.js';
import { logger } from '../utils/outputChannel.js';
import type { Branch, CommitDetail, LogOptions, RepoInfo, Stash, Tag } from '../types.js';
import type { Commit } from '../types.js';
import { parseBranches, parseCommitDetail, parseLog, parseStashList } from './gitParser.js';

export const UNABLE_TO_FIND_GIT_MSG =
  'Unable to find git executable, please make sure git is installed and in your PATH, or set the path in vscode settings "git.path"';

export interface GitService {
  readonly executable: string;
  readonly version: string;
  readonly codeGitAPI: CodeGitAPI;
  execute(args: string, cwd?: string): Promise<string>;
  getRepos(): RepoInfo[];
  getLog(repoPath: string, opts: LogOptions): Promise<{ commits: Commit[]; hasMore: boolean }>;
  getBranches(repoPath: string): Promise<{ branches: Branch[]; tags: Tag[]; stashes: Stash[] }>;
  getCommitDetail(repoPath: string, hash: string): Promise<CommitDetail>;
  checkoutBranch(repoPath: string, name: string): Promise<void>;
  createBranch(repoPath: string, name: string, from?: string): Promise<void>;
  deleteBranch(repoPath: string, name: string, force?: boolean): Promise<void>;
  renameBranch(repoPath: string, oldName: string, newName: string): Promise<void>;
  mergeBranch(repoPath: string, name: string): Promise<void>;
  pushBranch(repoPath: string, branch: string, remote?: string): Promise<void>;
  createTag(repoPath: string, name: string, hash: string): Promise<void>;
  fetchAll(repoPath: string): Promise<void>;
}

export async function createGitService(): Promise<GitService> {
  const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git')!.exports;
  const codeGitAPI = gitExtension.getAPI(1);

  let executable!: string;
  let version!: string;

  try {
    [executable, version] = await checkGitExecutable();
    logger.info(`Git executable: ${executable}, version: ${version}`);
  } catch {
    logger.error(UNABLE_TO_FIND_GIT_MSG);
    throw new Error(UNABLE_TO_FIND_GIT_MSG);
  }

  async function getGitVersion(x: string) {
    try {
      const { stdout } = await execAsync(`"${x}" --version`);
      const match = stdout.match(/git version\s+(.*)/);
      if (match) {
        return [x, match[1]!.trim()];
      }
      throw new Error('unknown git version');
    } catch {
      throw new Error('unknown git version');
    }
  }

  function checkGitExecutable() {
    return getGitVersion('git').catch(() => getGitVersion(codeGitAPI.git.path));
  }

  async function execute(args: string, cwd?: string): Promise<string> {
    const workingDir = cwd ?? vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd();
    try {
      const { stdout } = await execAsync(`"${executable}" ${args}`, { cwd: workingDir });
      return stdout.trim();
    } catch (error) {
      logger.error(`Git command failed: ${executable} ${args}`);
      throw error;
    }
  }

  function getRepos(): RepoInfo[] {
    return codeGitAPI.repositories.map((repo) => ({
      path: repo.rootUri.fsPath,
      name: path.basename(repo.rootUri.fsPath),
    }));
  }

  async function getLog(repoPath: string, opts: LogOptions): Promise<{ commits: Commit[]; hasMore: boolean }> {
    const limit = (opts.limit ?? 200) + 1;
    const offset = opts.offset ?? 0;

    const args: string[] = [
      'log',
      `--pretty=format:%H%x00%P%x00%D%x00%s%x00%an%x00%ae%x00%ai`,
      `-n ${limit}`,
      `--skip ${offset}`,
    ];

    if (opts.search) { args.push(`--grep=${opts.search}`); }
    if (opts.author) { args.push(`--author=${opts.author}`); }
    if (opts.since) { args.push(`--after=${opts.since}`); }
    if (opts.until) { args.push(`--before=${opts.until}`); }
    if (opts.branch) { args.push(opts.branch); }

    const raw = await execute(args.join(' '), repoPath);
    const all = parseLog(raw);
    const hasMore = all.length === limit;
    return { commits: hasMore ? all.slice(0, -1) : all, hasMore };
  }

  async function getBranches(
    repoPath: string,
  ): Promise<{ branches: Branch[]; tags: Tag[]; stashes: Stash[] }> {
    const [refRaw, stashRaw] = await Promise.all([
      execute(
        `for-each-ref --format=%(refname)%x00%(objectname:short)%x00%(HEAD)%x00%(upstream:short)%x00%(upstream:track) refs/heads refs/remotes refs/tags`,
        repoPath,
      ),
      execute(`stash list --format=%gd%x00%s%x00%H%x00%ai`, repoPath).catch(() => ''),
    ]);

    const { branches, tags } = parseBranches(refRaw);
    const stashes = parseStashList(stashRaw);
    return { branches, tags, stashes };
  }

  async function getCommitDetail(repoPath: string, hash: string): Promise<CommitDetail> {
    const [showRaw, diffRaw] = await Promise.all([
      execute(`show --format=%H%x00%P%x00%B%x00%an%x00%ae%x00%ai -s ${hash}`, repoPath),
      execute(`diff-tree --no-commit-id -r --name-status -M ${hash}`, repoPath),
    ]);
    return parseCommitDetail(showRaw, diffRaw);
  }

  async function checkoutBranch(repoPath: string, name: string): Promise<void> {
    await execute(`checkout ${name}`, repoPath);
  }

  async function createBranch(repoPath: string, name: string, from?: string): Promise<void> {
    await execute(`checkout -b ${name}${from ? ` ${from}` : ''}`, repoPath);
  }

  async function deleteBranch(repoPath: string, name: string, force = false): Promise<void> {
    await execute(`branch ${force ? '-D' : '-d'} ${name}`, repoPath);
  }

  async function renameBranch(repoPath: string, oldName: string, newName: string): Promise<void> {
    await execute(`branch -m ${oldName} ${newName}`, repoPath);
  }

  async function mergeBranch(repoPath: string, name: string): Promise<void> {
    await execute(`merge ${name}`, repoPath);
  }

  async function pushBranch(repoPath: string, branch: string, remote = 'origin'): Promise<void> {
    await execute(`push ${remote} ${branch}`, repoPath);
  }

  async function createTag(repoPath: string, name: string, hash: string): Promise<void> {
    await execute(`tag ${name} ${hash}`, repoPath);
  }

  async function fetchAll(repoPath: string): Promise<void> {
    await execute(`fetch --all`, repoPath);
  }

  return {
    executable,
    version,
    codeGitAPI,
    execute,
    getRepos,
    getLog,
    getBranches,
    getCommitDetail,
    checkoutBranch,
    createBranch,
    deleteBranch,
    renameBranch,
    mergeBranch,
    pushBranch,
    createTag,
    fetchAll,
  };
}
