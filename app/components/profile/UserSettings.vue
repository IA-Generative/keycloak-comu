<script setup lang="ts">
import { DsfrSegmentedSet } from '@gouvminint/vue-dsfr'
import fetcher from '~/composables/useApi.js'

const props = defineProps<{
  enabled: boolean | undefined
}>()

const settings = ref<UserSettings | null>(null)

async function getSettings() {
  if (!props.enabled)
    return

  const data = await fetcher('/api/v1/users/settings', {
    method: 'get',
  })
  settings.value = data
}

watch(props, getSettings)
onBeforeMount(getSettings)

async function updateSettings(key: keyof UserSettings, value: boolean) {
  await fetcher('/api/v1/users/settings', {
    method: 'post',
    body: {
      [key]: value,
    },
  })
  await getSettings()
}
</script>

<template>
  <div>
    <h4>Paramètres</h4>
    <div
      v-if="!enabled"
      class="disable-overlay flex items-center justify-center p-5"
    >
      <p class="fr-text--sm fr-text--italic mb-0 text-center">
        Les paramètres utilisateurs sont actuellement désactivés.
        <br>
        Les paramètres déjà enregistrés sont conservés mais nous ne pouvons affirmer qu'ils seront pris en compte.
      </p>
    </div>
    <div
      v-else-if="settings"
      class="relative"
    >
      <DsfrSegmentedSet
        legend="Accepter automatiquement les invitations"
        name="settings"
        :model-value="settings.autoAcceptInvites"
        :options="yesNoOptions"
        @update:model-value="updateSettings('autoAcceptInvites', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.fr-form-group {
  padding-bottom: 1.5rem;
  padding-top: 1.5rem;
  border-bottom: 1px solid #e1e1e1;
}
.fr-form-group:last-of-type {
  padding-top: 0;
  border-bottom: 0;
}
.disable-overlay {
  background-color: color-mix(in srgb, var(--background-alt-grey), transparent 25%);
}
.disable-overlay p {
  margin-bottom: 0 !important;
}
</style>
