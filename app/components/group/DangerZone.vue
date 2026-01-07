<script setup lang="ts">
import { DsfrButton, DsfrCallout } from '@gouvminint/vue-dsfr'
import fetcher from '~/composables/useApi.js'

const groupStore = useGroupStore()
const group = computed(() => groupStore.group)

const { $router } = useNuxtApp()

const amIOwner = computed(() => groupStore.mylevel >= 30)
// const canLeaveGroup = computed(() => {
//   if (!amIOwner.value) return true
//   if (group.value && group.value.members.filter(member => member.membershipLevel === 30).length > 1) return true
//   return false
// })

type Action = 'idle' | 'pendingDelete' | 'deleting'
const actionInProgress = ref<Action>('idle')

async function deleteGroup(confirm: boolean) {
  if (!confirm) {
    actionInProgress.value = 'pendingDelete'
    return
  }
  const data = await fetcher(`/api/v1/groups/delete`, {
    method: 'post',
    body: { groupId: group.value?.id },
  })
  $router.push('/')
  return data
}
</script>

<template>
  <DsfrCallout
    v-if="groupStore.mylevel > 0"
    title="Zone de danger"
    title-tag="h3"
    class="relative"
  >
    <div
      v-if="actionInProgress === 'pendingDelete'"
      class="fr-mb-2w flex flex-col justify-center items-center gap-2 w-full h-full absolute top-0 left-0 p-4 rounded-lg shadow-lg z-10"
      :class="{
        [actionInProgress]: true,
      }"
    >
      <p class="fr-mb-0 text-wrap text-red-600 font-bold text-center">
        Êtes-vous sûr de vouloir supprimer ce groupe ?<br>
        Toutes les ressources du groupe seront supprimées.<br>
        Cette action est irréversible.
      </p>
      <div class="flex flex-row gap-2">
        <DsfrButton
          secondary
          title="Annuler la suppression"
          @click="() => { actionInProgress = 'idle' }"
        >
          Annuler
        </DsfrButton>
        <DsfrButton
          class="bg-red-600 border-red-600 hover:bg-red-700 hover:border-red-700"
          title="Confirmer la suppression"
          @click="() => deleteGroup(true)"
        >
          Confirmer
        </DsfrButton>
      </div>
    </div>
    <div
      class="flex flex-col gap-12 items-start fr-mt-4w"
      :class="{ 'blur-sm': actionInProgress !== 'idle' }"
    >
      <div
        v-if="amIOwner"
        class="flex flex-row justify-between gap-4 w-full"
      >
        <div>
          <h6>Supprimer le groupe</h6>
          <p class="fr-text--xs">
            Cette action est irréversible. Toutes les ressources du groupe
            seront supprimées.
          </p>
        </div>
        <DsfrButton
          label="Supprimer le groupe"
          :disabled="!amIOwner"
          secondary
          @click="deleteGroup(false)"
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
