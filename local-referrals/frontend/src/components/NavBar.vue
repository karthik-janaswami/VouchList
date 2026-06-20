<template>
  <header class="masthead">
    <div class="masthead-row">
      <button class="brand" @click="goHome" aria-label="Browse all categories">
        <span class="brand-name"><b>Vouch</b>List</span>
        <span class="brand-sub">Vouched By Your Local Community</span>
      </button>

      <span class="metro">
        <span class="dot"></span>
        <select v-model="ui.metro" class="metro-select" aria-label="Metro area">
          <option v-for="m in metroAreas" :key="m" :value="m">{{ m }}</option>
        </select>
      </span>

      <div class="search-wrap">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
          <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
        </svg>
        <input
          v-model="ui.query"
          type="text"
          placeholder="Find a trusted contractor, plumber…"
          aria-label="Search"
        />
        <button v-if="ui.query" class="clear-btn" @click="ui.query = ''" aria-label="Clear search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="nav-actions">
        <RouterLink v-if="auth.isLoggedIn" to="/submit" class="btn btn-primary btn-sm">+ Add</RouterLink>
        <template v-if="auth.isLoggedIn">
          <span class="nav-user">{{ auth.user.first_name || auth.user.username }}</span>
          <button class="btn btn-secondary btn-sm" @click="handleLogout">Logout</button>
        </template>
        <template v-else>
          <RouterLink to="/login" class="btn btn-secondary btn-sm">Login</RouterLink>
          <RouterLink to="/register" class="btn btn-primary btn-sm">Sign up</RouterLink>
        </template>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '../stores/auth.js'
import { useUIStore } from '../stores/ui.js'

const auth = useAuthStore()
const ui = useUIStore()
const router = useRouter()
const metroAreas = ref([])

onMounted(async () => {
  try {
    const { data } = await axios.get('/api/referrals/meta')
    metroAreas.value = data.metro_areas || []
    if (metroAreas.value.length && !ui.metro) {
      ui.metro = metroAreas.value[0]
    }
  } catch { /* ignore */ }
})

function goHome() {
  ui.query = ''
  ui.activeCat = null
  router.push('/')
}

function handleLogout() {
  auth.logout()
  router.push('/')
}
</script>

<style scoped>
.masthead {
  position: sticky;
  top: 0;
  z-index: 20;
  background: color-mix(in srgb, var(--page) 82%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
  padding: 10px clamp(12px, 4vw, 44px);
  overflow-x: hidden;
}
.masthead-row {
  display: grid;
  grid-template-columns: auto auto 1fr auto;
  grid-template-rows: auto auto;
  align-items: center;
  gap: 10px 14px;
  max-width: 1240px;
  margin: 0 auto;
}

/* Brand */
.brand {
  display: flex;
  flex-direction: column;
  line-height: 1.05;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  min-height: unset;
}
.brand-name {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-weight: 800;
  font-size: 22px;
  letter-spacing: -0.02em;
  color: var(--ink);
}
.brand-name b { color: var(--accent); font-weight: 800; }
.brand-sub {
  font-size: 11px;
  letter-spacing: 0.02em;
  color: var(--ink);
  margin-top: 3px;
}

/* Metro pill */
.metro {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  font-size: 12px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 100px;
  padding: 6px 12px;
  color: var(--ink-soft);
  white-space: nowrap;
}
.dot { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); flex-shrink: 0; }
.metro-select {
  background: none;
  border: none;
  font-size: 12px;
  color: var(--ink-soft);
  cursor: pointer;
  padding: 0;
  min-height: unset;
  outline: none;
}

/* Search */
.search-wrap {
  position: relative;
  grid-column: 1 / -1;
}
.search-wrap svg {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-faint);
  pointer-events: none;
}
.search-wrap input {
  padding-left: 38px;
  padding-right: 36px;
  min-height: 40px;
  width: 100%;
  font-size: 16px;
}
.clear-btn {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 4px;
  min-height: unset;
  color: var(--ink-faint);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.clear-btn:hover { color: var(--ink); }

/* Nav actions */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}
.nav-user {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-soft);
}

@media (min-width: 700px) {
  .masthead-row {
    grid-template-columns: auto auto 1fr auto;
    grid-template-rows: auto;
  }
  .search-wrap {
    grid-column: auto;
    max-width: 380px;
  }
}
@media (max-width: 699px) {
  .nav-user { display: none; }
  .brand-sub { display: none; }
  .masthead-row {
    grid-template-columns: auto 1fr auto;
    grid-template-rows: auto auto;
  }
  .brand { grid-row: 1; grid-column: 1; }
  .nav-actions { grid-row: 1; grid-column: 3; }
  .metro {
    grid-row: 2;
    grid-column: 1;
    border-radius: 100px 0 0 100px;
    border-right: none;
    padding: 0 8px 0 12px;
    white-space: nowrap;
    flex-shrink: 0;
    height: 40px;
    align-self: stretch;
  }
  .search-wrap {
    grid-row: 2;
    grid-column: 2 / 4;
    min-width: 0;
  }
  .search-wrap input {
    border-radius: 0 100px 100px 0;
    border-left: none;
  }
}
</style>
