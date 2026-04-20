<script lang="ts" setup>
import { ref } from 'vue';
import XIcon from '../public/XIcon.vue';
import type { LogFilters } from '../../composables/useGitStore.ts';

defineProps<{
  isFetching?: boolean;
}>();

const emit = defineEmits<{
  (e: 'refresh'): void;
  (e: 'fetch'): void;
  (e: 'filter', filters: Partial<LogFilters>): void;
}>();

const search = ref('');
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function onSearchInput(value: string) {
  search.value = value;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => emit('filter', { search: value }), 300);
}
</script>

<template>
  <div class="flex flex-1 items-center space-x-4 px-2">
    <div class="relative max-w-64 min-w-50 flex-1 py-1">
      <input
        type="text"
        placeholder="Message or hash"
        class="vscode-input w-full pl-7"
        :value="search"
        @input="onSearchInput(($event.target as HTMLInputElement).value)"
      />
      <div class="absolute top-1/2 left-2 -translate-y-1/2 opacity-50">
        <XIcon name="search" size="14" />
      </div>
    </div>
    <div class="flex flex-1 items-center space-x-3 overflow-hidden">
      <div class="flex shrink-0 items-center space-x-1">
        <span class="text-xs opacity-60">Branch:</span>
        <span class="max-w-25 cursor-pointer truncate rounded px-1 text-xs hover:bg-(--vscode-toolbar-hoverBackground)">
          All
        </span>
      </div>
      <div class="flex shrink-0 items-center space-x-1">
        <span class="text-xs opacity-60">User:</span>
        <span class="max-w-25 cursor-pointer truncate rounded px-1 text-xs hover:bg-(--vscode-toolbar-hoverBackground)">
          All
        </span>
      </div>
    </div>

    <div class="flex shrink-0 items-center space-x-1">
      <button class="vscode-btn-icon" title="Fetch all" :class="{ 'opacity-50': isFetching }" :disabled="isFetching" @click="emit('fetch')">
        <XIcon name="refresh" size="16" />
      </button>
      <button class="vscode-btn-icon" title="Refresh" @click="emit('refresh')">
        <XIcon name="refresh" size="16" />
      </button>
    </div>
  </div>
</template>
