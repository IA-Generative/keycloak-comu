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
