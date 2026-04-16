<script setup lang="ts">
import { computed, ref } from 'vue'
import { DsfrAlert, DsfrButton } from '@gouvminint/vue-dsfr'
import { useGroupStore } from '@/stores/group'
import { getUserId } from '@/composables/useOidc'
import type { GroupDtoType } from '@/shared/types'

const groupStore = useGroupStore()
const group = computed(() => groupStore.group as GroupDtoType)

const currentUserId = ref<string | null>(null)
getUserId().then(id => currentUserId.value = id)
</script>

<template>
  <div v-if="groupStore.mylevel === 0" class="mt-5">
    <hr>
    <div v-if="group.invites?.find(invite => invite.id === currentUserId)" class="grow flex gap-4 flex-col">
      <p>Vous avez été invité à rejoindre ce groupe.</p>
      <div class="flex gap-4">
        <DsfrButton label="Accepter l'invitation" @click="groupStore.acceptInvite(group.id)" />
        <DsfrButton label="Décliner l'invitation" secondary @click="groupStore.declineInvite(group.id)" />
      </div>
    </div>
    <div v-else-if="group.requests?.find(request => request.id === currentUserId)" class="grow">
      <p>Vous êtes en attente d'approbation.</p>
      <DsfrButton label="Annuler la demande d'adhésion au groupe" secondary
        @click="groupStore.cancelRequest(group.id, currentUserId as string)" />
    </div>
    <div v-else>
      <p>Vous ne faites pas partie de ce groupe pour le moment.</p>
      <DsfrButton label="Demander à rejoindre le groupe" @click="groupStore.createRequest(group.id, currentUserId as string)" />
      <DsfrAlert small type="info" class="fr-mt-2w">
        En rejoignant ce groupe, vous acceptez de respecter ses conditions d'utilisation.
      </DsfrAlert>
    </div>
  </div>
</template>
