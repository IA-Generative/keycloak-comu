<script setup lang="ts">
import { DsfrAlert, DsfrButton, DsfrInput, DsfrModal } from '@gouvminint/vue-dsfr'
import fetcher from '~/composables/useApi.js'
import LinkForm from './LinkForm.vue'

const groupStore = useGroupStore()
const group = computed(() => groupStore.group as GroupDtoType)

const { $keycloak } = useNuxtApp()

const userId = computed(() => $keycloak?.tokenParsed?.sub as string)

const mylevel = computed(() => group.value.members.find(m => m.id === userId.value)?.membershipLevel || 0)
const descriptionRef = ref(group.value.description)

const isEditingDescription = ref(false)
function editDescription() {
  fetcher('/api/v1/groups/edit', {
    method: 'post',
    body: { groupId: group.value.id, description: descriptionRef.value.trim() },
  }).finally(() => {
    isEditingDescription.value = false
  })
}
const isTosModalOpen = ref(false)
const isEditingTos = ref(false)
const tos = ref(group.value.tos || '')
async function saveTos() {
  await fetcher('/api/v1/groups/update-tos', {
    method: 'post',
    body: { groupId: group.value.id, tos: tos.value.trim() },
  }).finally(() => {
    isEditingTos.value = false
    groupStore.fetchGroup(group.value.id)
  })
}
const tosInput = ref<InstanceType<typeof DsfrInput> | null>(null)

const isEditingLinks = ref(false)

async function saveLinks(links: string[]) {
  await fetcher('/api/v1/groups/update-links', {
    method: 'post',
    body: { groupId: group.value.id, links },
  }).finally(() => {
    isEditingLinks.value = false
    groupStore.fetchGroup(group.value.id)
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
    <div v-if="group.tos || mylevel >= 20">
      <DsfrButton
        tertiary
        icon="ri-file-text-line"
        label="Voir les conditions d'utilisation"
        data-fr-opened="tos-modal"
        @click="isTosModalOpen = true"
      />
      <DsfrModal
        id="tos-modal"
        :opened="isTosModalOpen"
        title="Conditions d'utilisation"
        :aria-describedby="`modal-description-${group.id}`"
        @close="isTosModalOpen = false"
      >
        <p v-if="group.tos && !isEditingTos">
          {{ group.tos }}
        </p>
        <p
          v-else-if="!group.tos && !isEditingTos"
          class="fr-text--italic"
        >
          Aucune condition d'utilisation définie pour ce groupe.
        </p>
        <DsfrInput
          v-if="isEditingTos"
          ref="tosInput"
          v-model="tos"
          label="Conditions d'utilisation"
          :disabled="mylevel < 20"
          hint="Les conditions d'utilisation définissent les règles que les membres doivent accepter pour rejoindre ce groupe. Max 255 caractères."
          type="textarea"
          aria-placeholder="Exemple : En rejoignant ce groupe, vous acceptez de respecter les règles suivantes..."
          :rows="3"
          is-textarea
        />
        <DsfrButton
          v-if="mylevel >= 20 && !isEditingTos"
          tertiary
          class="fr-mt-2w"
          icon="ri-edit-line"
          label="Modifier les conditions d'utilisation"
          data-fr-opened="tos-edit-modal"
          @click="isEditingTos = true; groupStore.refreshGroup(); $nextTick(() => { tosInput?.focus() })"
        />
        <template #footer>
          <div class="flex flex-col gap-6">
            <div
              v-if="isEditingTos"
              class="flex flex-row"
            >
              <DsfrButton
                :disabled="tos.trim() === group.tos"
                label="Enregistrer"
                @click="saveTos"
              />
              <DsfrButton
                class="fr-ml-2w"
                secondary
                label="Annuler"
                @click="tos = group.tos || ''; isEditingTos = false"
              />
            </div>
            <DsfrAlert
              v-if="isEditingTos"
              type="info"
            >
              Les modifications des conditions d'utilisation n'affecteront pas les membres actuels du groupe et ne nécessiteront pas leur réapprobation. Un e-mail sera envoyé aux membres présents pour les informer des changements.
            </DsfrAlert>
          </div>
        </template>
      </DsfrModal>
    </div>
  </div>
  <div>
    <LinkForm
      @save-links="saveLinks"
    />
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
