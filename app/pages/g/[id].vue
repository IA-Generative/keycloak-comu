<script setup lang="ts">
import { DsfrAlert, DsfrButton, DsfrCallout, DsfrDataTable } from '@gouvminint/vue-dsfr'
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

const { $keycloak, $router } = useNuxtApp()

const userId = computed(() => $keycloak?.tokenParsed?.sub as string)

const mylevel = computed(() => group.value?.members.find(m => m.id === userId.value)?.membershipLevel || 0)

const amIOwner = computed(() => {
  return mylevel.value === 30
})

async function deleteGroup() {
  const data = await fetcher(`/api/v1/groups/delete`, {
    method: 'post',
    body: { groupId: id },
  })
  $router.push('/')
  return data
}

async function uninviteMember(userId: string) {
  await fetcher('/api/v1/groups/invites/cancel', {
    method: 'post',
    body: { groupId: id, userId },
  })
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

function triggerAction<F extends (...args: any[]) => Promise<void>>(fn: F, ...args: Parameters<F>) {
  fn(...args).finally(() => fetchData())
}
</script>

<template>
  <div v-if="group">
    <div class="flex justify-between items-center mb-4">
      <h2>
        <span
          v-if="config.public.keycloak.rootGroupPath !== '/'"
          class="path-prefix"
          title="Groupe racine"
        >{{ config.public.keycloak.rootGroupPath }}</span>
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
        v-if="mylevel >= 20"
        class="mb-16 xl:mb-0"
      >
        <template v-if="group.invites.length > 0">
          <h3>Invitations en attente</h3>
          <div
            class="flex flex-col"
          >
            <div
              v-for="invite in group.invites"
              :key="invite.id"
              small
              type="info"
              class="flex flex-row flex-wrap items-center fr-mb-2w"
            >
              <div>
                {{ invite.email }}
              </div>
              <div>
                <DsfrButton
                  size="small"
                  secondary
                  class="fr-ml-2w"
                  @click="triggerAction(uninviteMember, invite.id)"
                >
                  Annuler
                </DsfrButton>
              </div>
            </div>
          </div>
        </template>
        <template v-if="group.requests.length > 0">
          <h3 class="fr-mt-8w">
            Demandes en attente
          </h3>
          <div
            class="flex flex-col"
          >
            <DsfrAlert
              v-for="request in group.requests"
              :key="request.id"
              small
              type="info"
              class="fr-mb-2w flex flex-row flex-wrap"
            >
              <div>
                {{ request.first_name }} {{ request.last_name }} ({{ request.email }})
              </div>
              <div>
                <DsfrButton
                  size="small"
                  class="fr-ml-2w"
                  @click="triggerAction(acceptRequest, group.id, request.id)"
                >
                  Accepter
                </DsfrButton>
                <DsfrButton
                  size="small"
                  secondary
                  class="fr-ml-2w"
                  @click="triggerAction(declineRequest, group.id, request.id)"
                >
                  Refuser
                </DsfrButton>
              </div>
            </DsfrAlert>
          </div>
        </template>
      </div>
      <div v-else-if="group.invites.find(invite => invite.id === $keycloak?.tokenParsed?.sub)">
        <InviteAlert
          :group="group"
          @refresh="fetchData"
        />
      </div>
      <template
        v-else-if="mylevel === 0"
      >
        <div v-if="group.requests.find(invite => invite.id === $keycloak?.tokenParsed?.sub)">
          <p>Vous êtes en attente d'approbation.</p>
          <DsfrButton
            label="Annuler la demande d'adhésion au groupe"
            secondary
            @click="triggerAction(cancelRequest, group.id, userId)"
          />
        </div>
        <div v-else>
          <p>Vous ne faites pas partie de ce groupe pour le moment.</p>
          <DsfrButton
            label="Demander à rejoindre le groupe"
            @click="triggerAction(createRequest, group.id)"
          />
        </div>
      </template>
    </div>
    <!-- Formulaire d'ajout de membre -->
    <div
      v-if="mylevel >= 20"
    >
      <InviteMember
        :group-id="group.id"
        @refresh="fetchData"
      />
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
}
</style>
