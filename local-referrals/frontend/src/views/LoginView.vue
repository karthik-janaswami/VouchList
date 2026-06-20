<template>
  <div class="page">
    <div class="card auth-card">
      <h1>Log In</h1>
      <form @submit.prevent="submit">
        <div class="form-group">
          <label>Email</label>
          <input v-model="form.email" type="email" placeholder="you@example.com" required autocomplete="email" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="form.password" type="password" placeholder="••••••••" required autocomplete="current-password" />
        </div>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <button type="submit" class="btn btn-primary full-width" :disabled="submitting">
          {{ submitting ? 'Logging in...' : 'Log In' }}
        </button>
      </form>
      <p class="switch">Don't have an account? <RouterLink to="/register">Sign up</RouterLink></p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const submitting = ref(false)
const error = ref('')
const form = ref({ email: '', password: '' })

async function submit() {
  submitting.value = true
  error.value = ''
  try {
    const { data } = await axios.post('/api/auth/login', form.value)
    auth.setSession(data)
    const redirect = route.query.redirect || '/'
    router.push(redirect)
  } catch (err) {
    error.value = err.response?.data?.error || 'Login failed'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.page { max-width: 1240px; margin: 0 auto; padding: clamp(22px,3vw,38px) clamp(16px,4vw,44px) 90px; }
.auth-card { max-width: 400px; margin: 0 auto; }
h1 { font-family: 'Fraunces', serif; font-weight: 500; font-size: 1.6rem; letter-spacing: -0.015em; margin-bottom: 20px; }
.full-width { width: 100%; border-radius: 100px; }
.switch { margin-top: 16px; text-align: center; font-size: 13px; color: var(--ink-soft); }
</style>
