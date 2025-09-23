import { getkcClient } from './keycloak.js'
import * as db from './pg.js'
import type { AttributeRow, UserRow } from './types.js'
import type { Attributes } from './utils.js'
import { mergeUniqueGroupAttributes } from './utils.js'

const INVITE_ATTRIBUTE = 'invite'
const OWNER_ATTRIBUTE = 'owner'
export interface GroupSearchResult {
  id: string
  name: string
  attributes: Attributes
}
export interface GroupDetails extends GroupSearchResult {
  members: UserRow[]
  invites: UserRow[]
  attributes: Attributes
}

export async function searchGroups(query: string, skip: number, limit: number): Promise<{ groups: (GroupSearchResult & { owners: UserRow[] })[], total: number }> {
  const groupsResult = await db.query(
    'SELECT * FROM keycloak_group WHERE name ILIKE $1 AND realm_id = $2 LIMIT $3 OFFSET $4',
    [`%${query}%`, await db.getRealmId(), limit, skip],
  )

  const owners = await db.query(
    `SELECT u.id, u.email, u.username, u.first_name, u.last_name, ga.group_id 
     FROM user_entity u
     JOIN group_attribute ga ON u.id = ga.value
     WHERE ga.name = $1 AND ga.group_id = ANY($2::text[])`,
    [OWNER_ATTRIBUTE, groupsResult.rows.map((g: GroupSearchResult) => g.id)],
  )

  const groups = groupsResult.rows.map((group: GroupSearchResult) => ({
    id: group.id,
    name: group.name,
    attributes: {},
    owners: owners.rows.filter((owner: { group_id: string }) => owner.group_id === group.id),
  }))
  const total = await db.query(
    'SELECT count(*) FROM keycloak_group WHERE name ILIKE $1 AND realm_id = $2',
    [`%${query}%`, await db.getRealmId()],
  )
  return { groups, total: total.rows[0].count }
}

export async function getGroupAttributesAndMembers(groupId: string): Promise<{ attributes: AttributeRow[], members: UserRow[], invites: UserRow[] }> {
  const attributes = await db.query(
    `SELECT ga.name, ga.value, ga.group_id
     FROM group_attribute ga
     WHERE ga.group_id = $1`,
    [groupId],
  )

  const members = await db.query(
    `SELECT u.username, u.email, u.id, u.first_name, u.last_name
     FROM user_group_membership ugm
     JOIN user_entity u ON u.id = ugm.user_id
     WHERE ugm.group_id = $1`,
    [groupId],
  )

  const invites = await getPendingInvitesForGroup(groupId)
  return { attributes: attributes.rows, members: members.rows, invites }
}

export async function searchGroupsByAttributes(name: string, value: string): Promise<GroupSearchResult[]> {
  const groups = await db.query(
    `SELECT g.id, g.name, ga.name AS attribute_name, ga.value AS attribute_value
     FROM keycloak_group g
     LEFT JOIN group_attribute ga ON g.id = ga.group_id
     WHERE (ga.name = $1 AND ga.value = $2) AND g.realm_id = $3`,
    [name, value, await db.getRealmId()],
  )
  return groups.rows
}

export async function createGroup(name: string): Promise<GroupSearchResult> {
  const kcClient = await getkcClient()
  const result = await kcClient.groups.create({ name })

  return {
    id: result.id,
    name,
    attributes: { owner: [], invite: [] },
  }
}

export async function getAttribute(groupId: string, name: string): Promise<string[] | null> {
  const kcClient = await getkcClient()
  const group = await kcClient.groups.findOne({ id: groupId })
  if (!group) {
    throw new Error('Group not found')
  }
  return group.attributes?.[name] || null
}

export async function setAttribute(groupId: string, name: string, values: string[]): Promise<void> {
  const kcClient = await getkcClient()
  const group = await kcClient.groups.findOne({ id: groupId })
  if (!group) {
    throw new Error('Group not found')
  }

  await kcClient.groups.update({ id: groupId }, {
    name: group.name,
    attributes: {
      ...group.attributes,
      [name]: values,
    },
  })
}

export async function getPendingInvitesForGroup(groupId: string): Promise<UserRow[]> {
  const users = await db.query(
    `SELECT u.id, u.email, u.username, u.first_name, u.last_name
     FROM user_entity u
     JOIN group_attribute ga ON ga.value = u.id
     WHERE ga.group_id = $1 AND ga.name = $2`,
    [groupId, INVITE_ATTRIBUTE],
  )
  return users.rows
}
export async function listGroupsForUser(userId: string): Promise<{ invited: GroupSearchResult[], joined: GroupSearchResult[] }> {
  const realmId = await db.getRealmId()
  const groups = await db.query(
    `SELECT g.id, g.name
     FROM keycloak_group g
     JOIN user_group_membership ugm ON g.id = ugm.group_id
     WHERE ugm.user_id = $1 AND g.realm_id = $2`,
    [userId, realmId],
  )
  const invited = await searchGroupsByAttributes(INVITE_ATTRIBUTE, userId)

  return { invited, joined: groups.rows }
}

export async function getGroupDetails(groupId: string): Promise<GroupDetails | null> {
  const groupRes = await db.query(
    `SELECT g.id, g.name
     FROM keycloak_group g
     WHERE g.id = $1`,
    [groupId],
  )
  if (groupRes.rowCount === 0) {
    return null
  }
  const group = groupRes.rows[0]
  const { attributes, members, invites } = await getGroupAttributesAndMembers(groupId)
  return {
    id: group.id,
    name: group.name,
    attributes: mergeUniqueGroupAttributes(attributes),
    members,
    invites,
  }
}

export async function deleteGroup(id: string): Promise<void> {
  const kcClient = await getkcClient()
  await kcClient.groups.del({ id })
}

export async function addMemberToGroup(userId: string, groupId: string): Promise<void> {
  const kcClient = await getkcClient()
  await kcClient.users.addToGroup({
    id: userId,
    groupId,
  })
}

export async function removeMemberFromGroup(userId: string, groupId: string): Promise<void> {
  const kcClient = await getkcClient()
  await kcClient.users.delFromGroup({
    id: userId,
    groupId,
  })
}

export async function addOwnerToGroup(userId: string, groupId: string): Promise<void> {
  const admins = await getAttribute(groupId, OWNER_ATTRIBUTE) || []
  if (!admins.includes(userId)) {
    admins.push(userId)
    await setAttribute(groupId, OWNER_ATTRIBUTE, admins)
  }
}

export async function removeOwnerFromGroup(userId: string, groupId: string): Promise<void> {
  const admins = await getAttribute(groupId, OWNER_ATTRIBUTE) || []
  const index = admins.indexOf(userId)
  if (index !== -1) {
    admins.splice(index, 1)
    await setAttribute(groupId, OWNER_ATTRIBUTE, admins)
  }
}

export async function inviteMemberToGroup(userId: string, groupId: string): Promise<void> {
  const invites = await getAttribute(groupId, INVITE_ATTRIBUTE) || []

  if (!invites.includes(userId)) {
    invites.push(userId)
    await setAttribute(groupId, INVITE_ATTRIBUTE, invites)
  }
}

export async function uninviteMemberFromGroup(userId: string, groupId: string): Promise<void> {
  const invites = await getAttribute(groupId, INVITE_ATTRIBUTE) || []
  const index = invites.indexOf(userId)
  if (index !== -1) {
    invites.splice(index, 1)
    await setAttribute(groupId, INVITE_ATTRIBUTE, invites)
  }
}

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  const users = await db.query(
    `SELECT u.username, u.email, u.id, u.first_name, u.last_name
     FROM user_entity u
     WHERE u.email = $1`,
    [email],
  )
  return users.rows[0] || null
}
