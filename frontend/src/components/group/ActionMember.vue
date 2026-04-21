<script setup lang="ts">
// Business Logic here: backend/internal/groups/README.md
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
const ownerCount = computed(() => props.group.members?.filter(member => member.membershipLevel === 30).length ?? 0)

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

const targetMemberLevel = computed(() => String(props.member.membershipLevel))
const availableRoleOptions = computed< { value: number, text: string }[] | null>(() => {
  const baseOptions = [
    { value: 10, text: MembershipLevelNames[10] as string },
    { value: 20, text: MembershipLevelNames[20] as string },
    { value: 30, text: MembershipLevelNames[30] as string },
  ]

  if (props.mylevel < 20) {
    return null
  }

  if (props.mylevel >= 30) {
    if (props.member.membershipLevel === 30 && ownerCount.value <= 1) {
      return baseOptions.filter(option => option.value === 30)
    }
    return baseOptions
  }

  if (itsMe.value) {
    return baseOptions.filter(option => option.value <= props.mylevel)
  }

  if (props.member.membershipLevel >= props.mylevel) {
    return null
  }

  return baseOptions.filter(option => option.value < props.mylevel)
})

const canKickMember = computed(() => !itsMe.value && props.mylevel >= 20 && props.member.membershipLevel < props.mylevel)
const displayName = computed(() => {
  const fullName = `${props.member.first_name || ''} ${props.member.last_name || ''}`.trim()
  return fullName || props.member.email
})

const canLeaveGroup = computed(() => {
  if (itsMe.value) {
    // Owner can leave only if there's another owner
    if (props.member.membershipLevel === 30) {
      return ownerCount.value > 1
    }
    return true
  }
  return false
})
</script>

<template>
  <div v-if="mylevel >= 20">
    <DsfrButton secondary size="small" @click="openDialog">
      <span class="font-black">⋮</span>
    </DsfrButton>
    <DsfrModal v-if="dialogOpened" v-model:opened="dialogOpened" title="" @close="dialogOpened = false">
      <template #default>
        <DsfrSelect v-if="availableRoleOptions && availableRoleOptions.length > 1" :model-value="targetMemberLevel"
          :label="`Rôle de ${displayName}`" :disabled="isLoading" :options="availableRoleOptions"
          @update:model-value="(v: number | string) => changeMemberLevel(member.id, Number(v))" />
        <DsfrButton v-if="itsMe" class="fr-mt-4w self-end" type="button" label="Quitter le groupe"
          @click="groupStore.leaveGroup()" 
          :disabled="!canLeaveGroup"
          />
        <DsfrButton v-else-if="canKickMember" class="fr-mt-4w self-end" type="button" label="Retirer du groupe"
          @click="groupStore.kickMember(member.id, group.id); dialogOpened = false" />
      </template>
    </DsfrModal>
  </div>
</template>
