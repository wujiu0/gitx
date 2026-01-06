<script lang="ts" setup>
import type { Commit } from '../../types.ts';

defineProps<{
  commit: Commit;
}>();
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden bg-(--vscode-editor-background)">
    <div
      class="flex h-9 shrink-0 items-center border-b border-(--vscode-panel-border) bg-(--vscode-panel-background) px-3"
    >
      <span class="text-[11px] font-bold uppercase opacity-70">Commit Message</span>
    </div>
    <div class="min-h-0 flex-1 overflow-y-auto p-3">
      <div class="mb-2 flex items-start justify-between">
        <h3 class="line-clamp-3 cursor-text leading-snug font-bold select-text">{{ commit.message }}</h3>
        <span
          class="ml-2 shrink-0 cursor-pointer rounded bg-(--vscode-badge-background) px-1 font-mono text-[10px] opacity-60 transition-opacity select-all hover:opacity-100"
          title="Click to copy full hash"
        >
          {{ commit.hash.substring(0, 7) }}
        </span>
      </div>
      <div class="space-y-1 text-xs opacity-80">
        <div class="flex space-x-2">
          <span class="w-12 shrink-0 opacity-60">Author:</span>
          <span class="cursor-text select-text">{{ commit.author }}</span>
        </div>
        <div class="flex space-x-2">
          <span class="w-12 shrink-0 opacity-60">Date:</span>
          <span class="cursor-text select-text">{{ commit.date }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
