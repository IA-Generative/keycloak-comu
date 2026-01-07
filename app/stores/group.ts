import { defineStore } from 'pinia'
import fetcher from '~/composables/useApi.js'

export const useGroupStore = defineStore('group', () => {
  const group = ref<GroupDtoType | null>(null)

  async function fetchGroup(id: string) {
    group.value = await fetcher(`/api/v1/groups/${id}`)
    return group.value
  }

  const { $keycloak } = useNuxtApp()
  const userId = computed(() => $keycloak?.tokenParsed?.sub as string)

  const mylevel = computed(() => group.value?.members.find(m => m.id === userId.value)?.membershipLevel || 0)

  watch(
    () => $keycloak?.tokenParsed,
    () => {
      // reset group when user changes (login/logout)
      group.value = null
    },
  )

  const route = useRoute()

  watch(route, async (newRoute, oldRoute) => {
    console.log(newRoute)

    if (newRoute.params.id !== oldRoute.params.id) {
      group.value = await fetchGroup(newRoute.params.id as string)
    }
  })

  async function refreshGroup() {
    if (group.value) {
      group.value = await fetchGroup(group.value.id)
    }
  }
  async function createRequest(groupId: string) {
    await fetcher('/api/v1/groups/requests/create', {
      method: 'post',
      body: { groupId },
    })
    await refreshGroup()
  }

  async function acceptInvite(groupId: string) {
    await fetcher('/api/v1/groups/invites/accept', {
      method: 'post',
      body: { groupId },
    })
    await refreshGroup()
  }

  async function declineInvite(groupId: string) {
    await fetcher('/api/v1/groups/invites/decline', {
      method: 'post',
      body: { groupId },
    })
    await refreshGroup()
  }

  async function acceptRequest(groupId: string, userId: string) {
    await fetcher('/api/v1/groups/requests/accept', {
      method: 'post',
      body: { groupId, userId },
    })
    await refreshGroup()
  }

  async function declineRequest(groupId: string, userId: string) {
    await fetcher('/api/v1/groups/requests/decline', {
      method: 'post',
      body: {
        groupId,
        userId,
      },
    })
    await refreshGroup()
  }

  async function cancelRequest(groupId: string, userId: string) {
    await fetcher('/api/v1/groups/requests/cancel', {
      method: 'post',
      body: {
        groupId,
        userId,
      },
    })
    await refreshGroup()
  }

  async function kickMember(userId: string, groupId: string) {
    await fetcher('/api/v1/groups/membership/kick', {
      method: 'post',
      body: { groupId, userId },
    })
    await refreshGroup()
  }

  async function leaveGroup() {
    const { $router } = useNuxtApp()
    await fetcher('/api/v1/groups/membership/leave', {
      method: 'post',
      body: { groupId: group.value?.id },
    })
    $router.push('/')
  }
  return {
    group,
    fetchGroup,
    refreshGroup,
    mylevel,
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
