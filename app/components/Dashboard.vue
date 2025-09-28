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
</script>

<template>
  <div class="fr-container fr-mt-4w">
    <template v-if="groups.invited.length > 0">
      <InviteAlert
        v-for="group in groups.invited"
        :key="group.id"
        :group="group"
        @refresh="getGroups"
      />
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
