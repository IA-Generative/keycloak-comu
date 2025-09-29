import fetcher from './useApi.js'

export async function acceptInvite(groupId: string) {
  await fetcher('/api/v1/groups/invites/accept', {
    method: 'post',
    body: { groupId },
  })
}

export async function declineInvite(groupId: string) {
  await fetcher('/api/v1/groups/invites/decline', {
    method: 'post',
    body: { groupId },
  })
}

export async function createRequest(groupId: string) {
  await fetcher('/api/v1/groups/requests/create', {
    method: 'post',
    body: { groupId },
  })
}

export async function acceptRequest(groupId: string, userId: string) {
  await fetcher('/api/v1/groups/requests/accept', {
    method: 'post',
    body: { groupId, userId },
  })
}

export async function declineRequest(groupId: string, userId: string) {
  await fetcher('/api/v1/groups/requests/decline', {
    method: 'post',
    body: {
      groupId,
      userId,
    },
  })
}

export async function cancelRequest(groupId: string, userId: string) {
  await fetcher('/api/v1/groups/requests/cancel', {
    method: 'post',
    body: {
      groupId,
      userId,
    },
  })
}
