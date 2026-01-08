<script setup lang="ts"></script>

<template>
  <div class="flex h-full flex-col overflow-hidden">
    <div
      v-if="$slots.header"
      class="flex h-9 shrink-0 items-center border-b border-(--vscode-panel-border) bg-(--vscode-panel-background)"
    >
      <slot name="header" />
    </div>
    <div class="min-h-0 flex-1 overflow-hidden">
      <slot />
    </div>
  </div>
</template>

<style scoped></style>
