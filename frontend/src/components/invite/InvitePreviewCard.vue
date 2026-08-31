<script setup lang="ts">
import { DsfrAlert, DsfrButton, DsfrCallout } from '@gouvminint/vue-dsfr'
import type { PredefinedInvite } from '@/shared/types'

const props = defineProps<{
  invite: PredefinedInvite
  loading: boolean
}>()

const emit = defineEmits<{
  accept: []
  decline: []
}>()

const ROLE_LABELS: Record<string, string> = {
  member: 'Membre',
  admin: 'Administrateur',
  owner: 'Propriétaire',
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <h2>Invitation à rejoindre <a :href="`/g/${invite.groupId}`">{{ invite.groupName }}</a></h2>

    <dl class="fr-text--sm">
      <div class="flex gap-2">
        <dt class="fr-text--bold">Rôle attribué&nbsp;:</dt>
        <dd>{{ ROLE_LABELS[invite.role] ?? invite.role }}</dd>
      </div>
      <div v-if="invite.teams?.length" class="flex gap-2">
        <dt class="fr-text--bold">Équipes&nbsp;:</dt>
        <dd>{{ invite.teams.join(', ') }}</dd>
      </div>
    </dl>

    <DsfrCallout
      v-if="invite.groupTos"
      title="Conditions d'utilisation"
    >
      <p style="white-space: pre-wrap;">{{ invite.groupTos }}</p>
      <DsfrAlert small type="info" class="fr-mt-2w">
        En acceptant, vous vous engagez à respecter ces conditions.
      </DsfrAlert>
    </DsfrCallout>

    <div class="flex gap-3 fr-mt-2w">
      <DsfrButton :disabled="loading" label="Accepter l'invitation" @click="emit('accept')" />
      <DsfrButton secondary :disabled="loading" label="Refuser" @click="emit('decline')" />
    </div>
  </div>
</template>
