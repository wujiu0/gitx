<script lang="ts" setup>
import type { Commit } from '../../types.ts';

defineProps<{
  commits: Commit[];
  selectedCommitHash?: string;
}>();

const emit = defineEmits<{
  (e: 'selectCommit', commit: Commit): void;
}>();
</script>

<template>
  <div class="flex flex-1 flex-col overflow-hidden bg-(--vscode-editor-background)">
    <div class="flex-1 overflow-auto">
      <table class="w-full table-fixed border-collapse text-left">
        <thead
          v-show="false"
          class="sticky top-0 z-10 bg-(--vscode-editor-background) shadow-[0_1px_0_var(--vscode-panel-border)]"
        >
          <tr class="border-b border-(--vscode-panel-border) font-normal text-(--vscode-descriptionForeground)">
            <th class="w-12 border-r border-(--vscode-panel-border) px-2 py-1 text-xs font-normal">Graph</th>
            <th class="border-r border-(--vscode-panel-border) px-2 py-1 text-xs font-normal">Description</th>
            <th class="w-32 border-r border-(--vscode-panel-border) px-2 py-1 text-xs font-normal">Author</th>
            <th class="w-32 px-2 py-1 text-xs font-normal">Date</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="commit in commits"
            :key="commit.hash"
            @click="emit('selectCommit', commit)"
            :class="[
              'group vscode-list-item border-b border-(--vscode-panel-border)/30',
              selectedCommitHash === commit.hash ? 'vscode-list-item-active' : '',
            ]"
          >
            <td class="relative w-12 border-r border-(--vscode-panel-border)/30 px-2 py-1 text-center">
              <!-- Mock Graph Point -->
              <div class="absolute top-0 bottom-0 left-1/2 w-px bg-blue-500/30"></div>
              <div
                class="relative z-10 mx-auto h-2 w-2 rounded-full border-2 border-blue-400 bg-(--vscode-editor-background) transition-transform group-hover:scale-125"
              ></div>
            </td>
            <td class="truncate border-r border-(--vscode-panel-border)/30 px-2 py-1 text-xs">
              <span class="font-medium">{{ commit.message }}</span>
            </td>
            <td
              class="truncate border-r border-(--vscode-panel-border)/30 px-2 py-1 text-xs whitespace-nowrap opacity-90"
            >
              {{ commit.author }}
            </td>
            <td class="truncate px-2 py-1 text-[11px] whitespace-nowrap opacity-70">
              {{ commit.date }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
th {
  user-select: none;
}

td {
  height: 24px;
}
</style>
