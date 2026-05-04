<script lang="ts" setup>
import { ref } from 'vue';
import XIcon from '../public/XIcon.vue';
import type { LogFilters } from '../../composables/useGitStore.ts';

const props = defineProps<{
  isFetching?: boolean;
  authors?: string[];
}>();

const emit = defineEmits<{
  (e: 'refresh'): void;
  (e: 'fetch'): void;
  (e: 'filter', filters: Partial<LogFilters>): void;
}>();

const search = ref('');
const selectedAuthor = ref('');
const since = ref('');
const until = ref('');
const authorDropdownOpen = ref(false);

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function onSearchInput(value: string) {
  search.value = value;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => emit('filter', { search: value }), 300);
}

function selectAuthor(author: string) {
  selectedAuthor.value = author;
  authorDropdownOpen.value = false;
  emit('filter', { author });
}

function onSinceChange(value: string) {
  since.value = value;
  emit('filter', { since: value });
}

function onUntilChange(value: string) {
  until.value = value;
  emit('filter', { until: value });
}

function closeAuthorDropdown() {
  authorDropdownOpen.value = false;
}
</script>

<template>
  <div class="flex flex-1 items-center space-x-2 px-2">
    <!-- Search -->
    <div class="relative max-w-64 min-w-40 flex-1 py-1">
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

    <!-- Filters row -->
    <div class="flex flex-1 items-center space-x-2 overflow-hidden">
      <!-- Author dropdown -->
      <div class="relative flex shrink-0 items-center space-x-1">
        <span class="text-xs opacity-60">User:</span>
        <button
          class="max-w-28 truncate rounded px-1 text-xs hover:bg-(--vscode-toolbar-hoverBackground)"
          :class="selectedAuthor ? 'text-(--vscode-foreground)' : 'opacity-70'"
          @click.stop="authorDropdownOpen = !authorDropdownOpen"
        >
          {{ selectedAuthor || 'All' }}
        </button>
        <!-- Author dropdown list -->
        <div
          v-if="authorDropdownOpen"
          class="author-dropdown"
          @click.stop
        >
          <button
            class="author-dropdown-item"
            :class="selectedAuthor === '' ? 'author-dropdown-item--active' : ''"
            @click="selectAuthor('')"
          >
            All
          </button>
          <button
            v-for="author in authors"
            :key="author"
            class="author-dropdown-item"
            :class="selectedAuthor === author ? 'author-dropdown-item--active' : ''"
            @click="selectAuthor(author)"
          >
            {{ author }}
          </button>
        </div>
        <!-- Click outside to close -->
        <div v-if="authorDropdownOpen" class="fixed inset-0 z-40" @click="closeAuthorDropdown" />
      </div>

      <!-- Date filters -->
      <div class="flex shrink-0 items-center space-x-1">
        <span class="text-xs opacity-60">Since:</span>
        <input
          type="date"
          class="vscode-input h-5 rounded px-1 text-xs"
          :value="since"
          @change="onSinceChange(($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="flex shrink-0 items-center space-x-1">
        <span class="text-xs opacity-60">Until:</span>
        <input
          type="date"
          class="vscode-input h-5 rounded px-1 text-xs"
          :value="until"
          @change="onUntilChange(($event.target as HTMLInputElement).value)"
        />
      </div>
    </div>

    <!-- Action buttons -->
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

<style scoped>
.author-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 50;
  min-width: 160px;
  max-height: 240px;
  overflow-y: auto;
  padding: 4px 0;
  background: var(--vscode-menu-background);
  color: var(--vscode-menu-foreground);
  border: 1px solid var(--vscode-menu-border, var(--vscode-panel-border));
  border-radius: 4px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.author-dropdown-item {
  display: block;
  width: 100%;
  padding: 4px 12px;
  font-size: 12px;
  text-align: left;
  background: transparent;
  border: none;
  color: var(--vscode-menu-foreground);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.author-dropdown-item:hover {
  background: var(--vscode-menu-selectionBackground);
  color: var(--vscode-menu-selectionForeground, var(--vscode-menu-foreground));
}

.author-dropdown-item--active {
  background: var(--vscode-list-activeSelectionBackground);
  color: var(--vscode-list-activeSelectionForeground, var(--vscode-menu-foreground));
}
</style>
