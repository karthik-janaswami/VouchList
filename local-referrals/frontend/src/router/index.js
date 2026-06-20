import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const routes = [
  { path: '/', component: () => import('../views/HomeView.vue') },
  { path: '/referrals/:id', component: () => import('../views/ReferralDetailView.vue') },
  {
    path: '/submit',
    component: () => import('../views/SubmitReferralView.vue'),
    meta: { requiresAuth: true }
  },
  { path: '/login', component: () => import('../views/LoginView.vue') },
  { path: '/register', component: () => import('../views/RegisterView.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
})

router.afterEach((to) => {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'page_view', { page_path: to.fullPath })
  }
})

export default router
