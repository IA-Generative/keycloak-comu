import { client } from '@/client/client.gen'
import * as api from '@/client/sdk.gen'
import { getBearerToken } from './useOidc'

// The generated client types will come from the OpenAPI spec.
// Before generation, we define minimal placeholders for build safety.

client.setConfig({
  baseUrl: '/api',
})

client.interceptors.request.use(async (config) => {
  if (config.url.endsWith('/auth/config')) {
    return config
  }
  const token = await getBearerToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

// ── Auth ────────────────────────────────────────────────────────────────

export interface AuthConfig {
  issuer_url: string
  authorization_url: string
  token_url: string
  logout_url: string
  client_id: string
}

export async function getAuthConfig(): Promise<AuthConfig> {
  const response = await api.authConfig()
  if (!response.data) throw new Error('Failed to fetch auth config')
  return response.data as AuthConfig
}

export async function getMe() {
  const response = await api.me()
  if (!response.data) throw new Error('Failed to fetch user info')
  return response.data
}

// ── Groups ──────────────────────────────────────────────────────────────

export async function listGroups() {
  const response = await api.listGroups()
  if (!response.data) throw new Error('Failed to list groups')
  return response.data
}

export async function getGroup(groupId: string) {
  const response = await api.getGroup({ path: { groupId } })
  if (!response.data) throw new Error('Failed to fetch group')
  return response.data
}

export async function createGroup(name: string, description?: string) {
  const response = await api.createGroup({ body: { name, description: description ?? '' } })
  if (!response.data) throw new Error('Failed to create group')
  return response.data
}

export async function editGroup(groupId: string, description: string) {
  await api.editGroup({ body: { groupId, description } })
}

export async function deleteGroup(groupId: string) {
  await api.deleteGroup({ body: { groupId } })
}

export async function searchGroups(search: string, page: number, pageSize: number, exact?: boolean) {
  const response = await api.searchGroups({ body: { search, page, pageSize, exact } })
  if (!response.data) throw new Error('Failed to search groups')
  return response.data
}

// ── Invites ─────────────────────────────────────────────────────────────

export async function createInvite(groupId: string, email: string) {
  await api.createInvite({ body: { groupId, email } })
}

export async function acceptInvite(groupId: string) {
  await api.acceptInvite({ body: { groupId } })
}

export async function declineInvite(groupId: string) {
  await api.declineInvite({ body: { groupId } })
}

export async function cancelInvite(groupId: string, userId: string) {
  await api.cancelInvite({ body: { groupId, userId } })
}

// ── Requests ────────────────────────────────────────────────────────────

export async function createJoinRequest(groupId: string) {
  await api.createJoinRequest({ body: { groupId } })
}

export async function acceptJoinRequest(groupId: string, userId: string) {
  await api.acceptJoinRequest({ body: { groupId, userId } })
}

export async function declineJoinRequest(groupId: string, userId: string) {
  await api.declineJoinRequest({ body: { groupId, userId } })
}

export async function cancelJoinRequest(groupId: string) {
  await api.cancelJoinRequest({ body: { groupId } })
}

// ── Membership ──────────────────────────────────────────────────────────

export async function editMembership(groupId: string, userId: string, level: number) {
  await api.editMembership({ body: { groupId, userId, level } })
}

export async function kickMember(groupId: string, userId: string) {
  await api.kickMember({ body: { groupId, userId } })
}

export async function leaveGroup(groupId: string) {
  await api.leaveGroup({ body: { groupId } })
}

// ── Teams ───────────────────────────────────────────────────────────────

export async function editTeam(parentId: string, name: string, userIds: string[]) {
  await api.editTeam({ body: { parentId, name, userIds } })
}

export async function deleteTeam(parentId: string, teamId: string) {
  await api.deleteTeam({ body: { parentId, teamId } })
}

// ── Settings ────────────────────────────────────────────────────────────

export async function updateGroupSettings(groupId: string, autoAcceptRequests?: boolean) {
  await api.updateGroupSettings({ body: { groupId, autoAcceptRequests } })
}

export async function updateGroupLinks(groupId: string, links: string[]) {
  await api.updateGroupLinks({ body: { groupId, links } })
}

export async function updateGroupTos(groupId: string, tos: string) {
  await api.updateGroupTos({ body: { groupId, tos } })
}

// ── Users ───────────────────────────────────────────────────────────────

export async function searchUsers(search: string, excludeGroupId?: string) {
  const response = await api.searchUsers({ body: { search, excludeGroupId } })
  if (!response.data) throw new Error('Failed to search users')
  return response.data.users
}

export async function getUserSettings() {
  const response = await api.getUserSettings()
  if (!response.data) throw new Error('Failed to get user settings')
  return response.data
}

export async function updateUserSettings(settings: Record<string, unknown>) {
  await api.updateUserSettings({ body: settings as never })
}

// ── Notifications ───────────────────────────────────────────────────────

export async function getNotifications() {
  const response = await api.getNotifications()
  if (!response.data) throw new Error('Failed to get notifications')
  return response.data
}
