# GitX 任务列表

## Phase 1 — 消息协议 + Git 数据管道 ✅

- [x] 扩展 `src/types.ts`（Branch/FileChange/CommitDetail/Tag/Stash/RepoInfo/GraphNode）
- [x] 新建 `src/protocol.ts` — Extension 侧消息类型
- [x] 新建 `src/core/gitParser.ts` — 纯函数 git 输出解析
- [x] 扩展 `src/core/gitService.ts` — 实现所有高层 git 方法
- [x] 新建 `src/webview/src/protocol.ts` — Webview 侧消息类型
- [x] 新建 `src/webview/src/composables/useGitBridge.ts` — postMessage 桥接
- [x] 新建 `src/webview/src/composables/useGitStore.ts` — 响应式状态管理
- [x] 重构 `src/webview/index.ts` — handler map 分发 + `git.openDiff` + repo 变化推送

## Phase 2 — UI 联通 + 虚拟滚动 + 提交图 ✅

- [x] 重构 `App.vue` — 接入 useGitStore，移除所有 mock 数据
- [x] 新建 `src/webview/src/utils/graphLayout.ts` — DAG 泳道布局算法
- [x] 重构 `LogView.vue` — 虚拟滚动（24px 固定行高）+ SVG 提交图列
- [x] 扩展 `BranchView.vue` — Tags / Stashes 折叠区 + ahead/behind 徽章
- [x] 更新 `CommitFileList.vue` — 点击文件打开 diff + 重命名路径展示
- [x] 更新 `CommitInfo.vue` — Hash 复制 + 完整提交信息 + 父 commit 显示
- [x] 更新 `DetailView.vue` — 接受 CommitDetail 类型，转发 openDiff 事件
- [x] 新建 `XErrorBanner.vue` — 可关闭的错误提示横幅
- [x] LogView 骨架屏（首次加载）+ 分页 spinner

## Phase 3 — 右键菜单 + 过滤搜索 ⬜

- [x] XToolbar 搜索防抖联通 `store.applyFilters`
- [x] XToolbar Refresh / Fetch 按钮联通
- [ ] 新建 `ContextMenu.vue` — Teleport 右键菜单组件
- [ ] LogView 提交右键菜单（复制 hash、复制信息、从此创建分支、打 Tag）
- [ ] BranchView 分支右键菜单（Checkout、新建、Rename、Delete、Push、Merge）
- [ ] XToolbar 作者下拉（从 commits 提取 unique authors）
- [ ] XToolbar 日期范围过滤（since / until）

## Phase 4 — 图标 + 打磨 ⬜

- [ ] `XIcon.vue` 补充图标：fetch、tag、stash、merge、push、copy
- [ ] BranchView 分支右键菜单接入真实 git 操作（需 ContextMenu 完成后）
- [ ] 提交图颜色跟随 VSCode 主题变量
- [ ] LogView ref 标签（HEAD / branch / tag）样式打磨

## 测试

- [x] 引入 Vitest
- [x] `gitParser.ts` 单元测试（22 cases，覆盖 parseLog / parseBranches / parseStashList / parseFileChanges / parseCommitDetail）
- [ ] `graphLayout.ts` 单元测试
- [ ] `useGitStore` 逻辑测试（mock bridge）
