<script setup lang="ts">
import { DsfrAlert, DsfrBadge, DsfrButton, DsfrFieldset, DsfrSearchBar, DsfrTable, DsfrTile } from '@gouvminint/vue-dsfr'

const groups = ref<ListGroupDtoType>({ invited: [], joined: [] })

onBeforeMount(async () => {
  getGroups()
})
async function getGroups() {
  const { $keycloak } = useNuxtApp()

  const { invited, joined } = await $fetch('/api/v1/groups/list', {
    method: 'get',
    headers: {
      Authorization: `Bearer ${$keycloak?.token}`,
    },
  })
  groups.value = { invited, joined }
}

async function acceptInvite(groupId: string) {
  const { $keycloak } = useNuxtApp()
  await $fetch('/api/v1/groups/invites/accept', {
    method: 'post',
    headers: {
      Authorization: `Bearer ${$keycloak?.token}`,
    },
    body: { groupId },
  })
  getGroups()
}

async function declineInvite(groupId: string) {
  const { $keycloak } = useNuxtApp()
  await $fetch('/api/v1/groups/invites/decline', {
    method: 'post',
    headers: {
      Authorization: `Bearer ${$keycloak?.token}`,
    },
    body: { groupId },
  })
  getGroups()
}

const searchQuery = ref('')
const searchResults = ref<PaginatedResponse<GroupDtoType>>({ results: [], total: 0, page: 1, pageSize: 10 })
const searchRows = computed(() => [
  ...searchResults.value.results.map(group => ([
    group.name,
    group.owners.map(owner => owner.email).join(', '),
  ])),
])
const debouncedSearch = debounce((search: string) => {
  const { $keycloak } = useNuxtApp()
  if (!search) {
    searchResults.value = { results: [], total: 0, page: 1, pageSize: 10 }
    return
  }
  $fetch('/api/v1/groups/search', {
    method: 'post',
    headers: {
      Authorization: `Bearer ${$keycloak?.token}`,
    },
    body: { search },
  }).then((results) => {
    searchResults.value = results
  })
}, 300)
watch(searchQuery, (newQuery) => {
  debouncedSearch(newQuery)
})
</script>

<template>
  <div class="fr-container fr-mt-4w">
    <template v-if="groups.invited.length > 0">
      <DsfrAlert
        v-for="group in groups.invited"
        :key="group.id"
        small
        type="info" class="fr-mb-2w"
      >
        Vous avez été invité à rejoindre le groupe <strong>{{ group.name }}</strong>.
        <DsfrButton size="small" class="fr-ml-2w" @click="acceptInvite(group.id)">
          Accepter
        </DsfrButton>
        <DsfrButton size="small" secondary class="fr-ml-2w" @click="declineInvite(group.id) ">
          Refuser
        </DsfrButton>
      </DsfrAlert>
    </template>
    <DsfrFieldset legend="Rechercher un groupe">
      <DsfrSearchBar
        id="group-search"
        :model-value="searchQuery"
        label="Nom du groupe"
        hint="Rechercher un groupe par son nom"
        type="text"
        name="group-search"
        @update:model-value="(value) => searchQuery = value"
      />
    </DsfrFieldset>
    <template v-if="searchResults.results.length > 0">
      <DsfrTable
        class="w-full"
        caption="Résultats de la recherche"
        no-caption
        title="Résultats de la recherche"
        :search-rows
        :headers="['Nom du groupe', 'Propriétaires']"
        :rows="searchRows"
      />
    </template>

    <div class="flex justify-between items-center mb-4 mt-8">
      <h2>Vos Groupes</h2>
      <div>
        <DsfrButton @click="getGroups" tertiary>
          Actualiser
        </DsfrButton>
      </div>
    </div>
    <div class="gap-8 flex flex-wrap">
      <template v-if="groups.joined.length === 0">
        <DsfrAlert type="info" class="fr-mb-2w">
          Vous ne faites partie d'aucun groupe pour le moment. Créez-en un ou rejoignez-en un !
        </DsfrAlert>
      </template>
      <DsfrTile
        v-for="group in groups.joined"
        :key="group.id"
        :to="`/g/${group.id}`"
        class="h-full"
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
