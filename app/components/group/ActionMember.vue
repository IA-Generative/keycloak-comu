<script setup lang="ts">
import { DsfrButton, DsfrModal, DsfrSelect } from '@gouvminint/vue-dsfr'
import fetcher from '~/composables/useApi.js'

const props = defineProps<{
  member: {
    id: string
    email: string
    first_name?: string
    last_name?: string
    membershipLevel: number
  }
  mylevel: number
  group: GroupDtoType
}>()

const emits = defineEmits<{
  (e: 'refresh'): void
}>()

const dialogOpened = ref(false)

async function kickMember(userId: string) {
  await fetcher('/api/v1/groups/membership/kick', {
    method: 'post',
    body: { groupId: props.group.id, userId },
  })
  emits('refresh')
  dialogOpened.value = false
}
function openDialog() {
  dialogOpened.value = true
}
const isLoading = ref(false)

async function changeMemberLevel(userId: string, newLevel: number) {
  if (isLoading.value) return
  if (newLevel === props.member.membershipLevel) {
    return
  }

  try {
    isLoading.value = true
    await fetcher('/api/v1/groups/membership/edit', {
      method: 'post',
      body: { groupId: props.group.id, userId, level: String(newLevel) },
    })
  } finally {
    nextTick()
    emits('refresh')
    dialogOpened.value = false
    isLoading.value = false
  }
}

const targetMemberLevel = computed(() => props.member.membershipLevel)
const options = computed(() => [
  { value: 10, text: 'Membre' },
  { value: 20, text: 'Administrateur' },
  { value: 30, text: 'Propriétaire' },
].filter(option => props.mylevel >= 30 || option.value <= props.mylevel))
</script>

<template>
  <div v-if="mylevel >= 20">
    <DsfrButton
      secondary
      size="small"
      @click="openDialog"
    >
      <span class="font-black">⋮</span>
    </DsfrButton>
    <DsfrModal
      v-if="dialogOpened"
      v-model:opened="dialogOpened"
      title=""
      @close="dialogOpened = false"
    >
      <template #default>
        <DsfrSelect
          v-if="mylevel >= 20 && options.length > 0"
          v-model="targetMemberLevel"
          :label="`Rôle de ${(`${member.first_name} ${member.last_name}`) || member.email}`"
          :disabled="isLoading"
          :options="options"
          @update:model-value="(v: number | string) => changeMemberLevel(member.id, Number(v))"
        />
        <DsfrButton
          v-if="$keycloak?.tokenParsed?.sub !== member.id"
          class="fr-mt-8w self-end"
          type="button"
          label="Retirer du groupe"
          @click="kickMember(member.id); dialogOpened = false"
        />
      </template>
    </DsfrModal>
  </div>
</template>
