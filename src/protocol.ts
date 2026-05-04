export interface WebviewRequest<T = unknown> {
  id: string;
  command: string;
  payload?: T;
}

export interface ExtensionResponse<T = unknown> {
  id: string;
  ok: boolean;
  data?: T;
  error?: string;
}

export interface ExtensionPush<T = unknown> {
  event: string;
  data: T;
}

export type Command =
  | 'git.repos'
  | 'git.log'
  | 'git.branches'
  | 'git.commitDetail'
  | 'git.checkout'
  | 'git.createBranch'
  | 'git.deleteBranch'
  | 'git.renameBranch'
  | 'git.mergeBranch'
  | 'git.pushBranch'
  | 'git.createTag'
  | 'git.fetch'
  | 'git.openDiff';

export type PushEvent = 'git.repoChanged';
