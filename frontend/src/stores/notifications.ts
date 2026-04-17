import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import * as backend from '@/composables/useBackend'
import type { NotificationsDtoType } from '@/shared/types'

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<NotificationsDtoType>({ invites: [], requests: [] } as NotificationsDtoType)
  const isStreaming = ref(false)

  const invites = computed(() => notifications.value?.invites)
  const requests = computed(() => notifications.value?.requests)
  const notificationsLength = computed(
    () => (invites.value?.length ?? 0) + (requests.value?.length ?? 0),
  )

  let pendingFetch: Promise<NotificationsDtoType> | undefined
  let streamWanted = false
  let reconnectTimeout: ReturnType<typeof setTimeout> | undefined
  let streamConnection: backend.NotificationsStreamConnection | undefined

  function applyNotifications(nextNotifications: NotificationsDtoType) {
    notifications.value = nextNotifications
  }

  async function fetchNotifications() {
    if (!pendingFetch) {
      pendingFetch = backend.getNotifications().then((res) => {
        applyNotifications(res as NotificationsDtoType)
        return notifications.value
      }).finally(() => {
        pendingFetch = undefined
      })
    }

    return pendingFetch
  }

  function scheduleReconnect() {
    if (!streamWanted || reconnectTimeout) {
      return
    }

    reconnectTimeout = setTimeout(() => {
      reconnectTimeout = undefined
      connectStream()
    }, 3000)
  }

  function connectStream() {
    if (!streamWanted || streamConnection) {
      return
    }

    const connection = backend.openNotificationsStream(async () => {
      await fetchNotifications()
    })

    streamConnection = connection
    isStreaming.value = true

    void connection.completed.catch(() => {
      // Reconnection is handled below.
    }).finally(() => {
      if (streamConnection === connection) {
        streamConnection = undefined
      }
      isStreaming.value = false
      scheduleReconnect()
    })
  }

  function startStream() {
    streamWanted = true
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = undefined
    }
    connectStream()
  }

  function stopStream() {
    streamWanted = false
    isStreaming.value = false

    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout)
      reconnectTimeout = undefined
    }

    if (streamConnection) {
      const connection = streamConnection
      streamConnection = undefined
      connection.close()
    }
  }

  return { invites, requests, notificationsLength, isStreaming, fetchNotifications, startStream, stopStream }
})
