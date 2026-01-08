<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    orientation?: 'horizontal' | 'vertical';
  }>(),
  {
    orientation: 'horizontal',
  },
);

const emit = defineEmits<{
  (e: 'resize', position: number): void;
}>();

const onMouseDown = (e: MouseEvent) => {
  e.preventDefault();
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);

  document.body.style.cursor = props.orientation === 'horizontal' ? 'col-resize' : 'row-resize';
  document.body.classList.add('resizing-' + props.orientation);
};

const onMouseMove = (e: MouseEvent) => {
  emit('resize', props.orientation === 'horizontal' ? e.clientX : e.clientY);
};

const onMouseUp = () => {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
  document.body.style.cursor = '';
  document.body.classList.remove('resizing-horizontal');
  document.body.classList.remove('resizing-vertical');
};
</script>

<template>
  <div
    :class="[
      'relative z-50 flex-shrink-0 bg-[var(--vscode-panel-border)] transition-colors hover:bg-[var(--vscode-sash-hoverBorder)] active:bg-[var(--vscode-sash-hoverBorder)]',
      orientation === 'horizontal' ? 'w-[1px] cursor-col-resize' : 'h-[1px] w-full cursor-row-resize',
    ]"
    @mousedown="onMouseDown"
  >
    <!-- 扩大点击区域 -->
    <div
      :class="[
        'absolute',
        orientation === 'horizontal'
          ? 'inset-y-0 -right-1 -left-1 cursor-col-resize'
          : 'inset-x-0 -top-1 -bottom-1 cursor-row-resize',
      ]"
    ></div>
  </div>
</template>

<style>
.resizing-horizontal,
.resizing-horizontal * {
  user-select: none !important;
  cursor: col-resize !important;
}

.resizing-vertical,
.resizing-vertical * {
  user-select: none !important;
  cursor: row-resize !important;
}
</style>
