<script setup lang="ts">
import { DsfrButton, DsfrFieldset, DsfrInputGroup } from '@gouvminint/vue-dsfr'
import { ref } from 'vue'
import fetcher from '~/composables/useApi.js'
import createGroup from '~/composables/createGroup.js'

const groupName = ref('')
const nameAvailabilty = ref<'available' | 'unavailable' | 'checking' | 'waiting'>('waiting')

const availableMessages: Record<typeof nameAvailabilty.value, string> = {
  available: 'Ce nom de groupe est disponible',
  unavailable: 'Ce nom de groupe est déjà pris',
  checking: 'Vérification ...',
  waiting: '',
}
const debouncedSearch = debounce(() => {
  fetcher('/api/v1/groups/search', {
    method: 'post',
    body: { search: groupName.value, exact: true },
  }).then((data) => {
    nameAvailabilty.value = data.results.length > 0
      ? 'unavailable'
      : 'available'
  })
}, 300)

watch(groupName, (newQuery) => {
  nameAvailabilty.value = 'checking'
  if (!newQuery) {
    nameAvailabilty.value = 'waiting'
    return
  }
  debouncedSearch()
})
</script>

<template>
  <div>
    <h1>Créer un groupe</h1>
    <form @submit.prevent="() => createGroup(groupName)">
      <DsfrFieldset
        legend="Information sur le groupe"
      >
        <div class="flex align-items-start">
          <div>
            <DsfrInputGroup
              id="name"
              v-model="groupName"
              placeholder="Mon super groupe"
              label="Nom du groupe"
              required
              :valid-message="nameAvailabilty === 'available' ? availableMessages[nameAvailabilty] : ''"
              :error-message="nameAvailabilty === 'unavailable' ? availableMessages[nameAvailabilty] : ''"
              aria-autocomplete="inline"
            />
          </div>
          <div>
            <DsfrButton
              type="submit"
              class="fr-ml-2w fr-mt-1w fr-mt-auto top-0"
              :disabled="nameAvailabilty !== 'available'"
            >
              Créer
            </DsfrButton>
          </div>
        </div>
      </DsfrFieldset>
    </form>
  </div>
</template>
