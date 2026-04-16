<script setup lang="ts">
import { ref, computed, watch, type ComponentPublicInstance } from 'vue'
import { DsfrButton, DsfrInput } from '@gouvminint/vue-dsfr'
import * as backend from '@/composables/useBackend'
import { addMessage } from '@/composables/snackbarManager'
import { useGroupStore } from '@/stores/group'
import { debounce } from '@/utils/functions'
import type { UserDtoType } from '@/shared/types'

const props = defineProps<{
  groupId: string
}>()

const groupStore = useGroupStore()

const newMemberEmail = ref('')

function manageInviteStatus(status: 'sent' | 'disabled' | 'sendFailed' | 'autoJoin' | undefined) {
  if (status === 'sent') {
    addMessage({ type: 'success', text: 'Invitation envoyée avec succès' })
    return
  }
  if (status === 'sendFailed') {
    addMessage({ type: 'warning', text: 'Invitation créée, mais échec de l\'envoi du mail' })
  }
  if (status === 'autoJoin') {
    addMessage({ type: 'info', text: 'L\'utilisateur a été ajouté automatiquement au groupe' })
  }
}
async function addMember() {
  if (!newMemberEmail.value.trim()) return
  try {
    const mailStatus = await backend.createInvite(props.groupId, newMemberEmail.value.trim())

    manageInviteStatus(mailStatus as any)
    newMemberEmail.value = ''
  } catch (error) {
    addMessage({ type: 'error', text: 'Erreur lors de l\'ajout du membre' })
    console.error('Error adding member:', error)
  }
  await groupStore.refreshGroup()
}

const suggestions = ref<UserDtoType[]>([])

const debouncedSearch = debounce(async (search: string) => {
  if (!search) {
    suggestions.value = []
    return
  }

  const response = await backend.searchUsers(search.trim(), props.groupId)
  suggestions.value = response as UserDtoType[]
}, 300)

watch(newMemberEmail, async (newVal) => {
  if (newVal.length < 3) {
    suggestions.value = []
    return
  }
  debouncedSearch(newVal)
})

const isOpen = computed(() => suggestions.value.length > 0 && newMemberEmail)
const activeIndex = ref(-1)

function moveDown() {
  if (!isOpen.value) return
  activeIndex.value
    = (activeIndex.value + 1) % suggestions.value.length
}

function moveUp() {
  if (!isOpen.value) return
  activeIndex.value
    = (activeIndex.value - 1 + suggestions.value.length)
    % suggestions.value.length
}

function moveTab(e: KeyboardEvent) {
  (e.shiftKey ? moveUp : moveDown)()
}

function selectActive() {
  if (activeIndex.value >= 0) {
    selectOption(suggestions.value[activeIndex.value]!)
  }
}

function selectOption(option: UserDtoType) {
  newMemberEmail.value = option.email
  addMember()
  closeOptions()
}

function closeOptions() {
  newMemberEmail.value = ''
  activeIndex.value = -1
}

const optionRefs = ref<(Element | ComponentPublicInstance | null)[]>([])

// Watcher pour scroller l'option active
watch(activeIndex, (newIndex) => {
  if (newIndex >= 0 && optionRefs.value[newIndex]) {
    // @ts-expect-error
    optionRefs.value[newIndex].scrollIntoView({
      block: 'nearest',
      behavior: 'smooth',
    })
  }
})
</script>

<template>
  <h3>Ajouter un membre</h3>
  <form @submit.prevent="addMember">
    <div class="relative">
      <DsfrInput v-model="newMemberEmail" placeholder="Email de la personne à inviter" autocomplete="off"
        :aria-expanded="isOpen.toString()" aria-haspopup="listbox" aria-controls="options-list"
        @keydown.down.prevent="moveDown" @keydown.up.prevent="moveUp" @keydown.enter.prevent="selectActive"
        @keydown.esc.prevent="closeOptions" @keydown.tab.prevent="moveTab" />
      <div v-if="isOpen" id="user-suggestions" ref="optionsContainer" role="listbox" class="custom-options">
        <div v-for="(user, index) in suggestions" :key="user.id" :ref="el => optionRefs[index] = el" :value="user.email"
          :class="{ active: index === activeIndex }" role="option" @click.prevent="selectOption(user)">
          {{ user.first_name }} {{ user.last_name }} ({{ user.email }})
        </div>
      </div>
      <div v-else-if="newMemberEmail.length >= 3 && suggestions.length === 0" class="custom-options">
        <div role="option" @click.capture="closeOptions">
          Aucun utilisateur trouvé avec cet email
        </div>
      </div>
      <DsfrButton type="submit" :disabled="!newMemberEmail" class="fr-mt-2w">
        Ajouter
      </DsfrButton>
    </div>
  </form>
</template>

<style scoped>
.custom-datalist {
  position: relative;
  width: 200px;
}

.custom-datalist input {
  width: 100%;
  padding: 5px;
  box-sizing: border-box;
}

.custom-options {
  position: absolute;
  width: 100%;
  border: 1px solid #ccc;
  background-color: var(--background-alt-grey);
  max-height: 10rem;
  overflow-y: auto;
  z-index: 10;
}

.custom-options div {
  padding: 5px;
  cursor: pointer;
}

.custom-options div.active {
  background-color: var(--background-contrast-grey);
}
</style>
