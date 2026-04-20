<script lang="ts" setup>
import { ref } from 'vue';
import type { CommitDetail } from '../../types.ts';

defineProps<{
  commit: CommitDetail;
}>();

const copied = ref(false);

async function copyHash(hash: string) {
  await navigator.clipboard.writeText(hash);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1500);
}
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
        <h3 class="line-clamp-3 cursor-text leading-snug font-bold select-text">{{ commit.fullMessage || commit.message }}</h3>
        <button
          class="ml-2 shrink-0 cursor-pointer rounded bg-(--vscode-badge-background) px-1 font-mono text-[10px] opacity-60 transition-opacity hover:opacity-100"
          :title="copied ? 'Copied!' : 'Click to copy full hash'"
          @click="copyHash(commit.hash)"
        >
          {{ copied ? '✓' : commit.hash.substring(0, 7) }}
        </button>
      </div>
      <div class="space-y-1 text-xs opacity-80">
        <div class="flex space-x-2">
          <span class="w-14 shrink-0 opacity-60">Author:</span>
          <span class="cursor-text select-text">{{ commit.author }}</span>
          <span v-if="commit.authorEmail" class="opacity-50">&lt;{{ commit.authorEmail }}&gt;</span>
        </div>
        <div class="flex space-x-2">
          <span class="w-14 shrink-0 opacity-60">Date:</span>
          <span class="cursor-text select-text">{{ commit.date }}</span>
        </div>
        <div v-if="commit.parents.length > 0" class="flex space-x-2">
          <span class="w-14 shrink-0 opacity-60">Parents:</span>
          <div class="flex flex-wrap gap-1">
            <span
              v-for="p in commit.parents"
              :key="p"
              class="cursor-pointer rounded bg-(--vscode-badge-background) px-1 font-mono text-[10px] opacity-60 hover:opacity-100"
              :title="p"
            >{{ p.substring(0, 7) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
