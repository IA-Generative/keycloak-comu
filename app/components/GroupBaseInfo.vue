<script setup lang="ts">
import { DsfrButton, DsfrInput } from '@gouvminint/vue-dsfr'
import fetcher from '~/composables/useApi.js'

const props = defineProps<{
  group: GroupDtoType
}>()

const emit = defineEmits<{
  refresh: []
}>()
const { $keycloak } = useNuxtApp()

const userId = computed(() => $keycloak?.tokenParsed?.sub as string)

const mylevel = computed(() => props.group.members.find(m => m.id === userId.value)?.membershipLevel || 0)

const descriptionRef = ref(props.group.description)

const isEditingDescription = ref(false)
function editDescription() {
  fetcher('/api/v1/groups/edit', {
    method: 'post',
    body: { groupId: props.group.id, description: descriptionRef.value.trim() },
  }).finally(() => {
    isEditingDescription.value = false
    emit('refresh')
  })
}
</script>

<template>
  <div class="flex flex-col md:flex-row gap-2 justify-between relative">
    <div class="grow">
      <DsfrInput
        v-if="isEditingDescription"
        v-model="descriptionRef"
        label="Description du groupe"
        :disabled="mylevel < 20"
        hint="Une description aide les autres utilisateurs à comprendre l'objectif du groupe."
        type="textarea"
        :rows="3"
        is-textarea
        @blur="editDescription"
      />
      <div v-else>
        <span
          v-if="group.description?.trim()"
          style="white-space: pre;"
        >{{ group.description.trim() }}</span>
        <span
          v-else
          class="fr-text--italic"
        >Aucune description fournie.</span>
      </div>
      <DsfrButton
        v-if="mylevel >= 30"
        tertiary
        class="fr-mt-2w"
        icon="ri-edit-line"
        label="Modifier la description"
        @click="isEditingDescription = true; descriptionRef = group.description || ''"
      />
    </div>
  </div>
</template>

<style scoped>
.dropdown-menu {
  right: 0;
  background: var(--background-alt-grey);
  flex-direction: column;
  justify-content: stretch;
}
</style>
