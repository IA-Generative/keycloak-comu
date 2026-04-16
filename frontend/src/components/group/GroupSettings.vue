<script setup lang="ts">
import { computed } from 'vue'
import { DsfrCallout, DsfrSegmentedSet } from '@gouvminint/vue-dsfr'
import * as backend from '@/composables/useBackend'
import { useGroupStore } from '@/stores/group'
import { yesNoOptions } from '@/shared/schemas'
import type { GroupDtoType } from '@/shared/types'

const groupStore = useGroupStore()
const group = computed(() => groupStore.group as GroupDtoType)
const settings = computed(() => groupStore.group?.settings)

const amIAtLeastAdmin = computed(() => {
  return groupStore.mylevel >= 20
})

async function updateSettings(key: string, value: boolean) {
  await backend.updateGroupSettings(group.value.id, key === 'autoAcceptRequests' ? value : undefined)
  await groupStore.refreshGroup()
}
</script>

<template>
  <DsfrCallout v-if="amIAtLeastAdmin" title="Paramètres" title-tag="h3" class="relative">
    <div class="flex flex-col gap-12 items-start fr-mt-4w">
      <div class="flex flex-row justify-between gap-4 w-full">
        <DsfrSegmentedSet legend="Accepter automatiquement les demandes d'adhésion au groupe" name="settings"
          :model-value="settings?.autoAcceptRequests" :options="yesNoOptions"
          @update:model-value="updateSettings('autoAcceptRequests', $event)" />
      </div>
    </div>
  </DsfrCallout>
</template>

<style>
.pendingDelete {
  background-color: color-mix(in srgb, var(--background-alt-grey), transparent 25%);
}
</style>
