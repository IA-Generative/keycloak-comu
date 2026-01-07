<script setup lang="ts">
import { DsfrCallout, DsfrSegmentedSet } from '@gouvminint/vue-dsfr'
import fetcher from '~/composables/useApi.js'
import type { GroupSettings } from '~~/shared/types/settings.js'

const groupStore = useGroupStore()
const group = computed(() => groupStore.group as GroupDtoType)
const settings = computed(() => groupStore.group?.settings)

const amIAtLeastAdmin = computed(() => {
  return groupStore.mylevel >= 20
})

async function updateSettings(key: keyof GroupSettings, value: boolean) {
  await fetcher(`/api/v1/groups/update-settings`, {
    method: 'post',
    body: {
      groupId: group.value.id,
      settings: {
        [key]: value,
      },
    },
  })
  await groupStore.refreshGroup()
}
</script>

<template>
  <DsfrCallout
    v-if="amIAtLeastAdmin"
    title="Paramètres"
    title-tag="h3"
    class="relative"
  >
    <div
      class="flex flex-col gap-12 items-start fr-mt-4w"
    >
      <div
        class="flex flex-row justify-between gap-4 w-full"
      >
        <DsfrSegmentedSet
          legend="Accepter automatiquement les demandes d'adhésion au groupe"
          name="settings"
          :model-value="settings?.autoAcceptRequests"
          :options="yesNoOptions"
          @update:model-value="updateSettings('autoAcceptRequests', $event)"
        />
      </div>
    </div>
  </DsfrCallout>
</template>

<style>
.pendingDelete {
  background-color: color-mix(in srgb, var(--background-alt-grey), transparent 25%);
}
</style>
