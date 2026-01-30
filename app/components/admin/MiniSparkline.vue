<template>
  <svg
    :width="width"
    :height="height"
    class="overflow-visible"
    preserveAspectRatio="none"
  >
    <polyline
      v-if="points"
      :points="points"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      class="text-blue-400"
    />
  </svg>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    data: number[];
    width?: number;
    height?: number;
  }>(),
  { width: 120, height: 24 }
);

const points = computed(() => {
  const d = props.data;
  if (!d.length) return "";
  const w = props.width;
  const h = props.height;
  const step = w / Math.max(1, d.length - 1);
  return d
    .map((v, i) => {
      const x = i * step;
      const y = h - (v / 100) * (h - 2) - 1;
      return `${x},${y}`;
    })
    .join(" ");
});
</script>
