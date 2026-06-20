<template>
  <div class="sort" role="group" aria-label="Sort" style="margin-left:auto">
    <button :class="{ on: modelValue === 'pick' }" @click="$emit('update:modelValue', 'pick')">Top rated</button>
    <button :class="{ on: modelValue === 'az' }" @click="$emit('update:modelValue', 'az')">A–Z</button>
  </div>
</template>

<script setup>
defineProps({ modelValue: String })
defineEmits(['update:modelValue'])
</script>

<style scoped>
.sort {
  display: inline-flex;
  background: var(--surface-2);
  border-radius: 100px;
  padding: 3px;
  gap: 2px;
}
.sort button {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--ink-soft);
  padding: 5px 12px;
  border-radius: 100px;
  transition: all .15s var(--ease);
  min-height: unset;
}
.sort button.on {
  background: var(--surface);
  color: var(--ink);
  box-shadow: 0 1px 2px #0000000f;
}
</style>
