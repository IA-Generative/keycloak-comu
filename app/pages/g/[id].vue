<script setup lang="ts">
import { DsfrButton, DsfrCallout, DsfrDataTable, DsfrInput } from '@gouvminint/vue-dsfr'
import fetcher from '~/composables/useApi.js'
import { MembershipLevelNames } from '~~/shared/MembershipLevel.js'
import ActionMember from '~/components/ActionMember.vue'

const id = useRoute().params.id
const config = useRuntimeConfig()

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

const { $keycloak } = useNuxtApp()

const mylevel = computed(() => group.value?.members.find(m => m.id === $keycloak?.tokenParsed?.sub)?.membershipLevel || 0)

const amIOwner = computed(() => {
  return mylevel.value === 30
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
  if (group.value && group.value.members.filter(member => member.membershipLevel === 30).length > 1) return true
  return false
})

const membersRows = computed(() => {
  return group.value?.members
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
              group: group.value!,
              mylevel: mylevel.value,
              onRefresh: () => fetchData(),
            }
          : null),
      }
    }) ?? []
})
const headers = [
  { label: '', key: 'identifier' },
  { label: 'Rôle', key: 'role' },
  { label: 'Nom', key: 'name' },
  { label: 'Email', key: 'email' },
  { label: '', key: 'actions' },
]
</script>

<template>
  <div v-if="group">
    <div class="flex justify-between items-center mb-4">
      <h2>
        <span
          class="path-prefix"
          title="Groupe racine"
        >{{ config.public.keycloakRootGroupPath }}{{ config.public.keycloakRootGroupPath.length > 1 ? '/' : '' }}</span>
        <span title="Nom du groupe">{{ group.name }}</span>
      </h2>
      <DsfrButton
        tertiary
        @click="fetchData"
      >
        Actualiser
      </DsfrButton>
    </div>
    <div class="flex xl:flex-row flex-col gap-x-16">
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
      <div
        v-if="mylevel >= 20 && group.invites?.length"
        class="mb-16 xl:mb-0"
      >
        <h3>Invitations en attente</h3>
        <div
          class="flex flex-col"
        >
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
    </div>
    <!-- Formulaire d'ajout de membre -->
    <div
      v-if="amIOwner"
    >
      <h3>Ajouter un membre</h3>
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
    </div>
    <DsfrCallout
      v-if="mylevel > 0"
      class="fr-mt-8w"
      title="Danger Zone"
      title-tag="h3"
    >
      <div class="flex flex-col justify-between gap-4">
        <DsfrButton
          :disabled="!canLeaveGroup"
          :title="!canLeaveGroup ? 'Vous ne pouvez pas quitter le groupe car vous êtes le seul propriétaire.' : ''"
          secondary
          label="Quitter le groupe"
          @click="leaveGroup"
        />
        <template v-if="amIOwner">
          <hr>
          <p>Cette action est irréversible.</p>
          <DsfrButton
            label="Supprimer le groupe"
            :disabled="!amIOwner"
            secondary
            @click="deleteGroup"
          />
        </template>
      </div>
    </DsfrCallout>
  </div>
</template>

<style scoped>
.path-prefix {
  opacity: 0.6;
  font-size: 1rem;
}
</style>
