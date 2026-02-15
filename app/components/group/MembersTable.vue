<script setup lang="ts">
import { MembershipLevelNames } from '~~/shared/MembershipLevel.js'
import { DsfrButton, DsfrDataTable, DsfrModal } from '@gouvminint/vue-dsfr'
import type { DsfrDataTableHeaderCell } from '@gouvminint/vue-dsfr'
import ActionMember from './ActionMember.vue'

const groupStore = useGroupStore()
const group = computed(() => groupStore.group as GroupDtoType)
const pendingLeave = ref(false)

const { $keycloak } = useNuxtApp()

const userId = computed(() => $keycloak?.tokenParsed?.sub as string)

const mylevel = computed(() => group.value.members.find(m => m.id === userId.value)?.membershipLevel || 0)

const amIOwner = computed(() => {
  return mylevel.value >= 30
})

const membersRows = computed(() => {
  return group.value.members
    .toSorted((a, b) => {
      if (a.membershipLevel === b.membershipLevel) {
        if (userId.value === a.id)
          return -1
        if (userId.value === b.id)
          return 1
        const fullNameA = `${a.first_name || ''} ${a.last_name || ''}`.trim()
        const fullNameB = `${b.first_name || ''} ${b.last_name || ''}`.trim()
        if (fullNameA && fullNameB)
          return fullNameA.localeCompare(fullNameB)
        return a.email.localeCompare(b.email)
      }
      if (a.membershipLevel > b.membershipLevel)
        return -1
      return 1
    })
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
              member,
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
const currentPage = ref<number>(0)
const rowsPerPage = ref<number>(20)
</script>

<template>
  <div>
    <div class="flex justify-between gap-5 flex-wrap">
      <h3>{{ amIOwner ? 'Gérer les membres' : 'Membres' }}</h3>
      <p>Total: {{ membersRows.length }}</p>
    </div>
    <div>
      <DsfrDataTable
        v-model:current-page="currentPage"
        v-model:rows-per-page="rowsPerPage"
        no-caption
        title="Membres du groupe"
        :headers-row="headers"
        :rows="membersRows"
        pagination
        :pagination-options="[10, 20, 50, 100]"
      >
        <template #cell="{ colKey, cell }">
          <template v-if="colKey === 'actions'">
            <DsfrButton
              v-if="cell.member?.id === userId && mylevel === 10"
              secondary
              size="small"
              @click="pendingLeave = true"
            >
              Quitter
            </DsfrButton>
            <ActionMember
              v-else-if="cell"
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
    <DsfrModal
      v-if="pendingLeave"
      v-model:opened="pendingLeave"
      title=""
      @close="pendingLeave = false"
    >
      <template #default>
        <p>Êtes-vous sûr de vouloir quitter ce groupe ?</p>
        <div
          class="flex gap-4"
        >
          <DsfrButton
            type="button"
            label="Quitter"
            @click="groupStore.leaveGroup(); pendingLeave = false"
          />
          <DsfrButton
            type="button"
            secondary
            label="Annuler"
            @click="pendingLeave = false"
          />
        </div>
      </template>
    </DsfrModal>
  </div>
</template>

<style>
select[id$="pagination-options"] {
  max-width: 5.5rem;
}
div.fr-table__wrapper+div>div {
  flex-direction: column;
  justify-content: center !important;
  gap: 0.5rem;
}
div.fr-table__wrapper+div>div div {
  flex-grow: 0;
}

div.fr-table__wrapper+div>div div:nth-child(1) {
  justify-self: end !important;
  right: 0;
}

div.fr-table__wrapper+div>div div:nth-child(2) {
  display: none;
}

div.fr-table__wrapper+div>div div:nth-child(3) {
  align-self: end;
}
</style>
