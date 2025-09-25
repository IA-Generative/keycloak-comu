<script setup lang="ts">
import { DsfrAlert, DsfrButton, DsfrDataTable, DsfrFieldset, DsfrSearchBar } from '@gouvminint/vue-dsfr'
import type { DsfrDataTableProps } from '@gouvminint/vue-dsfr'
import fetcher from '~/composables/useApi.js'
import createGroup from '~/composables/createGroup.js'

const pageSize = ref(5)
const headers: DsfrDataTableProps['headersRow'] = [
  {
    label: 'Nom du groupe',
    key: 'name',
  },
  {
    label: 'Propriétaires',
    key: 'owners',
  },
  {
    label: ' ',
    key: 'id',
  },
]
const { $router } = useNuxtApp()
const searchQuery = ref($router.currentRoute.value.query.q as string || '')
const searchResults = ref<PaginatedResponse<GroupDtoType>>({ results: [], total: 0, page: 0, pageSize: pageSize.value })

const searchRows = computed(() => [
  ...searchResults.value.results.map(group => ({
    name: group.name,
    owners: group.members
      .filter(member => member.membershipLevel >= 20)
      .map(owner => owner.email)
      .join(', '),
    id: group.id,
  })),
])

const debouncedSearch = debounce(async (search: string) => {
  if (!search) {
    searchResults.value.results = []
    searchResults.value.page = 0
    searchResults.value.total = 0
    searchResults.value.pageSize = pageSize.value
    return
  }

  const response = await fetcher('/api/v1/groups/search', {
    method: 'post',
    body: {
      search,
      page: 0,
      pageSize: pageSize.value,
    },
  })
  searchResults.value.results = response.results
  searchResults.value.total = Number(response.total)
}, 300)

watch(searchQuery, (newQuery) => {
  debouncedSearch(searchQuery.value)
  if (newQuery) {
    $router.push({ query: { q: newQuery } })
  } else {
    $router.push({ query: { q: undefined } })
  }
}, { immediate: true })
</script>

<template>
  <DsfrFieldset legend="">
    <DsfrSearchBar
      id="group-search"
      :model-value="searchQuery"
      label="Nom du groupe"
      hint="Rechercher un groupe par son nom"
      type="text"
      name="group-search"
      placeholder="Rechercher un groupe"
      @update:model-value="(value) => searchQuery = value"
    />
  </DsfrFieldset>
  <template v-if="searchResults.results.length > 0">
    <DsfrDataTable
      title="Résultats de la recherche"
      :headers-row="headers"
      :rows="searchRows"
      row-key="key"
      no-caption
    >
      <template #header="{ label }">
        <em>{{ label }}</em>
      </template>
      <template #cell="{ colKey, cell }">
        <template v-if="colKey === 'name'">
          <strong>{{ cell }}</strong>
        </template>
        <template v-if="colKey === 'id'">
          <a :href="`/g/${cell as string}`">Voir le groupe</a>
        </template>
        <template v-else-if="colKey === 'owners'">
          {{ cell }}
        </template>
      </template>
    </DsfrDataTable>
  </template>
  <template v-else-if="searchQuery">
    <DsfrAlert
      type="info"
      class="fr-mb-2w"
    >
      Aucun groupe trouvé pour la recherche "{{ searchQuery }}"
      <DsfrButton
        size="small"
        class="fr-ml-2w"
        @click="() => createGroup(searchQuery)"
      >
        Le créer
      </DsfrButton>
    </DsfrAlert>
  </template>
</template>
