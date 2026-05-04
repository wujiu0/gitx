<script lang="ts" setup>
import { computed, ref } from 'vue';
import type { Branch, Stash, Tag } from '../../types.ts';
import XIcon from '../public/XIcon.vue';
import ContextMenu from '../public/ContextMenu.vue';
import type { ContextMenuItem } from '../public/ContextMenu.vue';

defineProps<{
  branches: Branch[];
  tags: Tag[];
  stashes: Stash[];
}>();

const emit = defineEmits<{
  (e: 'checkout', name: string): void;
  (e: 'deleteBranch', name: string): void;
  (e: 'createBranch', name: string, from?: string): void;
  (e: 'mergeBranch', name: string): void;
  (e: 'pushBranch', name: string): void;
  (e: 'renameBranch', oldName: string, newName: string): void;
}>();

const localOpen = ref(true);
const remoteOpen = ref(true);
const tagsOpen = ref(false);
const stashesOpen = ref(false);

// Context menu state
const contextMenuVisible = ref(false);
const contextMenuX = ref(0);
const contextMenuY = ref(0);
const contextMenuBranch = ref<Branch | null>(null);

const contextMenuItems = computed<ContextMenuItem[]>(() => {
  const branch = contextMenuBranch.value;
  if (!branch) return [];

  const items: ContextMenuItem[] = [];

  if (!branch.current) {
    items.push({ label: 'Checkout' });
    items.push({ separator: true, label: '' });
  }

  items.push({ label: 'Rename...' });

  if (!branch.current) {
    items.push({ label: 'Delete...', danger: true });
  }

  items.push({ separator: true, label: '' });
  items.push({ label: 'Push' });

  if (!branch.current) {
    items.push({ label: 'Merge into Current' });
  }

  return items;
});

function onBranchContextMenu(event: MouseEvent, branch: Branch) {
  contextMenuBranch.value = branch;
  contextMenuX.value = event.clientX;
  contextMenuY.value = event.clientY;
  contextMenuVisible.value = true;
}

function onContextMenuSelect(item: ContextMenuItem) {
  const branch = contextMenuBranch.value;
  if (!branch) return;

  switch (item.label) {
    case 'Checkout':
      emit('checkout', branch.name);
      break;
    case 'Rename...': {
      const newName = prompt(`Rename branch "${branch.name}" to:`);
      if (newName && newName.trim()) {
        emit('renameBranch', branch.name, newName.trim());
      }
      break;
    }
    case 'Delete...':
      emit('deleteBranch', branch.name);
      break;
    case 'Push':
      emit('pushBranch', branch.name);
      break;
    case 'Merge into Current':
      emit('mergeBranch', branch.name);
      break;
  }
}
</script>

<template>
  <div class="flex h-full flex-col bg-(--vscode-sideBar-background)">
    <div class="flex-1 overflow-y-auto py-2">
      <!-- Local Branches -->
      <button
        class="vscode-section-header w-full cursor-pointer border-none bg-transparent py-1 opacity-70"
        @click="localOpen = !localOpen"
      >
        <div class="flex items-center">
          <svg class="mr-1 h-3 w-3 fill-current transition-transform" :class="localOpen ? 'rotate-90' : ''" viewBox="0 0 16 16">
            <path d="M6 13L1 8l5-5v10z" />
          </svg>
          Local
        </div>
      </button>
      <template v-if="localOpen">
        <div
          v-for="branch in branches.filter((b) => b.type === 'local')"
          :key="branch.name"
          @click="emit('checkout', branch.name)"
          @contextmenu.prevent="onBranchContextMenu($event, branch)"
          :class="['vscode-list-item space-x-2', branch.current ? 'vscode-list-item-active' : '']"
        >
          <div class="flex h-3 w-3 shrink-0 items-center justify-center">
            <div v-if="branch.current" class="h-2 w-2 rounded-full bg-blue-400"></div>
            <XIcon v-else name="file" size="12" class="opacity-40 group-hover:opacity-100" />
          </div>
          <span :class="['flex-1 truncate', branch.current ? 'font-bold' : '']">{{ branch.name }}</span>
          <div v-if="branch.ahead || branch.behind" class="flex shrink-0 items-center gap-0.5 font-mono text-[9px] opacity-60">
            <span v-if="branch.ahead" class="inline-flex items-center gap-0.5 text-green-400">
              <XIcon name="push" size="9" />{{ branch.ahead }}
            </span>
            <span v-if="branch.behind" class="inline-flex items-center gap-0.5 text-red-400">
              <XIcon name="fetch" size="9" />{{ branch.behind }}
            </span>
          </div>
        </div>
      </template>

      <!-- Remote Branches -->
      <button
        class="vscode-section-header mt-2 w-full cursor-pointer border-none bg-transparent py-1 opacity-70"
        @click="remoteOpen = !remoteOpen"
      >
        <div class="flex items-center">
          <svg class="mr-1 h-3 w-3 fill-current transition-transform" :class="remoteOpen ? 'rotate-90' : ''" viewBox="0 0 16 16">
            <path d="M6 13L1 8l5-5v10z" />
          </svg>
          Remote
        </div>
      </button>
      <template v-if="remoteOpen">
        <div
          v-for="branch in branches.filter((b) => b.type === 'remote')"
          :key="branch.name"
          class="vscode-list-item space-x-2 text-(--vscode-descriptionForeground) hover:text-(--vscode-foreground)"
        >
          <div class="flex h-3 w-3 shrink-0 items-center justify-center">
            <XIcon name="file" size="12" class="opacity-40 group-hover:opacity-80" />
          </div>
          <span class="flex-1 truncate">{{ branch.name }}</span>
        </div>
      </template>

      <!-- Tags -->
      <button
        v-if="tags.length > 0"
        class="vscode-section-header mt-2 w-full cursor-pointer border-none bg-transparent py-1 opacity-70"
        @click="tagsOpen = !tagsOpen"
      >
        <div class="flex items-center">
          <svg class="mr-1 h-3 w-3 fill-current transition-transform" :class="tagsOpen ? 'rotate-90' : ''" viewBox="0 0 16 16">
            <path d="M6 13L1 8l5-5v10z" />
          </svg>
          Tags
          <span class="ml-1 rounded bg-(--vscode-badge-background) px-1 text-[9px]">{{ tags.length }}</span>
        </div>
      </button>
      <template v-if="tagsOpen">
        <div v-for="tag in tags" :key="tag.name" class="vscode-list-item space-x-2 opacity-80">
          <XIcon name="tag" size="12" class="opacity-40" />
          <span class="flex-1 truncate font-mono text-[11px]">{{ tag.name }}</span>
        </div>
      </template>

      <!-- Stashes -->
      <button
        v-if="stashes.length > 0"
        class="vscode-section-header mt-2 w-full cursor-pointer border-none bg-transparent py-1 opacity-70"
        @click="stashesOpen = !stashesOpen"
      >
        <div class="flex items-center">
          <svg class="mr-1 h-3 w-3 fill-current transition-transform" :class="stashesOpen ? 'rotate-90' : ''" viewBox="0 0 16 16">
            <path d="M6 13L1 8l5-5v10z" />
          </svg>
          Stashes
          <span class="ml-1 rounded bg-(--vscode-badge-background) px-1 text-[9px]">{{ stashes.length }}</span>
        </div>
      </button>
      <template v-if="stashesOpen">
        <div v-for="stash in stashes" :key="stash.index" class="vscode-list-item space-x-2 opacity-80">
          <XIcon name="stash" size="12" class="opacity-40" />
          <span class="flex-1 truncate text-xs">{{ stash.message }}</span>
        </div>
      </template>
    </div>

    <!-- Context Menu -->
    <ContextMenu
      :items="contextMenuItems"
      :visible="contextMenuVisible"
      :x="contextMenuX"
      :y="contextMenuY"
      @select="onContextMenuSelect"
      @close="contextMenuVisible = false"
    />
  </div>
</template>
