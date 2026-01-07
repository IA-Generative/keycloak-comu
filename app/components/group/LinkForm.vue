<script setup lang="ts">
import { DsfrButton, DsfrInputGroup } from '@gouvminint/vue-dsfr'
import { ref } from 'vue'
import ERROR_MESSAGES from '~~/shared/ErrorMessages.js'

const emits = defineEmits<{
  saveLinks: [string[]]
}>()

const groupStore = useGroupStore()
const group = computed(() => groupStore.group as GroupDtoType)
const canEdit = computed(() => groupStore.mylevel >= 20)

const editingLinks = ref(false)

const links = ref(group.value.links)

const isLastLinkEmpty = computed(() => {
  return links.value.length === 0 || links.value.slice(-1)[0] === ''
})

function addLink() {
  if (!isLastLinkEmpty.value) {
    links.value.push('')
  }
}

function removeLink(idx: number) {
  if (links.value.length <= 1) {
    return
  }
  links.value.splice(idx, 1)
}

function saveLinks() {
  const trimmedLinks = links.value.filter(link => link.trim() !== '')
  console.log(trimmedLinks)
  emits('saveLinks', trimmedLinks)
  links.value = trimmedLinks
  editingLinks.value = false
}

function cancelEditLinks() {
  editingLinks.value = false
  links.value = group.value.links
}

function extractErrorMessage(link?: string): string {
  if (!link) {
    return ''
  }
  const parsed = LinkSchema.safeParse(link)
  if (parsed.success) {
    return ''
  }
  const err = parsed.error.issues[0]?.message
  return ERROR_MESSAGES[err as keyof typeof ERROR_MESSAGES]?.fr ?? 'Erreur inconnue'
}

function startEditingLinks() {
  editingLinks.value = true

  if (isLastLinkEmpty.value) {
    links.value.push('')
  }
}
</script>

<template>
  <div>
    <div>
      <div
        v-for="(link, idx) in links"
        :key="idx"
        class="flex flex-row gap-2 items-start"
      >
        <DsfrInputGroup
          v-if="editingLinks"
          v-model="links[idx]"
          class="grow"
          :error-message="extractErrorMessage(links[idx])"
          label="Lien associé au groupe"
          placeholder="Ajouter un lien pertinent pour les membres du groupe (site web, documentation, etc.)."
          type="url"
        />
        <a
          v-else
          :href="link"
          class="mb-2"
          target="_blank"
          rel="noopener noreferrer"
        >{{ link }}</a>
        <DsfrButton
          v-if="editingLinks"
          tertiary
          @click="removeLink(idx)"
        >
          Suppr.
        </DsfrButton>
      </div>
    </div>
    <div
      class="mb-4"
    >
      <DsfrButton
        v-if="editingLinks"
        :disabled="links.slice(-1)[0] === ''"
        tertiary
        @click="addLink"
      >
        Ajouter un lien
      </DsfrButton>
    </div>
    <template
      v-if="canEdit && editingLinks"
    >
      <DsfrButton
        tertiary
        icon="ri-edit-line"
        label="Annuler"
        @click="cancelEditLinks"
      />
      <DsfrButton
        class="fr-ml-2w"
        icon="ri-edit-line"
        label="Sauvegarder"
        @click="saveLinks"
      />
    </template>
    <template
      v-else-if="canEdit"
    >
      <DsfrButton
        tertiary
        class="fr-mt-2w"
        icon="ri-edit-line"
        label="Modifier les liens"
        @click="startEditingLinks"
      />
    </template>
  </div>
</template>
