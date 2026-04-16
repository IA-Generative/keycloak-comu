<script setup lang="ts">
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { DsfrModal } from '@gouvminint/vue-dsfr'
import ManageGlobalRequest from '@/components/ManageGlobalRequest.vue'
import InviteAlert from '@/components/InviteAlert.vue'
import { useNotificationsStore } from '@/stores/notifications'
import { useDashboardStore } from '@/stores/dashboard'

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

let reloadInterval: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  reloadInterval = setInterval(reloadNotifications, 30000)
  reloadNotifications()
})

watch(() => props.displaying, (newVal) => {
  if (newVal) {
    reloadNotifications()
  }
})
onUnmounted(() => {
  if (reloadInterval) {
    clearInterval(reloadInterval)
  }
})

async function refresh(cb?: (() => Promise<void>) | (() => void)) {
  const res = await notificationsStore.fetchNotifications()
  if (cb) await cb()

  if (!((res as any).invites?.length + (res as any).requests?.length)) {
    emits('close')
  }
}
</script>

<template>
  <DsfrModal :opened="props.displaying" title="Notifications" @close="emits('close')">
    <InviteAlert v-for="group in invites" :key="group.id" :group="group" @refresh="refresh(dashboardStore.getGroups)" />
    <ManageGlobalRequest v-for="request in requests" :key="request.userId" :request="request" @refresh="refresh()" />
    <div v-if="!notificationsStore.notificationsLength" class="fr-container fr-mt-4w">
      <div class="fr-alert fr-alert--info">
        Vous n'avez aucune notification pour le moment.
      </div>
    </div>
  </DsfrModal>
</template>
