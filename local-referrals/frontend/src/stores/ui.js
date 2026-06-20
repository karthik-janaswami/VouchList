import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  const query = ref('')
  const activeCat = ref(null)
  const metro = ref('')
  return { query, activeCat, metro }
})
