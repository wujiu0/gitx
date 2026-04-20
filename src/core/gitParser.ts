import type { Branch, Commit, CommitDetail, FileChange, Stash, Tag } from '../types.js';

export function parseLog(raw: string): Commit[] {
  if (!raw.trim()) { return []; }
  return raw
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const parts = line.split('\x00');
      const [hash = '', parents = '', refs = '', message = '', author = '', authorEmail = '', date = ''] = parts;
      return {
        hash: hash.trim(),
        parents: parents.trim() ? parents.trim().split(' ') : [],
        refs: refs.trim(),
        message: message.trim(),
        author: author.trim(),
        authorEmail: authorEmail.trim(),
        date: date.trim(),
      };
    })
    .filter((c) => c.hash);
}

export function parseBranches(forEachRefRaw: string): { branches: Branch[]; tags: Tag[] } {
  const branches: Branch[] = [];
  const tags: Tag[] = [];

  if (!forEachRefRaw.trim()) { return { branches, tags }; }

  for (const line of forEachRefRaw.split('\n')) {
    if (!line.trim()) { continue; }
    const parts = line.split('\x00');
    const [refName = '', hash = '', headMarker = '', upstream = '', track = ''] = parts;

    if (!refName || !hash) { continue; }

    if (refName.startsWith('refs/heads/') || refName.startsWith('refs/remotes/')) {
      const name = refName.startsWith('refs/heads/')
        ? refName.slice('refs/heads/'.length)
        : refName.slice('refs/remotes/'.length);
      const type: 'local' | 'remote' = refName.startsWith('refs/heads/') ? 'local' : 'remote';

      const { ahead, behind } = parseTrack(track);
      branches.push({
        name,
        type,
        current: headMarker === '*',
        upstream: upstream || undefined,
        ahead,
        behind,
      });
    } else if (refName.startsWith('refs/tags/')) {
      const name = refName.slice('refs/tags/'.length);
      tags.push({ name, hash: hash.trim() });
    }
  }

  return { branches, tags };
}

function parseTrack(track: string): { ahead?: number; behind?: number } {
  if (!track) { return {}; }
  const aheadMatch = track.match(/ahead (\d+)/);
  const behindMatch = track.match(/behind (\d+)/);
  return {
    ahead: aheadMatch ? parseInt(aheadMatch[1]!, 10) : undefined,
    behind: behindMatch ? parseInt(behindMatch[1]!, 10) : undefined,
  };
}

export function parseStashList(raw: string): Stash[] {
  if (!raw.trim()) { return []; }
  return raw
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const parts = line.split('\x00');
      const [ref = '', message = '', hash = '', date = ''] = parts;
      const indexMatch = ref.match(/stash@\{(\d+)\}/);
      return {
        index: indexMatch ? parseInt(indexMatch[1]!, 10) : 0,
        message: message.trim(),
        hash: hash.trim(),
        date: date.trim(),
      };
    })
    .filter((s) => s.hash);
}

export function parseFileChanges(raw: string): FileChange[] {
  if (!raw.trim()) { return []; }
  return raw
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const parts = line.split('\t');
      const statusCode = parts[0]?.trim() ?? '';

      if (statusCode.startsWith('R') || statusCode.startsWith('C')) {
        return {
          path: parts[2]?.trim() ?? '',
          originalPath: parts[1]?.trim(),
          status: (statusCode[0] as 'R' | 'C') ?? 'M',
        };
      }

      return {
        path: parts[1]?.trim() ?? '',
        status: (statusCode[0] as FileChange['status']) ?? 'M',
      };
    })
    .filter((f) => f.path);
}

export function parseCommitDetail(showRaw: string, diffTreeRaw: string): CommitDetail {
  const nulIdx = showRaw.indexOf('\x00');
  const headerLine = nulIdx >= 0 ? showRaw.slice(0, showRaw.lastIndexOf('\x00', nulIdx + 1)) : showRaw;

  const parts = showRaw.split('\x00');
  const [hash = '', parents = '', fullMessage = '', author = '', authorEmail = '', date = ''] = parts;

  const message = fullMessage.split('\n')[0]?.trim() ?? '';

  return {
    hash: hash.trim(),
    parents: parents.trim() ? parents.trim().split(' ') : [],
    refs: '',
    message,
    fullMessage: fullMessage.trim(),
    author: author.trim(),
    authorEmail: authorEmail.trim(),
    date: date.trim(),
    files: parseFileChanges(diffTreeRaw),
  };
}
