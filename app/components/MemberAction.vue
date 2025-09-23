<script setup lang="ts">
import { DsfrButton } from '@gouvminint/vue-dsfr'

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
  const { $keycloak } = useNuxtApp()
  await $fetch('/api/v1/groups/membership/kick', {
    method: 'post',
    body: { groupId: props.group.id, userId },
    headers: {
      Authorization: `Bearer ${$keycloak?.token}`,
    },
  })
  emits('refresh')
}

async function demoteUser(userId: string) {
  await $fetch('/api/v1/groups/membership/demote', {
    method: 'post',
    body: { groupId: props.group.id, userId },
    headers: {
      Authorization: `Bearer ${$keycloak?.token}`,
    },
  })
  emits('refresh')
}

async function promoteUser(userId: string) {
  await $fetch('/api/v1/groups/membership/promote', {
    method: 'post',
    body: { groupId: props.group.id, userId },
    headers: {
      Authorization: `Bearer ${$keycloak?.token}`,
    },
  })
  emits('refresh')
}
</script>

<template>
  <div>
    <DsfrButton v-if="amIOwner && !member.isOwner" @click="promoteUser(member.id)" secondary>
      Promouvoir
    </DsfrButton>
    <DsfrButton v-if="amIOwner && group.owners.length > 1 && member.isOwner && $keycloak?.tokenParsed?.sub !== member.id" @click="demoteUser(member.id)" secondary>
      Rétrograder
    </DsfrButton>
    <DsfrButton v-if="amIOwner && $keycloak?.tokenParsed?.sub !== member.id" @click="kickMember(member.id)" class="fr-ml-2w" secondary>
      Expulser
    </DsfrButton>
  </div>
</template>
