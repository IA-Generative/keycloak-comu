<script setup lang="ts">
import { computed } from 'vue'
import { DsfrButton } from '@gouvminint/vue-dsfr'
import * as backend from '@/composables/useBackend'
import { useGroupStore } from '@/stores/group'
import type { GroupDtoType } from '@/shared/types'

const groupStore = useGroupStore()
const group = computed(() => groupStore.group as GroupDtoType)

async function uninviteMember(userId: string) {
  await backend.cancelInvite(group.value.id, userId)
  await groupStore.refreshGroup()
}

async function acceptRequest(userId: string) {
  await backend.acceptJoinRequest(group.value.id, userId)
  await groupStore.refreshGroup()
}

async function declineRequest(userId: string) {
  await backend.declineJoinRequest(group.value.id, userId)
  await groupStore.refreshGroup()
}
</script>

<template>
  <div v-if="group.invites?.length > 0">
    <h3>Invitations en attente</h3>
    <div class="flex flex-col">
      <div v-for="invite in group.invites" :key="invite.id" small type="info"
        class="flex flex-row flex-wrap items-center fr-mb-2w">
        <div>
          {{ invite.email }}
        </div>
        <div>
          <DsfrButton size="small" secondary class="fr-ml-2w" @click="uninviteMember(invite.id)">
            Annuler
          </DsfrButton>
        </div>
      </div>
    </div>
  </div>
  <div v-if="group.requests?.length > 0">
    <h3>Demandes d'adhésion</h3>
    <div class="flex flex-col">
      <div v-for="request in group.requests" :key="request.id" small type="info"
        class="flex flex-row flex-wrap items-center fr-mb-2w">
        <div>
          {{ request.email }}
        </div>
        <div>
          <DsfrButton size="small" secondary class="fr-ml-2w" @click="acceptRequest(request.id)">
            Accepter
          </DsfrButton>
          <DsfrButton size="small" secondary class="fr-ml-2w" @click="declineRequest(request.id)">
            Décliner
          </DsfrButton>
        </div>
      </div>
    </div>
  </div>
</template>
