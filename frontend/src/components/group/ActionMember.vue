<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { DsfrButton, DsfrModal, DsfrSelect } from '@gouvminint/vue-dsfr'
import * as backend from '@/composables/useBackend'
import { useGroupStore } from '@/stores/group'
import { getUserId } from '@/composables/useOidc'
import { MembershipLevelNames } from '@/shared/MembershipLevel'
import type { GroupMemberDto, GroupDtoType } from '@/shared/types'

const props = defineProps<{
  member: GroupMemberDto
  mylevel: number
  group: GroupDtoType
}>()

const currentUserId = ref<string | null>(null)
getUserId().then(id => currentUserId.value = id)

const itsMe = computed(() => currentUserId.value === props.member.id)
const groupStore = useGroupStore()
const dialogOpened = ref(false)

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
    await backend.editMembership(props.group.id, userId, newLevel)
  } finally {
    nextTick()
    await groupStore.refreshGroup()

    dialogOpened.value = false
    isLoading.value = false
  }
}

const targetMemberLevel = computed(() => props.member.membershipLevel)
const options = computed(() => [
  { value: 10, text: MembershipLevelNames[10] as string },
  { value: 20, text: MembershipLevelNames[20] as string },
  { value: 30, text: MembershipLevelNames[30] as string },
].filter(option => props.mylevel >= 30 || option.value <= props.mylevel))
</script>

<template>
  <div v-if="mylevel >= 20">
    <DsfrButton secondary size="small" @click="openDialog">
      <span class="font-black">⋮</span>
    </DsfrButton>
    <DsfrModal v-if="dialogOpened" v-model:opened="dialogOpened" title="" @close="dialogOpened = false">
      <template #default>
        <DsfrSelect v-if="mylevel >= 20 && options.length > 0" v-model="targetMemberLevel"
          :label="`Rôle de ${(`${member.first_name} ${member.last_name}`) || member.email}`" :disabled="isLoading"
          :options="options" @update:model-value="(v: number | string) => changeMemberLevel(member.id, Number(v))" />
        <DsfrButton v-if="itsMe" class="fr-mt-4w self-end" type="button" label="Quitter le groupe"
          @click="groupStore.leaveGroup()" />
        <DsfrButton v-else class="fr-mt-4w self-end" type="button" label="Retirer du groupe"
          @click="groupStore.kickMember(member.id, group.id); dialogOpened = false" />
      </template>
    </DsfrModal>
  </div>
</template>
