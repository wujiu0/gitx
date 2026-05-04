import { describe, expect, it } from 'vitest';
import {
  parseLog,
  parseBranches,
  parseStashList,
  parseFileChanges,
  parseCommitDetail,
} from '../core/gitParser.js';

describe('parseLog', () => {
  it('returns empty array for empty input', () => {
    expect(parseLog('')).toEqual([]);
    expect(parseLog('   \n  ')).toEqual([]);
  });

  it('parses a single commit', () => {
    const raw =
      'abc1234\x00def5678 ghi9012\x00HEAD -> main, origin/main\x00feat: add feature\x00Jane Doe\x00jane@example.com\x002024-01-15 10:30:00 +0800';
    const [commit] = parseLog(raw);
    expect(commit).toMatchObject({
      hash: 'abc1234',
      parents: ['def5678', 'ghi9012'],
      refs: 'HEAD -> main, origin/main',
      message: 'feat: add feature',
      author: 'Jane Doe',
      authorEmail: 'jane@example.com',
      date: '2024-01-15 10:30:00 +0800',
    });
  });

  it('parses multiple commits separated by newlines', () => {
    const raw = [
      'aaa0001\x00bbb0002\x00\x00first commit\x00Alice\x00alice@test.com\x002024-01-01 00:00:00 +0000',
      'bbb0002\x00\x00\x00second commit\x00Bob\x00bob@test.com\x002024-01-02 00:00:00 +0000',
    ].join('\n');
    const commits = parseLog(raw);
    expect(commits).toHaveLength(2);
    expect(commits[0]!.hash).toBe('aaa0001');
    expect(commits[1]!.hash).toBe('bbb0002');
  });

  it('handles root commit with no parents', () => {
    const raw =
      'abc1234\x00\x00\x00initial commit\x00Alice\x00a@b.com\x002024-01-01 00:00:00 +0000';
    const [commit] = parseLog(raw);
    expect(commit!.parents).toEqual([]);
  });

  it('handles commit message with special characters', () => {
    const raw =
      'abc1234\x00\x00\x00fix: handle % and : chars\x00Dev\x00dev@test.com\x002024-01-01 00:00:00 +0000';
    const [commit] = parseLog(raw);
    expect(commit!.message).toBe('fix: handle % and : chars');
  });

  it('skips lines with empty hashes', () => {
    const raw =
      '\x00\x00\x00empty\x00\x00\x00\nabc1234\x00\x00\x00valid\x00A\x00a@b.com\x002024-01-01 00:00:00 +0000';
    const commits = parseLog(raw);
    expect(commits).toHaveLength(1);
    expect(commits[0]!.hash).toBe('abc1234');
  });
});

describe('parseBranches', () => {
  it('returns empty for empty input', () => {
    const result = parseBranches('');
    expect(result.branches).toEqual([]);
    expect(result.tags).toEqual([]);
  });

  it('parses local branches', () => {
    const raw = 'refs/heads/main\x00abc1234\x00*\x00origin/main\x00[ahead 1]';
    const { branches } = parseBranches(raw);
    expect(branches).toHaveLength(1);
    expect(branches[0]).toMatchObject({
      name: 'main',
      type: 'local',
      current: true,
      upstream: 'origin/main',
      ahead: 1,
    });
  });

  it('parses remote branches', () => {
    const raw = 'refs/remotes/origin/feature\x00def5678\x00\x00\x00';
    const { branches } = parseBranches(raw);
    expect(branches).toHaveLength(1);
    expect(branches[0]).toMatchObject({
      name: 'origin/feature',
      type: 'remote',
      current: false,
    });
  });

  it('parses tags', () => {
    const raw = 'refs/tags/v1.0.0\x00abc1234\x00\x00\x00';
    const { tags } = parseBranches(raw);
    expect(tags).toHaveLength(1);
    expect(tags[0]).toMatchObject({ name: 'v1.0.0', hash: 'abc1234' });
  });

  it('parses ahead and behind counts', () => {
    const raw = [
      'refs/heads/feat\x00abc\x00\x00origin/feat\x00[ahead 2, behind 3]',
      'refs/heads/old\x00def\x00\x00origin/old\x00[behind 5]',
    ].join('\n');
    const { branches } = parseBranches(raw);
    expect(branches[0]).toMatchObject({ ahead: 2, behind: 3 });
    expect(branches[1]).toMatchObject({ ahead: undefined, behind: 5 });
  });

  it('skips malformed lines', () => {
    const raw = '\x00\x00\x00\x00\nrefs/heads/good\x00abc\x00\x00\x00';
    const { branches } = parseBranches(raw);
    expect(branches).toHaveLength(1);
  });
});

describe('parseStashList', () => {
  it('returns empty for empty input', () => {
    expect(parseStashList('')).toEqual([]);
  });

  it('parses stash entries', () => {
    const raw = [
      'stash@{0}\x00WIP on main: fix stuff\x00abc1234\x002024-01-15 10:00:00 +0800',
      'stash@{1}\x00On feat: save wip\x00def5678\x002024-01-14 09:00:00 +0800',
    ].join('\n');
    const stashes = parseStashList(raw);
    expect(stashes).toHaveLength(2);
    expect(stashes[0]).toMatchObject({ index: 0, message: 'WIP on main: fix stuff', hash: 'abc1234' });
    expect(stashes[1]!.index).toBe(1);
  });
});

describe('parseFileChanges', () => {
  it('returns empty for empty input', () => {
    expect(parseFileChanges('')).toEqual([]);
  });

  it('parses modified files', () => {
    const files = parseFileChanges('M\tsrc/index.ts');
    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({ status: 'M', path: 'src/index.ts' });
    expect(files[0]!.originalPath).toBeUndefined();
  });

  it('parses added and deleted files', () => {
    const files = parseFileChanges('A\tnew-file.ts\nD\told-file.ts');
    expect(files[0]!.status).toBe('A');
    expect(files[1]!.status).toBe('D');
  });

  it('parses renamed files with original path', () => {
    const files = parseFileChanges('R100\told/path.ts\tnew/path.ts');
    expect(files).toHaveLength(1);
    expect(files[0]).toMatchObject({ status: 'R', originalPath: 'old/path.ts', path: 'new/path.ts' });
  });

  it('parses copied files', () => {
    const files = parseFileChanges('C100\tsrc/original.ts\tsrc/copy.ts');
    expect(files[0]).toMatchObject({ status: 'C', originalPath: 'src/original.ts', path: 'src/copy.ts' });
  });

  it('filters out lines with empty paths', () => {
    const files = parseFileChanges('M\t\nA\tsrc/valid.ts');
    expect(files).toHaveLength(1);
    expect(files[0]!.path).toBe('src/valid.ts');
  });
});

describe('parseCommitDetail', () => {
  it('parses commit detail with files', () => {
    const showRaw =
      'abc1234\x00def5678\x00feat: add feature\n\nDetailed description\x00Jane Doe\x00jane@test.com\x002024-01-15 10:00:00 +0800';
    const detail = parseCommitDetail(showRaw, 'M\tsrc/index.ts\nA\tsrc/new.ts');

    expect(detail).toMatchObject({
      hash: 'abc1234',
      parents: ['def5678'],
      author: 'Jane Doe',
      authorEmail: 'jane@test.com',
    });
    expect(detail.files).toHaveLength(2);
    expect(detail.files[0]!.path).toBe('src/index.ts');
    expect(detail.files[1]!.path).toBe('src/new.ts');
  });

  it('extracts first line as short message', () => {
    const showRaw =
      'abc1234\x00\x00feat: subject line\n\nLonger body\n\nWith paragraphs\x00Author\x00a@b.com\x002024-01-01 00:00:00 +0000';
    const detail = parseCommitDetail(showRaw, '');
    expect(detail.message).toBe('feat: subject line');
  });
});
