<script setup lang="ts">
import { DsfrButton } from '@gouvminint/vue-dsfr'
import fetcher from '~/composables/useApi.js'

const props = defineProps<{
  member: {
    id: string
    email: string
    first_name?: string
    last_name?: string
    isOwner?: boolean
  }
  amIOwner: boolean
  group: GroupDtoType
}>()

const emits = defineEmits<{
  (e: 'refresh'): void
}>()

const { $keycloak } = useNuxtApp()

async function kickMember(userId: string) {
  await fetcher('/api/v1/groups/membership/kick', {
    method: 'post',
    body: { groupId: props.group.id, userId },
  })
  emits('refresh')
}

async function demoteUser(userId: string) {
  await fetcher('/api/v1/groups/membership/demote', {
    method: 'post',
    body: { groupId: props.group.id, userId },
  })
  emits('refresh')
}

async function promoteUser(userId: string) {
  await fetcher('/api/v1/groups/membership/promote', {
    method: 'post',
    body: { groupId: props.group.id, userId },
  })
  emits('refresh')
}
</script>

<template>
  <div>
    <DsfrButton
      v-if="amIOwner && !member.isOwner"
      secondary
      @click="promoteUser(member.id)"
    >
      Promouvoir
    </DsfrButton>
    <DsfrButton
      v-if="amIOwner && group.owners.length > 1 && member.isOwner && $keycloak?.tokenParsed?.sub !== member.id"
      secondary
      @click="demoteUser(member.id)"
    >
      Rétrograder
    </DsfrButton>
    <DsfrButton
      v-if="amIOwner && $keycloak?.tokenParsed?.sub !== member.id"
      class="fr-ml-2w"
      secondary
      @click="kickMember(member.id)"
    >
      Expulser
    </DsfrButton>
  </div>
</template>
