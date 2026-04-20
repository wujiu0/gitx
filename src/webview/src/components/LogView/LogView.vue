<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import type { Commit } from '../../types.ts';
import { computeGraphLayout } from '../../utils/graphLayout.ts';

const ROW_HEIGHT = 24;
const OVERSCAN = 10;

const props = defineProps<{
  commits: Commit[];
  selectedCommitHash?: string;
  isLoading?: boolean;
  hasMore?: boolean;
}>();

const emit = defineEmits<{
  (e: 'selectCommit', commit: Commit): void;
  (e: 'loadMore'): void;
}>();

const containerRef = ref<HTMLElement | null>(null);
const scrollTop = ref(0);
const viewportHeight = ref(400);

const graphNodes = computed(() => computeGraphLayout(props.commits));

const maxColumn = computed(() => {
  let max = 0;
  for (const n of graphNodes.value) {
    const cols = [n.column, ...n.passThrough, ...n.edges.map((e) => Math.max(e.fromCol, e.toCol))];
    max = Math.max(max, ...cols);
  }
  return max;
});

const graphWidth = computed(() => (maxColumn.value + 1) * 16 + 8);

const totalHeight = computed(() => props.commits.length * ROW_HEIGHT);

const visibleRange = computed(() => {
  const start = Math.max(0, Math.floor(scrollTop.value / ROW_HEIGHT) - OVERSCAN);
  const end = Math.min(
    props.commits.length,
    Math.ceil((scrollTop.value + viewportHeight.value) / ROW_HEIGHT) + OVERSCAN,
  );
  return { start, end };
});

const visibleCommits = computed(() =>
  props.commits.slice(visibleRange.value.start, visibleRange.value.end).map((c, i) => ({
    commit: c,
    graph: graphNodes.value[visibleRange.value.start + i]!,
    index: visibleRange.value.start + i,
  })),
);

const translateY = computed(() => visibleRange.value.start * ROW_HEIGHT);

function onScroll(e: Event) {
  const el = e.target as HTMLElement;
  scrollTop.value = el.scrollTop;

  // Trigger loadMore when within 2 viewports of the bottom
  if (props.hasMore && el.scrollTop + el.clientHeight >= el.scrollHeight - viewportHeight.value * 2) {
    emit('loadMore');
  }
}

function svgPath(fromCol: number, toCol: number, rowHeight: number): string {
  const fx = fromCol * 16 + 8;
  const tx = toCol * 16 + 8;
  if (fx === tx) return `M ${fx} 0 L ${tx} ${rowHeight}`;
  const mid = rowHeight / 2;
  return `M ${fx} 0 Q ${fx} ${mid} ${(fx + tx) / 2} ${mid} Q ${tx} ${mid} ${tx} ${rowHeight}`;
}

let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  if (containerRef.value) {
    viewportHeight.value = containerRef.value.clientHeight;
    resizeObserver = new ResizeObserver(() => {
      if (containerRef.value) viewportHeight.value = containerRef.value.clientHeight;
    });
    resizeObserver.observe(containerRef.value);
  }
});

onUnmounted(() => resizeObserver?.disconnect());
</script>

<template>
  <div class="flex flex-1 flex-col overflow-hidden bg-(--vscode-editor-background)">
    <!-- Skeleton loading -->
    <div v-if="isLoading && commits.length === 0" class="flex flex-col">
      <div v-for="i in 20" :key="i" class="flex items-center border-b border-(--vscode-panel-border)/20 px-2" style="height: 24px">
        <div class="mr-2 h-2 w-2 rounded-full bg-(--vscode-panel-border) opacity-30"></div>
        <div class="h-2 rounded bg-(--vscode-panel-border) opacity-20" :style="{ width: (60 + (i * 37) % 120) + 'px' }"></div>
      </div>
    </div>

    <!-- Virtual scroll container -->
    <div v-else ref="containerRef" class="flex-1 overflow-auto" @scroll="onScroll">
      <div :style="{ height: totalHeight + 'px', position: 'relative' }">
        <table
          class="w-full table-fixed border-collapse text-left"
          :style="{ transform: `translateY(${translateY}px)`, position: 'absolute', top: 0, left: 0, right: 0 }"
        >
          <tbody>
            <tr
              v-for="{ commit, graph, index } in visibleCommits"
              :key="commit.hash"
              @click="emit('selectCommit', commit)"
              :class="[
                'group vscode-list-item border-b border-(--vscode-panel-border)/30',
                selectedCommitHash === commit.hash ? 'vscode-list-item-active' : '',
              ]"
            >
              <!-- Graph column -->
              <td
                class="shrink-0 border-r border-(--vscode-panel-border)/30 p-0"
                :style="{ width: graphWidth + 'px', minWidth: graphWidth + 'px' }"
              >
                <svg :width="graphWidth" :height="ROW_HEIGHT" style="display: block; overflow: visible">
                  <!-- Pass-through lanes -->
                  <line
                    v-for="col in graph.passThrough"
                    :key="'pt-' + col"
                    :x1="col * 16 + 8"
                    :y1="0"
                    :x2="col * 16 + 8"
                    :y2="ROW_HEIGHT"
                    :stroke="'#4fc1ff'"
                    stroke-width="1.5"
                    stroke-opacity="0.4"
                  />
                  <!-- Edges to parent commits -->
                  <path
                    v-for="(edge, ei) in graph.edges"
                    :key="'edge-' + ei"
                    :d="svgPath(edge.fromCol, edge.toCol, ROW_HEIGHT)"
                    :stroke="graph.color"
                    stroke-width="1.5"
                    fill="none"
                    stroke-opacity="0.8"
                  />
                  <!-- Commit dot -->
                  <circle
                    :cx="graph.column * 16 + 8"
                    :cy="ROW_HEIGHT / 2"
                    r="4"
                    :fill="graph.color"
                    stroke="var(--vscode-editor-background)"
                    stroke-width="1.5"
                  />
                </svg>
              </td>
              <!-- Message -->
              <td class="truncate border-r border-(--vscode-panel-border)/30 px-2 py-1 text-xs">
                <span class="font-medium">{{ commit.message }}</span>
                <!-- Refs (branch/tag labels) -->
                <template v-if="commit.refs">
                  <span
                    v-for="ref in commit.refs.split(',').map(r => r.trim()).filter(Boolean)"
                    :key="ref"
                    :class="[
                      'ml-1 inline-block rounded px-1 font-mono text-[9px]',
                      ref.startsWith('HEAD') ? 'bg-yellow-500/20 text-yellow-300' :
                      ref.startsWith('tag:') ? 'bg-purple-500/20 text-purple-300' :
                      'bg-blue-500/20 text-blue-300'
                    ]"
                  >{{ ref }}</span>
                </template>
              </td>
              <!-- Author -->
              <td class="w-32 truncate border-r border-(--vscode-panel-border)/30 px-2 py-1 text-xs whitespace-nowrap opacity-90">
                {{ commit.author }}
              </td>
              <!-- Date -->
              <td class="w-32 truncate px-2 py-1 text-[11px] whitespace-nowrap opacity-70">
                {{ commit.date }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Load more indicator -->
      <div v-if="isLoading && commits.length > 0" class="flex items-center justify-center py-2 text-xs opacity-40">
        Loading more...
      </div>
    </div>
  </div>
</template>

<style scoped>
td {
  height: 24px;
}
</style>
