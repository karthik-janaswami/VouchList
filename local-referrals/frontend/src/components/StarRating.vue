<template>
  <span class="stars" :title="`${rating} / 5`">
    <span v-for="n in 5" :key="n" class="star" :class="starClass(n)">★</span>
    <span v-if="showCount && count !== undefined" class="count">({{ count }})</span>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  rating: { type: Number, default: 0 },
  count: { type: Number },
  showCount: { type: Boolean, default: false }
})

function starClass(n) {
  if (n <= Math.floor(props.rating)) return 'full'
  if (n === Math.ceil(props.rating) && props.rating % 1 >= 0.3) return 'half'
  return 'empty'
}
</script>

<style scoped>
.stars { display: inline-flex; align-items: center; gap: 1px; }
.star { font-size: inherit; }
.star.full  { color: #f59e0b; }
.star.half  { color: #f59e0b; opacity: 0.5; }
.star.empty { color: #d1d5db; }
.count { color: var(--gray-400); font-size: 0.82em; margin-left: 4px; }
</style>
