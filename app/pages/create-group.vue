<script setup lang="ts">
import { DsfrButton, DsfrFieldset, DsfrInputGroup } from '@gouvminint/vue-dsfr'
import fetcher from '~/composables/useApi.js'
import createGroup from '~/composables/createGroup.js'

const groupName = ref('')
const nameAvailability = ref<'available' | 'unavailable' | 'checking' | 'waiting'>('waiting')

const availableMessages: Record<typeof nameAvailability.value, string> = {
  available: 'Ce nom de groupe est disponible',
  unavailable: 'Ce nom de groupe est déjà pris',
  checking: 'Vérification ...',
  waiting: '',
}

const validation = computed(() => CreateGroupDtoSchema.safeParse({ name: groupName.value }))
const validationMessage = computed(() => {
  if (!groupName.value) return ''
  if (validation.value.success) return ''
  return validation.value.error?.issues?.[0]?.message ?? ''
})

const debouncedSearch = debounce(() => {
  if (!validation.value.success) {
    nameAvailability.value = 'waiting'
    return
  }
  nameAvailability.value = 'checking'
  fetcher('/api/v1/groups/search', {
    method: 'post',
    body: { search: groupName.value, exact: true },
  }).then((data) => {
    nameAvailability.value = data.results.length > 0
      ? 'unavailable'
      : 'available'
  })
}, 300)

watch(groupName, (newQuery) => {
  nameAvailability.value = 'checking'
  if (!newQuery) {
    nameAvailability.value = 'waiting'
    return
  }
  debouncedSearch()
})

async function handleSubmit() {
  const parsed = CreateGroupDtoSchema.safeParse({ name: groupName.value })
  if (!parsed.success) {
    return
  }
  try {
    await createGroup(groupName.value)
  } catch (err: any) {
    console.error(err)
  }
}
</script>

<template>
  <div>
    <h1>Créer un groupe</h1>
    <form @submit.prevent="handleSubmit">
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
              :valid-message="(!validationMessage && nameAvailability === 'available') ? availableMessages.available : ''"
              :error-message="validationMessage || (nameAvailability === 'unavailable' ? availableMessages.unavailable : '')"
              aria-autocomplete="inline"
            />
          </div>
          <div>
            <DsfrButton
              type="submit"
              class="fr-ml-2w fr-mt-1w fr-mt-auto top-0"
              :disabled="nameAvailability !== 'available'"
            >
              Créer
            </DsfrButton>
          </div>
        </div>
      </DsfrFieldset>
    </form>
  </div>
</template>
