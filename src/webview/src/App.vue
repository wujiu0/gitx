<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import BranchView from './components/BranchView/BranchView.vue';
import DetailView from './components/DetailView/DetailView.vue';
import LogView from './components/LogView/LogView.vue';
import XToolbar from './components/LogView/XToolbar.vue';
import XContainer from './components/public/XContainer.vue';
import XIcon from './components/public/XIcon.vue';
import XResizer from './components/public/XResizer.vue';
import XErrorBanner from './components/public/XErrorBanner.vue';
import { useGitStore } from './composables/useGitStore.ts';

const store = useGitStore();
const sidebarWidth = ref(200);
const detailsWidth = ref(400);

onMounted(async () => {
  await store.loadRepos();
  await Promise.all([store.loadBranches(), store.loadLog()]);
});

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
    class="flex h-screen flex-col overflow-hidden border-t border-(--vscode-panel-border) bg-(--vscode-editor-background) font-sans text-(--vscode-editor-foreground) select-none"
  >
    <XErrorBanner v-if="store.error.value" :message="store.error.value" @dismiss="store.dismissError()" />
    <div class="flex flex-1 overflow-hidden">
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
        <BranchView
          :branches="store.branches.value"
          :tags="store.tags.value"
          :stashes="store.stashes.value"
          @checkout="store.checkoutBranch"
          @deleteBranch="(name) => store.deleteBranch(name)"
          @createBranch="(name, from) => store.createBranch(name, from)"
          @mergeBranch="store.mergeBranch"
          @pushBranch="store.pushBranch"
        />
      </XContainer>
      <XResizer @resize="handleSidebarResize" />

      <XContainer id="x-logs" class="flex-1">
        <template #header>
          <XToolbar
            :is-fetching="store.isFetching.value"
            @refresh="store.refresh()"
            @fetch="store.fetchAll()"
            @filter="store.applyFilters"
          />
        </template>
        <LogView
          :commits="store.commits.value"
          :selectedCommitHash="store.selectedCommit.value?.hash"
          :is-loading="store.isLoading.value"
          :has-more="store.hasMore.value"
          @selectCommit="(c) => store.selectCommit(c.hash)"
          @loadMore="store.loadMore()"
        />
      </XContainer>
      <XResizer @resize="handleDetailsResize" />

      <XContainer id="x-details" :style="{ width: detailsWidth + 'px' }">
        <template #header>
          <div class="flex flex-1 items-center justify-between px-3">
            <span class="text-[11px] font-bold uppercase opacity-70">Commit Details</span>
            <div class="flex items-center space-x-1">
              <button class="vscode-btn-icon" title="Close Details" @click="store.selectedCommit.value = null">
                <XIcon name="close" size="14" />
              </button>
            </div>
          </div>
        </template>
        <DetailView :commit="store.selectedCommit.value" @openDiff="store.openDiff" />
      </XContainer>
    </div>
  </div>
</template>

<style>
:root {
  --vscode-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}
</style>
