<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { DsfrModal } from '@gouvminint/vue-dsfr'
import ManageGlobalRequest from '@/components/ManageGlobalRequest.vue'
import InviteAlert from '@/components/InviteAlert.vue'
import { useNotificationsStore } from '@/stores/notifications'
import { useDashboardStore } from '@/stores/dashboard'
import router from '@/router'

const props = defineProps<{
  isAuthenticated: boolean
  displaying: boolean
}>()

const emits = defineEmits<{
  close: []
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

onMounted(() => {
  reloadNotifications()
})

watch(() => props.displaying, (newVal) => {
  if (newVal) {
    reloadNotifications()
  }
})

async function refresh(cb?: (() => (Promise<any> | any)) | (() => void)) {
  const res = await notificationsStore.fetchNotifications()
  if (cb) await cb()

  if (!notificationsStore.notificationsLength) {
    console.warn('No more notifications, closing the modal')
    emits('close')
  }
}

watch(router.currentRoute, () => {
  if (props.displaying) {
    emits('close')
  }
})
</script>

<template>
  <DsfrModal :opened="props.displaying" title="Notifications" @close="emits('close')">
    <InviteAlert 
      v-for="group in invites" 
      :key="group.id" :group="group" 
      @refresh="refresh(dashboardStore.getGroups)" 
      @visit="emits('close')"
    />
    <ManageGlobalRequest 
      v-for="request in requests" 
      :key="request.userId" :request="request" 
      @refresh="refresh()" 
      @visit="emits('close')" 
    />
    <div v-if="!notificationsStore.notificationsLength" class="fr-container fr-mt-4w">
      <div class="fr-alert fr-alert--info">
        Vous n'avez aucune notification pour le moment.
      </div>
    </div>
  </DsfrModal>
</template>
