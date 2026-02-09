import * as vscode from 'vscode';
import type { GitExtension } from '../typings/git.js';
import { execAsync, getWorkspaceFolder } from '../utils/global.js';
import { logger } from '../utils/outputChannel.js';

export const UNABLE_TO_FIND_GIT_MSG =
  'Unable to find git executable, please make sure git is installed and in your PATH, or set the path in vscode settings "git.path"';

export interface GitService {
  readonly executable: string;
  readonly version: string;
  execute(command: string): Promise<string>;
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
        return [x, match[1].trim()];
      }
      throw new Error('unknown git version');
    } catch (error) {
      throw new Error('unknown git version');
    }
  }
  function checkGitExecutable() {
    return getGitVersion('git').catch((_) => getGitVersion(codeGitAPI.git.path));
  }
  async function execute(command: string) {
    try {
      const { stdout } = await execAsync(`${executable} ${command}`, { cwd: getWorkspaceFolder() });
      return stdout.trim();
    } catch (error) {
      logger.error(`Git command failed: ${executable} ${command}`);
      throw error;
    }
  }
  return {
    executable,
    version,
    execute,
  };
}
