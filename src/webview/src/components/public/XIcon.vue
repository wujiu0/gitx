<script lang="ts" setup>
const props = defineProps<{
  name: 'diff' | 'expand' | 'settings' | 'refresh' | 'search' | 'file' | 'check' | 'close';
  size?: number | string;
}>();

const iconSize = props.size || 16;
</script>

<template>
  <svg :width="iconSize" :height="iconSize" viewBox="0 0 16 16" fill="currentColor" class="shrink-0">
    <path v-if="name === 'diff'" d="M5 3h6v2H5V3zm0 4h6v2H5V7zm0 4h6v2H5v-2zM4 2v12h8V2H4zM3 1h10v14H3V1z" />
    <path
      v-if="name === 'expand'"
      d="M1 8l7-7 7 7-1.41 1.41L8 3.83 2.41 9.41 1 8zM1 12l7-7 7 7-1.41 1.41L8 7.83 2.41 13.41 1 12z"
    />
    <path
      v-if="name === 'settings'"
      d="M9.1 4.4L8 3.2l-1.1 1.2L6 3.2 4.9 4.4 4 3.2l-1.1 1.2L2 3.2V14h12V3.2l-1.1 1.2-1.1-1.2-1.1 1.2-1.1-1.2-1.1 1.2zM13 13H3V5.5l.9.9 1.1-1.2 1.1 1.2 1.1-1.2 1.1 1.2 1.1-1.2 1.1 1.2.9-.9V13z"
    />
    <path
      v-if="name === 'refresh'"
      d="M13.6 2.3C12.2.9 10.2 0 8 0 3.6 0 0 3.6 0 8s3.6 8 8 8c3.7 0 6.8-2.5 7.7-6h-2.1c-.8 2.3-3 4-5.6 4-3.3 0-6-2.7-6-6s2.7-6 6-6c1.7 0 3.1.7 4.2 1.8L10 6h6V0l-2.4 2.3z"
    />
    <path
      v-if="name === 'search'"
      d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"
    />
    <path
      v-if="name === 'file'"
      d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0z M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2zm10-1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1z"
    />
    <path
      v-if="name === 'check'"
      d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"
    />
    <path
      v-if="name === 'close'"
      d="M1.293 1.293a1 1 0 0 1 1.414 0L8 6.586l5.293-5.293a1 1 0 1 1 1.414 1.414L9.414 8l5.293 5.293a1 1 0 0 1-1.414 1.414L8 9.414l-5.293 5.293a1 1 0 0 1-1.414-1.414L6.586 8 1.293 2.707a1 1 0 0 1 0-1.414z"
    />
  </svg>
</template>
