<script setup lang="ts">
import { DsfrButton, DsfrFieldset, DsfrInput, DsfrTable } from '@gouvminint/vue-dsfr'
import MemberAction from '../../components/MemberAction.vue'

const id = useRoute().params.id

const group = ref<GroupDtoType | null>(null)
async function fetchData() {
  const { $keycloak } = useNuxtApp()
  const data = await $fetch(`/api/v1/groups/${id}`, {
    method: 'get',
    headers: {
      Authorization: `Bearer ${$keycloak?.token}`,
    },
  }) as GroupDtoType
  group.value = data
}

onBeforeMount(fetchData)
const newMemberEmail = ref('')
async function addMember() {
  const { $keycloak } = useNuxtApp()
  if (!newMemberEmail.value || typeof id !== 'string') return
  await $fetch('/api/v1/groups/invites/create', {
    method: 'post',
    body: { groupId: id, email: newMemberEmail.value },
    headers: {
      Authorization: `Bearer ${$keycloak?.token}`,
    },
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
  const { $keycloak } = useNuxtApp()
  const data = await $fetch(`/api/v1/groups/delete`, {
    method: 'post',
    body: { groupId: id },
    headers: {
      Authorization: `Bearer ${$keycloak?.token}`,
    },
  })
  window.location.assign('/')
  return data
}

async function uninviteMember(userId: string) {
  const { $keycloak } = useNuxtApp()
  if (typeof id !== 'string') return
  await $fetch('/api/v1/groups/invites/cancel', {
    method: 'post',
    body: { groupId: id, userId },
    headers: {
      Authorization: `Bearer ${$keycloak?.token}`,
    },
  })
  await fetchData()
}

async function leaveGroup() {
  const { $keycloak } = useNuxtApp()
  if (typeof id !== 'string') return
  await $fetch('/api/v1/groups/membership/leave', {
    method: 'post',
    body: { groupId: id },
    headers: {
      Authorization: `Bearer ${$keycloak?.token}`,
    },
  })
  window.location.assign('/')
}

const canLeaveGroup = computed(() => {
  if (!amIOwner.value) return true
  if (group.value && group.value.owners.length > 1) return true
  return false
})

const rows = computed(() => [
  ...(group.value?.members.map(member => ([
    group.value?.owners.some(owner => owner.id === member.id) ? 'Propriétaire' : 'Membre',
    `${member.first_name} ${member.last_name}`,
    member.email,
    {
      component: MemberAction,
      amIOwner: amIOwner.value,
      member: { ...member, isOwner: group.value?.owners.some(owner => owner.id === member.id) },
      group: group.value!,
      onRefresh: () => fetchData(),
    },
  ])) || []),
])
</script>

<template>
  <div v-if="group">
    <div class="flex justify-between items-center mb-4">
      <h1>{{ group.name }}</h1>
      <DsfrButton tertiary @click="fetchData">
        Actualiser
      </DsfrButton>
    </div>
    <div class="flex xl:flex-row flex-col gap-16">
      <div>
        <h2>Gérer les membres</h2>
        <DsfrTable
          no-caption
          title="Membres du groupe"
          :headers="['Rôle', 'Nom', 'Email', 'Actions']"
          :rows="rows"
        />
      </div>
      <div v-if="amIOwner && group.invites?.length">
        <h2>Invitations en attente</h2>
        <DsfrAlert
          v-for="invite in group.invites"
          :key="invite.id"
          small
          type="info" class="fr-mb-2w"
        >
          {{ invite.email }}

          <DsfrButton size="small" secondary class="fr-ml-2w" @click="uninviteMember(invite.id) ">
            Annuler
          </DsfrButton>
        </DsfrAlert>
      </div>
    </div>
    <!-- Formulaire d'ajout de membre -->
    <DsfrFieldset>
      <form @submit.prevent="addMember">
        <DsfrInput v-model="newMemberEmail" placeholder="Email de la personne à inviter" />
        <DsfrButton type="submit" :disabled="!newMemberEmail" class="fr-mt-2w">
          Ajouter
        </DsfrButton>
      </form>
    </DsfrFieldset>
    <div>
      <DsfrButton
        :disabled="!canLeaveGroup"
        :title="!canLeaveGroup ? 'Vous ne pouvez pas quitter le groupe car vous êtes le seul propriétaire.' : ''"
        @click="leaveGroup"
      >
        Quitter le groupe
      </DsfrButton>
      <DsfrButton v-if="amIOwner" class="fr-ml-2w" secondary @click="deleteGroup">
        Supprimer le groupe
      </DsfrButton>
    </div>
  </div>
</template>
