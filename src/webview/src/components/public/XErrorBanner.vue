<script lang="ts" setup>
defineProps<{ message: string }>();
const emit = defineEmits<{ (e: 'dismiss'): void }>();
</script>

<template>
  <div
    class="flex shrink-0 items-center gap-2 border-b border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-400"
  >
    <span class="flex-1 truncate">{{ message }}</span>
    <button class="vscode-btn-icon shrink-0" @click="emit('dismiss')">✕</button>
  </div>
</template>
