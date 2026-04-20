# GitX 技术方案

## 整体架构

GitX 是一个 VS Code 扩展，通过 Webview 提供 JetBrains 风格的 Git 工具窗口。

```
┌─────────────────────────────────────────────────────┐
│                   VS Code Extension Host             │
│                                                     │
│  extension.ts  ──▶  GitXViewProvider               │
│                          │                          │
│                     GitService                      │
│                    gitParser.ts                     │
│                          │                          │
│               postMessage (协议层)                  │
└──────────────────────────┼──────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────┐
│              Webview (Vue 3 + Vite)                 │
│                          │                          │
│              useGitBridge (桥接层)                  │
│                          │                          │
│              useGitStore (状态层)                   │
│                          │                          │
│   BranchView │ LogView │ DetailView                 │
└─────────────────────────────────────────────────────┘
```

## 消息协议

Extension 与 Webview 之间通过 `postMessage` 通信，使用 UUID 关联异步请求/响应。

**Webview → Extension（请求）**

```typescript
interface WebviewRequest {
  id: string;      // crypto.randomUUID()
  command: string; // 'git.log' | 'git.branches' | ...
  payload?: unknown;
}
```

**Extension → Webview（响应）**

```typescript
interface ExtensionResponse {
  id: string;   // 与请求 id 对应
  ok: boolean;
  data?: unknown;
  error?: string;
}
```

**Extension → Webview（主动推送，无 id）**

```typescript
interface ExtensionPush {
  event: string; // 'git.repoChanged'
  data: unknown;
}
```

**支持的命令**

| Command | Payload | 返回 |
|---|---|---|
| `git.repos` | — | `RepoInfo[]` |
| `git.log` | `LogOptions` | `{ commits, hasMore }` |
| `git.branches` | — | `{ branches, tags, stashes }` |
| `git.commitDetail` | `{ hash }` | `CommitDetail` |
| `git.checkout` | `{ name }` | — |
| `git.createBranch` | `{ name, from? }` | — |
| `git.deleteBranch` | `{ name, force? }` | — |
| `git.renameBranch` | `{ oldName, newName }` | — |
| `git.mergeBranch` | `{ name }` | — |
| `git.pushBranch` | `{ branch, remote? }` | — |
| `git.createTag` | `{ name, hash }` | — |
| `git.fetch` | — | — |
| `git.openDiff` | `{ filePath, hash, parentHash, status, originalPath? }` | — |

`git.openDiff` 不走 response 机制，Extension 侧直接调用 `vscode.commands.executeCommand('vscode.diff', ...)` 打开编辑器。

## Git 数据层

### GitService（`src/core/gitService.ts`）

封装所有 git CLI 调用，通过 `execute(args, cwd)` 执行命令。使用 `codeGitAPI.repositories` 获取当前工作区仓库路径，无需手动扫描文件系统。

**关键 git 命令**

```bash
# getLog — NUL 分隔字段，避免提交信息中的换行/特殊字符干扰
git log --pretty=format:%H%x00%P%x00%D%x00%s%x00%an%x00%ae%x00%ai \
  -n {limit} --skip {offset} [--grep=...] [--author=...] [--after=...] [--before=...]

# getBranches — 一次获取本地、远程、tag
git for-each-ref \
  --format=%(refname)%x00%(objectname:short)%x00%(HEAD)%x00%(upstream:short)%x00%(upstream:track) \
  refs/heads refs/remotes refs/tags

# getCommitDetail — show 只取 header，再单独拿 diff-tree
git show --format=%H%x00%P%x00%B%x00%an%x00%ae%x00%ai -s {hash}
git diff-tree --no-commit-id -r --name-status -M {hash}
```

### GitParser（`src/core/gitParser.ts`）

纯函数，只做字符串解析，不调用任何外部依赖，完全可单元测试。

| 函数 | 输入 | 输出 |
|---|---|---|
| `parseLog` | git log 原始输出 | `Commit[]` |
| `parseBranches` | for-each-ref 原始输出 | `{ branches, tags }` |
| `parseStashList` | stash list 原始输出 | `Stash[]` |
| `parseFileChanges` | diff-tree 原始输出 | `FileChange[]` |
| `parseCommitDetail` | show + diff-tree 输出 | `CommitDetail` |

## Webview 状态管理

### useGitBridge（`src/webview/src/composables/useGitBridge.ts`）

模块级单例持有 `acquireVsCodeApi()`（VS Code 限制只能调用一次）。维护 `pending: Map<id, {resolve, reject}>` 实现 Promise 化的请求/响应。

```typescript
export function request<T>(command: string, payload?: unknown): Promise<T>
export function onPushEvent<T>(event: string, callback: (data: T) => void): () => void
```

### useGitStore（`src/webview/src/composables/useGitStore.ts`）

模块级响应式单例（Vue `ref`/`reactive`，无 Pinia）。所有组件共享同一份状态实例。

**状态**

```typescript
repos, activeRepoPath,
branches, tags, stashes,
commits, hasMore,
selectedCommit,
isLoading, isFetching, error,
filters: { search, author, since, until, branch }
```

**Actions**：`loadRepos / loadBranches / loadLog / loadMore / selectCommit / applyFilters / refresh / fetchAll / checkoutBranch / createBranch / deleteBranch / renameBranch / mergeBranch / pushBranch / createTag / openDiff`

## 提交图算法（`src/webview/src/utils/graphLayout.ts`）

O(n) 泳道分配算法，输入按时间倒序排列的 `Commit[]`，输出每条 commit 的 `CommitGraphNode`。

**核心逻辑**

1. 维护 `laneMap: Map<hash, colIndex>` 跟踪各分支末端所在泳道
2. 每条 commit：从 laneMap 取列号（无则分配新列）→ 计算与父 commit 的连接边 → 第一父继承当前泳道，其余父各占新泳道
3. 分支合并后释放泳道，下一条 commit 可复用
4. 颜色循环使用 6 个预定义色（`GRAPH_COLORS`）

**SVG 渲染**（LogView.vue 每行的第一列）

- 过境竖线：`<line>` — 活跃但非当前 commit 的泳道
- 连接曲线：`<path>` 二阶贝塞尔 `M x1 0 Q x1 12 xm 12 Q x2 12 x2 24`
- commit 圆点：`<circle r="4">`

## 虚拟滚动（LogView.vue）

固定行高 24px，无额外依赖。

```
可见行范围:
  start = floor(scrollTop / 24) - OVERSCAN(10)
  end   = ceil((scrollTop + viewportHeight) / 24) + OVERSCAN(10)

DOM 结构:
  <div style="height: totalHeight">         ← 撑开滚动条
    <table style="transform: translateY(start * 24)">  ← 只渲染可见行
```

滚动至距底部 2 个视口高度时触发 `loadMore()`，分页追加 200 条。

## Diff 查看

Extension 收到 `git.openDiff` 后，用 `codeGitAPI.toGitUri(fileUri, ref)` 构造 `git://` URI，再调用 VS Code 内置 diff 命令：

```typescript
// 新增文件：只打开新版本
vscode.commands.executeCommand('vscode.open', newUri)

// 删除文件：只打开旧版本
vscode.commands.executeCommand('vscode.open', oldUri)

// 修改 / 重命名：打开 diff 编辑器
vscode.commands.executeCommand('vscode.diff', oldUri, newUri, title)
```

`toGitUri` 生成的 URI 由 `vscode.git` 扩展的 FileSystemProvider 解析，可在 diff 编辑器中获得完整语法高亮。

## 构建系统

| 部分 | 工具 | 产物 |
|---|---|---|
| Extension | `tsdown`（基于 rolldown） | `out/extension.js` |
| Webview | `vite` + `@vitejs/plugin-vue` | `src/webview/build/` |
| 类型检查 | `tsc` / `vue-tsc` | — |
| 单元测试 | `vitest` | — |

开发时 HMR：设置环境变量 `GITX_DEV_SERVER_URL=http://localhost:5173`，Extension Host 会从 Vite dev server 加载 Webview，支持热更新。

## 目录结构

```
src/
├── extension.ts          # 入口：激活、注册命令和视图
├── protocol.ts           # Extension 侧消息类型
├── types.ts              # 共享数据类型
├── core/
│   ├── gitService.ts     # Git 操作封装
│   └── gitParser.ts      # Git 输出纯函数解析
├── utils/
│   ├── outputChannel.ts  # Logger 单例
│   └── global.ts         # execAsync、getUri 等工具函数
├── typings/
│   └── git.d.ts          # VS Code Git 扩展 API 类型
├── test/
│   └── gitParser.test.ts # Vitest 单元测试
└── webview/
    ├── index.ts           # GitXViewProvider（消息分发）
    └── src/
        ├── main.ts
        ├── App.vue
        ├── protocol.ts    # Webview 侧消息类型
        ├── types.ts       # 从 ../../types.ts 重导出
        ├── composables/
        │   ├── useGitBridge.ts
        │   └── useGitStore.ts
        ├── utils/
        │   ├── graphLayout.ts
        │   └── status.ts
        └── components/
            ├── LogView/
            │   ├── LogView.vue
            │   └── XToolbar.vue
            ├── BranchView/
            │   └── BranchView.vue
            ├── DetailView/
            │   ├── DetailView.vue
            │   ├── CommitFileList.vue
            │   └── CommitInfo.vue
            └── public/
                ├── XContainer.vue
                ├── XIcon.vue
                ├── XResizer.vue
                └── XErrorBanner.vue
```
