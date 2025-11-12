<script setup lang="ts">
import { DsfrAccordion, DsfrButton, DsfrInput, DsfrTag } from '@gouvminint/vue-dsfr'
import fetcher from '~/composables/useApi.js'

import { ref } from 'vue'
import ERROR_MESSAGES from '~~/shared/ErrorMessages.js'
import type { ErrorMessageKey } from '~~/shared/ErrorMessages.js'

const props = defineProps<{
  group: GroupDtoType
  canManage: boolean
}>()

const emits = defineEmits<{
  refresh: []
}>()

const config = useRuntimeConfig()
const rootGroupPrefix = config.public.keycloak.rootGroupPath.endsWith('/')
  ? config.public.keycloak.rootGroupPath
  : `${config.public.keycloak.rootGroupPath}/`

function sortFunction<T extends Record<string, any>>(array: T[], key: keyof T, fallbackKey: keyof T): T[] {
  return array.toSorted((a, b) => (a[key] ?? a[fallbackKey]).localeCompare(b[key] ?? b[fallbackKey]))
}

const groupMembersSorted = computed(() => {
  return sortFunction(props.group.members, 'first_name', 'email')
})

const sortedTeams = computed(() => {
  return sortFunction(props.group.teams, 'name', 'id').map(team => ({
    ...team,
    members: sortFunction(team.members.map(m => groupMembersSorted.value.find(u => u.id === m)) as UserDtoType[], 'first_name', 'email'),
  }))
})

type TeamStatus = 'idle' | 'pendingDelete' | 'deleting'
const teamStatus = ref<Record<string, TeamStatus>>({})

// list of user ids currently highlighted, first key is user id, second key teamId, third key is class name, value is boolean
const usersClass = ref<Record<string, Record<string, Record<string, boolean>>>>({})

const isCreatingTeam = ref(false)

const selectMode = ref(false)

const newGroupName = ref('')
const newGroupNameValidation = computed(() => TeamNameSchema.safeParse(newGroupName.value))

const actual = computed(() => {
  return props.group.teams.reduce((acc, sg) => {
    acc[sg.name] = Array.from(new Set(sg.members))
    return acc
  }, {} as Record<string, string[]>)
})
const wanted = ref(props.group.teams.reduce((acc, sg) => {
  acc[sg.name] = Array.from(new Set(sg.members))
  return acc
}, {} as Record<string, string[]>),
)

async function createTeam() {
  if (!newGroupNameValidation.value.success) return
  await fetcher('/api/v1/groups/edit-team', {
    method: 'post',
    body: {
      parentId: props.group.id,
      name: newGroupName.value,
      members: [],
    },
  })
    .then(() => {
      newGroupName.value = ''
      isCreatingTeam.value = false
    })
    .finally(() => emits('refresh'))
}

async function deleteTeam(name: string, confirm = false) {
  if (!confirm) {
    teamStatus.value[name] = 'pendingDelete'
    return
  }
  try {
    teamStatus.value[name] = 'deleting'
    await fetcher('/api/v1/groups/delete-team', {
      method: 'post',
      body: {
        groupId: props.group.id,
        name,
      },
    })
  } finally {
    emits('refresh')
    delete wanted.value[name]
    delete teamStatus.value[name]
  }
}

function onDragStart(event: DragEvent, id: string) {
  event.dataTransfer?.setData('text/plain', id)
}

const currentDragged = ref<string | null>(null)
function onDragOver(groupName: string) {
  if (currentDragged.value !== groupName) {
    currentDragged.value = groupName
  }
}

function onDragLeave(groupName: string) {
  if (currentDragged.value === groupName) {
    currentDragged.value = null
  }
}

async function removeUserFromTeam(userId: string, teamName: string) {
  if (!props.canManage) return

  wanted.value[teamName] = (wanted.value[teamName] ?? []).filter(id => id !== userId)
}

function onDrop(event: DragEvent, groupName: string) {
  onDragLeave(groupName)
  const userId = event.dataTransfer?.getData('text/plain')

  if (!userId) {
    return
  }
  if (actual.value[groupName]?.includes(userId)) {
    if (!usersClass.value[userId]) {
      usersClass.value[userId] = {}
    }
    if (!usersClass.value[userId][groupName]) {
      usersClass.value[userId][groupName] = {}
    }
    usersClass.value[userId][groupName]['already-in'] = true
    setTimeout(() => { delete usersClass.value[userId]?.[groupName]?.['already-in'] }, 600)
    return
  }
  const wantedGroup = wanted.value[groupName] ?? []
  wantedGroup.push(userId)
  wanted.value[groupName] = wantedGroup
}

watch(wanted, async (newVal) => {
  const wantedEntries = Object.entries(newVal)

  for (const [name, users] of wantedEntries) {
    const userSet = new Set(users)
    const actualSet = new Set(actual.value[name] ?? [])
    if (userSet.difference(actualSet).size === 0 && actualSet.difference(userSet).size === 0) {
      continue
    }
    try {
      await fetcher('/api/v1/groups/edit-team', {
        method: 'post',
        body: {
          parentId: props.group.id,
          name,
          userIds: userSet.values().toArray(),
        },
      })
    } catch (e) {
      console.error('Failed to save team members', e)
    } finally {
      emits('refresh')
    }
  }
}, { deep: true })

const selectedTags = ref<string[]>([])

function addSelectedTags(groupName: string) {
  const wantedGroup = wanted.value[groupName] ?? []
  selectedTags.value.forEach((id) => {
    if (!wantedGroup.includes(id)) {
      wantedGroup.push(id)
    }
  })
  wanted.value[groupName] = wantedGroup
  selectedTags.value = []
  selectMode.value = false
}
function selectTag(userId: string) {
  if (!selectMode.value) {
    selectMode.value = true
  }
  if (selectedTags.value.includes(userId)) {
    selectedTags.value = selectedTags.value.filter(id => id !== userId)
  } else {
    selectedTags.value.push(userId)
  }
}
</script>

<template>
  <DsfrAccordion
    id="team-manager"
    title-tag="h2"
    :title="`Gérer les équipes (${Object.keys(group.teams).length})`"
    :default-opened="false"
  >
    <template #title>
      <h4 class="fr-m-0">
        {{ canManage ? 'Gérer' : 'Voir' }} les équipes ({{ Object.keys(group.teams).length }})
      </h4>
    </template>
    <div
      class="fr-container"
    >
      <!-- Élément draggable -->
      <div
        v-if="Object.keys(group.teams).length"
        class="flex flex-row flex-wrap gap-4 mb-4"
      >
        <template v-if="canManage">
          <DsfrTag
            v-for="member in groupMembersSorted"
            :key="member.id"
            :label="`${member.first_name} ${member.last_name}`"
            draggable="true"
            selectable
            :aria-pressed="selectMode && selectedTags.includes(member.id) ? 'true' : 'false'"
            @dragstart="onDragStart($event, member.id)"
            @click="selectTag(member.id)"
          />
        </template>
      </div>

      <!-- Zone de dépôt stylée DSFR -->
      <div
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        <div
          v-if="canManage"
          class="fr-mb-2w new-group group"
        >
          <form
            class="flex flex-row gap-2"
            @submit.prevent="createTeam"
          >
            <div>
              <DsfrInput
                v-model="newGroupName"
                placeholder="Nom de l'équipe"
                label="Créer une nouvelle équipe"
                label-visible
              />
            </div>
            <DsfrButton
              class="self-start fr-mt-3w"
              title="Créer le groupe"
              :disabled="!newGroupNameValidation.success"
            >
              +
            </DsfrButton>
          </form>
          <span
            v-if="!newGroupNameValidation.success && newGroupName"
            class="fr-text--xs fr-error-text"
          >{{ ERROR_MESSAGES[newGroupNameValidation.error.issues[0]?.message as ErrorMessageKey].fr }}</span>
        </div>
        <div
          v-for="(team) in sortedTeams"
          :key="team.id"
          class="fr-mb-2w group flex flex-col relative gap-4"
          :class="{ 'fr-upload--dragover': currentDragged === team.name }"
          @dragover.prevent="onDragOver(team.name)"
          @dragleave="onDragLeave(team.name)"
          @drop="onDrop($event, team.name)"
        >
          <div
            v-if="teamStatus[team.name] === 'pendingDelete'"
            class="fr-mb-2w flex flex-col justify-center items-center gap-2 w-full h-full absolute bg-white/75 top-0 left-0 p-4 rounded-lg shadow-lg z-10"
          >
            <div class="fr-mb-0 text-wrap text-red-600 font-bold">
              Êtes-vous sûr de vouloir supprimer cette équipe ?
            </div>
            <div class="flex flex-row gap-2">
              <DsfrButton
                secondary
                title="Annuler la suppression"
                @click="() => { teamStatus[team.name] = 'idle' }"
              >
                Annuler
              </DsfrButton>
              <DsfrButton
                class="bg-red-600 border-red-600 hover:bg-red-700 hover:border-red-700"
                title="Confirmer la suppression"
                @click="() => deleteTeam(team.name, true)"
              >
                Confirmer
              </DsfrButton>
            </div>
          </div>
          <div
            class="w-full flex flex-col h-full gap-4"
            :class="{ 'blur-sm': ['pendingDelete'].includes(teamStatus[team.name] ?? 'idle') }"
          >
            <div
              class="flex flex-wrap justify-between align-start w-full"
            >
              <div class="fr-mb-0 text-wrap fr-text--lg font-bold">
                {{ team.name }}
              </div>
              <DsfrTag
                v-if="canManage"
                icon-only
                selectable
                icon="ri-close-line"
                @click.capture="() => deleteTeam(team.name, false)"
              />
            </div>
            <div class="grow">
              <label
                v-if="!team.members.length"
                class="fr-label text-sm italic"
              >Déposez ici de nouveaux membres</label>
              <div
                v-else
                class="fr-upload__msg"
              >
                <div class="flex flex-row  flex-wrap gap-4">
                  <DsfrTag
                    v-for="user in team.members.toSorted()"
                    :key="user.id"
                    :icon="canManage ? 'ri-close-line' : undefined"
                    :selectable="canManage"
                    :label="`${user.first_name} ${user.last_name}`"
                    :class="usersClass[user.id]?.[team.name]"
                    @click="() => removeUserFromTeam(user.id, team.name)"
                  />
                </div>
              </div>
            </div>
            <div class="flex flex-row justify-between w-full group-footer">
              <label
                class="fr-label text-sm italic align-end opacity-75"
              >
                {{ rootGroupPrefix }}{{ group.name }}/{{ team.name }}
              </label>

              <div
                v-if="selectMode && selectedTags.length"
              >
                <DsfrButton
                  class=""
                  secondary
                  size="sm"
                  label="Ajouter ici"
                  @click="() => addSelectedTags(team.name)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DsfrAccordion>
</template>

<style deep>
.fr-input {
  margin-top: 0 !important;
}
.group {
  border: 3px solid var(--background-alt-blue-france);
  border-radius: var(--border-radius-3x);
  padding: 1rem;
  min-height: 8rem;
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: start;
  text-align: center;
  cursor: pointer;
  transition: background-color 0.3s, border-color 0.3s;
}
.new-group {
  align-items: center;
  justify-content: center;
  border: 5px dashed var(--background-alt-blue-france);
  border-radius: 1rem;
}
.new-group form {
  gap: 2rem;
}
/* Effet visuel quand on est en dragover */
.fr-upload--dragover {
  outline: 2px dashed var(--background-action-high-blue-france);
  background-color: var(--background-alt-blue-france);
}
.already-in {
  background-color: var(--background-action-high-red-marianne-active) !important;
  color: white !important;
  transform: scale(1.1) !important;
  transition: transform 0.3s, background-color 0.3s !important;
}
.fr-tag {
  transition: transform 0.3s, background-color 0.3s !important;

}
.group-footer {
  border-top: 1px solid #e5e7eb;
  padding-top: 0.5rem;
}
</style>
