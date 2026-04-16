import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import * as backend from '@/composables/useBackend'
import type { NotificationsDtoType } from '@/shared/types'

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<NotificationsDtoType>({ invites: [], requests: [] } as NotificationsDtoType)

  const invites = computed(() => notifications.value?.invites)
  const requests = computed(() => notifications.value?.requests)
  const notificationsLength = computed(
    () => (invites.value?.length ?? 0) + (requests.value?.length ?? 0),
  )

  async function fetchNotifications() {
    const res = await backend.getNotifications()
    notifications.value = res as NotificationsDtoType
    return res
  }

  return { invites, requests, notificationsLength, fetchNotifications }
})
