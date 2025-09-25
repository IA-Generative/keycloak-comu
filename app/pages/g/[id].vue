<script setup lang="ts">
import { DsfrButton, DsfrFieldset, DsfrInput, DsfrTable } from '@gouvminint/vue-dsfr'
import type { DsfrTableRowProps } from '@gouvminint/vue-dsfr'
import MemberAction from '../../components/MemberAction.vue'
import fetcher from '~/composables/useApi.js'

const id = useRoute().params.id

const group = ref<GroupDtoType | null>(null)
async function fetchData() {
  const data = await fetcher(`/api/v1/groups/:id` as '/api/v1/groups/:id', {
    method: 'get',
    params: { id },
  })
  group.value = data
}

onBeforeMount(fetchData)
const newMemberEmail = ref('')
async function addMember() {
  if (!newMemberEmail.value || typeof id !== 'string') return
  await fetcher('/api/v1/groups/invites/create', {
    method: 'post',
    body: { groupId: id, email: newMemberEmail.value },
  })
  newMemberEmail.value = ''
  await fetchData()
}

const amIOwner = computed(() => {
  const { $keycloak } = useNuxtApp()
  const userId = $keycloak?.tokenParsed?.sub
  return group.value?.owners?.some(owner => owner.id === userId)
})

async function deleteGroup() {
  const data = await fetcher(`/api/v1/groups/delete`, {
    method: 'post',
    body: { groupId: id },
  })
  window.location.assign('/')
  return data
}

async function uninviteMember(userId: string) {
  if (typeof id !== 'string') return
  await fetcher('/api/v1/groups/invites/cancel', {
    method: 'post',
    body: { groupId: id, userId },
  })
  await fetchData()
}

async function leaveGroup() {
  const { $router } = useNuxtApp()
  if (typeof id !== 'string') return
  await fetcher('/api/v1/groups/membership/leave', {
    method: 'post',
    body: { groupId: id },
  })
  $router.push('/')
}

const canLeaveGroup = computed(() => {
  if (!amIOwner.value) return true
  if (group.value && group.value.owners.length > 1) return true
  return false
})

const rows = computed(() => {
  const { $keycloak } = useNuxtApp()
  const personalRow: DsfrTableRowProps = { rowData: [] }
  const myId = $keycloak?.tokenParsed?.sub
  const me = group.value?.members.find(member => member.id === myId)
  if (me) {
    personalRow.rowData = [
      group.value?.owners.some(owner => owner.id === me.id) ? 'Propriétaire' : 'Membre',
      `${me.first_name} ${me.last_name}`,
      me.email,
      {
        component: DsfrButton,
        disabled: !canLeaveGroup.value,
        title: !canLeaveGroup.value ? 'Vous ne pouvez pas quitter le groupe car vous êtes le seul propriétaire.' : '',
        onClick: leaveGroup,
        default: () => 'Quitter le groupe',
        secondary: true,
        text: 'Quitter le groupe',
      },
    ]
  }
  const ownerRows: DsfrTableRowProps[] = []
  for (const owner of group.value?.owners || []) {
    if (owner.id === myId) continue
    ownerRows.push({
      rowData: [
        'Propriétaire',
        `${owner.first_name} ${owner.last_name}`,
        owner.email,
        { component: MemberAction, amIOwner: amIOwner.value, member: { ...owner, isOwner: true }, group: group.value!, onRefresh: () => fetchData() },
      ],
    })
  }
  const memberRows: DsfrTableRowProps[] = []
  for (const member of group.value?.members || []) {
    if (member.id === myId) continue
    if (group.value?.owners.some(owner => owner.id === member.id)) continue
    memberRows.push({
      rowData: [
        'Membre',
        `${member.first_name} ${member.last_name}`,
        member.email,
        { component: MemberAction, amIOwner: amIOwner.value, member: { ...member, isOwner: false }, group: group.value!, onRefresh: () => fetchData() },
      ],
    })
  }
  return [personalRow, ...ownerRows, ...memberRows]
})
</script>

<template>
  <div v-if="group">
    <div class="flex justify-between items-center mb-4">
      <h1>{{ group.name }}</h1>
      <DsfrButton
        tertiary
        @click="fetchData"
      >
        Actualiser
      </DsfrButton>
    </div>
    <div class="flex xl:flex-row flex-col gap-x-16">
      <div>
        <h2>{{ amIOwner ? 'Gérer les membres' : 'Membres' }}</h2>
        <DsfrTable
          no-caption
          title="Membres du groupe"
          :headers="['Rôle', 'Nom', 'Email', '']"
          :rows="rows"
        />
      </div>
      <div
        v-if="amIOwner && group.invites?.length"
        class="mb-16 xl:mb-0"
      >
        <h2>Invitations en attente</h2>
        <DsfrAlert
          v-for="invite in group.invites"
          :key="invite.id"
          small
          type="info"
          class="fr-mb-2w"
        >
          {{ invite.email }}

          <DsfrButton
            size="small"
            secondary
            class="fr-ml-2w"
            @click="uninviteMember(invite.id) "
          >
            Annuler
          </DsfrButton>
        </DsfrAlert>
      </div>
    </div>
    <!-- Formulaire d'ajout de membre -->
    <DsfrFieldset
      v-if="amIOwner"
      legend="Ajouter un membre"
    >
      <form @submit.prevent="addMember">
        <DsfrInput
          v-model="newMemberEmail"
          placeholder="Email de la personne à inviter"
        />
        <DsfrButton
          type="submit"
          :disabled="!newMemberEmail"
          class="fr-mt-2w"
        >
          Ajouter
        </DsfrButton>
      </form>
    </DsfrFieldset>
    <div>
      <DsfrButton
        v-if="amIOwner"
        secondary
        @click="deleteGroup"
      >
        Supprimer le groupe
      </DsfrButton>
    </div>
  </div>
</template>
