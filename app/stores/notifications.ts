import { defineStore } from 'pinia'
import fetcher from '~/composables/useApi.js'
import type { NotificationsDtoType } from '~~/shared/NotificationsDtoSchema.js'

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<NotificationsDtoType>({ invites: [], requests: [] } as NotificationsDtoType)
  const invites = computed(() => notifications.value?.invites)
  const requests = computed(() => notifications.value?.requests)
  const notificationsLength = computed(
    () => (invites.value?.length ?? 0) + (requests.value?.length ?? 0),
  )

  async function fetchNotifications() {
    const res = await fetcher(`/api/v1/notifications`)
    notifications.value = res
    return res
  }

  return {
    invites,
    requests,
    notificationsLength,
    fetchNotifications,
  }
})
