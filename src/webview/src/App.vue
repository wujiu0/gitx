<script lang="ts" setup>
import { ref } from 'vue';
import BranchView from './components/BranchView/BranchView.vue';
import DetailView from './components/DetailView/DetailView.vue';
import LogView from './components/LogView/LogView.vue';
import XToolbar from './components/LogView/XToolbar.vue';
import XContainer from './components/public/XContainer.vue';
import XIcon from './components/public/XIcon.vue';
import XResizer from './components/public/XResizer.vue';
import type { Branch, Commit } from './types.ts';

// 模拟数据
const branches = ref<Branch[]>([
  { name: 'main', type: 'local', current: true },
  { name: 'feature/ui', type: 'local', current: false },
  { name: 'origin/main', type: 'remote', current: false },
]);

const commits = ref<Commit[]>([
  {
    hash: 'c2bffaffd3b8f8f8f8f8f8f8f8f8f8f8f8f8f8f8',
    message: 'chore: update README with GitX description, add CONTRIBUTING guide',
    author: 'dingzhan.sui',
    date: '8 minutes ago',
    files: [
      { name: 'README.md', status: 'M' },
      { name: 'CONTRIBUTING.md', status: 'A' },
    ],
  },
  {
    hash: '86aedb1ea3b8f8f8f8f8f8f8f8f8f8f8f8f8f8f8',
    message: 'chore: update launch configuration to include GITX_DEV_SERVER_URL',
    author: 'dingzhan.sui',
    date: 'Today 09:01',
    files: [{ name: '.vscode/launch.json', status: 'M' }],
  },
  {
    hash: '837a221ba3b8f8f8f8f8f8f8f8f8f8f8f8f8f8f8',
    message: 'chore: implement GitX webview integration, include dev and build',
    author: 'dingzhan.sui',
    date: 'Yesterday 23:44',
    files: [
      { name: 'src/extension.ts', status: 'M' },
      { name: 'src/webview/index.ts', status: 'M' },
      { name: 'src/webview/package.json', status: 'A' },
    ],
  },
  {
    hash: 'cba302cba3b8f8f8f8f8f8f8f8f8f8f8f8f8f8f8',
    message: 'chore: init',
    author: 'dingzhan.sui',
    date: '2026/1/3 20:09',
    files: [
      { name: 'package.json', status: 'A' },
      { name: 'pnpm-lock.yaml', status: 'A' },
    ],
  },
]);

const selectedCommit = ref<Commit>();
const sidebarWidth = ref(200);
const detailsWidth = ref(400);

const handleSelectCommit = (commit: Commit) => {
  selectedCommit.value = commit;
};

const handleSelectBranch = (branch: Branch) => {
  console.log('Selected branch:', branch.name);
};

const handleSidebarResize = (clientX: number) => {
  if (clientX > 150 && clientX < 500) {
    sidebarWidth.value = clientX;
  }
};

const handleDetailsResize = (clientX: number) => {
  const width = window.innerWidth - clientX;
  if (width > 200 && width < 800) {
    detailsWidth.value = width;
  }
};
</script>

<template>
  <div
    class="flex h-screen overflow-hidden border-t border-(--vscode-panel-border) bg-(--vscode-editor-background) font-sans text-(--vscode-editor-foreground) select-none"
  >
    <XContainer id="x-sidebar" :style="{ width: sidebarWidth + 'px' }">
      <template #header>
        <div class="flex flex-1 items-center px-2 py-1">
          <div class="relative flex-1">
            <input type="text" placeholder="Filter branches..." class="vscode-input w-full pl-7" />
            <div class="absolute top-1/2 left-2 -translate-y-1/2 opacity-50">
              <XIcon name="search" size="14" />
            </div>
          </div>
        </div>
      </template>
      <BranchView :branches="branches" @selectBranch="handleSelectBranch" />
    </XContainer>
    <XResizer @resize="handleSidebarResize" />

    <XContainer id="x-logs" class="flex-1">
      <template #header>
        <XToolbar />
      </template>
      <LogView :commits="commits" :selectedCommitHash="selectedCommit?.hash" @selectCommit="handleSelectCommit" />
    </XContainer>
    <XResizer @resize="handleDetailsResize" />

    <XContainer id="x-details" :style="{ width: detailsWidth + 'px' }">
      <template #header>
        <div class="flex flex-1 items-center justify-between px-3">
          <span class="text-[11px] font-bold uppercase opacity-70">Commit Details</span>
          <div class="flex items-center space-x-1">
            <button class="vscode-btn-icon" title="Close Details" @click="selectedCommit = undefined">
              <XIcon name="close" size="14" />
            </button>
          </div>
        </div>
      </template>
      <DetailView :commit="selectedCommit" />
    </XContainer>
  </div>
</template>

<style>
:root {
  --vscode-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}
</style>
