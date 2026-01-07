<script setup lang="ts">
import { DsfrButton, DsfrDataTable, DsfrFieldset, DsfrSearchBar } from '@gouvminint/vue-dsfr'
import type { DsfrDataTableProps } from '@gouvminint/vue-dsfr'
import fetcher from '~/composables/useApi.js'
import createGroup from '~/composables/createGroup.js'

const pageSize = ref(8)
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
const searchResults = ref<PaginatedResponse<{ id: string, name: string, owners: { email: string }[] }>>({ results: [], total: 0, page: 0, pageSize: pageSize.value, next: false })

const exactMatch = computed(() => {
  return searchResults.value.results.find(g => g.name.toLocaleLowerCase() === searchQuery.value.toLocaleLowerCase())
})

const searchRows = computed(() => [
  ...searchResults.value.results.map(group => ({
    name: group.name,
    owners: group.owners.map(o => o.email).join(', '),
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
  searchResults.value.next = response.next
}, 300)

watch(searchQuery, (newQuery) => {
  debouncedSearch(searchQuery.value)
  if (newQuery) {
    $router.push({ query: { q: newQuery } })
  } else {
    $router.push({ query: { q: undefined } })
  }
}, { immediate: true })

const validation = computed(() => {
  return CreateGroupDtoSchema.safeParse({ name: searchQuery.value })
})

function goExactMatch() {
  if (exactMatch.value) {
    $router.push(`/g/${exactMatch.value.id}`)
  }
}
</script>

<template>
  <DsfrFieldset legend="">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div
        class="grow"
      >
        <DsfrSearchBar
          id="group-search"
          :model-value="searchQuery"
          label="Nom du groupe"
          hint="Tapez au moins 3 caractères pour lancer la recherche ou créer un nouveau groupe."
          type="text"
          name="group-search"
          placeholder="Tapez au moins 3 caractères pour lancer la recherche ou créer un nouveau groupe."
          @update:model-value="(value) => searchQuery = value"
          @search="goExactMatch"
        />
      </div>
    </div>
  </DsfrFieldset>
  <div
    v-if="searchResults.results.length > 0"
    class="flex flex-col mt-4"
  >
    <div
      v-if="searchQuery.length >= 3"
      class="self-end right-0"
    >
      <DsfrButton
        :disabled="searchResults.results.find(g => g.name === searchQuery) !== undefined || !validation.success"
        :title="validation.error ? (validation.error.issues[0]?.message || '') : ''"
        @click="() => createGroup(searchQuery)"
      >
        Créer le groupe
      </DsfrButton>
      <span
        v-if="validation.error"
        class="text-red-600 text-sm block text-right mt-1"
      >
        {{ validation.error.issues[0]?.message }}
      </span>
    </div>
    <DsfrDataTable
      title="Résultats de la recherche"
      class="fr-mb-0"
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
          <router-link :to="`/g/${cell as string}`">
            Voir le groupe
          </router-link>
        </template>
        <template v-else-if="colKey === 'owners'">
          {{ cell }}
        </template>
      </template>
    </DsfrDataTable>
    <p
      v-if="searchResults.next"
      class="mt-4 text-center"
    >
      D'autres résultats existent. Affinez votre recherche.
    </p>
  </div>
  <div
    v-else-if="searchQuery.length >= 3"
    class="fr-mt-2w text-center"
  >
    <p
      type="info"
      small
    >
      Aucun groupe trouvé, essayez avec d'autres mots-clés ou créez-le.
    </p>
    <DsfrButton
      :disabled="searchResults.results.find(g => g.name === searchQuery) !== undefined || !validation.success"
      :title="validation.error ? (validation.error.issues[0]?.message || '') : ''"
      @click="() => createGroup(searchQuery)"
    >
      Créer le groupe
    </DsfrButton>
    <span
      v-if="validation.error"
      class="text-red-600 text-sm block mt-1"
    >
      {{ validation.error.issues[0]?.message }}
    </span>
  </div>
</template>

<style lang="css" scoped>
.alert-name {
  position: absolute;
  right: 1rem;
  bottom: -0.25rem;
}
</style>
