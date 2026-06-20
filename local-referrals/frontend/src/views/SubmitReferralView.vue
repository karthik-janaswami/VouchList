<template>
  <div class="page">
    <div class="card form-card">
      <h1>Add a Referral</h1>
      <p class="subtitle">Share a trusted service provider with your community</p>

      <form @submit.prevent="submit">
        <div class="form-group">
          <label>Business / Provider Name *</label>
          <input v-model="form.name" placeholder="e.g. Joe's Plumbing" required />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Category *</label>
            <select v-model="categorySelect" required>
              <option value="">Select a category</option>
              <option v-for="c in CATEGORIES" :key="c" :value="c">{{ c }}</option>
              <option value="__other__">+ Add new category…</option>
            </select>
            <input
              v-if="categorySelect === '__other__'"
              v-model="form.category"
              class="custom-cat-input"
              placeholder="Type new category name"
              required
            />
          </div>
          <div class="form-group">
            <label>Metro Area *</label>
            <select v-model="metroSelect" required>
              <option value="">Select a metro area</option>
              <option v-for="m in metroAreas" :key="m" :value="m">{{ m }}</option>
              <option value="__other__">+ Add new metro area…</option>
            </select>
            <input
              v-if="metroSelect === '__other__'"
              v-model="form.metro_area"
              class="custom-cat-input"
              placeholder="e.g. Chicago, IL"
              required
            />
          </div>
          <div class="form-group">
            <label>City</label>
            <input v-model="form.city" placeholder="e.g. Pleasanton, Dublin" />
          </div>
        </div>
        <div class="form-group">
          <label>Referred By</label>
          <input v-model="form.referred_by" placeholder="Who recommended them? (e.g. Priya S., neighbor on Oak St.)" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Phone</label>
            <input v-model="form.phone" type="tel" placeholder="(555) 123-4567" />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input v-model="form.email" type="email" placeholder="contact@example.com" />
          </div>
        </div>
        <div class="form-group">
          <label>Website</label>
          <input v-model="form.website" type="url" placeholder="https://example.com" />
        </div>

        <!-- Initial rating (mandatory) -->
        <div class="rating-section">
          <p class="rating-heading">Your rating *</p>
          <div class="dual-rating">
            <div class="rating-field">
              <div class="rating-label-row">💰 Price</div>
              <div class="star-picker">
                <button
                  v-for="n in 4" :key="n" type="button"
                  class="star-btn dollar"
                  :class="{ active: n <= review.price_rating }"
                  @click="review.price_rating = n"
                >$</button>
                <span class="pick-val" v-if="review.price_rating">{{ review.price_rating }}/4</span>
              </div>
            </div>
            <div class="rating-field">
              <div class="rating-label-row">✨ Quality</div>
              <div class="star-picker">
                <button
                  v-for="n in 5" :key="n" type="button"
                  class="star-btn quality"
                  :class="{ active: n <= review.quality_rating }"
                  @click="review.quality_rating = n"
                >★</button>
                <span class="pick-val" v-if="review.quality_rating">{{ review.quality_rating }}/5</span>
              </div>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>Description</label>
          <textarea v-model="form.description" placeholder="What makes them great? How do you know them?" />
        </div>

        <p v-if="error" class="error-msg">{{ error }}</p>

        <div class="form-actions">
          <RouterLink to="/" class="btn btn-secondary">Cancel</RouterLink>
          <button type="submit" class="btn btn-primary" :disabled="submitting">
            {{ submitting ? 'Submitting...' : 'Add Referral' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '../stores/auth.js'

const CATEGORIES = [
  'Appliance Repair', 'Auto Services', 'Bakery / Cakes', 'Catering', 'Clothing',
  'Contractor', 'Dentist', 'Electrician', 'Events', 'Garage Door', 'Gardening',
  'HVAC', 'Handyman', 'Healthcare', 'Home Cleaning', 'Home Decor',
  'Home Kitchen / Tiffin', 'Indian Grocery Delivery', 'Insulation', 'Insurance',
  'Locksmith', 'Makeup & Beauty', 'Mover', 'Notary', 'Painter', 'Pandit / Guruji',
  'Pest Control', 'Photography', 'Plumber', 'Realtor', 'Roofer', 'Soaps & Body Care',
  'Structural Engineer', 'Tailor & Alterations', 'Volunteering', 'Water Softener', 'Will & Trust'
]

const router = useRouter()
const auth = useAuthStore()
const submitting = ref(false)
const error = ref('')
const review = ref({ price_rating: 0, quality_rating: 0 })
const categorySelect = ref('')
const metroSelect = ref('Bay Area, CA')
const metroAreas = ref(['Bay Area, CA'])
const form = ref({
  name: '', category: '', metro_area: 'Bay Area, CA', city: '',
  referred_by: auth.user ? [auth.user.first_name, auth.user.last_name].filter(Boolean).join(' ') || auth.user.username : '', description: '', phone: '', email: '', website: ''
})

watch(categorySelect, val => {
  if (val !== '__other__') form.value.category = val
  else form.value.category = ''
})

watch(metroSelect, val => {
  if (val !== '__other__') form.value.metro_area = val
  else form.value.metro_area = ''
})

onMounted(async () => {
  try {
    const { data } = await axios.get('/api/referrals/meta')
    if (data.metro_areas?.length) metroAreas.value = data.metro_areas
  } catch { /* keep default */ }
})

async function submit() {
  submitting.value = true
  error.value = ''
  try {
    if (!review.value.price_rating || !review.value.quality_rating) {
      error.value = 'Please rate both price and quality.'
      submitting.value = false
      return
    }
    const { data } = await axios.post('/api/referrals', form.value)
    await axios.post(`/api/referrals/${data.id}/reviews`, {
      price_rating: Math.round(review.value.price_rating / 4 * 5),
      quality_rating: review.value.quality_rating,
    })
    router.push(`/referrals/${data.id}`)
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to submit. Please try again.'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page { max-width: 1240px; margin: 0 auto; padding: clamp(22px,3vw,38px) clamp(16px,4vw,44px) 90px; }
.form-card { max-width: 600px; margin: 0 auto; }
h1 { font-weight: 800; font-size: 1.6rem; letter-spacing: -0.02em; margin-bottom: 4px; }
.subtitle { color: var(--ink-soft); margin-bottom: 24px; font-size: 13px; }
.form-row { display: grid; grid-template-columns: 1fr; gap: 0; }
.custom-cat-input { margin-top: 8px; }
.rating-section {
  background: var(--surface-2);
  border-radius: var(--radius);
  padding: 16px 18px;
  margin-bottom: 20px;
}
.rating-heading { font-size: 13px; font-weight: 700; margin: 0 0 14px; color: var(--ink); }
.optional { font-weight: 400; color: var(--ink-faint); }
.dual-rating { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.rating-field { display: flex; flex-direction: column; gap: 8px; }
.rating-label-row { font-size: 12px; font-weight: 700; color: var(--ink-soft); }
.star-picker { display: flex; align-items: center; gap: 4px; }
.star-btn {
  background: none; border: none; font-size: 1.6rem; cursor: pointer;
  color: var(--line); padding: 0; min-height: unset;
  transition: color .1s, transform .1s; line-height: 1;
}
.star-btn:hover { transform: scale(1.2); }
.star-btn.active { color: #f59e0b; }
.star-btn.quality.active { color: #C68A1E; }
.star-btn.dollar { font-size: 1.3rem; font-weight: 800; letter-spacing: -0.02em; }
.star-btn.dollar.active { color: var(--ink); }
.pick-val { font-size: 11px; font-weight: 600; color: var(--ink-soft); margin-left: 4px; }
.form-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 8px; }
@media (min-width: 480px) {
  .form-row { grid-template-columns: 1fr 1fr; gap: 0 16px; }
}
</style>
