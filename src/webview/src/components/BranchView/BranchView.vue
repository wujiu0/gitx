<script lang="ts" setup>
import type { Branch } from '../../types.ts';
import XIcon from '../public/XIcon.vue';

defineProps<{
  branches: Branch[];
}>();

const emit = defineEmits<{
  (e: 'selectBranch', branch: Branch): void;
}>();
</script>

<template>
  <div class="flex h-full flex-col bg-(--vscode-sideBar-background)">
    <div class="flex-1 overflow-y-auto py-2">
      <!-- Local Branches -->
      <div class="vscode-section-header cursor-pointer border-none bg-transparent py-1 opacity-70">
        <div class="flex items-center">
          <svg class="mr-1 h-3 w-3 rotate-90 fill-current" viewBox="0 0 16 16">
            <path d="M6 13L1 8l5-5v10z" />
          </svg>
          Local
        </div>
      </div>
      <div
        v-for="branch in branches.filter((b) => b.type === 'local')"
        :key="branch.name"
        @click="emit('selectBranch', branch)"
        :class="['vscode-list-item space-x-2', branch.current ? 'vscode-list-item-active' : '']"
      >
        <div class="flex h-3 w-3 shrink-0 items-center justify-center">
          <div v-if="branch.current" class="h-2 w-2 rounded-full bg-blue-400"></div>
          <XIcon v-else name="file" size="12" class="opacity-40 group-hover:opacity-100" />
        </div>
        <span :class="['truncate', branch.current ? 'font-bold' : '']">{{ branch.name }}</span>
      </div>

      <!-- Remote Branches -->
      <div class="vscode-section-header mt-4 cursor-pointer border-none bg-transparent py-1 opacity-70">
        <div class="flex items-center">
          <svg class="mr-1 h-3 w-3 rotate-90 fill-current" viewBox="0 0 16 16">
            <path d="M6 13L1 8l5-5v10z" />
          </svg>
          Remote
        </div>
      </div>
      <div
        v-for="branch in branches.filter((b) => b.type === 'remote')"
        :key="branch.name"
        @click="emit('selectBranch', branch)"
        class="vscode-list-item space-x-2 text-(--vscode-descriptionForeground) hover:text-(--vscode-foreground)"
      >
        <div class="flex h-3 w-3 shrink-0 items-center justify-center">
          <XIcon name="file" size="12" class="opacity-40 group-hover:opacity-80" />
        </div>
        <span class="truncate">{{ branch.name }}</span>
      </div>
    </div>
  </div>
</template>
