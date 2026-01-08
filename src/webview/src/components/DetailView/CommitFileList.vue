<script lang="ts" setup>
import type { Commit } from '../../types.ts';
import { getStatusColor } from '../../utils/status.ts';
import XIcon from '../public/XIcon.vue';

defineProps<{
  commit: Commit;
}>();
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden">
    <!-- Toolbar for Details -->
    <div
      class="flex h-9 shrink-0 items-center border-b border-(--vscode-panel-border) bg-(--vscode-panel-background) px-2"
    >
      <div class="flex items-center space-x-1">
        <button class="vscode-btn-icon" title="Diff View">
          <XIcon name="diff" size="14" />
        </button>
        <button class="vscode-btn-icon" title="Expand All">
          <XIcon name="expand" size="14" />
        </button>
      </div>
      <div class="flex-1 px-2 text-[11px] font-bold uppercase opacity-70">Changed Files</div>
      <div class="flex items-center space-x-1">
        <span v-if="commit.files" class="vscode-badge mr-1">
          {{ commit.files.length }}
        </span>
        <button class="vscode-btn-icon" title="Settings">
          <XIcon name="settings" size="14" />
        </button>
      </div>
    </div>

    <!-- File List -->
    <div class="flex-1 overflow-y-auto">
      <div class="py-1">
        <div v-for="file in commit.files" :key="file.name" class="vscode-list-item space-x-2">
          <XIcon name="file" size="14" class="opacity-60" />
          <span class="flex-1 truncate select-text">{{ file.name }}</span>
          <span :class="['w-4 text-center text-[10px] font-bold', getStatusColor(file.status)]">
            {{ file.status }}
          </span>
        </div>
        <div v-if="!commit.files || commit.files.length === 0" class="p-4 text-center text-xs italic opacity-40">
          No file changes recorded
        </div>
      </div>
    </div>
  </div>
</template>
