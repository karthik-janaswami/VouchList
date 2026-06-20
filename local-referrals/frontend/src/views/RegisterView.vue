<template>
  <div class="page">
    <div class="card auth-card">
      <RouterLink to="/" class="back-home">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>
        Back to home
      </RouterLink>
      <h1>Create Account</h1>
      <form @submit.prevent="submit">
        <div class="form-row">
          <div class="form-group">
            <label>First Name *</label>
            <input v-model="form.first_name" placeholder="Jane" required autocomplete="given-name" />
          </div>
          <div class="form-group">
            <label>Last Name *</label>
            <input v-model="form.last_name" placeholder="Smith" required autocomplete="family-name" />
          </div>
        </div>
        <div class="form-group">
          <label>Email *</label>
          <input v-model="form.email" type="email" placeholder="you@example.com" required autocomplete="email" />
        </div>
        <div class="form-group">
          <label>Password *</label>
          <input v-model="form.password" type="password" placeholder="Min. 6 characters" required autocomplete="new-password" />
        </div>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <button type="submit" class="btn btn-primary full-width" :disabled="submitting">
          {{ submitting ? 'Creating account...' : 'Sign Up' }}
        </button>
      </form>
      <p class="switch">Already have an account? <RouterLink to="/login">Log in</RouterLink></p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const auth = useAuthStore()

const submitting = ref(false)
const error = ref('')
const form = ref({ first_name: '', last_name: '', email: '', password: '' })

async function submit() {
  submitting.value = true
  error.value = ''
  try {
    const { data } = await axios.post('/api/auth/register', form.value)
    auth.setSession(data)
    router.push('/')
  } catch (err) {
    error.value = err.response?.data?.error || 'Registration failed'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page { max-width: 1240px; margin: 0 auto; padding: clamp(22px,3vw,38px) clamp(16px,4vw,44px) 90px; }
.auth-card { max-width: 400px; margin: 0 auto; }
h1 { font-family: 'Fraunces', serif; font-weight: 500; font-size: 1.6rem; letter-spacing: -0.015em; margin-bottom: 20px; }
.back-home {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-soft);
  text-decoration: none;
  margin-bottom: 20px;
}
.back-home:hover { color: var(--accent); text-decoration: none; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0 14px; }
.full-width { width: 100%; border-radius: 100px; }
.switch { margin-top: 16px; text-align: center; font-size: 13px; color: var(--ink-soft); }
</style>
