<script setup lang="ts">
import { ref, watch } from 'vue'
import { DsfrModal } from '@gouvminint/vue-dsfr'
import PredefinedInviteLinkForm from './PredefinedInviteLinkForm.vue'
import type { InviteLinkParameters, PredefinedInvite } from '@/shared/types'

const props = defineProps<{
  opened: boolean
  mode: 'create' | 'edit'
  groupTeams: string[]
  maxRole: 'member' | 'admin' | 'owner'
  initial?: PredefinedInvite | null
}>()

const emit = defineEmits<{
  'update:opened': [boolean]
  submit: [payload: InviteLinkParameters]
}>()

const title = ref('')
watch(
  () => [props.mode, props.initial] as const,
  () => {
    title.value = props.mode === 'edit'
      ? `Modifier le lien ${props.initial?.code ?? ''}`
      : 'Créer un lien d\'invitation'
  },
  { immediate: true },
)

function onSubmit(payload: InviteLinkParameters) {
  emit('submit', payload)
}
</script>

<template>
  <DsfrModal
    v-if="opened"
    :opened="opened"
    :title="title"
    @close="emit('update:opened', false)"
  >
    <PredefinedInviteLinkForm
      :group-teams="groupTeams"
      :max-role="maxRole"
      :initial="initial"
      @submit="onSubmit"
      @cancel="emit('update:opened', false)"
    />
  </DsfrModal>
</template>
