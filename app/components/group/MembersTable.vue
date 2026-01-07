<script setup lang="ts">
import { MembershipLevelNames } from '~~/shared/MembershipLevel.js'
import { DsfrDataTable } from '@gouvminint/vue-dsfr'
import type { DsfrDataTableHeaderCell } from '@gouvminint/vue-dsfr'
import ActionMember from './ActionMember.vue'

const groupStore = useGroupStore()
const group = computed(() => groupStore.group as GroupDtoType)

const { $keycloak } = useNuxtApp()

const userId = computed(() => $keycloak?.tokenParsed?.sub as string)

const mylevel = computed(() => group.value.members.find(m => m.id === userId.value)?.membershipLevel || 0)

const amIOwner = computed(() => {
  return mylevel.value >= 30
})

const membersRows = computed(() => {
  return group.value.members
    .toSorted((a, b) => (a.membershipLevel === b.membershipLevel ? 0 : a.membershipLevel > b.membershipLevel ? -1 : 1))
    .map((member) => {
      return {
        identifier: member.id === $keycloak?.tokenParsed?.sub ? ' (Vous)' : '',
        role: MembershipLevelNames[member.membershipLevel] || 'Inconnu',
        name: {
          text: `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.email,
          id: member.id,
        },
        email: member.email,
        actions: (member.id === $keycloak?.tokenParsed?.sub || amIOwner.value || (mylevel.value >= 20 && mylevel.value > member.membershipLevel)
          ? {
              member: { ...member },
              group: group.value,
              mylevel: mylevel.value,
              onRefresh: () => groupStore.refreshGroup(),
            }
          : null),
      }
    }) ?? []
})
const headers: DsfrDataTableHeaderCell[] = [
  { label: '', key: 'identifier', headerAttrs: { class: 'w-1/12' } },
  { label: 'Rôle', key: 'role', headerAttrs: { class: 'w-1/12' } },
  { label: 'Nom', key: 'name' },
  { label: 'Email', key: 'email' },
  { label: '', key: 'actions', headerAttrs: { class: 'w-1/12' } },
]
</script>

<template>
  <div>
    <h3>{{ amIOwner ? 'Gérer les membres' : 'Membres' }}</h3>
    <DsfrDataTable
      no-caption
      title="Membres du groupe"
      :headers-row="headers"
      :rows="membersRows"
    >
      <template #cell="{ colKey, cell }">
        <template v-if="colKey === 'actions'">
          <ActionMember
            v-if="cell"
            v-bind="cell"
          />
        </template>
        <template v-else-if="colKey === 'email'">
          <a :href="`mailto:${cell as string}`">{{ cell }}</a>
        </template>
        <template v-else-if="colKey === 'name'">
          {{ cell.text }}
        </template>
        <template v-else-if="colKey === 'identifier'">
          <strong>{{ cell }}</strong>
        </template>
        <template v-else>
          {{ cell }}
        </template>
      </template>
    </DsfrDataTable>
  </div>
</template>
