<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

export interface ContextMenuItem {
  label: string;
  icon?: string;
  danger?: boolean;
  disabled?: boolean;
  separator?: boolean;
}

const props = defineProps<{
  items: ContextMenuItem[];
  visible: boolean;
  x: number;
  y: number;
}>();

const emit = defineEmits<{
  (e: 'select', item: ContextMenuItem): void;
  (e: 'close'): void;
}>();

const menuRef = ref<HTMLElement | null>(null);

// 计算防溢出后的最终坐标
const finalX = computed(() => {
  if (!menuRef.value) return props.x;
  const menuWidth = menuRef.value.offsetWidth || 180;
  const overflow = props.x + menuWidth - window.innerWidth;
  return overflow > 0 ? props.x - menuWidth : props.x;
});

const finalY = computed(() => {
  if (!menuRef.value) return props.y;
  const menuHeight = menuRef.value.offsetHeight || 200;
  const overflow = props.y + menuHeight - window.innerHeight;
  return overflow > 0 ? props.y - menuHeight : props.y;
});

function onClickOutside(e: MouseEvent) {
  if (props.visible && menuRef.value && !menuRef.value.contains(e.target as Node)) {
    emit('close');
  }
}

function onKeydown(e: KeyboardEvent) {
  if (props.visible && e.key === 'Escape') {
    emit('close');
  }
}

function handleSelect(item: ContextMenuItem) {
  if (item.disabled || item.separator) return;
  emit('select', item);
  emit('close');
}

// 显示时注册全局事件，隐藏时注销
watch(
  () => props.visible,
  (val) => {
    if (val) {
      document.addEventListener('mousedown', onClickOutside, true);
      document.addEventListener('keydown', onKeydown, true);
    } else {
      document.removeEventListener('mousedown', onClickOutside, true);
      document.removeEventListener('keydown', onKeydown, true);
    }
  },
);

onUnmounted(() => {
  document.removeEventListener('mousedown', onClickOutside, true);
  document.removeEventListener('keydown', onKeydown, true);
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="menuRef"
      class="context-menu"
      :style="{ left: finalX + 'px', top: finalY + 'px' }"
      role="menu"
    >
      <template v-for="(item, index) in items" :key="index">
        <div v-if="item.separator" class="context-menu-separator" />
        <button
          v-else
          class="context-menu-item"
          :class="{
            'context-menu-item--danger': item.danger,
            'context-menu-item--disabled': item.disabled,
          }"
          :disabled="item.disabled"
          role="menuitem"
          @click.stop="handleSelect(item)"
        >
          <span v-if="item.icon" class="context-menu-item__icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </button>
      </template>
    </div>
  </Teleport>
</template>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 9999;
  min-width: 160px;
  padding: 4px 0;
  background: var(--vscode-menu-background);
  color: var(--vscode-menu-foreground);
  border: 1px solid var(--vscode-menu-border, var(--vscode-panel-border));
  border-radius: 4px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  outline: none;
  user-select: none;
}

.context-menu-separator {
  height: 1px;
  margin: 4px 0;
  background: var(--vscode-menu-separatorBackground, var(--vscode-panel-border));
}

.context-menu-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 4px 12px;
  gap: 8px;
  font-size: 13px;
  line-height: 1.5;
  text-align: left;
  background: transparent;
  border: none;
  color: var(--vscode-menu-foreground);
  cursor: pointer;
  white-space: nowrap;
}

.context-menu-item:hover:not(.context-menu-item--disabled) {
  background: var(--vscode-menu-selectionBackground);
  color: var(--vscode-menu-selectionForeground, var(--vscode-menu-foreground));
}

.context-menu-item--danger {
  color: var(--vscode-errorForeground, #f48771);
}

.context-menu-item--danger:hover:not(.context-menu-item--disabled) {
  background: var(--vscode-inputValidation-errorBackground, rgba(244, 135, 113, 0.15));
  color: var(--vscode-errorForeground, #f48771);
}

.context-menu-item--disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.context-menu-item__icon {
  width: 16px;
  text-align: center;
  flex-shrink: 0;
}
</style>
