<template>
  <article class="card">
    <div class="card-top">
      <RouterLink :to="`/referrals/${referral.id}`" class="card-name">{{ referral.name }}</RouterLink>
      <span v-if="referral.avg_rating >= 4" class="top-pick">★ Top pick</span>
    </div>

    <div class="rating-row">
      <span class="stars-wrap">
        <span
          v-for="n in 5" :key="n"
          class="star-ch"
          :class="{ filled: referral.review_count > 0 && n <= Math.round(referral.avg_rating) }"
        >★</span>
        <span v-if="referral.review_count > 0" class="rating-num">{{ referral.avg_rating }}</span>
        <span v-if="referral.review_count > 0" class="review-cnt">({{ referral.review_count }})</span>
      </span>
      <span class="price-ind">
        <span
          v-for="n in 4" :key="n"
          :class="{ dim: !referral.avg_price_rating || n > Math.round(referral.avg_price_rating / 5 * 4) }"
        >$</span>
      </span>
    </div>

    <button class="tag" @click.stop="$emit('tag-click', referral.category)">
      {{ referral.category }}
    </button>

    <p v-if="referral.description" class="note">{{ referral.description }}</p>
    <p v-else class="note empty">No description on file — a known-good name from the list.</p>

    <div class="contact-row">
      <span v-if="referral.referred_by" class="referred-by">
        Ask for <b>{{ referral.referred_by }}</b>
      </span>
      <a
        v-if="referral.phone"
        :href="`tel:${referral.phone.replace(/[^0-9+]/g,'')}`"
        class="phone-btn"
        @click.stop
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>
        </svg>
        {{ referral.phone }}
      </a>
    </div>
  </article>
</template>

<script setup>
defineProps({ referral: Object })
defineEmits(['tag-click'])
</script>

<style scoped>
.card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 22px 22px 18px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
  transition: border-color .2s var(--ease), transform .2s var(--ease), box-shadow .2s var(--ease);
  animation: rise .35s var(--ease) both;
}
.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,.12);
}
.card-top { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; }
.card-name {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: var(--ink);
  text-decoration: none;
  flex: 1;
}
.card-name:hover { color: var(--accent); }
.top-pick {
  flex: none;
  font-size: 11.5px;
  font-weight: 700;
  color: var(--accent);
  background: var(--accent-wash);
  border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
  border-radius: 100px;
  padding: 4px 12px;
  white-space: nowrap;
  margin-top: 3px;
}

.rating-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 8px;
}
.stars-wrap { display: flex; align-items: center; gap: 2px; }
.star-ch { font-size: 16px; color: var(--line); }
.star-ch.filled { color: var(--gold); }
.rating-num { font-size: 14px; font-weight: 700; color: var(--ink); margin-left: 6px; }
.review-cnt { font-size: 13px; color: var(--ink-faint); margin-left: 2px; }
.price-ind { font-size: 14px; font-weight: 700; color: var(--ink); letter-spacing: -0.02em; }
.price-ind span.dim { color: var(--line); }

.tag {
  align-self: flex-start;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--accent-ink);
  background: var(--accent-wash);
  padding: 3px 8px;
  border-radius: 6px;
  margin: 6px 0 12px;
  border: none;
  cursor: pointer;
  transition: all .15s var(--ease);
  min-height: unset;
}
.tag:hover { background: var(--accent); color: #fff; }

.note {
  font-style: italic;
  font-size: 15px;
  line-height: 1.5;
  color: var(--ink);
  border-left: 3px solid var(--accent);
  padding-left: 14px;
  margin: 0 0 18px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.note.empty { font-style: normal; color: var(--ink-faint); border-left-color: var(--line); }

.contact-row {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  border-top: 1px solid var(--line-soft);
  padding-top: 13px;
  flex-wrap: wrap;
}
.referred-by { font-size: 14px; color: var(--ink-soft); }
.referred-by b { color: var(--ink); font-weight: 700; }
.rating-info.faint { font-size: 13px; color: var(--ink-faint); }

.phone-btn {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--ink);
  text-decoration: none;
  border: 1px solid var(--line);
  border-radius: 100px;
  padding: 9px 16px;
  transition: all .15s var(--ease);
  white-space: nowrap;
}
.phone-btn:hover { background: var(--accent); color: #fff; border-color: var(--accent); }

@media (max-width: 480px) {
  .contact-row { flex-wrap: wrap; gap: 8px 10px; }
  .phone-btn { margin-left: 0; width: 100%; justify-content: center; }
}
</style>
