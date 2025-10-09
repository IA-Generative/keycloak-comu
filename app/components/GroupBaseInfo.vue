<script setup lang="ts">
import { DsfrButton, DsfrInput, VIcon } from '@gouvminint/vue-dsfr'
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
const expiresInLessThan30Days = computed(() => {
  if (props.group?.expiresAt) {
    const expiresAt = new Date(Number(props.group.expiresAt))
    const now = new Date()
    const diffInMs = expiresAt.getTime() - now.getTime()
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24)
    return diffInDays < 30
  }
  return false
})

const displayRenewOptions = ref(false)

function renewGroup(days: number = 12) {
  if (props.group) {
    const newExpiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).valueOf()
    console.log(newExpiresAt)

    console.log(`Renewing group ${props.group.id} to ${newExpiresAt} (${new Date(Number(newExpiresAt)).toLocaleDateString()})`)

    fetcher('/api/v1/groups/renew', {
      method: 'post',
      body: { groupId: props.group.id, timestamp: String(newExpiresAt) },
    }).finally(() => {
      emit('refresh')
      displayRenewOptions.value = false
    })
  }
}
const renewDaysOptions = [
  { label: '3 mois', days: 90 },
  { label: '6 mois', days: 180 },
  { label: '1 an', days: 365 },
]

const wrapper = ref<HTMLElement | null>(null)
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
    <div
      class="relative flex flex-col items-center gap-2"
    >
      <div
        title="Le groupe expire dans moins de 30 jours. Pensez à le renouveler."
      >
        <strong>Expire le : </strong>
        <span v-if="group.expiresAt">{{ new Date(Number(group.expiresAt)).toLocaleDateString() }}</span>
        <VIcon
          v-if="expiresInLessThan30Days"
          :class="{ 'text-red-600': expiresInLessThan30Days }"
          name="ri-error-warning-line"
          class="inline align-middle ml-1"
        />
      </div>
      <div v-if="mylevel >= 20">
        <DsfrButton
          v-if="expiresInLessThan30Days"
          tertiary
          icon="ri-refresh-line"
          label="Renouveler"
          @click="() => renewGroup(31)"
        />
        <!-- DropDownButton -->
        <DsfrButton
          v-if="expiresInLessThan30Days"
          ref="wrapper"
          tertiary
          icon="ri-arrow-down-s-line"
          @click="displayRenewOptions = !displayRenewOptions"
        />
        <div
          v-if="displayRenewOptions"
          class="flex flex-col z-10 dropdown-menu absolute"
        >
          <div
            v-for="option in renewDaysOptions"
            :key=" option.days"
            class="flex stretch"
          >
            <DsfrButton
              tertiary
              class="grow"
              :label="option.label"
              @click="renewGroup(option.days)"
            />
          </div>
        </div>
      </div>
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
