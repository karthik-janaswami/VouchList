<template>
  <div class="review">
    <div class="review-header">
      <div class="reviewer-info">
        <span class="avatar">{{ review.username[0].toUpperCase() }}</span>
        <div>
          <strong class="username">{{ review.username }}</strong>
          <span class="date">{{ formattedDate }}</span>
        </div>
      </div>
      <button v-if="isOwn" class="del-btn" @click="$emit('delete', review.id)">Delete</button>
    </div>

    <div class="rating-scores">
      <span class="rscore price">💰 Price <b>{{ review.price_rating || review.rating }}/5</b></span>
      <span class="rscore quality">✨ Quality <b>{{ review.quality_rating || review.rating }}/5</b></span>
    </div>

    <p v-if="review.comment" class="comment">{{ review.comment }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth.js'

const props = defineProps({ review: Object })
defineEmits(['delete'])

const auth = useAuthStore()
const isOwn = computed(() => auth.user?.id === props.review.user_id)
const formattedDate = computed(() =>
  new Date(props.review.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
)
</script>

<style scoped>
.review {
  padding: 16px 0;
  border-bottom: 1px solid var(--line-soft);
}
.review:last-child { border-bottom: none; }

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.reviewer-info { display: flex; align-items: center; gap: 10px; }
.avatar {
  width: 32px; height: 32px;
  border-radius: 50%;
  background: var(--accent-wash);
  color: var(--accent-ink);
  font-size: 13px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.username { display: block; font-size: 13px; font-weight: 600; color: var(--ink); }
.date { font-size: 11px; color: var(--ink-faint); }

.del-btn {
  font-size: 11px;
  font-weight: 600;
  background: none;
  border: 1px solid var(--line);
  border-radius: 100px;
  padding: 3px 10px;
  color: var(--danger);
  cursor: pointer;
  transition: all .15s var(--ease);
  min-height: unset;
}
.del-btn:hover { background: var(--danger); color: #fff; border-color: var(--danger); }

.rating-scores { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
.rscore {
  font-size: 11px;
  font-weight: 600;
  color: var(--ink-soft);
  background: var(--surface-2);
  padding: 3px 10px;
  border-radius: 100px;
}
.rscore b { color: var(--ink); margin-left: 4px; }

.comment {
  font-style: italic;
  font-size: 14px;
  color: var(--ink);
  line-height: 1.55;
  border-left: 2px solid var(--line);
  padding-left: 12px;
  margin: 0;
}
</style>
