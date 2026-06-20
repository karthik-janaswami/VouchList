<template>
  <div class="shell">
    <button class="back" @click="$router.back()">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
        <path d="M19 12H5M11 6l-6 6 6 6"/>
      </svg>
      Back
    </button>

    <div v-if="loading" class="state-msg">Loading…</div>
    <div v-else-if="!referral" class="state-msg">Referral not found.</div>
    <template v-else>

      <!-- Detail card -->
      <div class="detail-card">
        <div class="detail-top">
          <span class="cat-tag">{{ referral.category }}</span>
          <span class="area">{{ referral.city ? referral.city + ', ' + referral.metro_area : referral.metro_area }}</span>
        </div>

        <h1 class="detail-name">{{ referral.name }}</h1>

        <p v-if="referral.description" class="detail-note">{{ referral.description }}</p>

        <div v-if="referral.referred_by" class="referred-by-badge">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
          </svg>
          Ask for <b>{{ referral.referred_by }}</b>
        </div>

        <!-- Score summary -->
        <div class="score-row">
          <div class="score-block">
            <div class="score-label">💰 Price</div>
            <div class="price-dollars">
              <span
                v-for="n in 4" :key="n"
                :class="{ dim: !referral.avg_price_rating || n > Math.round(referral.avg_price_rating / 5 * 4) }"
              >$</span>
            </div>
          </div>
          <div class="score-divider"></div>
          <div class="score-block">
            <div class="score-label">✨ Quality</div>
            <StarRating :rating="referral.avg_quality_rating || 0" />
          </div>
          <div class="score-divider"></div>
          <div class="score-block">
            <div class="score-label">⭐ Overall</div>
            <div class="score-val">{{ referral.review_count > 0 ? referral.avg_rating : '—' }}</div>
            <div class="score-sub">{{ referral.review_count > 0 ? `${referral.review_count} review${referral.review_count !== 1 ? 's' : ''}` : 'No reviews yet' }}</div>
          </div>
        </div>

        <div class="contact-row">
          <a v-if="referral.phone" :href="`tel:${referral.phone}`" class="phone-btn">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>
            </svg>
            {{ referral.phone }}
          </a>
          <a v-if="referral.email" :href="`mailto:${referral.email}`" class="contact-link">✉️ {{ referral.email }}</a>
          <a v-if="referral.website" :href="referral.website" target="_blank" rel="noopener" class="contact-link">🌐 Website</a>
        </div>

        <button
          v-if="auth.user?.id === referral.user_id"
          class="btn btn-danger btn-sm"
          style="margin-top:16px;align-self:flex-start"
          @click="deleteReferral"
        >Delete Referral</button>
      </div>

      <!-- Reviews -->
      <div class="reviews-card">
        <!-- Add review form — shown first -->
        <div v-if="auth.isLoggedIn && !hasReviewed" class="add-review">
          <h3>Rate this business</h3>
          <div class="dual-rating">
            <div class="rating-field">
              <div class="rating-label price">💰 Price</div>
              <div class="star-picker">
                <button
                  v-for="n in 5" :key="n" type="button"
                  class="star-btn"
                  :class="{ active: n <= newReview.price_rating }"
                  @click="newReview.price_rating = n"
                >★</button>
                <span class="pick-val" v-if="newReview.price_rating">{{ newReview.price_rating }}/5</span>
              </div>
            </div>
            <div class="rating-field">
              <div class="rating-label quality">✨ Quality</div>
              <div class="star-picker">
                <button
                  v-for="n in 5" :key="n" type="button"
                  class="star-btn quality"
                  :class="{ active: n <= newReview.quality_rating }"
                  @click="newReview.quality_rating = n"
                >★</button>
                <span class="pick-val" v-if="newReview.quality_rating">{{ newReview.quality_rating }}/5</span>
              </div>
            </div>
          </div>
          <div class="form-group">
            <label>Comment (optional)</label>
            <textarea v-model="newReview.comment" placeholder="Share your experience…" />
          </div>
          <p v-if="reviewError" class="error-msg">{{ reviewError }}</p>
          <button
            class="btn btn-primary"
            :disabled="submitting || !newReview.price_rating || !newReview.quality_rating"
            @click="submitReview"
          >{{ submitting ? 'Submitting…' : 'Submit Review' }}</button>
        </div>
        <div v-else-if="!auth.isLoggedIn" class="login-cta">
          <p>Have you used this service? <RouterLink to="/login">Log in to rate it</RouterLink></p>
        </div>
        <p v-else-if="hasReviewed" class="login-prompt already">You've already reviewed this referral.</p>

        <!-- Reviews list -->
        <div v-if="reviews.length > 0" class="reviews-section">
          <h2 class="reviews-title">
            Reviews
            <span class="review-cnt">{{ reviews.length }}</span>
          </h2>
          <ReviewItem v-for="r in reviews" :key="r.id" :review="r" @delete="deleteReview" />
        </div>
        <div v-else-if="hasReviewed || !auth.isLoggedIn" class="no-reviews">No reviews yet.</div>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '../stores/auth.js'
import StarRating from '../components/StarRating.vue'
import ReviewItem from '../components/ReviewItem.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const referral = ref(null)
const reviews = ref([])
const loading = ref(true)
const submitting = ref(false)
const reviewError = ref('')
const newReview = ref({ price_rating: 0, quality_rating: 0, comment: '' })

const hasReviewed = computed(() =>
  auth.user && reviews.value.some(r => r.user_id === auth.user.id)
)

async function loadData() {
  loading.value = true
  try {
    const [refRes, revRes] = await Promise.all([
      axios.get(`/api/referrals/${route.params.id}`),
      axios.get(`/api/referrals/${route.params.id}/reviews`)
    ])
    referral.value = refRes.data
    reviews.value = revRes.data
  } catch { referral.value = null } finally { loading.value = false }
}

async function submitReview() {
  if (!newReview.value.price_rating || !newReview.value.quality_rating) return
  submitting.value = true
  reviewError.value = ''
  try {
    const { data } = await axios.post(`/api/referrals/${route.params.id}/reviews`, newReview.value)
    reviews.value.unshift(data)
    newReview.value = { price_rating: 0, quality_rating: 0, comment: '' }
    const refRes = await axios.get(`/api/referrals/${route.params.id}`)
    referral.value = refRes.data
  } catch (err) {
    reviewError.value = err.response?.data?.error || 'Failed to submit review'
  } finally { submitting.value = false }
}

async function deleteReview(reviewId) {
  try {
    await axios.delete(`/api/referrals/${route.params.id}/reviews/${reviewId}`)
    reviews.value = reviews.value.filter(r => r.id !== reviewId)
    const refRes = await axios.get(`/api/referrals/${route.params.id}`)
    referral.value = refRes.data
  } catch { /* ignore */ }
}

async function deleteReferral() {
  if (!confirm('Delete this referral?')) return
  try {
    await axios.delete(`/api/referrals/${route.params.id}`)
    router.push('/')
  } catch { /* ignore */ }
}

onMounted(loadData)
</script>

<style scoped>
.back {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 100px;
  padding: 7px 14px 7px 11px;
  cursor: pointer;
  transition: all .15s var(--ease);
  margin-bottom: 20px;
  min-height: unset;
  box-shadow: 0 1px 2px rgba(0,0,0,.06);
}
.back:hover { background: var(--ink); color: #fff; border-color: var(--ink); }

/* Detail card */
.detail-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 24px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
}
.detail-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; flex-wrap: wrap; }
.cat-tag {
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--accent-ink);
  background: var(--accent-wash);
  padding: 4px 10px;
  border-radius: 6px;
}
.area { font-size: 13px; color: var(--ink-faint); }

.detail-name {
  font-size: clamp(22px, 4vw, 32px);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.15;
  margin: 0 0 14px;
}
.detail-note {
  font-style: italic;
  font-size: 15px;
  line-height: 1.6;
  color: var(--ink);
  border-left: 2px solid var(--accent);
  padding-left: 14px;
  margin: 0 0 22px;
}

/* Score row */
.score-row {
  display: flex;
  align-items: center;
  background: var(--surface-2);
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 20px;
  gap: 16px;
  flex-wrap: wrap;
}
.score-block { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; min-width: 80px; }
.score-label { font-size: 10px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: var(--ink-faint); }
.score-val { font-size: 2rem; font-weight: 800; line-height: 1; color: var(--ink); }
.score-val.quality { color: #C68A1E; }
.price-dollars { font-size: 1.6rem; font-weight: 800; letter-spacing: -0.02em; color: var(--ink); line-height: 1; }
.price-dollars span.dim { color: var(--line); }
.score-sub { font-size: 11px; color: var(--ink-faint); }
.score-divider { width: 1px; height: 48px; background: var(--line); flex-shrink: 0; }
.no-score { color: var(--ink-faint); font-size: 13px; margin-bottom: 16px; font-style: italic; }

.referred-by-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink);
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: 100px;
  padding: 6px 14px;
  margin-bottom: 20px;
}
.referred-by-badge b { font-weight: 700; }

/* Contact row */
.contact-row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.phone-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 500;
  color: var(--ink);
  text-decoration: none;
  border: 1px solid var(--line);
  border-radius: 100px;
  padding: 8px 14px;
  transition: all .15s var(--ease);
}
.phone-btn:hover { background: var(--accent); color: #fff; border-color: var(--accent); }
.contact-link { font-size: 13px; color: var(--ink-soft); display: flex; align-items: center; gap: 5px; }
.contact-link:hover { color: var(--accent); }

/* Reviews card */
.reviews-card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 24px;
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
}
.reviews-title { font-size: 18px; font-weight: 700; margin: 0 0 18px; display: flex; align-items: center; gap: 10px; }
.review-cnt { background: var(--surface-2); color: var(--ink-soft); font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 100px; }
.no-reviews { color: var(--ink-faint); font-size: 13px; padding: 8px 0; }

/* Add review form */
.add-review { margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--line-soft); }
.add-review h3 { font-size: 16px; font-weight: 700; margin: 0 0 18px; }
.dual-rating { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px; }
.rating-field { background: var(--surface-2); border-radius: var(--radius); padding: 14px; }
.rating-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 10px;
  color: var(--ink-soft);
}
.rating-label.price { color: #3DA35D; }
.rating-label.quality { color: #C68A1E; }
.star-picker { display: flex; align-items: center; gap: 4px; }
.star-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--line);
  padding: 0;
  min-height: unset;
  transition: color 0.1s, transform 0.1s;
  line-height: 1;
}
.star-btn:hover { transform: scale(1.2); }
.star-btn.active { color: #f59e0b; }
.star-btn.quality.active { color: #C68A1E; }
.pick-val { font-size: 11px; font-weight: 600; color: var(--ink-soft); margin-left: 4px; }

.login-cta {
  padding: 14px 18px;
  background: var(--surface-2);
  border-radius: var(--radius);
  margin-bottom: 20px;
}
.login-cta p { margin: 0; font-size: 14px; color: var(--ink-soft); }
.login-cta a { font-weight: 600; color: var(--accent); }
.reviews-section { margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--line-soft); }
.login-prompt { margin-top: 16px; color: var(--ink-soft); font-size: 14px; }
.login-prompt.already { font-style: italic; }
.state-msg { text-align: center; padding: 60px 0; color: var(--ink-faint); font-size: 14px; }

@media (max-width: 500px) {
  .dual-rating { grid-template-columns: 1fr; }
  .score-divider { display: none; }
}
</style>
