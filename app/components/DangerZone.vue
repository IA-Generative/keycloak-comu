<script setup lang="ts">
import { DsfrButton, DsfrCallout } from '@gouvminint/vue-dsfr'
import fetcher from '~/composables/useApi.js'

const props = defineProps<{
  group: GroupDtoType
}>()

const { $keycloak, $router } = useNuxtApp()
const userId = computed(() => $keycloak?.tokenParsed?.sub as string)

const mylevel = computed(() => props.group.members.find(m => m.id === userId.value)?.membershipLevel || 0)

const amIOwner = computed(() => {
  return mylevel.value === 30
})
const canLeaveGroup = computed(() => {
  if (!amIOwner.value) return true
  if (props.group && props.group.members.filter(member => member.membershipLevel === 30).length > 1) return true
  return false
})

async function deleteGroup() {
  const data = await fetcher(`/api/v1/groups/delete`, {
    method: 'post',
    body: { groupId: props.group.id },
  })
  $router.push('/')
  return data
}

async function leaveGroup() {
  const { $router } = useNuxtApp()
  await fetcher('/api/v1/groups/membership/leave', {
    method: 'post',
    body: { groupId: props.group.id },
  })
  $router.push('/')
}
</script>

<template>
  <DsfrCallout
    v-if="mylevel > 0"
    title="Zone de danger"
    title-tag="h3"
  >
    <div class="flex flex-col gap-12 items-start fr-mt-4w">
      <div class="flex flex-row justify-between gap-4 w-full">
        <div>
          <h6>Quitter le groupe</h6>
          <p class="fr-text--xs">
            Vous ne pourrez plus accéder aux ressources du groupe
          </p>
        </div>
        <DsfrButton
          :disabled="!canLeaveGroup"
          :title="!canLeaveGroup ? 'Vous ne pouvez pas quitter le groupe car vous êtes le seul propriétaire.' : ''"
          secondary
          label="Quitter"
          @click="leaveGroup"
        />
      </div>
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
          @click="deleteGroup"
        />
      </div>
    </div>
  </DsfrCallout>
</template>
