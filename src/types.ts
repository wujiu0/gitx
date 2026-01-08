export interface Branch {
  name: string;
  type: 'local' | 'remote';
  current?: boolean;
}

export interface Commit {
  hash: string;
  message: string;
  author: string;
  date: string;
  files?: FileChange[];
}

export interface FileChange {
  name: string;
  status: 'M' | 'A' | 'D' | 'R';
}
