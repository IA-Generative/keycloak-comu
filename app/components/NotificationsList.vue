<script setup lang="ts">
import { DsfrModal } from '@gouvminint/vue-dsfr'
import ManageGlobalRequest from '~/components/ManageGlobalRequest.vue'
import { useNotificationsStore } from '~/stores/notifications'

const props = defineProps<{
  isAuthenticated: boolean
  displaying: boolean
}>()

const emits = defineEmits<{
  (e: 'close'): void
}>()

const notificationsStore = useNotificationsStore()
const dashboardStore = useDashboardStore()

const invites = computed(() => notificationsStore.invites)
const requests = computed(() => notificationsStore.requests)

function reloadNotifications() {
  if (props.isAuthenticated) {
    notificationsStore.fetchNotifications()
  }
}

let reloadInterval: NodeJS.Timeout | undefined
onMounted(() => {
  reloadInterval = setInterval(reloadNotifications, 10000)
  reloadNotifications()
})

onUnmounted(() => {
  if (reloadInterval) {
    clearInterval(reloadInterval)
  }
})

async function refresh(cb?: (() => Promise<void>) | (() => void)) {
  const res = await notificationsStore.fetchNotifications()
  if (cb) await cb()

  if (!(res.invites.length + res.requests.length)) {
    emits('close')
  }
}
</script>

<template>
  <DsfrModal
    :opened="props.displaying"
    title="Notifications"
    @close="emits('close')"
  >
    <InviteAlert
      v-for="group in invites"
      :key="group.id"
      :group="group"
      @refresh="refresh(dashboardStore.getGroups)"
    />
    <ManageGlobalRequest
      v-for="request in requests"
      :key="request.userId"
      :request="request"
      @refresh="refresh()"
    />
    <div
      v-if="!notificationsStore.notificationsLength"
      class="fr-container fr-mt-4w"
    >
      <div class="fr-alert fr-alert--info">
        Vous n'avez aucune notification pour le moment.
      </div>
    </div>
  </DsfrModal>
</template>
