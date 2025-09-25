<script setup lang="ts">
import { DsfrAlert, DsfrButton, DsfrTile } from '@gouvminint/vue-dsfr'
import fetcher from '~/composables/useApi.js'

const groups = ref<ListGroupDtoType>({ invited: [], joined: [] })

onBeforeMount(getGroups)

async function getGroups() {
  const data = await fetcher('/api/v1/groups/list', {
    method: 'get',
  })
  groups.value = data
}

async function acceptInvite(groupId: string) {
  await fetcher('/api/v1/groups/invites/accept', {
    method: 'post',
    body: { groupId },
  })
  getGroups()
}

async function declineInvite(groupId: string) {
  await fetcher('/api/v1/groups/invites/decline', {
    method: 'post',
    body: { groupId },
  })
  getGroups()
}
</script>

<template>
  <div class="fr-container fr-mt-4w">
    <template v-if="groups.invited.length > 0">
      <DsfrAlert
        v-for="group in groups.invited"
        :key="group.id"
        small
        type="info"
        class="fr-mb-2w"
      >
        Vous avez été invité à rejoindre le groupe <strong>{{ group.name }}</strong>.
        <DsfrButton
          size="small"
          class="fr-ml-2w"
          @click="acceptInvite(group.id)"
        >
          Accepter
        </DsfrButton>
        <DsfrButton
          size="small"
          secondary
          class="fr-ml-2w"
          @click="declineInvite(group.id) "
        >
          Refuser
        </DsfrButton>
      </DsfrAlert>
    </template>

    <GroupSearchTable />

    <div class="flex justify-between items-center mb-4 mt-8">
      <h2>Vos Groupes</h2>
      <div>
        <DsfrButton
          tertiary
          @click="getGroups"
        >
          Actualiser
        </DsfrButton>
      </div>
    </div>
    <div class="gap-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      <template v-if="groups.joined.length === 0">
        <DsfrAlert
          type="info"
          class="fr-mb-2w"
        >
          Vous ne faites partie d'aucun groupe pour le moment. Créez-en un ou rejoignez-en un !
        </DsfrAlert>
      </template>
      <DsfrTile
        v-for="group in groups.joined"
        :key="group.id"
        :to="`/g/${group.id}`"
        :title="group.name"
        horizontal
      />
    </div>
  </div>
</template>

<style>
.fr-tile__title [target="_blank"]::after {
  display: none;
}

a.fr-tile__link::after {
  display: none;
}

.fr-tile__content {
  padding-bottom: 0 !important;
}

.fr-tile__detail {
  align-items: start;
  height: 100%;
  margin-bottom: 0 !important;
}

#project-list .fr-tile__header {
  display: none;
}
</style>
