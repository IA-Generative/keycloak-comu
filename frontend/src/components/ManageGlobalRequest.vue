<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { DsfrAlert, DsfrButton } from '@gouvminint/vue-dsfr'
import type { GlobalRequestType } from '@/shared/types'
import { useGroupStore } from '@/stores/group'

const props = defineProps<{ request: GlobalRequestType }>()
const emits = defineEmits<{
  (e: 'refresh'): void
}>()

const request = computed(() => props.request)

const groupStore = useGroupStore()

function getIdentity() {
  if (request.value.userFirstName && request.value.userLastName) {
    return `${request.value.userFirstName} ${request.value.userLastName}`
  }
  return 'Un utilisateur'
}

const inProgress = ref(false)
async function triggerAction(fn: (...args: any[]) => Promise<void>, args: any[]) {
  inProgress.value = true
  await fn(...args)
    .finally(() => inProgress.value = false)
  emits('refresh')
}
</script>

<template>
  <DsfrAlert small class="fr-mb-2w flex justify-between gap-4" type="info">
    <div>
      {{ getIdentity() }} demande à rejoindre le groupe <RouterLink :to="`/g/${request.groupId}`">
        {{ request.groupName }}
      </RouterLink>.<br>
    </div>
    <div class="flex gap-2 self-center">
      <DsfrButton size="md" icon="ri-check-line" icon-only :disabled="inProgress"
        @click="triggerAction(groupStore.acceptRequest, [request.groupId, request.userId])" />
      <DsfrButton size="md" secondary icon="ri-close-line" icon-only :disabled="inProgress"
        @click="triggerAction(groupStore.declineRequest, [request.groupId, request.userId])" />
    </div>
  </DsfrAlert>
</template>
