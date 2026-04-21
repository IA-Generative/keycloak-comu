<script setup lang="ts">
// Business Logic here: backend/internal/groups/README.md
import { ref, computed } from 'vue'
import { MembershipLevelNames } from '@/shared/MembershipLevel'
import { DsfrButton, DsfrDataTable, DsfrModal } from '@gouvminint/vue-dsfr'
import type { DsfrDataTableHeaderCell } from '@gouvminint/vue-dsfr'
import ActionMember from './ActionMember.vue'
import { useGroupStore } from '@/stores/group'
import { getUserId } from '@/composables/useOidc'
import type { GroupMemberDto, GroupDtoType } from '@/shared/types'

const groupStore = useGroupStore()
const group = computed(() => groupStore.group as GroupDtoType)
const pendingLeave = ref(false)

const currentUserId = ref<string | null>(null)
getUserId().then(id => currentUserId.value = id)

const mylevel = computed(() => group.value.members?.find(m => m.id === currentUserId.value)?.membershipLevel || 0)

const canManageMembers = computed(() => mylevel.value >= 20)

const amIOwner = computed(() => {
  return mylevel.value >= 30
})

// eslint-disable-next-line ts/consistent-type-definitions
type MemberRow = {
  identifier: string
  role: { text: string, value: number }
  lastName: { text: string, id: string }
  firstName: { text: string, id: string }
  email: string
  actions: { member: GroupMemberDto, group: GroupDtoType, mylevel: number } | undefined
}
const membersRows = computed<MemberRow[]>(() => {
  return (group.value.members ?? [])
    .map((member) => {
      return {
        identifier: member.id === currentUserId.value ? ' (Vous)' : '',
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
        actions: (member.id === currentUserId.value || amIOwner.value || (mylevel.value >= 20 && mylevel.value > member.membershipLevel)
          ? {
            member,
            group: group.value,
            mylevel: mylevel.value,
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
      <h3>{{ canManageMembers ? 'Gérer les membres' : 'Membres' }}</h3>
      <p>Total: {{ membersRows.length }}</p>
    </div>
    <div>
      <DsfrDataTable v-model:current-page="currentPage" v-model:rows-per-page="rowsPerPage" v-model:sorted-by="sortBy"
        no-caption title="Membres du groupe" :headers-row="headers" :rows="membersRows" pagination
        :pagination-options="[10, 20, 50, 100]" :sortable-rows="['lastName', 'firstName', 'email', 'role']"
        :sorted-desc="sortDesc" :sort-fn="(a: unknown, b: unknown) => sortFn(a as MemberRow, b as MemberRow)">
        <template #cell="{ colKey, cell }">
          <template v-if="colKey === 'actions'">
            <DsfrButton v-if="(cell as MemberRow['actions'])?.member?.id === currentUserId && mylevel === 10" secondary
              size="small" @click="pendingLeave = true">
              Quitter
            </DsfrButton>
            <ActionMember v-else-if="(cell as MemberRow['actions'])" :member="(cell as MemberRow['actions'])!.member"
              :group="(cell as MemberRow['actions'])!.group" :mylevel="(cell as MemberRow['actions'])!.mylevel" />
          </template>
          <template v-else-if="colKey === 'email'">
            <a :href="`mailto:${cell as string}`">{{ cell }}</a>
          </template>
          <template v-else-if="colKey === 'lastName'">
            {{ (cell as MemberRow['lastName']).text }}
          </template>
          <template v-else-if="colKey === 'firstName'">
            {{ (cell as MemberRow['firstName']).text }}
          </template>
          <template v-else-if="colKey === 'identifier'">
            <strong>{{ cell }}</strong>
          </template>
          <template v-else-if="colKey === 'role'">
            {{ (cell as MemberRow['role']).text }}
          </template>
          <template v-else>
            {{ cell }}
          </template>
        </template>
      </DsfrDataTable>
    </div>
    <DsfrModal v-if="pendingLeave" v-model:opened="pendingLeave" title="" @close="pendingLeave = false">
      <template #default>
        <p>Êtes-vous sûr de vouloir quitter ce groupe ?</p>
        <div class="flex gap-4">
          <DsfrButton type="button" label="Quitter" @click="groupStore.leaveGroup(); pendingLeave = false" />
          <DsfrButton type="button" secondary label="Annuler" @click="pendingLeave = false" />
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
