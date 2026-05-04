<script lang="ts" setup>
import { ref } from 'vue';
import type { CommitDetail, FileChange } from '../../types.ts';
import XResizer from '../public/XResizer.vue';
import CommitFileList from './CommitFileList.vue';
import CommitInfo from './CommitInfo.vue';

defineProps<{
  commit?: CommitDetail | null;
}>();

const emit = defineEmits<{
  (e: 'openDiff', file: FileChange, commit: CommitDetail): void;
}>();

const fileListHeight = ref<number | null>(null);
const containerRef = ref<HTMLElement | null>(null);

const handleFileListResize = (clientY: number) => {
  if (!containerRef.value) return;
  const rect = containerRef.value.getBoundingClientRect();
  const newHeight = clientY - rect.top;
  if (newHeight > 100 && newHeight < rect.height - 100) {
    fileListHeight.value = newHeight;
  }
};
</script>

<template>
  <div ref="containerRef" class="flex h-full shrink-0 flex-col overflow-hidden bg-(--vscode-sideBar-background)">
    <div v-if="commit" class="flex flex-1 flex-col overflow-hidden">
      <div
        :class="fileListHeight === null ? 'flex-1' : 'shrink-0'"
        class="min-h-0 overflow-hidden"
        :style="fileListHeight !== null ? { height: fileListHeight + 'px' } : {}"
      >
        <CommitFileList :commit="commit" @openDiff="(file) => emit('openDiff', file, commit!)" />
      </div>

      <XResizer orientation="vertical" @resize="handleFileListResize" />

      <CommitInfo :commit="commit" />
    </div>
    <div v-else class="flex flex-1 items-center justify-center text-xs italic opacity-40">
      Select a commit to view details
    </div>
  </div>
</template>
