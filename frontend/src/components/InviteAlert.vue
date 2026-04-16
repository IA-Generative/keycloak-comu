<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { DsfrAlert, DsfrButton } from '@gouvminint/vue-dsfr'
import type { NotificationsDtoType } from '@/shared/types'
import { useGroupStore } from '@/stores/group'

const props = defineProps<{
  group: NotificationsDtoType['invites'][0]
}>()

const emits = defineEmits<{
  (e: 'refresh'): void
}>()

const groupStore = useGroupStore()

const inProgress = ref(false)
async function triggerAction(fn: (groupId: string) => Promise<void>) {
  inProgress.value = true
  await fn(props.group.id)
    .finally(() => inProgress.value = false)
  emits('refresh')
}
</script>

<template>
  <DsfrAlert small type="info" class="fr-mb-2w flex justify-between gap-4">
    <div>
      Vous avez été invité à rejoindre le groupe <RouterLink :to="`/g/${group.id}`">
        {{ group.name }}
      </RouterLink>.<br>
      <span class="fr-text--xs">
        Vous acceptez implicitement les conditions d'utilisation du groupe en rejoignant celui-ci
      </span>
    </div>
    <div class="flex gap-2 self-center">
      <DsfrButton size="md" icon="ri-check-line" icon-only :disabled="inProgress"
        @click="triggerAction(groupStore.acceptInvite)" />
      <DsfrButton size="md" secondary icon="ri-close-line" icon-only :disabled="inProgress"
        @click="triggerAction(groupStore.declineInvite)" />
    </div>
  </DsfrAlert>
</template>
