import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import * as backend from '@/composables/useBackend'
import type { ListGroupDtoType } from '@/shared/types'

export const useDashboardStore = defineStore('dashboard', () => {
  const isLoading = ref(true)
  const groups = ref<ListGroupDtoType>({ joined: [], requested: [] } as ListGroupDtoType)

  async function getGroups() {
    isLoading.value = true
    const data = await backend.listGroups()
    groups.value = data as ListGroupDtoType
    isLoading.value = false
  }

  const isEmpty = computed(() =>
    (groups.value.joined?.length ?? 0) + (groups.value.requested?.length ?? 0) === 0,
  )

  return { groups, isLoading, isEmpty, getGroups }
})
