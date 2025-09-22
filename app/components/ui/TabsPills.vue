<script setup lang="ts">
type Tab = { key: string; label: string }
const props = defineProps<{
  modelValue: string
  tabs: Tab[]
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
}>()

function select(v: string) { emit('update:modelValue', v) }
</script>

<template>
  <div class="inline-flex rounded-full bg-neutral-100 p-1">
    <button v-for="t in props.tabs" :key="t.key" @click="select(t.key)" :class="['px-4 h-9 rounded-full text-sm font-medium', props.modelValue===t.key ? 'bg-[#8B1E3F] text-white' : 'text-neutral-600 hover:bg-neutral-200']">{{ t.label }}</button>
  </div>
</template>

<style scoped></style>


