<script setup lang="ts">
import { DsfrAlert, DsfrButton } from '@gouvminint/vue-dsfr'

defineProps<{
  group: GroupDtoType
}>()

defineEmits<{
  acceptInvite: []
  declineInvite: []
  cancelRequest: []
  createRequest: []
}>()
</script>

<template>
  <div
    v-if="group.requests.find(request => request.id === $keycloak?.tokenParsed?.sub)"
    class="grow"
  >
    <p>Vous êtes en attente d'approbation.</p>
    <DsfrButton
      label="Annuler la demande d'adhésion au groupe"
      secondary
      @click="$emit('cancelRequest')"
    />
  </div>
  <div
    v-else-if="group.invites.find(invite => invite.id === $keycloak?.tokenParsed?.sub)"
    class="grow flex gap-4 flex-col"
  >
    <p>Vous avez été invité à rejoindre ce groupe.</p>
    <div class="flex gap-4">
      <DsfrButton
        label="Accepter l'invitation"
        @click="$emit('acceptInvite')"
      />
      <DsfrButton
        label="Décliner l'invitation"
        secondary
        @click="$emit('declineInvite')"
      />
    </div>
  </div>
  <div v-else>
    <p>Vous ne faites pas partie de ce groupe pour le moment.</p>
    <DsfrButton
      label="Demander à rejoindre le groupe"
      @click="$emit('createRequest')"
    />
    <DsfrAlert
      small
      type="info"
      class="fr-mt-2w"
    >
      En rejoignant ce groupe, vous acceptez de respecter ses conditions d'utilisation.
    </DsfrAlert>
  </div>
</template>
