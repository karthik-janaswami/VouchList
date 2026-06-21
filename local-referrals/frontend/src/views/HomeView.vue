<template>
  <div class="shell">

    <!-- ── SEARCH RESULTS ── -->
    <template v-if="ui.query.trim()">
      <div class="view-head">
        <div class="eyebrow">Search results</div>
        <h1 class="view-title">"{{ ui.query.trim() }}"</h1>
      </div>
      <div class="toolbar">
        <span class="count-meta">{{ filteredReferrals.length }} {{ filteredReferrals.length === 1 ? 'contact' : 'contacts' }}</span>
        <SortToggle v-model="sortMode" />
      </div>
      <div class="grid" v-if="filteredReferrals.length">
        <ReferralCard v-for="r in filteredReferrals" :key="r.id" :referral="r" @tag-click="drillInto" />
      </div>
      <div v-else class="empty-state">
        <h3>No matches</h3>
        <p>Nothing matched that search. Try a trade or a name.</p>
        <button @click="ui.query = ''">Browse all categories</button>
      </div>
    </template>

    <!-- ── CATEGORY DRILL-DOWN ── -->
    <template v-else-if="ui.activeCat">
      <div class="view-head">
        <button class="back" @click="ui.activeCat = null">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4">
            <path d="M19 12H5M11 6l-6 6 6 6"/>
          </svg>
          All categories
        </button>
        <div class="cat-title" :style="`--hue:${catMeta(ui.activeCat).hue}`">
          <span class="cat-icon">
            <span class="msym">{{ catMeta(ui.activeCat).icon }}</span>
          </span>
          <h1 class="view-title" style="margin:0">{{ ui.activeCat }}</h1>
        </div>
      </div>
      <div class="toolbar">
        <span class="count-meta">{{ filteredReferrals.length }} {{ filteredReferrals.length === 1 ? 'contact' : 'contacts' }}</span>
        <SortToggle v-model="sortMode" />
      </div>
      <div v-if="loading" class="state-msg">Loading…</div>
      <div class="grid" v-else-if="filteredReferrals.length">
        <ReferralCard v-for="r in filteredReferrals" :key="r.id" :referral="r" @tag-click="drillInto" />
      </div>
      <div v-else class="empty-state">
        <h3>No entries yet</h3>
        <p>Be the first to add a {{ ui.activeCat }} referral.</p>
        <RouterLink to="/submit" class="btn btn-primary">Add one</RouterLink>
      </div>
    </template>

    <!-- ── MEGA GRID ── -->
    <template v-else>
      <div class="view-head home-hero">
        <h1 class="view-title">Who do you need?</h1>
      </div>
      <div v-if="loading" class="state-msg">Loading…</div>
      <div v-else class="mega">
        <button
          v-for="(cat, i) in categoriesWithCounts"
          :key="cat.name"
          class="tile"
          :style="`--hue:${cat.hue}; animation-delay:${Math.min(i * 20, 280)}ms`"
          @click="drillInto(cat.name)"
        >
          <span class="tile-icon"><span class="msym">{{ cat.icon }}</span></span>
          <svg
            class="tile-star" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"
            v-if="cat.hasTopPick" aria-label="Has a top pick"
          ><path d="M12 2l2.9 6.3 6.9.7-5.1 4.6 1.5 6.8L12 17.6 5.9 21l1.5-6.8L2.3 9.6l6.9-.7z"/></svg>
          <span class="tile-name">{{ cat.name }}</span>
          <span class="tile-count">
            <span class="tile-num">{{ cat.count }}</span>
            <span class="tile-label">{{ cat.count === 1 ? 'contact' : 'contacts' }}</span>
          </span>
          <svg class="tile-go" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M5 12h14M13 6l6 6-6 6"/>
          </svg>
        </button>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import Fuse from 'fuse.js'
import { useAuthStore } from '../stores/auth.js'
import { useUIStore } from '../stores/ui.js'
import ReferralCard from '../components/ReferralCard.vue'
import SortToggle from '../components/SortToggle.vue'

const auth = useAuthStore()
const ui = useUIStore()

const allReferrals = ref([])
const loading = ref(true)
const sortMode = ref('pick')

const visibleReferrals = computed(() =>
  ui.metro
    ? allReferrals.value.filter(r => r.metro_area === ui.metro)
    : allReferrals.value
)

const CATEGORIES = [
  { name: 'Appliance Repair',        icon: 'kitchen',              hue: '#5C6FC0' },
  { name: 'Auto Services',           icon: 'directions_car',       hue: '#1E88E5' },
  { name: 'Bakery / Cakes',          icon: 'cake',                 hue: '#D8589A' },
  { name: 'Catering',                icon: 'restaurant',           hue: '#F2882E' },
  { name: 'Clothing',                icon: 'checkroom',            hue: '#9B51C9' },
  { name: 'Contractor',              icon: 'engineering',          hue: '#F2A828' },
  { name: 'Dentist',                 icon: 'dentistry',            hue: '#1E88E5' },
  { name: 'Electrician',             icon: 'electrical_services',  hue: '#F2A828' },
  { name: 'Events',                  icon: 'celebration',          hue: '#D8589A' },
  { name: 'Garage Door',             icon: 'garage',               hue: '#5C6FC0' },
  { name: 'Gardening',               icon: 'grass',                hue: '#3DA35D' },
  { name: 'HVAC',                    icon: 'hvac',                 hue: '#1E88E5' },
  { name: 'Handyman',                icon: 'handyman',             hue: '#F2882E' },
  { name: 'Healthcare',              icon: 'medical_services',     hue: '#E05A45' },
  { name: 'Home Cleaning',           icon: 'cleaning_services',    hue: '#12A98B' },
  { name: 'Home Decor',              icon: 'chair',                hue: '#F2A828' },
  { name: 'Home Kitchen / Tiffin',   icon: 'rice_bowl',            hue: '#F2882E' },
  { name: 'Indian Grocery Delivery', icon: 'shopping_basket',      hue: '#3DA35D' },
  { name: 'Insulation',              icon: 'layers',               hue: '#9DAE3A' },
  { name: 'Insurance',               icon: 'shield',               hue: '#5C6FC0' },
  { name: 'Locksmith',               icon: 'key',                  hue: '#E05A45' },
  { name: 'Makeup & Beauty',         icon: 'spa',                  hue: '#D8589A' },
  { name: 'Mover',                   icon: 'local_shipping',       hue: '#F2A828' },
  { name: 'Notary',                  icon: 'gavel',                hue: '#5C6FC0' },
  { name: 'Painter',                 icon: 'format_paint',         hue: '#9B51C9' },
  { name: 'Pandit / Guruji',         icon: 'temple_hindu',         hue: '#EE9C1E' },
  { name: 'Pest Control',            icon: 'pest_control',         hue: '#9DAE3A' },
  { name: 'Photography',             icon: 'photo_camera',         hue: '#5C6FC0' },
  { name: 'Plumber',                 icon: 'plumbing',             hue: '#1E88E5' },
  { name: 'Realtor',                 icon: 'real_estate_agent',    hue: '#12A98B' },
  { name: 'Roofer',                  icon: 'roofing',              hue: '#E05A45' },
  { name: 'Soaps & Body Care',       icon: 'soap',                 hue: '#3DA35D' },
  { name: 'Structural Engineer',     icon: 'architecture',         hue: '#5C6FC0' },
  { name: 'Tailor & Alterations',    icon: 'content_cut',          hue: '#F2882E' },
  { name: 'Volunteering',            icon: 'volunteer_activism',   hue: '#12A98B' },
  { name: 'Water Softener',          icon: 'water_drop',           hue: '#1E88E5' },
  { name: 'Will & Trust',            icon: 'account_balance',      hue: '#5C6FC0' },
]
const CAT_MAP = Object.fromEntries(CATEGORIES.map(c => [c.name, c]))

function catMeta(name) {
  return CAT_MAP[name] || { icon: 'home_repair_service', hue: '#5C6FC0' }
}

function drillInto(catName) {
  ui.activeCat = catName
  window.scrollTo(0, 0)
}

const fuse = computed(() => new Fuse(visibleReferrals.value, {
  keys: ['name', 'category', 'description', 'city'],
  threshold: 0.35,
  minMatchCharLength: 2,
}))

const categoryReferrals = computed(() => {
  if (!ui.activeCat) return []
  return sort(visibleReferrals.value.filter(r => r.category === ui.activeCat))
})

const searchReferrals = computed(() => {
  const q = ui.query.trim()
  if (!q) return []
  return sort(fuse.value.search(q).map(r => r.item))
})

const filteredReferrals = computed(() =>
  ui.query.trim() ? searchReferrals.value : categoryReferrals.value
)

function sort(items) {
  const arr = items.slice()
  if (sortMode.value === 'az') return arr.sort((a, b) => a.name.localeCompare(b.name))
  return arr.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0) || a.name.localeCompare(b.name))
}

const categoriesWithCounts = computed(() => {
  const counts = {}
  const hasRating = {}
  visibleReferrals.value.forEach(r => {
    counts[r.category] = (counts[r.category] || 0) + 1
    if (r.avg_rating > 0) hasRating[r.category] = true
  })
  return CATEGORIES.map(c => ({
    ...c,
    count: counts[c.name] || 0,
    hasTopPick: !!hasRating[c.name],
  }))
})

async function fetchAll() {
  loading.value = true
  try {
    const { data } = await axios.get('/api/referrals')
    allReferrals.value = data
  } catch { /* ignore */ } finally {
    loading.value = false
  }
}

onMounted(fetchAll)
</script>

<style scoped>
/* ---------- View header ---------- */
.view-head { margin-bottom: 22px; }
.eyebrow {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--ink-soft);
}
.view-title {
  font-size: clamp(26px, 5vw, 40px);
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0 0 6px;
  line-height: 1.1;
}
.view-sub { font-size: 14px; color: var(--ink-soft); margin: 0; }

/* Back button */
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
  margin-bottom: 14px;
  box-shadow: 0 1px 2px rgba(0,0,0,.06);
}
.back:hover { background: var(--ink); color: #fff; border-color: var(--ink); }

/* Category title row */
.cat-title { display: flex; align-items: center; gap: 14px; margin-top: 14px; }
.cat-icon {
  flex: none;
  width: 52px; height: 52px;
  border-radius: 15px;
  background: color-mix(in srgb, var(--hue) 15%, var(--surface));
  color: var(--hue);
  display: inline-flex; align-items: center; justify-content: center;
}
.cat-icon .msym { font-size: 30px; }

/* Toolbar */
.toolbar { display: flex; align-items: center; gap: 14px; margin: 6px 0 20px; flex-wrap: wrap; }
.count-meta { font-size: 12px; font-weight: 500; color: var(--ink-soft); }

/* ── MEGA GRID ── */
.mega {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(186px, 1fr));
  gap: 12px;
}
.tile {
  position: relative;
  display: flex; flex-direction: column; justify-content: flex-start;
  min-height: 150px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 15px 16px 14px;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0,0,0,.04);
  transition: border-color .18s var(--ease), transform .18s var(--ease), box-shadow .18s var(--ease);
  animation: rise .4s var(--ease) both;
  overflow: hidden;
}
.tile:hover {
  border-color: color-mix(in srgb, var(--hue, var(--accent)) 30%, var(--line));
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0,0,0,.12);
}
.tile-icon {
  width: 46px; height: 46px;
  border-radius: 13px;
  background: color-mix(in srgb, var(--hue, var(--accent)) 15%, var(--surface));
  color: var(--hue, var(--accent));
  display: inline-flex; align-items: center; justify-content: center;
  transition: background .18s var(--ease);
}
.tile:hover .tile-icon { background: color-mix(in srgb, var(--hue, var(--accent)) 24%, var(--surface)); }
.tile-icon .msym { font-size: 27px; }
.tile-star { position: absolute; top: 13px; right: 14px; color: var(--gold); }
.tile-name {
  font-weight: 700;
  font-size: 17px;
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: var(--ink);
  margin-top: auto;
  padding-top: 14px;
}
.tile-count { display: flex; align-items: baseline; gap: 7px; margin-top: 10px; }
.tile-num { font-weight: 700; font-size: 26px; line-height: 1; color: var(--ink); }
.tile-label { font-size: 10.5px; letter-spacing: 0.04em; text-transform: uppercase; color: var(--ink-faint); }
.tile-go {
  position: absolute; bottom: 14px; right: 14px;
  color: var(--hue, var(--accent));
  opacity: 0; transform: translateX(-4px);
  transition: opacity .18s var(--ease), transform .18s var(--ease);
}
.tile:hover .tile-go { opacity: 1; transform: none; }

/* ── REFERRAL GRID ── */
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 14px; }

/* Empty / loading */
.state-msg { text-align: center; padding: 60px 0; color: var(--ink-faint); font-size: 14px; }
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 70px 20px;
  color: var(--ink-soft);
  display: flex; flex-direction: column; align-items: center; gap: 12px;
}
.empty-state h3 { font-weight: 800; font-size: 22px; color: var(--ink); margin: 0; }
.empty-state p { margin: 0; font-size: 14px; }
.empty-state button {
  margin-top: 6px;
  font-size: 13px;
  font-weight: 600;
  background: var(--accent-grad);
  color: #fff;
  border: none;
  border-radius: 100px;
  padding: 11px 20px;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(189,30,89,.28);
}

/* ── Responsive ── */
@media (max-width: 540px) {
  .home-hero { display: none; }
  .shell { padding-top: 16px; }
  .mega { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .tile { min-height: 132px; padding: 13px 13px 12px; }
  .tile-icon { width: 40px; height: 40px; border-radius: 11px; }
  .tile-icon .msym { font-size: 23px; }
  .tile-name { font-size: 15px; padding-top: 10px; }
  .tile-num { font-size: 22px; }
  .grid { grid-template-columns: 1fr; }
}
</style>
