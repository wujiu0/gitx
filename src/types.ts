export interface Branch {
  name: string;
  type: 'local' | 'remote';
  current?: boolean;
  ahead?: number;
  behind?: number;
  upstream?: string;
}

export interface Tag {
  name: string;
  hash: string;
}

export interface Stash {
  index: number;
  message: string;
  hash: string;
  date: string;
}

export interface RepoInfo {
  path: string;
  name: string;
}

export interface Commit {
  hash: string;
  parents: string[];
  refs: string;
  message: string;
  author: string;
  authorEmail: string;
  date: string;
}

export interface CommitDetail extends Commit {
  fullMessage: string;
  files: FileChange[];
}

export interface FileChange {
  path: string;
  originalPath?: string;
  status: 'M' | 'A' | 'D' | 'R' | 'C';
}

export interface LogOptions {
  limit?: number;
  offset?: number;
  search?: string;
  author?: string;
  since?: string;
  until?: string;
  branch?: string;
}

export interface GraphEdge {
  fromCol: number;
  toCol: number;
  type: 'straight' | 'fork' | 'merge';
}

export interface CommitGraphNode {
  hash: string;
  column: number;
  color: string;
  edges: GraphEdge[];
  passThrough: number[];
}
