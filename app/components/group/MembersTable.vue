<script setup lang="ts">
import { MembershipLevelNames } from '~~/shared/MembershipLevel.js'
import { DsfrButton, DsfrDataTable, DsfrModal } from '@gouvminint/vue-dsfr'
import type { DsfrDataTableHeaderCell } from '@gouvminint/vue-dsfr'
import ActionMember from './ActionMember.vue'
import type { GroupMemberDto } from '~~/shared/GroupSchema.js'

const groupStore = useGroupStore()
const group = computed(() => groupStore.group as GroupDtoType)
const pendingLeave = ref(false)

const { $keycloak } = useNuxtApp()

const userId = computed(() => $keycloak?.tokenParsed?.sub as string)

const mylevel = computed(() => group.value.members.find(m => m.id === userId.value)?.membershipLevel || 0)

const amIOwner = computed(() => {
  return mylevel.value >= 30
})

// don't know why but an interface cause type error in DsfrDataTable ¯\_(ツ)_/¯
// eslint-disable-next-line ts/consistent-type-definitions
type MemberRow = {
  identifier: string
  role: { text: string, value: number }
  lastName: { text: string, id: string }
  firstName: { text: string, id: string }
  email: string
  actions: { member: GroupMemberDto, group: GroupDtoType, mylevel: number, onRefresh: () => void } | undefined
}
const membersRows = computed<MemberRow[]>(() => {
  return group.value.members
    .map((member) => {
      return {
        identifier: member.id === $keycloak?.tokenParsed?.sub ? ' (Vous)' : '',
        role: {
          text: MembershipLevelNames[member.membershipLevel] || 'Inconnu',
          value: member.membershipLevel,
        },
        lastName: {
          text: `${member.last_name || ''}`.trim(),
          id: member.id,
        },
        firstName: {
          text: `${member.first_name || ''}`.trim(),
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
          : undefined),
      }
    }) ?? []
})
const headers: DsfrDataTableHeaderCell[] = [
  { label: '', key: 'identifier', headerAttrs: { class: 'w-1/12' } },
  { label: 'Rôle', key: 'role', headerAttrs: { class: 'w-1/12' } },
  { label: 'Nom', key: 'lastName' },
  { label: 'Prénom', key: 'firstName' },
  { label: 'Email', key: 'email' },
  { label: '', key: 'actions', headerAttrs: { class: 'w-1/12' } },
]
const currentPage = ref<number>(0)
const rowsPerPage = ref<number>(20)

const sortBy = ref<string>('role')
const sortDesc = ref<boolean>(true)

function sortFn(a: MemberRow, b: MemberRow): number {
  switch (sortBy.value) {
    case 'role':
      return sortDesc.value
        ? (a.role.value) - (b.role.value)
        : (b.role.value) - (a.role.value)
    case 'email':
      return sortDesc.value
        ? a[sortBy.value].localeCompare(b[sortBy.value])
        : b[sortBy.value].localeCompare(a[sortBy.value])
    case 'lastName':
    case 'firstName': {
      const nameA = a[sortBy.value]?.text || ''
      const nameB = b[sortBy.value]?.text || ''
      return sortDesc.value
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA)
    }
    default:
      return sortDesc.value
        ? (b.role.value) - (a.role.value)
        : (a.role.value) - (b.role.value)
  }
}
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
        v-model:sorted-by="sortBy"
        no-caption
        title="Membres du groupe"
        :headers-row="headers"
        :rows="membersRows"
        pagination
        :pagination-options="[10, 20, 50, 100]"
        :sortable-rows="['lastName', 'firstName', 'email', 'role']"
        :sorted-desc="sortDesc"
        :sort-fn="(a: unknown, b: unknown) => sortFn(a as MemberRow, b as MemberRow)"
      >
        <template #cell="{ colKey, cell }">
          <template v-if="colKey === 'actions'">
            <DsfrButton
              v-if="(cell as MemberRow['actions'])?.member?.id === userId && mylevel === 10"
              secondary
              size="small"
              @click="pendingLeave = true"
            >
              Quitter
            </DsfrButton>
            <ActionMember
              v-else-if="(cell as MemberRow['actions'])"
              v-bind="(cell as MemberRow['actions'])"
            />
          </template>
          <template v-else-if="colKey === 'email'">
            <a :href="`mailto:${cell as string}`">{{ cell }}</a>
          </template>
          <template v-else-if="colKey === 'lastName'">
            {{ (cell as MemberRow[typeof colKey]).text }}
          </template>
          <template v-else-if="colKey === 'firstName'">
            {{ (cell as MemberRow[typeof colKey]).text }}
          </template>
          <template v-else-if="colKey === 'identifier'">
            <strong>{{ cell }}</strong>
          </template>
          <template v-else-if="colKey === 'role'">
            {{ (cell as MemberRow[typeof colKey]).text }}
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
