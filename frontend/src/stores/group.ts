import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { useRouter } from 'vue-router'
import * as backend from '@/composables/useBackend'
import { getUserId } from '@/composables/useOidc'
import type { Group } from '@/client/types.gen'

export const useGroupStore = defineStore('group', () => {
  const router = useRouter()
  const group = ref<Group | null>(null)
  const currentUserId = ref<string | null>(null)

  async function ensureUserId() {
    if (!currentUserId.value) {
      currentUserId.value = await getUserId()
    }
  }

  const mylevel = computed(() => {
    if (!group.value || !currentUserId.value) return 0
    const me = group.value.members?.find((m) => m.id === currentUserId.value)
    return me?.membershipLevel ?? 0
  })

  async function fetchGroup(id: string) {
    await ensureUserId()
    group.value = await backend.getGroup(id)
    return group.value
  }

  async function refreshGroup() {
    if (group.value?.id) {
      group.value = await backend.getGroup(group.value.id)
    }
  }

  async function createRequest(groupId: string) {
    await backend.createJoinRequest(groupId)
    await refreshGroup()
  }

  async function acceptInvite(groupId: string) {
    await backend.acceptInvite(groupId)
    await refreshGroup()
  }

  async function declineInvite(groupId: string) {
    await backend.declineInvite(groupId)
    await refreshGroup()
  }

  async function acceptRequest(groupId: string, userId: string) {
    await backend.acceptJoinRequest(groupId, userId)
    await refreshGroup()
  }

  async function declineRequest(groupId: string, userId: string) {
    await backend.declineJoinRequest(groupId, userId)
    await refreshGroup()
  }

  async function cancelRequest(groupId: string, userId: string) {
    await backend.cancelJoinRequest(groupId)
    void userId
    await refreshGroup()
  }

  async function kickMember(userId: string, groupId: string) {
    await backend.kickMember(groupId, userId)
    await refreshGroup()
  }

  async function leaveGroup() {
    if (!group.value?.id) return
    await backend.leaveGroup(group.value.id)
    router.push('/')
  }

  return {
    group,
    mylevel,
    fetchGroup,
    refreshGroup,
    createRequest,
    acceptInvite,
    declineInvite,
    acceptRequest,
    declineRequest,
    cancelRequest,
    kickMember,
    leaveGroup,
  }
})
