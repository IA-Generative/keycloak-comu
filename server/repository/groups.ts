import { getRootGroup, kcClient } from './keycloak.js'
import { LEVEL } from '../guards/group.js'
import * as db from './pg.js'
import type { AttributeRow, UserRow } from './types.js'
import type { Attributes } from './utils.js'
import { mergeUniqueGroupAttributes } from './utils.js'
import type { TeamsDtoType } from '~~/shared/types/team.js'

export const INVITE_ATTRIBUTE = 'invite'
export const REQUEST_ATTRIBUTE = 'request'
export const OWNER_ATTRIBUTE = 'owner'
export const ADMIN_ATTRIBUTE = 'admin'

export interface GroupSearchResult {
  id: string
  name: string
  attributes: Attributes
}
export interface GroupDetails extends GroupSearchResult {
  members: UserRow[]
  invites: UserRow[]
  requests: UserRow[]
  attributes: Attributes
  teams: TeamsDtoType
  description: string
}

interface SearchParams {
  query: string
  limit: number
  skip: number
  exact?: boolean
}

const runtimeConfig = useRuntimeConfig()
const realmName = runtimeConfig.public.keycloak.realm

export async function searchGroups({ query, limit, skip, exact = false }: SearchParams): Promise<{ groups: (GroupSearchResult & { owners: UserRow[] })[], total: number, next: boolean }> {
  const groupsResult = exact
    ? await db.query(
        'SELECT * FROM keycloak_group WHERE name ILIKE $1 AND realm_id = $2 AND parent_group = $5 LIMIT $3 OFFSET $4',
        [query, await db.getRealmId(), limit, skip, getRootGroup().id],
      )
    : await db.searchFn(query, limit, skip)

  const owners = await db.query(
    `SELECT u.id, u.email, u.username, u.first_name, u.last_name, ga.group_id 
     FROM user_entity u
     JOIN group_attribute ga ON u.id = ga.value
     WHERE ga.name = $1 AND ga.group_id = ANY($2::text[])`,
    [OWNER_ATTRIBUTE, groupsResult.rows.map((g: GroupSearchResult) => g.id)],
  )

  const groups = groupsResult.rows
    .slice(0, limit)
    .map((group: GroupSearchResult) => ({
      id: group.id,
      name: group.name,
      attributes: {},
      owners: owners.rows.filter((owner: { group_id: string }) => owner.group_id === group.id),
    }))
  const total = await db.query(
    'SELECT count(*) FROM keycloak_group WHERE name ILIKE $1 AND realm_id = $2 AND parent_group = $3',
    [`%${query}%`, await db.getRealmId(), getRootGroup().id],
  )
  return { groups, total: total.rows[0].count, next: groupsResult.rows.length > limit }
}

// not exported cause no check on root group hierarchy
async function getGroupAttributesAndMembers(groupId: string): Promise<{ attributes: AttributeRow[], members: UserRow[], invites: UserRow[], requests: UserRow[] }> {
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
  const requests = await getPendingRequestsForGroup(groupId)
  return { attributes: attributes.rows, members: members.rows, invites, requests }
}

// not exported cause no check on root group hierarchy
async function searchGroupsByAttributes(name: string, value: string): Promise<GroupSearchResult[]> {
  const groups = await db.query(
    `SELECT g.id, g.name, g.description, ga.name AS attribute_name, ga.value AS attribute_value
     FROM keycloak_group g
     LEFT JOIN group_attribute ga ON g.id = ga.group_id
     WHERE (ga.name = $1 AND ga.value = $2) AND g.realm_id = $3`,
    [name, value, await db.getRealmId()],
  )
  return groups.rows
}

export async function getGroupByName(name: string): Promise<GroupSearchResult | null> {
  const groups = await db.query(
    `SELECT g.id, g.name, g.description
     FROM keycloak_group g
     WHERE g.name ILIKE $1 AND g.realm_id = $2 AND parent_group = $3`,
    [name, await db.getRealmId(), getRootGroup().id],
  )
  if (groups.rows.length === 0) {
    return null
  }
  return { ...groups.rows[0], attributes: {} }
}

// You can specify a parent id to create a team inside a group
export async function createGroup(name: string, parentId?: string): Promise<GroupSearchResult> {
  const parentGroupId = parentId ?? getRootGroup().id
  const result = parentGroupId !== ' '
    ? await kcClient.groups.createChildGroup({
        id: parentGroupId,
        realm: realmName,
      }, { name })
    : await kcClient.groups.create({
        name,
        realm: realmName,
      })

  return {
    id: result.id,
    name,
    attributes: { owner: [], invite: [], request: [], admin: [], extras: {} },
  }
}

// You can specify a parent id to create a team inside a group
export async function editGroup(groupId: string, description: string, name: string): Promise<void> {
  return kcClient.groups.update({
    id: groupId,
    realm: realmName,
  }, { description, name })
}

// not exported cause no check on root group hierarchy
async function getAttribute(groupId: string, name: string): Promise<string[]> {
  const group = await kcClient.groups.findOne({
    id: groupId,
    realm: realmName,
  })
  if (!group) {
    throw new Error('Group not found')
  }
  return group.attributes?.[name] || []
}

// not exported cause no check on root group hierarchy
async function setAttribute(groupId: string, name: string, values: string[]): Promise<void> {
  const group = await kcClient.groups.findOne({
    id: groupId,
    realm: realmName,
  })
  if (!group) {
    throw new Error('Group not found')
  }

  await kcClient.groups.update({ id: groupId }, {
    name: group.name,
    description: group.description,
    attributes: {
      ...group.attributes,
      [name]: values,
    },
  })
}

// not exported cause no check on root group hierarchy
async function getPendingInvitesForGroup(groupId: string): Promise<UserRow[]> {
  const users = await db.query(
    `SELECT u.id, u.email, u.username, u.first_name, u.last_name
     FROM user_entity u
     JOIN group_attribute ga ON ga.value = u.id
     WHERE ga.group_id = $1 AND ga.name = $2`,
    [groupId, INVITE_ATTRIBUTE],
  )
  return users.rows
}

// not exported cause no check on root group hierarchy
async function getPendingRequestsForGroup(groupId: string): Promise<UserRow[]> {
  const users = await db.query(
    `SELECT u.id, u.email, u.username, u.first_name, u.last_name
     FROM user_entity u
     JOIN group_attribute ga ON ga.value = u.id
     WHERE ga.group_id = $1 AND ga.name = $2`,
    [groupId, REQUEST_ATTRIBUTE],
  )
  return users.rows
}

export async function listGroupsForUser(userId: string): Promise<{ invited: GroupSearchResult[], joined: GroupSearchResult[], requested: GroupSearchResult[] }> {
  const realmId = await db.getRealmId()
  const groups = await db.query(
    `SELECT g.id, g.name, g.description
     FROM keycloak_group g
     JOIN user_group_membership ugm ON g.id = ugm.group_id
     WHERE ugm.user_id = $1 AND g.realm_id = $2 AND g.parent_group = $3`,
    [userId, realmId, getRootGroup().id],
  )
  const invited = await searchGroupsByAttributes(INVITE_ATTRIBUTE, userId)
  const requested = await searchGroupsByAttributes(REQUEST_ATTRIBUTE, userId)

  return { invited, joined: groups.rows, requested }
}

async function getTeams(id: string): Promise<TeamsDtoType> {
  const teamsRes = await db.query(
    `SELECT g.name, g.id, ugm.user_id
     FROM keycloak_group g
     LEFT JOIN user_group_membership ugm ON g.id = ugm.group_id
     WHERE g.parent_group = $1 AND g.realm_id = $2`,
    [id, await db.getRealmId()],
  ) as { rows: { id: string, name: string, user_id: string }[] }

  return teamsRes.rows.reduce<TeamsDtoType>((acc, row) => {
    if (!acc.find(sg => sg.name === row.name)) {
      acc.push({ id: row.id, name: row.name, members: [] })
    }
    const team = acc.find(sg => sg.name === row.name)
    if (team && row.user_id && !team.members.includes(row.user_id)) {
      team.members.push(row.user_id)
    }
    return acc
  }, [] as TeamsDtoType)
}
export async function getGroupDetails(groupId: string): Promise<GroupDetails | null> {
  const groupRes = await db.query(
    `SELECT g.id, g.name, g.description
     FROM keycloak_group g
     WHERE g.id = $1 AND g.realm_id = $2 AND g.parent_group = $3`,
    [groupId, await db.getRealmId(), getRootGroup().id],
  ) as { rowCount: number, rows: { id: string, name: string, description: string | null }[] }
  if (groupRes.rowCount === 0) {
    return null
  }

  const group = groupRes.rows[0]
  const { attributes, members, invites, requests } = await getGroupAttributesAndMembers(groupId)
  const teams = await getTeams(groupId)

  const mergedAttributes = mergeUniqueGroupAttributes(attributes)

  return {
    description: group.description ?? '',
    id: group.id,
    name: group.name,
    attributes: mergedAttributes,
    members,
    invites,
    requests,
    teams,
  }
}

export async function deleteGroup(id: string): Promise<void> {
  const group = await kcClient.groups.findOne({ id })
  if (!group || !group.path?.startsWith(getRootGroup().path)) {
    throw new Error('Group not found')
  }
  await kcClient.groups.del({
    id,
    realm: realmName,
  })
}

export async function deleteTeam(parentId: string, name: string): Promise<void> {
  const team = await db.query(
    `SELECT * FROM keycloak_group WHERE parent_group = $1 AND name = $2`,
    [parentId, name],
  )
  if (!team.rows.length) {
    return
  }
  await kcClient.groups.del({
    id: team.rows[0].id,
    realm: realmName,
  })
}

// exported but no check on root group hierarchy, cause you're supposed to check it before
export async function addMemberToGroup(userId: string, groupId: string): Promise<string> {
  return kcClient.users.addToGroup({
    id: userId,
    groupId,
    realm: realmName,
  })
}

export async function removeMemberFromGroup(userId: string, groupId: string): Promise<string> {
  return kcClient.users.delFromGroup({
    id: userId,
    groupId,
    realm: realmName,
  })
}

// exported but no check on root group hierarchy, cause you're supposed to check it before
export async function kickMemberFromGroup(userId: string, group: GroupDetails): Promise<void> {
  const involvedTeams = await db.query(`
    SELECT g.id
    FROM keycloak_group g
    LEFT JOIN user_group_membership ugm ON g.id = ugm.group_id
    WHERE ugm.user_id = $1 AND g.parent_group = $2
    `, [userId, group.id])
  await Promise.all([involvedTeams.rows.map((row: { id: string }) => {
    return kcClient.users.delFromGroup({
      id: userId,
      groupId: row.id,
      realm: realmName,
    })
  })])

  // remove from roles if any
  await setUserLevelInGroup(userId, group.id, LEVEL.GUEST)
  await kcClient.users.delFromGroup({
    id: userId,
    groupId: group.id,
    realm: realmName,
  })
}

// exported but no check on root group hierarchy, cause you're supposed to check it before
export async function setUserLevelInGroup(userId: string, groupId: string, level: number): Promise<void> {
  const [ownerValues, adminValues] = await Promise.all([
    getAttribute(groupId, OWNER_ATTRIBUTE),
    getAttribute(groupId, ADMIN_ATTRIBUTE),
  ])
  const isOwner = ownerValues?.includes(userId)
  const isAdmin = adminValues?.includes(userId)

  // add to attributes if needed
  await Promise.all([
    level === LEVEL.OWNER && await setAttribute(groupId, OWNER_ATTRIBUTE, [...ownerValues, userId]),
    level === LEVEL.ADMIN && await setAttribute(groupId, ADMIN_ATTRIBUTE, [...adminValues, userId]),
  ])

  // remove from attributes if needed
  await Promise.all([
    (isOwner && level !== LEVEL.OWNER) && setAttribute(groupId, OWNER_ATTRIBUTE, ownerValues.filter(id => id !== userId)),
    (isAdmin && level !== LEVEL.ADMIN) && setAttribute(groupId, ADMIN_ATTRIBUTE, adminValues.filter(id => id !== userId)),
  ])
}

// exported but no check on root group hierarchy, cause you're supposed to check it before
export async function inviteMemberToGroup(userId: string, groupId: string): Promise<void> {
  const invites = await getAttribute(groupId, INVITE_ATTRIBUTE) || []

  if (!invites.includes(userId)) {
    invites.push(userId)
    await setAttribute(groupId, INVITE_ATTRIBUTE, invites)
  }
}

// exported but no check on root group hierarchy, cause you're supposed to check it before
export async function uninviteMemberFromGroup(userId: string, groupId: string): Promise<void> {
  const invites = await getAttribute(groupId, INVITE_ATTRIBUTE) || []
  const index = invites.indexOf(userId)
  if (index !== -1) {
    invites.splice(index, 1)
    await setAttribute(groupId, INVITE_ATTRIBUTE, invites)
  }
}

// exported but no check on root group hierarchy, cause you're supposed to check it before
export async function requestJoinToGroup(userId: string, groupId: string): Promise<void> {
  const requests = await getAttribute(groupId, REQUEST_ATTRIBUTE) || []

  if (!requests.includes(userId)) {
    requests.push(userId)
    await setAttribute(groupId, REQUEST_ATTRIBUTE, requests)
  }
}

// exported but no check on root group hierarchy, cause you're supposed to check it before
export async function cancelRequestJoinToGroup(userId: string, groupId: string): Promise<void> {
  const requests = await getAttribute(groupId, REQUEST_ATTRIBUTE) || []
  const index = requests.indexOf(userId)
  if (index !== -1) {
    requests.splice(index, 1)
    await setAttribute(groupId, REQUEST_ATTRIBUTE, requests)
  }
}

export async function ensureMembersForChildGroup(groupId: string, userIds: string[]): Promise<void> {
  const incomingUsers = new Set(userIds)
  const actualUsers = await db.query(`
    SELECT ugm.user_id AS id
    FROM user_group_membership ugm
    WHERE ugm.group_id = $1
  `, [groupId])
  const actualUserIds = new Set<string>(actualUsers.rows.map((row: { id: string }) => row.id))
  const exceedIds = actualUserIds.difference(incomingUsers)
  const missingIds = incomingUsers.difference(actualUserIds)

  await Promise.all([
    ...missingIds.values().map(id => addMemberToGroup(id, groupId)),
    ...exceedIds.values().map(id => removeMemberFromGroup(id, groupId)),
  ])
}

// USERS SECTION
export async function getUserByEmail(email: string): Promise<UserRow | null> {
  const users = await db.query(
    `SELECT u.username, u.email, u.id, u.first_name, u.last_name
     FROM user_entity u
     WHERE u.email = $1 AND u.realm_id = $2`,
    [email, await db.getRealmId()],
  )
  return users.rows[0] || null
}

export async function getUserById(id: string): Promise<UserRow | null> {
  const users = await db.query(
    `SELECT u.username, u.email, u.id, u.first_name, u.last_name
     FROM user_entity u
     WHERE u.id = $1 AND u.realm_id = $2`,
    [id, await db.getRealmId()],
  )
  return users.rows[0] || null
}

export async function searchUsers(options: { query: string, excludeGroupId?: string }): Promise<UserRow[]> {
  const excludedMembers: string[] = []
  if (options.excludeGroupId) {
    const groupDetails = await getGroupDetails(options.excludeGroupId)
    if (groupDetails) {
      excludedMembers.push(...groupDetails.members.map(m => m.id), ...groupDetails.invites.map(i => i.id))
    }
  }
  return (await db.searchUsersFn(options.query, 10, 0, excludedMembers)).rows
}
