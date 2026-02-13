import { defineStore } from 'pinia'
import fetcher from '~/composables/useApi.js'

export const useDashboardStore = defineStore('dashboard', () => {
  const isLoading = ref(true)
  const groups = ref<ListGroupDtoType>({ joined: [], requested: [] })

  async function getGroups() {
    const data = await fetcher('/api/v1/groups/list', {
      method: 'get',
    })
    groups.value = data
    isLoading.value = false
  }

  return {
    groups,
    isLoading,
    getGroups,
  }
})
