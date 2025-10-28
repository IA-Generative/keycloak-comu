<script setup lang="ts">
import { DsfrButton, DsfrInputGroup } from '@gouvminint/vue-dsfr'
import { ref } from 'vue'
import ERROR_MESSAGES from '~~/shared/ErrorMessages.js'

const props = defineProps<{
  group: GroupDtoType
  canEdit: boolean
}>()

const emits = defineEmits<{
  saveLinks: [string[]]
}>()

const editingLinks = ref(false)

const links = ref(props.group.links)

function addLink() {
  if (links.value.length === 0 || links.value.slice(-1)[0] !== '') {
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
  emits('saveLinks', links.value.filter(link => link.trim() !== ''))
  editingLinks.value = false
}

function cancelEditLinks() {
  editingLinks.value = false
  links.value = props.group.links
}

function extractErrorMessage(link?: string): string {
  console.log(link)
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
</script>

<template>
  <div>
    <div>
      <div
        v-for="(link, idx) in props.group.links"
        :key="idx"
        class="flex flex-row gap-2 items-start mb-2"
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
          target="_blank"
          rel="noopener noreferrer"
        >{{ link }}</a>
        <DsfrButton
          v-if="editingLinks"
          tertiary
          class="mb-4"
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
        @click="editingLinks = true"
      />
    </template>
  </div>
</template>
